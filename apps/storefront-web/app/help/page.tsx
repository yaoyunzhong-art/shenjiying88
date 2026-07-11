'use client';

/**
 * 帮助中心 - Help Center
 * 角色: 🎮导玩员 / 👔店长
 * 功能: 常见问题、操作指南、系统帮助、提交工单
 */

import { useState } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput } from '@m5/ui';

interface FaqItem { id: string; question: string; answer: string; category: string; tags: string[]; }
interface GuideItem { id: string; title: string; description: string; category: string; steps: number; estimatedTime: string; }

const faqs: FaqItem[] = [
  { id:'F1', question:'如何创建新会员？', answer:'在会员管理页面点击"新增会员"，填写基本信息（姓名、电话等），选择会员等级后保存即可。支持手动录入和批量导入两种方式。', category:'会员管理', tags:['会员','新增','注册'] },
  { id:'F2', question:'如何处理退款？', answer:'在订单管理中找到对应订单，点击"退款"按钮。系统支持全额退款和部分退款，退款金额将原路返回。需要店长或管理员审批。', category:'收银', tags:['退款','订单','收银'] },
  { id:'F3', question:'如何查看设备状态？', answer:'进入门店设备管理页面，可以看到所有设备的实时状态（在线/离线/故障）。点击设备名称查看详情，包括运行时长、温度、维护记录等。', category:'设备', tags:['设备','监控','维护'] },
  { id:'F4', question:'如何导出报表？', answer:'在报表页面选择需要的数据维度和时间范围，点击"导出"按钮，支持PDF和Excel格式。导出的报表会自动发送到你的邮箱。', category:'报表', tags:['报表','导出','分析'] },
  { id:'F5', question:'如何调整排班？', answer:'在员工管理页面的排班表中，可以直接拖拽员工到对应时段。需要先创建排班规则，系统会自动检测冲突（如两个人同一时段同一岗位）。', category:'人力资源', tags:['排班','员工','HR'] },
  { id:'F6', question:'如何进行库存盘点？', answer:'进入库存管理→盘点管理，点击"新建盘点"。选择盘点区域后，系统会列出该区域所有商品。实盘数量与系统数量不符时会自动记录差异。', category:'库存', tags:['盘点','库存','差异'] },
  { id:'F7', question:'如何创建促销活动？', answer:'在营销管理→活动管理中点击"创建活动"，选择活动类型（折扣/套餐/赠品/积分/秒杀），设置活动时间和预算后提交审批。', category:'营销', tags:['营销','活动','促销'] },
  { id:'F8', question:'如何处理设备报修？', answer:'在设备管理页面点击设备名称进入详情，点击"创建维护工单"。填写故障描述、紧急程度后提交，系统会自动通知技术员。', category:'设备', tags:['维修','报修','设备'] },
  { id:'F9', question:'怎么查看营业数据？', answer:'在门店数据分析页面可以看到实时运营数据，包括日营收、客流、转化率等。支持按日/周/月查看趋势图。', category:'运营', tags:['数据','分析','运营'] },
  { id:'F10', question:'如何修改门店信息？', answer:'在门店设置页面可以修改基本信息（名称、地址、电话等）、营业时间、支付方式配置。修改后需要保存才会生效。', category:'设置', tags:['门店','设置','配置'] },
];

const guides: GuideItem[] = [
  { id:'G1', title:'新员工入职指南', description:'如何为员工创建账户配置权限', category:'人力资源', steps:5, estimatedTime:'10分钟' },
  { id:'G2', title:'日结束对账流程', description:'每日营业结束后对账操作步骤', category:'收银', steps:6, estimatedTime:'15分钟' },
  { id:'G3', title:'设备巡检标准', description:'每日设备巡检的标准操作流程', category:'设备', steps:8, estimatedTime:'20分钟' },
  { id:'G4', title:'会员投诉处理', description:'处理客户投诉的标准流程与方法', category:'客服', steps:5, estimatedTime:'10分钟' },
  { id:'G5', title:'库存盘点操作', description:'月度库存盘点标准操作流程', category:'库存', steps:7, estimatedTime:'30分钟' },
  { id:'G6', title:'营销活动审批', description:'促销活动从创建到上线的审批流程', category:'营销', steps:4, estimatedTime:'15分钟' },
  { id:'G7', title:'紧急事件处理', description:'火灾/盗窃等紧急事件的应对流程', category:'安全', steps:10, estimatedTime:'—' },
];

