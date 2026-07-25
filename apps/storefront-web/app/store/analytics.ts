// analytics.ts · 转化漏斗埋点
// Phase 2A 交易闭环硬化 · 2026-07-26
//
// 全链路埋点: 浏览 → 详情 → 下单 → 支付 → 核销
// 宪法§15.2: 转化漏斗实时追踪, SIM-20数据分析

type EventName =
  | 'page_view'           // 页面浏览
  | 'service_detail_view' // 服务详情页浏览
  | 'service_select'      // 选择服务项目
  | 'slot_select'         // 选择时段
  | 'booking_submit'      // 提交预约
  | 'booking_success'     // 预约成功
  | 'payment_start'       // 开始支付
  | 'payment_success'     // 支付成功
  | 'payment_fail'        // 支付失败
  | 'checkin_success'     // 核销成功
  | 'booking_cancel'      // 取消预约
  | 'booking_reschedule'  // 改期
  | 'share_start'         // 开始分享
  | 'share_complete'      // 分享完成
  | 'package_select'      // 选择套餐
  | 'package_purchase'    // 购买套餐

interface AnalyticsPayload {
  event: EventName
  storeSlug?: string
  serviceId?: string
  bookingId?: string
  amount?: number
  timestamp: string
  page?: string
  referrer?: string
}

const ENDPOINT = '/api/storefront/analytics' // 将来接真实埋点服务

// 当前会话的浏览路径（用于还原用户漏斗路径）
const sessionPath: EventName[] = []
let sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

/**
 * 发送埋点事件
 * 
 * 当前使用 navigator.sendBeacon 确保页面关闭前不丢数据
 * 后续可接神策/GrowingIO/自建埋点
 */
export function track(event: EventName, extra?: Partial<AnalyticsPayload>) {
  const payload: AnalyticsPayload = {
    event,
    timestamp: new Date().toISOString(),
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    ...extra,
  }

  // 记录漏斗路径
  sessionPath.push(event)

  // 开发环境 log
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 [Analytics] ${event}`, payload)
  }

  // 非阻塞发送
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    try {
      navigator.sendBeacon(
        ENDPOINT,
        JSON.stringify(payload),
      )
    } catch {
      // 降级到 fetch
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    }
  }
}

/**
 * 获取当前会话的漏斗路径
 */
export function getSessionPath(): EventName[] {
  return [...sessionPath]
}

/**
 * 重置会话
 */
export function resetSession() {
  sessionPath.length = 0
  sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
