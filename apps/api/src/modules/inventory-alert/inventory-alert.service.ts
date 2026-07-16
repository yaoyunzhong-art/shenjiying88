import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { AlertLevel, AlertStatus, type InventoryAlert } from './inventory-alert.entity'
import type { AlertQueryDto, CreateInventoryAlertDto } from './inventory-alert.dto'

const alertStore = new Map<string, InventoryAlert>()

export function resetInventoryAlertTestState() {
  alertStore.clear()
}

function seedMockData() {
  if (alertStore.size > 0) return

  const now = new Date().toISOString()
  const tenantId = 'default'
  const mockAlerts: InventoryAlert[] = [
    // --- low (4 条) ---
    {
      id: `alert-low-1`, tenantId, productId: `prod-a1`, productName: '矿泉水 500ml',
      sku: 'WATER-500', currentStock: 12, minStock: 50, maxStock: 500,
      alertLevel: AlertLevel.Low, message: '矿泉水 500ml 库存偏低，当前仅12箱，低于安全库存50箱',
      status: AlertStatus.Pending, createdAt: now, updatedAt: now,
    },
    {
      id: `alert-low-2`, tenantId, productId: `prod-a2`, productName: '方便面 经典款',
      sku: 'NOODLE-CLASSIC', currentStock: 30, minStock: 80, maxStock: 600,
      alertLevel: AlertLevel.Low, message: '方便面库存偏低，当前仅30箱',
      status: AlertStatus.Pending, createdAt: now, updatedAt: now,
    },
    {
      id: `alert-low-3`, tenantId, productId: `prod-a3`, productName: '纸巾 抽纸',
      sku: 'TISSUE-BOX', currentStock: 25, minStock: 60, maxStock: 300,
      alertLevel: AlertLevel.Low, message: '抽纸库存偏低，当前仅25提',
      status: AlertStatus.Resolved, createdAt: now, updatedAt: now,
    },
    {
      id: `alert-low-4`, tenantId, productId: `prod-a4`, productName: '食用油 5L',
      sku: 'OIL-5L', currentStock: 18, minStock: 40, maxStock: 200,
      alertLevel: AlertLevel.Low, message: '食用油库存偏低，当前仅18桶',
      status: AlertStatus.Ignored, createdAt: now, updatedAt: now,
    },
    // --- critical (3 条) ---
    {
      id: `alert-crit-1`, tenantId, productId: `prod-b1`, productName: '面包 全麦',
      sku: 'BREAD-WHOLE', currentStock: 2, minStock: 30, maxStock: 200,
      alertLevel: AlertLevel.Critical, message: '全麦面包库存严重不足！仅剩2袋',
      status: AlertStatus.Pending, createdAt: now, updatedAt: now,
    },
    {
      id: `alert-crit-2`, tenantId, productId: `prod-b2`, productName: '鸡蛋 30枚装',
      sku: 'EGG-30', currentStock: 0, minStock: 20, maxStock: 150,
      alertLevel: AlertLevel.Critical, message: '鸡蛋库存为0！请立即补货',
      status: AlertStatus.Pending, createdAt: now, updatedAt: now,
    },
    {
      id: `alert-crit-3`, tenantId, productId: `prod-b3`, productName: '牛奶 1L',
      sku: 'MILK-1L', currentStock: 5, minStock: 40, maxStock: 300,
      alertLevel: AlertLevel.Critical, message: '牛奶库存严重不足！仅剩5瓶',
      status: AlertStatus.Resolved, createdAt: now, updatedAt: now,
    },
    // --- overstock (3 条) ---
    {
      id: `alert-over-1`, tenantId, productId: `prod-c1`, productName: '可乐 330ml',
      sku: 'COLA-330', currentStock: 1200, minStock: 100, maxStock: 500,
      alertLevel: AlertLevel.Overstock, message: '可乐库存积压！当前1200箱，远超安全上限500箱',
      status: AlertStatus.Pending, createdAt: now, updatedAt: now,
    },
    {
      id: `alert-over-2`, tenantId, productId: `prod-c2`, productName: '薯片 大包装',
      sku: 'CHIPS-LARGE', currentStock: 800, minStock: 50, maxStock: 300,
      alertLevel: AlertLevel.Overstock, message: '薯片库存积压！当前800袋，需关注保质期',
      status: AlertStatus.Pending, createdAt: now, updatedAt: now,
    },
    {
      id: `alert-over-3`, tenantId, productId: `prod-c3`, productName: '洗衣液 1kg',
      sku: 'DETERGENT-1KG', currentStock: 600, minStock: 80, maxStock: 350,
      alertLevel: AlertLevel.Overstock, message: '洗衣液库存积压，建议暂停采购',
      status: AlertStatus.Ignored, createdAt: now, updatedAt: now,
    },
  ]

  for (const alert of mockAlerts) {
    alertStore.set(alert.id, alert)
  }
}

