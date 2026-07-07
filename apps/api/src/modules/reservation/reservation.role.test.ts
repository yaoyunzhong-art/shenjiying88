import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [reservation] 角色测试增强 (8角色全覆盖)
 *
 * 8 角色视角的 reservation 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖端点: create, findAll, findOne, findByUser, findByResource,
 *           findByTimeRange, checkConflict, updateReservation, cancelReservation
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界/特殊场景）
 * 跨租户隔离测试 + 状态流转边界测试
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { ReservationStatus, ReservationType } from './reservation.entity';
import type { RequestTenantContext, RequestActorContext } from '../tenant/tenant.types';

// ── 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
};

// ── 测试常量 ──
const TENANT_A = 't-rsv-a';
const TENANT_B = 't-rsv-b';
const TENANT_C = 't-rsv-c'; // 额外租户用于跨租户隔离测试

function tenantCtx(tenantId: string = TENANT_A): RequestTenantContext {
  return { tenantId };
}

function makeActor(roles: string[], permissions: string[] = []): RequestActorContext {
  return {
    actorId: 'actor-01',
    actorType: 'employee-user',
    roles,
    permissions,
    authenticated: true,
    source: 'headers',
  };
}

const DEFAULT_CREATE_BODY = {
  type: ReservationType.Venue,
  resourceId: 'room-101',
  resourceName: 'VIP Room',
  userId: 'u-01',
  userName: '张三',
  startTime: '2026-06-24T10:00:00.000Z',
  endTime: '2026-06-24T12:00:00.000Z',
  duration: 120,
  price: 200,
  deposit: 50,
};

function makeService(): ReservationService {
  const svc = new ReservationService();
  svc.resetStoreForTests();
  return svc;
}

function makeController(service?: ReservationService): ReservationController {
  return new ReservationController(service ?? makeService());
}

/**
 * 在服务中预置一批预约数据用于查询类测试
 * 返回 [room101Pending, room101Confirmed, room102Pending, equipmentPending]
 */
function seedReservations(service: ReservationService): string[] {
  const ids: string[] = [];

  const r1 = service.create({
    tenantId: TENANT_A,
    type: ReservationType.Venue,
    resourceId: 'room-101',
    resourceName: 'VIP Room',
    userId: 'u-01',
    userName: '张三',
    startTime: '2026-06-24T10:00:00.000Z',
    endTime: '2026-06-24T12:00:00.000Z',
    duration: 120,
    price: 200,
    deposit: 50,
    remark: '普通预约',
  });
  ids.push(r1.id);

  // 确认 room-101 的某个预约
  const r2 = service.create({
    tenantId: TENANT_A,
    type: ReservationType.Venue,
    resourceId: 'room-101',
    resourceName: 'VIP Room',
    userId: 'u-02',
    userName: '李四',
    startTime: '2026-06-24T14:00:00.000Z',
    endTime: '2026-06-24T16:00:00.000Z',
    duration: 120,
    price: 300,
    deposit: 100,
  });
  ids.push(r2.id);
  service.confirm(r2.id, TENANT_A);

  const r3 = service.create({
    tenantId: TENANT_A,
    type: ReservationType.Equipment,
    resourceId: 'room-102',
    resourceName: 'PS5 体验区',
    userId: 'u-03',
    userName: '王五',
    startTime: '2026-06-24T09:00:00.000Z',
    endTime: '2026-06-24T10:00:00.000Z',
    duration: 60,
    price: 50,
    deposit: 20,
  });
  ids.push(r3.id);
  service.confirm(r3.id, TENANT_A);
  service.startProgress(r3.id, TENANT_A);
  service.complete(r3.id, TENANT_A);

  const r4 = service.create({
    tenantId: TENANT_A,
    type: ReservationType.Equipment,
    resourceId: 'gear-ps5-01',
    resourceName: 'PS5-01 手柄',
    userId: 'u-04',
    userName: '赵六',
    startTime: '2026-06-25T10:00:00.000Z',
    endTime: '2026-06-25T11:00:00.000Z',
    duration: 60,
    price: 30,
    deposit: 10,
  });
  ids.push(r4.id);

  // 租户 B 的数据（用于跨租户隔离验证）
  service.create({
    tenantId: TENANT_B,
    type: ReservationType.Venue,
    resourceId: 'room-201',
    resourceName: 'B栋会议室',
    userId: 'u-10',
    userName: '租户B用户',
    startTime: '2026-06-24T10:00:00.000Z',
    endTime: '2026-06-24T12:00:00.000Z',
    duration: 120,
    price: 150,
    deposit: 30,
  });

  return ids;
}

