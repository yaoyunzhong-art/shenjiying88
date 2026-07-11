'use client';

/**
 * 门店会员管理 - Store Members Page (门店特定)
 * 角色: 👥客服 / 👔店长
 * 功能: 本店会员列表、会员分析、重要会员、沉睡会员唤醒
 */

import { useState, useMemo, useCallback } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput, DataTable, Pagination, usePagination, useSearchFilter, useSortedItems, type DataTableColumn, type DataTableSortConfig } from '@m5/ui';

type MemberTier = 'normal'|'silver'|'gold'|'diamond'|'platinum';
type MemberStatus = 'active'|'sleeping'|'lost'|'new';
interface StoreMember { id:string; name:string; phone:string; tier:MemberTier; status:MemberStatus; points:number; balance:number; spend30d:number; visit30d:number; lastVisit?:string; joinDate?:string; tags:string[]; }

const TIER_LABELS: Record<MemberTier,string>={normal:'普通',silver:'银卡',gold:'金卡',diamond:'钻石',platinum:'至尊'};
const TIER_COLORS: Record<MemberTier,string>={normal:'#6b7280',silver:'#94a3b8',gold:'#eab308',diamond:'#3b82f6',platinum:'#8b5cf6'};
const MS: Record<MemberStatus,{l:string;v:'success'|'warning'|'danger'|'info'}>={active:{l:'活跃',v:'success'},sleeping:{l:'沉睡',v:'warning'},lost:{l:'流失',v:'danger'},new:{l:'新会员',v:'info'}};

function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const storeMembers: StoreMember[] = Array.from({length:85}, (_,i) => {
  const tiers: MemberTier[] = ['normal','normal','normal','silver','silver','gold','diamond','platinum'];
  const statuses: MemberStatus[] = ['active','active','active','active','active','sleeping','lost','new'];
  return {
    id:`SM-${String(i+1).padStart(3,'0')}`,
    name:['张伟','李娜','王强','赵敏','刘洋','陈静','杨磊','黄丽','周杰','吴芳','徐明','孙燕','马超','朱婷','胡波','郭峰'][i%16]!,
    phone:`1${3+Math.floor(Math.random()*7)}8${String(Math.floor(Math.random()*10000000)).padStart(7,'0')}`,
    tier: tiers[Math.floor(Math.random()*tiers.length)]!!, status: statuses[Math.floor(Math.random()*statuses.length)]!!,
    points:Math.floor(Math.random()*5000), balance:Math.round((50+Math.random()*500)*100)/100,
    spend30d:Math.round((0+Math.random()*2000)*100)/100, visit30d:Math.floor(Math.random()*8),
    lastVisit:new Date(Date.now()-Math.floor(Math.random()*30)*86400000).toISOString().split('T')[0],
    joinDate:new Date(2025,Math.floor(Math.random()*18),1+Math.floor(Math.random()*28)).toISOString().split('T')[0],
    tags:['高消费','亲子','学生','周末活跃','设备爱好者','会员推荐'].filter(()=>Math.random()>0.6),
  };
});

function buildColumns(): DataTableColumn<StoreMember>[] {
  return [
    {key:'name',title:'姓名',dataKey:'name',sortable:true,render:i=><span style={{color:'#93c5fd',fontWeight:600}}>{i.name}</span>},
    {key:'tier',title:'等级',sortable:true,sortValue:i=>i.tier,render:i=><span style={{color: TIER_COLORS[i.tier]!,fontWeight:600}}>{TIER_LABELS[i.tier]}</span>},
    {key:'status',title:'状态',sortable:true,sortValue:i=>i.status,render:i=><StatusBadge label={MS[i.status].l} variant={MS[i.status].v} size="sm" dot />},
    {key:'points',title:'积分',dataKey:'points',sortable:true,align:'right'},
    {key:'balance',title:'余额',dataKey:'balance',sortable:true,align:'right',render:i=><span style={{color:'#22c55e',fontWeight:600}}>{fm(i.balance)}</span>},
    {key:'spend30d',title:'30天消费',dataKey:'spend30d',sortable:true,align:'right',render:i=><span style={{color:i.spend30d>500?'#22c55e':'#94a3b8',fontWeight:600}}>{fm(i.spend30d)}</span>},
    {key:'visit30d',title:'到店次数',dataKey:'visit30d',sortable:true,align:'right'},
    {key:'lastVisit',title:'最近到店',dataKey:'lastVisit',sortable:true,render:i=>{const days=Math.ceil((Date.now()-new Date(i.lastVisit).getTime())/86400000);return<span style={{color:days>14?'#ef4444':days>7?'#eab308':'#22c55e'}}>{i.lastVisit}</span>;}},
  ];
}

