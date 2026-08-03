'use client';
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react';
import { Col, Row, message } from 'antd';
import {
  Button,
  Card,
  Input,
  Modal,
  PageShell,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
} from '@m5/ui';

import { LEVEL_CONFIG, type AuditRecord, type AuditSnapshot } from './audit-data';

type DiagnosticTagColor = 'default' | 'green' | 'orange' | 'red';

function getDiagnosticTagColor(status: AuditSnapshot['diagnostics'][number]['status']): DiagnosticTagColor {
  if (status === 'stable') return 'green';
  if (status === 'watch') return 'orange';
  if (status === 'risk') return 'red';
  return 'default';
}

export default function AuditClient({
  snapshot,
}: {
  snapshot: AuditSnapshot;
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('list');
  const [showReport, setShowReport] = useState(false);
  const [detailRecord, setDetailRecord] = useState<AuditRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return snapshot.records.filter((record) => {
      const matchesLevel = levelFilter === 'all' || record.level === levelFilter;
      const matchesSearch =
        !search ||
        record.operator.includes(search) ||
        record.action.includes(search) ||
        record.target.includes(search) ||
        record.detail.includes(search);
      return matchesLevel && matchesSearch;
    });
  }, [levelFilter, search, snapshot.records]);

  const refreshSnapshot = () => {
    handleRefresh();
  };

  const columns = [
    { title: '操作编号', dataIndex: 'id', width: 110 },
    { title: '操作人', dataIndex: 'operator', width: 120 },
    { title: '操作类型', dataIndex: 'action', width: 120 },
    { title: '操作对象', dataIndex: 'target', width: 140 },
    { title: '详情', dataIndex: 'detail' },
    { title: '时间', dataIndex: 'time', width: 160 },
    {
      title: '级别',
      dataIndex: 'level',
      width: 90,
      render: (value: AuditRecord['level']) => (
        <Tag color={LEVEL_CONFIG[value]?.color ?? 'default'}>{LEVEL_CONFIG[value]?.label ?? value}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: AuditRecord) => (
        <Button size="small" onClick={() => setDetailRecord(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <PageShell title="审计日志" subtitle="server wrapper + snapshot loader + client renderer">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {snapshot.error ? (
          <Card>
            <span style={{ color: '#fbbf24', fontSize: 13 }}>{snapshot.error}</span>
          </Card>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>审计日志</h2>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
              操作记录 · 统计分析 · 导出报告 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </div>
          </div>
          <Space>
            <Button variant="outline" onClick={refreshSnapshot} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </Button>
            <Button type="primary" onClick={() => setShowReport(true)}>
              导出审计报告
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="今日操作" value={snapshot.summary.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="错误告警" value={snapshot.summary.errorCount} valueStyle={{ color: '#f87171' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="警告" value={snapshot.summary.warnCount} valueStyle={{ color: '#f59e0b' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="操作人" value={snapshot.summary.uniqueOperators} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
        </Row>

        <Card title="来源态诊断" subtitle="结构固证、演练报告与实时审计流状态">
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {snapshot.diagnostics.map((diagnostic) => (
              <div
                key={diagnostic.id}
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: 12,
                  padding: 14,
                  background: 'rgba(15, 23, 42, 0.35)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{diagnostic.title}</span>
                  <Tag color={getDiagnosticTagColor(diagnostic.status)}>{diagnostic.status}</Tag>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>{diagnostic.detail}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Tabs value={tab} onChange={setTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="list" label="日志列表" />
            <Tabs.Tab key="analysis" label="统计分析" />
          </Tabs>

          {tab === 'list' ? (
            <>
              <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>级别:</span>
                <Select
                  value={levelFilter}
                  onChange={setLevelFilter}
                  style={{ width: 120 }}
                  options={[
                    { value: 'all', label: '全部' },
                    { value: 'info', label: '普通' },
                    { value: 'warn', label: '警告' },
                    { value: 'error', label: '错误' },
                  ]}
                />
                <Input.Search
                  placeholder="搜索操作人/类型/对象/详情"
                  style={{ width: 280 }}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  allowClear
                />
                <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 12 }}>
                  generatedAt {snapshot.generatedAt}
                </span>
              </Space>
              <Table
                dataSource={filteredRecords}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 8, showSizeChanger: true }}
              />
            </>
          ) : (
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" title="按类型分布">
                  {snapshot.actionStats.map((stat) => (
                    <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span style={{ color: '#94a3b8' }}>{stat.label}</span>
                      <span style={{ color: '#e2e8f0' }}>{stat.count} 次</span>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="级别分布">
                  <div style={{ color: '#34d399', padding: '6px 0' }}>普通: {snapshot.summary.infoCount} 条</div>
                  <div style={{ color: '#f59e0b', padding: '6px 0' }}>警告: {snapshot.summary.warnCount} 条</div>
                  <div style={{ color: '#f87171', padding: '6px 0' }}>错误: {snapshot.summary.errorCount} 条</div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="来源态说明">
                  <div style={{ color: '#94a3b8', lineHeight: 1.8 }}>
                    当前列表由服务端 snapshot loader 首屏下发，刷新按钮仅通过 router.refresh() 触发重新取数。
                  </div>
                </Card>
              </Col>
            </Row>
          )}
        </Card>

        <Modal
          title="导出审计报告"
          open={showReport}
          onCancel={() => setShowReport(false)}
          onOk={() => {
            message.success('审计报告生成中...');
            setShowReport(false);
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>将导出以下数据:</div>
            <div>· 操作日志: {snapshot.summary.total} 条</div>
            <div>· 错误告警: {snapshot.summary.errorCount} 条</div>
            <div>· 警告: {snapshot.summary.warnCount} 条</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>
              当前导出链路仅用于结构固证，正式归档仍需接入实时审计归档服务。
            </div>
          </Space>
        </Modal>

        <Modal
          title={`审计详情 - ${detailRecord?.id ?? ''}`}
          open={Boolean(detailRecord)}
          onCancel={() => setDetailRecord(null)}
          footer={null}
        >
          {detailRecord ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>操作人: {detailRecord.operator}</div>
              <div>操作类型: {detailRecord.action}</div>
              <div>操作对象: {detailRecord.target}</div>
              <div>时间: {detailRecord.time}</div>
              <div>详情: {detailRecord.detail}</div>
            </Space>
          ) : null}
        </Modal>
      </Space>
    </PageShell>
  );
}
