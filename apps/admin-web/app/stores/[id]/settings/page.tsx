'use client';

/**
 * 门店设置 - Store Settings
 * 角色: 👔店长 / 🔧安监
 * 功能: 基本信息编辑、营业时间、支付设置、通知设置、安全设置
 */

import { useState, useMemo, useCallback, use } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

interface StoreSettings { name:string; code:string; market:string; address:string; phone:string; email:string; openTime:string; closeTime:string; timezone:string; currency:string; taxRate:number; autoClose:boolean; printerThreshold:number; receiptFooter:string; }
interface PaymentSetting { id:string; method:string; enabled:boolean; fee:number; priority:number; minAmount:number; maxAmount:number; note:string; }
interface NotificationSetting { id:string; event:string; sms:boolean; app:boolean; wechat:boolean; email:boolean; recipients:string[]; }

const PAYMENT_METHODS: PaymentSetting[] = [
  { id:'P1', method:'现金', enabled:true, fee:0, priority:1, minAmount:0, maxAmount:99999, note:'' },
  { id:'P2', method:'微信支付', enabled:true, fee:0.38, priority:2, minAmount:1, maxAmount:50000, note:'0.38%手续费' },
  { id:'P3', method:'支付宝', enabled:true, fee:0.38, priority:3, minAmount:1, maxAmount:50000, note:'0.38%手续费' },
  { id:'P4', method:'银联卡', enabled:true, fee:0.6, priority:4, minAmount:10, maxAmount:99999, note:'借记卡0.6%' },
  { id:'P5', method:'会员卡', enabled:true, fee:0, priority:0, minAmount:0, maxAmount:99999, note:'免手续费' },
  { id:'P6', method:'数字人民币', enabled:false, fee:0, priority:5, minAmount:1, maxAmount:20000, note:'待开通' },
];

const NOTIFICATIONS: NotificationSetting[] = [
  { id:'N1', event:'设备故障', sms:true, app:true, wechat:true, email:false, recipients:['杨磊(技术)','店长'] },
  { id:'N2', event:'低库存预警', sms:false, app:true, wechat:true, email:false, recipients:['刘洋(库存)'] },
  { id:'N3', event:'日营收异常', sms:true, app:true, wechat:false, email:true, recipients:['店长','李娜(财务)'] },
  { id:'N4', event:'会员大额充值', sms:false, app:false, wechat:true, email:false, recipients:['店长'] },
  { id:'N5', event:'安全告警', sms:true, app:true, wechat:true, email:true, recipients:['赵敏(安全)','店长','运营中心'] },
  { id:'N6', event:'交接班提醒', sms:false, app:true, wechat:false, email:false, recipients:['值班经理'] },
  { id:'N7', event:'巡检到期', sms:true, app:true, wechat:false, email:false, recipients:['杨磊(技术)'] },
];

const defaultSettings: StoreSettings = {
  name:'朝阳大悦城旗舰店', code:'STORE-001', market:'cn-mainland',
  address:'北京市朝阳区朝阳北路101号', phone:'010-8888-1111', email:'chaoyang@m5.com',
  openTime:'08:00', closeTime:'02:00', timezone:'Asia/Shanghai', currency:'CNY',
  taxRate:6, autoClose:false, printerThreshold:0, receiptFooter:'感谢您的光临！',
};

