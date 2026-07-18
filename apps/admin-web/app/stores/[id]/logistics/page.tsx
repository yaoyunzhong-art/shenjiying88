// 🅿️ P-30 后勤管理 · 预约/场地/物资/物流调度
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Statistic, Tag, Button, Space, Input, Modal, Row, Col, type TagProps } from '@m5/ui';

interface Reservation { id: string; customer: string; type: string; people: number; time: string; status: string; amount: number; staff: string; [key:string]: unknown; }

const RESERVATIONS: Reservation[] = [
  { id:'R-01',customer:'张三',type:'生日派对',people:15,time:'2026-07-15 14:00',status:'confirmed',amount:2800,staff:'王五' },
  { id:'R-02',customer:'李四',type:'团建',people:30,time:'2026-07-16 10:00',status:'confirmed',amount:5000,staff:'赵六' },
  { id:'R-03',customer:'科技公司',type:'年会',people:80,time:'2026-07-20 18:00',status:'pending',amount:12000,staff:'周七' },
  { id:'R-04',customer:'王五',type:'私人聚会',people:8,time:'2026-07-14 19:00',status:'in_progress',amount:1500,staff:'王五' },
];

interface Shipment {
  id: string;
  trackingNo: string;
  supplier: string;
  items: string;
  quantity: number;
  status: 'pending_shipping' | 'in_transit' | 'delivered' | 'abnormal';
  estimatedArrival: string;
  carrier: string;
  [key: string]: unknown;
}

const SHIPMENTS: Shipment[] = [
  { id:'S-01',trackingNo:'SF20260701001',supplier:'游戏设备供应商',items:'街机主板×5',quantity:5,status:'pending_shipping',estimatedArrival:'2026-07-22',carrier:'顺丰速运' },
  { id:'S-02',trackingNo:'SF20260701002',supplier:'饮品供应商',items:'可乐×200箱',quantity:200,status:'in_transit',estimatedArrival:'2026-07-20',carrier:'顺丰速运' },
  { id:'S-03',trackingNo:'YT20260702001',supplier:'装饰材料商',items:'气球×500,彩带×100',quantity:600,status:'in_transit',estimatedArrival:'2026-07-19',carrier:'圆通速递' },
  { id:'S-04',trackingNo:'SF20260703001',supplier:'办公设备商',items:'打印机×2,电脑×3',quantity:5,status:'delivered',estimatedArrival:'2026-07-15',carrier:'顺丰速运' },
  { id:'S-05',trackingNo:'ZTO20260704001',supplier:'清洁用品商',items:'消毒液×50瓶',quantity:50,status:'delivered',estimatedArrival:'2026-07-14',carrier:'中通快递' },
  { id:'S-06',trackingNo:'SF20260705001',supplier:'食品供应商',items:'零食大礼包×30',quantity:30,status:'abnormal',estimatedArrival:'2026-07-18',carrier:'顺丰速运' },
  { id:'S-07',trackingNo:'YT20260706001',supplier:'广告物料商',items:'展架×10,海报×200',quantity:210,status:'pending_shipping',estimatedArrival:'2026-07-25',carrier:'圆通速递' },
];

const STATUS_LABEL: Record<string, string> = {
  pending_shipping: '待发货',
  in_transit: '运输中',
  delivered: '已签收',
  abnormal: '异常',
};

// Tag variant — use 'info'|'warning'|'success'|'danger' style keywords
const STATUS_VARIANT: Record<string, string> = {
  pending_shipping: 'info',
  in_transit: 'warning',
  delivered: 'success',
  abnormal: 'danger',
};

const SHIPMENT_COLUMNS = [
  { title: '运单号', dataIndex: 'trackingNo' },
  { title: '供应商', dataIndex: 'supplier' },
  { title: '物品', dataIndex: 'items' },
  { title: '数量', dataIndex: 'quantity' },
  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag variant={STATUS_VARIANT[v] as TagProps['variant'] || 'default'}>{STATUS_LABEL[v] || v}</Tag> },
  { title: '预计到达', dataIndex: 'estimatedArrival' },
  { title: '承运商', dataIndex: 'carrier' },
];