@Injectable()
export class InventoryAlertService {
  constructor() {
    seedMockData()
  }

  list(tenantContext: RequestTenantContext, query?: AlertQueryDto): { items: InventoryAlert[]; total: number; offset: number; limit: number } {
    const limit = query?.limit && query.limit > 0 ? query.limit : 20
    const offset = query?.offset && query.offset > 0 ? query.offset : 0

    let alerts = Array.from(alertStore.values())
      .filter((a) => a.tenantId === tenantContext.tenantId)

    if (query?.alertLevel) {
      alerts = alerts.filter((a) => a.alertLevel === query.alertLevel)
    }
    if (query?.status) {
      alerts = alerts.filter((a) => a.status === query.status)
    }
    if (query?.keyword) {
      const kw = query.keyword.toLowerCase()
      alerts = alerts.filter(
        (a) =>
          a.productName.toLowerCase().includes(kw) ||
          a.sku.toLowerCase().includes(kw) ||
          a.message.toLowerCase().includes(kw),
      )
    }

    alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const total = alerts.length
    const items = alerts.slice(offset, offset + limit)

    return { items, total, offset, limit }
  }

  getById(id: string, tenantContext: RequestTenantContext): InventoryAlert {
    const alert = alertStore.get(id)
    if (!alert || alert.tenantId !== tenantContext.tenantId) {
      throw new Error(`Inventory alert ${id} not found`)
    }
    return alert
  }

  getSummary(tenantContext: RequestTenantContext) {
    const alerts = Array.from(alertStore.values())
      .filter((a) => a.tenantId === tenantContext.tenantId)

    return {
      total: alerts.length,
      pending: alerts.filter((a) => a.status === AlertStatus.Pending).length,
      lowCount: alerts.filter((a) => a.alertLevel === AlertLevel.Low).length,
      criticalCount: alerts.filter((a) => a.alertLevel === AlertLevel.Critical).length,
      overstockCount: alerts.filter((a) => a.alertLevel === AlertLevel.Overstock).length,
      resolvedCount: alerts.filter((a) => a.status === AlertStatus.Resolved).length,
      ignoredCount: alerts.filter((a) => a.status === AlertStatus.Ignored).length,
    }
  }

  create(tenantContext: RequestTenantContext, input: CreateInventoryAlertDto): InventoryAlert {
    const now = new Date().toISOString()
    const alert: InventoryAlert = {
      id: `alert-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      productId: input.productId,
      productName: '',
      sku: '',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      alertLevel: input.alertLevel,
      message: input.message,
      status: AlertStatus.Pending,
      createdAt: now,
      updatedAt: now,
    }
    alertStore.set(alert.id, alert)
    return alert
  }

  /**
   * 库存预警检查逻辑：对给定产品进行预警级别判定
   */
  checkAlertLevel(currentStock: number, minStock: number, maxStock: number): AlertLevel | null {
    if (currentStock <= 0) return AlertLevel.Critical
    if (currentStock < minStock * 0.3) return AlertLevel.Critical
    if (currentStock < minStock) return AlertLevel.Low
    if (currentStock > maxStock) return AlertLevel.Overstock
    return null
  }
}
