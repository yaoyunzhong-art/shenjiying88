'use client';

/**
 * 库存操作中心 - Stock Operations
 * 角色: 📦仓库管理
 * 功能: 入库单、出库单、调拨单、退货单
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput, DataTable, Pagination, usePagination, useSearchFilter, useSortedItems, type DataTableColumn, type DataTableSortConfig } from '@m5/ui';

type OpType = 'purchase_in' | 'sale_out' | 'transfer_out' | 'transfer_in' | 'return_in' | 'damage_out' | 'adjustment';
type OpStatus = 'draft' | 'pending_approval' | 'approved' | 'completed' | 'cancelled';

interface StockOp { id: string; date: string; type: OpType; refNo: string; items: number; totalQty: number; totalCost: number; status: OpStatus; creator: string; approver: string; note: string; warehouse: string; }

const OT: Record<OpType, string> = { purchase_in:'采购入库', sale_out:'销售出库', transfer_out:'调拨出库', transfer_in:'调拨入库', return_in:'退货入库', damage_out:'损耗出库', adjustment:'盘点调整' };
const OTV: Record<OpType, 'success'|'danger'|'warning'|'neutral'> = { purchase_in:'success', sale_out:'danger', transfer_out:'warning', transfer_in:'success', return_in:'success', damage_out:'danger', adjustment:'warning' };
const OS: Record<OpStatus, {l:string;v:'success'|'warning'|'neutral'|'danger'|'info'}> = { draft:{l:'草稿',v:'neutral'}, pending_approval:{l:'待审批',v:'warning'}, approved:{l:'已审批',v:'info'}, completed:{l:'已完成',v:'success'}, cancelled:{l:'已取消',v:'danger'} };
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const ops: StockOp[] = Array.from({length:45}, (_,i) => {
  const types: OpType[] = ['purchase_in','purchase_in','purchase_in','sale_out','sale_out','transfer_out','transfer_in','return_in','damage_out','adjustment'];
  const statuses: OpStatus[] = ['completed','completed','completed','completed','completed','completed','approved','pending_approval','draft','cancelled'];
  const d = new Date(Date.now()-Math.floor(Math.random()*30)*86400000);
  return {
    id: `STK-OP-${String(i+1).padStart(3,'0')}`,
    date: d.toISOString().split('T')[0],
    type: types[Math.floor(Math.random()*types.length)]!,
    refNo: `REF-${d.toISOString().split('T')[0].replace(/-/g,'')}-${String(1000+i).slice(-4)}`,
    items: 1+Math.floor(Math.random()*8),
    totalQty: 5+Math.floor(Math.random()*95),
    totalCost: Math.round((100+Math.random()*5000)*100)/100,
    status: statuses[Math.floor(Math.random()*statuses.length)]!,
    creator: ['张三','李四','王五'][Math.floor(Math.random()*3)]!,
    approver: Math.random()>0.3?['店长','李娜'][Math.floor(Math.random()*2)]!:'',
    note: '',
    warehouse: ['主仓库','备用仓','前厅'][Math.floor(Math.random()*3)]!,
  };
}).sort((a,b)=>b.date.localeCompare(a.date));

function buildColumns(): DataTableColumn<StockOp>[] {
  return [
    {key:'refNo',title:'单号',dataKey:'refNo',sortable:true,render:i=><span style={{color:'#93c5fd',fontSize:12}}>{i.refNo}</span>},
    {key:'date',title:'日期',dataKey:'date',sortable:true},
    {key:'type',title:'类型',sortable:true,sortValue:i=>i.type,render:i=><StatusBadge label={OT[i.type]} variant={OTV[i.type]} size="sm" />},
    {key:'items',title:'品项数',dataKey:'items',sortable:true,align:'right'},
    {key:'totalQty',title:'总数量',dataKey:'totalQty',sortable:true,align:'right'},
    {key:'totalCost',title:'总金额',dataKey:'totalCost',sortable:true,align:'right',render:i=><span style={{color:'#22c55e',fontWeight:600}}>{fm(i.totalCost)}</span>},
    {key:'status',title:'状态',sortable:true,sortValue:i=>i.status,render:i=><StatusBadge label={OS[i.status].l} variant={OS[i.status].v} size="sm" dot />},
    {key:'creator',title:'创建人',dataKey:'creator',sortable:true},
    {key:'warehouse',title:'仓库',dataKey:'warehouse',sortable:true},
  ];
}

export default function StockOperationsPage() {
  const allOps = useMemo(()=>ops,[]);
  const searchFields=useMemo<(keyof StockOp)[]>(()=>['refNo','creator','warehouse','note','type'],[]);
  const {searchTerm,setSearchTerm,filteredItems}=useSearchFilter(allOps,searchFields);
  const [statusFilter,setStatusFilter]=useState<string>('ALL');
  const statusFiltered=useMemo(()=>statusFilter==='ALL'?filteredItems:filteredItems.filter(o=>o.status===statusFilter),[filteredItems,statusFilter]);
  const [sortConfig,setSortConfig]=useState<DataTableSortConfig|null>(null);
  const columns=useMemo(()=>buildColumns(),[]);
  const sorted=useSortedItems(statusFiltered,columns,sortConfig);
  const pagination=usePagination({initialPageSize:10});
  const pageItems=pagination.paginate(sorted);

  const stats=useMemo(()=>({
    total:allOps.length, pending:allOps.filter(o=>o.status==='pending_approval'||o.status==='draft').length,
    completed:allOps.filter(o=>o.status==='completed').length, totalCost:allOps.reduce((s,o)=>s+o.totalCost,0),
    inCount:allOps.filter(o=>o.type.includes('in')).length, outCount:allOps.filter(o=>o.type.includes('out')).length,
  }),[allOps]);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="📦 库存操作中心" subtitle="入库·出库·调拨·退货">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>操作单总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>已完成: {stats.completed}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>待处理</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{stats.pending}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>草稿+待审批</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>入库/出库</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}><span style={{color:'#22c55e'}}>{stats.inCount}</span> / <span style={{color:'#ef4444'}}>{stats.outCount}</span></div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>库存变动金额</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{fm(stats.totalCost)}</div></div>
        </div>

        <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索单号/创建人/仓库..." />
        <div style={{marginTop:12}}><Tabs items={[
          {key:'ALL',label:'全部',count:filteredItems.length},
          ...(['completed','pending_approval','approved','draft','cancelled'] as OpStatus[]).map(s=>({key:s,label:OS[s].l,count:filteredItems.filter(o=>o.status===s).length})),
        ]} activeKey={statusFilter} onChange={setStatusFilter} variant="pills" size="sm" /></div>

        <DataTable title={`操作单 (${sorted.length})`} columns={columns} items={pageItems} rowKey={i=>i.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
        <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
