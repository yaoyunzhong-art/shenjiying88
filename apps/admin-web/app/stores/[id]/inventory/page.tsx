// 📦 库存管理 · 物资/消耗品/安全库存管理
'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams } from 'next/navigation';
import { buildActorHeaders } from '@m5/sdk';
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

interface Item extends Record<string, unknown> {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  maxStock: number;
  threshold: number;
  status: 'normal' | 'low';
  cost: number;
  totalValue: number;
  supplier: string;
  lastRestock: string;
}

type InventoryTab = 'list' | 'category';
type MaterialRequestStatus = 'pending_approval' | 'approved' | 'outbound';
type RequestStatusFilter = 'all' | MaterialRequestStatus;

interface MaterialRequestItem {
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  quantity: number;
}

interface MaterialRequestRecord extends Record<string, unknown> {
  id: string;
  tenantId: string;
  storeId?: string;
  requesterId: string;
  requesterName: string;
  department?: string;
  purpose: string;
  status: MaterialRequestStatus;
  items: MaterialRequestItem[];
  totalQuantity: number;
  approval?: {
    approverId: string;
    approverName: string;
    note: string;
    approvedAt: string;
  };
  outbound?: {
    operatorId: string;
    operatorName: string;
    warehouseCode?: string;
    note?: string;
    outboundAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

const REQUEST_API_BASE = '/api/logistics/material-requests';

const RAW_ITEMS = [
  { id: 'STK-001', name: '游戏币', category: '消耗品', unit: '枚', stock: 5000, minStock: 1000, maxStock: 20000, cost: 0.5, totalValue: 2500, supplier: '世嘉', lastRestock: '2026-07-12' },
  { id: 'STK-002', name: '加油棒', category: '礼品', unit: '个', stock: 320, minStock: 100, maxStock: 1000, cost: 2.5, totalValue: 800, supplier: '义乌礼品', lastRestock: '2026-07-11' },
  { id: 'STK-003', name: '纯净水', category: '饮品', unit: '瓶', stock: 85, minStock: 200, maxStock: 2000, cost: 1.2, totalValue: 102, supplier: '农夫山泉', lastRestock: '2026-07-10' },
  { id: 'STK-004', name: '抹茶粉', category: '饮品原料', unit: 'kg', stock: 2.5, minStock: 5, maxStock: 50, cost: 120, totalValue: 300, supplier: '宇治抹茶', lastRestock: '2026-07-08' },
  { id: 'STK-005', name: 'VR清洁套装', category: '耗材', unit: '套', stock: 15, minStock: 5, maxStock: 50, cost: 35, totalValue: 525, supplier: '清洁之家', lastRestock: '2026-07-05' },
  { id: 'STK-006', name: '打印纸(热敏)', category: '办公', unit: '卷', stock: 48, minStock: 20, maxStock: 200, cost: 8, totalValue: 384, supplier: '得力文具', lastRestock: '2026-07-12' },
  { id: 'STK-007', name: '游戏卡带(NS)', category: '游戏', unit: '张', stock: 23, minStock: 10, maxStock: 100, cost: 280, totalValue: 6440, supplier: '任天堂', lastRestock: '2026-06-20' },
  { id: 'STK-008', name: '抹布', category: '耗材', unit: '条', stock: 60, minStock: 20, maxStock: 200, cost: 3, totalValue: 180, supplier: '清洁之家', lastRestock: '2026-07-10' },
  { id: 'STK-009', name: '一次性手套', category: '耗材', unit: '盒', stock: 12, minStock: 10, maxStock: 100, cost: 15, totalValue: 180, supplier: '清洁之家', lastRestock: '2026-07-01' },
  { id: 'STK-010', name: '礼品包装袋', category: '礼品', unit: '个', stock: 200, minStock: 50, maxStock: 500, cost: 1.5, totalValue: 300, supplier: '义乌礼品', lastRestock: '2026-07-09' },
  { id: 'STK-011', name: '饮品杯(大)', category: '饮品', unit: '个', stock: 500, minStock: 100, maxStock: 2000, cost: 0.8, totalValue: 400, supplier: '餐具批发', lastRestock: '2026-07-08' },
  { id: 'STK-012', name: '免洗洗手液', category: '耗材', unit: '瓶', stock: 8, minStock: 10, maxStock: 50, cost: 18, totalValue: 144, supplier: '清洁之家', lastRestock: '2026-06-25' },
];

const ITEMS: Item[] = RAW_ITEMS.map((item) => ({
  ...item,
  threshold: item.minStock,
  status: item.stock < item.minStock ? 'low' : 'normal',
}));

const CATEGORIES = [...new Set(ITEMS.map((item) => item.category))];

const RESTOCK_LOG = [
  { id: 'R-01', item: '游戏币', qty: 5000, date: '2026-07-12', supplier: '世嘉', cost: 2500 },
  { id: 'R-02', item: '打印纸(热敏)', qty: 50, date: '2026-07-12', supplier: '得力文具', cost: 400 },
  { id: 'R-03', item: '加油棒', qty: 200, date: '2026-07-11', supplier: '义乌礼品', cost: 500 },
  { id: 'R-04', item: '纯净水', qty: 500, date: '2026-07-10', supplier: '农夫山泉', cost: 600 },
  { id: 'R-05', item: '礼品包装袋', qty: 100, date: '2026-07-09', supplier: '义乌礼品', cost: 150 },
];

const STATUS_VARIANT: Record<Item['status'], 'success' | 'warning'> = {
  normal: 'success',
  low: 'warning',
};

const REQUEST_STATUS_LABEL: Record<MaterialRequestStatus, string> = {
  pending_approval: '待审批',
  approved: '待出库',
  outbound: '已出库',
};

const INVENTORY_PAGE_ACTOR = {
  actorId: 'admin-store-inventory',
  actorType: 'employee-user',
  actorName: 'Admin Store Inventory',
  roles: ['TENANT_ADMIN', 'OPERATIONS'],
  permissions: ['logistics.inventory.read', 'logistics.inventory.write'],
  authenticated: true,
} as const;

const REQUEST_STATUS_VARIANT: Record<MaterialRequestStatus, 'warning' | 'info' | 'success'> = {
  pending_approval: 'warning',
  approved: 'info',
  outbound: 'success',
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

async function readResponseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) {
      return payload.message.join(', ');
    }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  }

