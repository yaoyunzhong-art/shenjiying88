// 📈 报表中心 · 经营报表/自定义报表
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Tag, Button, Space, Select, Input, Tabs } from '@m5/ui';

const AUTO_REPORTS = [
  { id:'R01', name:'每日营收报表', freq:'每日', desc:'前一日营收/支出/净利汇总', last:'2026-07-12', status:'ready' },
  { id:'R02', name:'客流趋势报表', freq:'每周', desc:'周客流/时段分布/峰值', last:'2026-07-07', status:'ready' },
  { id:'R03', name:'设备使用率报表', freq:'每月', desc:'各设备使用率/故障率/收益', last:'2026-07-01', status:'ready' },
  { id:'R04', name:'会员消费分析', freq:'每月', desc:'会员消费频次/客单价/偏好', last:'2026-07-01', status:'ready' },
  { id:'R05', name:'库存盘点报告', freq:'自定义', desc:'库存盘点差异/损耗分析', last:'2026-06-30', status:'overdue' },
];

const CUSTOM_REPORTS = [
  { id:'C01', name:'七月促销效果分析', creator:'张三', created:'2026-07-10', status:'generating', progress:60 },
  { id:'C02', name:'设备故障排行', creator:'李四', created:'2026-07-08', status:'ready', progress:100 },
  { id:'C03', name:'导玩员工效分析', creator:'王五', created:'2026-07-05', status:'ready', progress:100 },
];

const STATUS_CFG: Record<string,[string,string]> = { ready:['green','就绪'], generating:['blue','生成中'], overdue:['orange','过期'] };

export default function ReportsPage() {
  const [tabKey, setTabKey] = useState('auto');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const autoFiltered = AUTO_REPORTS.filter(r => !search || r.name.includes(search) || r.desc.includes(search));
  const customFiltered = CUSTOM_REPORTS.filter(r => !search || r.name.includes(search));

  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📈 报表中心</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="可用报表" value={AUTO_REPORTS.length + CUSTOM_REPORTS.length}/></Card></Col>
      <Col span={6}><Card><Statistic title="今日生成" value={CUSTOM_REPORTS.filter(r=>r.status==='generating').length} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="就绪" value={AUTO_REPORTS.filter(r=>r.status==='ready').length+CUSTOM_REPORTS.filter(r=>r.status==='ready').length} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="报表覆盖率" value="85%" valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    <Card>
      <Space style={{marginBottom:12}}>
        <Input placeholder="搜索报表" value={search} onChange={e=>setSearch(e.target.value)} style={{width:200}} />
        <Select value={typeFilter} onChange={setTypeFilter} style={{width:120}}
          options={[{value:'all',label:'全部类型'},{value:'自动',label:'自动'},{value:'手动',label:'手动'}]}/>
        <Button type="primary" style={{marginLeft:'auto'}}>新建报表</Button>
      </Space>
      <Tabs activeKey={tabKey} onChange={setTabKey} items={[
        { key:'auto', label:`自动报表(${autoFiltered.length})`,
          children: autoFiltered.map(r => (
            <Card key={r.id} style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{color:'#f8fafc',fontWeight:600}}>{r.name}</div><div style={{color:'#64748b',fontSize:13}}>{r.desc}</div></div>
              <Space><Tag>{r.freq}</Tag><Tag color={STATUS_CFG[r.status]?.[0]||'default'}>{STATUS_CFG[r.status]?.[1]||r.status}</Tag>
              <Button size="small">生成</Button><Button size="small">下载</Button></Space>
            </div></Card>
          ))
        },
        { key:'custom', label:`自定义报表(${customFiltered.length})`,
          children: customFiltered.map(r => (
            <Card key={r.id} style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{color:'#f8fafc',fontWeight:600}}>{r.name}</div><div style={{color:'#64748b',fontSize:13}}>创建人: {r.creator} · {r.created}</div></div>
              <Space>
                {r.status === 'generating' ? <Tag color="blue">生成中 {r.progress}%</Tag> : <Tag color="green">就绪</Tag>}
                <Button size="small" disabled={r.status==='generating'}>查看</Button>
                <Button size="small" disabled={r.status==='generating'}>下载</Button>
              </Space>
            </div></Card>
          ))
        },
      ]}/>
    </Card>
    <Card><Space><Button>报表模板</Button><Button>计划任务</Button></Space></Card>
  </Space></PageShell>);
}
