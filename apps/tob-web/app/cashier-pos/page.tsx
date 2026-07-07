'use client';

import { useState, useEffect } from 'react';
import {
  POSOrder,
  POSItem,
  OrderChannel,
  ChannelStats,
  RefundRequest,
  SyncStatus,
} from './cashier-pos-data';
import {
  submitOrder,
  queryOrder,
  requestRefund,
  queryRefundStatus,
  getChannelStats,
  syncOfflineOrders,
  getOfflineQueueCount,
} from './cashier-pos-service';

const CHANNELS: OrderChannel[] = ['POS', 'Web', 'Mobile', 'MiniApp'];

function generateOrderId(): string {
  return `ORD-${Date.now()}`;
}

function generateItemId(): string {
  return `ITEM-${Date.now()}`;
}

export default function CashierPOSPage() {
  // Product entry state
  const [productName, setProductName] = useState('');
  const [productQty, setProductQty] = useState(1);
  const [productPrice, setProductPrice] = useState(0);

  // Order items state
  const [orderItems, setOrderItems] = useState<POSItem[]>([]);

  // Channel selection
  const [selectedChannel, setSelectedChannel] = useState<OrderChannel>('POS');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Refund state
  const [refundOrderId, setRefundOrderId] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');
  const [refundResult, setRefundResult] = useState<RefundRequest | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  // Refund query state
  const [refundQueryId, setRefundQueryId] = useState('');
  const [refundQueryResult, setRefundQueryResult] = useState<RefundRequest | null>(null);

  // Offline queue state
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncStatus | null>(null);

  // Channel stats
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);

  // Load channel stats on mount
  useEffect(() => {
    loadChannelStats();
    updateOfflineCount();
  }, []);

  async function loadChannelStats() {
    const stats = await getChannelStats();
    setChannelStats(stats);
  }

  function updateOfflineCount() {
    setOfflineCount(getOfflineQueueCount());
  }

  function addItem() {
    if (!productName || productPrice <= 0) return;

    const newItem: POSItem = {
      itemId: generateItemId(),
      name: productName,
      qty: productQty,
      unitPrice: productPrice,
      discount: 0,
    };

    setOrderItems([...orderItems, newItem]);
    setProductName('');
    setProductQty(1);
    setProductPrice(0);
  }

  function calculateSubtotal(): number {
    return orderItems.reduce((sum, item) => {
      return sum + item.unitPrice * item.qty - item.discount;
    }, 0);
  }

  function calculateTax(): number {
    return calculateSubtotal() * 0.1;
  }

  function calculateTotal(): number {
    return calculateSubtotal() + calculateTax();
  }

  async function handleSubmitOrder() {
    if (orderItems.length === 0) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);

    const order: POSOrder = {
      orderId: generateOrderId(),
      items: orderItems,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      channel: selectedChannel,
      status: 'pending',
    };

    const result = await submitOrder(order);

    setIsSubmitting(false);
    if (result.offlineCreated) {
      updateOfflineCount();
    }
    setSubmitSuccess(true);
    setOrderItems([]);

    setTimeout(() => setSubmitSuccess(false), 3000);
  }

  async function handleRefund() {
    if (!refundOrderId || refundAmount <= 0 || !refundReason) return;

    setIsRefunding(true);
    const result = await requestRefund(refundOrderId, refundAmount, refundReason);
    setRefundResult(result);
    setIsRefunding(false);

    setRefundOrderId('');
    setRefundAmount(0);
    setRefundReason('');
  }

  async function handleQueryRefund() {
    if (!refundQueryId) return;

    const result = await queryRefundStatus(refundQueryId);
    setRefundQueryResult(result);
  }

  async function handleSyncOffline() {
    setIsSyncing(true);
    const result = await syncOfflineOrders();
    setSyncResult(result);
    setIsSyncing(false);
    updateOfflineCount();

    setTimeout(() => setSyncResult(null), 5000);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
        padding: '24px',
      }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
        收银前台 - CashierPOS
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: Product Entry + Order Summary */}
        <div>
          {/* Product Entry */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              商品录入
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <input
                type="text"
                placeholder="商品名称"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: '#e2e8f0',
                }}
              />
              <input
                type="number"
                placeholder="数量"
                value={productQty}
                onChange={(e) => setProductQty(Number(e.target.value))}
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: '#e2e8f0',
                }}
              />
              <input
                type="number"
                placeholder="单价"
                value={productPrice || ''}
                onChange={(e) => setProductPrice(Number(e.target.value))}
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: '#e2e8f0',
                }}
              />
            </div>
            <button
              onClick={addItem}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '10px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              添加商品
            </button>
          </div>

          {/* Order Summary */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              订单摘要
            </h2>

            {orderItems.length === 0 ? (
              <p style={{ color: '#64748b' }}>暂无商品</p>
            ) : (
              <div>
                <table style={{ width: '100%', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <th style={{ textAlign: 'left', padding: '8px 0' }}>商品</th>
                      <th style={{ textAlign: 'center', padding: '8px 0' }}>数量</th>
                      <th style={{ textAlign: 'right', padding: '8px 0' }}>单价</th>
                      <th style={{ textAlign: 'right', padding: '8px 0' }}>小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.itemId} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 0' }}>{item.name}</td>
                        <td style={{ textAlign: 'center', padding: '8px 0' }}>{item.qty}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0' }}>¥{item.unitPrice}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0' }}>
                          ¥{item.unitPrice * item.qty - item.discount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderTop: '1px solid #334155', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>小计:</span>
                    <span>¥{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>税额 (10%):</span>
                    <span>¥{calculateTax().toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '18px',
                      fontWeight: 'bold',
                    }}
                  >
                    <span>合计:</span>
                    <span>¥{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Channel Selection */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>订单渠道:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {CHANNELS.map((channel) => (
                  <button
                    key={channel}
                    onClick={() => setSelectedChannel(channel)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: selectedChannel === channel ? '#22c55e' : '#334155',
                      color: selectedChannel === channel ? '#0f172a' : '#e2e8f0',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitOrder}
              disabled={orderItems.length === 0 || isSubmitting}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '12px',
                backgroundColor: orderItems.length === 0 ? '#334155' : '#22c55e',
                color: orderItems.length === 0 ? '#64748b' : '#0f172a',
                border: 'none',
                borderRadius: '4px',
                cursor: orderItems.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              {isSubmitting ? '提交中...' : submitSuccess ? '提交成功!' : '提交订单'}
            </button>
          </div>

          {/* Offline Queue */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              离线订单队列
            </h2>
            <p style={{ marginBottom: '12px' }}>
              待同步: <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{offlineCount}</span> 条
            </p>
            <button
              onClick={handleSyncOffline}
              disabled={offlineCount === 0 || isSyncing}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: offlineCount === 0 ? '#334155' : '#f59e0b',
                color: offlineCount === 0 ? '#64748b' : '#0f172a',
                border: 'none',
                borderRadius: '4px',
                cursor: offlineCount === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              {isSyncing ? '同步中...' : '立即同步'}
            </button>
            {syncResult && (
              <p style={{ marginTop: '12px', color: '#22c55e' }}>
                同步完成: 成功 {syncResult.synced} 条, 失败 {syncResult.failed} 条
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Channel Stats + Refund */}
        <div>
          {/* Channel Stats */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              渠道统计概览
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {channelStats.map((stat) => (
                <div
                  key={stat.channel}
                  style={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#3b82f6',
                      marginBottom: '4px',
                    }}
                  >
                    {stat.channel}
                  </div>
                  <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                    {stat.orderCount} 单
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#22c55e' }}>
                    ¥{stat.totalAmount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Application */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              退款申请
            </h2>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                订单号
              </label>
              <input
                type="text"
                value={refundOrderId}
                onChange={(e) => setRefundOrderId(e.target.value)}
                placeholder="输入订单号"
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: '#e2e8f0',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                退款金额
              </label>
              <input
                type="number"
                value={refundAmount || ''}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                placeholder="输入金额"
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: '#e2e8f0',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                退款原因
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="输入退款原因"
                rows={3}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: '#e2e8f0',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>
            <button
              onClick={handleRefund}
              disabled={!refundOrderId || refundAmount <= 0 || !refundReason || isRefunding}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: !refundOrderId || refundAmount <= 0 || !refundReason ? '#334155' : '#ef4444',
                color: !refundOrderId || refundAmount <= 0 || !refundReason ? '#64748b' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !refundOrderId || refundAmount <= 0 || !refundReason ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              {isRefunding ? '提交中...' : '申请退款'}
            </button>
            {refundResult && (
              <p style={{ marginTop: '12px', color: '#22c55e' }}>
                退款申请成功: {refundResult.refundId}
              </p>
            )}
          </div>

          {/* Refund Status Query */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              退款状态查询
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={refundQueryId}
                onChange={(e) => setRefundQueryId(e.target.value)}
                placeholder="输入退款ID"
                style={{
                  flex: 1,
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: '#e2e8f0',
                }}
              />
              <button
                onClick={handleQueryRefund}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                查询
              </button>
            </div>
            {refundQueryResult && (
              <div
                style={{
                  marginTop: '12px',
                  backgroundColor: '#0f172a',
                  borderRadius: '4px',
                  padding: '12px',
                }}
              >
                <p>
                  <span style={{ color: '#94a3b8' }}>退款ID:</span> {refundQueryResult.refundId}
                </p>
                <p>
                  <span style={{ color: '#94a3b8' }}>订单号:</span> {refundQueryResult.orderId}
                </p>
                <p>
                  <span style={{ color: '#94a3b8' }}>金额:</span> ¥{refundQueryResult.amount.toFixed(2)}
                </p>
                <p>
                  <span style={{ color: '#94a3b8' }}>原因:</span> {refundQueryResult.reason}
                </p>
                <p>
                  <span style={{ color: '#94a3b8' }}>状态:</span>{' '}
                  <span
                    style={{
                      color:
                        refundQueryResult.status === 'completed'
                          ? '#22c55e'
                          : refundQueryResult.status === 'rejected'
                          ? '#ef4444'
                          : '#f59e0b',
                    }}
                  >
                    {refundQueryResult.status}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
