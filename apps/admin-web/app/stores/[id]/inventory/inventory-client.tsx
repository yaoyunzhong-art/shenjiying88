'use client';
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useCallback, useEffect, useMemo, useState, useTransition, type CSSProperties } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  PageShell,
  Progress,
  Select,
  Statistic,
  Table,
  Tabs,
  Tag,
  ToastContainer,
  useToast,
} from '@m5/ui';
import type { TableColumn } from '@m5/ui';
import { buildActorHeaders } from '@m5/sdk';

import {
  INVENTORY_PAGE_ACTOR,
  REQUEST_API_BASE,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_VARIANT,
  type InventorySnapshotDelivery,
  type Item,
  type MaterialRequestRecord,
  type RequestStatusFilter,
} from './inventory-data';

type InventoryTab = 'list' | 'category';

const STATUS_VARIANT: Record<Item['status'], 'success' | 'warning'> = {
  normal: 'success',
  low: 'warning',
};

const CARD_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
};

const FILTER_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'minmax(220px, 1.5fr) minmax(160px, 220px) auto',
  alignItems: 'center',
  marginBottom: 16,
};

const REQUEST_FILTER_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'minmax(180px, 1fr) minmax(140px, 180px) auto auto',
  alignItems: 'center',
};

const DETAIL_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

function formatCategoryVariant(category: string): 'default' | 'info' | 'purple' | 'warning' {
  if (category === '耗材') return 'warning';
  if (category === '礼品') return 'purple';
  if (category.includes('饮品')) return 'info';
  return 'default';
}

async function readResponseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(', ');
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  }
  const text = await response.text();
  return text.trim() || `请求失败(${response.status})`;
}

