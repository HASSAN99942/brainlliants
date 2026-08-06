import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE, Endpoints } from '../constants/api';
import { tokenStore } from '../storage/secureStore';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use(async (config) => {
  const token = await tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh on 401 (once), then retry the original request
let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

function onRefreshed(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      try {
        const refresh = await tokenStore.getRefresh();
        if (!refresh) throw error;
        const resp = await axios.post(`${API_BASE}${Endpoints.refreshToken}`, { refresh });
        const newAccess = resp.data.access as string;
        const currentRefresh = (await tokenStore.getRefresh()) ?? refresh;
        await tokenStore.saveTokens(newAccess, currentRefresh);
        onRefreshed(newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        onRefreshed(null);
        await tokenStore.clear();
        throw e;
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);
