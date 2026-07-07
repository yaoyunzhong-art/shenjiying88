import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [reservation] [D] controller spec 补全
 *
 * ReservationController 综合测试：
 * - 正例：正常创建、查询、状态流转
 * - 反例：参数校验失败、状态流转违规、资源冲突
 * - 边界：空结果、时间范围、越权访问
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { ReservationType, ReservationStatus } from './reservation.entity';
import type { RequestTenantContext } from '../tenant/tenant.types';

// ── Fixtures ──

const TENANT_A: RequestTenantContext = {
  tenantId: 't-res-a',
  brandId: 'brand-a',
  storeId: 'store-a',
  marketCode: 'SH',
};

const TENANT_B: RequestTenantContext = {
  tenantId: 't-res-b',
  brandId: 'brand-b',
  storeId: 'store-b',
  marketCode: 'BJ',
};

const NOW = '2026-06-24T08:00:00.000Z';
const ONE_HOUR_LATER = '2026-06-24T09:00:00.000Z';
const TWO_HOURS_LATER = '2026-06-24T10:00:00.000Z';
const THREE_HOURS_LATER = '2026-06-24T11:00:00.000Z';
const FOUR_HOURS_LATER = '2026-06-24T12:00:00.000Z';

function createController(): { ctrl: ReservationController; svc: ReservationService } {
  const svc = new ReservationService();
  const ctrl = new ReservationController(svc);
  return { ctrl, svc };
}

function makeCreateBody(overrides: Record<string, unknown> = {}) {
  return {
    type: ReservationType.Venue,
    resourceId: 'vr-arena-01',
    resourceName: 'VR 竞技场 1号',
    userId: 'user-zhang',
    userName: '张三',
    startTime: NOW,
    endTime: ONE_HOUR_LATER,
    duration: 60,
    price: 88,
    deposit: 20,
    ...overrides,
  };
}

function makeUpdateBody(overrides: Record<string, unknown> = {}) {
  return {
    ...overrides,
  };
}

// ── Helper: 创建并返回预约 ID ──
function createReservation(
  ctrl: ReservationController,
  ctx: RequestTenantContext = TENANT_A,
  overrides: Record<string, unknown> = {},
): string {
  const result = ctrl.createReservation(ctx, makeCreateBody(overrides));
  return (result as { id: string }).id;
}

// ══════════════════════════════════════════════════════════════════════
// 测试套件
// ══════════════════════════════════════════════════════════════════════

