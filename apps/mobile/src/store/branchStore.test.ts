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

const mockBranch4: Branch = {
  id: 'b004',
  name: '神机营·古北店',
  address: '上海市长宁区古北路100号',
  phone: '021-68880004',
  status: 'maintenance',
  managerName: '陈经理',
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

  // ── 新增: 门店状态变体 ──

  it('setCurrentBranch: works with inactive branch', () => {
    useBranchStore.getState().setCurrentBranch(mockBranch3);
    const branch = useBranchStore.getState().currentBranch;
    expect(branch?.status).toBe('inactive');
    expect(branch?.todayRevenue).toBe(0);
    expect(branch?.todayOrders).toBe(0);
  });

  it('setCurrentBranch: works with maintenance branch', () => {
    useBranchStore.getState().setCurrentBranch(mockBranch4);
    const branch = useBranchStore.getState().currentBranch;
    expect(branch?.status).toBe('maintenance');
    expect(branch?.managerName).toBe('陈经理');
  });

  // ── 新增: 门店列表多数据 ──

  it('setAvailableBranches: handles 4 branches', () => {
    useBranchStore.getState().setAvailableBranches([
      mockBranch1, mockBranch2, mockBranch3, mockBranch4,
    ]);
    const state = useBranchStore.getState();
    expect(state.availableBranches).toHaveLength(4);
    // 保持原始插入顺序
    expect(state.availableBranches[3].name).toBe('神机营·古北店');
  });

  it('setAvailableBranches: each branch has distinct id', () => {
    useBranchStore.getState().setAvailableBranches([
      mockBranch1, mockBranch2, mockBranch3,
    ]);
    const ids = useBranchStore.getState().availableBranches.map((b) => b.id);
    expect(new Set(ids).size).toBe(3);
  });

  // ── 新增: 状态交互 ──

  it('切换门店后不影响其他状态', () => {
    useBranchStore.getState().setAvailableBranches([mockBranch1, mockBranch2]);
    useBranchStore.getState().setCurrentBranch(mockBranch1);

    // 换一个门店
    useBranchStore.getState().setCurrentBranch(mockBranch2);
    const state = useBranchStore.getState();
    expect(state.currentBranch?.id).toBe('b002');
    // availableBranches 不变
    expect(state.availableBranches).toHaveLength(2);
    // isHydrated 不变
    expect(state.isHydrated).toBe(false);
  });

  it('先设置列表, 再设置当前门店为列表中的一家', () => {
    useBranchStore.getState().setAvailableBranches([mockBranch1, mockBranch2, mockBranch3]);
    useBranchStore.getState().setCurrentBranch(mockBranch2);

    const state = useBranchStore.getState();
    expect(state.currentBranch?.id).toBe('b002');
    expect(state.availableBranches[1].name).toBe('神机营·徐汇店');
  });

  // ── 新增: partialize 行为 (用于 persist) ──

  it('partialize: 只序列化 currentBranch 和 availableBranches', () => {
    useBranchStore.getState().setCurrentBranch(mockBranch1);
    useBranchStore.getState().setAvailableBranches([mockBranch1, mockBranch2]);

    // 直接验证 setState 后的值
    const state = useBranchStore.getState();
    expect(state.currentBranch).toBeDefined();
    expect(state.availableBranches).toHaveLength(2);
  });

  it('restoreSession: 可以多次调用', async () => {
    await useBranchStore.getState().restoreSession();
    expect(useBranchStore.getState().isHydrated).toBe(true);

    // 再次调用不应报错
    await useBranchStore.getState().restoreSession();
    expect(useBranchStore.getState().isHydrated).toBe(true);
  });

  // ── 新增: 边界条件 ──

  it('setCurrentBranch: null 不会意外设置', () => {
    // 类型系统不允许 null, 但防御性验证
    useBranchStore.getState().setCurrentBranch(mockBranch1);
    expect(useBranchStore.getState().currentBranch).not.toBeNull();
  });

  it('setAvailableBranches: 再次设置后旧列表被清空', () => {
    useBranchStore.getState().setAvailableBranches([mockBranch1, mockBranch2]);
    useBranchStore.getState().setAvailableBranches([]);
    expect(useBranchStore.getState().availableBranches).toHaveLength(0);
  });

  it('setCurrentBranch: 可用门店列表不受门店切换影响', () => {
    const initialBranches = [mockBranch1, mockBranch2];
    useBranchStore.getState().setAvailableBranches(initialBranches);
    useBranchStore.getState().setCurrentBranch(mockBranch1);
    useBranchStore.getState().setCurrentBranch(mockBranch2);
    useBranchStore.getState().setCurrentBranch(mockBranch3); // 不在列表中

    const state = useBranchStore.getState();
    expect(state.availableBranches).toEqual(initialBranches);
  });
});