export default function HelpCenterPage() {
  const [search,setSearch]=useState('');
  const [tab,setTab]=useState<'faq'|'guides'|'support'>('faq');
  const filteredFaqs = faqs.filter(f=>f.question.includes(search)||f.answer.includes(search)||f.tags.some(t=>t.includes(search)));
  const filteredGuides = guides.filter(g=>g.title.includes(search)||g.description.includes(search));
  const [expanded,setExpanded]=useState<string>('');

  return (
    <main style={{maxWidth:960,margin:'0 auto',padding:32}}>
      <PageShell title="📚 帮助中心" subtitle="常见问题 · 操作指南 · 技术支持">
        <div style={{marginBottom:20}}>
          <SearchFilterInput value={search} onChange={setSearch} placeholder="搜索问题/指南/关键词..." />
        </div>
        <div style={{marginBottom:16}}><Tabs items={[
          {key:'faq',label:`❓ 常见问题 (${faqs.length})`},
          {key:'guides',label:`📖 操作指南 (${guides.length})`},
          {key:'support',label:'🎫 提交工单'},
        ]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='faq' && <div style={{display:'grid',gap:8}}>
          {(search?filteredFaqs:faqs).map(f => (
            <div key={f.id} style={{borderRadius:12,background:'rgba(15,23,42,0.3)',border:'1px solid rgba(148,163,184,0.1)',overflow:'hidden'}}>
              <div onClick={()=>setExpanded(expanded===f.id?'':f.id)} style={{display:'flex',justifyContent:'space-between',padding:'14px 18px',cursor:'pointer'}}>
                <span style={{fontWeight:600,fontSize:14}}>❓ {f.question}</span>
                <span style={{color:'#94a3b8'}}>{expanded===f.id?'▲':'▼'}</span>
              </div>
              {expanded===f.id && <div style={{padding:'0 18px 14px'}}>
                <div style={{fontSize:13,color:'#cbd5e1',lineHeight:1.7,marginBottom:8}}>{f.answer}</div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {f.tags.map(t=><span key={t} style={{padding:'2px 8px',borderRadius:4,background:'rgba(59,130,246,0.1)',color:'#93c5fd',fontSize:11}}>{t}</span>)}
                </div>
              </div>}
            </div>
          ))}
        </div>}

        {tab==='guides' && <div style={{display:'grid',gap:10}}>
          {(search?filteredGuides:guides).map(g => (
            <div key={g.id} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:'1px solid rgba(148,163,184,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><div style={{fontWeight:600,fontSize:14}}>📖 {g.title}</div><div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{g.description}</div></div>
                <div style={{textAlign:'right'}}>
                  <StatusBadge label={g.category} variant='info' size="sm" />
                  <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>{g.steps}步 · {g.estimatedTime}</div>
                </div>
              </div>
            </div>
          ))}
        </div>}

        {tab==='support' && <section style={{borderRadius:16,padding:24,background:'rgba(15,23,42,0.35)',border:'1px solid rgba(148,163,184,0.18)'}}>
          <h3 style={{margin:'0 0 16px',fontSize:18,fontWeight:700}}>提交技术工单</h3>
          <div style={{display:'grid',gap:12}}>
            <div><div style={{fontSize:12,color:'#94a3b8',marginBottom:4}}>标题</div><input placeholder="简要描述问题" style={input} /></div>
            <div><div style={{fontSize:12,color:'#94a3b8',marginBottom:4}}>分类</div><select style={{...input,appearance:'none'}}><option>系统故障</option><option>功能问题</option><option>数据问题</option><option>权限问题</option><option>建议优化</option></select></div>
            <div><div style={{fontSize:12,color:'#94a3b8',marginBottom:4}}>详细描述</div><textarea rows={5} placeholder="详细描述问题或建议..." style={{...input,resize:'vertical',minHeight:100}} /></div>
            <div><div style={{fontSize:12,color:'#94a3b8',marginBottom:4}}>截图（可选）</div><div style={{padding:'20px',borderRadius:8,border:'1px dashed rgba(148,163,184,0.2)',textAlign:'center',color:'#94a3b8',fontSize:13,cursor:'pointer'}}>📎 点击上传附件</div></div>
            <button style={btnStyle('#3b82f6','#93c5fd','14px','12px 24px')}>📤 提交工单</button>
          </div>
        </section>}
      </PageShell>
    </main>
  );
}

const input: React.CSSProperties={width:'100%',borderRadius:8,padding:'10px 14px',border:'1px solid rgba(148,163,184,0.2)',background:'rgba(15,23,42,0.4)',color:'#f1f5f9',fontSize:14,outline:'none',boxSizing:'border-box'};
const btnStyle=(bg:string,color:string,fs:string,pad:string):React.CSSProperties=>({borderRadius:10,padding:pad,background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:fs,fontWeight:600,width:'fit-content'});
