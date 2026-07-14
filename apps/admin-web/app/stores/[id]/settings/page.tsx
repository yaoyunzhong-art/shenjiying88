// ⚙️ 设置中心 · 门店基础参数配置
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Switch, Input, Modal, message, Tabs, Divider, Empty, notification } from '@m5/ui';

interface ConfigItem { id:string; label:string; key:string; type:'switch'|'text'|'select'|'number'; value:any; options?:{value:string,label:string}[]; desc:string; category:string; }
interface NotifItem { id:string; type:string; message:string; time:string; read:boolean; }

const NOTIFICATIONS: NotifItem[] = [
  { id:'N-01', type:'告警', message:'仓库存量低于安全线 (耳机10件)', time:'10:25', read:false },
  { id:'N-02', type:'提醒', message:'今日巡检任务未完成', time:'09:00', read:false },
  { id:'N-03', type:'系统', message:'系统版本 v2.3.1 更新可用', time:'昨天', read:false },
  { id:'N-04', type:'告警', message:'门禁AL-006已超过48h未处理', time:'昨天', read:true },
  { id:'N-05', type:'提醒', message:'会员张三预约14:00到店', time:'昨天', read:true },
];

const CATEGORIES = [
  {
    name:'营业设置', icon:'🕐', items:[
      { id:'CFG-01', label:'营业时间', key:'businessHours', type:'text', value:'10:00-22:00', desc:'门店每日运营时段', category:'business' },
      { id:'CFG-02', label:'周末营业', key:'weekendOpen', type:'switch', value:true, desc:'周六日是否正常营业', category:'business' },
      { id:'CFG-03', label:'最大接待人数', key:'maxCapacity', type:'number', value:200, desc:'同时最大在店人数', category:'business' },
      { id:'CFG-04', label:'节假日模式', key:'holidayMode', type:'switch', value:false, desc:'节假日自动调整营业时间', category:'business' },
      { id:'CFG-05', label:'预约前置时间', key:'reservationLead', type:'number', value:30, desc:'预约需提前N分钟', category:'business' },
    ],
  },
  {
    name:'收银设置', icon:'💳', items:[
      { id:'CFG-06', label:'默认支付方式', key:'defaultPayment', type:'select', value:'wechat', options:[{value:'wechat',label:'微信支付'},{value:'alipay',label:'支付宝'},{value:'cash',label:'现金'},{value:'card',label:'银行卡'}], desc:'收银台默认选中', category:'cashier' },
      { id:'CFG-07', label:'小票打印', key:'receiptPrint', type:'switch', value:true, desc:'交易完成自动打印小票', category:'cashier' },
      { id:'CFG-08', label:'找零模式', key:'changeRounding', type:'select', value:'round', options:[{value:'round',label:'四舍五入'},{value:'keep',label:'保留分位'}], desc:'现金找零规则', category:'cashier' },
      { id:'CFG-09', label:'积分抵扣', key:'pointsDeduct', type:'switch', value:true, desc:'允许会员使用积分折抵金额', category:'cashier' },
      { id:'CFG-10', label:'退款自动审批金额上限', key:'autoRefundLimit', type:'number', value:200, desc:'≤此金额自动审批退款', category:'cashier' },
    ],
  },
  {
    name:'会员设置', icon:'👥', items:[
      { id:'CFG-11', label:'自动开卡', key:'autoMemberCard', type:'switch', value:true, desc:'消费满条件自动办理会员', category:'member' },
      { id:'CFG-12', label:'积分有效期', key:'pointsExpiry', type:'select', value:'1year', options:[{value:'never',label:'永久'},{value:'1year',label:'一年'},{value:'halfyear',label:'半年'},{value:'quarter',label:'季度'}], desc:'会员积分过期规则', category:'member' },
      { id:'CFG-13', label:'新会员优惠', key:'newMemberBonus', type:'text', value:'首充满100送50', desc:'新注册会员自动发放优惠', category:'member' },
      { id:'CFG-14', label:'生日自动优惠', key:'birthdayBonus', type:'switch', value:true, desc:'会员生日当天自动发放优惠券', category:'member' },
    ],
  },
  {
    name:'通知设置', icon:'🔔', items:[
      { id:'CFG-15', label:'到店提醒', key:'arriveNotify', type:'switch', value:true, desc:'预约会员到店后通知店长', category:'notify' },
      { id:'CFG-16', label:'库存预警', key:'stockAlert', type:'switch', value:true, desc:'低库存时推送通知', category:'notify' },
      { id:'CFG-17', label:'巡检提醒', key:'inspectRemind', type:'switch', value:true, desc:'每日巡检未完成时推送提醒', category:'notify' },
      { id:'CFG-18', label:'营业日报推送', key:'dailyReport', type:'switch', value:true, desc:'每日营业结束后推送报表', category:'notify' },
    ],
  },
];

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [showImportModal, setShowImportModal] = useState(false);

  const allItems = CATEGORIES.flatMap(c => c.items);
  const switchItems = allItems.filter(i => i.type === 'switch');
  const enabledCount = switchItems.filter(i => configValues[i.id] !== false && i.value !== false).length;

  const getValue = (item: ConfigItem) => configValues[item.id] !== undefined ? configValues[item.id] : item.value;
  const updateValue = (id: string, val: any) => {
    setConfigValues(prev => ({ ...prev, [id]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    message.success('所有配置已保存');
  };

  const unreadNotifs = NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <PageShell>
      <Space style={{width:'100%',flexDirection:'column',gap:16,alignItems:'stretch'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{color:'#f8fafc',margin:0}}>⚙️ 设置中心</h2>
          <Space>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>未读通知: {unreadNotifs}条</span>
            {saved && <Tag color="green">已保存</Tag>}
          </Space>
        </div>

        <Row gutter={16}>
          <Col span={4}><Card size="small"><Statistic title="配置项" value={allItems.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="已启用开关" value={`${enabledCount}/${switchItems.length}`} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="配置分类" value={CATEGORIES.length} suffix="类" /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="未读通知" value={unreadNotifs} valueStyle={{ color: unreadNotifs > 0 ? '#f87171' : '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="手动配置" value={Object.keys(configValues).length} suffix={`/${allItems.length}`} /></Card></Col>
        </Row>

        <Row gutter={16}>
          <Col span={18}>
            <Tabs items={CATEGORIES.map(cat => ({
              key: cat.name,
              label: `${cat.icon} ${cat.name}`,
              children: (
                <Card>
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
                          {item.type === 'switch' ? <Switch checked={getValue(item)} onChange={(v) => updateValue(item.id, v)} /> :
                           item.type === 'select' ? <Select value={getValue(item)} onChange={(v) => updateValue(item.id, v)} style={{width:160}} options={item.options||[]} /> :
                           item.type === 'number' ? <Input type="number" value={String(getValue(item))} onChange={(e) => updateValue(item.id, Number(e.target.value))} style={{width:120}} /> :
                           <Input value={String(getValue(item))} onChange={(e) => updateValue(item.id, e.target.value)} style={{width:200}} />}
                        </td>
                        <td style={{padding:'10px 12px',color:'#94a3b8',fontSize:13}}>{item.desc}</td>
                        <td style={{padding:'10px 12px',textAlign:'right'}}><Button size="small" onClick={() => message.success(`已复制:\n${item.key}=${getValue(item)}`)}>复制</Button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </Card>
              ),
            }))} />
          </Col>
          <Col span={6}>
            <Card title="🔔 通知中心" style={{ marginBottom: 16 }}>
              {NOTIFICATIONS.length === 0 ? <Empty description="暂无通知" /> :
                <Space direction="vertical" style={{ width: '100%' }}>
                  {NOTIFICATIONS.map(n => (
                    <div key={n.id} style={{
                      padding: '8px 10px', borderRadius: 6,
                      background: n.read ? 'transparent' : 'rgba(96,165,250,0.08)',
                      borderLeft: n.read ? '2px solid transparent' : '2px solid #60a5fa',
                      cursor: 'pointer',
                    }} onClick={() => message.info(`通知: ${n.message}`)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Tag size="small" color={n.type === '告警' ? 'red' : n.type === '提醒' ? 'blue' : 'default'}>{n.type}</Tag>
                        <span style={{ color: '#94a3b8', fontSize: 11 }}>{n.time}</span>
                      </div>
                      <div style={{ color: '#e2e8f0', fontSize: 13, marginTop: 4 }}>{n.message}</div>
                    </div>
                  ))}
                </Space>
              }
            </Card>
            <Card title="批量操作">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block onClick={() => { setConfigValues({}); setSaved(false); message.info('已重置未保存修改'); }}>重置更改</Button>
                <Button block onClick={() => setShowImportModal(true)}>导入配置</Button>
                <Button block>导出配置</Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => { message.warning('确认恢复默认？所有自定义配置将丢失'); }}>恢复默认</Button>
          <Button onClick={() => { setConfigValues({}); setSaved(true); message.success('已重置并保存默认配置'); }}>重置并保存</Button>
          <Button type="primary" onClick={handleSave}>保存全部配置</Button>
        </div>

        <Modal title="导入配置" open={showImportModal} onCancel={() => setShowImportModal(false)} onOk={() => { message.success('配置已导入'); setShowImportModal(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input.TextArea rows={6} placeholder='粘贴JSON配置...&#10;例如: {"businessHours":"09:00-23:00","maxCapacity":300}' />
            <div style={{ color: '#94a3b8', fontSize: 12 }}>支持从其他门店复制配置JSON</div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