export default function InventoryClient({
  snapshot,
}: {
  snapshot: InventorySnapshotDelivery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [tenantId, setTenantId] = useState(snapshot.tenantId);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Item | null>(null);
  const [showRestock, setShowRestock] = useState(false);
  const [tabKey, setTabKey] = useState<InventoryTab>('list');
  const [requestStatusFilter, setRequestStatusFilter] = useState<RequestStatusFilter>('all');
  const [requestItemId, setRequestItemId] = useState(snapshot.items[0]?.id ?? '');
  const [requestQuantity, setRequestQuantity] = useState('1');
  const [requesterName, setRequesterName] = useState('门店后勤');
  const [requestDepartment, setRequestDepartment] = useState('后勤组');
  const [requestPurpose, setRequestPurpose] = useState('晚班耗材补充');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const { toasts, success, error, info, dismiss } = useToast();

  useEffect(() => {
    setTenantId(snapshot.tenantId);
  }, [snapshot.tenantId]);

  useEffect(() => {
    setRequestItemId((current) =>
      snapshot.items.some((item) => item.id === current) ? current : (snapshot.items[0]?.id ?? ''),
    );
  }, [snapshot.items]);

  const buildInventoryHeaders = useCallback(
    (contentType?: string) => ({
      ...buildActorHeaders({
        ...INVENTORY_PAGE_ACTOR,
        tenantId: tenantId.trim(),
        storeId: snapshot.storeId,
      }),
      ...(contentType ? { 'Content-Type': contentType } : {}),
    }),
    [snapshot.storeId, tenantId],
  );

  const buildTenantSnapshotPath = useCallback(
    (nextTenantId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tenantId', nextTenantId.trim() || snapshot.tenantId);
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams, snapshot.tenantId],
  );

  const refreshSnapshot = useCallback(
    (nextTenantId = tenantId) => {
      const nextPath = buildTenantSnapshotPath(nextTenantId);
      startRefresh(() => {
        router.replace(nextPath);
        router.refresh();
      });
    },
    [buildTenantSnapshotPath, router, startRefresh, tenantId],
  );

  const lowStock = snapshot.items.filter((item) => item.stock < item.threshold);
  const totalVal = snapshot.items.reduce((sum, item) => sum + item.totalValue, 0);
  const totalStock = snapshot.items.reduce((sum, item) => sum + item.stock, 0);
  const safeCount = snapshot.items.filter((item) => item.stock >= item.threshold).length;
  const selectedRequestItem = snapshot.items.find((item) => item.id === requestItemId) ?? snapshot.items[0];

  const filtered = useMemo(() => {
    return snapshot.items.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.includes(search) ||
        item.category.includes(search) ||
        item.supplier.includes(search) ||
        item.id.includes(search);
      const matchesCategory = catFilter === 'all' || item.category === catFilter;
      return matchesSearch && matchesCategory;
    });
  }, [catFilter, search, snapshot.items]);

  const categorySummary = useMemo(
    () =>
      snapshot.categories.map((category) => ({
        name: category,
        count: snapshot.items.filter((item) => item.category === category).length,
        value: snapshot.items
          .filter((item) => item.category === category)
          .reduce((sum, item) => sum + item.totalValue, 0),
        low: snapshot.items.filter((item) => item.category === category && item.stock < item.threshold).length,
      })),
    [snapshot.categories, snapshot.items],
  );

  const filteredRequests = useMemo(() => {
    if (requestStatusFilter === 'all') return snapshot.requests;
    return snapshot.requests.filter((request) => request.status === requestStatusFilter);
  }, [requestStatusFilter, snapshot.requests]);

  const openRequestModal = useCallback((item?: Item) => {
    if (item) {
      setRequestItemId(item.id);
      setRequestQuantity('1');
      setRequestPurpose(`${item.name} 现场补充申领`);
    }
    setShowRequestModal(true);
  }, []);

  const resetRequestForm = useCallback(() => {
    setRequestItemId(snapshot.items[0]?.id ?? '');
    setRequestQuantity('1');
    setRequesterName('门店后勤');
    setRequestDepartment('后勤组');
    setRequestPurpose('晚班耗材补充');
  }, [snapshot.items]);

  const handleCreateMaterialRequest = useCallback(async () => {
    const normalizedTenantId = tenantId.trim();
    const normalizedRequesterName = requesterName.trim();
    const normalizedPurpose = requestPurpose.trim();
    const quantity = Number(requestQuantity);

    if (!normalizedTenantId) return error('请先填写 tenantId');
    if (!selectedRequestItem) return error('请选择申领物资');
    if (!normalizedRequesterName) return error('请填写申领人');
    if (!normalizedPurpose) return error('请填写申领用途');
    if (!Number.isFinite(quantity) || quantity <= 0) return error('申领数量必须大于 0');

    setRequestSubmitting(true);
    try {
      const response = await fetch(REQUEST_API_BASE, {
        method: 'POST',
        headers: buildInventoryHeaders('application/json'),
        body: JSON.stringify({
          storeId: snapshot.storeId,
          requesterId: `req-${snapshot.storeId}`,
          requesterName: normalizedRequesterName,
          department: requestDepartment.trim(),
          purpose: normalizedPurpose,
          items: [
            {
              itemId: selectedRequestItem.id,
              itemName: selectedRequestItem.name,
              category: selectedRequestItem.category,
              unit: selectedRequestItem.unit,
              quantity,
            },
          ],
        }),
      });
      if (!response.ok) throw new Error(await readResponseMessage(response));

      success(`${selectedRequestItem.name} 申领单已创建`);
      setShowRequestModal(false);
      resetRequestForm();
      refreshSnapshot(normalizedTenantId);
    } catch (requestError) {
      error(`创建申领失败：${requestError instanceof Error ? requestError.message : '未知错误'}`);
    } finally {
      setRequestSubmitting(false);
    }
  }, [buildInventoryHeaders, error, refreshSnapshot, requestDepartment, requestPurpose, requestQuantity, requesterName, resetRequestForm, selectedRequestItem, snapshot.storeId, success, tenantId]);

  const handleApproveMaterialRequest = useCallback(async (request: MaterialRequestRecord) => {
    setActiveRequestId(request.id);
    try {
      const response = await fetch(`${REQUEST_API_BASE}/${request.id}/approve`, {
        method: 'POST',
        headers: buildInventoryHeaders('application/json'),
        body: JSON.stringify({
          approverId: 'logistics-manager-01',
          approverName: '后勤主管',
          note: `门店 ${snapshot.storeId} 申领审批通过`,
        }),
      });
      if (!response.ok) throw new Error(await readResponseMessage(response));
      success(`${request.id} 已审批通过`);
      refreshSnapshot();
    } catch (requestError) {
      error(`审批失败：${requestError instanceof Error ? requestError.message : '未知错误'}`);
    } finally {
      setActiveRequestId(null);
    }
  }, [buildInventoryHeaders, error, refreshSnapshot, snapshot.storeId, success]);

  const handleOutboundMaterialRequest = useCallback(async (request: MaterialRequestRecord) => {
    setActiveRequestId(request.id);
    try {
      const response = await fetch(`${REQUEST_API_BASE}/${request.id}/outbound`, {
        method: 'POST',
        headers: buildInventoryHeaders('application/json'),
        body: JSON.stringify({
          operatorId: 'warehouse-keeper-01',
          operatorName: '仓管员',
          warehouseCode: 'WH-P30',
          note: `${request.requesterName} 申领物资已完成出库`,
        }),
      });
      if (!response.ok) throw new Error(await readResponseMessage(response));
      success(`${request.id} 已完成出库`);
      refreshSnapshot();
    } catch (requestError) {
      error(`出库失败：${requestError instanceof Error ? requestError.message : '未知错误'}`);
    } finally {
      setActiveRequestId(null);
    }
  }, [buildInventoryHeaders, error, refreshSnapshot, success]);

  const itemColumns: TableColumn<Item>[] = [
    {
      title: '编号',
      key: 'id',
      width: '110px',
      render: (row) => <span style={{ color: '#93c5fd', fontWeight: 600 }}>{row.id}</span>,
    },
    {
      title: '名称',
      key: 'name',
      width: '160px',
      render: (row) => (
        <div>
          <div style={{ color: '#f8fafc', fontWeight: 600 }}>{row.name}</div>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>{row.supplier}</div>
        </div>
      ),
    },
    {
      title: '分类',
      key: 'category',
      width: '110px',
      render: (row) => (
        <Tag size="sm" variant={formatCategoryVariant(row.category)}>
          {row.category}
        </Tag>
      ),
    },
    {
      title: '库存',
      key: 'stock',
      width: '100px',
      render: (row) => (
        <span
          style={{
            color: row.stock < row.threshold ? '#f87171' : '#e2e8f0',
            fontWeight: row.stock < row.threshold ? 700 : 400,
          }}
        >
          {row.stock}
          {row.unit}
        </span>
      ),
    },
    {
      title: '预警线',
      key: 'threshold',
      width: '100px',
      render: (row) => `${row.threshold}${row.unit}`,
    },
    {
      title: '状态',
      key: 'status',
      width: '90px',
      render: (row) => (
        <Tag size="sm" variant={STATUS_VARIANT[row.status]}>
          {row.status === 'low' ? '需补货' : '正常'}
        </Tag>
      ),
    },
    {
      title: '库存水位',
      key: 'level',
      width: '180px',
      render: (row) => {
        const percent = Math.round((row.stock / row.maxStock) * 100);
        const variant = row.stock < row.threshold ? 'danger' : percent > 85 ? 'info' : 'success';
        return (
          <div style={{ minWidth: 120 }}>
            <Progress value={row.stock} max={row.maxStock} variant={variant} height={8} showLabel={false} />
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: '220px',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" variant="secondary" onClick={() => setShowDetail(row)}>详情</Button>
          <Button size="sm" variant="outline" onClick={() => openRequestModal(row)}>出库</Button>
          <Button size="sm" variant={row.stock < row.threshold ? 'danger' : 'primary'} onClick={() => info(`${row.name} 已加入补货跟踪`)}>
            {row.stock < row.minStock ? '紧急采购' : '补货'}
          </Button>
        </div>
      ),
    },
  ];

  const requestColumns: TableColumn<MaterialRequestRecord>[] = [
    {
      title: '申领单',
      key: 'id',
      width: '180px',
      render: (row) => (
        <div>
          <div style={{ color: '#93c5fd', fontWeight: 600 }}>{row.id}</div>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>{row.storeId ?? snapshot.storeId}</div>
        </div>
      ),
    },
    {
      title: '申领人',
      key: 'requester',
      width: '140px',
      render: (row) => (
        <div>
          <div style={{ color: '#f8fafc', fontWeight: 600 }}>{row.requesterName}</div>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>{row.department ?? '未分组'}</div>
        </div>
      ),
    },
    {
      title: '物料',
      key: 'items',
      width: '220px',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {row.items.map((item) => (
            <div key={`${row.id}-${item.itemId}`}>
              <div style={{ color: '#e2e8f0' }}>{item.itemName}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>
                {item.quantity}
                {item.unit} · {item.category}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '用途',
      key: 'purpose',
      width: '180px',
      render: (row) => <span style={{ color: '#e2e8f0' }}>{row.purpose}</span>,
    },
    {
      title: '状态',
      key: 'status',
      width: '100px',
      render: (row) => (
        <Tag size="sm" variant={REQUEST_STATUS_VARIANT[row.status]}>
          {REQUEST_STATUS_LABEL[row.status]}
        </Tag>
      ),
    },
    {
      title: '流转记录',
      key: 'timeline',
      width: '220px',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#94a3b8', fontSize: 12 }}>
          <span>创建: {new Date(row.createdAt).toLocaleString()}</span>
          {row.approval ? <span>审批: {row.approval.approverName}</span> : <span>审批: 待处理</span>}
          {row.outbound ? <span>出库: {row.outbound.operatorName}</span> : <span>出库: 待处理</span>}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: '190px',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {row.status === 'pending_approval' ? (
            <Button size="sm" variant="primary" disabled={activeRequestId === row.id} onClick={() => void handleApproveMaterialRequest(row)}>
              审批
            </Button>
          ) : null}
          {row.status === 'approved' ? (
            <Button size="sm" variant="outline" disabled={activeRequestId === row.id} onClick={() => void handleOutboundMaterialRequest(row)}>
              确认出库
            </Button>
          ) : null}
          {row.status === 'outbound' ? (
            <Tag size="sm" variant="success">
              已闭环
            </Tag>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <PageShell title="库存管理">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {snapshot.error ? (
          <Card>
            <span style={{ color: '#fcd34d', fontSize: 13 }}>{snapshot.error}</span>
          </Card>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>📦 库存管理</h2>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>
              物料申领 · 安全库存 · 补货跟踪 · Delivery {snapshot.deliveryMode}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowRestock(true)}>入库记录</Button>
            <Button variant="outline" onClick={() => info('盘点任务已创建')}>盘点</Button>
            <Button variant="outline" onClick={() => refreshSnapshot()} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </Button>
            <Button onClick={() => openRequestModal()}>+ 发起申领</Button>
          </div>
        </div>

        <div style={CARD_GRID_STYLE}>
          <Card padding={16}><Statistic label="物资种类" value={ITEMS.length} size="sm" /></Card>
          <Card padding={16}><Statistic label="需补货" value={lowStock.length} size="sm" variant="danger" /></Card>
          <Card padding={16}><Statistic label="库存总价值" value={totalVal} prefix="¥" size="sm" groupSeparator /></Card>
          <Card padding={16}><Statistic label="总库存量" value={totalStock} size="sm" groupSeparator /></Card>
          <Card padding={16}><Statistic label="待审批申领" value={snapshot.requestStats.pending} size="sm" variant="warning" /></Card>
          <Card padding={16}><Statistic label="待出库申领" value={snapshot.requestStats.approved} size="sm" variant="info" /></Card>
          <Card padding={16}><Statistic label="已出库闭环" value={snapshot.requestStats.outbound} size="sm" variant="success" /></Card>
          <Card padding={16}><Statistic label="库存充足" value={safeCount} size="sm" variant="success" /></Card>
        </div>

        <Card>
          <Tabs items={[{ key: 'list', label: '物资列表' }, { key: 'category', label: '分类概览' }]} activeKey={tabKey} onChange={(key) => setTabKey(key as InventoryTab)} />

          <div style={{ marginTop: 16 }}>
            {tabKey === 'list' ? (
              <>
                <div style={FILTER_GRID_STYLE}>
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索编号/名称/分类/供应商" allowClear block />
                  <Select value={catFilter} onChange={setCatFilter} options={[{ value: 'all', label: '全部分类' }, ...snapshot.categories.map((category) => ({ value: category, label: category }))]} style={{ width: '100%' }} minWidth={160} />
                  <Button variant="outline" onClick={() => info('导出清单任务已提交')}>导出清单</Button>
                </div>
                {filtered.length === 0 ? <Empty description="无匹配物资" /> : <Table<Item> rows={filtered} columns={itemColumns} rowKey={(row) => row.id} />}
              </>
            ) : (
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                {categorySummary.map((category) => (
                  <Card key={category.name} title={category.name} headerActions={<Tag size="sm" variant={category.low > 0 ? 'warning' : 'success'}>{category.low > 0 ? `${category.low}项不足` : '正常'}</Tag>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>种类</span>
                        <span style={{ color: '#e2e8f0' }}>{category.count}项</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>总价值</span>
                        <span style={{ color: '#e2e8f0' }}>¥{category.value.toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card title="物料申领流转" subtitle="已切换到 server snapshot，刷新使用 router.refresh() 重拉 tenant/store 维度快照">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={REQUEST_FILTER_GRID_STYLE}>
              <Input value={tenantId} onChange={(event) => setTenantId(event.target.value)} placeholder="tenantId" block />
              <Select
                value={requestStatusFilter}
                onChange={(value) => setRequestStatusFilter(value as RequestStatusFilter)}
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'pending_approval', label: '待审批' },
                  { value: 'approved', label: '待出库' },
                  { value: 'outbound', label: '已出库' },
                ]}
                style={{ width: '100%' }}
              />
              <Button variant="secondary" onClick={() => refreshSnapshot()} loading={isRefreshing}>
                刷新申领
              </Button>
              <Button onClick={() => openRequestModal()}>新建申领</Button>
            </div>

            <div style={{ display: 'flex', gap: 12, color: '#94a3b8', fontSize: 13 }}>
              <span>tenant: {tenantId || '-'}</span>
              <span>store: {snapshot.storeId}</span>
              <span>API: {REQUEST_API_BASE}</span>
            </div>

            {filteredRequests.length === 0 ? (
              <Empty description="暂无物料申领单" />
            ) : (
              <Table<MaterialRequestRecord> rows={filteredRequests} columns={requestColumns} rowKey={(row) => row.id} />
            )}
          </div>
        </Card>

        <Modal open={Boolean(showDetail)} onClose={() => setShowDetail(null)} title={`物资详情 - ${showDetail?.name ?? ''}`} footer={<Button variant="secondary" onClick={() => setShowDetail(null)}>关闭</Button>}>
          {showDetail ? (
            <div style={DETAIL_GRID_STYLE}>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>名称</div><div style={{ color: '#e2e8f0' }}>{showDetail.name}</div></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>分类</div><Tag size="sm" variant={formatCategoryVariant(showDetail.category)}>{showDetail.category}</Tag></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>库存</div><span style={{ color: showDetail.stock < showDetail.threshold ? '#f87171' : '#e2e8f0' }}>{showDetail.stock}{showDetail.unit}</span></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>预警线</div><span style={{ color: '#e2e8f0' }}>{showDetail.threshold}{showDetail.unit}</span></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>单价</div><span style={{ color: '#e2e8f0' }}>¥{showDetail.cost}</span></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>总价值</div><span style={{ color: '#e2e8f0' }}>¥{showDetail.totalValue.toLocaleString()}</span></div>
            </div>
          ) : null}
        </Modal>

        <Modal open={showRestock} onClose={() => setShowRestock(false)} title="添加入库记录" footer={<Button onClick={() => setShowRestock(false)}>关闭</Button>}>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>当前展示最近 {snapshot.restockLog.length} 条入库记录，后续可继续接入真实入库创建链路。</div>
        </Modal>

        <Modal
          open={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          title="发起物料申领"
          footer={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setShowRequestModal(false)}>取消</Button>
              <Button disabled={requestSubmitting} onClick={() => void handleCreateMaterialRequest()}>
                {requestSubmitting ? '提交中...' : '提交申领'}
              </Button>
            </div>
          }
        >
          <div style={DETAIL_GRID_STYLE}>
            <Input value={tenantId} onChange={(event) => setTenantId(event.target.value)} label="租户" block />
            <Input value={snapshot.storeId} label="门店" disabled block />
            <Select value={requestItemId} onChange={setRequestItemId} options={snapshot.items.map((item) => ({ value: item.id, label: `${item.id} · ${item.name}` }))} style={{ width: '100%' }} minWidth={220} />
            <Input value={requestQuantity} onChange={(event) => setRequestQuantity(event.target.value)} label="数量" type="number" block />
            <Input value={requesterName} onChange={(event) => setRequesterName(event.target.value)} label="申领人" block />
            <Input value={requestDepartment} onChange={(event) => setRequestDepartment(event.target.value)} label="部门" block />
            <Input value={requestPurpose} onChange={(event) => setRequestPurpose(event.target.value)} label="用途" block style={{ gridColumn: '1 / -1' }} />
            {selectedRequestItem ? (
              <Card
                variant="outlined"
                padding={16}
                style={{ gridColumn: '1 / -1' }}
                title="当前申领物资"
                subtitle={`${selectedRequestItem.category} · 当前库存 ${selectedRequestItem.stock}${selectedRequestItem.unit}`}
                headerActions={<Tag size="sm" variant={selectedRequestItem.stock < selectedRequestItem.threshold ? 'warning' : 'success'}>{selectedRequestItem.stock < selectedRequestItem.threshold ? '低库存' : '库存正常'}</Tag>}
              >
                <div style={{ color: '#94a3b8', fontSize: 13 }}>
                  安全库存 {selectedRequestItem.threshold}
                  {selectedRequestItem.unit} · 供应商 {selectedRequestItem.supplier}
                </div>
              </Card>
            ) : null}
          </div>
        </Modal>
      </div>
    </PageShell>
  );
}
