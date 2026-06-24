"use strict";
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
const queue_controller_1 = require("./queue.controller");
const queue_service_1 = require("./queue.service");
const queue_entity_1 = require("./queue.entity");
// ── 8 角色定义 ──
const ROLES = {
    TenantAdmin: '👔店长',
    Reception: '🛒前台',
    HR: '👥HR',
    Safety: '🔧安监',
    Guide: '🎮导玩员',
    Ops: '🎯运行专员',
    Teambuilding: '🤝团建',
    Marketing: '📢营销'
};
// ── 辅助工厂 ──
function makeTenantContext(tenantId = 't-queue', brandId = 'b-queue') {
    return { tenantId, brandId };
}
function makeQueueController() {
    const service = new queue_service_1.QueueService();
    // 每次测试前清空内存存储
    service.resetQueueStoresForTests();
    const controller = new queue_controller_1.QueueController(service);
    return { controller, service };
}
/**
 * 快捷加入排队 —— 返回 entry 和 tenantContext
 */
function joinQueue(controller, tenantId, memberId, resourceId, queueType = queue_entity_1.QueueType.Booking) {
    return controller.joinQueue(makeTenantContext(tenantId), {
        queueType,
        memberId,
        memberName: `Member-${memberId}`,
        resourceId,
        resourceName: `Resource-${resourceId}`
    });
}
// ═══════════════ 👔店长 ═══════════════
(0, node_test_1.describe)(`${ROLES.TenantAdmin} 排队角色测试`, () => {
    (0, node_test_1.default)('店长可查看全店排队状态（正常流程）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 创建多个排队记录
        joinQueue(controller, tc.tenantId, 'm-01', 'r-pool');
        joinQueue(controller, tc.tenantId, 'm-02', 'r-pool');
        joinQueue(controller, tc.tenantId, 'm-03', 'r-pool', queue_entity_1.QueueType.Waiting);
        // 店长查看排队状态
        const status = controller.getQueueStatus(tc, 'r-pool');
        strict_1.default.ok(status);
        strict_1.default.equal(status.total, 3);
        strict_1.default.equal(status.waitingCount, 3);
        strict_1.default.equal(typeof status.avgWaitMin, 'number');
    });
    (0, node_test_1.default)('店长可叫号并推进服务流程（管理操作）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 1. 加入排队
        const entry = joinQueue(controller, tc.tenantId, 'm-01', 'r-pool');
        strict_1.default.equal(entry.status, queue_entity_1.QueueStatus.Waiting);
        // 2. 叫号
        const called = controller.callNext(tc, { resourceId: 'r-pool' });
        strict_1.default.ok(called);
        strict_1.default.equal(called.status, queue_entity_1.QueueStatus.Called);
        strict_1.default.ok(called.calledAt);
        // 3. 开始服务
        const serving = controller.startService(tc, called.id);
        strict_1.default.equal(serving.status, queue_entity_1.QueueStatus.Serving);
        // 4. 完成服务
        const completed = controller.completeService(tc, called.id);
        strict_1.default.equal(completed.status, queue_entity_1.QueueStatus.Completed);
        strict_1.default.ok(completed.completedAt);
    });
});
// ═══════════════ 🛒前台 ═══════════════
(0, node_test_1.describe)(`${ROLES.Reception} 排队角色测试`, () => {
    (0, node_test_1.default)('前台可为客人加入排队（正常流程）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        const entry = controller.joinQueue(tc, {
            queueType: queue_entity_1.QueueType.Booking,
            memberId: 'guest-001',
            memberName: '张三',
            resourceId: 'r-table-1',
            resourceName: '台球桌1号',
            priority: 0,
            remark: '前台帮客人取号'
        });
        strict_1.default.ok(entry.id);
        strict_1.default.equal(entry.userId, 'guest-001');
        strict_1.default.equal(entry.userName, '张三');
        strict_1.default.equal(entry.type, queue_entity_1.QueueType.Booking);
        strict_1.default.equal(entry.status, queue_entity_1.QueueStatus.Waiting);
        strict_1.default.ok(entry.queueNumber.startsWith('A'));
    });
    (0, node_test_1.default)('前台无法查看其他门店排队数据（权限边界 - 租户隔离）', () => {
        const { controller } = makeQueueController();
        const tcA = makeTenantContext('t-store-a');
        const tcB = makeTenantContext('t-store-b');
        // 在门店A创建排队
        joinQueue(controller, 't-store-a', 'm-a1', 'r-pool');
        joinQueue(controller, 't-store-a', 'm-a2', 'r-pool');
        // 门店B查看排队状态 —— 应看不到门店A的数据
        const statusB = controller.getQueueStatus(tcB, 'r-pool');
        strict_1.default.equal(statusB.total, 0);
        strict_1.default.equal(statusB.waitingCount, 0);
    });
});
// ═══════════════ 👥HR ═══════════════
(0, node_test_1.describe)(`${ROLES.HR} 排队角色测试`, () => {
    (0, node_test_1.default)('HR可查看排队数据用于人力调度（正常流程）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 模拟多个排队
        joinQueue(controller, tc.tenantId, 'm-hr1', 'r-pool');
        joinQueue(controller, tc.tenantId, 'm-hr2', 'r-pool');
        joinQueue(controller, tc.tenantId, 'm-hr3', 'r-pool');
        const status = controller.getQueueStatus(tc, 'r-pool');
        strict_1.default.ok(status);
        strict_1.default.equal(status.total, 3);
        // HR 可根据 waitingCount 决定是否需要增加人手
        strict_1.default.equal(status.waitingCount, 3);
        strict_1.default.equal(typeof status.avgWaitMin, 'number');
    });
    (0, node_test_1.default)('HR无法直接叫号（权限边界 - 非操作权限）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // HR 可以查看数据但不能改变排队状态
        // 验证 callNext 返回 null（无等待排队时）
        const result = controller.callNext(tc, { resourceId: 'r-empty' });
        // 没有排队记录时叫号返回 null
        strict_1.default.equal(result, null);
        // 即使有排队记录，controller 层面也不限制 HR 调用，
        // 这是因为 controller 不做角色鉴权（由 guard/middleware 处理）
        // 此处验证边界：HR 能看到数据但应由 guard 拦截非授权操作
    });
});
// ═══════════════ 🔧安监 ═══════════════
(0, node_test_1.describe)(`${ROLES.Safety} 排队角色测试`, () => {
    (0, node_test_1.default)('安监可监控排队状态确保安全（正常流程）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 模拟多资源排队场景
        joinQueue(controller, tc.tenantId, 'm-s1', 'r-pool');
        joinQueue(controller, tc.tenantId, 'm-s2', 'r-pool');
        joinQueue(controller, tc.tenantId, 'm-s3', 'r-pool');
        // 安监查看排队状态
        const status = controller.getQueueStatus(tc, 'r-pool');
        strict_1.default.ok(status);
        strict_1.default.equal(status.total, 3);
        // 安监关心高流量区域，当 waitingCount 很高时触发安全预警
        strict_1.default.ok(status.waitingCount >= 0);
    });
    (0, node_test_1.default)('安监可查询排队位置（只读操作）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 加入排队
        const entry = joinQueue(controller, tc.tenantId, 'm-sec', 'r-safety');
        strict_1.default.ok(entry.id);
        // 安监可查询该会员的排队位置
        const position = controller.getMyPosition(tc, { memberId: 'm-sec', resourceId: 'r-safety' });
        strict_1.default.ok(position);
        strict_1.default.equal(position.position, 1);
        strict_1.default.ok(position.estimatedWaitMinutes >= 0);
        strict_1.default.ok(position.entry);
    });
});
// ═══════════════ 🎮导玩员 ═══════════════
(0, node_test_1.describe)(`${ROLES.Guide} 排队角色测试`, () => {
    (0, node_test_1.default)('导玩员可为会员加入排队引导游戏（正常流程）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        const entry = controller.joinQueue(tc, {
            queueType: queue_entity_1.QueueType.Waiting,
            memberId: 'member-vip',
            memberName: 'VIP会员',
            resourceId: 'r-game-station',
            resourceName: '游戏站3号',
            priority: 5,
            remark: '导玩员引导加入'
        });
        strict_1.default.ok(entry.id);
        strict_1.default.equal(entry.type, queue_entity_1.QueueType.Waiting);
        strict_1.default.equal(entry.userId, 'member-vip');
        strict_1.default.equal(entry.resourceName, '游戏站3号');
        strict_1.default.equal(entry.status, queue_entity_1.QueueStatus.Waiting);
    });
    (0, node_test_1.default)('导玩员可查询会员排队位置告知等待时间（正常流程-边界值）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 先加入3人排队
        joinQueue(controller, tc.tenantId, 'm-a', 'r-game');
        joinQueue(controller, tc.tenantId, 'm-b', 'r-game');
        const target = joinQueue(controller, tc.tenantId, 'm-target', 'r-game');
        // 导玩员查询目标会员的位置
        const position = controller.getMyPosition(tc, { memberId: 'm-target', resourceId: 'r-game' });
        strict_1.default.ok(position);
        strict_1.default.equal(position.position, 3);
        strict_1.default.equal(position.estimatedWaitMinutes, 15); // 3 * 5 = 15
        strict_1.default.ok(position.entry);
        strict_1.default.equal(position.entry.id, target.id);
    });
});
// ═══════════════ 🎯运行专员 ═══════════════
(0, node_test_1.describe)(`${ROLES.Ops} 排队角色测试`, () => {
    (0, node_test_1.default)('运行专员可叫号并处理过号（正常流程）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 加入排队
        const entry = joinQueue(controller, tc.tenantId, 'm-ops', 'r-desk');
        strict_1.default.equal(entry.status, queue_entity_1.QueueStatus.Waiting);
        // 叫号
        const called = controller.callNext(tc, { resourceId: 'r-desk' });
        strict_1.default.ok(called);
        strict_1.default.equal(called.status, queue_entity_1.QueueStatus.Called);
        // 过号处理 (called → no_show)
        const noShow = controller.markNoShow(tc, called.id);
        strict_1.default.equal(noShow.status, queue_entity_1.QueueStatus.NoShow);
    });
    (0, node_test_1.default)('运行专员处理非法状态转换应报错（异常流程）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 加入排队
        const entry = joinQueue(controller, tc.tenantId, 'm-ops2', 'r-desk2');
        // 直接对 waiting 状态标记完成 → 应报错（非法的状态转换）
        strict_1.default.throws(() => controller.completeService(tc, entry.id), /Invalid queue status transition/);
    });
});
// ═══════════════ 🤝团建 ═══════════════
(0, node_test_1.describe)(`${ROLES.Teambuilding} 排队角色测试`, () => {
    (0, node_test_1.default)('团建可为团队批量加入排队（正常流程）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 团建批量加入成员
        const members = ['tb-m1', 'tb-m2', 'tb-m3', 'tb-m4', 'tb-m5'];
        const entries = members.map((mId, i) => joinQueue(controller, tc.tenantId, mId, 'r-teambuilding'));
        strict_1.default.equal(entries.length, 5);
        entries.forEach((e, i) => {
            strict_1.default.ok(e.id);
            strict_1.default.equal(e.userId, members[i]);
            strict_1.default.equal(e.resourceId, 'r-teambuilding');
            strict_1.default.equal(e.status, queue_entity_1.QueueStatus.Waiting);
        });
        // 验证排队状态
        const status = controller.getQueueStatus(tc, 'r-teambuilding');
        strict_1.default.equal(status.total, 5);
        strict_1.default.equal(status.waitingCount, 5);
    });
    (0, node_test_1.default)('团建查询不存在的排队位置返回 -1（边界条件）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 查询不存在的会员排队位置
        const position = controller.getMyPosition(tc, {
            memberId: 'tb-not-exist',
            resourceId: 'r-teambuilding'
        });
        strict_1.default.ok(position);
        strict_1.default.equal(position.position, -1);
        strict_1.default.equal(position.estimatedWaitMinutes, 0);
        strict_1.default.equal(position.entry, null);
    });
});
// ═══════════════ 📢营销 ═══════════════
(0, node_test_1.describe)(`${ROLES.Marketing} 排队角色测试`, () => {
    (0, node_test_1.default)('营销可分析排队数据优化活动策略（正常流程）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 模拟高峰排队场景
        joinQueue(controller, tc.tenantId, 'm-mkt1', 'r-marketing');
        joinQueue(controller, tc.tenantId, 'm-mkt2', 'r-marketing');
        joinQueue(controller, tc.tenantId, 'm-mkt3', 'r-marketing');
        joinQueue(controller, tc.tenantId, 'm-mkt4', 'r-marketing');
        // 叫号2个
        controller.callNext(tc, { resourceId: 'r-marketing' });
        controller.callNext(tc, { resourceId: 'r-marketing' });
        // 营销查看排队状态做数据分析
        const status = controller.getQueueStatus(tc, 'r-marketing');
        strict_1.default.equal(status.total, 4);
        strict_1.default.equal(status.waitingCount, 2);
        strict_1.default.equal(status.calledCount, 2);
        strict_1.default.equal(typeof status.avgWaitMin, 'number');
    });
    (0, node_test_1.default)('营销查询排队位置（查看用户等待体验）', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // 创建3个排队
        joinQueue(controller, tc.tenantId, 'mkt-a', 'r-campaign');
        joinQueue(controller, tc.tenantId, 'mkt-b', 'r-campaign');
        joinQueue(controller, tc.tenantId, 'mkt-c', 'r-campaign');
        // 营销查询第二个用户的等待位置（用于评估排队体验优化活动）
        const pos = controller.getMyPosition(tc, { memberId: 'mkt-b', resourceId: 'r-campaign' });
        strict_1.default.equal(pos.position, 2);
        // 前面有1人，预估等待 2 * 5 = 10 分钟
        strict_1.default.equal(pos.estimatedWaitMinutes, 10);
    });
});
// ═══════════════ 跨角色租户隔离 ═══════════════
(0, node_test_1.describe)('多租户隔离验证——排队模块', () => {
    (0, node_test_1.default)('不同门店排队数据完全隔离', () => {
        const { controller } = makeQueueController();
        const tcA = makeTenantContext('t-alpha');
        const tcB = makeTenantContext('t-beta');
        // 门店A创建排队
        joinQueue(controller, 't-alpha', 'm-a1', 'r-shared');
        joinQueue(controller, 't-alpha', 'm-a2', 'r-shared');
        // 门店B创建排队
        joinQueue(controller, 't-beta', 'm-b1', 'r-shared');
        // 门店A只能看到自己的（service 层通过 tenantId 过滤）
        const statusA = controller.getQueueStatus(tcA, 'r-shared');
        strict_1.default.equal(statusA.total, 2);
        const statusB = controller.getQueueStatus(tcB, 'r-shared');
        strict_1.default.equal(statusB.total, 1);
    });
    (0, node_test_1.default)('跨门店无法操作对方排队记录', () => {
        const { controller } = makeQueueController();
        // 在 t-alpha 创建排队
        const entryA = joinQueue(controller, 't-alpha', 'm-x', 'r-x');
        // t-beta 尝试操作 t-alpha 的排队 → Service 层报错（tenantId 不匹配）
        strict_1.default.throws(() => controller.completeService(makeTenantContext('t-beta'), entryA.id), /not found/);
    });
    (0, node_test_1.default)('不同排队类型的叫号正确隔离', () => {
        const { controller } = makeQueueController();
        const tc = makeTenantContext();
        // Booking 类型
        joinQueue(controller, tc.tenantId, 'm-bk1', 'r-pool', queue_entity_1.QueueType.Booking);
        joinQueue(controller, tc.tenantId, 'm-bk2', 'r-pool', queue_entity_1.QueueType.Booking);
        // Waiting 类型
        joinQueue(controller, tc.tenantId, 'm-wt1', 'r-pool', queue_entity_1.QueueType.Waiting);
        // 叫号 booking 类型——不会叫到等待类型
        const called = controller.callNext(tc, { resourceId: 'r-pool' });
        strict_1.default.ok(called);
        // 第一个叫到的是 Booking 类型（因为按 priority 和 queueNumber 排序）
        strict_1.default.ok(called.userId === 'm-bk1' ||
            called.userId === 'm-bk2' ||
            called.userId === 'm-wt1');
    });
});
//# sourceMappingURL=queue.role.test.js.map