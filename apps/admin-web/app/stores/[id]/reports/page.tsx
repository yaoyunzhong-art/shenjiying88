// 📈 报表中心 · 经营报表/自定义报表
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, Input, Tabs, DatePicker, Progress, Empty, Divider, Modal, message } from '@m5/ui';

interface Report {
  id: string; name: string; freq: string; desc: string; last: string;
  status: 'ready' | 'generating' | 'overdue' | 'failed';
  progress?: number; category: string;
}

const AUTO_REPORTS: Report[] = [
  { id:'R01', name:'每日营收报表', freq:'每日', desc:'前一日营收/支出/净利汇总', last:'2026-07-13', status:'ready', category:'财务' },
  { id:'R02', name:'客流趋势报表', freq:'每周', desc:'周客流/时段分布/峰值', last:'2026-07-13', status:'ready', category:'运营' },
  { id:'R03', name:'设备使用率报表', freq:'每月', desc:'各设备使用率/故障率/收益', last:'2026-07-01', status:'ready', category:'设备' },
  { id:'R04', name:'会员消费分析', freq:'每月', desc:'会员消费频次/客单价/偏好', last:'2026-07-01', status:'ready', category:'会员' },
  { id:'R05', name:'库存盘点报告', freq:'自定义', desc:'库存盘点差异/损耗分析', last:'2026-06-30', status:'overdue', category:'库存' },
  { id:'R06', name:'营销活动ROI分析', freq:'每周', desc:'活动投入产出比/转化率', last:'2026-07-12', status:'ready', category:'营销' },
  { id:'R07', name:'导玩员工效报表', freq:'每月', desc:'导玩员服务人次/满意度', last:'2026-07-01', status:'ready', category:'人事' },
  { id:'R08', name:'成本分析报表', freq:'每月', desc:'水电/人力/采购成本趋势', last:'2026-06-30', status:'overdue', category:'财务' },
];

const CUSTOM_REPORTS = [
  { id:'C01', name:'七月促销效果分析', creator:'张三', created:'2026-07-10', status:'generating', progress:60 },
  { id:'C02', name:'设备故障排行', creator:'李四', created:'2026-07-08', status:'ready', progress:100 },
  { id:'C03', name:'导玩员工效分析', creator:'王五', created:'2026-07-05', status:'ready', progress:100 },
  { id:'C04', name:'周末客单价对比', creator:'张三', created:'2026-07-03', status:'ready', progress:100 },
];

const CATEGORIES = [...new Set(AUTO_REPORTS.map(r => r.category))];
const STATUS_CFG: Record<string, [string, string]> = {
  ready: ['green', '就绪'],
  generating: ['blue', '生成中'],
  overdue: ['orange', '逾期'],
  failed: ['red', '失败'],
};