describe('ReservationController', () => {
  // ── POST /reservations 创建预约 ──

  describe('POST /reservations — 创建预约', () => {
    it('正例: 有效数据创建预约，返回完整实体', () => {
      const { ctrl } = createController();
      const body = makeCreateBody();
      const result = ctrl.createReservation(TENANT_A, body);

      assert.ok(result, '应返回结果');
      assert.ok((result as { id: string }).id, '应有 id');
      assert.equal((result as { tenantId: string }).tenantId, 't-res-a');
      assert.equal((result as { status: string }).status, ReservationStatus.Pending);
      assert.equal((result as { resourceName: string }).resourceName, 'VR 竞技场 1号');
      assert.equal((result as { userId: string }).userId, 'user-zhang');
      assert.equal((result as { duration: number }).duration, 60);
    });

    it('反例: endTime <= startTime 时抛出错误', () => {
      const { ctrl } = createController();
      const body = makeCreateBody({
        startTime: ONE_HOUR_LATER,
        endTime: NOW,
      });

      assert.throws(
        () => ctrl.createReservation(TENANT_A, body),
        /endTime must be after startTime/,
      );
    });

    it('边界: 不同租户创建相同资源预约互不干扰', () => {
      const { ctrl } = createController();
      const idA = createReservation(ctrl, TENANT_A);
      const idB = createReservation(ctrl, TENANT_B);

      assert.notEqual(idA, idB, 'id 应不相同');
      const resultA = ctrl.findOne(TENANT_A, idA) as { tenantId: string };
      assert.equal(resultA.tenantId, 't-res-a');
    });
  });

  // ── GET /reservations 查询列表 ──

  describe('GET /reservations — 查询列表', () => {
    it('正例: 返回同一租户所有预约', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      createReservation(ctrl, TENANT_A);
      createReservation(ctrl, TENANT_A, { type: ReservationType.Equipment });
      createReservation(ctrl, TENANT_B); // 不同租户

      const result = ctrl.findAll(TENANT_A, {}) as unknown as Array<Record<string, unknown>>;
      assert.equal(result.length, 2, '只返回 tenant_a 的 2 条');
    });

    it('正例: 按 type 筛选', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      createReservation(ctrl, TENANT_A); // Venue
      createReservation(ctrl, TENANT_A, { type: ReservationType.Equipment });
      createReservation(ctrl, TENANT_A, { type: ReservationType.Equipment });

      const result = ctrl.findAll(TENANT_A, {
        type: ReservationType.Equipment,
      }) as unknown as Array<Record<string, unknown>>;
      assert.equal(result.length, 2);
    });

    it('边界: 无预约时返回空数组', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const result = ctrl.findAll(TENANT_A, {}) as Array<unknown>;
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 0);
    });

    it('反例: 不同租户看不到对方预约', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      createReservation(ctrl, TENANT_A);
      const result = ctrl.findAll(TENANT_B, {}) as Array<unknown>;
      assert.equal(result.length, 0);
    });
  });

  // ── GET /reservations/:id 单个查询 ──

  describe('GET /reservations/:id — 单个查询', () => {
    it('正例: 根据 ID 查到预约', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A);
      const result = ctrl.findOne(TENANT_A, id) as { id: string };
      assert.equal(result.id, id);
    });

    it('反例: 不存在的 ID 抛出 404', () => {
      const { ctrl } = createController();
      assert.throws(
        () => ctrl.findOne(TENANT_A, 'non-existent-id'),
        (e: HttpException) => e.getStatus() === HttpStatus.NOT_FOUND,
      );
    });

    it('反例: 跨租户访问返回 404', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A);
      assert.throws(
        () => ctrl.findOne(TENANT_B, id),
        (e: HttpException) => e.getStatus() === HttpStatus.NOT_FOUND,
      );
    });
  });

  // ── GET 辅助查询 ──

  describe('GET /reservations/by-user/:userId', () => {
    it('正例: 按用户查询', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      createReservation(ctrl, TENANT_A);
      createReservation(ctrl, TENANT_A, { userId: 'user-li', userName: '李四' });
      createReservation(ctrl, TENANT_A, { userId: 'user-li', userName: '李四' });

      const result = ctrl.findByUser(TENANT_A, 'user-li') as Array<unknown>;
      assert.equal(result.length, 2);
    });

    it('边界: 用户无预约时返回 []', () => {
      const { ctrl } = createController();
      const result = ctrl.findByUser(TENANT_A, 'no-reservations') as Array<unknown>;
      assert.equal(result.length, 0);
    });
  });

  describe('GET /reservations/by-resource/:resourceId', () => {
    it('正例: 按资源查询', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
      createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
      createReservation(ctrl, TENANT_A, { resourceId: 'room-02' });

      const result = ctrl.findByResource(TENANT_A, 'room-01') as Array<unknown>;
      assert.equal(result.length, 2);
    });
  });

  describe('GET /reservations/by-timerange', () => {
    it('正例: 按时间范围筛选', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      createReservation(ctrl, TENANT_A, {
        startTime: '2026-06-24T10:00:00.000Z',
        endTime: '2026-06-24T11:00:00.000Z',
      });
      createReservation(ctrl, TENANT_A, {
        startTime: '2026-06-25T10:00:00.000Z',
        endTime: '2026-06-25T11:00:00.000Z',
      });

      const result = ctrl.findByTimeRange(
        TENANT_A,
        '2026-06-24T00:00:00.000Z',
        '2026-06-24T23:59:59.000Z',
      ) as Array<unknown>;
      assert.equal(result.length, 1);
    });

    it('反例: 缺少参数时抛出 400', () => {
      const { ctrl } = createController();
      assert.throws(
        () => ctrl.findByTimeRange(TENANT_A, '', ''),
        /startDate and endDate are required/,
      );
    });
  });

  // ── GET /reservations/check-conflict ──

  describe('GET /reservations/check-conflict', () => {
    it('正例: 无冲突返回 false', () => {
      const { ctrl } = createController();
      const result = ctrl.checkConflict(TENANT_A, 'room-01', NOW, ONE_HOUR_LATER) as {
        hasConflict: boolean;
      };
      assert.equal(result.hasConflict, false);
    });

    it('反例: 资源已预订返回 true', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      // 先创建并确认
      const id = createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
      ctrl.updateReservation(TENANT_A, id, { status: ReservationStatus.Confirmed });

      const result = ctrl.checkConflict(TENANT_A, 'room-01', NOW, ONE_HOUR_LATER) as {
        hasConflict: boolean;
      };
      assert.equal(result.hasConflict, true);
    });

    it('反例: 缺少必填参数抛出 400', () => {
      const { ctrl } = createController();
      assert.throws(
        () => ctrl.checkConflict(TENANT_A, null as unknown as string, null as unknown as string, null as unknown as string),
        /resourceId, startTime, and endTime are required/,
      );
    });

    it('边界: 确认后已取消的预约不产生冲突', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
      ctrl.updateReservation(TENANT_A, id, { status: ReservationStatus.Confirmed });
      ctrl.updateReservation(TENANT_A, id, { status: ReservationStatus.Cancelled });

      const result = ctrl.checkConflict(TENANT_A, 'room-01', NOW, ONE_HOUR_LATER) as {
        hasConflict: boolean;
      };
      assert.equal(result.hasConflict, false, '已取消的预约不冲突');
    });
  });

  // ── PATCH /reservations/:id 更新与状态流转 ──

  describe('PATCH /reservations/:id — 更新与状态流转', () => {
    it('正例: Pending → Confirmed', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A);
      const result = ctrl.updateReservation(TENANT_A, id, {
        status: ReservationStatus.Confirmed,
      }) as { status: ReservationStatus };
      assert.equal(result.status, ReservationStatus.Confirmed);
    });

    it('正例: Confirmed → InProgress → Completed 全流程', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A);
      ctrl.updateReservation(TENANT_A, id, { status: ReservationStatus.Confirmed });
      ctrl.updateReservation(TENANT_A, id, { status: ReservationStatus.InProgress });
      const result = ctrl.updateReservation(TENANT_A, id, {
        status: ReservationStatus.Completed,
      }) as { status: ReservationStatus };
      assert.equal(result.status, ReservationStatus.Completed);
    });

    it('正例: 更新非状态字段（price, remark）', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A);
      const result = ctrl.updateReservation(TENANT_A, id, {
        price: 128,
        remark: 'VIP 加时服务',
      }) as { price: number; remark: string };
      assert.equal(result.price, 128);
      assert.equal(result.remark, 'VIP 加时服务');
    });

    it('反例: Pending → Completed 非法流转', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A);
      assert.throws(
        () =>
          ctrl.updateReservation(TENANT_A, id, {
            status: ReservationStatus.Completed,
          }),
        /Invalid reservation status transition/,
      );
    });

    it('反例: Completed → Confirmed 逆向流转', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A);
      ctrl.updateReservation(TENANT_A, id, { status: ReservationStatus.Confirmed });
      ctrl.updateReservation(TENANT_A, id, { status: ReservationStatus.InProgress });
      ctrl.updateReservation(TENANT_A, id, { status: ReservationStatus.Completed });
      assert.throws(
        () =>
          ctrl.updateReservation(TENANT_A, id, {
            status: ReservationStatus.Confirmed,
          }),
        /Invalid reservation status transition/,
      );
    });

    it('反例: 跨租户更新抛出错误', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A);
      assert.throws(
        () =>
          ctrl.updateReservation(TENANT_B, id, {
            status: ReservationStatus.Confirmed,
          }),
        /Reservation not found/,
      );
    });
  });

  // ── DELETE /reservations/:id 取消 ──

  describe('DELETE /reservations/:id — 取消预约', () => {
    it('正例: 取消预约并记录原因', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A);
      const result = ctrl.cancelReservation(TENANT_A, id, '行程变更') as {
        status: ReservationStatus;
        cancelledReason: string;
      };
      assert.equal(result.status, ReservationStatus.Cancelled);
      assert.equal(result.cancelledReason, '行程变更');
    });

    it('反例: 已完成预约无法取消', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A);
      ctrl.updateReservation(TENANT_A, id, { status: ReservationStatus.Confirmed });
      ctrl.updateReservation(TENANT_A, id, { status: ReservationStatus.InProgress });
      ctrl.updateReservation(TENANT_A, id, { status: ReservationStatus.Completed });

      assert.throws(
        () => ctrl.cancelReservation(TENANT_A, id),
        /Invalid reservation status transition/,
      );
    });

    it('反例: 跨租户取消抛出错误', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id = createReservation(ctrl, TENANT_A);
      assert.throws(() => ctrl.cancelReservation(TENANT_B, id), /Reservation not found/);
    });
  });

  // ── 确认时的冲突检测（集成） ──

  describe('确认预约冲突检测', () => {
    it('反例: 同一资源同一时间确认冲突', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id1 = createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
      const id2 = createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });

      ctrl.updateReservation(TENANT_A, id1, { status: ReservationStatus.Confirmed });

      assert.throws(
        () =>
          ctrl.updateReservation(TENANT_A, id2, {
            status: ReservationStatus.Confirmed,
          }),
        /is already booked/,
      );
    });

    it('边界: 非重叠时间可以确认', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id1 = createReservation(ctrl, TENANT_A, {
        resourceId: 'room-01',
        startTime: NOW,
        endTime: ONE_HOUR_LATER,
      });
      const id2 = createReservation(ctrl, TENANT_A, {
        resourceId: 'room-01',
        startTime: TWO_HOURS_LATER,
        endTime: THREE_HOURS_LATER,
      });

      ctrl.updateReservation(TENANT_A, id1, { status: ReservationStatus.Confirmed });
      // 第二段不重叠，应正常确认
      const result = ctrl.updateReservation(TENANT_A, id2, {
        status: ReservationStatus.Confirmed,
      }) as { status: ReservationStatus };
      assert.equal(result.status, ReservationStatus.Confirmed);
    });

    it('边界: 不同资源不冲突', () => {
      const { ctrl, svc } = createController();
      svc.resetStoreForTests();

      const id1 = createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
      const id2 = createReservation(ctrl, TENANT_A, { resourceId: 'room-02' });

      ctrl.updateReservation(TENANT_A, id1, { status: ReservationStatus.Confirmed });
      const result = ctrl.updateReservation(TENANT_A, id2, {
        status: ReservationStatus.Confirmed,
      }) as { status: ReservationStatus };
      assert.equal(result.status, ReservationStatus.Confirmed);
    });
  });
});
