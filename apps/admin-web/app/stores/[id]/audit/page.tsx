// 🔍 审计日志 · 操作记录与可追溯
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select } from '@m5/ui';

const AUDIT_DATA = [
  { id:'AL-001', operator:'系统', action:'登录', target:'admin-web', detail:'IP: 192.168.1.100', time:'2026-07-13 22:00', level:'info' },
  { id:'AL-002', operator:'张三(店长)', action:'修改价格', target:'收银 P-35', detail:'商品SKU-001 ￥25→￥22', time:'2026-07-13 21:30', level:'warn' },
  { id:'AL-003', operator:'李四(财务)', action:'审核退款', target:'财务 P-38', detail:'订单OR-2026-0713 退款￥88', time:'2026-07-13 20:15', level:'info' },
  { id:'AL-004', operator:'系统', action:'自动备份', target:'数据库', detail:'完整备份 2.3GB', time:'2026-07-13 20:00', level:'info' },
  { id:'AL-005', operator:'王五(管理员)', action:'配置变更', target:'权限', detail:'新增角色: 临时工', time:'2026-07-13 19:45', level:'warn' },
  { id:'AL-006', operator:'系统', action:'告警触发', target:'库存', detail:'抹茶粉低于安全库存', time:'2026-07-13 19:00', level:'error' },
  { id:'AL-007', operator:'赵六(HR)', action:'离职处理', target:'员工', detail:'员工EMP-089 已离职', time:'2026-07-13 18:00', level:'info' },
  { id:'AL-008', operator:'张三(店长)', action:'设备关机', target:'设备-03', detail:'VR设备异常关机', time:'2026-07-13 17:00', level:'error' },
];

const LEVEL_CFG: Record<string, {color:string,label:string}> = { info:{color:'blue',label:'普通'}, warn:{color:'orange',label:'警告'}, error:{color:'red',label:'错误'} };
const COLUMNS = [
  { title:'操作编号', dataIndex:'id', width:100 },
  { title:'操作人', dataIndex:'operator' },
  { title:'操作类型', dataIndex:'action' },
  { title:'操作对象', dataIndex:'target' },
  { title:'详情', dataIndex:'detail', ellipsis:true },
  { title:'时间', dataIndex:'time', width:150 },
  { title:'级别', dataIndex:'level', width:80, render:(v:string)=><Tag color={LEVEL_CFG[v]?.color||'default'}>{LEVEL_CFG[v]?.label||v}</Tag> },
];

export default function AuditPage() {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const filtered = levelFilter === 'all' ? AUDIT_DATA : AUDIT_DATA.filter(d => d.level === levelFilter);
  const errorCount = AUDIT_DATA.filter(d => d.level === 'error').length;
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16,alignItems:'stretch'}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🔍 审计日志</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="今日操作" value={AUDIT_DATA.length}/></Card></Col>
      <Col span={6}><Card><Statistic title="错误告警" value={errorCount} valueStyle={{color:'#f87171'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="警告" value={AUDIT_DATA.filter(d=>d.level==='warn').length} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="普通" value={AUDIT_DATA.filter(d=>d.level==='info').length} valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <span style={{color:'#94a3b8',fontSize:13}}>级别筛选:</span>
      <Select value={levelFilter} onChange={setLevelFilter} style={{width:120}}
        options={[{value:'all',label:'全部'},{value:'info',label:'普通'},{value:'warn',label:'警告'},{value:'error',label:'错误'}]}/>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{pageSize:5}}/></Card>
  </Space></PageShell>);
}
