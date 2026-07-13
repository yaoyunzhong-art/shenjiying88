// ❤️ 健康评分 · 门店综合健康指标
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Progress, Tooltip } from '@m5/ui';

const DIMENSIONS = [
  { key:'revenue', label:'营收健康', score:85, status:'good', trend:'up', detail:'本月营收达标率105%' },
  { key:'staff', label:'人员健康', score:72, status:'fair', trend:'down', detail:'缺编2人,培训完成率68%' },
  { key:'equipment', label:'设备健康', score:93, status:'good', trend:'up', detail:'设备故障率1.2%, 已修复5台' },
  { key:'inventory', label:'库存健康', score:68, status:'fair', trend:'stable', detail:'临期品3项,低库存7项' },
  { key:'satisfaction', label:'满意度', score:88, status:'good', trend:'up', detail:'好评率92%,投诉2起' },
  { key:'compliance', label:'合规健康', score:90, status:'good', trend:'stable', detail:'隐患0,证件齐全' },
];

const STATUS_CFG: Record<string,{color:string,label:string}> = { good:{color:'green',label:'良好'}, fair:{color:'orange',label:'一般'}, poor:{color:'red',label:'较差'} };
const TREND_ICON: Record<string,string> = { up:'📈', down:'📉', stable:'➡️' };

const COLUMNS = [
  { title:'维度', dataIndex:'label' },
  { title:'评分', dataIndex:'score', render:(v:number)=>(
    <Space><Progress percent={v} size="small" style={{width:120}}/><span style={{fontWeight:600,color:v>=80?'#34d399':v>=60?'#f59e0b':'#f87171'}}>{v}</span></Space>
  )},
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_CFG[v]?.color||'default'}>{STATUS_CFG[v]?.label||v}</Tag> },
  { title:'趋势', dataIndex:'trend', render:(v:string)=><span>{TREND_ICON[v]||''}</span> },
  { title:'详情', dataIndex:'detail', ellipsis:true },
];

export default function HealthScorePage() {
  const overall = Math.round(DIMENSIONS.reduce((a, d) => a + d.score, 0) / DIMENSIONS.length);
  const goodCount = DIMENSIONS.filter(d => d.status === 'good').length;
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16,alignItems:'stretch'}}>
    <h2 style={{color:'#f8fafc',margin:0}}>❤️ 健康评分</h2>
    <Row gutter={16}>
      <Col span={8}><Card>
        <Space direction="vertical" align="center" style={{width:'100%'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{position:'relative',display:'inline-flex'}}>
              <Progress type="dashboard" percent={overall} size={120} strokeColor={overall>=80?'#34d399':overall>=60?'#f59e0b':'#f87171'}/>
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center'}}>
                <div style={{fontSize:28,fontWeight:700,color:'#f8fafc'}}>{overall}</div>
                <div style={{fontSize:12,color:'#94a3b8'}}>综合分</div>
              </div>
            </div>
          </div>
        </Space>
      </Card></Col>
      <Col span={8}><Card><Statistic title="良好维度" value={goodCount} suffix={`/ ${DIMENSIONS.length}`} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={8}><Card><Statistic title="需关注" value={DIMENSIONS.length - goodCount} valueStyle={{color:'#f59e0b'}}/></Card></Col>
    </Row>
    <Card><Table dataSource={DIMENSIONS} columns={COLUMNS} rowKey="key" pagination={false}/></Card>
  </Space></PageShell>);
}
