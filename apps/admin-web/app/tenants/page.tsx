'use client';

/**
 * 租户管理 - Tenant Management
 * 角色: 👑超级管理员 / 🏢总部管理
 * 功能: 租户列表、租户详情、配额管理、激活/停用
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput, DataTable, Pagination, usePagination, useSearchFilter, useSortedItems, type DataTableColumn, type DataTableSortConfig } from '@m5/ui';

type TenantTier = 'free'|'starter'|'business'|'enterprise'|'premium';
type TenantStatus = 'active'|'trial'|'suspended'|'expired';

interface Tenant { id: string; name: string; code: string; tier: TenantTier; status: TenantStatus; contactName: string; contactEmail: string; contactPhone: string; stores: number; users: number; revenue: number; createdDate?: string; expiryDate: string; lastActive: string; region: string; industry: string; }

const TIER_LABELS: Record<TenantTier,string> = { free:'免费版', starter:'入门版', business:'商业版', enterprise:'企业版', premium:'旗舰版' };
const TIER_COLORS: Record<TenantTier,string> = { free:'#6b7280', starter:'#94a3b8', business:'#3b82f6', enterprise:'#8b5cf6', premium:'#eab308' };
const TS: Record<TenantStatus,{l:string;v:'success'|'warning'|'danger'|'info'}> = { active:{l:'正常',v:'success'}, trial:{l:'试用',v:'info'}, suspended:{l:'暂停',v:'danger'}, expired:{l:'过期',v:'warning'} };
const REGIONS = ['华东','华南','华北','华中','西南','西北','港澳台','海外'];
const INDUSTRIES = ['游艺厅','电玩城','综合娱乐','亲子乐园','VR体验','健身娱乐','其他'];
const TIER_TIERS: TenantTier[] = ['free','starter','business','enterprise','premium'];

function formatMoney(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const tenants: Tenant[] = Array.from({length:32}, (_,i) => {
  const tier = TIER_TIERS[Math.floor(Math.random()*TIER_TIERS.length)]!;
  const statuses: TenantStatus[] = ['active','active','active','active','trial','suspended','expired'];
  return {
    id:`TNT-${String(i+1).padStart(3,'0')}`,
    name: ['欢乐谷电玩城','星际联盟','潮玩部落','乐动空间','极速竞界','梦幻乐园','时空隧道','数字浪潮','星河漫游','未来玩家','嗨玩天地','酷炫基地','童趣乐园','电玩新天地','竞界风云','超级玩家'][i%16]! + (i>=16?'(分店)':'旗舰店'),
    code: `TENANT-${String(1000+i+1)}`,
    tier, status: statuses[Math.floor(Math.random()*statuses.length)]!,
    contactName: ['张三','李四','王五','赵六','陈七','刘八'][Math.floor(Math.random()*6)]!,
    contactEmail: `contact${i+1}@example.com`,
    contactPhone: `1${3+Math.floor(Math.random()*7)}8${String(Math.floor(Math.random()*10000000)).padStart(7,'0')}`,
    stores: 1+Math.floor(Math.random()*8), users: 3+Math.floor(Math.random()*30),
    revenue: Math.round((10000+Math.random()*200000)*100)/100,
    createdDate: new Date(2024,Math.floor(Math.random()*18),1+Math.floor(Math.random()*28)).toISOString().split('T')[0],
    expiryDate: new Date(2026,Math.floor(Math.random()*8),1+Math.floor(Math.random()*28)).toISOString().split('T')[0],
    lastActive: new Date(Date.now()-Math.floor(Math.random()*7)*86400000).toISOString().split('T')[0],
    region: REGIONS[Math.floor(Math.random()*REGIONS.length)]!,
    industry: INDUSTRIES[Math.floor(Math.random()*INDUSTRIES.length)]!,
  };
}).sort((a,b)=>b.createdDate.localeCompare(a.createdDate));

function buildColumns(): DataTableColumn<Tenant>[] {
  return [
    {key:'name',title:'租户名称',dataKey:'name',sortable:true,render:i=><span style={{color:'#93c5fd',fontWeight:600}}>{i.name}</span>},
    {key:'code',title:'编码',dataKey:'code',sortable:true},
    {key:'tier',title:'版本',sortable:true,sortValue:i=>i.tier,render:i=><span style={{color:TIER_COLORS[i.tier],fontWeight:600}}>{TIER_LABELS[i.tier]}</span>},
    {key:'status',title:'状态',sortable:true,sortValue:i=>i.status,render:i=><StatusBadge label={TS[i.status].l} variant={TS[i.status].v} size="sm" dot />},
    {key:'stores',title:'门店',dataKey:'stores',sortable:true,align:'right'},
    {key:'users',title:'用户',dataKey:'users',sortable:true,align:'right'},
    {key:'revenue',title:'营收',dataKey:'revenue',sortable:true,align:'right',render:i=><span style={{color:'#22c55e',fontWeight:600}}>{formatMoney(i.revenue)}</span>},
    {key:'region',title:'区域',dataKey:'region',sortable:true},
    {key:'expiryDate',title:'到期日',dataKey:'expiryDate',sortable:true,render:i=>{const days=Math.ceil((new Date(i.expiryDate).getTime()-Date.now())/86400000);return<span style={{color:days<30?'#ef4444':days<90?'#eab308':'#94a3b8'}}>{i.expiryDate}{days<0?' 已过期':''}</span>;}},
  ];
}

export default function TenantsPage() {
  const [tab,setTab]=useState<'list'|'analytics'>('list');
  const stats = useMemo(()=>({
    total:tenants.length,active:tenants.filter(t=>t.status==='active').length,
    trial:tenants.filter(t=>t.status==='trial').length,suspended:tenants.filter(t=>t.status==='suspended').length,
    expired:tenants.filter(t=>t.status==='expired').length,
    revenue:tenants.reduce((s,t)=>s+t.revenue,0),
    stores:tenants.reduce((s,t)=>s+t.stores,0),users:tenants.reduce((s,t)=>s+t.users,0),
    byTier:TIER_TIERS.map(tier=>({tier,count:tenants.filter(t=>t.tier===tier).length})),
  }),[]);

  const searchFields=useMemo<(keyof Tenant)[]>(()=>['name','code','contactName','contactEmail','region','industry'],[]);
  const {searchTerm,setSearchTerm,filteredItems}=useSearchFilter(tenants,searchFields);
  const [statusFilter,setStatusFilter]=useState<string>('ALL');
  const statusFiltered=useMemo(()=>statusFilter==='ALL'?filteredItems:filteredItems.filter(t=>t.status===statusFilter),[filteredItems,statusFilter]);
  const [sortConfig,setSortConfig]=useState<DataTableSortConfig|null>(null);
  const columns=useMemo(()=>buildColumns(),[]);
  const sorted=useSortedItems(statusFiltered,columns,sortConfig);
  const pagination=usePagination({initialPageSize:15});
  const pageItems=pagination.paginate(sorted);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="租户管理" subtitle={`${stats.total}个租户 · 累计营收${formatMoney(stats.revenue)}`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>租户总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>正常: {stats.active}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>试用/暂停/过期</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}><span style={{color:'#3b82f6'}}>{stats.trial}</span>/<span style={{color:'#ef4444'}}>{stats.suspended}</span>/<span style={{color:'#eab308'}}>{stats.expired}</span></div><div style={{marginTop:4,fontSize:12,color:'#fca5a5'}}>{stats.suspended+stats.expired}个需关注</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>关联门店</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{stats.stores}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>用户: {stats.users}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总营收</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{formatMoney(stats.revenue)}</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[{key:'list',label:'📋 租户列表'},{key:'analytics',label:'📊 数据分析'}]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='list' && <>
          <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索租户名称/编码/联系人/区域..." />
          <div style={{marginTop:12}}><Tabs items={[
            {key:'ALL',label:'全部',count:filteredItems.length},
            ...(['active','trial','suspended','expired'] as TenantStatus[]).map(s=>({key:s,label:TS[s].l,count:filteredItems.filter(t=>t.status===s).length})),
          ]} activeKey={statusFilter} onChange={setStatusFilter} variant="pills" size="sm" /></div>
          <DataTable title={`租户列表 (${sorted.length})`} columns={columns} items={pageItems} rowKey={i=>i.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
          <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
        </>}

        {tab==='analytics' && <>
          <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(3,1fr)',marginBottom:20}}>
            {stats.byTier.map(t=><div key={t.tier} style={card}>
              <div style={{fontSize:13,color:TIER_COLORS[t.tier]}}>{TIER_LABELS[t.tier]}</div>
              <div style={{marginTop:6,fontSize:28,fontWeight:700}}>{t.count}</div>
              <div style={{marginTop:4,height:6,borderRadius:3,background:'rgba(148,163,184,0.12)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(t.count/stats.total)*100}%`,borderRadius:3,background:TIER_COLORS[t.tier]}} />
              </div>
            </div>)}
          </div>
          <div style={card}>
            <h3 style={{margin:'0 0 12px',fontSize:16,fontWeight:700}}>区域分布</h3>
            <div style={{display:'grid',gap:8,gridTemplateColumns:'repeat(4,1fr)'}}>
              {REGIONS.map(r=>{const count=tenants.filter(t=>t.region===r).length;return<div key={r} style={{padding:12,borderRadius:10,background:'rgba(15,23,42,0.3)',textAlign:'center'}}><div style={{fontSize:24,fontWeight:700,color:'#3b82f6'}}>{count}</div><div style={{fontSize:12,color:'#94a3b8',marginTop:4}}>{r}</div></div>;})}
            </div>
          </div>
        </>}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const th: React.CSSProperties={textAlign:'left',padding:'10px 14px',color:'#94a3b8',fontSize:12,borderBottom:'1px solid rgba(148,163,184,0.18)'};
const td: React.CSSProperties={padding:'10px 14px',color:'#e2e8f0',fontSize:13,borderBottom:'1px solid rgba(148,163,184,0.1)'};
