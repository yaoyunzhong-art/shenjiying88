/**
 * DeliveryTrackingClient — 物流追踪客户端组件
 * 提供订单查询输入框、物流时间线、状态徽标展示
 */
'use client';
import React, { useState, useMemo } from 'react';
import { DeliveryTimeline, type TrackingEvent } from './DeliveryTimeline';
import { DeliveryStatusBadge, type DeliveryStatus } from './DeliveryStatusBadge';

/* ── 模拟订单物流数据 (MOCK, 实际由 API 获取) ── */
const MOCK_TRACKING: Record<string, { carrier: string; trackingNumber: string; status: DeliveryStatus; events: TrackingEvent[] }> = {
  'ORD-20260708-001': {
    carrier: '顺丰速运',
    trackingNumber: 'SF1234567890',
    status: 'in_transit',
    events: [
      { id: 'e1', timestamp: '2026-07-08T09:00:00Z', description: '订单已确认', status: 'completed', location: '系统' },
      { id: 'e2', timestamp: '2026-07-08T09:30:00Z', description: '包裹已揽收', status: 'completed', location: '深圳仓库' },
      { id: 'e3', timestamp: '2026-07-08T11:00:00Z', description: '到达深圳分拣中心', status: 'completed', location: '深圳分拣中心' },
      { id: 'e4', timestamp: '2026-07-08T14:00:00Z', description: '离开深圳分拣中心', status: 'current', location: '深圳分拣中心' },
      { id: 'e5', timestamp: '2026-07-08T18:00:00Z', description: '到达广州中转站', status: 'pending', location: '广州中转站' },
      { id: 'e6', timestamp: '2026-07-09T06:00:00Z', description: '离开广州中转站', status: 'pending', location: '广州中转站' },
      { id: 'e7', timestamp: '2026-07-09T10:00:00Z', description: '到达目的地派送站', status: 'pending', location: '上海浦东派送站' },
      { id: 'e8', timestamp: '2026-07-09T14:00:00Z', description: '派送中', status: 'pending', location: '上海浦东' },
    ],
  },
  'ORD-20260707-002': {
    carrier: '中通快递',
    trackingNumber: 'ZT0987654321',
    status: 'delivered',
    events: [
      { id: 'e1', timestamp: '2026-07-06T08:00:00Z', description: '订单已确认', status: 'completed', location: '系统' },
      { id: 'e2', timestamp: '2026-07-06T10:00:00Z', description: '包裹已揽收', status: 'completed', location: '北京仓库' },
      { id: 'e3', timestamp: '2026-07-06T15:00:00Z', description: '到达北京分拣中心', status: 'completed', location: '北京分拣中心' },
      { id: 'e4', timestamp: '2026-07-07T08:00:00Z', description: '到达目的地分拣中心', status: 'completed', location: '上海浦西分拣中心' },
      { id: 'e5', timestamp: '2026-07-07T10:00:00Z', description: '派送中', status: 'completed', location: '上海浦西' },
      { id: 'e6', timestamp: '2026-07-07T14:30:00Z', description: '已签收', status: 'completed', location: '上海浦西', note: '前台签收' },
    ],
  },
};

/* ── Props ── */
export interface DeliveryTrackingClientProps {
  initialOrderId?: string;
  onSearch?: (orderId: string) => void;
}

/* ── Component ── */
export function DeliveryTrackingClient({ initialOrderId, onSearch }: DeliveryTrackingClientProps) {
  const [orderId, setOrderId] = useState(initialOrderId ?? '');
  const [searchedOrderId, setSearchedOrderId] = useState(initialOrderId ?? '');

  // 当父组件更新 initialOrderId 时，同步执行搜索
  React.useEffect(() => {
    if (initialOrderId && initialOrderId !== searchedOrderId) {
      setOrderId(initialOrderId);
      setSearchedOrderId(initialOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderId]);

  const trackingInfo = useMemo(() => {
    if (!searchedOrderId) return null;
    return MOCK_TRACKING[searchedOrderId] ?? null;
  }, [searchedOrderId]);

  const handleSearch = () => {
    const trimmed = orderId.trim();
    setSearchedOrderId(trimmed);
    if (trimmed && onSearch) {
      onSearch(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📦 物流追踪</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
        输入订单号查询物流配送进度
      </p>

      {/* 搜索输入框 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          data-testid="delivery-order-input"
          type="text"
          placeholder="请输入订单号，如 ORD-20260708-001"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          data-testid="delivery-search-btn"
          onClick={handleSearch}
          style={{
            padding: '8px 20px',
            backgroundColor: '#1890ff',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          查询
        </button>
      </div>

      {/* 查询结果 */}
      {searchedOrderId && !trackingInfo && (
        <div
          data-testid="delivery-not-found"
          style={{
            textAlign: 'center',
            padding: 32,
            backgroundColor: '#fffbe6',
            borderRadius: 8,
            border: '1px solid #ffe58f',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>未找到订单</div>
          <div style={{ fontSize: 14, color: '#999' }}>请检查订单号是否正确</div>
        </div>
      )}

      {/* 物流详情 */}
      {trackingInfo && (
        <div data-testid="delivery-result">
          {/* 订单头部 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 12,
              borderBottom: '1px solid #f0f0f0',
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{searchedOrderId}</div>
            </div>
            <DeliveryStatusBadge status={trackingInfo.status} />
          </div>

          {/* 时间线 */}
          <DeliveryTimeline
            events={trackingInfo.events}
            trackingNumber={trackingInfo.trackingNumber}
            carrier={trackingInfo.carrier}
          />
        </div>
      )}
    </div>
  );
}
