'use client';

/**
 * 门店订单管理 - Store Orders Page
 * 角色: 🛒前台收银 / 👔店长
 * 功能: 订单列表、订单详情、退款处理、订单分析
 */

import { useState, useMemo, useCallback, use } from 'react';
import {
  PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput,
  DataTable, Pagination, usePagination, useSearchFilter, useSortedItems,
  type DataTableColumn, type DataTableSortConfig
} from '@m5/ui';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

type OrderStatus = 'completed' | 'pending' | 'cancelled' | 'refunded' | 'partial_refund';
type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card' | 'member_card' | 'unionpay';

interface Order { id: string; orderNo: string; date?: string; time: string; status: OrderStatus; items: string[]; totalAmount: number; discount: number; finalAmount: number; paymentMethod: PaymentMethod; memberName: string; memberNo: string; operator: string; device: string; note: string; }
interface Refund { id: string; orderNo: string; date?: string; amount: number; reason: string; status: 'completed' | 'pending' | 'rejected'; operator: string; approvedBy: string; }

const STATUS_MAP: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
  completed: { label: '已完成', variant: 'success' }, pending: { label: '待支付', variant: 'warning' },
  cancelled: { label: '已取消', variant: 'neutral' }, refunded: { label: '已退款', variant: 'danger' },
  partial_refund: { label: '部分退款', variant: 'info' },
};
const PAYMENT_LABELS: Record<PaymentMethod, string> = { cash: '现金', wechat: '微信支付', alipay: '支付宝', card: '银行卡', member_card: '会员卡', unionpay: '银联' };
function fm(a: number): string { return `¥${a.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`; }

const ITEMS_POOL = ['游戏币*50','游戏币*100','娃娃机3次','拳皇30min','赛车30min','VR体验15min','篮球机3次','会员卡充值200','可乐*1','薯片*1','矿泉水*2','盲盒*1'];

function generateOrders(n: number): Order[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - Math.floor(Math.random()*30)*86400000 - Math.floor(Math.random()*86400000));
    const itemCount = 1+Math.floor(Math.random()*5);
    const items = Array.from({ length: itemCount }, () => ITEMS_POOL[Math.floor(Math.random()*ITEMS_POOL.length)]!);
    const total = Math.round((30+Math.random()*500)*100)/100;
    const disc = Math.random()>0.7 ? Math.round(total*(0.05+Math.random()*0.15)*100)/100 : 0;
    return {
      id: `ORD-${String(i+1).padStart(5,'0')}`,
      orderNo: `M5${d.toISOString().split('T')[0].replace(/-/g,'')}${String(1000+i).slice(-4)}`,
      date: d.toISOString().split('T')[0], time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
      status: (['completed','completed','completed','completed','pending','cancelled','refunded','partial_refund'] as OrderStatus[])[Math.floor(Math.random()*8)]!!,
      items, totalAmount: total, discount: disc, finalAmount: Math.round((total-disc)*100)/100,
      paymentMethod: (['cash','wechat','alipay','card','member_card','unionpay'] as PaymentMethod[])[Math.floor(Math.random()*6)]!!,
      memberName: Math.random()>0.3 ? ['张明','李华','王芳','赵强','陈静','刘洋'][Math.floor(Math.random()*6)]! : '散客',
      memberNo: Math.random()>0.3 ? `M5-${String(1000+Math.floor(Math.random()*9000))}` : '',
      operator: ['张三','李四','王五','赵六'][Math.floor(Math.random()*4)]!, device: ITEMS_POOL[Math.floor(Math.random()*ITEMS_POOL.length)]!!.split('*')[0]!,
      note: Math.random()>0.9 ? '客户要求换货' : '',
    };
  }).sort((a, b) => b.date < a.date ? -1 : b.date > a.date ? 1 : 0);
}

function generateRefunds(orders: Order[]): Refund[] {
  const refunded = orders.filter(o => o.status === 'refunded' || o.status === 'partial_refund');
  return refunded.map((o, i) => ({
    id: `RF-${String(i+1).padStart(3,'0')}`, orderNo: o.orderNo,
    date: o.date, amount: Math.round(o.finalAmount*(0.3+Math.random()*0.7)*100)/100,
    reason: ['商品质量问题','客户不想要','重复支付','设备故障','误操作'][Math.floor(Math.random()*5)]!,
    status: (['completed','completed','completed','pending','rejected'] as Refund['status'][])[Math.floor(Math.random()*5)]!!,
    operator: o.operator, approvedBy: ['店长','运营经理'][Math.floor(Math.random()*2)]!,
  }));
}

const ORDERS = generateOrders(150);
const REFUNDS = generateRefunds(ORDERS);

function buildColumns(): DataTableColumn<Order>[] {
  return [
    { key: 'orderNo', title: '订单号', dataKey: 'orderNo', sortable: true, render: i => <span style={{ color:'#93c5fd', fontSize:12 }}>{i.orderNo}</span> },
    { key: 'date', title: '日期', dataKey: 'date', sortable: true },
    { key: 'time', title: '时间', dataKey: 'time', sortable: true },
    { key: 'items', title: '商品', sortable: false, render: i => <span style={{ color:'#cbd5e1', fontSize:12 }}>{i.items.slice(0,2).join(' + ')}{i.items.length>2?` +${i.items.length-2}`:''}</span> },
    { key: 'finalAmount', title: '实收', dataKey: 'finalAmount', sortable: true, align: 'right', render: i => <span style={{ fontWeight:600, color:'#22c55e' }}>{fm(i.finalAmount)}</span> },
    { key: 'paymentMethod', title: '支付', dataKey: 'paymentMethod', sortable: true, render: i => PAYMENT_LABELS[i.paymentMethod] },
    { key: 'memberName', title: '会员', dataKey: 'memberName', sortable: true },
    { key: 'operator', title: '收银员', dataKey: 'operator', sortable: true },
    { key: 'status', title: '状态', sortable: true, sortValue: i => i.status, render: i => <StatusBadge label={STATUS_MAP[i.status].label} variant={STATUS_MAP[i.status].variant} size="sm" /> },
  ];
}

