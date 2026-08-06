// Stable declaration for the Node `process` global used by
// `src/core/constants/api.ts` (process.env.EXPO_PUBLIC_*). `@types/node` is
// installed but expo/tsconfig.base doesn't auto-load it, and Expo periodically
// regenerates/removes expo-env.d.ts — this file guarantees `process` is always
// typed regardless. @types/node's ProcessEnv has a string-index signature, so
// process.env.EXPO_PUBLIC_API_BASE resolves to `string | undefined`.
/// <reference types="node" />
