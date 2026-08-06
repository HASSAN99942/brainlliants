// REAL cache implementation (react-native-mmkv v4) — used in the dev client.
// Temporarily replaced by the in-memory cache.ts for the Expo Go preview.
// To restore: copy this file's body back into cache.ts.
import { createMMKV } from 'react-native-mmkv';

// react-native-mmkv v4: `MMKV` is a type; instances come from createMMKV(),
// and per-key removal is `remove()` (was `delete()` in v3).
export const storage = createMMKV({ id: 'brailliants-cache' });

export const cache = {
  set(key: string, value: unknown) { storage.set(key, JSON.stringify(value)); },
  get<T>(key: string): T | null {
    const raw = storage.getString(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  delete(key: string) { storage.remove(key); },
  keysWithPrefix(prefix: string) { return storage.getAllKeys().filter((k: string) => k.startsWith(prefix)); },
};
