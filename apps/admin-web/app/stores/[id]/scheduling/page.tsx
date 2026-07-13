// 👥 排班管理 · 员工排班/班次管理
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select } from '@m5/ui';

const STAFF = [
  { id:'E01', name:'张三', role:'店长', shift:'早班', time:'08:00-14:00', date:'2026-07-13', status:'working' },
  { id:'E02', name:'李四', role:'收银员', shift:'中班', time:'14:00-20:00', date:'2026-07-13', status:'working' },
  { id:'E03', name:'王五', role:'导玩员', shift:'早班', time:'08:00-14:00', date:'2026-07-13', status:'working' },
  { id:'E04', name:'赵六', role:'导玩员', shift:'晚班', time:'15:00-22:00', date:'2026-07-13', status:'working' },
  { id:'E05', name:'钱七', role:'保洁', shift:'早班', time:'07:00-15:00', date:'2026-07-13', status:'working' },
  { id:'E06', name:'孙八', role:'收银员', shift:'中班', time:'12:00-18:00', date:'2026-07-13', status:'off' },
  { id:'E07', name:'周九', role:'导玩员', shift:'晚班', time:'16:00-23:00', date:'2026-07-13', status:'late' },
  { id:'E08', name:'吴十', role:'设备维护', shift:'早班', time:'08:00-16:00', date:'2026-07-13', status:'working' },
];

const STATUS_CFG: Record<string,[string,string]> = { working:['green','在岗'], off:['default','休息'], late:['orange','迟到'], leave:['red','请假'] };
const ROLE_COLORS: Record<string,string> = { 店长:'#6366f1', 收银员:'#10b981', 导玩员:'#f59e0b', 保洁:'#6b7280', 设备维护:'#8b5cf6' };
const SHIFT_COLORS: Record<string,string> = { 早班:'#6366f1', 中班:'#f59e0b', 晚班:'#8b5cf6' };

const COLUMNS = [
  { title:'姓名', dataIndex:'name' },
  { title:'角色', dataIndex:'role', render:(v:string)=><Tag color={ROLE_COLORS[v]||'default'}>{v}</Tag> },
  { title:'班次', dataIndex:'shift', render:(v:string)=><Tag color={SHIFT_COLORS[v]||'default'}>{v}</Tag> },
  { title:'时间', dataIndex:'time' },
  { title:'日期', dataIndex:'date' },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_CFG[v]?.[0]||'default'}>{STATUS_CFG[v]?.[1]||v}</Tag> },
];

export default function SchedulingPage() {
  const [shiftFilter, setShiftFilter] = useState('all');
  const filtered = shiftFilter === 'all' ? STAFF : STAFF.filter(s => s.shift === shiftFilter);
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>👥 排班管理</h2>
    <Row gutter={16}>
      <Col span={4}><Card><Statistic title="今日排班" value={STAFF.length}/></Card></Col>
      <Col span={4}><Card><Statistic title="在岗" value={STAFF.filter(s=>s.status==='working').length} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="迟到" value={STAFF.filter(s=>s.status==='late').length} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="休息" value={STAFF.filter(s=>s.status!=='working').length} valueStyle={{color:'#94a3b8'}}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <span style={{color:'#94a3b8',fontSize:13}}>班次:</span>
      <Select value={shiftFilter} onChange={setShiftFilter} style={{width:110}}
        options={[{value:'all',label:'全部'},{value:'早班',label:'早班'},{value:'中班',label:'中班'},{value:'晚班',label:'晚班'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>排班表</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button>调班申请</Button><Button>考勤统计</Button><Button>导出</Button></Space></Card>
  </Space></PageShell>);
}
