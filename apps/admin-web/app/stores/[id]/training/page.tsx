'use client';

/**
 * 门店培训管理 - Store Training Management
 * 角色: 📚培训师 / 👥HR
 * 功能: 培训课程、学习记录、考核管理、培训统计
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

type CourseStatus = 'active'|'draft'|'archived';
type CourseCategory = 'service'|'device'|'safety'|'management'|'sales'|'compliance';
type EnrollStatus = 'completed'|'in_progress'|'pending'|'failed';

interface Course { id:string; name:string; category:CourseCategory; status:CourseStatus; instructor:string; duration:number; enrolled:number; completed:number; passRate:number; startDate:string; endDate:string; description:string; credits:number; examRequired:boolean; }
interface Enrollment { id:string; employee:string; dept:string; course:string; enrollDate?:string; completionDate?:string; status:EnrollStatus; score:number|null; attempts:number; certificateIssued:boolean; }

const CC: Record<CourseCategory,string> = { service:'服务培训', device:'设备操作', safety:'安全培训', management:'管理培训', sales:'销售技巧', compliance:'合规培训' };
const CS: Record<CourseStatus,{l:string;v:'success'|'neutral'|'warning'}>={active:{l:'进行中',v:'success'},draft:{l:'草稿',v:'warning'},archived:{l:'已归档',v:'neutral'}};
const ES: Record<EnrollStatus,{l:string;v:'success'|'warning'|'neutral'|'danger'}>={completed:{l:'已完成',v:'success'},in_progress:{l:'进行中',v:'warning'},pending:{l:'待开始',v:'neutral'},failed:{l:'未通过',v:'danger'}};
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const courses: Course[] = [
  { id:'C1', name:'新人入职培训', category:'service', status:'active', instructor:'周讲', duration:4, enrolled:45, completed:38, passRate:95, startDate:'2026-07-01', endDate:'2026-08-31', description:'新员工入职基础知识与服务规范', credits:2, examRequired:true },
  { id:'C2', name:'收银系统操作', category:'device', status:'active', instructor:'钱教练', duration:3, enrolled:32, completed:28, passRate:92, startDate:'2026-07-05', endDate:'2026-08-15', description:'收银终端操作与异常处理', credits:1.5, examRequired:true },
  { id:'C3', name:'游戏机维护进阶', category:'device', status:'active', instructor:'孙主管', duration:8, enrolled:18, completed:15, passRate:88, startDate:'2026-07-10', endDate:'2026-09-10', description:'街机、VR、模拟器故障诊断与维修', credits:4, examRequired:true },
  { id:'C4', name:'消防安全培训', category:'safety', status:'active', instructor:'消防教官', duration:3, enrolled:60, completed:55, passRate:98, startDate:'2026-07-01', endDate:'2026-07-15', description:'消防器材使用、逃生演练', credits:1, examRequired:true },
  { id:'C5', name:'客户服务技巧', category:'service', status:'active', instructor:'李经理', duration:6, enrolled:40, completed:30, passRate:85, startDate:'2026-07-08', endDate:'2026-09-01', description:'投诉处理、沟通技巧、满意度提升', credits:3, examRequired:false },
  { id:'C6', name:'门店管理实战', category:'management', status:'draft', instructor:'', duration:12, enrolled:0, completed:0, passRate:0, startDate:'2026-09-01', endDate:'2026-11-30', description:'门店运营管理全流程（待启动）', credits:6, examRequired:true },
  { id:'C7', name:'反欺诈培训', category:'compliance', status:'active', instructor:'合规部', duration:2, enrolled:48, completed:42, passRate:96, startDate:'2026-07-05', endDate:'2026-08-30', description:'欺诈识别与防范', credits:1, examRequired:true },
  { id:'C8', name:'销售话术进阶', category:'sales', status:'active', instructor:'销售总监', duration:4, enrolled:28, completed:20, passRate:82, startDate:'2026-07-15', endDate:'2026-09-15', description:'充值转化、会员推荐、套餐销售', credits:2, examRequired:false },
];

const enrollments: Enrollment[] = Array.from({length:30}, (_,i) => {
  const statuses: EnrollStatus[] = ['completed','completed','in_progress','pending','failed'];
  const c = courses[Math.floor(Math.random()*courses.length)]!;
  return {
    id:`ENR-${i+1}`,
    employee:['张伟','李娜','王强','赵敏','刘洋','陈静','杨磊','黄丽','周杰','吴芳'][Math.floor(Math.random()*10)]!,
    dept:['运营部','收银组','导玩组','技术部','后勤部'][Math.floor(Math.random()*5)]!,
    course:c.name, enrollDate:new Date(Date.now()-Math.floor(Math.random()*30)*86400000).toISOString().split('T')[0],
    completionDate:Math.random()>0.4?new Date(Date.now()-Math.floor(Math.random()*15)*86400000).toISOString().split('T')[0]:'',
    status:statuses[Math.floor(Math.random()*statuses.length)]!,
    score:Math.random()>0.3?60+Math.floor(Math.random()*40):null,
    attempts:1+Math.floor(Math.random()*2), certificateIssued:Math.random()>0.5,
  };
});

export default function TrainingPage() {
  const [tab,setTab]=useState<'courses'|'enrollments'>('courses');
  const stats=useMemo(()=>({
    total:courses.length,active:courses.filter(c=>c.status==='active').length,
    enrollments:enrollments.length,completed:enrollments.filter(e=>e.status==='completed').length,
    avgPassRate:Math.round(courses.filter(c=>c.passRate>0).reduce((s,c)=>s+c.passRate,0)/Math.max(courses.filter(c=>c.passRate>0).length,1)),
    credits:enrollments.reduce((s,e)=>s+(e.status==='completed'?2:0),0),
  }),[courses]);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="📚 培训管理" subtitle="课程管理·学习记录·考核统计">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>课程总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>进行中: {stats.active}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总学习人次</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{stats.enrollments}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>已完成: {stats.completed}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>平均通过率</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:stats.avgPassRate>90?'#22c55e':'#eab308'}}>{stats.avgPassRate}%</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>考核通过比例</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总学分</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#8b5cf6'}}>{courses.reduce((s,c)=>s+c.credits,0)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>可获取</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[{key:'courses',label:`📋 课程 (${courses.length})`},{key:'enrollments',label:`👥 学员 (${enrollments.length})`}]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='courses' && <div style={{display:'grid',gap:10}}>
          {courses.map(c => (
            <div key={c.id} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div><span style={{fontWeight:700,fontSize:15}}>{c.name}</span><span style={{color:'#94a3b8',marginLeft:8,fontSize:12}}>{CC[c.category]} · {c.instructor||'待指派'}</span></div>
                <StatusBadge label={CS[c.status].l} variant={CS[c.status].v} size="sm" dot />
              </div>
              <div style={{display:'grid',gap:10,gridTemplateColumns:'repeat(4,1fr)',marginBottom:6}}>
                <StatCard label="学时" value={`${c.duration}h`} helper={`${c.credits}学分`} />
                <StatCard label="报名/完成" value={`${c.enrolled}/${c.completed}`} />
                <StatCard label="通过率" value={c.passRate>0?`${c.passRate}%`:'—'} helper={c.passRate>0?'':''} />
                <StatCard label="考试" value={c.examRequired?'需要':'无须'} />
              </div>
              <div style={{fontSize:12,color:'#94a3b8'}}>{c.description} · {c.startDate}~{c.endDate}</div>
            </div>
          ))}
        </div>}

        {tab==='enrollments' && <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><th style={th}>员工</th><th style={th}>部门</th><th style={th}>课程</th><th style={th}>报名</th><th style={th}>完成</th><th style={th}>成绩</th><th style={th}>状态</th><th style={th}>证书</th></tr></thead>
          <tbody>{enrollments.slice(0,20).map(e => (
            <tr key={e.id}>
              <td style={td}>{e.employee}</td>
              <td style={td}>{e.dept}</td>
              <td style={td}>{e.course}</td>
              <td style={td}>{e.enrollDate}</td>
              <td style={td}>{e.completionDate||'—'}</td>
              <td style={{...td,color:e.score&&e.score>=80?'#22c55e':e.score&&e.score>=60?'#eab308':'#ef4444',fontWeight:600}}>{e.score??'—'}</td>
              <td style={td}><StatusBadge label={ES[e.status].l} variant={ES[e.status].v} size="sm" /></td>
              <td style={td}>{e.certificateIssued?'✅':'—'}</td>
            </tr>
          ))}</tbody>
        </table>}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const th: React.CSSProperties={textAlign:'left',padding:'10px 14px',color:'#94a3b8',fontSize:12,borderBottom:'1px solid rgba(148,163,184,0.18)'};
const td: React.CSSProperties={padding:'10px 14px',color:'#e2e8f0',fontSize:13,borderBottom:'1px solid rgba(148,163,184,0.1)'};
