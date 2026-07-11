'use client';

/**
 * 门店供应商管理 - Store Suppliers Page
 * 角色: 📦采购 / 👔店长
 * 功能: 供应商列表、评级管理、合同管理、采购订单
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput, DataTable, Pagination, usePagination, useSearchFilter, useSortedItems, type DataTableColumn, type DataTableSortConfig } from '@m5/ui';

type SupStatus = 'active'|'inactive'|'blacklisted'|'pending';
type SupCategory = 'game_device'|'merchandise'|'food_beverage'|'cleaning'|'office'|'maintenance'|'marketing';

interface Supplier { id:string; name:string; code:string; category:SupCategory; status:SupStatus; contact:string; phone:string; email:string; address:string; rating:number; totalOrders:number; totalAmount:number; lastOrder:string; paymentTerms:string; deliveryDays:number; minOrder:number; taxId:string; bankInfo:string; notes:string; }

const SC: Record<SupCategory,string> = { game_device:'游戏设备', merchandise:'商品礼品', food_beverage:'餐饮食品', cleaning:'清洁用品', office:'办公用品', maintenance:'维修服务', marketing:'营销物料' };
const SSTATUS: Record<SupStatus,{l:string;v:'success'|'danger'|'neutral'|'warning'}> = { active:{l:'合作中',v:'success'}, inactive:{l:'已停止',v:'danger'}, blacklisted:{l:'黑名单',v:'neutral'}, pending:{l:'待审核',v:'warning'} };
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const suppliers: Supplier[] = [
  { id:'S1', name:'广州礼品总汇', code:'SUP-001', category:'merchandise', status:'active', contact:'张经理', phone:'020-8888-1111', email:'gzgift@example.com', address:'广州市白云区', rating:4.5, totalOrders:48, totalAmount:285000, lastOrder:'2026-07-08', paymentTerms:'月结30天', deliveryDays:3, minOrder:1000, taxId:'91440101...', bankInfo:'广州银行...', notes:'娃娃礼品主要供应商' },
  { id:'S2', name:'上海游乐设备', code:'SUP-002', category:'game_device', status:'active', contact:'李总', phone:'021-6666-2222', email:'shgame@example.com', address:'上海市嘉定区', rating:4.2, totalOrders:12, totalAmount:456000, lastOrder:'2026-06-20', paymentTerms:'预付30%', deliveryDays:15, minOrder:20000, taxId:'91310114...', bankInfo:'上海银行...', notes:'街机/VR设备供应商' },
  { id:'S3', name:'深圳电子配件', code:'SUP-003', category:'maintenance', status:'active', contact:'王总', phone:'0755-8888-3333', email:'szparts@example.com', address:'深圳市南山区', rating:3.8, totalOrders:35, totalAmount:125000, lastOrder:'2026-07-05', paymentTerms:'月结60天', deliveryDays:7, minOrder:500, taxId:'91440300...', bankInfo:'招商银行...', notes:'设备配件/维修零件' },
  { id:'S4', name:'北京保洁用品', code:'SUP-004', category:'cleaning', status:'active', contact:'赵主管', phone:'010-7777-4444', email:'bjclean@example.com', address:'北京市大兴区', rating:4.0, totalOrders:24, totalAmount:96000, lastOrder:'2026-07-01', paymentTerms:'月结30天', deliveryDays:2, minOrder:200, taxId:'91110115...', bankInfo:'工商银行...', notes:'清洁用品月供' },
  { id:'S5', name:'义乌小商品批发', code:'SUP-005', category:'merchandise', status:'active', contact:'陈老板', phone:'0579-8888-5555', email:'yiwu@example.com', address:'浙江义乌国际商贸城', rating:3.5, totalOrders:18, totalAmount:68000, lastOrder:'2026-06-25', paymentTerms:'款到发货', deliveryDays:5, minOrder:500, taxId:'91330782...', bankInfo:'义乌农商行...', notes:'小商品/盲盒' },
  { id:'S6', name:'本地食品批发', code:'SUP-006', category:'food_beverage', status:'active', contact:'刘经理', phone:'010-6666-6666', email:'foodbj@example.com', address:'北京市丰台区', rating:4.3, totalOrders:56, totalAmount:186000, lastOrder:'2026-07-10', paymentTerms:'周结', deliveryDays:1, minOrder:100, taxId:'91110106...', bankInfo:'建设银行...', notes:'零食饮料主要供应商' },
  { id:'S7', name:'官方配件商', code:'SUP-007', category:'maintenance', status:'inactive', contact:'售后部', phone:'400-888-9999', email:'support@official.com', address:'待确认', rating:2.5, totalOrders:5, totalAmount:35000, lastOrder:'2026-03-15', paymentTerms:'预付', deliveryDays:20, minOrder:10000, taxId:'', bankInfo:'', notes:'响应慢,已停用' },
  { id:'S8', name:'活动物料公司', code:'SUP-008', category:'marketing', status:'active', contact:'周小姐', phone:'010-5555-7777', email:'event@example.com', address:'北京市通州区', rating:4.6, totalOrders:15, totalAmount:52000, lastOrder:'2026-07-06', paymentTerms:'项目结算', deliveryDays:7, minOrder:0, taxId:'91110112...', bankInfo:'中国银行...', notes:'海报/展架/印刷' },
];

function ratingStars(r:number):string{return '⭐'.repeat(Math.floor(r))+(r%1>=0.5?'½':'')+'☆'.repeat(5-Math.ceil(r));}

function buildColumns(): DataTableColumn<Supplier>[] {
  return [
    {key:'name',title:'供应商',dataKey:'name',sortable:true,render:i=><span style={{color:'#93c5fd',fontWeight:600}}>{i.name}</span>},
    {key:'code',title:'编码',dataKey:'code',sortable:true},
    {key:'category',title:'分类',sortable:true,sortValue:i=>i.category,render:i=>SC[i.category]},
    {key:'status',title:'状态',sortable:true,sortValue:i=>i.status,render:i=><StatusBadge label={SSTATUS[i.status].l} variant={SSTATUS[i.status].v} size="sm" dot />},
    {key:'rating',title:'评分',dataKey:'rating',sortable:true,render:i=><span style={{fontSize:12}}>{ratingStars(i.rating)}</span>},
    {key:'totalOrders',title:'订单数',dataKey:'totalOrders',sortable:true,align:'right'},
    {key:'totalAmount',title:'总金额',dataKey:'totalAmount',sortable:true,align:'right',render:i=><span style={{color:'#22c55e',fontWeight:600}}>{fm(i.totalAmount)}</span>},
    {key:'deliveryDays',title:'发货天数',dataKey:'deliveryDays',sortable:true,align:'right'},
    {key:'contact',title:'联系人',dataKey:'contact',sortable:true},
  ];
}

export default function StoreSuppliersPage() {
  const stats = useMemo(()=>({
    total:suppliers.length,active:suppliers.filter(s=>s.status==='active').length,
    totalOrders:suppliers.reduce((s,sup)=>s+sup.totalOrders,0),
    totalAmount:suppliers.reduce((s,sup)=>s+sup.totalAmount,0),
    avgRating:suppliers.reduce((s,sup)=>s+sup.rating,0)/suppliers.length,
  }),[]);

  const searchFields=useMemo<(keyof Supplier)[]>(()=>['name','code','contact','phone','category','notes'],[]);
  const {searchTerm,setSearchTerm,filteredItems}=useSearchFilter(suppliers,searchFields);
  const [statusFilter,setStatusFilter]=useState<string>('ALL');
  const statusFiltered=useMemo(()=>statusFilter==='ALL'?filteredItems:filteredItems.filter(s=>s.status===statusFilter),[filteredItems,statusFilter]);
  const [sortConfig,setSortConfig]=useState<DataTableSortConfig|null>(null);
  const columns=useMemo(()=>buildColumns(),[]);
  const sorted=useSortedItems(statusFiltered,columns,sortConfig);
  const pagination=usePagination({initialPageSize:15});
  const pageItems=pagination.paginate(sorted);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="🏭 供应商管理" subtitle={`${stats.active}家合作中 · 累计${fm(stats.totalAmount)}`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>供应商总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>合作中: {stats.active}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总订单</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{stats.totalOrders}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>笔采购订单</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总金额</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{fm(stats.totalAmount)}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>平均评分</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:stats.avgRating>=4?'#22c55e':'#eab308'}}>{stats.avgRating.toFixed(1)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>{ratingStars(stats.avgRating)}</div></div>
        </div>
        <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索供应商名称/编码/联系人/分类..." />
        <div style={{marginTop:12}}><Tabs items={[
          {key:'ALL',label:'全部',count:filteredItems.length},
          ...(['active','inactive','pending','blacklisted'] as SupStatus[]).map(s=>({key:s,label:SSTATUS[s].l,count:filteredItems.filter(sup=>sup.status===s).length})),
        ]} activeKey={statusFilter} onChange={setStatusFilter} variant="pills" size="sm" /></div>
        <DataTable title={`供应商列表 (${sorted.length})`} columns={columns} items={pageItems} rowKey={i=>i.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
        <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
