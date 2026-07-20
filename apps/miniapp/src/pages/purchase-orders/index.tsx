/**
 * 采购单列表页 — 小程序端 (Taro)
 * 角色视角: 👔店长
 * 功能: 列表搜索、状态筛选、分页浏览
 */
import { View, Text, Button, Input, Picker } from '@tarojs/components';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import Taro from '@tarojs/taro';
import {
  loadMiniappPurchaseOrders,
  type MiniappPurchaseOrderListItem,
} from '../../supplychain-runtime';
import { TriStateContainer, useTriState, PageSkeleton, EmptyState } from '../../components/TriStateComponents';

// ---- 类型 ----

type OrderStatus = MiniappPurchaseOrderListItem['status'];
type PurchaseOrder = MiniappPurchaseOrderListItem;

const STATUS_OPTIONS = ['全部', '草稿', '已提交', '已确认', '已发货', '已收货', '已取消'] as const;
const STATUS_MAP: Record<string, OrderStatus | 'ALL'> = {
  '全部': 'ALL',
  '草稿': 'draft',
  '已提交': 'submitted',
  '已确认': 'confirmed',
  '已发货': 'shipped',
  '已收货': 'received',
  '已取消': 'cancelled',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: '草稿', submitted: '已提交', confirmed: '已确认',
  shipped: '已发货', received: '已收货', cancelled: '已取消',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  draft: '#f59e0b', submitted: '#3b82f6', confirmed: '#22c55e',
  shipped: '#06b6d4', received: '#64748b', cancelled: '#ef4444',
};

// ---- Mock 数据 ----

const MOCK_ORDERS: PurchaseOrder[] = [
  { id: '1', orderNo: 'PO-20260601-001', supplier: '广州美妆供应链有限公司', totalAmount: 28600, status: 'received', itemsCount: 12, orderDate: '2026-06-01' },
  { id: '2', orderNo: 'PO-20260605-002', supplier: '上海日化贸易有限公司', totalAmount: 15800, status: 'shipped', itemsCount: 8, orderDate: '2026-06-05' },
  { id: '3', orderNo: 'PO-20260610-003', supplier: '深圳包材创新有限公司', totalAmount: 8900, status: 'confirmed', itemsCount: 6, orderDate: '2026-06-10' },
  { id: '4', orderNo: 'PO-20260612-004', supplier: '杭州香氛科技有限公司', totalAmount: 4200, status: 'submitted', itemsCount: 3, orderDate: '2026-06-12' },
  { id: '5', orderNo: 'PO-20260615-005', supplier: '广州妆具工贸有限公司', totalAmount: 12600, status: 'draft', itemsCount: 10, orderDate: '2026-06-15' },
  { id: '6', orderNo: 'PO-20260618-006', supplier: '广州美妆供应链有限公司', totalAmount: 34000, status: 'shipped', itemsCount: 15, orderDate: '2026-06-18' },
  { id: '7', orderNo: 'PO-20260620-007', supplier: '上海日化贸易有限公司', totalAmount: 7500, status: 'cancelled', itemsCount: 5, orderDate: '2026-06-20' },
  { id: '8', orderNo: 'PO-20260622-008', supplier: '深圳包材创新有限公司', totalAmount: 5200, status: 'received', itemsCount: 4, orderDate: '2026-06-22' },
];

const PAGE_SIZE = 5;

