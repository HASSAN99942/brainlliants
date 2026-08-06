import * as SecureStore from 'expo-secure-store';

const ACCESS = 'access_token';
const REFRESH = 'refresh_token';

export const tokenStore = {
  async saveTokens(access: string, refresh: string) {
    await SecureStore.setItemAsync(ACCESS, access);
    await SecureStore.setItemAsync(REFRESH, refresh);
  },
  async getAccess() { return SecureStore.getItemAsync(ACCESS); },
  async getRefresh() { return SecureStore.getItemAsync(REFRESH); },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
  },
};