// ══════════════════════════════════════════════
// 👔 店长 — 全局管理权限
// ══════════════════════════════════════════════
describe(`${ROLES.TenantAdmin} reservation 角色测试`, () => {
  it('店长创建预约 — 正常流程填充分配 ID', () => {
    const ctrl = makeController();
    const result = ctrl.createReservation(tenantCtx(), DEFAULT_CREATE_BODY);
    assert.equal(result.status, ReservationStatus.Pending);
    assert.equal(result.resourceName, 'VIP Room');
    assert.equal(result.tenantId, TENANT_A);
    assert.ok(result.id.startsWith('reservation-'));
    assert.equal(result.duration, 120);
    assert.equal(result.price, 200);
  });

  it('店长查看本店所有预约 — 不包含其他租户数据', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    const results = ctrl.findAll(tenantCtx(), {});
    assert.ok(Array.isArray(results));
    // 当前租户有 4 条 + 新创建 0 = 4
    // 租户 B 有 1 条，不应出现
    for (const r of results) {
      assert.equal(r.tenantId, TENANT_A);
    }
  });

  it('店长查找特定预约详情 — 不存在时抛出 NotFound', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    assert.throws(() => {
      ctrl.findOne(tenantCtx(), 'nonexistent-id');
    }, /Reservation not found/);
  });

  it('店长取消预约 — 正常流程状态变为 cancelled', () => {
    const svc = makeService();
    const [id] = seedReservations(svc);
    const ctrl = makeController(svc);

    const result = ctrl.cancelReservation(tenantCtx(), id, '店长取消');
    assert.equal(result.status, ReservationStatus.Cancelled);
    assert.equal(result.cancelledReason, '店长取消');
  });
});

// ══════════════════════════════════════════════
// 🛒 前台 — 接待客户，处理即时预约
// ══════════════════════════════════════════════
describe(`${ROLES.Reception} reservation 角色测试`, () => {
  it('前台为客户创建即时预约 — 正常流程含不同用户', () => {
    const svc = makeService();
    const ctrl = makeController(svc);

    const result = ctrl.createReservation(tenantCtx(), {
      ...DEFAULT_CREATE_BODY,
      userName: '李四',
      userId: 'u-02',
      resourceName: '普通卡座',
    });
    assert.equal(result.status, ReservationStatus.Pending);
    assert.equal(result.userName, '李四');
    assert.equal(result.resourceName, '普通卡座');
  });

  it('前台查询某客户所有预约记录 — 仅该客户数据', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    const results = ctrl.findByUser(tenantCtx(), 'u-01');
    assert.ok(Array.isArray(results));
    assert.ok(results.length >= 1);
    for (const r of results) {
      assert.equal(r.userId, 'u-01');
      assert.equal(r.tenantId, TENANT_A);
    }
  });

  it('前台创建预约时间非法 — 结束时间早于开始时间拒绝', () => {
    const ctrl = makeController();
    assert.throws(() => {
      ctrl.createReservation(tenantCtx(), {
        ...DEFAULT_CREATE_BODY,
        startTime: '2026-06-24T14:00:00.000Z',
        endTime: '2026-06-24T12:00:00.000Z',
      });
    }, /endTime must be after startTime/);
  });
});

