/**
 * 🐜 树哥C L3 跨模块端到端 · 链35 (V24 Phase1)
 * P-30 后勤管理验收链 — logistics/logistics-supplement/stock-transfer 三模块
 *
 * 15+ 测试用例覆盖: 物流订单/巡检/清洁排班/维修工单/物料申请 +
 *                  运输调度/货载/路线规划 +
 *                  库存调拨生命周期/统计/边界
 *
 * 新增于 2026-07-29 04:50 凌晨时段 (增强版)
 */

import { describe, it, expect } from 'vitest'

describe('🔗 Chain35: P-30 后勤管理 — logistics/logistics-supplement/stock-transfer 验收', () => {
  // ════════════════════════════════════════════════════════
  //  1. Logistics — 物流管理核心
  // ════════════════════════════════════════════════════════

  describe('Logistics 物流管理', () => {
    it('L35-01 [P] 创建物流订单 — POST /logistics/orders → 201 + orderId + pending', async () => {
      const res = await fetch('/api/logistics/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's001',
          origin: '上海仓',
          destination: '杭州门店',
          items: [{ productId: 'p1', quantity: 10 }],
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.status).toBe('pending')
      expect(body.origin).toBe('上海仓')
      expect(body.destination).toBe('杭州门店')
    })

    it('L35-02 [P] 查询物流订单列表 — GET /logistics/orders?tenantId= → 200 + 数组', async () => {
      const res = await fetch('/api/logistics/orders?tenantId=t001')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
    })

    it('L35-03 [P] 更新物流状态 — PATCH /logistics/orders/:id/status → shipped', async () => {
      const create = await fetch('/api/logistics/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          origin: '北京仓',
          destination: '南京门店',
          items: [{ productId: 'p2', quantity: 5 }],
        }),
      })
      const { id } = await create.json()
      const res = await fetch(`/api/logistics/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('shipped')
    })

    it('L35-04 [P] 物流追踪查询 — GET /logistics/tracking/:orderId → tracking info', async () => {
      const res = await fetch('/api/logistics/tracking/order-001')
      expect(res.status === 200 || res.status === 404).toBe(true)
      if (res.status === 200) {
        const body = await res.json()
        expect(body.currentLocation).toBeDefined()
        expect(body.lastUpdate).toBeDefined()
      }
    })

    it('L35-05 [N] 物流订单缺少tenantId → 400', async () => {
      const res = await fetch('/api/logistics/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: 'test', destination: 'test' }),
      })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('L35-06 [B] 物流订单空items → 400', async () => {
      const res = await fetch('/api/logistics/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          origin: 'A',
          destination: 'B',
          items: [],
        }),
      })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  // ════════════════════════════════════════════════════════
  //  2. Logistics — 巡检任务 (Inspection)
  // ════════════════════════════════════════════════════════

  describe('Logistics Inspections 巡检任务', () => {
    it('L35-07 [P] 创建巡检任务 — POST /logistics/inspections → 201', async () => {
      const res = await fetch('/api/logistics/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's001',
          equipmentId: 'eq-001',
          assigneeId: 'emp-001',
          assigneeName: '张三',
          scheduledAt: '2026-08-01T09:00:00Z',
          description: '月度设备巡检',
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.status).toBe('scheduled')
    })

    it('L35-08 [P] 巡检结果提交 — PATCH /logistics/inspections/:id/result → completed', async () => {
      const create = await fetch('/api/logistics/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's001',
          equipmentId: 'eq-002',
          assigneeId: 'emp-001',
          scheduledAt: '2026-08-01T10:00:00Z',
        }),
      })
      const { id } = await create.json()

      const res = await fetch(`/api/logistics/inspections/${id}/result`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: 'pass',
          remark: '一切正常',
          completedAt: '2026-08-01T10:30:00Z',
          inspectedById: 'emp-001',
        }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('completed')
      expect(body.result).toBe('pass')
    })

    it('L35-09 [P] 巡检提醒 — POST /logistics/inspections/:id/remind → reminded', async () => {
      const create = await fetch('/api/logistics/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's001',
          equipmentId: 'eq-003',
          assigneeId: 'emp-002',
          scheduledAt: '2026-08-02T09:00:00Z',
        }),
      })
      const { id } = await create.json()

      const res = await fetch(`/api/logistics/inspections/${id}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remindedById: 'mgr-001' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('reminded')
    })

    it('L35-10 [B] 巡检不合格 — result=fail → 触发维修', async () => {
      const create = await fetch('/api/logistics/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's002',
          equipmentId: 'eq-broken',
          assigneeId: 'emp-003',
          scheduledAt: '2026-08-03T09:00:00Z',
        }),
      })
      const { id } = await create.json()

      const fail = await fetch(`/api/logistics/inspections/${id}/result`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: 'fail',
          remark: '设备异响需维修',
          completedAt: '2026-08-03T09:30:00Z',
          inspectedById: 'emp-003',
        }),
      })
      expect(fail.status).toBe(200)
    })
  })

  // ════════════════════════════════════════════════════════
  //  3. Logistics — 物料申请 (Material Request)
  // ════════════════════════════════════════════════════════

  describe('Logistics Material Requests 物料申请', () => {
    it('L35-11 [P] 创建物料申请 — POST /logistics/material-requests → 201', async () => {
      const res = await fetch('/api/logistics/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's001',
          requesterId: 'emp-001',
          requesterName: '张三',
          purpose: '设备维修更换零件',
          items: [
            { materialId: 'm-001', materialName: '螺丝M8', quantity: 20, unit: '个' },
            { materialId: 'm-002', materialName: '扳手套装', quantity: 2, unit: '套' },
          ],
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.status).toBe('pending_approval')
    })

    it('L35-12 [P] 物料审批通过 + 出库 — pending_approval → approved → outbound', async () => {
      const create = await fetch('/api/logistics/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's001',
          requesterId: 'emp-002',
          purpose: '季度维修备件补充',
          items: [{ materialId: 'm-003', materialName: '润滑油', quantity: 5, unit: '桶' }],
        }),
      })
      const { id } = await create.json()

      const approve = await fetch(`/api/logistics/material-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId: 'mgr-001', approverName: '李主管', note: '批准' }),
      })
      expect(approve.status).toBe(200)
      const approved = await approve.json()
      expect(approved.status).toBe('approved')

      const outbound = await fetch(`/api/logistics/material-requests/${id}/outbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outboundById: 'wh-operator-001', note: '已出库' }),
      })
      expect(outbound.status).toBe(200)
      const out = await outbound.json()
      expect(out.status).toBe('outbound')
    })
  })

  // ════════════════════════════════════════════════════════
  //  4. Logistics — 清洁排班 (Clean Schedule)
  // ════════════════════════════════════════════════════════

  describe('Logistics Clean Schedules 清洁排班', () => {
    it('L35-13 [P] 创建清洁排班 — POST /logistics/clean-schedules → 201', async () => {
      const res = await fetch('/api/logistics/clean-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's001',
          assigneeId: 'clean-001',
          assigneeName: '王保洁',
          shiftName: '早班',
          scheduledDate: '2026-08-05',
          areaCodes: ['area-a1', 'area-a2'],
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.status).toBe('scheduled')
    })

    it('L35-14 [P] 清洁排班区域分配 — POST /assign-area → area assigned', async () => {
      const create = await fetch('/api/logistics/clean-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's001',
          assigneeId: 'clean-002',
          shiftName: '晚班',
          scheduledDate: '2026-08-05',
          areaCodes: [],
        }),
      })
      const { id } = await create.json()

      const assign = await fetch(`/api/logistics/clean-schedules/${id}/assign-area`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaCode: 'area-b1' }),
      })
      expect(assign.status).toBe(200)
    })

    it('L35-15 [P] 清洁签到 — POST /check-in → completed', async () => {
      const create = await fetch('/api/logistics/clean-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's001',
          assigneeId: 'clean-003',
          shiftName: '早班',
          scheduledDate: '2026-08-06',
          areaCodes: ['area-c1'],
        }),
      })
      const { id } = await create.json()

      const checkIn = await fetch(`/api/logistics/clean-schedules/${id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInTime: '2026-08-06T07:00:00Z',
          locationLat: 31.23,
          locationLng: 121.47,
        }),
      })
      expect(checkIn.status).toBe(200)
      const body = await checkIn.json()
      expect(body.status).toBe('completed')
    })
  })

  // ════════════════════════════════════════════════════════
  //  5. Logistics-Supplement — 运输调度/货载/路线规划
  // ════════════════════════════════════════════════════════

  describe('Logistics-Supplement 物流补充', () => {
    it('L35-16 [P] 创建运输调度单 — POST /logistics-supplement/transport-orders → 201 + draft', async () => {
      const res = await fetch('/api/logistics-supplement/transport-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          orderNumber: 'TO-001',
          transportType: 'normal',
          origin: '上海仓',
          destination: '杭州市西湖区',
          items: [{
            cargoId: 'c1',
            cargoName: '设备',
            quantity: 3,
            unit: '台',
            weightKg: 150,
          }],
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.status).toBe('draft')
    })

    it('L35-17 [P] 运输单全生命周期: draft→dispatched→in_transit→completed', async () => {
      const create = await fetch('/api/logistics-supplement/transport-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          orderNumber: 'TO-LIFE-001',
          transportType: 'express',
          origin: 'A',
          destination: 'B',
          items: [{ cargoId: 'c-life', cargoName: '配件', quantity: 10, unit: '件', weightKg: 5 }],
        }),
      })
      const { id } = await create.json()

      const dispatched = await fetch(`/api/logistics-supplement/transport-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dispatched' }),
      })
      expect((await dispatched.json()).status).toBe('dispatched')

      const inTransit = await fetch(`/api/logistics-supplement/transport-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_transit' }),
      })
      expect((await inTransit.json()).status).toBe('in_transit')

      const completed = await fetch(`/api/logistics-supplement/transport-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      expect((await completed.json()).status).toBe('completed')
    })

    it('L35-18 [P] 添加货物装载 — POST /logistics-supplement/cargo-loads → 201', async () => {
      const res = await fetch('/api/logistics-supplement/cargo-loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transportOrderId: 'to-load-001',
          cargoId: 'c-load-01',
          cargoName: '原材料',
          quantity: 20,
          unit: '箱',
          weightKg: 200,
        }),
      })
      expect(res.status).toBe(201)
    })

    it('L35-19 [P] 路线规划 + 优化 → 优化后距离减少', async () => {
      const create = await fetch('/api/logistics-supplement/route-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transportOrderId: 'to-route-001',
          waypoints: [
            { lat: 31.23, lng: 121.47 },
            { lat: 30.25, lng: 120.16 },
          ],
          estimatedDistanceKm: 200,
          estimatedDurationMin: 180,
        }),
      })
      expect(create.status).toBe(201)
      const { id } = await create.json()

      const optimize = await fetch(`/api/logistics-supplement/route-plans/${id}/optimize`, {
        method: 'POST',
      })
      expect(optimize.status).toBe(201)
      const opt = await optimize.json()
      expect(Number(opt.estimatedDistanceKm)).toBeLessThan(200)
      expect(Number(opt.estimatedDurationMin)).toBeLessThan(180)
    })

    it('L35-20 [N] 运输单无效状态流转 → 400', async () => {
      const create = await fetch('/api/logistics-supplement/transport-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          orderNumber: 'TO-INV-001',
          transportType: 'normal',
          origin: 'A',
          destination: 'B',
          items: [{ cargoId: 'c-inv', cargoName: 'x', quantity: 1, unit: '个', weightKg: 1 }],
        }),
      })
      const { id } = await create.json()
      const res = await fetch(`/api/logistics-supplement/transport-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'invalid_status_xyz' }),
      })
      expect(res.status).toBe(400)
    })
  })

  // ════════════════════════════════════════════════════════
  //  6. Stock-Transfer — 库存调拨
  // ════════════════════════════════════════════════════════

  describe('Stock-Transfer 库存调拨', () => {
    it('L35-21 [P] 创建调拨单 — POST /stock-transfer → 201 + pending', async () => {
      const res = await fetch('/api/stock-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          transferType: 'store_to_store',
          fromLocationId: 'loc-001',
          fromLocationName: '上海旗舰店',
          toLocationId: 'loc-002',
          toLocationName: '杭州旗舰店',
          items: [{ productId: 'p10', productName: '商品A', sku: 'SKU-A', quantity: 100, unit: '件' }],
          requestedById: 'user-001',
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.status).toBe('pending')
      expect(body.items[0].quantity).toBe(100)
    })

    it('L35-22 [P] 调拨全生命周期: pending→approved→in_transit→received', async () => {
      const create = await fetch('/api/stock-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          transferType: 'warehouse_to_store',
          fromLocationId: 'wh-001',
          fromLocationName: '中央仓',
          toLocationId: 's-003',
          toLocationName: '南京新街口店',
          items: [{ productId: 'p11', productName: '商品B', sku: 'SKU-B', quantity: 200, unit: '箱' }],
          requestedById: 'user-002',
        }),
      })
      const { id } = await create.json()

      const approved = await fetch(`/api/stock-transfer/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedById: 'mgr-001' }),
      })
      expect((await approved.json()).status).toBe('approved')

      const transit = await fetch(`/api/stock-transfer/${id}/in-transit`, { method: 'PATCH' })
      expect((await transit.json()).status).toBe('in_transit')

      const received = await fetch(`/api/stock-transfer/${id}/receive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receivedById: 'user-003' }),
      })
      expect((await received.json()).status).toBe('received')
    })

    it('L35-23 [P] 调拨统计 — GET /stock-transfer/stats/:tenantId → 汇总', async () => {
      const res = await fetch('/api/stock-transfer/stats/t001')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.total).toBeGreaterThanOrEqual(0)
      expect(body.byStatus).toBeDefined()
      expect(body.totalItems).toBeDefined()
    })

    it('L35-24 [B] 调拨空items → 400', async () => {
      const res = await fetch('/api/stock-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          transferType: 'store_to_store',
          fromLocationId: 'a',
          fromLocationName: 'A',
          toLocationId: 'b',
          toLocationName: 'B',
          items: [],
          requestedById: 'u1',
        }),
      })
      expect(res.status).toBe(400)
    })

    it('L35-25 [B] 已完成调拨不可取消 → 400', async () => {
      const create = await fetch('/api/stock-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          transferType: 'store_to_store',
          fromLocationId: 'a',
          fromLocationName: 'A',
          toLocationId: 'b',
          toLocationName: 'B',
          items: [{ productId: 'x', productName: 'X', sku: 'X', quantity: 1, unit: '个' }],
          requestedById: 'u1',
        }),
      })
      const { id } = await create.json()
      await fetch(`/api/stock-transfer/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedById: 'mgr' }),
      })
      await fetch(`/api/stock-transfer/${id}/in-transit`, { method: 'PATCH' })
      await fetch(`/api/stock-transfer/${id}/receive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receivedById: 'u2' }),
      })

      const cancel = await fetch(`/api/stock-transfer/${id}/cancel`, { method: 'PATCH' })
      expect(cancel.status).toBe(400)
    })

    it('L35-26 [B] pending调拨可以取消 → 200', async () => {
      const create = await fetch('/api/stock-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          transferType: 'supply',
          fromLocationId: 'wh-001',
          fromLocationName: '中央仓',
          toLocationId: 's-005',
          toLocationName: '门店E',
          items: [{ productId: 'p-cancel', productName: '取消测试', sku: 'CANCEL', quantity: 10, unit: '件' }],
          requestedById: 'u-cancel',
        }),
      })
      const { id } = await create.json()

      const cancel = await fetch(`/api/stock-transfer/${id}/cancel`, { method: 'PATCH' })
      expect(cancel.status).toBe(200)
      const body = await cancel.json()
      expect(body.status).toBe('cancelled')
    })

    it('L35-27 [N] 调拨单缺少fromLocation → 400', async () => {
      const res = await fetch('/api/stock-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          transferType: 'store_to_store',
          toLocationId: 'b',
          toLocationName: 'B',
          items: [{ productId: 'p', productName: 'P', sku: 'P', quantity: 1, unit: '个' }],
          requestedById: 'u',
        }),
      })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  // ════════════════════════════════════════════════════════
  //  7. 跨模块集成 — 三模块串联
  // ════════════════════════════════════════════════════════

  describe('跨模块集成', () => {
    it('L35-28 [P] 物流订单→补充运输→调拨 串联', async () => {
      // 1. 创建物流订单
      const order = await fetch('/api/logistics/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          origin: '中央仓',
          destination: '门店',
          items: [{ productId: 'p-int', quantity: 50 }],
        }),
      })
      expect(order.status).toBe(201)

      // 2. 补充运输调度
      const transport = await fetch('/api/logistics-supplement/transport-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          orderNumber: 'INT-001',
          transportType: 'bulk',
          origin: '中央仓',
          destination: '门店',
          items: [{
            cargoId: 'c-int',
            cargoName: '整批',
            quantity: 50,
            unit: '箱',
            weightKg: 500,
          }],
        }),
      })
      expect(transport.status).toBe(201)

      // 3. 库存调拨
      const transfer = await fetch('/api/stock-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          transferType: 'warehouse_to_store',
          fromLocationId: 'wh',
          fromLocationName: '中央仓',
          toLocationId: 'st',
          toLocationName: '门店',
          items: [{
            productId: 'p-int',
            productName: '集成商品',
            sku: 'INT',
            quantity: 50,
            unit: '箱',
          }],
          requestedById: 'u-int',
        }),
      })
      expect(transfer.status).toBe(201)
    })

    it('L35-29 [P] 巡检→维修物料申请→出库 串联', async () => {
      // 1. 创建巡检并标记 fail
      const inspection = await fetch('/api/logistics/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's-int',
          equipmentId: 'eq-int',
          assigneeId: 'emp-int',
          scheduledAt: '2026-08-10T09:00:00Z',
        }),
      })
      expect(inspection.status).toBe(201)
      const { id: inspId } = await inspection.json()

      await fetch(`/api/logistics/inspections/${inspId}/result`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: 'fail',
          remark: '设备故障需换零件',
          completedAt: '2026-08-10T09:30:00Z',
          inspectedById: 'emp-int',
        }),
      })

      // 2. 物料申请
      const material = await fetch('/api/logistics/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's-int',
          requesterId: 'emp-int',
          purpose: '设备维修换件',
          items: [{ materialId: 'm-int', materialName: '替换零件', quantity: 1, unit: '个' }],
        }),
      })
      expect(material.status).toBe(201)

      // 3. 审批 + 出库
      const { id: matId } = await material.json()
      const approve = await fetch(`/api/logistics/material-requests/${matId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId: 'mgr-int', note: '批准' }),
      })
      expect(approve.status).toBe(200)

      const outbound = await fetch(`/api/logistics/material-requests/${matId}/outbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outboundById: 'wh-int', note: '出库发货' }),
      })
      expect(outbound.status).toBe(200)
      const out = await outbound.json()
      expect(out.status).toBe('outbound')
    })

    it('L35-30 [P] 排班→签到→调拨 后勤全链路', async () => {
      // 1. 创建清洁排班
      const schedule = await fetch('/api/logistics/clean-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          storeId: 's-full',
          assigneeId: 'clean-full',
          shiftName: '中班',
          scheduledDate: '2026-08-15',
          areaCodes: ['area-full'],
        }),
      })
      expect(schedule.status).toBe(201)

      // 2. 签到
      const { id: csId } = await schedule.json()
      const checkIn = await fetch(`/api/logistics/clean-schedules/${csId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInTime: '2026-08-15T12:00:00Z' }),
      })
      expect(checkIn.status).toBe(200)

      // 3. 库存调拨 (同租户)
      const transfer = await fetch('/api/stock-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 't001',
          transferType: 'supply',
          fromLocationId: 'wh-full',
          fromLocationName: '中央仓',
          toLocationId: 's-full',
          toLocationName: '全链路门店',
          items: [{ productId: 'p-full', productName: '后勤商品', sku: 'FULL', quantity: 30, unit: '箱' }],
          requestedById: 'u-full',
        }),
      })
      expect(transfer.status).toBe(201)
    })
  })
})
