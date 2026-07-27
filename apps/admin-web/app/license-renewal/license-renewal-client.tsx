'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Modal, PageShell, Select, Space, Statistic, Tabs, Tag } from '@m5/ui'
import type { LicenseRenewalSnapshot } from './license-renewal-data'
import type { RenewalRecord, RenewalStrategy } from './types'

const refreshCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  borderRadius: 12,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.3)',
  padding: 12,
  color: '#cbd5e1',
  fontSize: 12,
} as const

const refreshButtonStyle = {
  borderRadius: 8,
  border: '1px solid rgba(96, 165, 250, 0.35)',
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#bfdbfe',
  padding: '8px 14px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
} as const

const panelStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.16)',
  background: 'rgba(15, 23, 42, 0.42)',
  padding: 16,
} as const

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: 13,
}

const thStyle = {
  padding: '10px 12px',
  textAlign: 'left' as const,
  borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
  color: '#94a3b8',
  fontWeight: 600,
}

const tdStyle = {
  padding: '12px',
  borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
  color: '#e2e8f0',
  verticalAlign: 'top' as const,
}

interface StrategyFormState {
  name: string
  description: string
  price: string
  duration: string
  durationUnit: RenewalStrategy['durationUnit']
  maxUsers: string
  maxStores: string
  features: string
  isActive: boolean
}

function createFormState(strategy?: RenewalStrategy): StrategyFormState {
  if (!strategy) {
    return {
      name: '',
      description: '',
      price: '',
      duration: '12',
      durationUnit: 'month',
      maxUsers: '20',
      maxStores: '3',
      features: '',
      isActive: true,
    }
  }

  return {
    name: strategy.name,
    description: strategy.description,
    price: String(strategy.price),
    duration: String(strategy.duration),
    durationUnit: strategy.durationUnit,
    maxUsers: String(strategy.maxUsers),
    maxStores: String(strategy.maxStores),
    features: strategy.features.join(', '),
    isActive: strategy.isActive,
  }
}

function formatDuration(strategy: RenewalStrategy) {
  const unitLabel =
    strategy.durationUnit === 'year' ? '年' : strategy.durationUnit === 'month' ? '个月' : '天'
  return `${strategy.duration}${unitLabel}`
}

function renderRecordStatus(status: RenewalRecord['status']) {
  if (status === 'success') return <Tag variant="success">成功</Tag>
  if (status === 'pending') return <Tag variant="warning">待处理</Tag>
  return <Tag variant="error">失败</Tag>
}

