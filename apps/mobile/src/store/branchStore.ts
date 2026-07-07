/**
 * branchStore.ts - 门店选择状态管理
 * 支持多门店切换,按角色过滤可见门店
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: 'active' | 'inactive' | 'maintenance';
  managerName: string;
  todayRevenue: number;
  todayOrders: number;
}

interface BranchState {
  currentBranch: Branch | null;
  availableBranches: Branch[];
  isHydrated: boolean;

  setCurrentBranch: (branch: Branch) => void;
  setAvailableBranches: (branches: Branch[]) => void;
  restoreSession: () => Promise<void>;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      currentBranch: null,
      availableBranches: [],
      isHydrated: false,

      setCurrentBranch: (branch) => set({ currentBranch: branch }),
      setAvailableBranches: (branches) => set({ availableBranches: branches }),

      restoreSession: async () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: 'branch-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentBranch: state.currentBranch,
        availableBranches: state.availableBranches,
      }),
      onRehydrateStorage: () => (state) => {
        state?.restoreSession();
      },
    },
  ),
);
