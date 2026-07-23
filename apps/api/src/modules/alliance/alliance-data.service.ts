/**
 * alliance-data.service.ts — WP-17B 数据API (BS-0222~BS-0224)
 *
 * 功能：
 *  - 联盟方数据回传接口
 *  - 数据看板
 */
import { Injectable, Logger } from '@nestjs/common'

// ── Types ─────────────────────────────────────────────────────────────────────

/** 数据回传类型 */
export type CallbackDataType = 'order' | 'member' | 'activity' | 'revenue' | 'traffic'

/** 数据回传记录 */
export interface DataCallbackRecord {
  id: string
  partnerId: string
  dataType: CallbackDataType
  /** 原始业务数据（JSON string） */
  payload: string
  /** 回传时间 */
  receivedAt: string
  /** 处理状态 */
  processStatus: 'pending' | 'processed' | 'failed'
  /** 处理结果 */
  processResult?: string
}

/** 数据看板摘要 */
export interface DataDashboard {
  partnerId: string
  /** 今日回传数 */
  todayCallbacks: number
  /** 本月回传数 */
  monthCallbacks: number
  /** 最近7天数据趋势 */
  trend7d: Array<{ date: string; count: number }>
  /** 各数据类型分布 */
  typeDistribution: Array<{ dataType: CallbackDataType; count: number }>
  /** 成功处理率 */
  successRate: number
}

/** 回传统计 */
export interface CallbackStats {
  partnerId: string
  totalCallbacks: number
  processedCount: number
  failedCount: number
  pendingCount: number
}

/** 时间区间查询 */
export interface DataQuery {
  dataType?: CallbackDataType
  from: string
  to: string
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AllianceDataService {
  private readonly logger = new Logger(AllianceDataService.name)

  private callbacks = new Map<string, DataCallbackRecord>()
  private dashboardCache = new Map<string, DataDashboard>()

  // ═══════════════════════════════════════════════════════════════════════════
  // 数据回传
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 接收联盟方数据回传
   */
  receiveCallback(partnerId: string, dataType: CallbackDataType, payload: string): DataCallbackRecord {
    if (!partnerId || !dataType || !payload) {
      throw new DataCallbackError('INVALID_PARAMS', 'partnerId, dataType and payload required')
    }

    const id = `cb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const record: DataCallbackRecord = {
      id,
      partnerId,
      dataType,
      payload,
      receivedAt: new Date().toISOString(),
      processStatus: 'pending',
    }

    this.callbacks.set(id, record)

    // 尝试处理
    try {
      this.processCallback(id)
    } catch (err: any) {
      this.logger.warn(`Callback ${id} processing failed: ${err.message}`)
      record.processStatus = 'failed'
      record.processResult = err.message
    }

    this.logger.log(`Data callback received: ${id} partner=${partnerId} type=${dataType}`)
    return record
  }

  /**
   * 处理回传数据（模拟处理逻辑）
   */
  private processCallback(callbackId: string): void {
    const record = this.callbacks.get(callbackId)
    if (!record) {
      throw new DataCallbackError('NOT_FOUND', `callback ${callbackId} not found`)
    }

    // 校验 JSON 格式
    try {
      JSON.parse(record.payload)
    } catch {
      throw new DataCallbackError('INVALID_PAYLOAD', 'payload is not valid JSON')
    }

    record.processStatus = 'processed'
    record.processResult = 'Data processed successfully'
  }

  /**
   * 查询回传记录
   */
  getCallbackRecords(partnerId: string, query?: DataQuery): DataCallbackRecord[] {
    let records = Array.from(this.callbacks.values()).filter((r) => r.partnerId === partnerId)

    if (query) {
      if (query.dataType) {
        records = records.filter((r) => r.dataType === query.dataType)
      }
      if (query.from) {
        const fromDate = new Date(query.from)
        records = records.filter((r) => new Date(r.receivedAt) >= fromDate)
      }
      if (query.to) {
        const toDate = new Date(query.to)
        records = records.filter((r) => new Date(r.receivedAt) <= toDate)
      }
    }

    return records.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
  }

  /**
   * 获取伙伴回传统计
   */
  getCallbackStats(partnerId: string): CallbackStats {
    const records = Array.from(this.callbacks.values()).filter((r) => r.partnerId === partnerId)
    return {
      partnerId,
      totalCallbacks: records.length,
      processedCount: records.filter((r) => r.processStatus === 'processed').length,
      failedCount: records.filter((r) => r.processStatus === 'failed').length,
      pendingCount: records.filter((r) => r.processStatus === 'pending').length,
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 数据看板
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 获取指定伙伴的数据看板
   */
  getDataDashboard(partnerId: string): DataDashboard {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const currentMonth = now.toISOString().slice(0, 7)

    const records = Array.from(this.callbacks.values()).filter((r) => r.partnerId === partnerId)

    // 今日回传
    const todayRecords = records.filter((r) => r.receivedAt.startsWith(today))
    // 本月回传
    const monthRecords = records.filter((r) => r.receivedAt.startsWith(currentMonth))

    // 7天趋势
    const trend7d: Array<{ date: string; count: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const count = records.filter((r) => r.receivedAt.startsWith(dateStr)).length
      trend7d.push({ date: dateStr, count })
    }

    // 数据类型分布
    const typeMap = new Map<CallbackDataType, number>()
    for (const r of records) {
      typeMap.set(r.dataType, (typeMap.get(r.dataType) ?? 0) + 1)
    }
    const typeDistribution = Array.from(typeMap.entries()).map(([dataType, count]) => ({
      dataType,
      count,
    }))

    // 成功率
    const successRate = records.length > 0
      ? (records.filter((r) => r.processStatus === 'processed').length / records.length) * 100
      : 100

    const dashboard: DataDashboard = {
      partnerId,
      todayCallbacks: todayRecords.length,
      monthCallbacks: monthRecords.length,
      trend7d,
      typeDistribution,
      successRate: Math.round(successRate * 100) / 100,
    }

    this.dashboardCache.set(partnerId, dashboard)
    return dashboard
  }

  /**
   * 清除数据（测试用）
   */
  clearAll(): void {
    this.callbacks.clear()
    this.dashboardCache.clear()
  }
}

// ── Error ─────────────────────────────────────────────────────────────────────

export class DataCallbackError extends Error {
  constructor(
    public readonly code: 'INVALID_PARAMS' | 'NOT_FOUND' | 'INVALID_PAYLOAD',
    message: string,
  ) {
    super(message)
    this.name = 'DataCallbackError'
  }
}