export default function StoreOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orders = useMemo(() => ORDERS, []);
  const refunds = useMemo(() => REFUNDS, []);
  const [tab, setTab] = useState<'orders'|'refunds'>('orders');

  const stats = useMemo(() => ({
    total: orders.length, totalAmount: orders.reduce((s,o)=>s+o.finalAmount,0),
    completed: orders.filter(o=>o.status==='completed').length,
    refundCount: refunds.length, refundTotal: refunds.reduce((s,r)=>s+r.amount,0),
    avgOrder: orders.reduce((s,o)=>s+o.finalAmount,0)/orders.length,
    cashTotal: orders.filter(o=>o.paymentMethod==='cash').reduce((s,o)=>s+o.finalAmount,0),
    onlineTotal: orders.filter(o=>o.paymentMethod==='wechat'||o.paymentMethod==='alipay'||o.paymentMethod==='unionpay').reduce((s,o)=>s+o.finalAmount,0),
  }), [orders, refunds]);

  const searchFields = useMemo<(keyof Order)[]>(() => ['orderNo','memberName','operator','paymentMethod','items'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(orders, searchFields);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const statusFiltered = useMemo(() => statusFilter==='ALL' ? filteredItems : filteredItems.filter(o => o.status === statusFilter), [filteredItems, statusFilter]);
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const columns = useMemo(() => buildColumns(), []);
  const sorted = useSortedItems(statusFiltered, columns, sortConfig);
  const pagination = usePagination({ initialPageSize: 15 });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, statusFilter, pagination]);
  const pageItems = pagination.paginate(sorted);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell title="订单管理" subtitle={`${id} · ${stats.total}条订单 · 累计${fm(stats.totalAmount)}`}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>订单总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>完成: {stats.completed}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总金额</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{fm(stats.totalAmount)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>均{fm(stats.avgOrder)}/单</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>退款</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{stats.refundCount}笔</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>{fm(stats.refundTotal)}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>现金/线上</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}><span style={{color:'#eab308'}}>{fm(stats.cashTotal)}</span> / <span style={{color:'#3b82f6'}}>{fm(stats.onlineTotal)}</span></div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>现金{((stats.cashTotal/stats.totalAmount)*100).toFixed(0)}%</div></div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Tabs items={[{key:'orders',label:`📋 订单 (${stats.total})`},{key:'refunds',label:`↩️ 退款 (${stats.refundCount})`}]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" />
        </div>

        {tab === 'orders' && (
          <><SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索订单号/会员/收银员..." />
          <div style={{marginTop:12}}><Tabs items={[
            {key:'ALL',label:'全部',count:filteredItems.length},
            ...(['completed','pending','cancelled','refunded','partial_refund'] as OrderStatus[]).map(s=>({key:s,label: STATUS_MAP[s]!.label,count:filteredItems.filter(o=>o.status===s).length})),
          ]} activeKey={statusFilter} onChange={setStatusFilter} variant="pills" size="sm" /></div>
          <DataTable title={`订单 (${sorted.length})`} columns={columns} items={pageItems} rowKey={i=>i.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
          <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} /></>
        )}

        {tab === 'refunds' && (
          <><div style={{display:'grid', gap:14, gridTemplateColumns:'repeat(3,1fr)', marginBottom:16}}>
            <StatCard label="退款笔数" value={refunds.length.toString()} />
            <StatCard label="退款金额" value={fm(stats.refundTotal)} />
            <StatCard label="退款率" value={`${((stats.refundTotal/stats.totalAmount)*100).toFixed(1)}%`} />
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={th}>订单号</th><th style={th}>日期</th><th style={th}>金额</th><th style={th}>原因</th><th style={th}>操作员</th><th style={th}>审批</th><th style={th}>状态</th></tr></thead>
            <tbody>{refunds.map(r => (
              <tr key={r.id}>
                <td style={{...td,color:'#93c5fd',fontSize:12}}>{r.orderNo}</td>
                <td style={td}>{r.date}</td>
                <td style={{...td,fontWeight:600,color:'#ef4444'}}>{fm(r.amount)}</td>
                <td style={td}>{r.reason}</td>
                <td style={td}>{r.operator}</td>
                <td style={td}>{r.approvedBy}</td>
                <td style={td}><StatusBadge label={r.status==='completed'?'已完成':r.status==='pending'?'待审批':'已拒绝'} variant={r.status==='completed'?'success':r.status==='pending'?'warning':'danger'} size="sm" /></td>
              </tr>
            ))}</tbody>
          </table></>
        )}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties = { borderRadius:16, padding:18, background:'rgba(15,23,42,0.38)', border:'1px solid rgba(148,163,184,0.18)' };
const th: React.CSSProperties = { textAlign:'left', padding:'10px 14px', color:'#94a3b8', fontSize:12, borderBottom:'1px solid rgba(148,163,184,0.18)' };
const td: React.CSSProperties = { padding:'10px 14px', color:'#e2e8f0', fontSize:13, borderBottom:'1px solid rgba(148,163,184,0.1)' };
