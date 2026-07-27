'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Col, Row, message } from 'antd'
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  PageShell,
  Select,
  Space,
  Statistic,
  Switch,
  Tabs,
  Tag,
} from '@m5/ui'
import type {
  ConfigItem,
  ConfigValue,
  SettingsSnapshot,
} from './settings-data'

export default function SettingsClient({
  snapshot,
}: {
  snapshot: SettingsSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [saved, setSaved] = useState(false)
  const [configValues, setConfigValues] = useState<Record<string, ConfigValue>>({})
  const [showImportModal, setShowImportModal] = useState(false)

  const allItems = useMemo(
    () => snapshot.categories.flatMap((category) => category.items),
    [snapshot.categories]
  )
  const switchItems = useMemo(
    () => allItems.filter((item) => item.type === 'switch'),
    [allItems]
  )
  const enabledCount = useMemo(
    () => switchItems.filter((item) => getValue(item) === true).length,
    [switchItems, configValues]
  )

  function getValue(item: ConfigItem): ConfigValue {
    return configValues[item.id] !== undefined ? configValues[item.id] : item.value
  }

  function updateValue(id: string, value: ConfigValue) {
    setConfigValues((current) => ({ ...current, [id]: value }))
    setSaved(false)
  }

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  function handleSave() {
    setSaved(true)
    message.success('所有配置已保存（mock）')
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>设置中心</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              配置 · 通知 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              未读通知: {snapshot.summary.unreadNotifications} 条
            </span>
            {saved ? <Tag color="green">已保存</Tag> : null}
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
          </Space>
        </div>

        {snapshot.error ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            {snapshot.error}
          </div>
        ) : null}

        <Card size="small">
          <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            generatedAt {snapshot.generatedAt} · 当前页面已完成 server wrapper + snapshot loader + client renderer
            拆层，配置写入、导入导出仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="配置项" value={snapshot.summary.totalItems} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="已启用开关" value={`${enabledCount}/${switchItems.length}`} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="配置分类" value={snapshot.summary.categoryCount} suffix="类" />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="未读通知" value={snapshot.summary.unreadNotifications} valueStyle={{ color: '#f87171' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="手动修改" value={Object.keys(configValues).length} suffix={`/${allItems.length}`} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={18}>
            <Tabs
              items={snapshot.categories.map((category) => ({
                key: category.name,
                label: `${category.icon} ${category.name}`,
                children: (
                  <Card>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                          <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontSize: 12, width: 180 }}>配置项</th>
                          <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontSize: 12 }}>当前值</th>
                          <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontSize: 12 }}>说明</th>
                          <th style={{ padding: '8px 12px', width: 80 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {category.items.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ color: '#f8fafc', fontSize: 14, fontWeight: 500 }}>{item.label}</div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              {item.type === 'switch' ? (
                                <Switch checked={getValue(item) === true} onChange={(value) => updateValue(item.id, value)} />
                              ) : item.type === 'select' ? (
                                <Select
                                  value={String(getValue(item))}
                                  onChange={(value) => updateValue(item.id, value)}
                                  style={{ width: 180 }}
                                  options={item.options || []}
                                />
                              ) : item.type === 'number' ? (
                                <Input
                                  type="number"
                                  value={String(getValue(item))}
                                  onChange={(event) => updateValue(item.id, Number(event.target.value))}
                                  style={{ width: 140 }}
                                />
                              ) : (
                                <Input
                                  value={String(getValue(item))}
                                  onChange={(event) => updateValue(item.id, event.target.value)}
                                  style={{ width: 220 }}
                                />
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 13 }}>{item.desc}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <Button size="small" onClick={() => message.success(`已复制: ${item.key}=${String(getValue(item))}`)}>
                                复制
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                ),
              }))}
            />
          </Col>
          <Col span={6}>
            <Card title="通知中心" style={{ marginBottom: 16 }}>
              {snapshot.notifications.length ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {snapshot.notifications.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: item.read ? 'transparent' : 'rgba(96, 165, 250, 0.08)',
                        borderLeft: item.read ? '2px solid transparent' : '2px solid #60a5fa',
                        cursor: 'pointer',
                      }}
                      onClick={() => message.info(`通知: ${item.message}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Tag color={item.type === '告警' ? 'red' : item.type === '提醒' ? 'blue' : 'default'}>
                          {item.type}
                        </Tag>
                        <span style={{ color: '#94a3b8', fontSize: 11 }}>{item.time}</span>
                      </div>
                      <div style={{ color: '#e2e8f0', fontSize: 13, marginTop: 4 }}>{item.message}</div>
                    </div>
                  ))}
                </Space>
              ) : (
                <Empty description="暂无通知" />
              )}
            </Card>
            <Card title="批量操作">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  onClick={() => {
                    setConfigValues({})
                    setSaved(false)
                    message.info('已重置未保存修改')
                  }}
                >
                  重置更改
                </Button>
                <Button block onClick={() => setShowImportModal(true)}>
                  导入配置
                </Button>
                <Button block onClick={() => message.info('导出配置仍处于 mock 演示态。')}>
                  导出配置
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => message.warning('确认恢复默认？所有自定义配置将丢失。')}>
            恢复默认
          </Button>
          <Button
            onClick={() => {
              setConfigValues({})
              setSaved(true)
              message.success('已重置并保存默认配置（mock）')
            }}
          >
            重置并保存
          </Button>
          <Button type="primary" onClick={handleSave}>
            保存全部配置
          </Button>
        </div>

        <Modal
          title="导入配置"
          open={showImportModal}
          onCancel={() => setShowImportModal(false)}
          onOk={() => {
            message.success('配置已导入（mock）')
            setShowImportModal(false)
            handleRefresh()
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input.TextArea rows={6} placeholder='粘贴JSON配置，例如: {"businessHours":"09:00-23:00","maxCapacity":300}' />
            <div style={{ color: '#94a3b8', fontSize: 12 }}>支持从其他门店复制配置 JSON</div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
