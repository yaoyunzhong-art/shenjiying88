export type ApprovalType = 'purchase' | 'expense' | 'campaign' | 'leave'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

export interface ApprovalRecord {
  id: string
  type: ApprovalType
  applicant: string
  store: string
  amount: number
  status: ApprovalStatus
  createdAt: string
  updatedAt: string
  description: string
  comment: string
  approver: string
}

export interface ApprovalCommentPayload {
  id: string
  comment: string
  createdAt: string
}

export interface ApprovalsSnapshotDelivery {
  deliveryMode: 'mock'
  approvals: ApprovalRecord[]
  generatedAt: string
}

export const DEFAULT_APPROVALS: ApprovalRecord[] = [
  {
    id: 'APR-001',
    type: 'purchase',
    applicant: '李强',
    store: '北京朝阳店',
    amount: 35000,
    status: 'pending',
    createdAt: '2026-07-18T09:00:00',
    updatedAt: '2026-07-18T09:00:00',
    description: '采购2台高配收银终端(华为擎云)',
    comment: '',
    approver: '',
  },
  {
    id: 'APR-002',
    type: 'expense',
    applicant: '王晓芳',
    store: '上海浦东店',
    amount: 2800,
    status: 'pending',
    createdAt: '2026-07-17T14:30:00',
    updatedAt: '2026-07-17T14:30:00',
    description: '7月团队聚餐活动报销',
    comment: '',
    approver: '',
  },
  {
    id: 'APR-003',
    type: 'campaign',
    applicant: '陈杰',
    store: '广州天河店',
    amount: 12000,
    status: 'pending',
    createdAt: '2026-07-17T10:00:00',
    updatedAt: '2026-07-17T10:00:00',
    description: '暑期亲子嘉年华活动预算审批',
    comment: '',
    approver: '',
  },
  {
    id: 'APR-004',
    type: 'leave',
    applicant: '张婷',
    store: '深圳南山店',
    amount: 0,
    status: 'pending',
    createdAt: '2026-07-16T08:00:00',
    updatedAt: '2026-07-16T08:00:00',
    description: '年假5天(7/20-7/24)',
    comment: '',
    approver: '',
  },
  {
    id: 'APR-005',
    type: 'purchase',
    applicant: '赵磊',
    store: '成都锦江店',
    amount: 8600,
    status: 'approved',
    createdAt: '2026-07-15T11:00:00',
    updatedAt: '2026-07-16T09:00:00',
    description: '门店装饰物料采购(七夕活动)',
    comment: '预算合理，同意采购',
    approver: '张经理',
  },
  {
    id: 'APR-006',
    type: 'expense',
    applicant: '刘敏',
    store: '杭州西湖店',
    amount: 1500,
    status: 'rejected',
    createdAt: '2026-07-14T16:00:00',
    updatedAt: '2026-07-15T10:00:00',
    description: '个人交通费用报销（缺票据）',
    comment: '缺少正式发票，请补充后重新提交',
    approver: '李主管',
  },
  {
    id: 'APR-007',
    type: 'campaign',
    applicant: '吴迪',
    store: '武汉光谷店',
    amount: 20000,
    status: 'approved',
    createdAt: '2026-07-13T09:30:00',
    updatedAt: '2026-07-14T14:00:00',
    description: '国庆前置预热营销活动',
    comment: '方案完整，注意预算控制',
    approver: '张经理',
  },
  {
    id: 'APR-008',
    type: 'leave',
    applicant: '孙悦',
    store: '南京新街口店',
    amount: 0,
    status: 'withdrawn',
    createdAt: '2026-07-12T07:00:00',
    updatedAt: '2026-07-13T11:00:00',
    description: '事假半天(7/15下午)',
    comment: '申请人已自行撤回',
    approver: '',
  },
]

function getLatestUpdatedAt(records: ApprovalRecord[]): string {
  if (records.length === 0) return '—'
  return records.reduce(
    (latest, record) => (record.updatedAt > latest ? record.updatedAt : latest),
    records[0]!.updatedAt
  )
}

export async function loadApprovalsSnapshot(): Promise<ApprovalsSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    approvals: DEFAULT_APPROVALS,
    generatedAt: getLatestUpdatedAt(DEFAULT_APPROVALS),
  }
}

function waitForMockWrite(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 120)
  })
}

export async function submitApprovalComment(
  id: string,
  text: string
): Promise<ApprovalCommentPayload> {
  const comment = text.trim()
  if (!id) {
    throw new Error('缺少审批单ID')
  }
  if (!comment.length) {
    throw new Error('评论内容不能为空')
  }
  await waitForMockWrite()
  return {
    id,
    comment,
    createdAt: new Date().toISOString(),
  }
}

export async function approveApproval(id: string): Promise<{ id: string; status: 'approved' }> {
  if (!id) {
    throw new Error('缺少审批单ID')
  }
  await waitForMockWrite()
  return { id, status: 'approved' }
}

export async function rejectApproval(id: string): Promise<{ id: string; status: 'rejected' }> {
  if (!id) {
    throw new Error('缺少审批单ID')
  }
  await waitForMockWrite()
  return { id, status: 'rejected' }
}
