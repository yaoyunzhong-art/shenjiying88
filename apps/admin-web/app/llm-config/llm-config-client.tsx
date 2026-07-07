'use client';

/**
 * LLM接入配置管理页面 - 客户端组件
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Table,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Tabs,
  Statistic,
  Row,
  Col,
  Alert,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  GlobalOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

// ── Types ──

interface LLMConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'moonshot' | 'minimax' | 'custom';
  modelName: string;
  apiEndpoint?: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  quotaLimit?: number;
  quotaUsed?: number;
  quotaAlertThreshold?: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LLMStats {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCost: number;
  currency: string;
  avgLatencyMs: number;
}

interface CreateConfigForm {
  name: string;
  provider: 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'moonshot' | 'minimax' | 'custom';
  modelName: string;
  apiEndpoint?: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  quotaLimit?: number;
  quotaAlertThreshold?: number;
}

// ── Mock Data ──

const MOCK_CONFIGS: LLMConfig[] = [
  {
    id: 'llm-001',
    name: 'GPT-4 主模型',
    provider: 'openai',
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4096,
    quotaLimit: 1000000,
    quotaUsed: 328500,
    quotaAlertThreshold: 0.8,
    status: 'approved',
    enabled: true,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-06-20T14:30:00Z',
  },
  {
    id: 'llm-002',
    name: 'Claude-3 客服模型',
    provider: 'anthropic',
    modelName: 'claude-3-sonnet',
    temperature: 0.8,
    maxTokens: 8192,
    quotaLimit: 500000,
    quotaUsed: 156200,
    quotaAlertThreshold: 0.9,
    status: 'approved',
    enabled: true,
    createdAt: '2026-04-15T09:00:00Z',
    updatedAt: '2026-06-22T11:20:00Z',
  },
  {
    id: 'llm-003',
    name: 'DeepSeek 推理模型',
    provider: 'deepseek',
    modelName: 'deepseek-v3',
    temperature: 0.5,
    maxTokens: 2048,
    status: 'pending',
    enabled: false,
    createdAt: '2026-06-25T16:00:00Z',
    updatedAt: '2026-06-25T16:00:00Z',
  },
];

const MOCK_STATS: LLMStats = {
  totalCalls: 12847,
  successCalls: 12456,
  failedCalls: 391,
  totalPromptTokens: 85620000,
  totalCompletionTokens: 42810000,
  totalCost: 2847.5,
  currency: 'USD',
  avgLatencyMs: 850,
};

// ── Provider Options ──

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI (GPT-4, GPT-3.5)' },
  { value: 'anthropic', label: 'Anthropic (Claude-3)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'qwen', label: '阿里通义千问' },
  { value: 'moonshot', label: '月之暗面 Moonshot' },
  { value: 'minimax', label: 'MiniMax' },
  { value: 'custom', label: '自定义 API' },
];

// ── Main Component ──

export default function LLMConfigClient() {
  const [configs, setConfigs] = useState<LLMConfig[]>(MOCK_CONFIGS);
  const [stats, setStats] = useState<LLMStats>(MOCK_STATS);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LLMConfig | null>(null);
  const [form] = Form.useForm<CreateConfigForm>();

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: 调用API获取真实数据
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 创建配置
  const handleCreate = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑配置
  const handleEdit = (config: LLMConfig) => {
    setEditingConfig(config);
    form.setFieldsValue({
      name: config.name,
      provider: config.provider,
      modelName: config.modelName,
      apiEndpoint: config.apiEndpoint,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      quotaLimit: config.quotaLimit,
      quotaAlertThreshold: config.quotaAlertThreshold,
    });
    setModalVisible(true);
  };

  // 删除配置
  const handleDelete = async (configId: string) => {
    // TODO: 调用API删除
    setConfigs((prev) => prev.filter((c) => c.id !== configId));
    message.success('配置已删除');
  };

  // 提交表单
  const handleSubmit = async (values: CreateConfigForm) => {
    // TODO: 调用API创建/更新
    if (editingConfig) {
      setConfigs((prev) =>
        prev.map((c) =>
          c.id === editingConfig.id
            ? { ...c, ...values, updatedAt: new Date().toISOString() }
            : c
        )
      );
      message.success('配置已更新');
    } else {
      const newConfig = {
        id: `llm-${Date.now()}`,
        ...values,
        status: 'pending' as const,
        enabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as LLMConfig;
      setConfigs((prev) => [...prev, newConfig]);
      message.success('配置已创建，请等待审批');
    }
    setModalVisible(false);
  };

  // 切换启用状态
  const handleToggleEnabled = (configId: string, enabled: boolean) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.id === configId ? { ...c, enabled, updatedAt: new Date().toISOString() } : c
      )
    );
    message.success(enabled ? '已启用' : '已禁用');
  };

  // 提交接入申请
  const handleApply = async (configId: string) => {
    // TODO: 调用API提交申请
    message.success('接入申请已提交');
  };

  // 状态标签
  const statusTag = (status: LLMConfig['status']) => {
    const config = {
      approved: { color: 'green', text: '已审批' },
      pending: { color: 'orange', text: '待审批' },
      rejected: { color: 'red', text: '已拒绝' },
      suspended: { color: 'default', text: '已暂停' },
    };
    const { color, text } = config[status] || config.pending;
    return <Tag color={color}>{text}</Tag>;
  };

  // 配额使用率
  const quotaUsage = (config: LLMConfig) => {
    if (!config.quotaLimit) return '∞';
    const usage = ((config.quotaUsed || 0) / config.quotaLimit) * 100;
    const color = usage >= (config.quotaAlertThreshold || 0.8) * 100 ? 'red' : 'blue';
    return (
      <Tooltip title={`${config.quotaUsed?.toLocaleString() || 0} / ${config.quotaLimit.toLocaleString()}`}>
        <Tag color={color}>{usage.toFixed(1)}%</Tag>
      </Tooltip>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: LLMConfig) => (
        <Space>
          <span>{name}</span>
          {record.enabled && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
        </Space>
      ),
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => (
        <Tag>{PROVIDER_OPTIONS.find((p) => p.value === provider)?.label || provider}</Tag>
      ),
    },
    {
      title: '模型',
      dataIndex: 'modelName',
      key: 'modelName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: statusTag,
    },
    {
      title: '配额使用',
      key: 'quota',
      render: (_: unknown, record: LLMConfig) => quotaUsage(record),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: LLMConfig) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          {record.status === 'pending' && (
            <Button type="link" onClick={() => handleApply(record.id)}>
              申请接入
            </Button>
          )}
          <Switch
            size="small"
            checked={record.enabled}
            onChange={(checked) => handleToggleEnabled(record.id, checked)}
            disabled={record.status !== 'approved'}
          />
          <Popconfirm
            title="确认删除此配置？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">LLM 接入配置</h1>
        <p className="text-gray-500 mt-1">管理站点的大模型接入配置，支持多租户完全隔离</p>
      </div>

      <Tabs
        defaultActiveKey="configs"
        items={[
          {
            key: 'configs',
            label: '配置管理',
            children: (
              <>
                {/* 操作栏 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">
                    共 {configs.length} 个配置
                  </div>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    新建配置
                  </Button>
                </div>

                {/* 提示 */}
                <Alert
                  message="隔离说明"
                  description="每个站点的LLM配置完全隔离，互不影响。配置需要平台管理员审批后才能启用。"
                  type="info"
                  showIcon
                  className="mb-4"
                />

                {/* 配置列表 */}
                <Card>
                  <Table
                    dataSource={configs}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'stats',
            label: '统计分析',
            children: (
              <>
                <Row gutter={16} className="mb-6">
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="总调用次数"
                        value={stats.totalCalls}
                        prefix={<SettingOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="成功次数"
                        value={stats.successCalls}
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="失败次数"
                        value={stats.failedCalls}
                        valueStyle={{ color: '#ff4d4f' }}
                        prefix={<CloseCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="费用估算 (USD)"
                        value={stats.totalCost}
                        precision={2}
                        prefix={<DollarOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16} className="mb-6">
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Prompt Tokens"
                        value={stats.totalPromptTokens}
                        suffix="tokens"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Completion Tokens"
                        value={stats.totalCompletionTokens}
                        suffix="tokens"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="平均延迟"
                        value={stats.avgLatencyMs}
                        suffix="ms"
                        prefix={<ClockCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="成功率"
                        value={(stats.successCalls / stats.totalCalls * 100).toFixed(1)}
                        suffix="%"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="调用趋势">
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    图表展示区域 (TODO: 接入图表库)
                  </div>
                </Card>
              </>
            ),
          },
          {
            key: 'global',
            label: '全球化配置',
            children: (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="支持的语言" extra={<GlobalOutlined />}>
                      <div className="flex flex-wrap gap-2">
                        {['简体中文', 'English', '日本語', '한국어', '繁體中文', 'Español', 'Français', 'Deutsch'].map((lang) => (
                          <Tag key={lang} color="blue">{lang}</Tag>
                        ))}
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="支持的货币" extra={<DollarOutlined />}>
                      <div className="flex flex-wrap gap-2">
                        {['USD', 'CNY', 'JPY', 'KRW', 'EUR', 'GBP', 'HKD', 'SGD'].map((currency) => (
                          <Tag key={currency} color="green">{currency}</Tag>
                        ))}
                      </div>
                    </Card>
                  </Col>
                </Row>
                <Card title="社交媒体渠道适配" className="mt-4">
                  <p className="text-gray-500 mb-4">
                    系统根据用户所在地区自动适配主流社交媒体渠道：
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Tag color="green">WhatsApp</Tag>
                    <Tag color="blue">LINE</Tag>
                    <Tag color="purple">Telegram</Tag>
                    <Tag color="orange">Messenger</Tag>
                    <Tag color="green">微信</Tag>
                    <Tag color="pink">KakaoTalk</Tag>
                  </div>
                </Card>
              </>
            ),
          },
        ]}
      />

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingConfig ? '编辑 LLM 配置' : '新建 LLM 配置'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            temperature: 0.7,
            maxTokens: 4096,
            quotaAlertThreshold: 0.8,
          }}
        >
          <Form.Item
            name="name"
            label="配置名称"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="例如：GPT-4 主模型" />
          </Form.Item>

          <Form.Item
            name="provider"
            label="LLM 提供商"
            rules={[{ required: true, message: '请选择提供商' }]}
          >
            <Select options={PROVIDER_OPTIONS} placeholder="选择大模型提供商" />
          </Form.Item>

          <Form.Item
            name="modelName"
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="例如：gpt-4, claude-3-sonnet" />
          </Form.Item>

          <Form.Item name="apiEndpoint" label="自定义 API 端点 (可选)">
            <Input placeholder="使用提供商的默认端点" />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: !editingConfig, message: '请输入 API Key' }]}
          >
            <Input.Password
              placeholder={editingConfig ? '（不修改请留空）' : '输入您的 API Key'}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="temperature" label="Temperature">
                <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxTokens" label="Max Tokens">
                <InputNumber min={100} max={100000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="topP" label="Top-P">
                <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quotaLimit" label="月度配额上限 (Tokens)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="不限制" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quotaAlertThreshold" label="配额告警阈值">
                <InputNumber
                  min={0}
                  max={1}
                  step={0.1}
                  style={{ width: '100%' }}
                  formatter={(value) => `${(value || 0) * 100}%`}
                  parser={(value: string | undefined) => { const n = parseFloat(value?.replace('%', '') || '0'); return n / 100; }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingConfig ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
