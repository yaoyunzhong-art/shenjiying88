/**
 * branchStore.test.ts - Phase-21 T54
 * 门店选择状态管理 (Zustand + persist) 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useBranchStore, type Branch } from './branchStore';

const mockBranch1: Branch = {
  id: 'b001',
  name: '神机营·旗舰店',
  address: '上海市浦东新区陆家嘴环路1000号',
  phone: '021-58880001',
  status: 'active',
  managerName: '张经理',
  todayRevenue: 28650,
  todayOrders: 134,
};

const mockBranch2: Branch = {
  id: 'b002',
  name: '神机营·徐汇店',
  address: '上海市徐汇区虹桥路500号',
  phone: '021-64820002',
  status: 'active',
  managerName: '李店长',
  todayRevenue: 19230,
  todayOrders: 98,
};

const mockBranch3: Branch = {
  id: 'b003',
  name: '神机营·静安店',
  address: '上海市静安区南京西路1600号',
  phone: '021-62580003',
  status: 'inactive',
  managerName: '王经理',
  todayRevenue: 0,
  todayOrders: 0,
};

describe('branchStore · Phase-21 T54', () => {
  beforeEach(() => {
    // Reset store to initial state
    useBranchStore.setState({
      currentBranch: null,
      availableBranches: [],
      isHydrated: false,
    });
  });

  // ── 正例: 设置当前门店 ──

  it('setCurrentBranch: sets currentBranch correctly', () => {
    useBranchStore.getState().setCurrentBranch(mockBranch1);
    expect(useBranchStore.getState().currentBranch).toEqual(mockBranch1);
  });

  it('setCurrentBranch: can switch to another branch', () => {
    useBranchStore.getState().setCurrentBranch(mockBranch1);
    useBranchStore.getState().setCurrentBranch(mockBranch2);

    const state = useBranchStore.getState();
    expect(state.currentBranch?.id).toBe('b002');
    expect(state.currentBranch?.name).toBe('神机营·徐汇店');
  });

  // ── 正例: 设置可用门店列表 ──

  it('setAvailableBranches: sets availableBranches correctly', () => {
    useBranchStore.getState().setAvailableBranches([mockBranch1, mockBranch2, mockBranch3]);
    const state = useBranchStore.getState();
    expect(state.availableBranches).toHaveLength(3);
    expect(state.availableBranches[0].id).toBe('b001');
    expect(state.availableBranches[1].id).toBe('b002');
    expect(state.availableBranches[2].id).toBe('b003');
  });

  it('setAvailableBranches: replaces previous list entirely', () => {
    useBranchStore.getState().setAvailableBranches([mockBranch1, mockBranch2]);
    useBranchStore.getState().setAvailableBranches([mockBranch3]);

    const state = useBranchStore.getState();
    expect(state.availableBranches).toHaveLength(1);
    expect(state.availableBranches[0].id).toBe('b003');
  });

  // ── 正例: restoreSession ──

  it('restoreSession: sets isHydrated to true', async () => {
    expect(useBranchStore.getState().isHydrated).toBe(false);
    await useBranchStore.getState().restoreSession();
    expect(useBranchStore.getState().isHydrated).toBe(true);
  });

  // ── 边界: 设置门店时列表未初始化 ──

  it('setCurrentBranch: works with empty availableBranches list', () => {
    useBranchStore.getState().setCurrentBranch(mockBranch1);
    expect(useBranchStore.getState().currentBranch?.name).toBe('神机营·旗舰店');
    // availableBranches should remain empty
    expect(useBranchStore.getState().availableBranches).toHaveLength(0);
  });

  it('setAvailableBranches: accepts empty list', () => {
    useBranchStore.getState().setAvailableBranches([]);
    expect(useBranchStore.getState().availableBranches).toHaveLength(0);
  });

  // ── 防御: 初始状态 ──

  it('initial state: currentBranch is null and availableBranches is empty', () => {
    const state = useBranchStore.getState();
    expect(state.currentBranch).toBeNull();
    expect(state.availableBranches).toEqual([]);
    expect(state.isHydrated).toBe(false);
  });

  it('setCurrentBranch: does not affect availableBranches', () => {
    useBranchStore.getState().setCurrentBranch(mockBranch1);
    expect(useBranchStore.getState().currentBranch).toEqual(mockBranch1);
    // availableBranches should still be empty array
    expect(useBranchStore.getState().availableBranches).toEqual([]);
  });

  // ── 防御: 覆盖当前门店 ──

  it('setCurrentBranch: can set the same branch multiple times', () => {
    useBranchStore.getState().setCurrentBranch(mockBranch1);
    useBranchStore.getState().setCurrentBranch(mockBranch1);
    useBranchStore.getState().setCurrentBranch(mockBranch1);

    expect(useBranchStore.getState().currentBranch?.id).toBe('b001');
  });

  it('setCurrentBranch: stores full branch object including financial data', () => {
    useBranchStore.getState().setCurrentBranch(mockBranch1);
    const branch = useBranchStore.getState().currentBranch;
    expect(branch?.todayRevenue).toBe(28650);
    expect(branch?.todayOrders).toBe(134);
    expect(branch?.phone).toBe('021-58880001');
    expect(branch?.status).toBe('active');
  });
});
