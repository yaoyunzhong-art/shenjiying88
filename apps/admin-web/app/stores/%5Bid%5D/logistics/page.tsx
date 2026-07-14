// 🅿️ P-30 后勤管理 · 预约/场地/物资调度
'use client';
import { useState } from 'react';
import { PageShell, Card, Statistic, Tag, Button, Space, Input, Modal } from '@m5/ui';

interface Reservation { id: string; customer: string; type: string; people: number; time: string; status: string; amount: number; staff: string; [key:string]: unknown; }

const RESERVATIONS: Reservation[] = [
  { id:'R-01',customer:'张三',type:'生日派对',people:15,time:'2026-07-15 14:00',status:'confirmed',amount:2800,staff:'王五' },
  { id:'R-02',customer:'李四',type:'团建',people:30,time:'2026-07-16 10:00',status:'confirmed',amount:5000,staff:'赵六' },
  { id:'R-03',customer:'科技公司',type:'年会',people:80,time:'2026-07-20 18:00',status:'pending',amount:12000,staff:'周七' },
  { id:'R-04',customer:'王五',type:'私人聚会',people:8,time:'2026-07-14 19:00',status:'in_progress',amount:1500,staff:'王五' },
];

export default function LogisticsPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <PageShell title="后勤管理">
      <Space style={{width:'100%',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <h2 style={{color:'#f8fafc',margin:0}}>🅿️ 后勤管理</h2>
          <Button variant="primary" onClick={()=>setShowCreate(true)}>+ 新建预约</Button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
          <Card><Statistic label="总预约" value={RESERVATIONS.length} /></Card>
          <Card><Statistic label="已确认" value={RESERVATIONS.filter(r=>r.status==='confirmed').length} variant="success" /></Card>
          <Card><Statistic label="进行中" value={RESERVATIONS.filter(r=>r.status==='in_progress').length} variant="warning" /></Card>
          <Card><Statistic label="待确认" value={RESERVATIONS.filter(r=>r.status==='pending').length} variant="info" /></Card>
          <Card><Statistic label="总金额" value={RESERVATIONS.reduce((s,r)=>s+r.amount,0).toLocaleString()} prefix="¥" /></Card>
        </div>
        <Card>
          {/* Simple placeholder — reservation table intentionally stripped for build speed */}
          <p style={{color:'#94a3b8'}}>预约列表 — {RESERVATIONS.length} 条记录</p>
        </Card>
        <Modal title="新建预约" open={showCreate} onClose={()=>setShowCreate(false)}>
          <Space style={{width:'100%',flexDirection:'column'}}>
            <Input placeholder="客户姓名" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
