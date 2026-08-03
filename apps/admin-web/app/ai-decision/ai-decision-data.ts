export interface DecisionRecord {
  id: string
  ruleName: string
  status: 'approved' | 'rejected' | 'pending'
  confidence: number
  source: string
  createdAt: string
  targetAudience: string
  description: string
  ruleCategory: string
  triggeredCount: number
}

export interface AiDecisionFormState {
  ruleName: string
  description: string
  ruleCategory: string
  targetAudience: string
  source: string
}

export interface AiDecisionSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'ai-decision-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  decisions: DecisionRecord[]
}

export const STATUS_OPTS = [
  { value: '', label: '全部状态' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'pending', label: '待定' },
]

export const CATEGORY_OPTS = [
  { value: '', label: '全部类别' },
  { value: '营销', label: '营销' },
  { value: '运营', label: '运营' },
  { value: '风控', label: '风控' },
  { value: '会员', label: '会员' },
  { value: '供应链', label: '供应链' },
]

export const STATUS_MAP: Record<
  DecisionRecord['status'],
  { label: string; variant: 'success' | 'error' | 'warning' | 'neutral' }
> = {
  approved: { label: '已批准', variant: 'success' },
  rejected: { label: '已拒绝', variant: 'error' },
  pending: { label: '待定', variant: 'warning' },
}

export const DEFAULT_FORM: AiDecisionFormState = {
  ruleName: '',
  description: '',
  ruleCategory: '',
  targetAudience: '',
  source: '',
}

const MOCK_DECISIONS: DecisionRecord[] = [
  { id: 'dec-001', ruleName: '首单折扣规则', status: 'approved', confidence: 0.92, source: '规则引擎-A', createdAt: '2026-07-15 10:30', targetAudience: '全部会员', description: '首单自动折扣审批', ruleCategory: '营销', triggeredCount: 245 },
  { id: 'dec-002', ruleName: '高消费返券规则', status: 'approved', confidence: 0.88, source: '规则引擎-B', createdAt: '2026-07-15 10:28', targetAudience: '高活跃会员', description: '满500返券', ruleCategory: '营销', triggeredCount: 128 },
  { id: 'dec-003', ruleName: '大额订单审批', status: 'rejected', confidence: 0.45, source: '人工审核', createdAt: '2026-07-15 10:15', targetAudience: '全部会员', description: '超10000元人工审批', ruleCategory: '风控', triggeredCount: 12 },
  { id: 'dec-004', ruleName: '流失预警关怀', status: 'pending', confidence: 0.73, source: '规则引擎-A', createdAt: '2026-07-15 09:50', targetAudience: '低活跃会员', description: '30天未活跃发送关怀', ruleCategory: '运营', triggeredCount: 89 },
  { id: 'dec-005', ruleName: '生日月双倍积分', status: 'approved', confidence: 0.95, source: '规则引擎-C', createdAt: '2026-07-15 09:30', targetAudience: '全部会员', description: '自动双倍积分', ruleCategory: '营销', triggeredCount: 156 },
  { id: 'dec-006', ruleName: 'VIP专属折扣', status: 'rejected', confidence: 0.38, source: '人工审核', createdAt: '2026-07-15 09:00', targetAudience: '黄金会员', description: '85折审批', ruleCategory: '营销', triggeredCount: 34 },
  { id: 'dec-007', ruleName: '库存预警补货', status: 'pending', confidence: 0.81, source: '规则引擎-B', createdAt: '2026-07-15 08:45', targetAudience: '仓储', description: '安全水位自动补货', ruleCategory: '供应链', triggeredCount: 67 },
  { id: 'dec-008', ruleName: '新客注册礼包', status: 'approved', confidence: 0.99, source: '规则引擎-A', createdAt: '2026-07-15 08:30', targetAudience: '新注册会员', description: '自动发放注册礼包', ruleCategory: '营销', triggeredCount: 312 },
  { id: 'dec-009', ruleName: '季节性促销', status: 'pending', confidence: 0.65, source: '规则引擎-C', createdAt: '2026-07-14 16:00', targetAudience: '全部会员', description: '换季商品促销', ruleCategory: '营销', triggeredCount: 203 },
  { id: 'dec-010', ruleName: '欺诈风险拦截', status: 'rejected', confidence: 0.28, source: '人工审核', createdAt: '2026-07-14 14:30', targetAudience: '全部会员', description: '短时间多次下单拦截', ruleCategory: '风控', triggeredCount: 18 },
  { id: 'dec-011', ruleName: '新品上架推送', status: 'approved', confidence: 0.87, source: '规则引擎-A', createdAt: '2026-07-14 11:00', targetAudience: '活跃会员', description: '新品推送通知', ruleCategory: '运营', triggeredCount: 445 },
  { id: 'dec-012', ruleName: '会员等级保级', status: 'pending', confidence: 0.72, source: '规则引擎-B', createdAt: '2026-07-13 15:20', targetAudience: '银卡会员', description: '保级条件触发通知', ruleCategory: '会员', triggeredCount: 76 },
]

export async function loadAiDecisionSnapshot(): Promise<AiDecisionSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'ai-decision-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadAiDecisionSnapshot -> local E54 snapshot shell',
    businessDataSource: 'ai-decision-data.ts mock decision records',
    refreshPath: 'AiDecisionPage -> loadAiDecisionSnapshot',
    note: '当前页面已按 E54 三层模板壳层化，决策记录、筛选与创建规则仍使用本地 mock 数据。',
    decisions: MOCK_DECISIONS,
  }
}
