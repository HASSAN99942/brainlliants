import { Directory, File, Paths } from 'expo-file-system';
import { cache, storage } from '../../core/storage/cache';

/**
 * Offline download store.
 *
 * expo-file-system 19 (SDK 54) replaced the old `FileSystem.downloadAsync` /
 * `FileSystem.documentDirectory` API with the `File` / `Directory` / `Paths`
 * classes (the old one now lives at `expo-file-system/legacy`). This module
 * uses the current API; `File#exists` is synchronous, so a saved path can be
 * verified without going async.
 *
 * File bytes live in <documents>/brailliants/, and the id -> path mapping lives
 * in the MMKV cache (in-memory while in Expo Go preview mode).
 */

const Q_PREFIX = 'dl_question:';
const N_PREFIX = 'dl_note:';
const DIR_NAME = 'brailliants';

export interface DownloadRecord {
  id: string;
  local_path: string;
  title: string;
  downloaded_at: string;
  meta: unknown;
}

function targetDir(): Directory {
  const dir = new Directory(Paths.document, DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

async function downloadTo(url: string, fileName: string): Promise<string> {
  const destination = new File(targetDir(), fileName);
  const saved = await File.downloadFileAsync(url, destination, { idempotent: true });
  return saved.uri;
}

/** Synchronous existence check — guards against a record whose file was purged. */
function fileExists(path: string): boolean {
  if (!path) return false;
  try {
    return new File(path).exists;
  } catch {
    return false;
  }
}

function pathFor(key: string): string | null {
  const record = cache.get<DownloadRecord>(key);
  return record && fileExists(record.local_path) ? record.local_path : null;
}

export const downloads = {
  async saveQuestion(id: string, url: string, title: string, meta: unknown) {
    const local = await downloadTo(url, `q_${id}.pdf`);
    cache.set(`${Q_PREFIX}${id}`, {
      id, local_path: local, title, downloaded_at: new Date().toISOString(), meta,
    } satisfies DownloadRecord);
    return local;
  },

  async saveNote(id: string, url: string, title: string, meta: unknown) {
    const local = await downloadTo(url, `n_${id}.pdf`);
    cache.set(`${N_PREFIX}${id}`, {
      id, local_path: local, title, downloaded_at: new Date().toISOString(), meta,
    } satisfies DownloadRecord);
    return local;
  },

  questionPath(id: string): string | null {
    return pathFor(`${Q_PREFIX}${id}`);
  },

  notePath(id: string): string | null {
    return pathFor(`${N_PREFIX}${id}`);
  },

  /** Everything downloaded, newest first — for an offline library screen. */
  list(): DownloadRecord[] {
    return storage.getAllKeys()
      .filter((k) => k.startsWith(Q_PREFIX) || k.startsWith(N_PREFIX))
      .map((k) => cache.get<DownloadRecord>(k))
      .filter((r): r is DownloadRecord => !!r && fileExists(r.local_path))
      .sort((a, b) => b.downloaded_at.localeCompare(a.downloaded_at));
  },
};
