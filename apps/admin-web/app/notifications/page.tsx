'use client';

/**
 * 通知公告 - Notifications & Announcements
 * 角色: 👑超级管理员 / 👔店长
 * 功能: 系统通知、公告发布、站内信
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

type NotifType = 'system'|'maintenance'|'update'|'alert'|'info';
type NotifPriority = 'urgent'|'high'|'normal'|'low';

interface Notification { id:string; title:string; content:string; type:NotifType; priority:NotifPriority; date:string; read:boolean; sender:string; target:string; actionUrl:string; }

const NT: Record<NotifType,{l:string;v:'success'|'warning'|'danger'|'neutral'|'info'}> = {
  system:{l:'系统',v:'info'}, maintenance:{l:'维护',v:'warning'}, update:{l:'更新',v:'success'}, alert:{l:'告警',v:'danger'}, info:{l:'通知',v:'neutral'} };
const NP: Record<NotifPriority,{l:string;v:'danger'|'warning'|'neutral'}> = { urgent:{l:'紧急',v:'danger'}, high:{l:'重要',v:'warning'}, normal:{l:'普通',v:'neutral'}, low:{l:'低',v:'neutral'} };

const notifications: Notification[] = [
  { id:'N1', title:'系统将于今晚3:00-5:00停机维护', content:'为提升系统性能，计划于今晚凌晨进行数据库升级，届时系统暂停访问。', type:'maintenance', priority:'urgent', date:'2026-07-11 14:00', read:false, sender:'系统管理员', target:'全员', actionUrl:'' },
  { id:'N2', title:'新版本v3.8.0已发布', content:'新版本包括：会员管理优化、报表导出增强、修复已知bug。请及时更新。', type:'update', priority:'high', date:'2026-07-10 10:00', read:false, sender:'产品部', target:'全员', actionUrl:'/updates' },
  { id:'N3', title:'设备巡检提醒', content:'本周设备巡检（周检）尚未完成，请各店安排人员完成巡检。', type:'system', priority:'high', date:'2026-07-10 09:00', read:true, sender:'运营系统', target:'各门店', actionUrl:'' },
  { id:'N4', title:'夏季营业时间调整', content:'即日起，门店营业时间调整为08:00-02:00，请各岗位做好排班安排。', type:'info', priority:'normal', date:'2026-07-09 16:00', read:false, sender:'运营部', target:'全员', actionUrl:'' },
  { id:'N5', title:'7月促销活动审批通知', content:'"暑期特惠季"活动已通过审批，请各门店在7月12日前完成活动物料准备。', type:'info', priority:'normal', date:'2026-07-09 14:00', read:true, sender:'市场部', target:'各门店', actionUrl:'' },
  { id:'N6', title:'朝阳大悦城店设备异常告警', content:'娃娃机(大)连续3次出现抓取故障，请安排技术员排查。', type:'alert', priority:'urgent', date:'2026-07-08 18:30', read:false, sender:'设备监控', target:'朝阳店', actionUrl:'' },
  { id:'N7', title:'库存盘点即将截止', content:'月度库存盘点截止日期为7月15日，尚未完成的门店请尽快安排。', type:'system', priority:'high', date:'2026-07-08 10:00', read:true, sender:'库存系统', target:'各门店', actionUrl:'' },
  { id:'N8', title:'消防安全培训通知', content:'消防培训定于7月15日（周三）14:00在培训室举行，请各门店派代表参加。', type:'info', priority:'normal', date:'2026-07-07 15:00', read:false, sender:'安全部', target:'各门店', actionUrl:'' },
  { id:'N9', title:'新员工入职培训报名', content:'7月份新员工入职培训开始报名，截止日期7月20日。', type:'info', priority:'low', date:'2026-07-07 11:00', read:true, sender:'HR', target:'全员', actionUrl:'' },
  { id:'N10', title:'会员日系统维护', content:'因会员日活动报名人数超出预期，临时增加服务器资源，系统已恢复正常。', type:'maintenance', priority:'normal', date:'2026-07-06 20:00', read:true, sender:'技术部', target:'全员', actionUrl:'' },
];

export default function NotificationsPage() {
  const [tab,setTab]=useState<'all'|'unread'|'important'>('all');
  const unread = notifications.filter(n=>!n.read);
  const important = notifications.filter(n=>n.priority==='urgent'||n.priority==='high');
  const displayList = tab==='unread'?unread:tab==='important'?important:notifications;

  return (
    <main style={{maxWidth:960,margin:'0 auto',padding:32}}>
      <PageShell title="🔔 通知公告" subtitle={`${notifications.length}条通知 · ${unread.length}条未读`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>通知总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{notifications.length}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>未读</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{unread.length}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>紧急</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{notifications.filter(n=>n.priority==='urgent').length}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>系统/更新</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{notifications.filter(n=>n.type==='system'||n.type==='update').length}</div></div>
        </div>

        <div style={{marginBottom:16}}><Tabs items={[
          {key:'all',label:'📋 全部',count:notifications.length},
          {key:'unread',label:'🔴 未读',count:unread.length},
          {key:'important',label:'🚨 重要',count:important.length},
        ]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        <div style={{display:'grid',gap:8}}>
          {displayList.map(n => (
            <div key={n.id} style={{
              padding:'14px 18px',borderRadius:12,
              background:!n.read?'rgba(59,130,246,0.06)':'rgba(15,23,42,0.3)',
              border:!n.read?'1px solid rgba(59,130,246,0.2)':'1px solid rgba(148,163,184,0.1)',
            }}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  {!n.read && <div style={{width:8,height:8,borderRadius:4,background:'#3b82f6'}} />}
                  <span style={{fontWeight:!n.read?700:600,fontSize:14}}>{n.title}</span>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <StatusBadge label={NT[n.type].l} variant={NT[n.type].v} size="sm" />
                  <StatusBadge label={NP[n.priority].l} variant={NP[n.priority].v} size="sm" />
                </div>
              </div>
              <div style={{fontSize:13,color:'#cbd5e1',lineHeight:1.6,marginBottom:6}}>{n.content}</div>
              <div style={{fontSize:11,color:'#94a3b8',display:'flex',gap:12}}>
                <span>{n.date}</span><span>发送: {n.sender}</span><span>范围: {n.target}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:10,marginTop:16}}>
          <button style={btnStyle('#3b82f6','#93c5fd')}>📝 发布通知</button>
          <button style={btnStyle('#22c55e','#86efac')}>✅ 全部标记已读</button>
        </div>
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:10,padding:'10px 18px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:14,fontWeight:600});