export default function StoreSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab,setTab]=useState<'info'|'payment'|'notification'>('info');
  const [settings,setSettings]=useState<StoreSettings>(defaultSettings);
  const [payments,setPayments]=useState(PAYMENT_METHODS);
  const [notifications,setNotifications]=useState(NOTIFICATIONS);
  const [saved,setSaved]=useState(false);
  const [editing,setEditing]=useState(false);

  const handleSave=useCallback(()=>{setSaved(true);setEditing(false);setTimeout(()=>setSaved(false),2000);},[]);

  return (
    <main style={{maxWidth:960,margin:'0 auto',padding:32}}>
      <PageShell title="⚙️ 门店设置" subtitle={`${settings.code} · ${settings.market}`}>
        <div style={{marginBottom:16}}><Tabs items={[
          {key:'info',label:'🏪 基本信息'},{key:'payment',label:'💳 支付设置'},{key:'notification',label:'🔔 通知设置'},
        ]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {tab==='info' && <section style={card}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
            <h3 style={{margin:0,fontSize:18,fontWeight:700}}>门店信息</h3>
            <button onClick={()=>setEditing(!editing)} style={btnStyle(editing?'#ef4444':'#3b82f6',editing?'#fca5a5':'#93c5fd')}>{editing?'取消':'编辑'}</button>
          </div>
          {saved && <div style={{padding:12,borderRadius:8,background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',color:'#86efac',marginBottom:16,fontSize:14}}>✅ 设置已保存</div>}
          <div style={{display:'grid',gap:14,gridTemplateColumns:'1fr 1fr'}}>
            {[{label:'门店名称',key:'name',v:settings.name},{label:'门店编码',key:'code',v:settings.code},{label:'市场',key:'market',v:settings.market},{label:'地址',key:'address',v:settings.address,full:true},{label:'电话',key:'phone',v:settings.phone},{label:'邮箱',key:'email',v:settings.email},{label:'营业开始',key:'openTime',v:settings.openTime},{label:'营业结束',key:'closeTime',v:settings.closeTime},{label:'时区',key:'timezone',v:settings.timezone},{label:'货币',key:'currency',v:settings.currency},{label:'税率(%)',key:'taxRate',v:String(settings.taxRate)},{label:'自动结账',key:'autoClose',v:settings.autoClose?'是':'否'}].map(f=>(
              <div key={f.key} style={f.full?{gridColumn:'1/-1'}:{}}>
                <div style={{fontSize:12,color:'#94a3b8',marginBottom:4}}>{f.label}</div>
                {editing ? <input value={f.v} onChange={e=>setSettings(s=>({...s,[f.key]:e.target.value}))} style={input} /> : <div style={{color:'#e2e8f0',padding:'10px 0',fontSize:14}}>{f.v}</div>}
              </div>
            ))}
          </div>
          {editing && <button onClick={handleSave} style={{...btnStyle('#22c55e','#86efac'),marginTop:20,padding:'12px 24px',fontSize:15}}>💾 保存设置</button>}
        </section>}

        {tab==='payment' && <section style={card}>
          <h3 style={{margin:0,marginBottom:20,fontSize:18,fontWeight:700}}>支付方式管理</h3>
          <div style={{display:'grid',gap:10}}>
            {payments.map(p => (
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)',border:p.enabled?'1px solid rgba(148,163,184,0.1)':'1px solid rgba(239,68,68,0.15)'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:15}}>{p.method}</div>
                  <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>费率{p.fee}% · 限额{p.minAmount}~{p.maxAmount} · {p.note}</div>
                </div>
                <StatusBadge label={p.enabled?'已启用':'已停用'} variant={p.enabled?'success':'danger'} size="sm" dot />
              </div>
            ))}
          </div>
        </section>}

        {tab==='notification' && <section style={card}>
          <h3 style={{margin:0,marginBottom:20,fontSize:18,fontWeight:700}}>通知设置</h3>
          <div style={{display:'grid',gap:8}}>
            {notifications.map(n=>(
              <div key={n.id} style={{padding:'14px 18px',borderRadius:12,background:'rgba(15,23,42,0.3)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontWeight:600,fontSize:14}}>{n.event}</span>
                  <div style={{display:'flex',gap:6}}>
                    {([['sms','短信'],['app','APP'],['wechat','微信'],['email','邮件']] as const).map(([k,l])=><span key={k} style={{padding:'2px 8px',borderRadius:4,fontSize:11,background:n[k]?'rgba(34,197,94,0.12)':'rgba(107,114,128,0.12)',color:n[k]?'#86efac':'#6b7280'}}>{l}</span>)}
                  </div>
                </div>
                <div style={{fontSize:12,color:'#94a3b8'}}>接收人: {n.recipients.join(' · ')}</div>
              </div>
            ))}
          </div>
        </section>}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:24,background:'rgba(15,23,42,0.35)',border:'1px solid rgba(148,163,184,0.18)'};
const input: React.CSSProperties={width:'100%',borderRadius:8,padding:'8px 12px',border:'1px solid rgba(148,163,184,0.2)',background:'rgba(15,23,42,0.4)',color:'#f1f5f9',fontSize:14,outline:'none',boxSizing:'border-box'};
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:10,padding:'10px 18px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:14,fontWeight:600});