export default function StoreMembersPage() {
  const members = useMemo(()=>storeMembers,[]);
  const [tab,setTab]=useState<'list'|'analytics'>('list');
  const stats = useMemo(()=>({
    total:members.length,active:members.filter(m=>m.status==='active').length,
    sleeping:members.filter(m=>m.status==='sleeping').length,lost:members.filter(m=>m.status==='lost').length,
    newM:members.filter(m=>m.status==='new').length,
    totalBalance:members.reduce((s,m)=>s+m.balance,0),
    totalSpend30d:members.reduce((s,m)=>s+m.spend30d,0),
    avgSpend:members.filter(m=>m.visit30d>0).length>0?Math.round(members.filter(m=>m.visit30d>0).reduce((s,m)=>s+m.spend30d,0)/members.filter(m=>m.visit30d>0).length*100)/100:0,
  }),[members]);

  const searchFields=useMemo<(keyof StoreMember)[]>(()=>['name','phone','tags'],[]);
  const {searchTerm,setSearchTerm,filteredItems}=useSearchFilter(members,searchFields);
  const [statusFilter,setStatusFilter]=useState<string>('ALL');
  const [tierFilter,setTierFilter]=useState<string>('ALL');
  const tierFiltered=useMemo(()=>tierFilter==='ALL'?filteredItems:filteredItems.filter(m=>m.tier===tierFilter),[filteredItems,tierFilter]);
  const statusFiltered=useMemo(()=>statusFilter==='ALL'?tierFiltered:tierFiltered.filter(m=>m.status===statusFilter),[tierFiltered,statusFilter]);
  const [sortConfig,setSortConfig]=useState<DataTableSortConfig|null>(null);
  const columns=useMemo(()=>buildColumns(),[]);
  const sorted=useSortedItems(statusFiltered,columns,sortConfig);
  const pagination=usePagination({initialPageSize:15});
  const pageItems=pagination.paginate(sorted);

  const sleepingMembers = members.filter(m=>m.status==='sleeping').slice(0,5);
  const topSpenders = [...members].sort((a,b)=>b.spend30d-a.spend30d).slice(0,5);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="会员管理" subtitle={`${stats.total}位会员 · 30天消费总额${fm(stats.totalSpend30d)}`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>会员总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>活跃: {stats.active} · 新: {stats.newM}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>需关注</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}><span style={{color:'#eab308'}}>沉睡{stats.sleeping}</span> / <span style={{color:'#ef4444'}}>流失{stats.lost}</span></div><div style={{marginTop:4,fontSize:12,color:'#fca5a5'}}>唤醒计划: {stats.sleeping}个</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>账户余额</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{fm(stats.totalBalance)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>沉睡资金</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>人均消费</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{fm(stats.avgSpend)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>30天/每人</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[{key:'list',label:'📋 会员列表'},{key:'analytics',label:'📊 数据分析'}]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='list' && (<>
          <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索姓名/电话..." />
          <div style={{marginTop:12,display:'flex',gap:16,flexWrap:'wrap'}}>
            <div><div style={{fontSize:12,color:'#94a3b8',marginBottom:6}}>等级</div><Tabs items={[
              {key:'ALL',label:'全部',count:filteredItems.length},
              ...(['normal','silver','gold','diamond','platinum'] as MemberTier[]).map(t=>({key:t,label: TIER_LABELS[t]!,count:filteredItems.filter(m=>m.tier===t).length})),
            ]} activeKey={tierFilter} onChange={setTierFilter} variant="pills" size="sm" /></div>
            <div><div style={{fontSize:12,color:'#94a3b8',marginBottom:6}}>状态</div><Tabs items={[
              {key:'ALL',label:'全部',count:tierFiltered.length},
              ...(['active','sleeping','lost','new'] as MemberStatus[]).map(s=>({key:s,label: MS[s]!.l,count:tierFiltered.filter(m=>m.status===s).length})),
            ]} activeKey={statusFilter} onChange={setStatusFilter} variant="pills" size="sm" /></div>
          </div>
          <DataTable title={`会员 (${sorted.length})`} columns={columns} items={pageItems} rowKey={i=>i.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
          <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
        </>)}

        {tab==='analytics' && (<div style={{display:'grid',gap:20,gridTemplateColumns:'1fr 1fr'}}>
          <section style={card}><h3 style={{margin:'0 0 12px',fontSize:16,fontWeight:700}}>⚠️ 沉睡会员唤醒</h3>
            {sleepingMembers.map(m=><div key={m.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(148,163,184,0.08)',fontSize:13}}>
              <span style={{color:'#e2e8f0'}}>{m.name}</span><span style={{color:'#94a3b8'}}>余额{fm(m.balance)}</span><span style={{color:'#eab308'}}>沉睡{m.lastVisit?Math.ceil((Date.now()-new Date(m.lastVisit).getTime())/86400000)+'天':''}</span>
            </div>)}
            <button style={{marginTop:12,...btnStyle('#eab308','#fbbf24')}}>📋 批量唤醒</button>
          </section>
          <section style={card}><h3 style={{margin:'0 0 12px',fontSize:16,fontWeight:700}}>🏆 高消费会员 TOP5</h3>
            {topSpenders.map((m,i)=><div key={m.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(148,163,184,0.08)',fontSize:13}}>
              <span style={{fontWeight:600}}>#{i+1} {m.name}</span><span style={{color:'#22c55e',fontWeight:600}}>{fm(m.spend30d)}</span><span style={{color:'#94a3b8'}}>{m.visit30d}次</span>
            </div>)}
          </section>
        </div>)}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:10,padding:'10px 18px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:14,fontWeight:600});
