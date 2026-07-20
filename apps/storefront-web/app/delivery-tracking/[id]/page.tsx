/**
 * 物流配送详情页 — Delivery Detail Page (Next.js App Router / Dynamic Route)
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 类型: B-页面创建 / 详情页
 * 功能: 查看单票物流详情、时间线、轨迹地图展示、联系承运方
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useCallback, useState } from 'react';
import {
  PageShell,
  DetailShell,
  DescriptionList,
  StatusBadge,
  Button,
  Modal,
  ToastContainer,
  useToast,
} from '@m5/ui';
import { DeliveryTimeline, type TrackingEvent } from '../components/DeliveryTimeline';
import { DeliveryStatusBadge, type DeliveryStatus, DELIVERY_STATUS_LABEL } from '../components/DeliveryStatusBadge';

/* ── 模拟完整配送数据 (MOCK, 实际由 API 获取) ── */
interface DeliveryDetail {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: DeliveryStatus;
  sender: string;
  senderContact: string;
  receiver: string;
  receiverContact: string;
  receiverAddress: string;
  estimatedDelivery: string;
  weight: string;
  packageCount: number;
  remark?: string;
  events: TrackingEvent[];
}

const MOCK_DELIVERIES: Record<string, DeliveryDetail> = {
  'ORD-20260708-001': {
    orderId: 'ORD-20260708-001',
    carrier: '顺丰速运',
    trackingNumber: 'SF1234567890',
    status: 'in_transit',
    sender: '电玩设备有限公司',
    senderContact: '0755-88886666',
    receiver: '上海浦东新区XX电玩城',
    receiverContact: '13800138001',
    receiverAddress: '上海市浦东新区张杨路1000号XX商场3F',
    estimatedDelivery: '2026-07-10',
    weight: '85.5 kg',
    packageCount: 2,
    remark: '含游戏主板2块，需轻拿轻放',
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
    orderId: 'ORD-20260707-002',
    carrier: '中通快递',
    trackingNumber: 'ZT0987654321',
    status: 'delivered',
    sender: '广州配件供应中心',
    senderContact: '020-88889999',
    receiver: '北京朝阳XX游艺厅',
    receiverContact: '13900139002',
    receiverAddress: '北京市朝阳区建国路88号XX广场B1',
    estimatedDelivery: '2026-07-08',
    weight: '32.0 kg',
    packageCount: 1,
    events: [
      { id: 'e1', timestamp: '2026-07-06T08:00:00Z', description: '订单已确认', status: 'completed', location: '系统' },
      { id: 'e2', timestamp: '2026-07-06T10:00:00Z', description: '包裹已揽收', status: 'completed', location: '广州仓库' },
      { id: 'e3', timestamp: '2026-07-06T14:00:00Z', description: '到达广州分拣中心', status: 'completed', location: '广州分拣中心' },
      { id: 'e4', timestamp: '2026-07-07T02:00:00Z', description: '到达北京中转站', status: 'completed', location: '北京中转站' },
      { id: 'e5', timestamp: '2026-07-07T08:00:00Z', description: '离开北京中转站', status: 'completed', location: '北京中转站' },
      { id: 'e6', timestamp: '2026-07-07T11:00:00Z', description: '到达目的地派送站', status: 'completed', location: '北京朝阳派送站' },
      { id: 'e7', timestamp: '2026-07-07T15:00:00Z', description: '签收人: 李明', status: 'completed', location: '北京朝阳XX游艺厅' },
    ],
  },
  'TRK-20260709-003': {
    orderId: 'TRK-20260709-003',
    carrier: '京东物流',
    trackingNumber: 'JD555566667777',
    status: 'out_for_delivery',
    sender: '上海设备仓库',
    senderContact: '021-66667777',
    receiver: '杭州西湖区XX电玩',
    receiverContact: '13700137003',
    receiverAddress: '杭州市西湖区文三路200号XX数码城2F',
    estimatedDelivery: '2026-07-09',
    weight: '120.0 kg',
    packageCount: 3,
    remark: '大型框体设备，需叉车卸货',
    events: [
      { id: 'e1', timestamp: '2026-07-07T09:00:00Z', description: '订单已确认', status: 'completed', location: '系统' },
      { id: 'e2', timestamp: '2026-07-07T14:00:00Z', description: '包裹已揽收', status: 'completed', location: '上海仓库' },
      { id: 'e3', timestamp: '2026-07-08T06:00:00Z', description: '到达杭州中转站', status: 'completed', location: '杭州中转站' },
      { id: 'e4', timestamp: '2026-07-09T08:00:00Z', description: '到达杭州西湖派送站', status: 'completed', location: '杭州西湖派送站' },
      { id: 'e5', timestamp: '2026-07-09T10:00:00Z', description: '派送中', status: 'current', location: '杭州市西湖区' },
    ],
  },
  'TRK-20260706-004': {
    orderId: 'TRK-20260706-004',
    carrier: '圆通速递',
    trackingNumber: 'YT333344445555',
    status: 'exception',
    sender: '深圳配件中心',
    senderContact: '0755-55554444',
    receiver: '成都锦江区XX电玩城',
    receiverContact: '13600136004',
    receiverAddress: '成都市锦江区东大街100号XX广场5F',
    estimatedDelivery: '2026-07-09',
    weight: '15.0 kg',
    packageCount: 1,
    remark: '外包装破损，已联系发件方',
    events: [
      { id: 'e1', timestamp: '2026-07-06T10:00:00Z', description: '订单已确认', status: 'completed', location: '系统' },
      { id: 'e2', timestamp: '2026-07-06T14:00:00Z', description: '包裹已揽收', status: 'completed', location: '深圳仓库' },
      { id: 'e3', timestamp: '2026-07-07T03:00:00Z', description: '到达武汉中转站', status: 'completed', location: '武汉中转站' },
      { id: 'e4', timestamp: '2026-07-08T08:00:00Z', description: '包裹异常 — 外包装破损', status: 'current', location: '武汉中转站', note: '已联系发件方确认处理方案' },
    ],
  },
};

