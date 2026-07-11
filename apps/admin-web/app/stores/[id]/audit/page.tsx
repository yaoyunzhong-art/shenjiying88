'use client';

/**
 * 门店日志审计 - Store Audit Log
 * 角色: 👑管理员 / 🔧安监
 * 功能: 操作日志、变更记录、安全审计、合规检查
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput, DataTable, Pagination, usePagination, useSearchFilter, useSortedItems, type DataTableColumn, type DataTableSortConfig } from '@m5/ui';

type AuditAction = 'create'|'update'|'delete'|'login'|'logout'|'approve'|'reject'|'export'|'import'|'config_change';
type AuditTarget = 'member'|'order'|'device'|'staff'|'inventory'|'finance'|'setting'|'security'|'promotion';
type AuditLevel = 'info'|'warning'|'critical';

interface AuditLog { id:string; time:string; action:AuditAction; target:AuditTarget; targetId:string; operator:string; detail:string; ip:string; level:AuditLevel; duration:number; status:'success'|'failure'|'blocked'; }

const AL: Record<AuditAction, string> = { create:'新增', update:'修改', delete:'删除', login:'登录', logout:'登出', approve:'审批通过', reject:'审批拒绝', export:'导出', import:'导入', config_change:'配置变更' };
const ALV: Record<AuditAction, 'success'|'warning'|'danger'|'neutral'|'info'> = { create:'success', update:'info', delete:'danger', login:'success', logout:'neutral', approve:'success', reject:'danger', export:'neutral', import:'warning', config_change:'warning' };
const AT: Record<AuditTarget, string> = { member:'会员', order:'订单', device:'设备', staff:'员工', inventory:'库存', finance:'财务', setting:'设置', security:'安全', promotion:'促销' };
const ALS: Record<string,{l:string;v:'success'|'danger'|'warning'}> = { success:{l:'成功',v:'success'}, failure:{l:'失败',v:'danger'}, blocked:{l:'已拦截',v:'warning'} };

const actions: AuditAction[] = ['create','update','delete','login','login','approve','reject','export','config_change','logout'];
const targets: AuditTarget[] = ['member','order','device','staff','inventory','finance','setting','security','promotion'];

const auditLogs: AuditLog[] = Array.from({length:60}, (_,i) => {
  const time = new Date(Date.now()-Math.floor(Math.random()*72)*3600000);
  const action = actions[Math.floor(Math.random()*actions.length)]!;
  return {
    id: `AUDIT-${String(i+1).padStart(4,'0')}`,
    time: time.toISOString(),
    action,
    target: targets[Math.floor(Math.random()*targets.length)]!,
    targetId: `TGT-${String(10000+Math.floor(Math.random()*90000))}`,
    operator: ['张三','李四','王五','赵六','店长','系统'][Math.floor(Math.random()*6)]!,
    detail: `${AL[action]}${AT[targets[Math.floor(Math.random()*targets.length)]!]}记录`,
    ip: `192.168.1.${100+Math.floor(Math.random()*50)}`,
    level: (action==='delete'?'critical':action==='login'?'info':action==='reject'?'warning':'info') as AuditLevel,
    duration: Math.floor(Math.random()*5000),
    status: (Math.random()>0.1?'success':Math.random()>0.5?'failure':'blocked') as 'success' | 'failure' | 'blocked',
  };
}).sort((a,b)=>new Date(b.time).getTime()-new Date(a.time).getTime());

function fmtTime(iso:string):string {
  const d=new Date(iso);
  return `${d.toLocaleDateString('zh-CN')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function buildColumns(): DataTableColumn<AuditLog>[] {
  return [
    {key:'time',title:'时间',sortable:true,sortValue:i=>i.time,render:i=><span style={{fontSize:12,color:'#94a3b8'}}>{fmtTime(i.time)}</span>},
    {key:'action',title:'操作',sortable:true,sortValue:i=>i.action,render:i=><StatusBadge label={AL[i.action]} variant={ALV[i.action]} size="sm" />},
    {key:'target',title:'对象',sortable:true,sortValue:i=>i.target,render:i=>AT[i.target]},
    {key:'targetId',title:'对象ID',dataKey:'targetId',sortable:true,render:i=><span style={{fontSize:11,color:'#93c5fd'}}>{i.targetId}</span>},
    {key:'operator',title:'操作人',dataKey:'operator',sortable:true},
    {key:'detail',title:'详情',dataKey:'detail',sortable:false,render:i=><span style={{color:'#cbd5e1',fontSize:12}}>{i.detail}</span>},
    {key:'level',title:'级别',sortable:true,sortValue:i=>i.level,render:i=><StatusBadge label={i.level==='critical'?'严重':i.level==='warning'?'警告':'一般'} variant={i.level==='critical'?'danger':i.level==='warning'?'warning':'info'} size="sm" />},
    {key:'status',title:'状态',sortable:true,sortValue:i=>i.status,render:i=><StatusBadge label={ALS[i.status]!.l} variant={ALS[i.status]!.v} size="sm" dot />},
    {key:'ip',title:'IP',dataKey:'ip',sortable:true,render:i=><span style={{fontSize:11,color:'#94a3b8'}}>{i.ip}</span>},
  ];
}

export default function AuditLogPage() {
  const logs=useMemo(()=>auditLogs,[]);
  const stats=useMemo(()=>({total:logs.length,critical:logs.filter(l=>l.level==='critical').length,failure:logs.filter(l=>l.status!=='success').length,blocked:logs.filter(l=>l.status==='blocked').length,}),[logs]);
  const searchFields=useMemo<(keyof AuditLog)[]>(()=>['operator','detail','targetId','ip'],[]);
  const {searchTerm,setSearchTerm,filteredItems}=useSearchFilter(logs,searchFields);
  const [levelFilter,setLevelFilter]=useState<string>('ALL');
  const levelFiltered=useMemo(()=>levelFilter==='ALL'?filteredItems:filteredItems.filter(l=>l.level===levelFilter),[filteredItems,levelFilter]);
  const [sortConfig,setSortConfig]=useState<DataTableSortConfig|null>(null);
  const columns=useMemo(()=>buildColumns(),[]);
  const sorted=useSortedItems(levelFiltered,columns,sortConfig);
  const pagination=usePagination({initialPageSize:15});
  const pageItems=pagination.paginate(sorted);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="📋 审计日志" subtitle={`${stats.total}条记录 · ${stats.critical}条严重 · ${stats.blocked}次拦截`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总日志</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>严重级别</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{stats.critical}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>异常操作</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{stats.failure}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>其中拦截: {stats.blocked}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>安全事件占比</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:stats.critical>5?'#ef4444':'#22c55e'}}>{((stats.critical/stats.total)*100).toFixed(1)}%</div></div>
        </div>

        <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索操作人/详情/对象ID/IP..." />
        <div style={{marginTop:12}}><Tabs items={[
          {key:'ALL',label:'全部',count:filteredItems.length},{key:'info',label:'一般',count:filteredItems.filter(l=>l.level==='info').length},{key:'warning',label:'警告',count:filteredItems.filter(l=>l.level==='warning').length},{key:'critical',label:'严重',count:filteredItems.filter(l=>l.level==='critical').length},
        ]} activeKey={levelFilter} onChange={setLevelFilter} variant="pills" size="sm" /></div>

        <DataTable title={`审计日志 (${sorted.length})`} columns={columns} items={pageItems} rowKey={i=>i.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
        <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
