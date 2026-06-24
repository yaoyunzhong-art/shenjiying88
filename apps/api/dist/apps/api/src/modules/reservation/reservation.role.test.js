"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const reservation_controller_1 = require("./reservation.controller");
const reservation_service_1 = require("./reservation.service");
const reservation_entity_1 = require("./reservation.entity");
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
function tenantCtx(tenantId = TENANT_A) {
    return { tenantId };
}
function makeActor(roles, permissions = []) {
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
    type: reservation_entity_1.ReservationType.Venue,
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
function makeService() {
    const svc = new reservation_service_1.ReservationService();
    svc.resetStoreForTests();
    return svc;
}
function makeController(service) {
    return new reservation_controller_1.ReservationController(service ?? makeService());
}
/**
 * 在服务中预置一批预约数据用于查询类测试
 * 返回 [room101Pending, room101Confirmed, room102Pending, equipmentPending]
 */
function seedReservations(service) {
    const ids = [];
    const r1 = service.create({
        tenantId: TENANT_A,
        type: reservation_entity_1.ReservationType.Venue,
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
        type: reservation_entity_1.ReservationType.Venue,
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
        type: reservation_entity_1.ReservationType.Equipment,
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
        type: reservation_entity_1.ReservationType.Equipment,
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
        type: reservation_entity_1.ReservationType.Venue,
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
(0, node_test_1.describe)(`${ROLES.TenantAdmin} reservation 角色测试`, () => {
    (0, node_test_1.default)('店长创建预约 — 正常流程填充分配 ID', () => {
        const ctrl = makeController();
        const result = ctrl.createReservation(tenantCtx(), DEFAULT_CREATE_BODY);
        strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Pending);
        strict_1.default.equal(result.resourceName, 'VIP Room');
        strict_1.default.equal(result.tenantId, TENANT_A);
        strict_1.default.ok(result.id.startsWith('reservation-'));
        strict_1.default.equal(result.duration, 120);
        strict_1.default.equal(result.price, 200);
    });
    (0, node_test_1.default)('店长查看本店所有预约 — 不包含其他租户数据', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        const results = ctrl.findAll(tenantCtx(), {});
        strict_1.default.ok(Array.isArray(results));
        // 当前租户有 4 条 + 新创建 0 = 4
        // 租户 B 有 1 条，不应出现
        for (const r of results) {
            strict_1.default.equal(r.tenantId, TENANT_A);
        }
    });
    (0, node_test_1.default)('店长查找特定预约详情 — 不存在时抛出 NotFound', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        strict_1.default.throws(() => {
            ctrl.findOne(tenantCtx(), 'nonexistent-id');
        }, /Reservation not found/);
    });
    (0, node_test_1.default)('店长取消预约 — 正常流程状态变为 cancelled', () => {
        const svc = makeService();
        const [id] = seedReservations(svc);
        const ctrl = makeController(svc);
        const result = ctrl.cancelReservation(tenantCtx(), id, '店长取消');
        strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Cancelled);
        strict_1.default.equal(result.cancelledReason, '店长取消');
    });
});
// ══════════════════════════════════════════════
// 🛒 前台 — 接待客户，处理即时预约
// ══════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.Reception} reservation 角色测试`, () => {
    (0, node_test_1.default)('前台为客户创建即时预约 — 正常流程含不同用户', () => {
        const svc = makeService();
        const ctrl = makeController(svc);
        const result = ctrl.createReservation(tenantCtx(), {
            ...DEFAULT_CREATE_BODY,
            userName: '李四',
            userId: 'u-02',
            resourceName: '普通卡座',
        });
        strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Pending);
        strict_1.default.equal(result.userName, '李四');
        strict_1.default.equal(result.resourceName, '普通卡座');
    });
    (0, node_test_1.default)('前台查询某客户所有预约记录 — 仅该客户数据', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        const results = ctrl.findByUser(tenantCtx(), 'u-01');
        strict_1.default.ok(Array.isArray(results));
        strict_1.default.ok(results.length >= 1);
        for (const r of results) {
            strict_1.default.equal(r.userId, 'u-01');
            strict_1.default.equal(r.tenantId, TENANT_A);
        }
    });
    (0, node_test_1.default)('前台创建预约时间非法 — 结束时间早于开始时间拒绝', () => {
        const ctrl = makeController();
        strict_1.default.throws(() => {
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
(0, node_test_1.describe)(`${ROLES.HR} reservation 角色测试`, () => {
    (0, node_test_1.default)('HR 为团建活动预约多功能厅 — 正常流程', () => {
        const ctrl = makeController();
        const result = ctrl.createReservation(tenantCtx(), {
            ...DEFAULT_CREATE_BODY,
            type: reservation_entity_1.ReservationType.Venue,
            resourceName: '多功能厅',
            duration: 240,
            price: 0,
        });
        strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Pending);
        strict_1.default.equal(result.resourceName, '多功能厅');
        strict_1.default.equal(result.price, 0); // 内部活动免费
    });
    (0, node_test_1.default)('HR 查询某时间段可用性 — 无冲突返回 false', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        // 空闲时间段
        const result = ctrl.checkConflict(tenantCtx(), 'room-101', '2026-06-25T08:00:00.000Z', '2026-06-25T09:00:00.000Z');
        strict_1.default.equal(result.hasConflict, false);
        // 冲突时间段 — 14:00-16:00 已被确认
        const conflictResult = ctrl.checkConflict(tenantCtx(), 'room-101', '2026-06-24T15:00:00.000Z', '2026-06-24T17:00:00.000Z');
        strict_1.default.equal(conflictResult.hasConflict, true);
    });
    (0, node_test_1.default)('HR 查看已完成的设备预约 — 状态过滤', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        const results = ctrl.findAll(tenantCtx(), {
            status: reservation_entity_1.ReservationStatus.Completed,
        });
        strict_1.default.ok(results.length >= 1);
        for (const r of results) {
            strict_1.default.equal(r.status, reservation_entity_1.ReservationStatus.Completed);
        }
    });
});
// ══════════════════════════════════════════════
// 🔧 安监 — 安全合规检查，查看所有资源使用
// ══════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.Safety} reservation 角色测试`, () => {
    (0, node_test_1.default)('安监查看所有预约 — 确保全部资源可追溯', () => {
        const svc = makeService();
        const ids = seedReservations(svc);
        const ctrl = makeController(svc);
        const results = ctrl.findAll(tenantCtx(), {});
        strict_1.default.ok(results.length >= 4);
        // 检查不同类型的预约都存在
        const types = new Set(results.map((r) => r.type));
        strict_1.default.ok(types.has(reservation_entity_1.ReservationType.Venue));
        strict_1.default.ok(types.has(reservation_entity_1.ReservationType.Equipment));
    });
    (0, node_test_1.default)('安监查看特定资源预约历史 — 安全审计', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        const results = ctrl.findByResource(tenantCtx(), 'room-101');
        strict_1.default.ok(Array.isArray(results));
        strict_1.default.ok(results.length >= 2); // 两条 room-101 预约
        for (const r of results) {
            strict_1.default.equal(r.resourceId, 'room-101');
        }
    });
    (0, node_test_1.default)('安监查看不同租户资源隔离 — 跨租户无权查看', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        // 租户 C 不应该有预约数据
        const results = ctrl.findAll(tenantCtx(TENANT_C), {});
        strict_1.default.equal(results.length, 0);
    });
});
// ══════════════════════════════════════════════
// 🎮 导玩员 — 设备管理和服务确认
// ══════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.Guide} reservation 角色测试`, () => {
    (0, node_test_1.default)('导玩员查询设备预约 — 按资源ID过滤', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        const results = ctrl.findByResource(tenantCtx(), 'gear-ps5-01');
        strict_1.default.ok(results.length >= 1);
        for (const r of results) {
            strict_1.default.equal(r.resourceId, 'gear-ps5-01');
        }
    });
    (0, node_test_1.default)('导玩员将预约标记为已确认 — 状态变更为 confirmed', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        const pending = svc.findAll(TENANT_A, { status: reservation_entity_1.ReservationStatus.Pending });
        strict_1.default.ok(pending.length >= 1);
        const result = ctrl.updateReservation(tenantCtx(), pending[0].id, {
            status: reservation_entity_1.ReservationStatus.Confirmed,
        });
        strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Confirmed);
    });
    (0, node_test_1.default)('导玩员无法从 Pending 直接变为 Completed — 无效状态流转', () => {
        const svc = makeService();
        const ctrl = makeController(svc);
        const r = ctrl.createReservation(tenantCtx(), {
            ...DEFAULT_CREATE_BODY,
            resourceId: 'gear-arcade-01',
            resourceName: '街机-01',
        });
        strict_1.default.throws(() => {
            ctrl.updateReservation(tenantCtx(), r.id, {
                status: reservation_entity_1.ReservationStatus.Completed,
            });
        }, /Invalid reservation status transition/);
    });
});
// ══════════════════════════════════════════════
// 🎯 运行专员 — 运营调度，查看当天+完成预约
// ══════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.Ops} reservation 角色测试`, () => {
    (0, node_test_1.default)('运行专员查看当天所有预约 — 时间段过滤', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        const results = ctrl.findByTimeRange(tenantCtx(), '2026-06-24T00:00:00.000Z', '2026-06-25T00:00:00.000Z');
        strict_1.default.ok(Array.isArray(results));
        strict_1.default.ok(results.length >= 3); // 至少 3 条当天数据
        for (const r of results) {
            strict_1.default.ok(r.startTime >= new Date('2026-06-24T00:00:00.000Z'));
            strict_1.default.ok(r.endTime <= new Date('2026-06-25T00:00:00.000Z'));
        }
    });
    (0, node_test_1.default)('运行专员将已确认预约开始服务 — 状态流转 InProgress', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        const confirmed = svc.findAll(TENANT_A, { status: reservation_entity_1.ReservationStatus.Confirmed });
        strict_1.default.ok(confirmed.length >= 1);
        const result = ctrl.updateReservation(tenantCtx(), confirmed[0].id, {
            status: reservation_entity_1.ReservationStatus.InProgress,
        });
        strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.InProgress);
    });
    (0, node_test_1.default)('运行专员完成进行中的预约 — Completed 状态变更', () => {
        const svc = makeService();
        const ctrl = makeController(svc);
        const r = ctrl.createReservation(tenantCtx(), DEFAULT_CREATE_BODY);
        // Pending → Confirmed → InProgress → Completed
        ctrl.updateReservation(tenantCtx(), r.id, { status: reservation_entity_1.ReservationStatus.Confirmed });
        ctrl.updateReservation(tenantCtx(), r.id, { status: reservation_entity_1.ReservationStatus.InProgress });
        const result = ctrl.updateReservation(tenantCtx(), r.id, {
            status: reservation_entity_1.ReservationStatus.Completed,
        });
        strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Completed);
    });
});
// ══════════════════════════════════════════════
// 🤝 团建 — 团队建设预约，批量或长时段
// ══════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.Teambuilding} reservation 角色测试`, () => {
    (0, node_test_1.default)('团建专员预约户外拓展场地 — 正常流程', () => {
        const ctrl = makeController();
        const result = ctrl.createReservation(tenantCtx(), {
            ...DEFAULT_CREATE_BODY,
            type: reservation_entity_1.ReservationType.Venue,
            resourceName: '户外拓展区',
            duration: 360,
            price: 500,
            deposit: 100,
            remark: '季度团队建设活动',
        });
        strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Pending);
        strict_1.default.equal(result.resourceName, '户外拓展区');
        strict_1.default.equal(result.duration, 360);
        strict_1.default.equal(result.remark, '季度团队建设活动');
    });
    (0, node_test_1.default)('团建专员查询团队历史预约 — 按用户查找', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        // 查找团队负责人为 u-01 的预约
        const results = ctrl.findByUser(tenantCtx(), 'u-01');
        strict_1.default.ok(results.length >= 1);
        for (const r of results) {
            strict_1.default.equal(r.userId, 'u-01');
        }
    });
    (0, node_test_1.default)('团建专员检查场地可用性 — 无冲突时返回 false', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        // 空闲时段
        const result = ctrl.checkConflict(tenantCtx(), 'room-101', '2026-06-26T08:00:00.000Z', '2026-06-26T12:00:00.000Z');
        strict_1.default.equal(result.hasConflict, false);
    });
});
// ══════════════════════════════════════════════
// 📢 营销 — 活动营销场地预约，对接市场活动
// ══════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.Marketing} reservation 角色测试`, () => {
    (0, node_test_1.default)('营销专员预约中庭广场办活动 — 正常流程', () => {
        const ctrl = makeController();
        const result = ctrl.createReservation(tenantCtx(), {
            ...DEFAULT_CREATE_BODY,
            type: reservation_entity_1.ReservationType.Venue,
            resourceName: '中庭广场',
            duration: 480,
            price: 1000,
            deposit: 300,
            remark: '新品发布会',
        });
        strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Pending);
        strict_1.default.equal(result.resourceName, '中庭广场');
        strict_1.default.equal(result.remark, '新品发布会');
    });
    (0, node_test_1.default)('营销专员取消不适合的活动预约 — 带取消原因', () => {
        const svc = makeService();
        const ctrl = makeController(svc);
        const r = ctrl.createReservation(tenantCtx(), {
            ...DEFAULT_CREATE_BODY,
            resourceName: '外场展区',
            remark: '春季促销路演',
        });
        const result = ctrl.cancelReservation(tenantCtx(), r.id, '天气原因取消');
        strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Cancelled);
        strict_1.default.equal(result.cancelledReason, '天气原因取消');
    });
    (0, node_test_1.default)('营销专员不允许取消已完成活动预约 — 状态流转限制', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrl = makeController(svc);
        // 找一条 Completed 状态的预约
        const completed = svc.findAll(TENANT_A, { status: reservation_entity_1.ReservationStatus.Completed });
        if (completed.length > 0) {
            strict_1.default.throws(() => {
                ctrl.updateReservation(tenantCtx(), completed[0].id, {
                    status: reservation_entity_1.ReservationStatus.Cancelled,
                });
            }, /Invalid reservation status transition/);
        }
    });
});
// ══════════════════════════════════════════════
// 🌐 跨角色通用测试 — 租户隔离 + 边界条件
// ══════════════════════════════════════════════
(0, node_test_1.describe)('reservation 通用隔离与边界测试', () => {
    (0, node_test_1.default)('租户隔离 — 租户 A 看不到租户 B 的预约', () => {
        const svc = makeService();
        seedReservations(svc);
        const ctrlA = makeController(svc);
        const ctrlB = makeController(svc);
        const resultsA = ctrlA.findAll(tenantCtx(TENANT_A), {});
        const resultsB = ctrlB.findAll(tenantCtx(TENANT_B), {});
        strict_1.default.ok(resultsA.length >= 4);
        strict_1.default.ok(resultsB.length >= 1);
        // 交叉验证
        for (const r of resultsA) {
            strict_1.default.notEqual(r.tenantId, TENANT_B);
        }
        for (const r of resultsB) {
            strict_1.default.notEqual(r.tenantId, TENANT_A);
        }
    });
    (0, node_test_1.default)('缺少必填参数 findByTimeRange — 空参数不会被传到端点', () => {
        // findByTimeRange 在 controller 层做了校验
        const ctrl = makeController();
        strict_1.default.throws(() => {
            ctrl.findByTimeRange(tenantCtx(), '', '');
        });
    });
    (0, node_test_1.default)('缺少必填参数 checkConflict — 抛出错误', () => {
        const ctrl = makeController();
        strict_1.default.throws(() => {
            ctrl.checkConflict(tenantCtx(), '', '', '');
        });
    });
    (0, node_test_1.default)('创建预约后 createdAt / updatedAt 被正确设置', () => {
        const ctrl = makeController();
        const result = ctrl.createReservation(tenantCtx(), DEFAULT_CREATE_BODY);
        strict_1.default.ok(result.createdAt instanceof Date);
        strict_1.default.ok(result.updatedAt instanceof Date);
        strict_1.default.ok(result.createdAt.getTime() > 0);
    });
    (0, node_test_1.default)('取消已取消的预约 — 重复取消被拒绝', () => {
        const svc = makeService();
        const ctrl = makeController(svc);
        const r = ctrl.createReservation(tenantCtx(), DEFAULT_CREATE_BODY);
        // 第一次取消成功
        ctrl.cancelReservation(tenantCtx(), r.id, '原因1');
        // 第二次取消抛出错误（Cancelled 无出边状态流转）
        strict_1.default.throws(() => {
            ctrl.cancelReservation(tenantCtx(), r.id, '原因2');
        }, /Invalid reservation status transition/);
    });
    (0, node_test_1.default)('预约冲突检测 — 同一资源同一时间段重叠被拒绝', () => {
        const svc = makeService();
        const ctrl = makeController(svc);
        // 创建并确认一条预约
        const r1 = ctrl.createReservation(tenantCtx(), DEFAULT_CREATE_BODY);
        ctrl.updateReservation(tenantCtx(), r1.id, { status: reservation_entity_1.ReservationStatus.Confirmed });
        // 同一资源同一时间段的预约确认时触发冲突
        const r2 = ctrl.createReservation(tenantCtx(), {
            ...DEFAULT_CREATE_BODY,
            resourceId: 'room-101',
            userId: 'u-conflict',
            userName: '冲突用户',
        });
        strict_1.default.throws(() => {
            ctrl.updateReservation(tenantCtx(), r2.id, { status: reservation_entity_1.ReservationStatus.Confirmed });
        }, /is already booked/);
    });
    (0, node_test_1.default)('全类型预约创建 — Venue / Equipment / Service / Class 均支持', () => {
        const svc = makeService();
        const ctrl = makeController(svc);
        for (const type of Object.values(reservation_entity_1.ReservationType)) {
            const result = ctrl.createReservation(tenantCtx(), {
                ...DEFAULT_CREATE_BODY,
                type,
                resourceId: `res-${type}`,
                resourceName: `${type} 资源`,
            });
            strict_1.default.equal(result.type, type);
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Pending);
        }
    });
});
//# sourceMappingURL=reservation.role.test.js.map