export default function LogisticsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [shipmentFilter, setShipmentFilter] = useState<string>('all');

  const pendingCount = SHIPMENTS.filter(s => s.status === 'pending_shipping').length;
  const inTransitCount = SHIPMENTS.filter(s => s.status === 'in_transit').length;
  const deliveredCount = SHIPMENTS.filter(s => s.status === 'delivered').length;
  const abnormalCount = SHIPMENTS.filter(s => s.status === 'abnormal').length;

  const filteredShipments = useMemo(() => {
    if (shipmentFilter === 'all') return SHIPMENTS;
    return SHIPMENTS.filter(s => s.status === shipmentFilter);
  }, [shipmentFilter]);

  return (
    <PageShell title="后勤管理">
      <Space style={{width:'100%',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <h2 style={{color:'#f8fafc',margin:0}}>🅿️ 后勤管理</h2>
          <Button variant="primary" onClick={()=>setShowCreate(true)}>+ 新建预约</Button>
        </div>

        {/* 预约统计 */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
          <Card><Statistic label="总预约" value={RESERVATIONS.length} /></Card>
          <Card><Statistic label="已确认" value={RESERVATIONS.filter(r=>r.status==='confirmed').length} variant="success" /></Card>
          <Card><Statistic label="进行中" value={RESERVATIONS.filter(r=>r.status==='in_progress').length} variant="warning" /></Card>
          <Card><Statistic label="待确认" value={RESERVATIONS.filter(r=>r.status==='pending').length} variant="info" /></Card>
          <Card><Statistic label="总金额" value={RESERVATIONS.reduce((s,r)=>s+r.amount,0).toLocaleString()} prefix="¥" /></Card>
        </div>

        {/* 物流状态统计条 — 待发货/运输中/已签收/异常 */}
        <div>
          <h3 style={{color:'#94a3b8',margin:'8px 0',fontSize:14}}>📦 物流状态</h3>
          <Row gutter={[16,16]}>
            <Col span={6}>
              <Card>
                <Statistic label="待发货" value={pendingCount} variant="info" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic label="运输中" value={inTransitCount} variant="warning" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic label="已签收" value={deliveredCount} variant="success" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic label="异常" value={abnormalCount} variant="danger" />
              </Card>
            </Col>
          </Row>
        </div>

        {/* 物流明细 */}
        <Card title="物流明细">
          <Space style={{marginBottom:12}}>
            <span style={{color:'#94a3b8',fontSize:13}}>物流状态:</span>
            <select
              value={shipmentFilter}
              onChange={(e) => setShipmentFilter(e.target.value)}
              style={{
                background:'#1e293b',color:'#f8fafc',border:'1px solid #334155',
                borderRadius:6,padding:'4px 8px',fontSize:13
              }}
            >
              <option value="all">全部</option>
              <option value="pending_shipping">待发货</option>
              <option value="in_transit">运输中</option>
              <option value="delivered">已签收</option>
              <option value="abnormal">异常</option>
            </select>
          </Space>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{borderBottom:'1px solid #334155',color:'#94a3b8'}}>
                {SHIPMENT_COLUMNS.map(col => (
                  <th key={col.dataIndex} style={{padding:'8px 12px',textAlign:'left',fontWeight:500}}>{col.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map(ship => (
                <tr key={ship.id} style={{borderBottom:'1px solid #1e293b'}}>
                  <td style={{padding:'8px 12px'}}>{ship.trackingNo}</td>
                  <td style={{padding:'8px 12px'}}>{ship.supplier}</td>
                  <td style={{padding:'8px 12px'}}>{ship.items}</td>
                  <td style={{padding:'8px 12px'}}>{ship.quantity}</td>
                  <td style={{padding:'8px 12px'}}>
                    <Tag variant={STATUS_VARIANT[ship.status] as TagProps['variant'] || 'default'}>
                      {STATUS_LABEL[ship.status] || ship.status}
                    </Tag>
                  </td>
                  <td style={{padding:'8px 12px'}}>{ship.estimatedArrival}</td>
                  <td style={{padding:'8px 12px'}}>{ship.carrier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* 预约列表占位 */}
        <Card>
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
