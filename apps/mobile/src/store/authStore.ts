/**
 * authStore.ts - Phase-21 T53
 * 认证状态管理 (Zustand + persist)
 *
 * 持久化: AsyncStorage (key: 'auth-storage')
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  tenantId: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isHydrated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;

  // Actions
  login: (params: { user: User; token: string; refreshToken: string }) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isHydrated: false,
      user: null,
      token: null,
      refreshToken: null,

      login: ({ user, token, refreshToken }) => {
        set({ isAuthenticated: true, user, token, refreshToken });
      },

      logout: () => {
        set({ isAuthenticated: false, user: null, token: null, refreshToken: null });
      },

      updateUser: (patch) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...patch } });
      },

      restoreSession: async () => {
        // persist 中间件已自动读取,这里仅标记 hydrated
        // 但因为 storage 是 async,需要额外 await 完成
        // 实际场景:可在此调用 /api/auth/validate 校验 token 有效性
        set({ isHydrated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 仅持久化必要字段
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // AsyncStorage 读取完成后,标记 hydrated
        state?.restoreSession();
      },
    },
  ),
);