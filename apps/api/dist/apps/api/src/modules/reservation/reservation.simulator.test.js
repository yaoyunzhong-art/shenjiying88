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
const reservation_service_1 = require("./reservation.service");
const reservation_entity_1 = require("./reservation.entity");
/**
 * 预约模块 Simulator 测试
 *
 * 模拟物理世界中的完整预约生命周期场景：
 * - 🕹️ 场地预约 → 确认 → 开始 → 完成
 * - ⚔️ 冲突检测场景
 * - 🔄 复杂状态流转
 * - 📊 统计聚合
 * - ⛑️ 边界与取消
 */
(0, node_test_1.describe)('Reservation - Simulator', () => {
    let service;
    // 固定 tenant
    const TENANT = 'sim-tenant-arcade';
    const TENANT_B = 'sim-tenant-esports';
    // ─── 基础预约构建器 ────────────────────────────────────────────────
    function makeReservation(overrides = {}) {
        return {
            tenantId: TENANT,
            type: reservation_entity_1.ReservationType.Venue,
            resourceId: 'venue-01',
            resourceName: 'VIP 包间 A',
            userId: 'user-001',
            userName: '张三',
            startTime: '2026-06-25T10:00:00.000Z',
            endTime: '2026-06-25T12:00:00.000Z',
            duration: 120,
            price: 200,
            deposit: 50,
            ...overrides,
        };
    }
    function createAndConfirm(input) {
        const r = service.create(input);
        return service.confirm(r.id, input.tenantId);
    }
    node_test_1.default.beforeEach(() => {
        service = new reservation_service_1.ReservationService();
    });
    // ═════════════════════════════════════════════════════════════════
    // 场景 A：完整预约生命周期（场地预约）
    // ═════════════════════════════════════════════════════════════════
    (0, node_test_1.describe)('Scenario A — 场地预约完整生命周期', () => {
        (0, node_test_1.default)('A1: 创建预约 → 确认 → 开始 → 完成', () => {
            const input = makeReservation();
            // 1. 创建（待确认）
            const created = service.create(input);
            strict_1.default.equal(created.status, reservation_entity_1.ReservationStatus.Pending);
            strict_1.default.ok(created.id.startsWith('reservation-'));
            strict_1.default.equal(created.price, 200);
            strict_1.default.equal(created.deposit, 50);
            // 2. 确认
            const confirmed = service.confirm(created.id, TENANT);
            strict_1.default.equal(confirmed.status, reservation_entity_1.ReservationStatus.Confirmed);
            strict_1.default.ok(confirmed.updatedAt >= confirmed.createdAt);
            // 3. 开始使用
            const inProgress = service.startProgress(confirmed.id, TENANT);
            strict_1.default.equal(inProgress.status, reservation_entity_1.ReservationStatus.InProgress);
            // 4. 完成
            const completed = service.complete(inProgress.id, TENANT);
            strict_1.default.equal(completed.status, reservation_entity_1.ReservationStatus.Completed);
        });
        (0, node_test_1.default)('A2: 创建后可立即取消（未确认取消）', () => {
            const input = makeReservation();
            const created = service.create(input);
            const cancelled = service.cancel(created.id, TENANT, '客户行程变更');
            strict_1.default.equal(cancelled.status, reservation_entity_1.ReservationStatus.Cancelled);
            strict_1.default.equal(cancelled.cancelledReason, '客户行程变更');
            strict_1.default.ok(cancelled.cancelledAt);
        });
        (0, node_test_1.default)('A3: 确认后取消 — 押金不退场景', () => {
            const input = makeReservation({ deposit: 100, price: 300 });
            const confirmed = createAndConfirm(input);
            const cancelled = service.cancel(confirmed.id, TENANT, '超时未到店');
            strict_1.default.equal(cancelled.status, reservation_entity_1.ReservationStatus.Cancelled);
            strict_1.default.equal(cancelled.cancelledReason, '超时未到店');
        });
        (0, node_test_1.default)('A4: 已完成预约不可取消', () => {
            const input = makeReservation();
            const created = service.create(input);
            const confirmed = service.confirm(created.id, TENANT);
            const inProgress = service.startProgress(confirmed.id, TENANT);
            const completed = service.complete(inProgress.id, TENANT);
            strict_1.default.throws(() => service.cancel(completed.id, TENANT), /Invalid reservation status transition/);
        });
    });
    // ═════════════════════════════════════════════════════════════════
    // 场景 B：冲突检测（多人同时预约同一资源）
    // ═════════════════════════════════════════════════════════════════
    (0, node_test_1.describe)('Scenario B — 资源冲突检测', () => {
        (0, node_test_1.default)('B1: 同一场地同一时段冲突', () => {
            // 张三预约了 10:00-12:00 VIP包间A
            const zhang = createAndConfirm(makeReservation({
                userId: 'user-001',
                userName: '张三',
            }));
            // 李四预约同一场地 11:00-13:00 — 冲突
            const li = makeReservation({
                userId: 'user-002',
                userName: '李四',
                startTime: '2026-06-25T11:00:00.000Z',
                endTime: '2026-06-25T13:00:00.000Z',
            });
            const liCreated = service.create(li);
            strict_1.default.throws(() => service.confirm(liCreated.id, TENANT), /Resource venue-01 is already booked/);
        });
        (0, node_test_1.default)('B2: 相邻时段不冲突（10:00-12:00 vs 12:00-14:00）', () => {
            // 张三 10:00-12:00
            createAndConfirm(makeReservation({
                userId: 'user-001',
                startTime: '2026-06-25T10:00:00.000Z',
                endTime: '2026-06-25T12:00:00.000Z',
            }));
            // 李四 12:00-14:00 — 不冲突（临界点）
            const li = makeReservation({
                userId: 'user-002',
                userName: '李四',
                startTime: '2026-06-25T12:00:00.000Z',
                endTime: '2026-06-25T14:00:00.000Z',
            });
            const liCreated = service.create(li);
            const liConfirmed = service.confirm(liCreated.id, TENANT);
            strict_1.default.equal(liConfirmed.status, reservation_entity_1.ReservationStatus.Confirmed);
        });
        (0, node_test_1.default)('B3: 不同资源同时间段不冲突', () => {
            createAndConfirm(makeReservation({ resourceId: 'venue-01' }));
            const other = makeReservation({
                resourceId: 'venue-02',
                resourceName: 'VIP 包间 B',
                userId: 'user-002',
                userName: '李四',
            });
            const otherCreated = service.create(other);
            const confirmed = service.confirm(otherCreated.id, TENANT);
            strict_1.default.equal(confirmed.status, reservation_entity_1.ReservationStatus.Confirmed);
        });
        (0, node_test_1.default)('B4: 自己更新预约不与自己冲突', () => {
            const r = createAndConfirm(makeReservation({
                startTime: '2026-06-25T10:00:00.000Z',
                endTime: '2026-06-25T12:00:00.000Z',
            }));
            // 更新起止时间 - 确认时 excludeId 排除自己
            service.update(r.id, TENANT, {
                startTime: '2026-06-25T11:00:00.000Z',
                endTime: '2026-06-25T13:00:00.000Z',
            });
            // 没有冲突
        });
        (0, node_test_1.default)('B5: 跨租户不冲突', () => {
            // 租户A预约 venue-01
            createAndConfirm(makeReservation({ tenantId: TENANT, resourceId: 'venue-01' }));
            // 租户B预约同一资源 — 不同租户，不冲突（checkConflict基于tenantId过滤）
            const b = makeReservation({ tenantId: TENANT_B, resourceId: 'venue-01' });
            const bCreated = service.create(b);
            const bConfirmed = service.confirm(bCreated.id, TENANT_B);
            strict_1.default.equal(bConfirmed.status, reservation_entity_1.ReservationStatus.Confirmed);
        });
    });
    // ═════════════════════════════════════════════════════════════════
    // 场景 C：多类型预约混用（场地 + 设备 + 服务 + 课程）
    // ═════════════════════════════════════════════════════════════════
    (0, node_test_1.describe)('Scenario C — 多资源类型预约混用', () => {
        (0, node_test_1.default)('C1: 四种类型预约同时运作', () => {
            // 场地预约
            const venue = service.create(makeReservation({ type: reservation_entity_1.ReservationType.Venue }));
            service.confirm(venue.id, TENANT);
            // 设备预约（游戏外设）
            const equip = service.create(makeReservation({
                type: reservation_entity_1.ReservationType.Equipment,
                resourceId: 'equip-ps5-01',
                resourceName: 'PS5 手柄套装 #1',
                userId: 'user-002',
                userName: '李四',
            }));
            service.confirm(equip.id, TENANT);
            // 服务预约（教练陪玩）
            const svc = service.create(makeReservation({
                type: reservation_entity_1.ReservationType.Service,
                resourceId: 'coach-yoda',
                resourceName: '高级导玩员 Yoda',
                userId: 'user-003',
                userName: '王五',
                price: 150,
            }));
            service.confirm(svc.id, TENANT);
            // 课程预约
            const cls = service.create(makeReservation({
                type: reservation_entity_1.ReservationType.Class,
                resourceId: 'class-fgc-101',
                resourceName: '格斗游戏基础课',
                userId: 'user-004',
                userName: '赵六',
                duration: 90,
                price: 299,
            }));
            service.confirm(cls.id, TENANT);
            // 验证四种类型均可查到
            const all = service.findAll(TENANT);
            strict_1.default.equal(all.length, 4);
            const types = new Set(all.map((r) => r.type));
            strict_1.default.ok(types.has(reservation_entity_1.ReservationType.Venue));
            strict_1.default.ok(types.has(reservation_entity_1.ReservationType.Equipment));
            strict_1.default.ok(types.has(reservation_entity_1.ReservationType.Service));
            strict_1.default.ok(types.has(reservation_entity_1.ReservationType.Class));
        });
    });
    // ═════════════════════════════════════════════════════════════════
    // 场景 D：查询与搜索
    // ═════════════════════════════════════════════════════════════════
    (0, node_test_1.describe)('Scenario D — 查询与搜索', () => {
        (0, node_test_1.default)('D1: 按时间段查找预约', () => {
            // 创建三个不同时间的预约
            createAndConfirm(makeReservation({
                startTime: '2026-06-25T10:00:00.000Z',
                endTime: '2026-06-25T12:00:00.000Z',
            }));
            createAndConfirm(makeReservation({
                userId: 'user-002',
                userName: '李四',
                startTime: '2026-06-26T10:00:00.000Z',
                endTime: '2026-06-26T12:00:00.000Z',
            }));
            createAndConfirm(makeReservation({
                userId: 'user-003',
                userName: '王五',
                startTime: '2026-06-27T10:00:00.000Z',
                endTime: '2026-06-27T12:00:00.000Z',
            }));
            const result = service.findByTimeRange(TENANT, '2026-06-26T00:00:00.000Z', '2026-06-28T00:00:00.000Z');
            strict_1.default.equal(result.length, 2); // 6/26 和 6/27
        });
        (0, node_test_1.default)('D2: 按用户查找', () => {
            service.create(makeReservation({
                userId: 'user-zhang',
                startTime: '2026-06-25T10:00:00.000Z',
                endTime: '2026-06-25T12:00:00.000Z',
            }));
            service.create(makeReservation({
                userId: 'user-li',
                userName: '李四',
                startTime: '2026-06-26T10:00:00.000Z',
                endTime: '2026-06-26T12:00:00.000Z',
            }));
            service.create(makeReservation({
                userId: 'user-zhang',
                startTime: '2026-06-27T10:00:00.000Z',
                endTime: '2026-06-27T12:00:00.000Z',
            }));
            const zhangRes = service.findByUser(TENANT, 'user-zhang');
            strict_1.default.equal(zhangRes.length, 2);
            const liRes = service.findByUser(TENANT, 'user-li');
            strict_1.default.equal(liRes.length, 1);
        });
        (0, node_test_1.default)('D3: 按资源查找', () => {
            createAndConfirm(makeReservation({ resourceId: 'venue-vip' }));
            createAndConfirm(makeReservation({
                resourceId: 'venue-vip',
                userId: 'user-li',
                userName: '李四',
                startTime: '2026-06-26T10:00:00.000Z',
                endTime: '2026-06-26T12:00:00.000Z',
            }));
            createAndConfirm(makeReservation({
                resourceId: 'venue-standard',
                userId: 'user-wang',
                userName: '王五',
            }));
            const vipRes = service.findByResource(TENANT, 'venue-vip');
            strict_1.default.equal(vipRes.length, 2);
            const stdRes = service.findByResource(TENANT, 'venue-standard');
            strict_1.default.equal(stdRes.length, 1);
        });
    });
    // ═════════════════════════════════════════════════════════════════
    // 场景 E：统计聚合
    // ═════════════════════════════════════════════════════════════════
    (0, node_test_1.describe)('Scenario E — 统计聚合', () => {
        (0, node_test_1.default)('E1: 多样状态下的统计', () => {
            // 2 个待确认
            service.create(makeReservation());
            service.create(makeReservation({ userId: 'user-li', userName: '李四' }));
            // 2 个已确认
            createAndConfirm(makeReservation({
                userId: 'user-wang',
                userName: '王五',
                startTime: '2026-06-26T10:00:00.000Z',
                endTime: '2026-06-26T12:00:00.000Z',
            }));
            createAndConfirm(makeReservation({
                userId: 'user-zhao',
                userName: '赵六',
                startTime: '2026-06-27T10:00:00.000Z',
                endTime: '2026-06-27T12:00:00.000Z',
            }));
            // 1 个进行中
            const prog = createAndConfirm(makeReservation({
                userId: 'user-sun',
                userName: '孙七',
                startTime: '2026-06-28T10:00:00.000Z',
                endTime: '2026-06-28T12:00:00.000Z',
            }));
            service.startProgress(prog.id, TENANT);
            // 1 个已完成
            const done = createAndConfirm(makeReservation({
                userId: 'user-zhou',
                userName: '周八',
                startTime: '2026-06-24T10:00:00.000Z',
                endTime: '2026-06-24T12:00:00.000Z',
            }));
            service.startProgress(done.id, TENANT);
            service.complete(done.id, TENANT);
            // 1 个已取消
            const cancel = service.create(makeReservation({
                userId: 'user-wu',
                userName: '吴九',
                startTime: '2026-06-29T10:00:00.000Z',
                endTime: '2026-06-29T12:00:00.000Z',
            }));
            service.cancel(cancel.id, TENANT, '重复预约');
            const all = service.findAll(TENANT);
            const pending = all.filter((r) => r.status === reservation_entity_1.ReservationStatus.Pending).length;
            const confirmed = all.filter((r) => r.status === reservation_entity_1.ReservationStatus.Confirmed).length;
            const inProgress = all.filter((r) => r.status === reservation_entity_1.ReservationStatus.InProgress).length;
            const completed = all.filter((r) => r.status === reservation_entity_1.ReservationStatus.Completed).length;
            const cancelled = all.filter((r) => r.status === reservation_entity_1.ReservationStatus.Cancelled).length;
            strict_1.default.equal(all.length, 7);
            strict_1.default.equal(pending, 2);
            strict_1.default.equal(confirmed, 2);
            strict_1.default.equal(inProgress, 1);
            strict_1.default.equal(completed, 1);
            strict_1.default.equal(cancelled, 1);
        });
    });
    // ═════════════════════════════════════════════════════════════════
    // 场景 F：边界与异常
    // ═════════════════════════════════════════════════════════════════
    (0, node_test_1.describe)('Scenario F — 边界与异常', () => {
        (0, node_test_1.default)('F1: 创建预约 endTime < startTime 报错', () => {
            strict_1.default.throws(() => service.create(makeReservation({
                startTime: '2026-06-25T14:00:00.000Z',
                endTime: '2026-06-25T12:00:00.000Z',
            })), /endTime must be after startTime/);
        });
        (0, node_test_1.default)('F2: 查询不存在的预约返回 undefined', () => {
            const found = service.findOne('non-existent-reservation', TENANT);
            strict_1.default.equal(found, undefined);
        });
        (0, node_test_1.default)('F3: 操作其他租户的预约报错', () => {
            const r = service.create(makeReservation({ tenantId: TENANT }));
            // 其他租户 findOne 返回 undefined（非抛出异常）
            const found = service.findOne(r.id, TENANT_B);
            strict_1.default.equal(found, undefined);
            // cancel 会 assertOwned，应报错
            strict_1.default.throws(() => service.cancel(r.id, TENANT_B), /Reservation not found/);
        });
        (0, node_test_1.default)('F4: 无效状态转移', () => {
            const r = service.create(makeReservation());
            service.confirm(r.id, TENANT);
            service.startProgress(r.id, TENANT);
            service.complete(r.id, TENANT);
            // 已完成 → 确认（无效）
            strict_1.default.throws(() => service.confirm(r.id, TENANT), /Invalid reservation status transition/);
        });
        (0, node_test_1.default)('F5: 已取消不能再次取消', () => {
            const r = service.create(makeReservation());
            service.cancel(r.id, TENANT);
            strict_1.default.throws(() => service.cancel(r.id, TENANT), /Invalid reservation status transition/);
        });
        (0, node_test_1.default)('F6: 待确认的预约未确认时与其他已确认预约不冲突', () => {
            // 已确认预约
            createAndConfirm(makeReservation({
                startTime: '2026-06-25T10:00:00.000Z',
                endTime: '2026-06-25T12:00:00.000Z',
            }));
            // 待确认预约（同一时间） — 不冲突检测（只有 confirmed 状态才参与冲突检测）
            const pending = service.create(makeReservation({
                userId: 'user-li',
                userName: '李四',
                startTime: '2026-06-25T10:00:00.000Z',
                endTime: '2026-06-25T12:00:00.000Z',
            }));
            // 确认时应当触发冲突
            strict_1.default.throws(() => service.confirm(pending.id, TENANT), /already booked/);
        });
        (0, node_test_1.default)('F7: checkConflict 返回是否冲突', () => {
            createAndConfirm(makeReservation({
                startTime: '2026-06-25T10:00:00.000Z',
                endTime: '2026-06-25T12:00:00.000Z',
            }));
            // 冲突
            strict_1.default.throws(() => service.checkConflict(TENANT, 'venue-01', '2026-06-25T11:00:00.000Z', '2026-06-25T13:00:00.000Z'), /already booked/);
            // 不冲突
            service.checkConflict(TENANT, 'venue-01', '2026-06-25T13:00:00.000Z', '2026-06-25T15:00:00.000Z');
            // 不抛异常即可
        });
    });
    // ═════════════════════════════════════════════════════════════════
    // 场景 G：运营批量场景（导玩员调度 + 团建预约）
    // ═════════════════════════════════════════════════════════════════
    (0, node_test_1.describe)('Scenario G — 运营批量场景', () => {
        (0, node_test_1.default)('G1: 团建包场 — 批量预约 + 取消释放资源', () => {
            // 团建预约：6人同时预约不同资源
            const partyMembers = [
                { userId: 'party-a', userName: '团建-阿花' },
                { userId: 'party-b', userName: '团建-阿强' },
                { userId: 'party-c', userName: '团建-小明' },
                { userId: 'party-d', userName: '团建-小红' },
                { userId: 'party-e', userName: '团建-阿杰' },
                { userId: 'party-f', userName: '团建-阿丽' },
            ];
            const reservations = partyMembers.map((m, i) => service.create(makeReservation({
                userId: m.userId,
                userName: m.userName,
                resourceId: `venue-p${i + 1}`,
                resourceName: `团建包间 ${i + 1}`,
                startTime: '2026-06-28T14:00:00.000Z',
                endTime: '2026-06-28T18:00:00.000Z',
            })));
            // 全部确认
            const confirmed = reservations.map((r) => service.confirm(r.id, TENANT));
            strict_1.default.equal(confirmed.length, 6);
            strict_1.default.ok(confirmed.every((c) => c.status === reservation_entity_1.ReservationStatus.Confirmed));
            // 中途 2 人取消
            service.cancel(reservations[0].id, TENANT, '团建人数减少');
            service.cancel(reservations[3].id, TENANT, '团建人数减少');
            // 剩余 4 人进行中 → 完成
            const inProgress = confirmed
                .filter((r) => r.status === reservation_entity_1.ReservationStatus.Confirmed)
                .map((r) => service.startProgress(r.id, TENANT));
            strict_1.default.equal(inProgress.length, 4);
            inProgress.forEach((r) => service.complete(r.id, TENANT));
            // 验证最终状态
            const all = service.findAll(TENANT);
            strict_1.default.equal(all.length, 6);
            strict_1.default.equal(all.filter((r) => r.status === reservation_entity_1.ReservationStatus.Completed).length, 4);
            strict_1.default.equal(all.filter((r) => r.status === reservation_entity_1.ReservationStatus.Cancelled).length, 2);
        });
        (0, node_test_1.default)('G2: 导玩员日程排班 — 服务类预约不可重叠', () => {
            // 导玩员 coach-yoda 在 10:00-12:00 有课
            const session1 = service.create(makeReservation({
                type: reservation_entity_1.ReservationType.Service,
                resourceId: 'coach-yoda',
                resourceName: '高级导玩员 Yoda',
                userId: 'student-001',
                userName: '学员小王',
                startTime: '2026-06-25T10:00:00.000Z',
                endTime: '2026-06-25T12:00:00.000Z',
                price: 200,
            }));
            service.confirm(session1.id, TENANT);
            // 另一个学员预约重叠时间段 — 冲突
            const session2 = service.create(makeReservation({
                type: reservation_entity_1.ReservationType.Service,
                resourceId: 'coach-yoda',
                resourceName: '高级导玩员 Yoda',
                userId: 'student-002',
                userName: '学员小李',
                startTime: '2026-06-25T11:00:00.000Z',
                endTime: '2026-06-25T13:00:00.000Z',
                price: 200,
            }));
            strict_1.default.throws(() => service.confirm(session2.id, TENANT), /already booked/);
        });
        (0, node_test_1.default)('G3: 批量注入 — 大量预约性能验证', () => {
            const count = 100;
            for (let i = 0; i < count; i++) {
                service.create(makeReservation({
                    userId: `perf-user-${i}`,
                    userName: `性能测试用户 ${i}`,
                    resourceId: i % 2 === 0 ? 'venue-even' : 'venue-odd',
                    startTime: `2026-07-${String((i % 30) + 1).padStart(2, '0')}T10:00:00.000Z`,
                    endTime: `2026-07-${String((i % 30) + 1).padStart(2, '0')}T12:00:00.000Z`,
                }));
            }
            const all = service.findAll(TENANT);
            strict_1.default.equal(all.length, count);
            // 按资源分组
            const evenRes = service.findByResource(TENANT, 'venue-even');
            const oddRes = service.findByResource(TENANT, 'venue-odd');
            strict_1.default.equal(evenRes.length + oddRes.length, count);
        });
    });
});
//# sourceMappingURL=reservation.simulator.test.js.map