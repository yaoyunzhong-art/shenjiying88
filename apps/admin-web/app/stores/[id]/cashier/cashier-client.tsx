'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Empty as AntEmpty, List, Spin, Typography, message } from 'antd'
import { DollarOutlined, ReloadOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, CashierPanel, Input, PageShell, Space, Statistic, Tag } from '@m5/ui'
import { fetchConsumptionHistory, searchMember, type CashierSnapshot, type ConsumptionRecord, type MemberProfile } from './cashier-data'

const { Text } = Typography

const DIAGNOSTIC_COLORS = {
  stable: 'green',
  watch: 'orange',
  risk: 'red',
} as const

function MemberInfoCard({ member, onCheckout }: { member: MemberProfile; onCheckout: () => void }) {
  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          <span>{member.name}</span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {member.level}
          </Text>
        </Space>
      }
      size="small"
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          卡号: {member.cardNo} | 手机: {member.phone}
        </Text>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <Statistic title="账户余额" value={member.balance.toFixed(2)} prefix="¥" valueStyle={{ color: '#fbbf24', fontSize: 18 }} />
        <Statistic title="积分" value={member.points} suffix="分" valueStyle={{ color: '#93c5fd', fontSize: 18 }} />
        <Statistic title="会员等级" value={member.level} valueStyle={{ color: '#e2e8f0', fontSize: 18 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button type="primary" icon={<DollarOutlined />} onClick={onCheckout}>
          收银结账
        </Button>
      </div>
    </Card>
  )
}

function ConsumptionHistory({ records }: { records: ConsumptionRecord[] }) {
  const typeColor = {
    sale: '#1677ff',
    refund: '#ff4d4f',
    topup: '#52c41a',
  } as const

  if (!records.length) {
    return (
      <Card size="small">
        <AntEmpty description="暂无消费记录" image={AntEmpty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    )
  }

  return (
    <Card title="消费记录" size="small">
      <List
        dataSource={records}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            extra={
              <Text strong style={{ color: typeColor[item.type] }}>
                {item.type === 'refund' ? '-' : '+'}¥{item.amount.toFixed(2)}
              </Text>
            }
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text>{item.description}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {item.orderNo}
                  </Text>
                </Space>
              }
              description={
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.time}
                  </Text>
                  <Text style={{ fontSize: 12, color: typeColor[item.type] }}>{item.type}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  )
}

export default function CashierClient({ snapshot }: { snapshot: CashierSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedMember, setSearchedMember] = useState<MemberProfile | null>(null)
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      message.warning('请输入手机号或会员卡号')
      return
    }

    setSearching(true)
    setSearchError(null)
    setSearchedMember(null)
    setConsumptionRecords([])
    setRecordsError(null)

    try {
      const member = await searchMember(searchQuery)
      if (!member) {
        message.info('未找到该会员')
        return
      }

      setSearchedMember(member)
      setLoadingRecords(true)
      try {
        setConsumptionRecords(await fetchConsumptionHistory(member.id))
      } catch (error) {
        const current = error instanceof Error ? error.message : '加载消费记录失败'
        setRecordsError(current)
        message.error(current)
      } finally {
        setLoadingRecords(false)
      }
    } catch (error) {
      const current = error instanceof Error ? error.message : '查询失败，请重试'
      setSearchError(current)
      message.error(current)
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  return (
    <PageShell title="会员收银" subtitle="server wrapper + snapshot loader + client renderer">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {snapshot.error ? (
          <Card size="small">
            <span style={{ color: '#fbbf24', fontSize: 13 }}>{snapshot.error}</span>
          </Card>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>会员收银</h2>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
              会员检索 · 消费记录 · 收银工作台 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </div>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={() => message.info('交班导出仍处于结构固证演示态。')}>导出交班</Button>
          </Space>
        </div>

        <Card title="来源态诊断" subtitle="首屏快照、SDK 查询与演示写链路边界">
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {snapshot.diagnostics.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: 12,
                  padding: 14,
                  background: 'rgba(15, 23, 42, 0.35)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.title}</span>
                  <Tag color={DIAGNOSTIC_COLORS[item.status]}>{item.status}</Tag>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </Card>

        <CashierPanel
          title={snapshot.cashierTitle}
          cashierName={snapshot.cashierName}
          cashierStatus="active"
          shiftInfo={snapshot.shiftInfo}
          metrics={snapshot.summary}
          transactions={snapshot.transactions}
          tillStatus={snapshot.tillStatus}
        />

        <Card size="small">
          <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            generatedAt {snapshot.generatedAt} · refreshPath {snapshot.refreshPath} · {snapshot.note}
          </div>
        </Card>

        <Card title="会员查询" size="small">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入手机号 / 会员卡号"
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={searching}>
              查询
            </Button>
          </Space.Compact>
        </Card>

        {searchError && !searching ? (
          <Card size="small">
            <Space>
              <Text type="danger">{searchError}</Text>
              <Button size="small" icon={<ReloadOutlined />} onClick={handleSearch}>
                重试
              </Button>
            </Space>
          </Card>
        ) : null}

        {searchedMember && !searchError ? (
          <MemberInfoCard member={searchedMember} onCheckout={() => message.info('收银结账仍处于结构固证演示态。')} />
        ) : null}

        {loadingRecords ? (
          <Spin tip="加载消费记录...">
            <div style={{ padding: 24 }} />
          </Spin>
        ) : null}

        {recordsError && !loadingRecords && searchedMember ? (
          <Card size="small">
            <Space>
              <Text type="danger">{recordsError}</Text>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={async () => {
                  setRecordsError(null)
                  setLoadingRecords(true)
                  try {
                    setConsumptionRecords(await fetchConsumptionHistory(searchedMember.id))
                  } catch (error) {
                    setRecordsError(error instanceof Error ? error.message : '加载消费记录失败')
                  } finally {
                    setLoadingRecords(false)
                  }
                }}
              >
                重试
              </Button>
            </Space>
          </Card>
        ) : null}

        {!loadingRecords && !recordsError && searchedMember ? <ConsumptionHistory records={consumptionRecords} /> : null}
      </Space>
    </PageShell>
  )
}
