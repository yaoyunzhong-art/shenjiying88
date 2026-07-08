/**
 * 退货单列表页 — 小程序端 (Taro)
 * 角色视角: 🧾 仓管/售后
 * 功能: 列表搜索、状态筛选、分页浏览
 */
import { View, Text, Button, Input, Picker } from '@tarojs/components';
import { useState, useMemo } from 'react';
import Taro from '@tarojs/taro';

// ---- 类型 ----

type ReturnStatus = 'pending' | 'inspecting' | 'approved' | 'rejected' | 'refunded' | 'exchanged' | 'closed';

interface ReturnOrder {
  id: string;
  returnNo: string;
  customerName: string;
  phone: string;
  productName: string;
  reason: string;
  amount: number;
  status: ReturnStatus;
  createdDate: string;
}

const STATUS_OPTIONS = ['全部', '待处理', '质检中', '已通过', '已拒绝', '已退款', '已换货', '已关闭'] as const;
const STATUS_MAP: Record<string, ReturnStatus | 'ALL'> = {
  '全部': 'ALL',
  '待处理': 'pending',
  '质检中': 'inspecting',
  '已通过': 'approved',
  '已拒绝': 'rejected',
  '已退款': 'refunded',
  '已换货': 'exchanged',
  '已关闭': 'closed',
};

const STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: '待处理', inspecting: '质检中', approved: '已通过',
  rejected: '已拒绝', refunded: '已退款', exchanged: '已换货', closed: '已关闭',
};

const STATUS_COLORS: Record<ReturnStatus, string> = {
  pending: '#f97316', inspecting: '#3b82f6', approved: '#22c55e',
  rejected: '#ef4444', refunded: '#8b5cf6', exchanged: '#06b6d4', closed: '#64748b',
};

// ---- Mock 数据 ----

const MOCK_RETURNS: ReturnOrder[] = [
  { id: '1', returnNo: 'RT-20260701-001', customerName: '张小明', phone: '138****1234', productName: '轻奢精华液 50ml', reason: '过敏不适', amount: 399, status: 'pending', createdDate: '2026-07-01' },
  { id: '2', returnNo: 'RT-20260702-002', customerName: '李芳', phone: '159****5678', productName: '防晒霜 SPF50', reason: '包装破损', amount: 168, status: 'inspecting', createdDate: '2026-07-02' },
  { id: '3', returnNo: 'RT-20260703-003', customerName: '王晨', phone: '136****9012', productName: '水乳套装 清爽型', reason: '效果不满意', amount: 298, status: 'approved', createdDate: '2026-07-03' },
  { id: '4', returnNo: 'RT-20260704-004', customerName: '刘佳', phone: '177****3456', productName: '眼霜 15g', reason: '发错货', amount: 259, status: 'refunded', createdDate: '2026-07-04' },
  { id: '5', returnNo: 'RT-20260705-005', customerName: '陈伟', phone: '150****7890', productName: '面膜 5片装', reason: '品质问题', amount: 89, status: 'exchanged', createdDate: '2026-07-05' },
  { id: '6', returnNo: 'RT-20260706-006', customerName: '赵丽', phone: '188****2345', productName: '洗面奶 120g', reason: '过敏不适', amount: 129, status: 'rejected', createdDate: '2026-07-06' },
  { id: '7', returnNo: 'RT-20260707-007', customerName: '孙浩', phone: '139****6789', productName: '保湿喷雾 300ml', reason: '超过退货期', amount: 79, status: 'closed', createdDate: '2026-07-07' },
  { id: '8', returnNo: 'RT-20260708-008', customerName: '周婷', phone: '186****0123', productName: '身体乳 200ml', reason: '效果不满意', amount: 139, status: 'pending', createdDate: '2026-07-08' },
];

const PAGE_SIZE = 5;

