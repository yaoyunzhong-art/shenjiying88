/**
 * 规则详情页 — Rule Detail Page (Next.js App Router Page)
 * 功能: 展示单条规则的完整信息 / 状态切换 / 编辑 / 删除 / 版本查看
 * 角色视角: 👔系统管理员 / 🛡️运营主管
 */

'use client';

import { use, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  CombinedDetailPage,
  ConfirmActionDialog,
  DescriptionList,
  Modal,
  StatusBadge,
  TextArea,
  Input,
  FormField,
  Select,
  useToast,
  type DetailInfoRow,
  type DetailTab,
  type TransitionAction,
} from '@m5/ui';

// ── 类型定义 ────────────────────────────────────────────────────────

type RuleCategory = 'risk-control' | 'member' | 'promotion' | 'notification' | 'operation';
type RuleStatus = 'enabled' | 'disabled' | 'draft' | 'archived';
type RulePriority = 'critical' | 'high' | 'medium' | 'low';

interface RuleDetail {
  id: string;
  name: string;
  category: RuleCategory;
  status: RuleStatus;
  priority: RulePriority;
  description: string;
  condition: string;
  action: string;
  triggerCount: number;
  successRate: number;
  lastTriggered: string;
  updatedAt: string;
  createdAt: string;
  createdBy: string;
  version: string;
  enabled: boolean;
}

// ── 常量映射 ────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<RuleCategory, string> = {
  'risk-control': '风控规则',
  member: '会员规则',
  promotion: '营销规则',
  notification: '通知规则',
  operation: '运维规则',
};

const CATEGORY_LIST: RuleCategory[] = ['risk-control', 'member', 'promotion', 'notification', 'operation'];

const STATUS_LABELS: Record<RuleStatus, string> = {
  enabled: '已启用',
  disabled: '已停用',
  draft: '草稿',
  archived: '已归档',
};

const STATUS_BADGE_VARIANT: Record<RuleStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  enabled: 'success',
  disabled: 'neutral',
  draft: 'warning',
  archived: 'danger',
};

const PRIORITY_LABELS: Record<RulePriority, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
};

const PRIORITY_COLORS: Record<RulePriority, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
};

// ── Mock 数据 ───────────────────────────────────────────────────────

