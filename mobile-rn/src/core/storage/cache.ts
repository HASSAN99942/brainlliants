// TEMPORARY — Expo Go preview only.
//
// Expo Go can't load react-native-mmkv (a native module), so this uses a plain
// in-memory Map with the SAME public API as the real MMKV version. Nothing
// persists across app reloads. The real MMKV implementation is preserved in
// cache.mmkv.ts — restore it (copy its body here) before building the dev
// client or shipping RN.
//
// `storage` mirrors the subset of the MMKV instance API the app relies on
// (getAllKeys/set/getString/remove) so feature code like ai/offline.ts works
// unchanged under both this shim and real MMKV.
const mem = new Map<string, string>();

export const storage = {
  set(key: string, value: string) { mem.set(key, value); },
  getString(key: string): string | undefined { return mem.get(key); },
  remove(key: string) { mem.delete(key); },
  getAllKeys(): string[] { return Array.from(mem.keys()); },
};

export const cache = {
  set(key: string, value: unknown) { mem.set(key, JSON.stringify(value)); },
  get<T>(key: string): T | null {
    const raw = mem.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  delete(key: string) { mem.delete(key); },
  keysWithPrefix(prefix: string) { return Array.from(mem.keys()).filter((k) => k.startsWith(prefix)); },
};
