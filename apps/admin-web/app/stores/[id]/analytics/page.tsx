// 📊 门店分析 · 营收/客流/坪效 KPI 看板
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Tag, Button, Space } from '@m5/ui';
export default function AnalyticsPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16,alignItems:'stretch'}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📊 门店分析</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="今日营收" value={12800} prefix="¥" valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="本月同比" value="+23.5%" valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="今日客流" value={328}/></Card></Col>
      <Col span={6}><Card><Statistic title="坪效" value="¥85/㎡" valueStyle={{color:'#f59e0b'}}/></Card></Col>
    </Row>
    <Row gutter={16}>
      <Col span={8}><Card title="时段客流">
        <div style={{color:'#64748b',fontSize:13}}>早班(10-14): 108人</div>
        <div style={{color:'#64748b',fontSize:13}}>中班(14-18): 156人</div>
        <div style={{color:'#64748b',fontSize:13}}>晚班(18-22): 64人</div>
      </Card></Col>
      <Col span={8}><Card title="设备使用率">
        <div style={{color:'#34d399',fontSize:13}}>街机区: 78% ▲</div>
        <div style={{color:'#fbbf24',fontSize:13}}>VR区: 92% ▲</div>
        <div style={{color:'#f87171',fontSize:13}}>台球区: 35% ▼</div>
      </Card></Col>
      <Col span={8}><Card title="支付方式分布">
        <div style={{color:'#34d399',fontSize:13}}>微信: 58%</div>
        <div style={{color:'#06b6d4',fontSize:13}}>支付宝: 28%</div>
        <div style={{color:'#f59e0b',fontSize:13}}>现金: 10%</div>
        <div style={{color:'#a78bfa',fontSize:13}}>刷卡: 4%</div>
      </Card></Col>
    </Row>
    <Card><Space><Button type="primary">日报</Button><Button>周报</Button><Button>月报</Button><Button>导出</Button></Space></Card>
  </Space></PageShell>);
}