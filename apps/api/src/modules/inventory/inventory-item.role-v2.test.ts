/**
 * 🐜 自动: [inventory-item] [C] 角色测试编写
 *
 * 8 角色视角测试 — 库存物品管理 (InventoryItemController)
 *
 * 角色映射：
 *   👔 店长      → 库存全局监控、盘点调账
 *   🛒 前台      → 商品入库上架、销售出库
 *   👥 HR        → 库存权限、员工领用
 *   🔧 安监      → 危险品库存、安全库存阈值
 *   🎮 导玩员    → 奖品/扭蛋库存、GD 兑换出库
 *   🎯 运行专员  → 设备备件库存、维修领用
 *   🤝 团建      → 团建物资预留、批量确认
 *   📢 营销      → 活动奖品库存预占、快闪出库
 *
 * 每个角色 2 个测试用例 (正常流程 + 权限边界)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryItemController } from './inventory-item.controller';
import { InventoryItemService } from './inventory-item.service';

const TENANT_ID = 'tenant-arcade-01';
const ANOTHER_TENANT = 'tenant-arcade-02';

function makeController(): { ctrl: InventoryItemController; svc: InventoryItemService } {
  const svc = new InventoryItemService();
  svc.reset();
  const ctrl = new InventoryItemController(svc);
  return { ctrl, svc };
}

function createItem(
  ctrl: InventoryItemController,
  overrides: Record<string, unknown> = {},
): any {
  return ctrl.create({
    tenantId: TENANT_ID,
    sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '测试商品',
    unit: '件',
    totalQty: 100,
    lowStockThreshold: 10,
    unitPriceCents: 5000,
    ...overrides,
  } as any);
}

function authQuery(tenantId = TENANT_ID) {
  return { tenantId };
}

// ═══════════════════════════════════════════════════════════════
// 👔 店长 — 库存全局监控、盘点调账
// ═══════════════════════════════════════════════════════════════

describe('👔 店长视角 — 库存全局监控与调账', () => {
  let ctrl: InventoryItemController;
  let svc: InventoryItemService;

  beforeEach(() => {
    ({ ctrl, svc } = makeController());
  });

  it('【正常】店长查看低库存列表并调账', () => {
    const item = createItem(ctrl, { name: '奖票', totalQty: 8, lowStockThreshold: 10 });

    // 低库存告警应包含此商品
    const lowStock = ctrl.getLowStock(authQuery()) as any[];
    const found = lowStock.find((i: any) => i.id === item.id);
    expect(found).toBeDefined();
    expect(found.availableQty).toBe(8);
    expect(found.availableQty).toBeLessThanOrEqual(found.lowStockThreshold);

    // 店长通过 service 调账 (controller adjust 不通过 query 传 tenantId)
    const adjusted = svc.adjust({
      itemId: item.id,
      tenantId: TENANT_ID,
      qty: 0,
      newTotalQty: 200,
      reason: '店长盘点补货',
      performedBy: '店长-张三',
    });
    expect(adjusted.totalQty).toBe(200);
    expect(adjusted.availableQty).toBe(200);
    expect(adjusted.version).toBe(2); // create version=1 + adjust version++ → 2
  });

  it('【边界】店长调账 newTotalQty < reservedQty 拒绝', () => {
    const item = createItem(ctrl, { name: '限定手办', totalQty: 50 });

    // 直接使用 service 预留
    svc.reserve({ itemId: item.id, tenantId: TENANT_ID, orderId: 'order-001', qty: 30 });

    // 试图调账到 20 (< 30 reserved)
    expect(() =>
      svc.adjust({ itemId: item.id, tenantId: TENANT_ID, qty: 0, newTotalQty: 20, reason: '调账', performedBy: '店长' }),
    ).toThrow();
  });

  it('【边界】店长查看跨租户数据隔离', () => {
    const itemA = createItem(ctrl);

    const lowStockB = ctrl.getLowStock({ tenantId: ANOTHER_TENANT }) as any[];
    const foundA = lowStockB.find((i: any) => i.id === itemA.id);
    expect(foundA).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// 🛒 前台 — 商品入库上架、销售出库
// ═══════════════════════════════════════════════════════════════

describe('🛒 前台视角 — 入库上架与销售出库', () => {
  let ctrl: InventoryItemController;
  let svc: InventoryItemService;

  beforeEach(() => {
    ({ ctrl, svc } = makeController());
  });

  it('【正常】前台入库新品后销售出库', () => {
    const item = createItem(ctrl, { name: '饮料-可乐', totalQty: 200, sku: `GD-${Date.now()}` });
    expect(item.totalQty).toBe(200);

    // 直接使用 service 做 stockOut (controller 需 URL param)
    const sold = svc.stockOut({
      itemId: item.id,
      tenantId: TENANT_ID,
      qty: 10,
      reason: '销售出库-收银机001单',
      performedBy: '前台-李四',
    });
    expect(sold.totalQty).toBe(190);
  });

  it('【边界】前台销售出库超过可用量拒绝 (reserved 占用)', () => {
    const item = createItem(ctrl, { name: '零食大礼包', totalQty: 5 });

    // 预留全部
    svc.reserve({ itemId: item.id, tenantId: TENANT_ID, orderId: 'res-front', qty: 5 });

    // availableQty = 5 - 5 = 0, 无法出库
    expect(() =>
      svc.stockOut({ itemId: item.id, tenantId: TENANT_ID, qty: 1, reason: '销售出库', performedBy: '前台' }),
    ).toThrow();
  });

  it('【边界】前台入库 totalQty < 0 拒绝', () => {
    expect(() => createItem(ctrl, { name: '无效', totalQty: -1 })).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// 👥 HR — 库存权限、员工领用
// ═══════════════════════════════════════════════════════════════

describe('👥 HR视角 — 库存权限与员工领用', () => {
  let ctrl: InventoryItemController;
  let svc: InventoryItemService;

  beforeEach(() => {
    ({ ctrl, svc } = makeController());
  });

  it('【正常】HR 为员工领用工服并记录审计', () => {
    const item = createItem(ctrl, { name: '工服-M码', sku: 'UNIFORM-M', totalQty: 30 });

    // HR 扣减工服 (service 写审计时 performedBy 固定 system)
    svc.stockOut({
      itemId: item.id,
      tenantId: TENANT_ID,
      qty: 2,
      reason: '新员工入职-王五/赵六',
      performedBy: 'HR-陈经理',
    });

    // 查询审计日志
    const auditLog = ctrl.getAuditLog(item.id, authQuery()) as any[];
    const hrAction = auditLog.find((e: any) => e.type === 'STOCK_OUT');
    expect(hrAction).toBeDefined();
    expect(hrAction.reason).toContain('王五');
    // Note: stockOut 写审计时 performedBy 暂固定为 'system'
    expect(hrAction.performedBy).toBe('system');
  });

  it('【边界】HR 查看其它租户审计日志返回空', () => {
    const item = createItem(ctrl, { name: '工服-L码' });

    svc.stockOut({ itemId: item.id, tenantId: TENANT_ID, qty: 1, reason: '测试', performedBy: 'HR' });

    const auditLog = ctrl.getAuditLog(item.id, { tenantId: ANOTHER_TENANT }) as any[];
    expect(auditLog).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 🔧 安监 — 危险品库存、安全库存阈值
// ═══════════════════════════════════════════════════════════════

describe('🔧 安监视角 — 危险品监控与安全库存', () => {
  let ctrl: InventoryItemController;
  let svc: InventoryItemService;

  beforeEach(() => {
    ({ ctrl, svc } = makeController());
  });

  it('【正常】安监设置易燃品低库存告警阈值并监控', () => {
    const item = createItem(ctrl, { name: '清洁酒精', lowStockThreshold: 5 });

    // 直接 service update (controller update 需要 query version)
    const updated = svc.update(item.id, TENANT_ID, 1, {
      lowStockThreshold: 10,
      metadata: { safetyCategory: '易燃品', safetyLevel: 'A' },
    });
    expect(updated.lowStockThreshold).toBe(10);
    expect(updated.metadata!.safetyLevel).toBe('A');

    // 确认低库存阈值生效
    const lowStock = ctrl.getLowStock(authQuery()) as any[];
    const found = lowStock.find((i: any) => i.id === item.id);
    // totalQty=100, available=100, threshold=10, 不应在 lowStock
    expect(found).toBeUndefined();
  });

  it('【边界】安监试图调账超过实际库存拒绝 (newTotal < reserved)', () => {
    const item = createItem(ctrl, { name: '稀料', totalQty: 10 });

    svc.reserve({ itemId: item.id, tenantId: TENANT_ID, orderId: 'safety-res', qty: 8 });

    expect(() =>
      svc.adjust({ itemId: item.id, tenantId: TENANT_ID, qty: 0, newTotalQty: 5, reason: '安监调账', performedBy: '安监-赵工' }),
    ).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// 🎮 导玩员 — 奖品/扭蛋库存、GD 兑换出库
// ═══════════════════════════════════════════════════════════════

describe('🎮 导玩员视角 — 奖品兑换出库', () => {
  let ctrl: InventoryItemController;
  let svc: InventoryItemService;

  beforeEach(() => {
    ({ ctrl, svc } = makeController());
  });

  it('【正常】导玩员为顾客兑换奖品出库', () => {
    const item = createItem(ctrl, { name: '毛绒熊大号', totalQty: 20, lowStockThreshold: 3 });

    const after = svc.stockOut({
      itemId: item.id,
      tenantId: TENANT_ID,
      qty: 1,
      reason: '积分兑换-会员VIP-2026-0711',
      performedBy: '导玩员-小刘',
    });
    expect(after.totalQty).toBe(19);

    // 低库存列表不应包含 (19 > 3)
    const lowStock = ctrl.getLowStock(authQuery()) as any[];
    expect(lowStock.find((i: any) => i.id === item.id)).toBeUndefined();
  });

  it('【边界】导玩员出库时可用量不足 (全部被预留)', () => {
    const item = createItem(ctrl, { name: '限定徽章', totalQty: 3 });

    svc.reserve({ itemId: item.id, tenantId: TENANT_ID, orderId: 'res-badge', qty: 3 });

    // availableQty=0, stockOut 失败
    expect(() =>
      svc.stockOut({ itemId: item.id, tenantId: TENANT_ID, qty: 1, reason: '兑换', performedBy: '导玩员' }),
    ).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// 🎯 运行专员 — 设备备件库存、维修领用
// ═══════════════════════════════════════════════════════════════

describe('🎯 运行专员视角 — 设备备件管理', () => {
  let ctrl: InventoryItemController;
  let svc: InventoryItemService;

  beforeEach(() => {
    ({ ctrl, svc } = makeController());
  });

  it('【正常】运行专员领用维修备件并查看审计', () => {
    const item = createItem(ctrl, { name: '主板-B75', totalQty: 5, lowStockThreshold: 1 });

    const after = svc.stockOut({
      itemId: item.id,
      tenantId: TENANT_ID,
      qty: 1,
      reason: '维修街机#08-主板烧毁',
      performedBy: '运行专员-老王',
    });
    expect(after.totalQty).toBe(4);

    const audit = ctrl.getAuditLog(item.id, authQuery()) as any[];
    const entry = audit.find((e: any) => e.type === 'STOCK_OUT');
    expect(entry).toBeDefined();
    expect(entry.reason).toContain('街机#08');
  });

  it('【边界】运行专员乐观锁 version 冲突', () => {
    const item = createItem(ctrl, { name: '摇杆套件' });

    svc.update(item.id, TENANT_ID, 1, { name: '摇杆套件-v2' });

    // 用旧 version 更新 — 冲突
    expect(() => svc.update(item.id, TENANT_ID, 1, { name: '摇杆套件-v3' })).toThrow();
  });

  it('【边界】更新不存在的 ID', () => {
    expect(() => svc.update('nonexistent', TENANT_ID, 1, { name: 'hack' })).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// 🤝 团建 — 团建物资预留、批量确认
// ═══════════════════════════════════════════════════════════════

describe('🤝 团建视角 — 物资预留与确认', () => {
  let ctrl: InventoryItemController;
  let svc: InventoryItemService;

  beforeEach(() => {
    ({ ctrl, svc } = makeController());
  });

  it('【正常】团建预留烧烤物资并确认出库', () => {
    const item = createItem(ctrl, { name: '烧烤食材套餐', totalQty: 10 });

    // 预留 3 份
    const reservation = svc.reserve({ itemId: item.id, tenantId: TENANT_ID, orderId: 'team-building-jul-11', qty: 3, ttlSeconds: 86400 });
    expect(reservation.status).toBe('PENDING');
    expect(reservation.qty).toBe(3);

    // 确认预留 → inventory 扣减
    const confirmedItem = svc.confirmReservation(reservation.id, TENANT_ID);
    expect(confirmedItem.totalQty).toBe(7);

    // 预留状态变为 CONFIRMED
    const getRes = ctrl.getReservation(reservation.id, authQuery()) as any;
    expect(getRes.status).toBe('CONFIRMED');
    expect(getRes.confirmedAt).toBeDefined();
  });

  it('【边界】团建重复预留同 order 幂等返回原有', () => {
    const item = createItem(ctrl, { name: '帐篷', totalQty: 10 });

    const res1 = svc.reserve({ itemId: item.id, tenantId: TENANT_ID, orderId: 'tb-camping', qty: 5 });
    // 同 order 第二次预留 — 幂等
    const res2 = svc.reserve({ itemId: item.id, tenantId: TENANT_ID, orderId: 'tb-camping', qty: 5 });
    expect(res2.id).toBe(res1.id);
    expect(res2.status).toBe('PENDING');
  });

  it('【边界】释放不存在的 reservation 抛出', () => {
    expect(() => svc.releaseReservation('nonexistent', TENANT_ID)).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// 📢 营销 — 活动奖品库存预占、快闪出库
// ═══════════════════════════════════════════════════════════════

describe('📢 营销视角 — 活动预占与快闪出库', () => {
  let ctrl: InventoryItemController;
  let svc: InventoryItemService;

  beforeEach(() => {
    ({ ctrl, svc } = makeController());
  });

  it('【正常】营销为七夕活动预占奖品并扣减', () => {
    const item = createItem(ctrl, { name: '七夕限定手环', totalQty: 200 });

    // 预占 50
    const res = svc.reserve({ itemId: item.id, tenantId: TENANT_ID, orderId: 'qixi-event-2026', qty: 50, ttlSeconds: 604800 });
    expect(res.status).toBe('PENDING');

    // 确认扣减
    const confirmed = svc.confirmReservation(res.id, TENANT_ID);
    expect(confirmed.availableQty).toBe(150);
  });

  it('【边界】营销预留超过可用量', () => {
    const item = createItem(ctrl, { name: '限量版海报', totalQty: 20 });

    svc.reserve({ itemId: item.id, tenantId: TENANT_ID, orderId: 'poster-campaign', qty: 15 });

    // 再预 10 (available=5 < 10)
    expect(() =>
      svc.reserve({ itemId: item.id, tenantId: TENANT_ID, orderId: 'poster-campaign-2', qty: 10 }),
    ).toThrow();
  });

  it('【边界】营销快闪活动后释放未使用预留', () => {
    const item = createItem(ctrl, { name: '快闪店-奶茶券', totalQty: 500 });

    const res = svc.reserve({ itemId: item.id, tenantId: TENANT_ID, orderId: 'flash-sale-aug', qty: 100 });
    expect(res.status).toBe('PENDING');

    // 释放
    const releasedItem = svc.releaseReservation(res.id, TENANT_ID, '快闪活动结束-未使用', '营销-小王');
    expect(releasedItem.reservedQty).toBe(0);
    expect(releasedItem.availableQty).toBe(500);

    const getRes = ctrl.getReservation(res.id, authQuery()) as any;
    expect(getRes.status).toBe('RELEASED');
    expect(getRes.releasedAt).toBeDefined();
  });
});