export default function ReturnOrdersPage() {
  const [searchText, setSearchText] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);
  const [page, setPage] = useState(1);

  const statusLabel = (STATUS_OPTIONS[statusIdx] ?? '全部') as string;
  const statusFilter: ReturnStatus | 'ALL' = STATUS_MAP[statusLabel] ?? 'ALL';

  const filtered = useMemo(() => {
    const raw = searchText
      ? MOCK_RETURNS.filter(
          (r) =>
            r.returnNo.toLowerCase().includes(searchText.toLowerCase()) ||
            r.customerName.includes(searchText) ||
            r.productName.includes(searchText),
        )
      : MOCK_RETURNS;
    return statusFilter === 'ALL'
      ? raw
      : raw.filter((r) => r.status === statusFilter);
  }, [searchText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = MOCK_RETURNS.length;
    const totalAmount = MOCK_RETURNS.reduce((s, r) => s + r.amount, 0);
    const pending = MOCK_RETURNS.filter((r) => r.status === 'pending').length;
    return { total, totalAmount, pending };
  }, []);

  const handleSearch = () => setPage(1);

  const handleStatusChange = (e: { detail: { value: string | number } }) => {
    setStatusIdx(Number(e.detail.value));
    setPage(1);
  };

  const goToDetail = (id: string) => {
    Taro.showToast({ title: `查看退货单 ${id}`, icon: 'none' });
  };

  const formatAmount = (v: number): string => {
    if (v >= 10000) return `¥${(v / 10000).toFixed(1)}万`;
    return `¥${v.toLocaleString()}`;
  };

  return (
    <View style={{ padding: '16px', color: '#e2e8f0', background: '#0f172a', minHeight: '100vh' }}>
      {/* 标题 */}
      <Text style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>退货售后</Text>

      {/* 统计卡片 */}
      <View style={{ display: 'flex', gap: '8px', marginTop: 16 }}>
        <View style={cardStyle}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>总退货单</Text>
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa' }}>{stats.total}</Text>
        </View>
        <View style={cardStyle}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>待处理</Text>
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#f97316' }}>{stats.pending}</Text>
        </View>
        <View style={cardStyle}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>退款总额</Text>
          <Text style={{ fontSize: 18, fontWeight: 700, color: '#facc15' }}>{formatAmount(stats.totalAmount)}</Text>
        </View>
      </View>

      {/* 搜索栏 */}
      <View style={{ display: 'flex', gap: '8px', marginTop: 16, alignItems: 'center' }}>
        <Input
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            background: '#1e293b', color: '#e2e8f0', fontSize: 14,
            border: '1px solid rgba(148,163,184,0.2)',
          }}
          placeholder="搜索退单号/客户名/商品..."
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
          onConfirm={handleSearch}
        />
        <Button
          style={{
            padding: '8px 16px', borderRadius: 8,
            background: '#3b82f6', color: '#fff', fontSize: 14, border: 'none',
          }}
          onClick={handleSearch}
        >
          搜索
        </Button>
      </View>

      {/* 状态筛选 */}
      <View style={{ marginTop: 12 }}>
        <Picker mode="selector" range={STATUS_OPTIONS as unknown as string[]} value={statusIdx} onChange={handleStatusChange}>
          <View style={{
            padding: '8px 12px', borderRadius: 8,
            background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)',
          }}>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>
              状态筛选：{STATUS_OPTIONS[statusIdx]}
            </Text>
          </View>
        </Picker>
      </View>

      {/* 列表 */}
      <View style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pageItems.length === 0 ? (
          <View style={{ padding: 24, textAlign: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 14 }}>暂无符合条件的退货单</Text>
          </View>
        ) : (
          pageItems.map((ro) => (
            <View
              key={ro.id}
              style={{
                padding: '14px', borderRadius: 12,
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(148,163,184,0.1)',
              }}
              onClick={() => goToDetail(ro.id)}
            >
              {/* 头部：单号 + 状态 */}
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#f97316' }}>{ro.returnNo}</Text>
                <View style={{
                  padding: '2px 8px', borderRadius: 10,
                  background: `${STATUS_COLORS[ro.status]}22`,
                  border: `1px solid ${STATUS_COLORS[ro.status]}44`,
                }}>
                  <Text style={{ fontSize: 11, color: STATUS_COLORS[ro.status] }}>
                    {STATUS_LABELS[ro.status]}
                  </Text>
                </View>
              </View>

              {/* 商品信息 */}
              <Text style={{ fontSize: 13, color: '#e2e8f0', marginTop: 6 }}>{ro.productName}</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                {ro.customerName} · {ro.phone}
              </Text>

              {/* 底部：原因 + 金额 */}
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <View style={{
                  padding: '2px 8px', borderRadius: 6,
                  background: 'rgba(239, 68, 68, 0.1)',
                  maxWidth: '60%',
                }}>
                  <Text style={{ fontSize: 12, color: '#fca5a5' }}>{ro.reason}</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: 600, color: '#facc15' }}>
                  ¥{ro.amount.toLocaleString()}
                </Text>
              </View>

              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                申请日期：{ro.createdDate}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* 分页 */}
      {filtered.length > 0 && (
        <View style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: 20, alignItems: 'center' }}>
          <Button
            style={{
              padding: '6px 16px', borderRadius: 8,
              background: page <= 1 ? '#1e293b' : '#3b82f6',
              color: page <= 1 ? '#64748b' : '#fff',
              fontSize: 13, border: 'none',
            }}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          <Text style={{ fontSize: 13, color: '#94a3b8' }}>
            {safePage} / {totalPages}
          </Text>
          <Button
            style={{
              padding: '6px 16px', borderRadius: 8,
              background: page >= totalPages ? '#1e293b' : '#3b82f6',
              color: page >= totalPages ? '#64748b' : '#fff',
              fontSize: 13, border: 'none',
            }}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            下一页
          </Button>
        </View>
      )}

      <View style={{ marginTop: 24, textAlign: 'center' }}>
        <Text style={{ fontSize: 12, color: '#475569' }}>
          共 {filtered.length} 条记录
        </Text>
      </View>
    </View>
  );
}

const cardStyle: React.CSSProperties = {
  flex: 1, padding: '12px', borderRadius: 10,
  background: 'rgba(15, 23, 42, 0.4)',
  border: '1px solid rgba(148,163,184,0.1)',
};
