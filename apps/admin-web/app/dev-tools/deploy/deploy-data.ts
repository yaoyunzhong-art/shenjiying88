export interface DeploymentRecord {
  id: string
  name: string
  version: string
  env: 'production' | 'staging' | 'testing'
  status: 'success' | 'failed' | 'rolling' | 'rollback'
  time: string
  duration: string
  deployer: string
  commits: number
  notes: string
  [key: string]: unknown
}

export interface DeploySnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'dev-tools-deploy-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  deployments: DeploymentRecord[]
  envOptions: Array<{ value: string; label: string }>
}

const DEPLOYS: DeploymentRecord[] = [
  { id: 'D-001', name: '收银系统更新', version: 'v2.3.1', env: 'production', status: 'success', time: '2026-07-14 08:00', duration: '12min', deployer: '张三', commits: 24, notes: 'P-35收银Sprint #12' },
  { id: 'D-002', name: '会员模块补丁', version: 'v2.3.1-hotfix', env: 'production', status: 'rolling', time: '2026-07-14 09:30', duration: '8min', deployer: '李四', commits: 8, notes: '紧急hotfix' },
  { id: 'D-003', name: '开放平台V2', version: 'v2.4.0', env: 'staging', status: 'success', time: '2026-07-13 18:00', duration: '15min', deployer: '王五', commits: 56, notes: 'P-49开发' },
  { id: 'D-004', name: '库存模块部署', version: 'v2.3.0', env: 'testing', status: 'success', time: '2026-07-13 14:00', duration: '10min', deployer: '赵六', commits: 32, notes: 'P-37测试' },
  { id: 'D-005', name: '财务对账部署', version: 'v2.2.0', env: 'staging', status: 'failed', time: '2026-07-12 22:00', duration: '5min', deployer: 'IT部', commits: 15, notes: '配置错误回滚' },
  { id: 'D-006', name: '紧急回滚', version: 'v2.2.0-rollback', env: 'production', status: 'rollback', time: '2026-07-12 22:30', duration: '6min', deployer: 'IT部', commits: 0, notes: '回滚至v2.2.0' },
]

const ENV_OPTIONS = [
  { value: 'all', label: '全部环境' },
  { value: 'production', label: '生产' },
  { value: 'staging', label: '预发' },
  { value: 'testing', label: '测试' },
]

export async function loadDeploySnapshot(): Promise<DeploySnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'dev-tools-deploy-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadDeploySnapshot -> local E54 snapshot shell',
    businessDataSource: 'deploy-data.ts mock deployment rows',
    refreshPath: 'DeployPage -> loadDeploySnapshot',
    note: '当前页面已按 E54 三层模板壳层化，部署记录、环境筛选与回滚动作仍使用本地 mock 数据。',
    deployments: DEPLOYS,
    envOptions: ENV_OPTIONS,
  }
}
