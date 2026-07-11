'use client';

/**
 * 运营中心 - Operations Center
 * 角色: 🎯运行专员 / 👔店长
 * 功能: 任务管理、流程审批、运营工单、KPI看板
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, DataTable, Pagination, usePagination, type DataTableColumn } from '@m5/ui';

type OpsTaskStatus = 'todo'|'in_progress'|'done'|'cancelled';
type OpsTaskType = 'approval'|'inspection'|'onboarding'|'report'|'event'|'issue';
type OpsPriority = 'p0'|'p1'|'p2'|'p3';

interface OpsTask { id:string; title:string; type:OpsTaskType; priority:OpsPriority; status:OpsTaskStatus; assignee:string; dept:string; createdDate:string; dueDate:string; completedDate:string; description:string; attachments:number; comments:number; }
interface KpiTarget { metric:string; target:number; actual:number; unit:string; period:string; owner:string; status:'on_track'|'at_risk'|'behind'|'exceeded'; }

const OTS: Record<OpsTaskStatus,{l:string;v:'success'|'warning'|'danger'|'neutral'}> = { todo:{l:'待处理',v:'danger'}, in_progress:{l:'进行中',v:'warning'}, done:{l:'已完成',v:'success'}, cancelled:{l:'已取消',v:'neutral'} };
const OTT: Record<OpsTaskType,string> = { approval:'审批', inspection:'巡检', onboarding:'入职', report:'报告', event:'活动', issue:'问题' };
const OTP: Record<OpsPriority,{l:string;v:'danger'|'warning'|'info'|'neutral'}> = { p0:{l:'P0紧急',v:'danger'}, p1:{l:'P1重要',v:'warning'}, p2:{l:'P2普通',v:'info'}, p3:{l:'P3低优',v:'neutral'} };
const KPI_S: Record<KpiTarget['status'],{l:string;v:'success'|'warning'|'danger'|'info'}> = { on_track:{l:'正常',v:'success'}, at_risk:{l:'风险',v:'warning'}, behind:{l:'滞后',v:'danger'}, exceeded:{l:'超额',v:'info'} };

const tasks: OpsTask[] = [
  { id:'OT1', title:'7月营业数据汇总', type:'report', priority:'p1', status:'in_progress', assignee:'李娜', dept:'运营部', createdDate:'2026-07-10', dueDate:'2026-07-15', completedDate:'', description:'汇总7月1-10日营业数据', attachments:0, comments:2 },
  { id:'OT2', title:'设备采购审批', type:'approval', priority:'p0', status:'todo', assignee:'店长', dept:'管理部', createdDate:'2026-07-11', dueDate:'2026-07-12', completedDate:'', description:'新购2台VR设备审批', attachments:3, comments:1 },
  { id:'OT3', title:'新员工入职办理', type:'onboarding', priority:'p1', status:'in_progress', assignee:'赵敏', dept:'HR', createdDate:'2026-07-08', dueDate:'2026-07-14', completedDate:'', description:'3名新导玩员入职手续', attachments:2, comments:0 },
  { id:'OT4', title:'暑期活动物料准备', type:'event', priority:'p1', status:'todo', assignee:'陈静', dept:'市场部', createdDate:'2026-07-09', dueDate:'2026-07-17', completedDate:'', description:'海报、展架、礼品采购', attachments:1, comments:3 },
  { id:'OT5', title:'消防巡检整改', type:'inspection', priority:'p0', status:'todo', assignee:'杨磊', dept:'技术部', createdDate:'2026-07-11', dueDate:'2026-07-13', completedDate:'', description:'灭火器过期更换+应急灯维修', attachments:0, comments:0 },
  { id:'OT6', title:'7月客户满意度报告', type:'report', priority:'p2', status:'done', assignee:'吴芳', dept:'运营部', createdDate:'2026-07-05', dueDate:'2026-07-10', completedDate:'2026-07-10', description:'6月满意度数据分析', attachments:1, comments:2 },
  { id:'OT7', title:'库存盘点执行', type:'issue', priority:'p2', status:'in_progress', assignee:'刘洋', dept:'库存', createdDate:'2026-07-08', dueDate:'2026-07-15', completedDate:'', description:'7月例行库存盘点', attachments:0, comments:1 },
  { id:'OT8', title:'空调故障报修', type:'issue', priority:'p1', status:'todo', assignee:'杨磊', dept:'技术部', createdDate:'2026-07-11', dueDate:'2026-07-12', completedDate:'', description:'A区空调制冷不足', attachments:0, comments:0 },
  { id:'OT9', title:'充值活动方案审核', type:'approval', priority:'p2', status:'done', assignee:'店长', dept:'管理部', createdDate:'2026-07-06', dueDate:'2026-07-09', completedDate:'2026-07-09', description:'会员充值满赠活动方案', attachments:2, comments:5 },
  { id:'OT10', title:'周运营报告', type:'report', priority:'p2', status:'done', assignee:'李娜', dept:'运营部', createdDate:'2026-07-04', dueDate:'2026-07-07', completedDate:'2026-07-07', description:'上周运营数据汇总', attachments:0, comments:1 },
];

const kpis: KpiTarget[] = [
  { metric:'月营收', target:380000, actual:265000, unit:'元', period:'7月', owner:'运营部', status:'on_track' },
  { metric:'日均客流', target:400, actual:365, unit:'人', period:'7月', owner:'运营部', status:'at_risk' },
  { metric:'设备在线率', target:95, actual:91.2, unit:'%', period:'7月', owner:'技术部', status:'behind' },
  { metric:'会员活跃率', target:60, actual:58.5, unit:'%', period:'7月', owner:'运营部', status:'at_risk' },
  { metric:'客单价', target:55, actual:52.3, unit:'元', period:'7月', owner:'运营部', status:'on_track' },
  { metric:'投诉解决率', target:95, actual:97.5, unit:'%', period:'7月', owner:'运营部', status:'exceeded' },
  { metric:'库存周转', target:15, actual:12.5, unit:'天', period:'7月', owner:'库存', status:'on_track' },
  { metric:'员工培训完成', target:90, actual:78, unit:'%', period:'7月', owner:'HR', status:'at_risk' },
];

function buildColumns(): DataTableColumn<OpsTask>[] {
  return [
    {key:'title',title:'任务',dataKey:'title',sortable:true,render:i=><span style={{color:'#93c5fd',fontWeight:600}}>{i.title}</span>},
    {key:'type',title:'类型',sortable:true,sortValue:i=>i.type,render:i=>OTT[i.type]},
    {key:'priority',title:'优先级',sortable:true,sortValue:i=>i.priority,render:i=><StatusBadge label={OTP[i.priority].l} variant={OTP[i.priority].v} size="sm" />},
    {key:'status',title:'状态',sortable:true,sortValue:i=>i.status,render:i=><StatusBadge label={OTS[i.status].l} variant={OTS[i.status].v} size="sm" dot />},
    {key:'assignee',title:'负责人',dataKey:'assignee',sortable:true},
    {key:'dueDate',title:'截止',dataKey:'dueDate',sortable:true,render:i=>{const d=Math.ceil((new Date(i.dueDate).getTime()-Date.now())/86400000);return<span style={{color:d<0?'#ef4444':d<3?'#eab308':'#94a3b8'}}>{i.dueDate}</span>;}},
    {key:'comments',title:'评论',dataKey:'comments',sortable:true,align:'right'},
  ];
}

export default function OperationsCenterPage() {
  const [tab,setTab]=useState<'tasks'|'kpi'>('tasks');
  const todoCount = tasks.filter(t=>t.status==='todo').length;
  const inProgressCount = tasks.filter(t=>t.status==='in_progress').length;
  const p0Count = tasks.filter(t=>t.priority==='p0').length;

  const kpiStats = useMemo(() => ({
    onTrack: kpis.filter(k=>k.status==='on_track'||k.status==='exceeded').length,
    atRisk: kpis.filter(k=>k.status==='at_risk').length,
    behind: kpis.filter(k=>k.status==='behind').length,
  }), []);

  const [sortConfig,setSortConfig]=useState<null>(null);
  const columns=useMemo(()=>buildColumns(),[]);
  const sorted=tasks;
  const pagination=usePagination({initialPageSize:10});

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="🏢 运营中心" subtitle="任务管理·KPI看板·流程审批">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>待处理任务</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{todoCount}</div><div style={{marginTop:4,fontSize:12,color:'#eab308'}}>进行中: {inProgressCount}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>P0紧急</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{p0Count}</div><div style={{marginTop:4,fontSize:12,color:'#fca5a5'}}>需立即处理</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>KPI达标</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{kpiStats.onTrack}/{kpis.length}</div><div style={{marginTop:4,fontSize:12,color:'#eab308'}}>风险: {kpiStats.atRisk}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>滞后指标</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{kpiStats.behind}</div><div style={{marginTop:4,fontSize:12,color:'#fca5a5'}}>需重点关注</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[{key:'tasks',label:`📋 工单 (${tasks.length})`},{key:'kpi',label:`🎯 KPI (${kpis.length})`}]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='tasks' && <>
          <DataTable title={`运营工单`} columns={columns} items={pagination.paginate(sorted)} rowKey={i=>i.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
          <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
        </>}

        {tab==='kpi' && <div style={{display:'grid',gap:10}}>
          {kpis.map(k => (
            <div key={k.metric} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div><span style={{fontWeight:700,fontSize:15}}>{k.metric}</span><span style={{color:'#94a3b8',marginLeft:8,fontSize:12}}>{k.period} · {k.owner}</span></div>
                <StatusBadge label={KPI_S[k.status].l} variant={KPI_S[k.status].v} size="sm" />
              </div>
              <div style={{display:'flex',alignItems:'center',gap:16}}>
                <div style={{flex:1,height:8,borderRadius:4,background:'rgba(148,163,184,0.12)',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.min((k.actual/k.target)*100,100)}%`,borderRadius:4,
                    background:k.status==='behind'?'#ef4444':k.status==='at_risk'?'#eab308':k.status==='exceeded'?'#8b5cf6':'#22c55e'}} />
                </div>
                <div style={{fontSize:14,fontWeight:700,textAlign:'right',minWidth:100}}>
                  <span style={{color:k.actual>=k.target?'#22c55e':'#ef4444'}}>{k.actual.toLocaleString()}</span>
                  <span style={{color:'#94a3b8',fontSize:12,marginLeft:4}}>/ {k.target.toLocaleString()} {k.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const th: React.CSSProperties={textAlign:'left',padding:'10px 14px',color:'#94a3b8',fontSize:12,borderBottom:'1px solid rgba(148,163,184,0.18)'};
const td: React.CSSProperties={padding:'10px 14px',color:'#e2e8f0',fontSize:13,borderBottom:'1px solid rgba(148,163,184,0.1)'};