function mockRule(id: string): RuleDetail {
  const index = parseInt((id || '1').replace('rule-', ''), 10) || 1;
  const names = [
    '信用评分规则', '风控拦截规则', '会员升级规则', '优惠券发放规则',
    '异常登录检测规则', '批量通知规则', '库存预警规则', '订单风控规则',
    '积分过期规则', '推送频率限制',
  ];
  const descs = [
    '基于会员行为数据的信用评分自动计算与更新',
    '检测异常交易行为并触发拦截流程',
    '根据消费金额和频次自动升级会员等级',
    '按条件自动发放优惠券给目标会员群体',
    '检测异地登录、频繁登录等异常行为',
    '批量向目标用户发送系统通知消息',
    '库存低于阈值时自动触发补货提醒',
    '对高风险订单进行自动风控审核',
    '会员积分到期前自动发送提醒通知',
    '智能推荐最优优惠方案给高价值会员',

    '限制单用户每日推送消息频率上限',
  ];
  const conditions = [
    'member.credit_score < 600 AND transaction.amount > 10000',
    'login.ip_country != member.country OR login.frequency > 10',
    'member.total_spent >= 50000 AND member.months_since_join >= 6',
    'member.tags CONTAINS "high_value" AND campaign.active = true',
    'login.geo_velocity > 500 AND device.is_new = true',
    'event.type = "notification" AND queue.depth < 1000',
    'inventory.stock_remaining < inventory.min_threshold',
    'order.risk_score > 0.7 OR order.amount > 50000',
    'member.points.expires_in_days <= 7',
    'user.push_count_today >= 5',
  ];
  const actions = [
    '设置信用评级为"低风险"，更新会员标签',
    '拦截交易请求，发送风控告警通知',
    '将会员等级提升至下一级，发放升级礼包',
    '生成优惠券并推送至会员卡包',
    '触发二次验证，记录异常登录日志',
    '调用通知服务批量推送消息',
    '发送补货工单至仓库管理系统',
    '锁定订单进行人工审核',
    '发送积分即将过期提醒消息',
    '拒绝本次推送请求，记录超限日志',
  ];
  const statuses: RuleStatus[] = ['enabled', 'disabled', 'draft', 'archived'];
  const cats: RuleCategory[] = ['risk-control', 'member', 'promotion', 'notification', 'operation'];
  const prios: RulePriority[] = ['critical', 'high', 'medium', 'low'];
  const creators = ['admin', 'operator-01', 'operator-02', 'super-admin', 'system'];

  return {
    id,
    name: names[index % 10] + ` v${Math.floor(index / 10) + 1}`,
    category: cats[index % 5]!,
    status: statuses[index % 4]!,
    priority: prios[index % 4]!,
    description: descs[index % 10]!,
    condition: conditions[index % 10]!,
    action: actions[index % 10]!,
    triggerCount: Math.floor(Math.random() * 5000) + 10,
    successRate: Math.round((Math.random() * 30 + 70) * 10) / 10,
    lastTriggered: `2026-07-${String((index % 28) + 1).padStart(2, '0')}T${String(8 + (index % 10)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00Z`,
    updatedAt: `2026-07-${String((index % 28) + 1).padStart(2, '0')}T${String(8 + (index % 10)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00Z`,
    createdAt: `2025-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}T10:00:00Z`,
    createdBy: creators[index % 5]!,
    version: `${Math.floor(index / 2) + 1}.${(index % 10)}.0`,
    enabled: statuses[index % 4] === 'enabled',
  };
}

// ── 页面组件 ────────────────────────────────────────────────────────

