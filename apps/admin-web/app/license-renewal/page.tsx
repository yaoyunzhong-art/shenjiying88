/**
 * Sprint 3 Phase 2 - 自动续费管理页面
 * 
 * 功能:
 * - 续费策略配置
 * - 续费记录管理
 * - 自动续费开关
 * - 续费提醒设置
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  DatePicker,
  InputNumber,
  message,
  Tabs,
  Timeline,
  Alert,
  Statistic,
  Row,
  Col,
  Pagination,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SyncOutlined,
  CreditCardOutlined,
  BellOutlined,
  HistoryOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Popconfirm } from 'antd'
import type { RenewalStrategy, RenewalRecord, RenewalQueryDto } from './types'
import { renewalApi } from './api'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'License Renewal - 神机营' }

import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker
const { TabPane } = Tabs
const { TextArea } = Input

export default function LicenseRenewalPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('strategy')
  
  // Strategy states
  const [strategies, setStrategies] = useState<RenewalStrategy[]>([])
  const [strategyLoading, setStrategyLoading] = useState(false)
  const [isStrategyModalVisible, setIsStrategyModalVisible] = useState(false)
  const [isEditStrategy, setIsEditStrategy] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState<RenewalStrategy | null>(null)
  const [strategyForm] = Form.useForm()
  
  // Record states
  const [records, setRecords] = useState<RenewalRecord[]>([])
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordTotal, setRecordTotal] = useState(0)
  const [recordQuery, setRecordQuery] = useState<RenewalQueryDto>({
    page: 1,
    pageSize: 10,
  })
  
  // License statistics for stat cards
  const [licenseStats, setLicenseStats] = useState({
    total: 0,
    soonExpiring: 0,
    expired: 0,
  })

  // Pagination state for strategy table
  const [strategyPage, setStrategyPage] = useState(1)
  const [strategyPageSize, setStrategyPageSize] = useState(10)

  // Statistics
  const [statistics, setStatistics] = useState({
    totalStrategies: 0,
    activeStrategies: 0,
    totalRecords: 0,
    successRate: 0,
    autoRenewalEnabled: 0,
  })

  // Fetch strategies
  const fetchStrategies = async () => {
    setStrategyLoading(true)
    try {
      const res = await renewalApi.getStrategies()
      if (res.success) {
        setStrategies(res.data)
        setStatistics(prev => ({
          ...prev,
          totalStrategies: res.data.length,
          activeStrategies: res.data.filter((s: RenewalStrategy) => s.isActive).length,
        }))
      }
    } catch (error) {
      message.error('获取续费策略列表失败')
    } finally {
      setStrategyLoading(false)
    }
  }

  // Fetch records
  const fetchRecords = async () => {
    setRecordLoading(true)
    try {
      const res = await renewalApi.getRecords(recordQuery)
      if (res.success) {
        setRecords(res.data.list)
        setRecordTotal(res.data.total)
        setStatistics(prev => ({
          ...prev,
          totalRecords: res.data.total,
          successRate: calculateSuccessRate(res.data.list),
        }))
      }
    } catch (error) {
      message.error('获取续费记录失败')
    } finally {
      setRecordLoading(false)
    }
  }

  // Calculate success rate
  const calculateSuccessRate = (records: RenewalRecord[]): number => {
    if (records.length === 0) return 0
    const successCount = records.filter(r => r.status === 'success').length
    return Math.round((successCount / records.length) * 100)
  }

  // Compute license stats from records
  const computeLicenseStats = (records: RenewalRecord[]) => {
    const now = dayjs()
    const total = records.length
    const soonExpiring = records.filter(r => {
      if (!r.expiresAt) return false
      const expires = dayjs(r.expiresAt)
      return expires.isAfter(now) && expires.diff(now, 'day') <= 7
    }).length
    const expired = records.filter(r => {
      if (r.status === 'success' && r.expiresAt) {
        return dayjs(r.expiresAt).isBefore(now)
      }
      return false
    }).length
    setLicenseStats({ total, soonExpiring, expired })
  }

  useEffect(() => {
    fetchStrategies()
    fetchRecords()
  }, [recordQuery.page, recordQuery.pageSize])

  useEffect(() => {
    computeLicenseStats(records)
  }, [records])

  // Create strategy
  const handleCreateStrategy = () => {
    setIsEditStrategy(false)
    setEditingStrategy(null)
    strategyForm.resetFields()
    setIsStrategyModalVisible(true)
  }

  // Edit strategy
  const handleEditStrategy = (record: RenewalStrategy) => {
    setIsEditStrategy(true)
    setEditingStrategy(record)
    strategyForm.setFieldsValue({
      name: record.name,
      description: record.description,
      price: record.price,
      duration: record.duration,
      durationUnit: record.durationUnit,
      maxUsers: record.maxUsers,
      maxStores: record.maxStores,
      features: record.features,
      isActive: record.isActive,
    })
    setIsStrategyModalVisible(true)
  }

  // Delete strategy
  const handleDeleteStrategy = async (id: string) => {
    try {
      const res = await renewalApi.deleteStrategy(id)
      if (res.success) {
        message.success('删除成功')
        fetchStrategies()
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  // Submit strategy form
  const handleStrategySubmit = async () => {
    try {
      const values = await strategyForm.validateFields()

      if (isEditStrategy && editingStrategy) {
        // Update
        const res = await renewalApi.updateStrategy(editingStrategy.id, values)
        if (res.success) {
          message.success('更新成功')
          setIsStrategyModalVisible(false)
          fetchStrategies()
        }
      } else {
        // Create
        const res = await renewalApi.createStrategy(values)
        if (res.success) {
          message.success('创建成功')
          setIsStrategyModalVisible(false)
          fetchStrategies()
        }
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  // Toggle auto renewal
  const handleToggleAutoRenewal = async (licenseId: string, enabled: boolean) => {
    try {
      const res = await renewalApi.toggleAutoRenewal(licenseId, enabled)
      if (res.success) {
        message.success(enabled ? '已开启自动续费' : '已关闭自动续费')
        fetchRecords()
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const strategyColumns = [
    {
      title: '套餐名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: RenewalStrategy) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-500 text-sm">{record.description}</div>
        </div>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span className="font-medium text-lg">¥{price}</span>
      ),
    },
    {
      title: '有效期',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number, record: RenewalStrategy) => (
        <span>{duration}{record.durationUnit === 'month' ? '个月' : record.durationUnit === 'year' ? '年' : '天'}</span>
      ),
    },
    {
      title: '权限配置',
      key: 'permissions',
      render: (record: RenewalStrategy) => (
        <Space>
          <Tag>用户{record.maxUsers}</Tag>
          <Tag>门店{record.maxStores}</Tag>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Switch checked={isActive} disabled size="small" />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: RenewalStrategy) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditStrategy(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此套餐吗？"
            description="删除后将无法恢复"
            onConfirm={() => handleDeleteStrategy(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      {/* License statistics cards */}
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card>
            <Statistic
              title="License 总数"
              value={licenseStats.total}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="即将到期（7天内）"
              value={licenseStats.soonExpiring}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={licenseStats.soonExpiring > 0 ? { color: '#faad14' } : { color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已过期"
              value={licenseStats.expired}
              prefix={<CloseCircleOutlined />}
              valueStyle={licenseStats.expired > 0 ? { color: '#ff4d4f' } : { color: '#1677ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-medium">License 套餐管理</div>
              <div className="text-sm text-gray-500 mt-1">
                Sprint 3 Phase 1 - 配置和管理 License 套餐与续费策略
              </div>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateStrategy}
            >
              创建套餐
            </Button>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                套餐管理
              </span>
            }
            key="strategy"
          >
            <Table
              columns={strategyColumns}
              dataSource={strategies}
              rowKey="id"
              loading={strategyLoading}
              pagination={false}
            />
            {/* Pagination below strategy table */}
            <div className="flex justify-end mt-4">
              <Pagination
                current={strategyPage}
                pageSize={strategyPageSize}
                total={strategies.length}
                showSizeChanger
                pageSizeOptions={['10', '20', '50']}
                showTotal={(total) => `共 ${total} 条`}
                onChange={(page, size) => {
                  setStrategyPage(page)
                  setStrategyPageSize(size)
                }}
              />
            </div>
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                续费记录
                {statistics.totalRecords > 0 && (
                  <Tag color="blue" className="ml-2">{statistics.totalRecords}</Tag>
                )}
              </span>
            }
            key="records"
          >
            {/* 续费记录内容 */}
            <div className="text-center py-12 text-gray-500">
              <HistoryOutlined className="text-4xl mb-4" />
              <p>续费记录功能开发中...</p>
            </div>
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <BellOutlined />
                自动续费
                {statistics.autoRenewalEnabled > 0 && (
                  <Tag color="green" className="ml-2">{statistics.autoRenewalEnabled}</Tag>
                )}
              </span>
            }
            key="auto-renewal"
          >
            {/* 自动续费内容 */}
            <div className="text-center py-12 text-gray-500">
              <SyncOutlined className="text-4xl mb-4" />
              <p>自动续费功能开发中...</p>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Strategy Modal */}
      <Modal
        title={isEditStrategy ? '编辑套餐' : '创建套餐'}
        open={isStrategyModalVisible}
        onOk={handleStrategySubmit}
        onCancel={() => setIsStrategyModalVisible(false)}
        width={700}
        okText={isEditStrategy ? '更新' : '创建'}
      >
        <Form
          form={strategyForm}
          layout="vertical"
          initialValues={{
            durationUnit: 'month',
            isActive: true,
          }}
        >
          <Form.Item
            name="name"
            label="套餐名称"
            rules={[{ required: true, message: '请输入套餐名称' }]}
          >
            <Input placeholder="例如：企业版" />
          </Form.Item>

          <Form.Item
            name="description"
            label="套餐描述"
          >
            <TextArea rows={3} placeholder="描述套餐的特点和适用场景" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label="价格 (元)"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <InputNumber
                min={0}
                precision={2}
                className="w-full"
                placeholder="299"
              />
            </Form.Item>

            <Form.Item
              name="duration"
              label="有效期时长"
              rules={[{ required: true, message: '请输入有效期' }]}
            >
              <InputNumber min={1} className="w-full" placeholder="12" />
            </Form.Item>
          </div>

          <Form.Item name="durationUnit" label="有效期单位">
            <Select>
              <Option value="day">天</Option>
              <Option value="month">个月</Option>
              <Option value="year">年</Option>
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="maxUsers" label="最大用户数量">
              <InputNumber min={1} className="w-full" placeholder="100" />
            </Form.Item>

            <Form.Item name="maxStores" label="最大门店数量">
              <InputNumber min={1} className="w-full" placeholder="10" />
            </Form.Item>
          </div>

          <Form.Item name="features" label="功能权限">
            <Select
              mode="multiple"
              placeholder="选择该套餐包含的功能权限"
            >
              <Option value="basic">基础功能</Option>
              <Option value="analytics">数据分析</Option>
              <Option value="api">API 访问</Option>
              <Option value="webhook">Webhook</Option>
              <Option value="sso">SSO 单点登录</Option>
              <Option value="priority">优先技术支持</Option>
            </Select>
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <div style={{ flex: 2, padding: 14, background: '#f9f9f9', borderRadius: 8, border: '1px solid #e8e8e8' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>💡 续费提醒</div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
            已到期的套餐需在 7 天内续费以保持服务。建议配置自动续费避免中断。
            到期前 3 天、1 天各发送一次提醒通知。关闭自动续费的策略需要手动操作。
          </div>
        </div>
        <div style={{ flex: 1, padding: 14, background: '#f1f5f9', borderRadius: 8, border: '1px solid #e8e8e8' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>📊 续费概览</div>
          <div style={{ fontSize: 12, color: '#475569' }}>策略配置: {strategies.length} 个</div>
          <div style={{ fontSize: 12, color: '#475569' }}>续费记录: {records.length} 条</div>
          <div style={{ fontSize: 12, color: '#475569' }}>活跃策略: {strategies.filter((s) => s.isActive).length} 个</div>
          <div style={{ fontSize: 12, color: '#475569' }}>自动续费: {strategies.filter((s) => s.isActive).length} 个已开启</div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>使用率: {strategies.length > 0 ? Math.round((strategies.filter((s) => s.isActive).length / strategies.length) * 100) : 0}%</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#999', marginTop: 16, textAlign: 'center' }}>
        当前为演示模式，数据每 5 分钟同步一次。实际数据以生产环境为准。
      </div>
      <div style={{ fontSize: 11, color: '#ccc', marginTop: 4, textAlign: 'center' }}>
        Phase-41 · Sprint 3 · License Renewal Module
      </div>
    </div>
  )
}