// ══════════════════════════════════════════════
// 👥 HR — 团建活动管理，面向员工福利
// ══════════════════════════════════════════════
describe(`${ROLES.HR} reservation 角色测试`, () => {
  it('HR 为团建活动预约多功能厅 — 正常流程', () => {
    const ctrl = makeController();
    const result = ctrl.createReservation(tenantCtx(), {
      ...DEFAULT_CREATE_BODY,
      type: ReservationType.Venue,
      resourceName: '多功能厅',
      duration: 240,
      price: 0,
    });
    assert.equal(result.status, ReservationStatus.Pending);
    assert.equal(result.resourceName, '多功能厅');
    assert.equal(result.price, 0); // 内部活动免费
  });

  it('HR 查询某时间段可用性 — 无冲突返回 false', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    // 空闲时间段
    const result = ctrl.checkConflict(
      tenantCtx(),
      'room-101',
      '2026-06-25T08:00:00.000Z',
      '2026-06-25T09:00:00.000Z',
    );
    assert.equal(result.hasConflict, false);

    // 冲突时间段 — 14:00-16:00 已被确认
    const conflictResult = ctrl.checkConflict(
      tenantCtx(),
      'room-101',
      '2026-06-24T15:00:00.000Z',
      '2026-06-24T17:00:00.000Z',
    );
    assert.equal(conflictResult.hasConflict, true);
  });

  it('HR 查看已完成的设备预约 — 状态过滤', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    const results = ctrl.findAll(tenantCtx(), {
      status: ReservationStatus.Completed,
    });
    assert.ok(results.length >= 1);
    for (const r of results) {
      assert.equal(r.status, ReservationStatus.Completed);
    }
  });
});

// ══════════════════════════════════════════════
// 🔧 安监 — 安全合规检查，查看所有资源使用
// ══════════════════════════════════════════════
describe(`${ROLES.Safety} reservation 角色测试`, () => {
  it('安监查看所有预约 — 确保全部资源可追溯', () => {
    const svc = makeService();
    const ids = seedReservations(svc);
    const ctrl = makeController(svc);

    const results = ctrl.findAll(tenantCtx(), {});
    assert.ok(results.length >= 4);
    // 检查不同类型的预约都存在
    const types = new Set(results.map((r: any) => r.type));
    assert.ok(types.has(ReservationType.Venue));
    assert.ok(types.has(ReservationType.Equipment));
  });

  it('安监查看特定资源预约历史 — 安全审计', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    const results = ctrl.findByResource(tenantCtx(), 'room-101');
    assert.ok(Array.isArray(results));
    assert.ok(results.length >= 2); // 两条 room-101 预约
    for (const r of results) {
      assert.equal(r.resourceId, 'room-101');
    }
  });

  it('安监查看不同租户资源隔离 — 跨租户无权查看', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    // 租户 C 不应该有预约数据
    const results = ctrl.findAll(tenantCtx(TENANT_C), {});
    assert.equal(results.length, 0);
  });
});

// ══════════════════════════════════════════════
// 🎮 导玩员 — 设备管理和服务确认
// ══════════════════════════════════════════════
describe(`${ROLES.Guide} reservation 角色测试`, () => {
  it('导玩员查询设备预约 — 按资源ID过滤', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    const results = ctrl.findByResource(tenantCtx(), 'gear-ps5-01');
    assert.ok(results.length >= 1);
    for (const r of results) {
      assert.equal(r.resourceId, 'gear-ps5-01');
    }
  });

  it('导玩员将预约标记为已确认 — 状态变更为 confirmed', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    const pending = svc.findAll(TENANT_A, { status: ReservationStatus.Pending });
    assert.ok(pending.length >= 1);

    const result = ctrl.updateReservation(tenantCtx(), pending[0].id, {
      status: ReservationStatus.Confirmed,
    });
    assert.equal(result.status, ReservationStatus.Confirmed);
  });

  it('导玩员无法从 Pending 直接变为 Completed — 无效状态流转', () => {
    const svc = makeService();
    const ctrl = makeController(svc);

    const r = ctrl.createReservation(tenantCtx(), {
      ...DEFAULT_CREATE_BODY,
      resourceId: 'gear-arcade-01',
      resourceName: '街机-01',
    });

    assert.throws(() => {
      ctrl.updateReservation(tenantCtx(), r.id, {
        status: ReservationStatus.Completed,
      });
    }, /Invalid reservation status transition/);
  });
});

