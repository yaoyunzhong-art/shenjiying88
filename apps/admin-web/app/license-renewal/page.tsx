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

  useEffect(() => {
    fetchStrategies()
    fetchRecords()
  }, [recordQuery.page, recordQuery.pageSize])

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
    </div>
  )
}