export default function ReportsPage() {
  const [tabKey, setTabKey] = useState('overview');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const autoFiltered = AUTO_REPORTS.filter(r =>
    (!search || r.name.includes(search) || r.desc.includes(search)) &&
    (catFilter === 'all' || r.category === catFilter)
  );
  const customFiltered = CUSTOM_REPORTS.filter(r =>
    !search || r.name.includes(search) || r.creator.includes(search)
  );

  const totalReports = AUTO_REPORTS.length + CUSTOM_REPORTS.length;
  const readyCount = AUTO_REPORTS.filter(r => r.status === 'ready').length;
  const pendingCount = AUTO_REPORTS.filter(r => r.status === 'overdue').length;
  const genCount = CUSTOM_REPORTS.filter(r => r.status === 'generating').length;

  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <h2 style={{color:'#f8fafc',margin:0}}>📈 报表中心</h2>
      <Space>
        <Button>报表模板</Button>
        <Button>计划任务</Button>  
        <Button type="primary" onClick={() => setShowCreate(true)}>+ 新建报表</Button>
      </Space>
    </div>

    <Row gutter={16}>
      <Col span={4}><Card size="small"><Statistic title="可用报表" value={totalReports} /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="就绪" value={readyCount + customFiltered.filter(r => r.status === 'ready').length} valueStyle={{color:'#34d399'}} /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="生成中" value={genCount} valueStyle={{color:'#f59e0b'}} /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="逾期" value={pendingCount} valueStyle={{color:'#f87171'}} /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="报表覆盖率" value="87%" valueStyle={{color:'#34d399'}} suffix="%" /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="分类" value={CATEGORIES.length} suffix="种" /></Card></Col>
    </Row>

    <Card>
      <Space style={{marginBottom:12, width:'100%', display:'flex', flexWrap:'wrap'}}>
        <Input.Search placeholder="搜索报表" value={search} onChange={e => setSearch(e.target.value)} style={{width:220}} />
        <Select value={catFilter} onChange={setCatFilter} style={{width:120}}
          options={[{value:'all', label:'全部分类'}, ...CATEGORIES.map(c => ({value:c, label:c}))]} />
        <span style={{marginLeft:'auto', color:'#94a3b8', fontSize: 13}}>共 {autoFiltered.length} 个自动报表 · {customFiltered.length} 个自定义</span>
      </Space>

      <Tabs activeKey={tabKey} onChange={setTabKey} items={[
        { key:'overview', label:'概览',
          children: <>
            <Row gutter={[16, 16]}>
              {CATEGORIES.map(cat => {
                const catReports = AUTO_REPORTS.filter(r => r.category === cat);
                return (
                  <Col key={cat} span={8}>
                    <Card title={cat} size="small">
                      {catReports.map(r => (
                        <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid rgba(148,163,184,0.08)'}}>
                          <a onClick={() => setViewReport(r)} style={{color:'#e2e8f0', cursor:'pointer', fontSize:13}}>{r.name}</a>
                          <Space size={4}>
                            <Tag size="small">{r.freq}</Tag>
                            <Tag color={STATUS_CFG[r.status]?.[0]||'default'} size="small">{STATUS_CFG[r.status]?.[1]||r.status}</Tag>
                          </Space>
                        </div>
                      ))}
                    </Card>
                  </Col>
                );
              })}
            </Row>
            <Divider />
            <Card title="自定义报表" size="small">
              {customFiltered.length === 0 ? <Empty description="无自定义报表" /> :
                customFiltered.map(r => (
                  <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid rgba(148,163,184,0.08)'}}>
                    <div>
                      <span style={{color:'#e2e8f0', fontSize:13}}>{r.name}</span>
                      <span style={{color:'#64748b', fontSize:12, marginLeft:8}}>{r.creator} · {r.created}</span>
                    </div>
                    <Space>
                      {r.status === 'generating' ? <Tag color="blue">生成中 {r.progress}%</Tag> : <Tag color="green">就绪</Tag>}
                      <Button size="small" disabled={r.status === 'generating'}>查看</Button>
                    </Space>
                  </div>
                ))
              }
            </Card>
          </>
        },
        { key:'auto', label:`自动报表(${autoFiltered.length})`,
          children: autoFiltered.length === 0 ? <Empty description="无匹配报表" /> :
            autoFiltered.map(r => (
              <Card key={r.id} style={{marginBottom:8}} size="small">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{color:'#f8fafc',fontWeight:600}}>{r.name}</div>
                    <div style={{color:'#64748b',fontSize:12,marginTop:2}}>{r.desc}</div>
                  </div>
                  <Space>
                    <Tag size="small">{r.freq}</Tag>
                    <Tag color={STATUS_CFG[r.status]?.[0]||'default'} size="small">{STATUS_CFG[r.status]?.[1]||r.status}</Tag>
                    <span style={{color:'#64748b', fontSize:12}}>上次: {r.last}</span>
                    <Button size="small">生成</Button>
                    <Button size="small" disabled={r.status !== 'ready'}>下载</Button>
                    <Button size="small" type="link" onClick={() => setViewReport(r)}>详情</Button>
                  </Space>
                </div>
              </Card>
            ))
        },
        { key:'custom', label:`自定义(${customFiltered.length})`,
          children: customFiltered.length === 0 ? <Empty description="无自定义报表" /> :
            customFiltered.map(r => (
              <Card key={r.id} style={{marginBottom:8}} size="small">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{color:'#f8fafc',fontWeight:600}}>{r.name}</div>
                    <div style={{color:'#64748b',fontSize:12}}>创建人: {r.creator} · {r.created}</div>
                  </div>
                  <Space>
                    {r.status === 'generating' ? <><Progress percent={r.progress} size="small" style={{width:80}} /><Tag color="blue">生成中</Tag></> : <Tag color="green">就绪</Tag>}
                    <Button size="small" disabled={r.status==='generating'}>查看</Button>
                    <Button size="small" disabled={r.status==='generating'}>下载</Button>
                    <Button size="small" type="link">分享</Button>
                  </Space>
                </div>
              </Card>
            ))
        },
      ]}/>
    </Card>

    <Modal title={`报表详情 - ${viewReport?.name || ''}`} open={!!viewReport} onCancel={() => setViewReport(null)} footer={<Button onClick={() => setViewReport(null)}>关闭</Button>}>
      {viewReport && <Space direction="vertical" style={{width:'100%'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div><div style={{color:'#94a3b8',fontSize:12}}>报表名</div><div style={{color:'#e2e8f0'}}>{viewReport.name}</div></div>
          <div><div style={{color:'#94a3b8',fontSize:12}}>频率</div><Tag>{viewReport.freq}</Tag></div>
          <div><div style={{color:'#94a3b8',fontSize:12}}>分类</div><Tag>{viewReport.category}</Tag></div>
          <div><div style={{color:'#94a3b8',fontSize:12}}>状态</div><Tag color={STATUS_CFG[viewReport.status]?.[0]}>{STATUS_CFG[viewReport.status]?.[1]}</Tag></div>
          <div style={{gridColumn:'1 / -1'}}><div style={{color:'#94a3b8',fontSize:12}}>说明</div><div style={{color:'#e2e8f0'}}>{viewReport.desc}</div></div>
          <div style={{gridColumn:'1 / -1'}}><div style={{color:'#94a3b8',fontSize:12}}>上次生成</div><div style={{color:'#e2e8f0'}}>{viewReport.last}</div></div>
        </div>
      </Space>}
    </Modal>

    <Modal title="新建自定义报表" open={showCreate} onCancel={() => setShowCreate(false)} onOk={() => {message.success('报表创建中'); setShowCreate(false);}} width={480}>
      <Space direction="vertical" style={{width:'100%'}}>
        <Input placeholder="报表名称" />
        <Select placeholder="报表类型" style={{width:'100%'}}>
          <Select.Option value="revenue">营收分析</Select.Option>
          <Select.Option value="traffic">客流分析</Select.Option>
          <Select.Option value="member">会员分析</Select.Option>
          <Select.Option value="device">设备分析</Select.Option>
        </Select>
        <DatePicker style={{width:'100%'}} placeholder="选择数据范围" />
        <Input.TextArea rows={4} placeholder="报表说明（可选）" />
      </Space>
    </Modal>
  </Space></PageShell>);
}