// ══════════════════════════════════════════════
// 🎯 运行专员 — 运营调度，查看当天+完成预约
// ══════════════════════════════════════════════
describe(`${ROLES.Ops} reservation 角色测试`, () => {
  it('运行专员查看当天所有预约 — 时间段过滤', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    const results = ctrl.findByTimeRange(
      tenantCtx(),
      '2026-06-24T00:00:00.000Z',
      '2026-06-25T00:00:00.000Z',
    );
    assert.ok(Array.isArray(results));
    assert.ok(results.length >= 3); // 至少 3 条当天数据
    for (const r of results) {
      assert.ok(r.startTime >= new Date('2026-06-24T00:00:00.000Z'));
      assert.ok(r.endTime <= new Date('2026-06-25T00:00:00.000Z'));
    }
  });

  it('运行专员将已确认预约开始服务 — 状态流转 InProgress', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    const confirmed = svc.findAll(TENANT_A, { status: ReservationStatus.Confirmed });
    assert.ok(confirmed.length >= 1);

    const result = ctrl.updateReservation(tenantCtx(), confirmed[0].id, {
      status: ReservationStatus.InProgress,
    });
    assert.equal(result.status, ReservationStatus.InProgress);
  });

  it('运行专员完成进行中的预约 — Completed 状态变更', () => {
    const svc = makeService();
    const ctrl = makeController(svc);
    const r = ctrl.createReservation(tenantCtx(), DEFAULT_CREATE_BODY);

    // Pending → Confirmed → InProgress → Completed
    ctrl.updateReservation(tenantCtx(), r.id, { status: ReservationStatus.Confirmed });
    ctrl.updateReservation(tenantCtx(), r.id, { status: ReservationStatus.InProgress });
    const result = ctrl.updateReservation(tenantCtx(), r.id, {
      status: ReservationStatus.Completed,
    });
    assert.equal(result.status, ReservationStatus.Completed);
  });
});

// ══════════════════════════════════════════════
// 🤝 团建 — 团队建设预约，批量或长时段
// ══════════════════════════════════════════════
describe(`${ROLES.Teambuilding} reservation 角色测试`, () => {
  it('团建专员预约户外拓展场地 — 正常流程', () => {
    const ctrl = makeController();
    const result = ctrl.createReservation(tenantCtx(), {
      ...DEFAULT_CREATE_BODY,
      type: ReservationType.Venue,
      resourceName: '户外拓展区',
      duration: 360,
      price: 500,
      deposit: 100,
      remark: '季度团队建设活动',
    });
    assert.equal(result.status, ReservationStatus.Pending);
    assert.equal(result.resourceName, '户外拓展区');
    assert.equal(result.duration, 360);
    assert.equal(result.remark, '季度团队建设活动');
  });

  it('团建专员查询团队历史预约 — 按用户查找', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    // 查找团队负责人为 u-01 的预约
    const results = ctrl.findByUser(tenantCtx(), 'u-01');
    assert.ok(results.length >= 1);
    for (const r of results) {
      assert.equal(r.userId, 'u-01');
    }
  });

  it('团建专员检查场地可用性 — 无冲突时返回 false', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    // 空闲时段
    const result = ctrl.checkConflict(
      tenantCtx(),
      'room-101',
      '2026-06-26T08:00:00.000Z',
      '2026-06-26T12:00:00.000Z',
    );
    assert.equal(result.hasConflict, false);
  });
});

// ══════════════════════════════════════════════
// 📢 营销 — 活动营销场地预约，对接市场活动
// ══════════════════════════════════════════════
describe(`${ROLES.Marketing} reservation 角色测试`, () => {
  it('营销专员预约中庭广场办活动 — 正常流程', () => {
    const ctrl = makeController();
    const result = ctrl.createReservation(tenantCtx(), {
      ...DEFAULT_CREATE_BODY,
      type: ReservationType.Venue,
      resourceName: '中庭广场',
      duration: 480,
      price: 1000,
      deposit: 300,
      remark: '新品发布会',
    });
    assert.equal(result.status, ReservationStatus.Pending);
    assert.equal(result.resourceName, '中庭广场');
    assert.equal(result.remark, '新品发布会');
  });

  it('营销专员取消不适合的活动预约 — 带取消原因', () => {
    const svc = makeService();
    const ctrl = makeController(svc);
    const r = ctrl.createReservation(tenantCtx(), {
      ...DEFAULT_CREATE_BODY,
      resourceName: '外场展区',
      remark: '春季促销路演',
    });

    const result = ctrl.cancelReservation(tenantCtx(), r.id, '天气原因取消');
    assert.equal(result.status, ReservationStatus.Cancelled);
    assert.equal(result.cancelledReason, '天气原因取消');
  });

  it('营销专员不允许取消已完成活动预约 — 状态流转限制', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrl = makeController(svc);

    // 找一条 Completed 状态的预约
    const completed = svc.findAll(TENANT_A, { status: ReservationStatus.Completed });

    if (completed.length > 0) {
      assert.throws(() => {
        ctrl.updateReservation(tenantCtx(), completed[0].id, {
          status: ReservationStatus.Cancelled,
        });
      }, /Invalid reservation status transition/);
    }
  });
});