  const text = await response.text();
  return text.trim() || `请求失败(${response.status})`;
}

function formatCategoryVariant(category: string): 'default' | 'info' | 'purple' | 'warning' {
  if (category === '耗材') return 'warning';
  if (category === '礼品') return 'purple';
  if (category.includes('饮品')) return 'info';
  return 'default';
}

export default function InventoryPage() {
  const params = useParams<{ id: string }>();
  const storeId = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? 'store-001');
  const [tenantId, setTenantId] = useState('tenant-p30');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Item | null>(null);
  const [showRestock, setShowRestock] = useState(false);
  const [tabKey, setTabKey] = useState<InventoryTab>('list');
  const [requests, setRequests] = useState<MaterialRequestRecord[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState<RequestStatusFilter>('all');
  const [requestItemId, setRequestItemId] = useState(ITEMS[0]?.id ?? '');
  const [requestQuantity, setRequestQuantity] = useState('1');
  const [requesterName, setRequesterName] = useState('门店后勤');
  const [requestDepartment, setRequestDepartment] = useState('后勤组');
  const [requestPurpose, setRequestPurpose] = useState('晚班耗材补充');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const { toasts, success, error, info, dismiss } = useToast();

  const buildInventoryHeaders = useCallback(
    (contentType?: string) => ({
      ...buildActorHeaders({
        ...INVENTORY_PAGE_ACTOR,
        tenantId: tenantId.trim(),
        storeId,
      }),
      ...(contentType ? { 'Content-Type': contentType } : {}),
    }),
    [storeId, tenantId],
  );

  const lowStock = ITEMS.filter((item) => item.stock < item.threshold);
  const totalVal = ITEMS.reduce((sum, item) => sum + item.totalValue, 0);
  const totalStock = ITEMS.reduce((sum, item) => sum + item.stock, 0);
  const safeCount = ITEMS.filter((item) => item.stock >= item.threshold).length;
  const selectedRequestItem = ITEMS.find((item) => item.id === requestItemId) ?? ITEMS[0];

  const filtered = useMemo(() => {
    return ITEMS.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.includes(search) ||
        item.category.includes(search) ||
        item.supplier.includes(search) ||
        item.id.includes(search);
      const matchesCategory = catFilter === 'all' || item.category === catFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, catFilter]);

  const categorySummary = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        name: category,
        count: ITEMS.filter((item) => item.category === category).length,
        value: ITEMS.filter((item) => item.category === category).reduce((sum, item) => sum + item.totalValue, 0),
        low: ITEMS.filter((item) => item.category === category && item.stock < item.threshold).length,
      })),
    [],
  );

  const filteredRequests = useMemo(() => {
    if (requestStatusFilter === 'all') return requests;
    return requests.filter((request) => request.status === requestStatusFilter);
  }, [requests, requestStatusFilter]);

  const requestStats = useMemo(() => {
    return {
      pending: requests.filter((request) => request.status === 'pending_approval').length,
      approved: requests.filter((request) => request.status === 'approved').length,
      outbound: requests.filter((request) => request.status === 'outbound').length,
    };
  }, [requests]);

  const openRequestModal = useCallback((item?: Item) => {
    if (item) {
      setRequestItemId(item.id);
      setRequestQuantity('1');
      setRequestPurpose(`${item.name} 现场补充申领`);
    }
    setShowRequestModal(true);
  }, []);

  const resetRequestForm = useCallback(() => {
    setRequestItemId(ITEMS[0]?.id ?? '');
    setRequestQuantity('1');
    setRequesterName('门店后勤');
    setRequestDepartment('后勤组');
    setRequestPurpose('晚班耗材补充');
  }, []);

  const loadMaterialRequests = useCallback(async () => {
    const normalizedTenantId = tenantId.trim();
    if (!normalizedTenantId) {
      setRequests([]);
      return;
    }

    setRequestsLoading(true);
    try {
      const response = await fetch(REQUEST_API_BASE, {
        method: 'GET',
        headers: buildInventoryHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(await readResponseMessage(response));
      }

      const payload = (await response.json()) as MaterialRequestRecord[];
      setRequests(Array.isArray(payload) ? payload : []);
    } catch (requestError) {
      error(`加载物料申领失败：${requestError instanceof Error ? requestError.message : '未知错误'}`);
    } finally {
      setRequestsLoading(false);
    }
  }, [tenantId, error]);

  useEffect(() => {
    void loadMaterialRequests();
  }, [loadMaterialRequests]);

  const handleCreateMaterialRequest = useCallback(async () => {
    const normalizedTenantId = tenantId.trim();
    const normalizedRequesterName = requesterName.trim();
    const normalizedPurpose = requestPurpose.trim();
    const quantity = Number(requestQuantity);

    if (!normalizedTenantId) {
      error('请先填写 tenantId');
      return;
    }
    if (!selectedRequestItem) {
      error('请选择申领物资');
      return;
    }
    if (!normalizedRequesterName) {
      error('请填写申领人');
      return;
    }
    if (!normalizedPurpose) {
      error('请填写申领用途');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      error('申领数量必须大于 0');
      return;
    }

    setRequestSubmitting(true);
    try {
      const response = await fetch(REQUEST_API_BASE, {
        method: 'POST',
        headers: buildInventoryHeaders('application/json'),
        body: JSON.stringify({
          storeId,
          requesterId: `req-${storeId}`,
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

      if (!response.ok) {
        throw new Error(await readResponseMessage(response));
      }

      success(`${selectedRequestItem.name} 申领单已创建`);
      setShowRequestModal(false);
      resetRequestForm();
      await loadMaterialRequests();
    } catch (requestError) {
      error(`创建申领失败：${requestError instanceof Error ? requestError.message : '未知错误'}`);
    } finally {
      setRequestSubmitting(false);
    }
  }, [
    tenantId,
    requesterName,
    requestPurpose,
    requestQuantity,
    selectedRequestItem,
    requestDepartment,
    storeId,
    error,
    success,
    resetRequestForm,
    loadMaterialRequests,
  ]);

  const handleApproveMaterialRequest = useCallback(async (request: MaterialRequestRecord) => {
    setActiveRequestId(request.id);
    try {
      const response = await fetch(`${REQUEST_API_BASE}/${request.id}/approve`, {
        method: 'POST',
        headers: buildInventoryHeaders('application/json'),
        body: JSON.stringify({
          approverId: 'logistics-manager-01',
          approverName: '后勤主管',
          note: `门店 ${storeId} 申领审批通过`,
        }),
      });

      if (!response.ok) {
        throw new Error(await readResponseMessage(response));
      }

      success(`${request.id} 已审批通过`);
      await loadMaterialRequests();
    } catch (requestError) {
      error(`审批失败：${requestError instanceof Error ? requestError.message : '未知错误'}`);
    } finally {
      setActiveRequestId(null);
    }
  }, [tenantId, storeId, success, error, loadMaterialRequests]);

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

      if (!response.ok) {
        throw new Error(await readResponseMessage(response));
      }

      success(`${request.id} 已完成出库`);
      await loadMaterialRequests();
    } catch (requestError) {
      error(`出库失败：${requestError instanceof Error ? requestError.message : '未知错误'}`);
    } finally {
      setActiveRequestId(null);
    }
  }, [tenantId, success, error, loadMaterialRequests]);

  const COLUMNS: TableColumn<Item>[] = [
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
          <Button size="sm" variant="secondary" onClick={() => setShowDetail(row)}>
            详情
          </Button>
          <Button size="sm" variant="outline" onClick={() => openRequestModal(row)}>
            出库
          </Button>
          <Button
            size="sm"
            variant={row.stock < row.threshold ? 'danger' : 'primary'}
            onClick={() => info(`${row.name} 已加入补货跟踪`)}
          >
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
          <div style={{ color: '#94a3b8', fontSize: 12 }}>{row.storeId ?? storeId}</div>
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
            <Button
              size="sm"
              variant="primary"
              disabled={activeRequestId === row.id}
              onClick={() => void handleApproveMaterialRequest(row)}
            >
              审批
            </Button>
          ) : null}
          {row.status === 'approved' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={activeRequestId === row.id}
              onClick={() => void handleOutboundMaterialRequest(row)}
            >
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

  const tabItems: Array<{ key: InventoryTab; label: string }> = [
    { key: 'list', label: '物资列表' },
    { key: 'category', label: '分类概览' },
  ];

  return (
    <PageShell title="库存管理">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>📦 库存管理</h2>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>物料申领 · 安全库存 · 补货跟踪 · P-30 后勤出库联调</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowRestock(true)}>
              入库记录
            </Button>
            <Button variant="outline" onClick={() => info('盘点任务已创建')}>
              盘点
            </Button>
            <Button onClick={() => openRequestModal()}>+ 发起申领</Button>
          </div>
        </div>

        <div style={CARD_GRID_STYLE}>
          <Card padding={16}>
            <Statistic label="物资种类" value={ITEMS.length} size="sm" />
          </Card>
          <Card padding={16}>
            <Statistic label="需补货" value={lowStock.length} size="sm" variant="danger" />
          </Card>
          <Card padding={16}>
            <Statistic label="库存总价值" value={totalVal} prefix="¥" size="sm" groupSeparator />
          </Card>
          <Card padding={16}>
            <Statistic label="总库存量" value={totalStock} size="sm" groupSeparator />
          </Card>
          <Card padding={16}>
            <Statistic label="待审批申领" value={requestStats.pending} size="sm" variant="warning" />
          </Card>
          <Card padding={16}>
            <Statistic label="待出库申领" value={requestStats.approved} size="sm" variant="info" />
          </Card>
          <Card padding={16}>
            <Statistic label="已出库闭环" value={requestStats.outbound} size="sm" variant="success" />
          </Card>
          <Card padding={16}>
            <Statistic label="库存充足" value={safeCount} size="sm" variant="success" />
          </Card>
          <Card padding={16}>
            <Statistic label="本月补货" value={RESTOCK_LOG.length} suffix="次" size="sm" variant="info" />
          </Card>
          <Card padding={16}>
            <Statistic label="库存品类" value={CATEGORIES.length} size="sm" />
          </Card>
        </div>

        <Card>
          <Tabs items={tabItems} activeKey={tabKey} onChange={setTabKey} />

          <div style={{ marginTop: 16 }}>
            {tabKey === 'list' ? (
              <>
                <div style={FILTER_GRID_STYLE}>
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="搜索编号/名称/分类/供应商"
                    allowClear
                    block
                  />

                  <Select
                    value={catFilter}
                    onChange={setCatFilter}
                    options={[
                      { value: 'all', label: '全部分类' },
                      ...CATEGORIES.map((category) => ({ value: category, label: category })),
                    ]}
                    style={{ width: '100%' }}
                    minWidth={160}
                  />

                  <Button variant="outline" onClick={() => info('导出清单任务已提交')}>
                    导出清单
                  </Button>
                </div>

                {filtered.length === 0 ? (
                  <Empty description="无匹配物资" />
                ) : (
                  <Table<Item> rows={filtered} columns={COLUMNS} rowKey={(row) => row.id} />
                )}
              </>
            ) : (
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                {categorySummary.map((category) => (
                  <Card
                    key={category.name}
                    title={category.name}
                    headerActions={
                      <Tag size="sm" variant={category.low > 0 ? 'warning' : 'success'}>
                        {category.low > 0 ? `${category.low}项不足` : '正常'}
                      </Tag>
                    }
                  >
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

        <Card
          title="物料申领流转"
          subtitle="已接入 /api/logistics/material-requests，按 tenant/store 维度执行申领、审批、出库"
          headerActions={
            <Tag size="sm" variant={requestStats.pending > 0 ? 'warning' : 'success'}>
              {requestStats.pending > 0 ? `${requestStats.pending} 单待审批` : '流转平稳'}
            </Tag>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={REQUEST_FILTER_GRID_STYLE}>
              <Input
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                placeholder="tenantId"
                block
              />
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
              <Button variant="secondary" onClick={() => void loadMaterialRequests()}>
                刷新申领
              </Button>
              <Button onClick={() => openRequestModal()}>新建申领</Button>
            </div>

            <div style={{ display: 'flex', gap: 12, color: '#94a3b8', fontSize: 13 }}>
              <span>tenant: {tenantId || '-'}</span>
              <span>store: {storeId}</span>
              <span>API: {REQUEST_API_BASE}</span>
            </div>

            {requestsLoading ? (
              <div style={{ color: '#94a3b8', padding: '12px 0' }}>加载申领流转中...</div>
            ) : filteredRequests.length === 0 ? (
              <Empty description="暂无物料申领单" />
            ) : (
              <Table<MaterialRequestRecord> rows={filteredRequests} columns={requestColumns} rowKey={(row) => row.id} />
            )}
          </div>
        </Card>

        <Modal
          open={Boolean(showDetail)}
          onClose={() => setShowDetail(null)}
          title={`物资详情 - ${showDetail?.name ?? ''}`}
          footer={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setShowDetail(null)}>
                关闭
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (showDetail) {
                    openRequestModal(showDetail);
                    setShowDetail(null);
                  }
                }}
              >
                发起申领
              </Button>
            </div>
          }
        >
          {showDetail ? (
            <div style={DETAIL_GRID_STYLE}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>名称</div>
                <div style={{ color: '#e2e8f0' }}>{showDetail.name}</div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>分类</div>
                <Tag size="sm" variant={formatCategoryVariant(showDetail.category)}>
                  {showDetail.category}
                </Tag>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>库存</div>
                <span
                  style={{
                    color: showDetail.stock < showDetail.threshold ? '#f87171' : '#e2e8f0',
                    fontWeight: showDetail.stock < showDetail.threshold ? 700 : 400,
                  }}
                >
                  {showDetail.stock}
                  {showDetail.unit}
                </span>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>预警线</div>
                <span style={{ color: '#e2e8f0' }}>
                  {showDetail.threshold}
                  {showDetail.unit}
                </span>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>单价</div>
                <span style={{ color: '#e2e8f0' }}>¥{showDetail.cost}</span>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>总价值</div>
                <span style={{ color: '#e2e8f0' }}>¥{showDetail.totalValue.toLocaleString()}</span>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>供应商</div>
                <span style={{ color: '#e2e8f0' }}>{showDetail.supplier}</span>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>上次补货</div>
                <span style={{ color: '#e2e8f0' }}>{showDetail.lastRestock}</span>
              </div>
            </div>
          ) : null}
        </Modal>

        <Modal
          open={showRestock}
          onClose={() => setShowRestock(false)}
          title="添加入库记录"
          footer={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setShowRestock(false)}>
                取消
              </Button>
              <Button
                onClick={() => {
                  success('入库记录已添加');
                  setShowRestock(false);
                }}
              >
                确认入库
              </Button>
            </div>
          }
        >
          <div style={DETAIL_GRID_STYLE}>
            <Input placeholder="物资名称" block />
            <Input placeholder="入库数量" type="number" block />
            <Input placeholder="入库单价" type="number" block />
            <Input placeholder="供应商" block />
            <Input placeholder="批次号" block style={{ gridColumn: '1 / -1' }} />
            <textarea
              rows={3}
              placeholder="备注"
              style={{
                gridColumn: '1 / -1',
                width: '100%',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                padding: 12,
                resize: 'vertical',
                minHeight: 96,
              }}
            />
          </div>
        </Modal>

        <Modal
          open={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          title="发起物料申领"
          footer={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setShowRequestModal(false)}>
                取消
              </Button>
              <Button disabled={requestSubmitting} onClick={() => void handleCreateMaterialRequest()}>
                {requestSubmitting ? '提交中...' : '提交申领'}
              </Button>
            </div>
          }
        >
          <div style={DETAIL_GRID_STYLE}>
            <Input value={tenantId} onChange={(event) => setTenantId(event.target.value)} label="租户" block />
            <Input value={storeId} label="门店" disabled block />
            <Select
              value={requestItemId}
              onChange={setRequestItemId}
              options={ITEMS.map((item) => ({
                value: item.id,
                label: `${item.id} · ${item.name}`,
              }))}
              style={{ width: '100%' }}
              minWidth={220}
            />
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
                headerActions={
                  <Tag size="sm" variant={selectedRequestItem.stock < selectedRequestItem.threshold ? 'warning' : 'success'}>
                    {selectedRequestItem.stock < selectedRequestItem.threshold ? '低库存' : '库存正常'}
                  </Tag>
                }
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
