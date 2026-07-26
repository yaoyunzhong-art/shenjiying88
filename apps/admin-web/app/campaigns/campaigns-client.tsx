'use client'

import { useMemo, useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Modal, Form, Input, Select, DatePicker, InputNumber, message } from 'antd'
import dayjs from 'dayjs'
import type { Campaign, CampaignsSnapshotDelivery } from './campaigns-data'

type CampaignTab = 'active' | 'draft' | 'completed' | 'all'

interface CampaignFormValues {
  name: string
  description: string
  type: Campaign['type']
  startDate: string
  endDate: string
  budgetCents: number
  targetMetric: string
  targetValue: number
  channels: string[]
}

function fmtCents(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  return `${sign}¥${(abs / 100).toFixed(2)}`
}

function fmtPercent(value: number, target: number): string {
  if (target === 0) return '0%'
  return `${((value / target) * 100).toFixed(1)}%`
}

function statusLabel(status: Campaign['status']): string {
  const map: Record<string, string> = {
    draft: '草稿', active: '进行中', paused: '已暂停',
    completed: '已完成', cancelled: '已取消',
  }
  return map[status] ?? status
}

function statusColor(status: Campaign['status']): string {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

function typeLabel(type: Campaign['type']): string {
  const map: Record<string, string> = {
    promotion: '促销活动', 'new-member': '拉新活动',
    referral: '推荐有礼', seasonal: '季节活动', clearance: '清仓活动',
  }
  return map[type] ?? type
}

const channelLabels: Record<string, string> = {
  'mini-app': '小程序', wechat: '公众号', douyin: '抖音',
  sms: '短信', 'in-store': '门店',
}

const targetMetricLabels: Record<string, string> = {
  revenue: '营收', 'new-users': '新用户', redemption: '核销数', traffic: '流量',
}

const defaultFormValues: CampaignFormValues = {
  name: '',
  description: '',
  type: 'promotion',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
  budgetCents: 100000,
  targetMetric: 'revenue',
  targetValue: 100000,
  channels: ['mini-app'],
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const payload = await response.json()
  if (!payload.success) {
    throw new Error(payload.message || 'API error')
  }
  return payload.data as T
}

export default function CampaignsClient({
  snapshot,
}: {
  snapshot: CampaignsSnapshotDelivery
}) {
  const router = useRouter()
  const [tabView, setTabView] = useState<CampaignTab>('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isRefreshing, startRefresh] = useTransition()
  const [form] = Form.useForm<CampaignFormValues>()
  const campaigns = snapshot.campaigns

  const filtered = useMemo(() => {
    return campaigns.filter((campaign) => {
      if (tabView === 'all') return true
      if (tabView === 'active') return campaign.status === 'active' || campaign.status === 'paused'
      if (tabView === 'draft') return campaign.status === 'draft'
      if (tabView === 'completed') return campaign.status === 'completed' || campaign.status === 'cancelled'
      return true
    })
  }, [campaigns, tabView])

  const summary = useMemo(() => {
    const totalCampaigns = campaigns.length
    const activeCount = campaigns.filter((campaign) => campaign.status === 'active').length
    const draftCount = campaigns.filter((campaign) => campaign.status === 'draft').length
    const endedCount = campaigns.filter((campaign) => campaign.status === 'completed' || campaign.status === 'cancelled').length
    const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budgetCents, 0)
    const totalSpent = campaigns.reduce((sum, campaign) => sum + campaign.spentCents, 0)
    return { totalCampaigns, activeCount, draftCount, endedCount, totalBudget, totalSpent }
  }, [campaigns])

  const openModal = useCallback(() => {
    form.resetFields()
    form.setFieldsValue(defaultFormValues)
    setModalOpen(true)
  }, [form])

  const handleCreate = useCallback(async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const body = {
        ...values,
        budgetCents: Math.round(values.budgetCents * 100),
        targetValue: +values.targetValue,
        startDate: dayjs(values.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(values.endDate).format('YYYY-MM-DD'),
      }
      await apiFetch('/api/brand/campaigns', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      message.success('活动创建成功')
      setModalOpen(false)
      form.resetFields()
      startRefresh(() => router.refresh())
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'errorFields' in error) return
      const messageText = error instanceof Error ? error.message : '创建失败'
      message.error(messageText)
    } finally {
      setSubmitting(false)
    }
  }, [form, router, startRefresh])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">营销活动</h1>
          <p className="text-sm text-gray-500 mt-1">品牌活动管理与投放效果追踪</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            disabled={isRefreshing}
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          <button
            type="button"
            onClick={openModal}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            + 新建活动
          </button>
        </div>
      </div>

      {snapshot.error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{snapshot.error}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">活动总数</p>
          <p className="text-2xl font-bold mt-1">{summary.totalCampaigns}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">进行中</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{summary.activeCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总预算</p>
          <p className="text-2xl font-bold mt-1">{fmtCents(summary.totalBudget)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已花费</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{fmtCents(summary.totalSpent)}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总活动</p>
          <p className="text-2xl font-bold mt-1">{summary.totalCampaigns}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">未开始</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{summary.draftCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">进行中</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{summary.activeCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已结束</p>
          <p className="text-2xl font-bold mt-1 text-gray-600">{summary.endedCount}</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['active', 'draft', 'completed', 'all'] as CampaignTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ active: '进行中', draft: '草稿', completed: '已完成', all: '全部' }[tab]}
            </button>
          ))}
        </nav>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <div className="text-gray-300 mb-3">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <p className="text-lg text-gray-500 mb-1">暂无活动</p>
          <p className="text-sm text-gray-400">
            {tabView === 'all' ? '点击上方 "+ 新建活动" 创建第一个营销活动' : '当前筛选条件下没有营销活动'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((campaign) => (
            <div key={campaign.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-gray-900">{campaign.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(campaign.status)}`}>
                      {statusLabel(campaign.status)}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5 py-0.5">
                      {typeLabel(campaign.type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">{campaign.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>{campaign.startDate} ~ {campaign.endDate}</span>
                    <span>预算: {fmtCents(campaign.budgetCents)}</span>
                    <span>已花费: {fmtCents(campaign.spentCents)}</span>
                    <span>使用量: {campaign.usageCount}</span>
                    <span>渠道: {campaign.channels.map((channel) => channelLabels[channel] ?? channel).join('/')}</span>
                  </div>
                </div>
                <div className="text-right ml-4 min-w-[120px] shrink-0">
                  <p className="text-xs text-gray-400">{targetMetricLabels[campaign.targetMetric] ?? campaign.targetMetric}</p>
                  <p className="text-lg font-bold">{fmtPercent(campaign.currentValue, campaign.targetValue)}</p>
                  <p className="text-xs text-gray-400">
                    {campaign.currentValue}/{campaign.targetValue}
                  </p>
                </div>
              </div>
              {campaign.targetValue > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min((campaign.currentValue / campaign.targetValue) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        title="新建活动"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText="创建"
        cancelText="取消"
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={defaultFormValues}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="活动名称"
            rules={[{ required: true, message: '请输入活动名称' }, { max: 50, message: '最多50字' }]}
          >
            <Input placeholder="例: 夏日狂欢季" />
          </Form.Item>

          <Form.Item name="description" label="活动描述">
            <Input.TextArea rows={2} placeholder="简述活动规则和优惠内容" maxLength={200} />
          </Form.Item>

          <Form.Item
            name="type"
            label="活动类型"
            rules={[{ required: true, message: '请选择活动类型' }]}
          >
            <Select>
              <Select.Option value="promotion">促销活动</Select.Option>
              <Select.Option value="new-member">拉新活动</Select.Option>
              <Select.Option value="referral">推荐有礼</Select.Option>
              <Select.Option value="seasonal">季节活动</Select.Option>
              <Select.Option value="clearance">清仓活动</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item
              name="startDate"
              label="开始日期"
              className="flex-1"
              rules={[{ required: true, message: '请选择开始日期' }]}
              getValueFromEvent={(date: dayjs.Dayjs | null) => date?.format('YYYY-MM-DD') ?? ''}
              getValueProps={(value: string) => ({ value: value ? dayjs(value) : null })}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              name="endDate"
              label="结束日期"
              className="flex-1"
              rules={[{ required: true, message: '请选择结束日期' }]}
              getValueFromEvent={(date: dayjs.Dayjs | null) => date?.format('YYYY-MM-DD') ?? ''}
              getValueProps={(value: string) => ({ value: value ? dayjs(value) : null })}
            >
              <DatePicker className="w-full" />
            </Form.Item>
          </div>

          <Form.Item
            name="budgetCents"
            label="预算(元)"
            rules={[{ required: true, message: '请输入预算' }]}
          >
            <InputNumber className="w-full" min={0} precision={2} placeholder="例: 1000" />
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item
              name="targetMetric"
              label="目标指标"
              className="flex-1"
              rules={[{ required: true, message: '请选择目标指标' }]}
            >
              <Select>
                <Select.Option value="revenue">营收</Select.Option>
                <Select.Option value="new-users">新用户</Select.Option>
                <Select.Option value="redemption">核销数</Select.Option>
                <Select.Option value="traffic">流量</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="targetValue"
              label="目标值"
              className="flex-1"
              rules={[{ required: true, message: '请输入目标值' }]}
            >
              <InputNumber className="w-full" min={1} precision={0} placeholder="例: 10000" />
            </Form.Item>
          </div>

          <Form.Item
            name="channels"
            label="投放渠道"
            rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一个渠道' }]}
          >
            <Select mode="multiple" placeholder="请选择投放渠道">
              <Select.Option value="mini-app">小程序</Select.Option>
              <Select.Option value="wechat">公众号</Select.Option>
              <Select.Option value="douyin">抖音</Select.Option>
              <Select.Option value="sms">短信</Select.Option>
              <Select.Option value="in-store">门店</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
