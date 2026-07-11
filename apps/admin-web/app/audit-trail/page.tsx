'use client';

/**
 * 日志审计 - Audit Logs
 * 角色: 🔒安全审计 / 👑超级管理员
 * 功能: 操作日志、登陆日志、安全事件审计
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput, DataTable, Pagination, usePagination, useSearchFilter, useSortedItems, type DataTableColumn, type DataTableSortConfig } from '@m5/ui';

type AuditAction = 'create'|'update'|'delete'|'login'|'logout'|'export'|'approve'|'reject'|'view';
type AuditModule = 'member'|'order'|'inventory'|'finance'|'settings'|'auth'|'device'|'report'|'staff';
type AuditResult = 'success'|'failure'|'blocked'|'pending';

interface AuditLog { id:string; time:string; user:string; role:string; action:AuditAction; module:AuditModule; target:string; detail:string; ip:string; result:AuditResult; duration:number; }

const AL: Record<AuditAction,string> = { create:'新增', update:'修改', delete:'删除', login:'登录', logout:'登出', export:'导出', approve:'审批通过', reject:'审批驳回', view:'查看' };
const AM: Record<AuditModule,string> = { member:'会员', order:'订单', inventory:'库存', finance:'财务', settings:'设置', auth:'认证', device:'设备', report:'报表', staff:'员工' };
const AR: Record<AuditResult,{l:string;v:'success'|'danger'|'neutral'|'warning'}> = { success:{l:'成功',v:'success'}, failure:{l:'失败',v:'danger'}, blocked:{l:'拦截',v:'neutral'}, pending:{l:'待审批',v:'warning'} };

const logs: AuditLog[] = Array.from({length:200}, (_,i) => {
  const d = new Date(Date.now()-Math.floor(Math.random()*7)*86400000-Math.floor(Math.random()*86400000));
  const actions: AuditAction[] = ['create','update','delete','login','logout','export','approve','reject','view'];
  const modules: AuditModule[] = ['member','order','inventory','finance','settings','auth','device','report','staff'];
  const results: AuditResult[] = ['success','success','success','success','failure','blocked','pending'];
  const users = ['admin','张伟','李娜','王强','赵敏','刘洋','system'];
  const targets = ['会员ID:1001','订单ORD-12345','设备DEV-001','配置项','报表:2026-07','库存SKU-1001','员工EMP-001'];
  const details = ['修改会员信息','创建新订单','删除过期配置','导出月度报表','审批通过退款','登录失败','查看详情'];
  return {
    id:`AUD-${String(i+1).padStart(4,'0')}`,
    time:d.toISOString().replace('T',' ').slice(0,19),
    user:users[Math.floor(Math.random()*users.length)]!,
    role:['超级管理员','门店管理员','运营专员','收银员','导玩员'][Math.floor(Math.random()*5)]!,
    action:actions[Math.floor(Math.random()*actions.length)]!,
    module:modules[Math.floor(Math.random()*modules.length)]!,
    target:targets[Math.floor(Math.random()*targets.length)]!,
    detail:details[Math.floor(Math.random()*details.length)]!,
    ip:`192.168.1.${100+Math.floor(Math.random()*200)}`,
    result:results[Math.floor(Math.random()*results.length)]!,
    duration:Math.floor(Math.random()*5000),
  };
}).sort((a,b)=>b.time.localeCompare(a.time));

function buildColumns(): DataTableColumn<AuditLog>[] {
  return [
    {key:'time',title:'时间',dataKey:'time',sortable:true,render:i=><span style={{fontSize:12,color:'#94a3b8'}}>{i.time}</span>},
    {key:'user',title:'用户',dataKey:'user',sortable:true},
    {key:'action',title:'操作',sortable:true,sortValue:i=>i.action,render:i=><span style={{fontWeight:600}}>{AL[i.action]}</span>},
    {key:'module',title:'模块',sortable:true,sortValue:i=>i.module,render:i=><StatusBadge label={AM[i.module]} variant='info' size="sm" />},
    {key:'target',title:'目标',dataKey:'target',sortable:true,render:i=><span style={{color:'#93c5fd',fontSize:12}}>{i.target}</span>},
    {key:'result',title:'结果',sortable:true,sortValue:i=>i.result,render:i=><StatusBadge label={AR[i.result].l} variant={AR[i.result].v} size="sm" />},
    {key:'ip',title:'IP',dataKey:'ip',sortable:true,render:i=><span style={{fontSize:11,color:'#6b7280'}}>{i.ip}</span>},
  ];
}

export default function AuditLogsPage() {
  const [moduleFilter,setModuleFilter]=useState<string>('ALL');
  const [resultFilter,setResultFilter]=useState<string>('ALL');
  const searchFields=useMemo<(keyof AuditLog)[]>(()=>['user','target','detail','ip'],[]);
  const {searchTerm,setSearchTerm,filteredItems}=useSearchFilter(logs,searchFields);
  const moduleFiltered=useMemo(()=>moduleFilter==='ALL'?filteredItems:filteredItems.filter(l=>l.module===moduleFilter),[filteredItems,moduleFilter]);
  const resultFiltered=useMemo(()=>resultFilter==='ALL'?moduleFiltered:moduleFiltered.filter(l=>l.result===resultFilter),[moduleFiltered,resultFilter]);
  const [sortConfig,setSortConfig]=useState<DataTableSortConfig|null>(null);
  const columns=useMemo(()=>buildColumns(),[]);
  const sorted=useSortedItems(resultFiltered,columns,sortConfig);
  const pagination=usePagination({initialPageSize:20});
  const pageItems=pagination.paginate(sorted);

  const failureCount = logs.filter(l=>l.result==='failure'||l.result==='blocked').length;

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="🔒 审计日志" subtitle={`${logs.length}条记录 · ${failureCount}条异常`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总操作数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{logs.length}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>失败/拦截</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{failureCount}</div><div style={{marginTop:4,fontSize:12,color:'#fca5a5'}}>{((failureCount/logs.length)*100).toFixed(1)}%异常率</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>今日操作</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{logs.filter(l=>l.time.startsWith(new Date().toISOString().split('T')[0])).length}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>数据范围</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#8b5cf6'}}>7天</div></div>
        </div>

        <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索用户/目标/详情/IP..." />
        <div style={{marginTop:12,display:'flex',gap:16,flexWrap:'wrap'}}>
          <div><Tabs items={[{key:'ALL',label:'全部模块'},...(Object.keys(AM) as AuditModule[]).map(m=>({key:m,label:AM[m]}))]} activeKey={moduleFilter} onChange={setModuleFilter} variant="pills" size="sm" /></div>
          <div><Tabs items={[{key:'ALL',label:'全部结果'},...(['success','failure','blocked','pending'] as AuditResult[]).map(r=>({key:r,label:AR[r].l}))]} activeKey={resultFilter} onChange={setResultFilter} variant="pills" size="sm" /></div>
        </div>

        <DataTable title={`审计日志 (${sorted.length})`} columns={columns} items={pageItems} rowKey={i=>i.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
        <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
