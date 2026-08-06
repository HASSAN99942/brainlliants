import { create } from 'zustand';
import { UserModel } from '../../shared/types/user';
import { tokenStore } from '../../core/storage/secureStore';
import { cache } from '../../core/storage/cache';

interface AuthState {
  user: UserModel | null;
  isAuthenticated: boolean;
  setUser: (u: UserModel) => void;
  loadCachedUser: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (u) => { cache.set('current_user', u); set({ user: u, isAuthenticated: true }); },
  loadCachedUser: () => {
    const u = cache.get<UserModel>('current_user');
    if (u) set({ user: u, isAuthenticated: true });
  },
  logout: async () => { await tokenStore.clear(); cache.delete('current_user'); set({ user: null, isAuthenticated: false }); },
}));
