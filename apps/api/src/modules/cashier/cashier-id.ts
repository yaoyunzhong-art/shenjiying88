/**
 * cashier-id.ts
 *
 * Cashier 模块的序列号 ID 生成器工厂.
 *
 * 由来: order.service.ts / payment.service.ts / refund.service.ts 各自维护
 * 一个 next*Id 函数 + 一个全局 seq 计数器, 共 4 段实现:
 *   - nextOrderId     (ORD prefix) + orderSeq
 *   - nextOrderItemId (OIT prefix) + orderItemSeq
 *   - nextPaymentId   (PAY prefix) + paymentSeq
 *   - nextRefundId    (RFD prefix) + refundSeq
 *
 * 4 段函数体逐行重复, 差异仅 prefix 字符串 + 全局 seq 变量名;
 * 任何 padStart 长度 / 循环周期 / 时间格式调整都要在 3 文件 4 处同步改.
 *
 * 集中后: 1 个 createSequentialIdGenerator(prefix) 工厂, 闭包隔离全局 seq;
 * 调用方 1 行 `const nextXId = createSequentialIdGenerator('XXX')` 即可.
 * 行为契约 (格式 + 5 位补零 + 100000 循环 + ISO 日期) 由测试钉死.
 */

const SEQ_MODULUS = 100_000
const SEQ_PADDING = 5

/**
 * 创建序列号 ID 生成器 (闭包持有独立 seq).
 * 格式: `<prefix>-<YYYYMMDD>-<NNNNN>` (e.g. `ORD-20260703-00001`).
 *
 * - 日期从 new Date().toISOString() 取前 10 位 (YYYY-MM-DD), 去掉 '-'
 * - seq 从 1 开始, % 100000 循环
 * - 5 位 padStart (00001 / 99999 之后归 0)
 *
 * 同一 prefix 的多次调用返回独立生成器 (各自 seq); 跨进程/集群需外部协调.
 */
export function createSequentialIdGenerator(prefix: string): () => string {
  let seq = 0
  return function nextId(): string {
    seq = (seq + 1) % SEQ_MODULUS
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    return `${prefix}-${date}-${seq.toString().padStart(SEQ_PADDING, '0')}`
  }
}