export default function LicenseRenewalClient({ snapshot }: { snapshot: LicenseRenewalSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [activeTab, setActiveTab] = useState('strategy')
  const [strategies, setStrategies] = useState<RenewalStrategy[]>(snapshot.strategies)
  const [records, setRecords] = useState<RenewalRecord[]>(snapshot.records)
  const [search, setSearch] = useState('')
  const [recordStatus, setRecordStatus] = useState('')
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null)
  const [showStrategyModal, setShowStrategyModal] = useState(false)
  const [strategyForm, setStrategyForm] = useState<StrategyFormState>(createFormState())

  const filteredStrategies = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return strategies
    return strategies.filter(
      (strategy) =>
        strategy.name.toLowerCase().includes(keyword) ||
        strategy.description.toLowerCase().includes(keyword),
    )
  }, [search, strategies])

  const filteredRecords = useMemo(() => {
    if (!recordStatus) return records
    return records.filter((record) => record.status === recordStatus)
  }, [recordStatus, records])

  const runtimeStats = useMemo(() => {
    const totalStrategies = strategies.length
    const activeStrategies = strategies.filter((strategy) => strategy.isActive).length
    const autoRenewalEnabled = records.filter((record) => record.autoRenewal).length
    const successCount = records.filter((record) => record.status === 'success').length
    return {
      totalStrategies,
      activeStrategies,
      totalRecords: records.length,
      successRate: records.length === 0 ? 0 : Math.round((successCount / records.length) * 100),
      autoRenewalEnabled,
    }
  }, [records, strategies])

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  function handleOpenCreate() {
    setEditingStrategyId(null)
    setStrategyForm(createFormState())
    setShowStrategyModal(true)
  }

  function handleOpenEdit(strategy: RenewalStrategy) {
    setEditingStrategyId(strategy.id)
    setStrategyForm(createFormState(strategy))
    setShowStrategyModal(true)
  }

  function handleSaveStrategy() {
    const payload: RenewalStrategy = {
      id: editingStrategyId ?? `strategy-${Date.now()}`,
      name: strategyForm.name.trim() || '未命名套餐',
      description: strategyForm.description.trim() || '待补充套餐描述',
      price: Number(strategyForm.price) || 0,
      duration: Number(strategyForm.duration) || 1,
      durationUnit: strategyForm.durationUnit,
      maxUsers: Number(strategyForm.maxUsers) || 1,
      maxStores: Number(strategyForm.maxStores) || 1,
      features: strategyForm.features
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: strategyForm.isActive,
      createdAt: editingStrategyId
        ? strategies.find((strategy) => strategy.id === editingStrategyId)?.createdAt ?? snapshot.generatedAt
        : snapshot.generatedAt,
      updatedAt: new Date().toISOString(),
    }

    setStrategies((current) => {
      if (!editingStrategyId) return [payload, ...current]
      return current.map((strategy) => (strategy.id === editingStrategyId ? payload : strategy))
    })

    setRecords((current) =>
      editingStrategyId
        ? current.map((record) =>
            record.strategyId === editingStrategyId
              ? { ...record, strategyName: payload.name }
              : record,
          )
        : current,
    )

    setShowStrategyModal(false)
  }

  function handleDeleteStrategy(strategyId: string) {
    setStrategies((current) => current.filter((strategy) => strategy.id !== strategyId))
  }

  function handleToggleStrategy(strategyId: string) {
    setStrategies((current) =>
      current.map((strategy) =>
        strategy.id === strategyId
          ? { ...strategy, isActive: !strategy.isActive, updatedAt: new Date().toISOString() }
          : strategy,
      ),
    )
  }

  function handleToggleAutoRenewal(recordId: string) {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId ? { ...record, autoRenewal: !record.autoRenewal } : record,
      ),
    )
  }

  return (
    <PageShell title="License 续费管理">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={refreshCardStyle}>
          <div>
            客户端快照上下文: {snapshot.sourceLabel} · 刷新路径: {snapshot.refreshPath}
          </div>
          <button type="button" onClick={handleRefresh} style={refreshButtonStyle}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
          <Card>
            <Statistic label="License 总数" value={snapshot.licenseHealth.total} />
          </Card>
          <Card>
            <Statistic label="7 天内到期" value={snapshot.licenseHealth.soonExpiring} variant="warning" />
          </Card>
          <Card>
            <Statistic label="已过期" value={snapshot.licenseHealth.expired} />
          </Card>
          <Card>
            <Statistic
              label="自动续费开启"
              value={runtimeStats.autoRenewalEnabled}
              variant="success"
            />
          </Card>
        </div>

        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16 }}>
            <Statistic label="策略总数" value={runtimeStats.totalStrategies} />
            <Statistic label="活跃策略" value={runtimeStats.activeStrategies} variant="success" />
            <Statistic label="续费记录" value={runtimeStats.totalRecords} />
            <Statistic label="成功率" value={`${runtimeStats.successRate}%`} />
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>快照生成</div>
              <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 600 }}>{snapshot.deliveryMode}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>
                {snapshot.generatedAt.slice(0, 19).replace('T', ' ')}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, color: '#f8fafc' }}>License 套餐管理</h2>
              <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 12 }}>
                套餐策略、续费记录和自动续费开关均使用当前快照内存态演示。
              </div>
            </div>
            <Button variant="primary" onClick={handleOpenCreate}>
              + 创建套餐
            </Button>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(value) => setActiveTab(String(value))}
            items={[
              { key: 'strategy', label: `套餐管理 (${filteredStrategies.length})` },
              { key: 'records', label: `续费记录 (${filteredRecords.length})` },
              { key: 'auto-renewal', label: `自动续费 (${records.filter((record) => record.autoRenewal).length})` },
            ]}
          />

          {activeTab === 'strategy' && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <Input
                  placeholder="搜索套餐名称/描述"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  style={{ width: 260 }}
                />
                <div style={{ color: '#94a3b8', fontSize: 12 }}>
                  当前共 {filteredStrategies.length} 个套餐，支持本地编辑与状态切换。
                </div>
              </div>

              <div style={panelStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>套餐</th>
                      <th style={thStyle}>价格</th>
                      <th style={thStyle}>时长</th>
                      <th style={thStyle}>配额</th>
                      <th style={thStyle}>功能</th>
                      <th style={thStyle}>状态</th>
                      <th style={thStyle}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStrategies.map((strategy) => (
                      <tr key={strategy.id}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600 }}>{strategy.name}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{strategy.description}</div>
                        </td>
                        <td style={tdStyle}>¥{strategy.price.toLocaleString()}</td>
                        <td style={tdStyle}>{formatDuration(strategy)}</td>
                        <td style={tdStyle}>
                          用户 {strategy.maxUsers} / 门店 {strategy.maxStores}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {strategy.features.map((feature) => (
                              <Tag key={feature}>{feature}</Tag>
                            ))}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          {strategy.isActive ? <Tag variant="success">已启用</Tag> : <Tag>已停用</Tag>}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Button size="sm" onClick={() => handleOpenEdit(strategy)}>
                              编辑
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleToggleStrategy(strategy.id)}>
                              {strategy.isActive ? '停用' : '启用'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteStrategy(strategy.id)}>
                              删除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <Select
                  value={recordStatus}
                  placeholder="筛选状态"
                  onChange={(value) => setRecordStatus(String(value))}
                  options={[
                    { value: '', label: '全部状态' },
                    { value: 'success', label: '成功' },
                    { value: 'pending', label: '待处理' },
                    { value: 'failed', label: '失败' },
                  ]}
                  style={{ width: 180 }}
                />
                <div style={{ color: '#94a3b8', fontSize: 12 }}>
                  仅保留本地筛选，后续可继续替换为真实续费记录接口。
                </div>
              </div>

              <div style={panelStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>License</th>
                      <th style={thStyle}>套餐</th>
                      <th style={thStyle}>金额</th>
                      <th style={thStyle}>状态</th>
                      <th style={thStyle}>自动续费</th>
                      <th style={thStyle}>到期时间</th>
                      <th style={thStyle}>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.id}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600 }}>{record.licenseName}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.licenseId}</div>
                        </td>
                        <td style={tdStyle}>{record.strategyName}</td>
                        <td style={tdStyle}>¥{record.amount.toLocaleString()}</td>
                        <td style={tdStyle}>{renderRecordStatus(record.status)}</td>
                        <td style={tdStyle}>
                          <Button size="sm" variant={record.autoRenewal ? 'primary' : 'outline'} onClick={() => handleToggleAutoRenewal(record.id)}>
                            {record.autoRenewal ? '已开启' : '未开启'}
                          </Button>
                        </td>
                        <td style={tdStyle}>{record.expiresAt}</td>
                        <td style={tdStyle}>{record.remark ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'auto-renewal' && (
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
              <div style={panelStyle}>
                <h3 style={{ marginTop: 0, color: '#f8fafc' }}>提醒时间线</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {snapshot.reminderTimeline.map((item) => (
                    <div key={item.id} style={{ borderLeft: '2px solid rgba(96, 165, 250, 0.5)', paddingLeft: 12 }}>
                      <div style={{ color: '#bfdbfe', fontWeight: 600 }}>
                        {item.due} · {item.title}
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={panelStyle}>
                <h3 style={{ marginTop: 0, color: '#f8fafc' }}>自动续费概览</h3>
                <div style={{ display: 'grid', gap: 10, fontSize: 13, color: '#cbd5e1' }}>
                  <div>已开启自动续费: {records.filter((record) => record.autoRenewal).length} 条</div>
                  <div>待人工跟进: {records.filter((record) => !record.autoRenewal).length} 条</div>
                  <div>快照来源: {snapshot.sourceLabel}</div>
                  <div>说明: {snapshot.note}</div>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Modal
          title={editingStrategyId ? '编辑套餐' : '创建套餐'}
          open={showStrategyModal}
          onClose={() => setShowStrategyModal(false)}
          width={620}
        >
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#cbd5e1', fontSize: 13 }}>套餐名称</span>
              <input
                value={strategyForm.name}
                onChange={(event) =>
                  setStrategyForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="输入套餐名称"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155' }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#cbd5e1', fontSize: 13 }}>套餐描述</span>
              <textarea
                value={strategyForm.description}
                onChange={(event) =>
                  setStrategyForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={3}
                placeholder="输入套餐描述"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', resize: 'vertical' }}
              />
            </label>

            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: '#cbd5e1', fontSize: 13 }}>价格</span>
                <input
                  type="number"
                  value={strategyForm.price}
                  onChange={(event) =>
                    setStrategyForm((current) => ({ ...current, price: event.target.value }))
                  }
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: '#cbd5e1', fontSize: 13 }}>时长</span>
                <input
                  type="number"
                  value={strategyForm.duration}
                  onChange={(event) =>
                    setStrategyForm((current) => ({ ...current, duration: event.target.value }))
                  }
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: '#cbd5e1', fontSize: 13 }}>单位</span>
                <select
                  value={strategyForm.durationUnit}
                  onChange={(event) =>
                    setStrategyForm((current) => ({
                      ...current,
                      durationUnit: event.target.value as RenewalStrategy['durationUnit'],
                    }))
                  }
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155' }}
                >
                  <option value="day">天</option>
                  <option value="month">个月</option>
                  <option value="year">年</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: '#cbd5e1', fontSize: 13 }}>最大用户数</span>
                <input
                  type="number"
                  value={strategyForm.maxUsers}
                  onChange={(event) =>
                    setStrategyForm((current) => ({ ...current, maxUsers: event.target.value }))
                  }
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: '#cbd5e1', fontSize: 13 }}>最大门店数</span>
                <input
                  type="number"
                  value={strategyForm.maxStores}
                  onChange={(event) =>
                    setStrategyForm((current) => ({ ...current, maxStores: event.target.value }))
                  }
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155' }}
                />
              </label>
            </div>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#cbd5e1', fontSize: 13 }}>功能权限</span>
              <input
                value={strategyForm.features}
                onChange={(event) =>
                  setStrategyForm((current) => ({ ...current, features: event.target.value }))
                }
                placeholder="以逗号分隔，例如 basic, analytics, api"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={strategyForm.isActive}
                onChange={(event) =>
                  setStrategyForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              启用该套餐
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button variant="ghost" onClick={() => setShowStrategyModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSaveStrategy}>
              保存套餐
            </Button>
          </div>
        </Modal>
      </Space>
    </PageShell>
  )
}
