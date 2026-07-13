// ❤️ 健康评分 · 门店综合健康指标 · 多维评分+趋势+建议
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Progress, Tooltip, Tabs, Empty } from '@m5/ui';

const DIMENSIONS = [
  { key:'revenue', label:'营收健康', score:85, status:'good', trend:'up', detail:'本月营收达标率105%', suggestion:'保持当前价格策略' },
  { key:'staff', label:'人员健康', score:72, status:'fair', trend:'down', detail:'缺编2人,培训完成率68%', suggestion:'加快招聘排期' },
  { key:'equipment', label:'设备健康', score:93, status:'good', trend:'up', detail:'设备故障率1.2%, 已修复5台', suggestion:'定期保养计划持续' },
  { key:'inventory', label:'库存健康', score:68, status:'fair', trend:'stable', detail:'临期品3项,低库存7项', suggestion:'启动临期促销,补货低库存' },
  { key:'satisfaction', label:'客户满意度', score:88, status:'good', trend:'up', detail:'好评率92%,投诉2起', suggestion:'跟进2投诉闭环' },
  { key:'compliance', label:'合规健康', score:90, status:'good', trend:'stable', detail:'隐患0,证件齐全', suggestion:'保持现状' },
  { key:'safety', label:'安全健康', score:78, status:'fair', trend:'up', detail:'本月安全检查3次, 发现隐患1处', suggestion:'整改跟踪确认' },
  { key:'training', label:'培训健康', score:65, status:'fair', trend:'down', detail:'全员培训完成率62%', suggestion:'设置季度培训考核' },
];

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  good: { color: 'green', label: '良好' },
  fair: { color: 'orange', label: '一般' },
  poor: { color: 'red', label: '较差' },
};
const TREND_ICON: Record<string, string> = { up: '📈', down: '📉', stable: '➡️' };

const scoreColor = (s: number) => s >= 80 ? '#34d399' : s >= 60 ? '#f59e0b' : '#f87171';

const COLUMNS = [
  { title: '维度', dataIndex: 'label' },
  {
    title: '评分', dataIndex: 'score', render: (v: number) => (
      <Space>
        <Progress percent={v} size="small" style={{ width: 120 }} strokeColor={scoreColor(v)} />
        <span style={{ fontWeight: 600, color: scoreColor(v) }}>{v}</span>
      </Space>
    ),
  },
  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={STATUS_CFG[v]?.color || 'default'}>{STATUS_CFG[v]?.label || v}</Tag> },
  { title: '趋势', dataIndex: 'trend', render: (v: string) => <span style={{ fontSize: 16 }}>{TREND_ICON[v] || ''}</span> },
  { title: '详情', dataIndex: 'detail', ellipsis: true },
  { title: '改进建议', dataIndex: 'suggestion' },
];

export default function HealthScorePage() {
  const [tab, setTab] = useState('dashboard');
  const overall = Math.round(DIMENSIONS.reduce((a, d) => a + d.score, 0) / DIMENSIONS.length);
  const goodCount = DIMENSIONS.filter(d => d.status === 'good').length;
  const fairCount = DIMENSIONS.filter(d => d.status === 'fair').length;

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>❤️ 健康评分</h2>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', display: 'inline-flex' }}>
                    <Progress type="dashboard" percent={overall} size={130} strokeColor={scoreColor(overall)} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: 32, fontWeight: 700, color: '#f8fafc' }}>{overall}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>综合分</div>
                    </div>
                  </div>
                </div>
                <div style={{ color: scoreColor(overall), fontSize: 14, fontWeight: 500 }}>
                  {overall >= 80 ? '🟢 优秀 — 运营良好' : overall >= 60 ? '🟡 一般 — 需关注' : '🔴 较差 — 需干预'}
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}><Card size="small"><Statistic title="良好维度" value={goodCount} suffix={`/ ${DIMENSIONS.length}`} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={8}><Card size="small"><Statistic title="需关注" value={fairCount} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
        </Row>

        <Card>
          <Tabs value={tab} onChange={setTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="dashboard" label="仪表盘" />
            <Tabs.Tab key="detail" label="详细数据" />
            <Tabs.Tab key="history" label="趋势" />
          </Tabs>

          {tab === 'dashboard' && (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Row gutter={[16, 16]}>
                {DIMENSIONS.map(d => (
                  <Col key={d.key} span={6}>
                    <Card size="small" hoverable style={{ borderLeft: `3px solid ${scoreColor(d.score)}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500, color: '#f8fafc' }}>{d.label}</span>
                        <span style={{ color: scoreColor(d.score), fontSize: 20, fontWeight: 700 }}>{d.score}</span>
                      </div>
                      <Progress percent={d.score} size="small" strokeColor={scoreColor(d.score)} style={{ marginTop: 4 }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <Tag color={STATUS_CFG[d.status]?.color}>{STATUS_CFG[d.status]?.label}</Tag>
                        <span style={{ fontSize: 16 }}>{TREND_ICON[d.trend] || ''}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{d.detail}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
              <Card size="small" title="📋 优先改进项">
                {DIMENSIONS.filter(d => d.status !== 'good').map(d => (
                  <div key={d.key} style={{ marginBottom: 4 }}>· {d.label}({d.score}分): {d.suggestion}</div>
                ))}
              </Card>
            </Space>
          )}

          {tab === 'detail' && (
            <Table dataSource={DIMENSIONS} columns={COLUMNS} rowKey="key" pagination={false} />
          )}

          {tab === 'history' && (
            <Empty description="趋势图表开发中…" />
          )}
        </Card>
      </Space>
    </PageShell>
  );
}