/* ── Helper ── */
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── 配送详情页面 ── */
export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [loading, _setLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>加载中...</div>;
  if (error) return <div style={{ padding: 48, textAlign: 'center', color: '#f87171' }}>数据获取失败: {error}</div>;
  const { toasts, dismiss } = toast;
  const id = useMemo(() => String(params?.id ?? ''), [params]);

  const detail = useMemo<DeliveryDetail | null>(() => MOCK_DELIVERIES[id] ?? null, [id]);

  /* 联系承运方弹窗 */
  const [contactOpen, setContactOpen] = useState(false);

  const handleContactCarrier = useCallback(() => {
    setContactOpen(true);
  }, []);

  const handleCallSender = useCallback(() => {
    toast.success('已通知发件方客服，预计5分钟内回电');
    setContactOpen(false);
  }, [toast]);

  const handleCallCarrier = useCallback(() => {
    toast.success('已转接承运方客服');
    setContactOpen(false);
  }, [toast]);

  const handleBack = useCallback(() => {
    router.push('/delivery-tracking');
  }, [router]);

  /* 未找到配送记录 */
  if (!detail) {
    return (
      <PageShell title="配送详情">
        <DetailShell title="配送详情">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h2 style={{ color: '#94a3b8', margin: '0 0 8px' }}>未找到配送记录</h2>
            <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 14 }}>
              查询编号: {id || '(空)'}
            </p>
            <Button variant="primary" onClick={handleBack}>
              返回配送列表
            </Button>
          </div>
        </DetailShell>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`配送详情 · ${detail.orderId}`}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={handleContactCarrier}>
            📞 联系承运方
          </Button>
        </div>
      }
    >
      <DetailShell title={`配送跟踪 · ${detail.orderId}`} onBack={handleBack} backLabel="返回配送列表">
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24, flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, color: '#f8fafc' }}>
              配送单号: {detail.orderId}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              物流单号: {detail.trackingNumber}
            </p>
          </div>
          <DeliveryStatusBadge status={detail.status} />
        </div>

        {/* 配送信息概览 */}
        <DescriptionList
          columns={2}
          items={[
            { label: '承运方', value: detail.carrier },
            { label: '预计送达', value: detail.estimatedDelivery },
            { label: '重量', value: detail.weight },
            { label: '件数', value: `${detail.packageCount} 件` },
            { label: '发件方', value: detail.sender },
            { label: '发件方电话', value: detail.senderContact },
            { label: '收件方', value: detail.receiver },
            { label: '收件方电话', value: detail.receiverContact },
            { label: '收件地址', value: detail.receiverAddress, span: 2 },
          ]}
        />

        {detail.remark && (
          <div style={{
            marginTop: 16, padding: 12, borderRadius: 8,
            background: 'rgba(250, 173, 20, 0.08)',
            border: '1px solid rgba(250, 173, 20, 0.2)',
            fontSize: 13, color: '#eab308',
          }}>
            📌 备注: {detail.remark}
          </div>
        )}

        {/* 分隔线 */}
        <div style={{ height: 1, background: 'rgba(148, 163, 184, 0.1)', margin: '24px 0' }} />

        {/* 物流时间线 */}
        <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#e2e8f0' }}>
          物流轨迹
        </h3>
        <DeliveryTimeline
          events={detail.events}
          trackingNumber={detail.trackingNumber}
          carrier={detail.carrier}
        />
      </DetailShell>

      {/* 联系承运方弹窗 */}
      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="联系承运方"
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
            当前配送由 <strong style={{ color: '#e2e8f0' }}>{detail.carrier}</strong> 承运，物流单号 {detail.trackingNumber}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button variant="primary" onClick={handleCallCarrier} style={{ width: '100%' }}>
              联系 {detail.carrier} 客服
            </Button>
            <Button variant="secondary" onClick={handleCallSender} style={{ width: '100%' }}>
              联系发件方 ({detail.sender})
            </Button>
            <Button variant="ghost" onClick={() => setContactOpen(false)} style={{ width: '100%' }}>
              取消
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </PageShell>
  );
}
