export interface WorkflowConfigItem {
  key: string
  value: string
}

export interface WorkflowNodeType {
  icon: string
  name: string
  description: string
  automatable: boolean
}

export interface WorkflowSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'workflow-fallback'
  generatedAt: string
  configs: WorkflowConfigItem[]
  nodeTypes: WorkflowNodeType[]
  governanceNotes: string[]
  stats: {
    publishedFlows: number
    nodeTypeCount: number
    approvalPolicies: number
  }
  error?: string
}

export const DEFAULT_WORKFLOW_CONFIGS: WorkflowConfigItem[] = [
  { key: '当前版本', value: 'v1' },
  { key: '流程状态', value: '已发布' },
  { key: '审批策略', value: '任意一人通过（any）' },
  { key: '条件分支', value: '金额 > 10000 -> 高级审批' },
  { key: '驳回处理', value: '驳回即终止流程' },
]

export const DEFAULT_WORKFLOW_NODE_TYPES: WorkflowNodeType[] = [
  { icon: 'START', name: '开始', description: '流程起点，每个工作流有且仅有一个。', automatable: false },
  { icon: 'END', name: '结束', description: '流程终点，可承接驳回或成功收口。', automatable: false },
  { icon: 'APPROVAL', name: '审批', description: '指定审批人，支持 any/all 多人策略。', automatable: false },
  { icon: 'CONDITION', name: '条件', description: '条件判断分支，根据表达式路由。', automatable: true },
  { icon: 'ACTION', name: '动作', description: '自动化执行节点，触发系统动作。', automatable: true },
  { icon: 'WAIT', name: '等待', description: '定时等待节点，超时自动推进。', automatable: true },
]

export const DEFAULT_WORKFLOW_GOVERNANCE_NOTES = [
  '当前页面展示的是治理样本流程，不是审批引擎实时拓扑图。',
  '审批策略与节点定义应后续切换到 workflow runtime snapshot。',
  '刷新按钮只会请求服务端重新生成快照，不在客户端维护异步 fetch 状态。',
]

export async function loadWorkflowSnapshot(): Promise<WorkflowSnapshotDelivery> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'workflow-fallback',
    generatedAt: '2026-07-26T12:00:00.000Z',
    configs: [...DEFAULT_WORKFLOW_CONFIGS],
    nodeTypes: [...DEFAULT_WORKFLOW_NODE_TYPES],
    governanceNotes: [...DEFAULT_WORKFLOW_GOVERNANCE_NOTES],
    stats: {
      publishedFlows: 1,
      nodeTypeCount: DEFAULT_WORKFLOW_NODE_TYPES.length,
      approvalPolicies: 2,
    },
    error: '工作流实时拓扑接口尚未接入，当前展示 fallback 样本，不可作为闭环复签证据。',
  }
}