export default function PurchaseOrdersPage() {
  const { status: pageStatus, setLoading, setError, setEmpty, setSuccess } = useTriState('loading');
  const [orders, setOrders] = useState<PurchaseOrder[]>(MOCK_ORDERS);
  const [deliveryNote, setDeliveryNote] = useState('当前展示本地演示采购单数据。');
  const [searchText, setSearchText] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);
  const [page, setPage] = useState(1);

  const handleRetry = useCallback(() => {
    setLoading();
    loadMiniappPurchaseOrders(MOCK_ORDERS)
      .then((snapshot) => {
        setOrders(snapshot.data);
        setDeliveryNote(snapshot.note);
        if (snapshot.data.length === 0) {
          setEmpty();
        } else {
          setSuccess();
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '重试失败');
      });
  }, [setLoading, setError, setEmpty, setSuccess]);

  useEffect(() => {
    let cancelled = false;

    setLoading();
    loadMiniappPurchaseOrders(MOCK_ORDERS)
      .then((snapshot) => {
        if (!cancelled) {
          setOrders(snapshot.data);
          setDeliveryNote(snapshot.note);
          if (snapshot.data.length === 0) {
            setEmpty();
          } else {
            setSuccess();
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载采购单失败');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabel = (STATUS_OPTIONS[statusIdx] ?? '全部') as string;
  const statusFilter: OrderStatus | 'ALL' = STATUS_MAP[statusLabel] ?? 'ALL';

  const filtered = useMemo(() => {
    const raw = searchText
      ? orders.filter(
          (o) =>
            o.orderNo.toLowerCase().includes(searchText.toLowerCase()) ||
            o.supplier.includes(searchText),
        )
      : orders;
    return statusFilter === 'ALL'
      ? raw
      : raw.filter((o) => o.status === statusFilter);
  }, [orders, searchText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = orders.length;
    const totalAmount = orders.reduce((s, o) => s + o.totalAmount, 0);
    const received = orders.filter((o) => o.status === 'received').length;
    return { total, totalAmount, received };
  }, [orders]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleStatusChange = (e: { detail: { value: string | number } }) => {
    setStatusIdx(Number(e.detail.value));
    setPage(1);
  };

  const goToDetail = (id: string) => {
    void Taro.navigateTo({ url: `/pages/purchase-orders/detail/index?id=${id}` });
  };

  const formatAmount = (v: number): string => {
    if (v >= 10000) return `¥${(v / 10000).toFixed(1)}万`;
    return `¥${v.toLocaleString()}`;
  };

  return (
    <TriStateContainer
      status={pageStatus}
      errorTitle="采购单加载失败"
      errorMessage="无法加载采购单数据，请检查网络后重试"
      onRetry={handleRetry}
      emptyIcon="📋"
      emptyTitle="暂无采购单"
      emptyDescription="当前没有符合条件的采购单数据"
      loadingComponent={<PageSkeleton />}
    >
    <View style={{ padding: '16px', color: '#e2e8f0', background: '#0f172a', minHeight: '100vh' }}>
      {/* 标题 */}
      <Text style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>采购单</Text>
      <View style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>{deliveryNote}</Text>
      </View>

      {/* 统计卡片 */}
      <View style={{ display: 'flex', gap: '8px', marginTop: 16 }}>
        <View style={cardStyle}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>总采购单</Text>
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa' }}>{stats.total}</Text>
        </View>
        <View style={cardStyle}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>已收货</Text>
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>{stats.received}</Text>
        </View>
        <View style={cardStyle}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>总金额</Text>
          <Text style={{ fontSize: 18, fontWeight: 700, color: '#facc15' }}>{formatAmount(stats.totalAmount)}</Text>
        </View>
      </View>

      {/* 搜索栏 */}
      <View style={{ display: 'flex', gap: '8px', marginTop: 16, alignItems: 'center' }}>
        <Input
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            background: '#1e293b',
            color: '#e2e8f0',
            fontSize: 14,
            border: '1px solid rgba(148,163,184,0.2)',
          }}
          placeholder="搜索单号/供应商..."
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
          onConfirm={handleSearch}
        />
        <Button
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: '#3b82f6',
            color: '#fff',
            fontSize: 14,
            border: 'none',
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
            padding: '8px 12px',
            borderRadius: 8,
            background: '#1e293b',
            border: '1px solid rgba(148,163,184,0.2)',
          }}>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>
              状态筛选：{STATUS_OPTIONS[statusIdx]}
            </Text>
          </View>
        </Picker>
      </View>

      {/* 列表 */}
      <View style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={searchText ? '🔍' : '📋'}
            title={searchText || statusIdx > 0 ? '未找到匹配结果' : '暂无采购单'}
            description={searchText || statusIdx > 0 ? '尝试修改搜索关键词或筛选条件' : undefined}
            compact
          />
        ) : (
          pageItems.map((order) => (
            <View
              key={order.id}
              style={{
                padding: '14px',
                borderRadius: 12,
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(148,163,184,0.1)',
              }}
              onClick={() => goToDetail(order.id)}
            >
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa' }}>{order.orderNo}</Text>
                <View style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: `${STATUS_COLORS[order.status]}22`,
                  border: `1px solid ${STATUS_COLORS[order.status]}44`,
                }}>
                  <Text style={{ fontSize: 11, color: STATUS_COLORS[order.status] }}>
                    {STATUS_LABELS[order.status]}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>{order.supplier}</Text>
              <View style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 13, color: '#94a3b8' }}>{order.itemsCount} 项商品</Text>
                <Text style={{ fontSize: 15, fontWeight: 600, color: '#facc15' }}>
                  ¥{order.totalAmount.toLocaleString()}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>采购日期：{order.orderDate}</Text>
            </View>
          ))
        )}
      </View>

      {/* 分页 */}
      {filtered.length > 0 && (
        <View style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: 20, alignItems: 'center' }}>
          <Button
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              background: page <= 1 ? '#1e293b' : '#3b82f6',
              color: page <= 1 ? '#64748b' : '#fff',
              fontSize: 13,
              border: 'none',
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
              padding: '6px 16px',
              borderRadius: 8,
              background: page >= totalPages ? '#1e293b' : '#3b82f6',
              color: page >= totalPages ? '#64748b' : '#fff',
              fontSize: 13,
              border: 'none',
            }}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            下一页
          </Button>
        </View>
      )}

      {/* 底部导航 */}
      <View style={{ marginTop: 24, textAlign: 'center' }}>
        <Text style={{ fontSize: 12, color: '#475569' }}>
          共 {filtered.length} 条记录
        </Text>
      </View>
    </View>
    </TriStateContainer>
  );
}

const cardStyle: CSSProperties = {
  flex: 1,
  padding: '12px',
  borderRadius: 10,
  background: 'rgba(15, 23, 42, 0.4)',
  border: '1px solid rgba(148,163,184,0.1)',
};