export default function RuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const rule = useMemo(() => mockRule(id), [id]);

  const [ruleState, setRuleState] = useState<RuleDetail>(rule);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: rule.name,
    description: rule.description,
    priority: rule.priority,
    condition: rule.condition,
    action: rule.action,
  });

  // 状态流转操作
  const statusTransitions = useMemo<TransitionAction[]>(() => {
    const actions: TransitionAction[] = [];
    switch (ruleState.status) {
      case 'enabled':
        actions.push({
          key: 'disable',
          label: '停用规则',
          variant: 'secondary' as const,
          targetStatus: 'disabled',
          onTransition: async () => {
            setRuleState((prev) => ({ ...prev, status: 'disabled', enabled: false }));
            toast('规则已停用');
          },
        });
        break;
      case 'disabled':
        actions.push({
          key: 'enable',
          label: '启用规则',
          variant: 'primary' as const,
          targetStatus: 'enabled',
          onTransition: async () => {
            setRuleState((prev) => ({ ...prev, status: 'enabled', enabled: true }));
            toast('规则已启用');
          },
        });
        actions.push({
          key: 'archive',
          label: '归档规则',
          variant: 'secondary' as const,
          targetStatus: 'archived',
          onTransition: async () => {
            setRuleState((prev) => ({ ...prev, status: 'archived', enabled: false }));
            toast('规则已归档');
          },
        });
        break;
      case 'draft':
        actions.push({
          key: 'enable',
          label: '启用规则',
          variant: 'primary' as const,
          targetStatus: 'enabled',
          onTransition: async () => {
            setRuleState((prev) => ({ ...prev, status: 'enabled', enabled: true }));
            toast('规则已启用');
          },
        });
        actions.push({
          key: 'archive',
          label: '归档规则',
          variant: 'secondary' as const,
          targetStatus: 'archived',
          onTransition: async () => {
            setRuleState((prev) => ({ ...prev, status: 'archived', enabled: false }));
            toast('规则已归档');
          },
        });
        break;
      case 'archived':
        actions.push({
          key: 'restore',
          label: '恢复规则',
          variant: 'primary' as const,
          targetStatus: 'disabled',
          onTransition: async () => {
            setRuleState((prev) => ({ ...prev, status: 'disabled', enabled: false }));
            toast('规则已恢复');
          },
        });
        break;
    }
    actions.push({
      key: 'delete',
      label: '删除规则',
      variant: 'danger' as const,
      targetStatus: 'deleted',
      confirm: { title: '确认删除规则', message: `确定要删除规则「${ruleState.name}」吗？此操作不可撤销。` },
      onTransition: async () => {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 800));
        toast('规则已删除');
        setLoading(false);
        setTimeout(() => {
          router.push('/rules');
        }, 300);
      },
    });
    return actions;
  }, [ruleState.status, ruleState.name, toast, router]);

  const handleEditSave = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setRuleState((prev) => ({
      ...prev,
      name: editForm.name,
      description: editForm.description,
      priority: editForm.priority as RulePriority,
      condition: editForm.condition,
      action: editForm.action,
      updatedAt: new Date().toISOString(),
    }));
    setShowEditModal(false);
    toast('规则已更新');
    setLoading(false);
  }, [editForm, toast]);

  // 迁移到 TransitionAction 中内联处理，此处保留空函数避免引用错误
  const handleDeleteConfirm = useCallback(async () => {
    // 删除逻辑已迁移至 statusTransitions 内联处理
  }, []);

  // 基础信息
  const baseInfoRows = useMemo<DetailInfoRow[]>(
    () => [
      { key: 'name', label: '规则名称', value: ruleState.name },
      {
        key: 'status',
        label: '状态',
        value: <StatusBadge label={STATUS_LABELS[ruleState.status]} variant={STATUS_BADGE_VARIANT[ruleState.status]} />,
      },
      {
        key: 'category',
        label: '分类',
        value: CATEGORY_LABELS[ruleState.category],
      },
      {
        key: 'priority',
        label: '优先级',
        value: <span style={{ color: PRIORITY_COLORS[ruleState.priority], fontWeight: 600 }}>{PRIORITY_LABELS[ruleState.priority]}</span>,
      },
      { key: 'version', label: '版本', value: `v${ruleState.version}` },
      { key: 'description', label: '描述', value: ruleState.description },
      { key: 'createdBy', label: '创建人', value: ruleState.createdBy },
      { key: 'createdAt', label: '创建时间', value: new Date(ruleState.createdAt).toLocaleString('zh-CN') },
      { key: 'updatedAt', label: '更新于', value: new Date(ruleState.updatedAt).toLocaleString('zh-CN') },
    ],
    [ruleState],
  );

  // 执行统计
  const statsRows = useMemo<DetailInfoRow[]>(
    () => [
      { key: 'triggerCount', label: '触发次数', value: ruleState.triggerCount.toLocaleString() },
      {
        key: 'successRate',
        label: '成功率',
        value: (
          <span style={{ color: ruleState.successRate >= 95 ? '#4ade80' : ruleState.successRate >= 80 ? '#fbbf24' : '#f87171' }}>
            {ruleState.successRate}%
          </span>
        ),
      },
      { key: 'lastTriggered', label: '最近触发', value: new Date(ruleState.lastTriggered).toLocaleString('zh-CN') },
    ],
    [ruleState],
  );

  // 规则条件与动作
  const logicRows = useMemo<DetailInfoRow[]>(
    () => [
      { key: 'condition', label: '触发条件', value: <code style={{ background: 'rgba(15,23,42,0.6)', padding: '4px 10px', borderRadius: 6, fontSize: 13 }}>{ruleState.condition}</code> },
      { key: 'action', label: '执行动作', value: <code style={{ background: 'rgba(15,23,42,0.6)', padding: '4px 10px', borderRadius: 6, fontSize: 13 }}>{ruleState.action}</code> },
    ],
    [ruleState],
  );

  // Tab 定义
  const detailTabs = useMemo<DetailTab[]>(
    () => [
      {
        key: 'overview',
        label: '概览',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                基础信息
              </h3>
              <DescriptionList items={baseInfoRows} columns={2} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                执行统计
              </h3>
              <DescriptionList items={statsRows} columns={3} />
            </div>
          </div>
        ),
      },
      {
        key: 'logic',
        label: '条件与动作',
        content: (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              规则配置
            </h3>
            <DescriptionList items={logicRows} columns={1} />
          </div>
        ),
      },
      {
        key: 'history',
        label: '执行记录',
        content: (
          <div>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>
              <a href={`/rules/executions/${id}`} style={{ color: '#93c5fd', textDecoration: 'none' }}>
                → 查看完整执行记录
              </a>
            </p>
            <div style={{ marginTop: 16, color: '#64748b', fontSize: 13 }}>
              最近触发: {new Date(ruleState.lastTriggered).toLocaleString('zh-CN')}
            </div>
          </div>
        ),
      },
    ],
    [baseInfoRows, statsRows, logicRows, ruleState.lastTriggered, id],
  );

  return (
    <>
      <CombinedDetailPage
        title={ruleState.name}
        subtitle={`${CATEGORY_LABELS[ruleState.category]} · v${ruleState.version}`}
        backHref="/rules"
        backLabel="← 返回规则列表"
        infoRows={baseInfoRows}
        tabs={detailTabs}
        transitions={statusTransitions}
        onEdit={() => {
          setEditForm({
            name: ruleState.name,
            description: ruleState.description,
            priority: ruleState.priority,
            condition: ruleState.condition,
            action: ruleState.action,
          });
          setShowEditModal(true);
        }}
        loading={loading}
      />

      {/* 编辑弹窗 */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑规则"
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
          <FormField label="规则名称" required>
            <Input value={editForm.name} onChange={(v) => setEditForm((p) => ({ ...p, name: typeof v === 'string' ? v : v.target.value }))} />
          </FormField>

          <FormField label="描述">
            <TextArea
              value={editForm.description}
              onChange={(v) => setEditForm((p) => ({ ...p, description: typeof v === 'string' ? v : v.target.value }))}
              rows={3}
            />
          </FormField>

          <FormField label="优先级">
            <Select
              value={editForm.priority}
              options={[
                { label: '严重 (Critical)', value: 'critical' },
                { label: '高 (High)', value: 'high' },
                { label: '中 (Medium)', value: 'medium' },
                { label: '低 (Low)', value: 'low' },
              ]}
              onChange={(v) => v && setEditForm((p) => ({ ...p, priority: v as RulePriority }))}
            />
          </FormField>

          <FormField label="触发条件">
            <TextArea
              value={editForm.condition}
              onChange={(v) => setEditForm((p) => ({ ...p, condition: typeof v === 'string' ? v : v.target.value }))}
              rows={3}
            />
          </FormField>

          <FormField label="执行动作">
            <TextArea
              value={editForm.action}
              onChange={(v) => setEditForm((p) => ({ ...p, action: typeof v === 'string' ? v : v.target.value }))}
              rows={3}
            />
          </FormField>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setShowEditModal(false)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'transparent',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleEditSave}
            disabled={loading || !editForm.name.trim()}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: loading ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.16)',
              color: '#dbeafe',
              cursor: loading || !editForm.name.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '保存中...' : '保存修改'}
          </button>
        </div>
      </Modal>

      {/* 删除确认 */}
      <ConfirmActionDialog
        open={showDeleteConfirm}
        title="确认删除规则"
        message={`确定要删除规则「${ruleState.name}」吗？此操作不可撤销。`}
        confirmLabel="确认删除"
        confirmVariant="danger"
        loading={loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
