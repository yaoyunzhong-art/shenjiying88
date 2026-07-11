'use client';

/**
 * 审批管理 - Approval Management
 * 角色: 👔店长 / 👑超级管理员
 * 功能: 待审批事项、审批历史、审批模板
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

type ApprovalStatus = 'pending'|'approved'|'rejected'|'cancelled';
type ApprovalType = 'purchase'|'refund'|'leave'|'expense'|'campaign'|'adjustment';

interface Approval { id:string; title:string; type:ApprovalType; status:ApprovalStatus; applicant:string; dept:string; amount:number; createdDate:string; dueDate:string; description:string; approver:string; approvedDate:string; comment:string; urgency:'high'|'medium'|'low'; }

const AS: Record<ApprovalStatus,{l:string;v:'warning'|'success'|'danger'|'neutral'}> = { pending:{l:'待审批',v:'warning'}, approved:{l:'已通过',v:'success'}, rejected:{l:'已驳回',v:'danger'}, cancelled:{l:'已取消',v:'neutral'} };
const AT: Record<ApprovalType,string> = { purchase:'采购', refund:'退款', leave:'请假', expense:'报销', campaign:'活动', adjustment:'调账' };
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const approvals: Approval[] = [
  { id:'A1', title:'采购VR设备*2', type:'purchase', status:'pending', applicant:'赵敏', dept:'运营部', amount:68000, createdDate:'2026-07-11', dueDate:'2026-07-14', description:'采购2台HTC VIVE Pro 2用于VR体验区', approver:'', approvedDate:'', comment:'', urgency:'high' },
  { id:'A2', title:'团建客户退款申请', type:'refund', status:'pending', applicant:'李娜', dept:'运营部', amount:3250, createdDate:'2026-07-11', dueDate:'2026-07-13', description:'团建客户临时取消，按协议退回50%定金', approver:'', approvedDate:'', comment:'', urgency:'high' },
  { id:'A3', title:'6月市场活动报销', type:'expense', status:'pending', applicant:'陈静', dept:'市场部', amount:5800, createdDate:'2026-07-10', dueDate:'2026-07-17', description:'618促销活动物料费用报销', approver:'', approvedDate:'', comment:'', urgency:'medium' },
  { id:'A4', title:'员工请假-王强(3天)', type:'leave', status:'pending', applicant:'王强', dept:'导玩组', amount:0, createdDate:'2026-07-10', dueDate:'2026-07-12', description:'年假3天(7/15-7/17)', approver:'', approvedDate:'', comment:'', urgency:'medium' },
  { id:'A5', title:'暑期促销活动方案', type:'campaign', status:'pending', applicant:'陈静', dept:'市场部', amount:15000, createdDate:'2026-07-09', dueDate:'2026-07-16', description:'暑期特惠季活动预算审批', approver:'', approvedDate:'', comment:'', urgency:'medium' },
  { id:'A6', title:'库存差异调账', type:'adjustment', status:'pending', applicant:'刘洋', dept:'库存', amount:750, createdDate:'2026-07-09', dueDate:'2026-07-14', description:'盘点发现娃娃库存差异，申请调账', approver:'', approvedDate:'', comment:'', urgency:'low' },
  { id:'A7', title:'空调维修报销', type:'expense', status:'approved', applicant:'杨磊', dept:'技术部', amount:2800, createdDate:'2026-07-08', dueDate:'2026-07-11', description:'A区空调维修费用', approver:'店长', approvedDate:'2026-07-10', comment:'同意报销', urgency:'medium' },
  { id:'A8', title:'采购清洁用品', type:'purchase', status:'approved', applicant:'黄丽', dept:'后勤', amount:1200, createdDate:'2026-07-07', dueDate:'2026-07-10', description:'月度清洁用品采购', approver:'店长', approvedDate:'2026-07-08', comment:'通过', urgency:'low' },
  { id:'A9', title:'员工请假-刘洋(1天)', type:'leave', status:'rejected', applicant:'刘洋', dept:'库存', amount:0, createdDate:'2026-07-06', dueDate:'2026-07-08', description:'事假1天(7/10)', approver:'店长', approvedDate:'2026-07-07', comment:'库存盘点期间不予批准', urgency:'low' },
  { id:'A10', title:'会员充值活动方案', type:'campaign', status:'approved', applicant:'陈静', dept:'市场部', amount:8000, createdDate:'2026-07-05', dueDate:'2026-07-09', description:'周末充值满赠活动方案', approver:'店长', approvedDate:'2026-07-08', comment:'方案可行,批准执行', urgency:'high' },
];

export default function ApprovalsPage() {
  const [tab,setTab]=useState<'pending'|'history'>('pending');
  const pending = approvals.filter(a=>a.status==='pending');
  const pendingTotal = pending.reduce((s,a)=>s+a.amount,0);

  return (
    <main style={{maxWidth:960,margin:'0 auto',padding:32}}>
      <PageShell title="📋 审批管理" subtitle={`${pending.length}条待审批 · 共${fm(pendingTotal)}`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>待审批</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{pending.length}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>待处理金额</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{fm(pendingTotal)}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>紧急</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{pending.filter(a=>a.urgency==='high').length}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>本周通过率</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{Math.round((approvals.filter(a=>a.status==='approved').length/Math.max(approvals.filter(a=>a.status!=='pending').length,1))*100)}%</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[{key:'pending',label:`⏳ 待审批 (${pending.length})`},{key:'history',label:'📋 已处理'}]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        <div style={{display:'grid',gap:10}}>
          {(tab==='pending'?pending:approvals.filter(a=>a.status!=='pending')).map(a => (
            <div key={a.id} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:a.status==='pending'?'1px solid rgba(245,158,11,0.2)':'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div><span style={{fontWeight:700,fontSize:15}}>{a.title}</span>
                  <span style={{color:'#94a3b8',marginLeft:8,fontSize:12}}>{AT[a.type]} · {a.urgency==='high'?'🚨紧急':a.urgency==='medium'?'📌普通':'🔽低优'}</span></div>
                <StatusBadge label={AS[a.status].l} variant={AS[a.status].v} size="sm" dot />
              </div>
              <div style={{display:'grid',gap:10,gridTemplateColumns:'repeat(4,1fr)',marginBottom:6}}>
                <StatCard label="申请人" value={a.applicant} helper={a.dept} />
                <StatCard label="金额" value={a.amount>0?fm(a.amount):'—'} helper="" />
                <StatCard label="提交" value={a.createdDate} helper={`截止: ${a.dueDate}`} />
                <StatCard label="审批人" value={a.approver||'待指派'} helper="" />
              </div>
              <div style={{fontSize:12,color:'#94a3b8'}}>{a.description}</div>
              {a.comment && <div style={{marginTop:6,fontSize:12,color:'#86efac',padding:'6px 10px',borderRadius:6,background:'rgba(34,197,94,0.08)'}}>💬 {a.comment}</div>}

              {a.status==='pending' && <div style={{display:'flex',gap:8,marginTop:12}}>
                <button style={btnStyle('#22c55e','#86efac')}>✅ 批准</button>
                <button style={btnStyle('#ef4444','#fca5a5')}>❌ 驳回</button>
              </div>}
            </div>
          ))}
        </div>
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:8,padding:'8px 16px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:13,fontWeight:600});
