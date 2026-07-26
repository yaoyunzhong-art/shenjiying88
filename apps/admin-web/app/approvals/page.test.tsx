import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'approvals-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'approvals-data.ts'), 'utf-8')
})

describe('ApprovalsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function ApprovalsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载审批快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadApprovalsSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadApprovalsSnapshot } from './approvals-data'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入治理审批权限边界', () => {
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(PAGE_SRC.includes('治理审批中心访问受限'))
  })
})

describe('ApprovalsPage — 来源态透明化', () => {
  it('页面应展示审批列表来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('写入路径: {sourceEvidence.writePath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes('latestUpdatedAt: {sourceEvidence.latestUpdatedAt}'))
  })

  it('页面应显式标记 mock 样本与假写链路', () => {
    assert.ok(PAGE_SRC.includes('loadApprovalsSnapshot -> DEFAULT_APPROVALS'))
    assert.ok(PAGE_SRC.includes('local approvals snapshot'))
    assert.ok(PAGE_SRC.includes('submitApprovalComment/approveApproval/rejectApproval -> local state mutation only'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('ApprovalsData — 快照合同', () => {
  it('应定义 mock 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('approvals: ApprovalRecord[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认审批样本', () => {
    assert.ok(DATA_SRC.includes('export const DEFAULT_APPROVALS'))
    assert.ok(DATA_SRC.includes('APR-001'))
    assert.ok(DATA_SRC.includes('北京朝阳店'))
    assert.ok(DATA_SRC.includes('赵磊'))
  })

  it('应提供首屏快照 loader 与假写链路函数', () => {
    assert.ok(DATA_SRC.includes('export async function loadApprovalsSnapshot()'))
    assert.ok(DATA_SRC.includes('export async function submitApprovalComment('))
    assert.ok(DATA_SRC.includes('export async function approveApproval('))
    assert.ok(DATA_SRC.includes('export async function rejectApproval('))
    assert.ok(DATA_SRC.includes('waitForMockWrite'))
  })

  it('应对缺失 ID 和空评论做防御', () => {
    assert.ok(DATA_SRC.includes('缺少审批单ID'))
    assert.ok(DATA_SRC.includes('评论内容不能为空'))
  })
})

describe('ApprovalsClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes('"use client"') || CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并初始化本地态', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: ApprovalsSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('useState<ApprovalRecord[]>(snapshot.approvals)'))
    assert.ok(CLIENT_SRC.includes('const [tabKey, setTabKey] = useState<TabKey>(\'pending\')'))
  })

  it('客户端组件应支持 router.refresh 刷新服务端快照', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留审批动作与本地内存态更新', () => {
    assert.ok(CLIENT_SRC.includes('submitApprovalComment'))
    assert.ok(CLIENT_SRC.includes('approveApproval'))
    assert.ok(CLIENT_SRC.includes('rejectApproval'))
    assert.ok(CLIENT_SRC.includes('setApprovals((current) =>'))
    assert.ok(CLIENT_SRC.includes('只更新前端内存态'))
  })

  it('客户端组件应保留 tabs、统计卡与审批意见交互', () => {
    assert.ok(CLIENT_SRC.includes("type TabKey = 'pending' | 'done' | 'all'"))
    assert.ok(CLIENT_SRC.includes('待审批数'))
    assert.ok(CLIENT_SRC.includes('本月总金额'))
    assert.ok(CLIENT_SRC.includes('通过率'))
    assert.ok(CLIENT_SRC.includes('审批意见 ▼'))
    assert.ok(CLIENT_SRC.includes('提交意见'))
  })
})

describe('Approvals — 反例与边界', () => {
  it('源码中不应出现 describe.skip', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'))
    assert.ok(!CLIENT_SRC.includes('describe.skip'))
    assert.ok(!DATA_SRC.includes('describe.skip'))
  })

  it('源码中不应出现 as any', () => {
    assert.ok(!PAGE_SRC.includes('as any'))
    assert.ok(!CLIENT_SRC.includes('as any'))
    assert.ok(!DATA_SRC.includes('as any'))
  })

  it('客户端应保留空态提示', () => {
    assert.ok(CLIENT_SRC.includes('列表为空'))
    assert.ok(CLIENT_SRC.includes('暂无待处理的审批请求'))
    assert.ok(CLIENT_SRC.includes('目前还没有任何审批记录'))
  })
})
