// ⚙️ 设置中心 · 门店基础参数配置
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Switch, Input, Modal, message } from '@m5/ui';

interface ConfigItem { id:string; label:string; key:string; type:'switch'|'text'|'select'|'number'; value:any; options?:{value:string,label:string}[]; desc:string; }

const CATEGORIES = [
  {
    name:'营业设置', icon:'🕐', items:[
      { id:'CFG-01', label:'营业时间', key:'businessHours', type:'text', value:'10:00-22:00', desc:'门店每日运营时段' },
      { id:'CFG-02', label:'周末营业', key:'weekendOpen', type:'switch', value:true, desc:'周六日是否正常营业' },
      { id:'CFG-03', label:'最大接待人数', key:'maxCapacity', type:'number', value:200, desc:'同时最大在店人数' },
      { id:'CFG-04', label:'节假日模式', key:'holidayMode', type:'switch', value:false, desc:'节假日自动调整营业时间' },
    ],
  },
  {
    name:'收银设置', icon:'💳', items:[
      { id:'CFG-05', label:'默认支付方式', key:'defaultPayment', type:'select', value:'wechat', options:[{value:'wechat',label:'微信支付'},{value:'alipay',label:'支付宝'},{value:'cash',label:'现金'}], desc:'收银台默认选中' },
      { id:'CFG-06', label:'小票打印', key:'receiptPrint', type:'switch', value:true, desc:'交易完成后自动打印小票' },
      { id:'CFG-07', label:'找零模式', key:'changeRounding', type:'select', value:'round', options:[{value:'round',label:'四舍五入'},{value:'keep',label:'保留分位'}], desc:'现金找零规则' },
    ],
  },
  {
    name:'会员设置', icon:'👥', items:[
      { id:'CFG-08', label:'自动开卡', key:'autoMemberCard', type:'switch', value:true, desc:'消费满条件自动办理会员' },
      { id:'CFG-09', label:'积分有效期', key:'pointsExpiry', type:'select', value:'1year', options:[{value:'never',label:'永久'},{value:'1year',label:'一年'},{value:'halfyear',label:'半年'}], desc:'会员积分过期规则' },
      { id:'CFG-10', label:'新会员优惠', key:'newMemberBonus', type:'text', value:'首充满100送50', desc:'新注册会员自动发放优惠' },
    ],
  },
  { name:'通知设置', icon:'🔔', items:[{id:'CFG-11',label:'到店提醒',key:'arriveNotify',type:'switch',value:true,desc:'预订会员到店后通知店长'},{id:'CFG-12',label:'库存预警',key:'stockAlert',type:'switch',value:true,desc:'低库存时推送通知'},{id:'CFG-13',label:'巡检提醒',key:'inspectRemind',type:'switch',value:true,desc:'每日巡检未完成时推送提醒'}]},
];

export default function SettingsPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16,alignItems:'stretch'}}>
    <h2 style={{color:'#f8fafc',margin:0}}>⚙️ 设置中心</h2>
    {CATEGORIES.map(cat => (
      <Card key={cat.name}><Space direction="vertical" style={{width:'100%'}}>
        <h3 style={{color:'#f8fafc',margin:'0 0 12px',fontSize:16}}>{cat.icon} {cat.name}</h3>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:'1px solid rgba(148,163,184,0.15)'}}>
            <th style={{textAlign:'left',padding:'8px 12px',color:'#94a3b8',fontSize:12,fontWeight:600,textTransform:'uppercase',width:'180px'}}>配置项</th>
            <th style={{textAlign:'left',padding:'8px 12px',color:'#94a3b8',fontSize:12,fontWeight:600,textTransform:'uppercase'}}>当前值</th>
            <th style={{textAlign:'left',padding:'8px 12px',color:'#94a3b8',fontSize:12,fontWeight:600,textTransform:'uppercase'}}>说明</th>
            <th style={{padding:'8px 12px',width:'80px'}}></th>
          </tr></thead>
          <tbody>{cat.items.map((item:ConfigItem) => (
            <tr key={item.id} style={{borderBottom:'1px solid rgba(148,163,184,0.08)'}}>
              <td style={{padding:'10px 12px'}}><div style={{color:'#f8fafc',fontSize:14,fontWeight:500}}>{item.label}</div></td>
              <td style={{padding:'10px 12px'}}>
                {item.type === 'switch' ? <Switch checked={item.value} onChange={()=>{}}/> :
                 item.type === 'select' ? <Select value={item.value} onChange={()=>{}} style={{width:140}} options={item.options||[]}/> :
                 <span style={{color:'#e2e8f0'}}>{String(item.value)}</span>}
              </td>
              <td style={{padding:'10px 12px',color:'#94a3b8',fontSize:13}}>{item.desc}</td>
              <td style={{padding:'10px 12px',textAlign:'right'}}><Button size="small">编辑</Button></td>
            </tr>
          ))}</tbody>
        </table>
      </Space></Card>
    ))}
    <Space style={{justifyContent:'flex-end'}}>
      <Button>恢复默认</Button>
      <Button type="primary">保存全部</Button>
    </Space>
  </Space></PageShell>);
}
