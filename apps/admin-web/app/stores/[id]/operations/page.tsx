// ⚙️ 运营管理 · 日常运营参数配置
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Tag, Button, Space, InputNumber, Switch, message } from '@m5/ui';

interface Setting { key: string; label: string; type: string; value: any; desc: string; }

const SETTINGS: Setting[] = [
  { key: 'open_time', label: '营业开始时间', type: 'time', value: '10:00', desc: '门店每日营业开始时间' },
  { key: 'close_time', label: '营业结束时间', type: 'time', value: '22:00', desc: '门店每日营业结束时间' },
  { key: 'max_capacity', label: '最大容纳人数', type: 'number', value: 200, desc: '门店同时容纳最大客流量' },
  { key: 'auto_close', label: '自动关店', type: 'switch', value: true, desc: '营业结束后自动关闭POS系统' },
  { key: 'member_discount', label: '会员折扣率', type: 'number', value: 0.9, desc: '会员消费默认折扣(0-1)' },
  { key: 'min_recharge', label: '最低充值金额', type: 'number', value: 50, desc: '会员最低充值金额' },
];

export default function OperationsPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>⚙️ 运营管理</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="营业状态" value="营业中" valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="今日客流" value={328}/></Card></Col>
      <Col span={6}><Card><Statistic title="上座率" value="65%" valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="客单价" value="¥86"/></Card></Col>
    </Row>
    <Card title="运营参数配置">
      {SETTINGS.map(s => (
        <div key={s.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid rgba(148,163,184,0.08)'}}>
          <div><div style={{color:'#e2e8f0',fontSize:14}}>{s.label}</div><div style={{color:'#64748b',fontSize:12}}>{s.desc}</div></div>
          <div style={{color:'#fbbf24',fontSize:16,fontWeight:600}}>{s.type === 'switch' ? (s.value ? '🟢 开' : '🔴 关') : String(s.value)}</div>
        </div>
      ))}
    </Card>
    <Card><Space><Button type="primary">保存设置</Button><Button>恢复默认</Button></Space></Card>
  </Space></PageShell>);
}