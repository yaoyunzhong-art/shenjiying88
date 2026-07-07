/**
 * k6 压测脚本: 支付收银台 (P2-3.1)
 *
 * 场景:
 *   1. 创建订单 (POST /cashier/orders)
 *   2. 模拟支付 (POST /cashier/payments) - 用 WECHAT/ALIPAY 各 50%
 *   3. 查询订单 (GET /cashier/orders/:id)
 *   4. 退款 (POST /cashier/refunds) - 10% 流量
 *
 * SLA 指标:
 *   - p95 latency < 500ms
 *   - p99 latency < 1.5s
 *   - error rate < 0.5%
 *   - 吞吐量 >= 500 RPS
 *
 * 使用:
 *   k6 run --duration 60s --vus 100 loadtest/cashier-load.js
 *
 * 真实环境需配合:
 *   - BASE_URL 指向压测环境
 *   - TENANT_ID 已 seed 测试数据
 *   - 鉴权 token (可临时用测试专用)
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const TENANT_ID = __ENV.TENANT_ID || 't-loadtest'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'loadtest-token'

// 自定义 metrics
const errorRate = new Rate('errors')
const orderLatency = new Trend('order_latency_ms')
const paymentLatency = new Trend('payment_latency_ms')

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // 预热
    { duration: '30s', target: 200 }, // 升压
    { duration: '60s', target: 200 }, // 稳压
    { duration: '20s', target: 500 }, // 峰值
    { duration: '10s', target: 0 }    // 退场
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    http_req_failed: ['rate<0.005'],
    errors: ['rate<0.005'],
    order_latency_ms: ['p(95)<400'],
    payment_latency_ms: ['p(95)<800']
  }
}

const headers = {
  'Content-Type': 'application/json',
  'x-tenant-id': TENANT_ID,
  'Authorization': `Bearer ${AUTH_TOKEN}`
}

function randomItem() {
  return {
    itemId: `i-${Math.floor(Math.random() * 1000)}`,
    name: `测试商品 ${Math.floor(Math.random() * 100)}`,
    qty: 1 + Math.floor(Math.random() * 3),
    unitPrice: 10 + Math.floor(Math.random() * 100),
    discount: 0
  }
}

export default function () {
  // 1. 创建订单
  const orderPayload = JSON.stringify({
    items: [randomItem(), randomItem()],
    channel: 'POS'
  })
  const orderRes = http.post(`${BASE_URL}/cashier/orders`, orderPayload, { headers })
  orderLatency.add(orderRes.timings.duration)
  const orderOk = check(orderRes, {
    'order: status 201': (r) => r.status === 201,
    'order: orderId present': (r) => r.json('orderId') !== undefined
  })
  if (!orderOk) {
    errorRate.add(1)
    return
  }
  errorRate.add(0)

  const orderId = orderRes.json('orderId')
  sleep(0.1)

  // 2. 模拟支付 (50% WECHAT / 50% ALIPAY)
  const method = Math.random() < 0.5 ? 'WECHAT' : 'ALIPAY'
  const order = orderRes.json()
  const paymentPayload = JSON.stringify({
    orderId,
    method,
    amountCents: order.total * 100
  })
  const paymentRes = http.post(`${BASE_URL}/cashier/payments`, paymentPayload, { headers })
  paymentLatency.add(paymentRes.timings.duration)
  const paymentOk = check(paymentRes, {
    'payment: status 201': (r) => r.status === 201,
    'payment: paymentId present': (r) => r.json('paymentId') !== undefined
  })
  if (!paymentOk) {
    errorRate.add(1)
    return
  }
  errorRate.add(0)

  // 3. 查询订单 (10% 流量)
  if (Math.random() < 0.1) {
    http.get(`${BASE_URL}/cashier/orders/${orderId}`, { headers })
  }

  // 4. 退款 (5% 流量)
  if (Math.random() < 0.05) {
    const paymentId = paymentRes.json('paymentId')
    const refundPayload = JSON.stringify({
      orderId,
      paymentId,
      amount: order.total * 100,
      reason: 'loadtest_refund'
    })
    const refundRes = http.post(`${BASE_URL}/cashier/refunds`, refundPayload, { headers })
    check(refundRes, {
      'refund: status 201': (r) => r.status === 201
    })
  }
}
