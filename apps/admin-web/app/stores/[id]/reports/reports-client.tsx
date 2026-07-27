'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import { Col, Row, message } from 'antd'
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  PageShell,
  Progress,
  Select,
  Space,
  Statistic,
  Tabs,
  Tag,
} from '@m5/ui'
import type { AutoReportRecord, ReportsSnapshot, ReportStatus } from './reports-data'

const STATUS_LABELS: Record<ReportStatus, [string, string]> = {
  ready: ['green', '就绪'],
  generating: ['blue', '生成中'],
  overdue: ['orange', '逾期'],
  failed: ['red', '失败'],
}

export default function ReportsClient({
  snapshot,
}: {
  snapshot: ReportsSnapshot
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [tabKey, setTabKey] = useState('overview')
  const [selectedReport, setSelectedReport] = useState<AutoReportRecord | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const filteredAutoReports = useMemo(() => {
    const keyword = search.trim()

    return snapshot.autoReports.filter((item) => {
      const matchesKeyword = !keyword || item.name.includes(keyword) || item.desc.includes(keyword)
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter

      return matchesKeyword && matchesCategory
    })
  }, [categoryFilter, search, snapshot.autoReports])

  const filteredCustomReports = useMemo(() => {
    const keyword = search.trim()

    return snapshot.customReports.filter(
      (item) => !keyword || item.name.includes(keyword) || item.creator.includes(keyword)
    )
  }, [search, snapshot.customReports])

  

  function handleMockCreate() {
    message.success('报表创建中（mock）')
    setShowCreate(false)
    handleRefresh()
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>报表中心</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              自动报表 · 自定义报表 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={() => message.info('报表模板仍处于 mock 演示态。')}>报表模板</Button>
            <Button type="primary" onClick={() => setShowCreate(true)}>
              新建报表
            </Button>
          </Space>
        </div>

        {snapshot.error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            {snapshot.error}
          </div>
        )}

        <Card size="small">
          <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            generatedAt {snapshot.generatedAt} · 当前页面已完成 server wrapper + snapshot loader + client renderer
            拆层，生成、下载、分享与新建报表仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="可用报表" value={snapshot.summary.totalReports} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="就绪" value={snapshot.summary.readyCount} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="生成中" value={snapshot.summary.generatingCount} valueStyle={{ color: '#60a5fa' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="逾期" value={snapshot.summary.overdueCount} valueStyle={{ color: '#f87171' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="分类" value={snapshot.summary.categoryCount} suffix="种" />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="覆盖率" value={87} suffix="%" valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
        </Row>

        <Card>
          <Space style={{ marginBottom: 12, gap: 8 }} wrap>
            <Input
              placeholder="搜索报表"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: '全部分类' },
                ...snapshot.categories.map((item) => ({ value: item, label: item })),
              ]}
            />
          </Space>

          <Tabs
            activeKey={tabKey}
            onChange={setTabKey}
            items={[
              {
                key: 'overview',
                label: '概览',
                children: (
                  <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
                    {filteredAutoReports.map((item) => (
                      <Card key={item.id} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ color: '#f8fafc', fontWeight: 600 }}>{item.name}</div>
                            <div style={{ color: '#64748b', fontSize: 12 }}>{item.desc}</div>
                          </div>
                          <Space>
                            <Tag>{item.freq}</Tag>
                            <Tag color={STATUS_LABELS[item.status][0]}>{STATUS_LABELS[item.status][1]}</Tag>
                            <Button size="small" onClick={() => setSelectedReport(item)}>
                              详情
                            </Button>
                          </Space>
                        </div>
                      </Card>
                    ))}
                  </Space>
                ),
              },
              {
                key: 'auto',
                label: '自动报表',
                children: filteredAutoReports.length === 0 ? (
                  <Empty description="无匹配自动报表" />
                ) : (
                  <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
                    {filteredAutoReports.map((item) => (
                      <Card key={item.id} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ color: '#f8fafc', fontWeight: 600 }}>{item.name}</div>
                            <div style={{ color: '#64748b', fontSize: 12 }}>分类: {item.category} · 上次生成: {item.last}</div>
                          </div>
                          <Space>
                            <Button size="small" onClick={() => message.info(`${item.id} 生成仍为 mock 演示态。`)}>
                              生成
                            </Button>
                            <Button size="small" onClick={() => message.info(`${item.id} 下载仍为 mock 演示态。`)}>
                              下载
                            </Button>
                          </Space>
                        </div>
                      </Card>
                    ))}
                  </Space>
                ),
              },
              {
                key: 'custom',
                label: '自定义报表',
                children: filteredCustomReports.length === 0 ? (
                  <Empty description="无匹配自定义报表" />
                ) : (
                  <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
                    {filteredCustomReports.map((item) => (
                      <Card key={item.id} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ color: '#f8fafc', fontWeight: 600 }}>{item.name}</div>
                            <div style={{ color: '#64748b', fontSize: 12 }}>创建人: {item.creator} · {item.created}</div>
                          </div>
                          <Space>
                            {item.status === 'generating' ? (
                              <Progress percent={item.progress} size="small" style={{ width: 120 }} />
                            ) : (
                              <Tag color="green">就绪</Tag>
                            )}
                            <Button size="small" onClick={() => message.info(`${item.id} 分享仍为 mock 演示态。`)}>
                              分享
                            </Button>
                          </Space>
                        </div>
                      </Card>
                    ))}
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Modal
          title={`报表详情 - ${selectedReport?.name ?? ''}`}
          open={!!selectedReport}
          onCancel={() => setSelectedReport(null)}
          footer={null}
        >
          {selectedReport && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>分类: {selectedReport.category}</div>
              <div>频率: {selectedReport.freq}</div>
              <div>状态: {STATUS_LABELS[selectedReport.status][1]}</div>
              <div>说明: {selectedReport.desc}</div>
              <div>上次生成: {selectedReport.last}</div>
            </Space>
          )}
        </Modal>

        <Modal
          title="新建报表"
          open={showCreate}
          onCancel={() => setShowCreate(false)}
          onOk={handleMockCreate}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="报表名称" />
            <Select
              placeholder="报表分类"
              style={{ width: '100%' }}
              options={snapshot.categories.map((item) => ({ value: item, label: item }))}
            />
            <Input placeholder="报表说明" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