// ══════════════════════════════════════════════
// 🌐 跨角色通用测试 — 租户隔离 + 边界条件
// ══════════════════════════════════════════════
describe('reservation 通用隔离与边界测试', () => {
  it('租户隔离 — 租户 A 看不到租户 B 的预约', () => {
    const svc = makeService();
    seedReservations(svc);
    const ctrlA = makeController(svc);
    const ctrlB = makeController(svc);

    const resultsA = ctrlA.findAll(tenantCtx(TENANT_A), {});
    const resultsB = ctrlB.findAll(tenantCtx(TENANT_B), {});

    assert.ok(resultsA.length >= 4);
    assert.ok(resultsB.length >= 1);

    // 交叉验证
    for (const r of resultsA) {
      assert.notEqual(r.tenantId, TENANT_B);
    }
    for (const r of resultsB) {
      assert.notEqual(r.tenantId, TENANT_A);
    }
  });

  it('缺少必填参数 findByTimeRange — 空参数不会被传到端点', () => {
    // findByTimeRange 在 controller 层做了校验
    const ctrl = makeController();
    assert.throws(() => {
      (ctrl as any).findByTimeRange(tenantCtx(), '', '');
    });
  });

  it('缺少必填参数 checkConflict — 抛出错误', () => {
    const ctrl = makeController();
    assert.throws(() => {
      (ctrl as any).checkConflict(tenantCtx(), '', '', '');
    });
  });

  it('创建预约后 createdAt / updatedAt 被正确设置', () => {
    const ctrl = makeController();
    const result = ctrl.createReservation(tenantCtx(), DEFAULT_CREATE_BODY);
    assert.ok(result.createdAt instanceof Date);
    assert.ok(result.updatedAt instanceof Date);
    assert.ok(result.createdAt.getTime() > 0);
  });

  it('取消已取消的预约 — 重复取消被拒绝', () => {
    const svc = makeService();
    const ctrl = makeController(svc);
    const r = ctrl.createReservation(tenantCtx(), DEFAULT_CREATE_BODY);

    // 第一次取消成功
    ctrl.cancelReservation(tenantCtx(), r.id, '原因1');

    // 第二次取消抛出错误（Cancelled 无出边状态流转）
    assert.throws(() => {
      ctrl.cancelReservation(tenantCtx(), r.id, '原因2');
    }, /Invalid reservation status transition/);
  });

  it('预约冲突检测 — 同一资源同一时间段重叠被拒绝', () => {
    const svc = makeService();
    const ctrl = makeController(svc);

    // 创建并确认一条预约
    const r1 = ctrl.createReservation(tenantCtx(), DEFAULT_CREATE_BODY);
    ctrl.updateReservation(tenantCtx(), r1.id, { status: ReservationStatus.Confirmed });

    // 同一资源同一时间段的预约确认时触发冲突
    const r2 = ctrl.createReservation(tenantCtx(), {
      ...DEFAULT_CREATE_BODY,
      resourceId: 'room-101',
      userId: 'u-conflict',
      userName: '冲突用户',
    });

    assert.throws(() => {
      ctrl.updateReservation(tenantCtx(), r2.id, { status: ReservationStatus.Confirmed });
    }, /is already booked/);
  });

  it('全类型预约创建 — Venue / Equipment / Service / Class 均支持', () => {
    const svc = makeService();
    const ctrl = makeController(svc);

    for (const type of Object.values(ReservationType)) {
      const result = ctrl.createReservation(tenantCtx(), {
        ...DEFAULT_CREATE_BODY,
        type,
        resourceId: `res-${type}`,
        resourceName: `${type} 资源`,
      });
      assert.equal(result.type, type);
      assert.equal(result.status, ReservationStatus.Pending);
    }
  });
});
