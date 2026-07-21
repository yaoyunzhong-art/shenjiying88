import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 [devops] 8角色扩展测试
 * 覆盖 CI/CD 流水线、部署任务、构建作业、运维操作的 8角色×3场景
 *
 * 8角色: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import { DevopsController } from './devops.controller'
import { DevopsService } from './devops.service'

function setup() {
  const service = new DevopsService()
  const controller = new DevopsController(service)
  return { service, controller }
}

// ══════════════════════════════════════════════════════════════
// 👔店长 — 流水线全局管理与监控
// ══════════════════════════════════════════════════════════════
describe('👔店长 devops 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('创建 CI 和 CD 两条流水线并查看列表总数', async () => {
    svc.controller.createPipeline({
      name: 'CI-Build', type: 'ci',
      config: { runner: 'ubuntu-22.04', node: '18' },
      triggers: ['push', 'pr'],
    })
    svc.controller.createPipeline({
      name: 'CD-Deploy', type: 'cd',
      config: { env: 'production', autoDeploy: true },
      triggers: ['tag'],
    })
    const list = await svc.controller.listPipelines()
    expect(list.total).toBe(2)
    expect(list.items[0].name).toBe('CI-Build')
    expect(list.items[1].name).toBe('CD-Deploy')
  })

  it('查看运维服务概览状态', () => {
    const status = svc.controller.getStatus()
    expect(status.status).toBe('ok')
    expect(status.module).toBe('devops')
    expect(status.pipelines).toBeDefined()
    expect(status.deployments).toBeDefined()
    expect(status.builds).toBeDefined()
  })

  it('更新流水线配置并验证 enabled 字段变更', async () => {
    svc.controller.createPipeline({
      name: 'Test-Pipeline', type: 'custom',
      config: { steps: ['lint', 'test'] },
    })
    const list = await svc.controller.listPipelines()
    const id = list.items[0].id
    const updated = svc.controller.updatePipeline(id, {
      description: 'Updated desc',
      enabled: false,
    })
    expect(updated.enabled).toBe(false)
    expect(updated.description).toBe('Updated desc')
  })
})

// ══════════════════════════════════════════════════════════════
// 🛒前台 — 前端触发流水线 & 查看状态
// ══════════════════════════════════════════════════════════════
describe('🛒前台 devops 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('前台触发流水线运行状态变为 running', async () => {
    svc.controller.createPipeline({
      name: 'Frontend-Build', type: 'ci',
      config: { build: 'npm run build' },
    })
    const list = await svc.controller.listPipelines()
    const triggered = svc.controller.triggerPipeline(list.items[0].id)
    expect(triggered.status).toBe('running')
  })

  it('查询流水线运行状态（不存在的流水线返回 passing）', () => {
    const status = svc.service.getPipelineStatus('nonexistent-pipeline-id')
    expect(status.pipeline).toBe('nonexistent-pipeline-id')
    expect(status.status).toBe('passing')
  })

  it('创建部署时指定 staging 环境', async () => {
    svc.controller.createPipeline({
      name: 'Staging-Deploy', type: 'deploy',
      config: {},
    })
    const list = await svc.controller.listPipelines()
    const dep = svc.controller.createDeployment({
      pipelineId: list.items[0].id,
      version: 'v2.1.0',
      branch: 'main',
      env: 'staging',
    })
    expect(dep.version).toBe('v2.1.0')
    expect(dep.env).toBe('staging')
  })
})

// ══════════════════════════════════════════════════════════════
// 👥HR — 人员相关构建任务管理
// ══════════════════════════════════════════════════════════════
describe('👥HR devops 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('HR 创建新员工培训环境构建作业', () => {
    const job = svc.controller.createBuildJob({
      pipelineId: 'pipeline-onboarding',
      branch: 'training',
      commands: ['echo "setup"', 'npm ci', 'npm test'],
      env: { TRAINING_MODE: 'true' },
      timeout: 600,
    })
    expect(job.status).toBe('queued')
    expect(job.commands.length).toBe(3)
  })

  it('查询构建作业详情返回完整字段', async () => {
    svc.controller.createBuildJob({
      pipelineId: 'p-master-ci', branch: 'main',
      commands: ['npm run build'],
      timeout: 300,
    })
    const list = await svc.controller.listBuildJobs()
    const detail = svc.controller.getBuildJob(list.items[0].id)
    expect(detail.id).toBe(list.items[0].id)
    expect(detail.timeout).toBe(300)
  })

  it('查询不存在的构建作业应抛出异常', () => {
    expect(() => svc.controller.getBuildJob('build-nonexistent')).toThrow()
  })
})

// ══════════════════════════════════════════════════════════════
// 🔧安监 — 安全合规流水线管理
// ══════════════════════════════════════════════════════════════
describe('🔧安监 devops 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('安监创建安全扫描流水线并触发', async () => {
    svc.controller.createPipeline({
      name: 'Security-Scan', type: 'ci',
      config: { scan: 'trivy', severity: 'high' },
      triggers: ['weekly'],
    })
    const list = await svc.controller.listPipelines()
    const triggered = svc.controller.triggerPipeline(list.items[0].id)
    expect(triggered.status).toBe('running')
  })

  it('删除安全扫描流水线后列表为空', async () => {
    svc.controller.createPipeline({
      name: 'Old-Scan', type: 'custom',
      config: { obsolete: true },
    })
    const list = await svc.controller.listPipelines()
    svc.controller.deletePipeline(list.items[0].id)
    const afterDelete = await svc.controller.listPipelines()
    expect(afterDelete.total).toBe(0)
  })

  it('执行运维动作验证返回 accepted', () => {
    const result = svc.controller.executeAction({
      action: 'restart',
      target: 'gateway-service',
      params: { graceful: true },
    })
    expect(result.action).toBe('restart')
    expect(result.status).toBe('accepted')
  })
})

// ══════════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏相关部署构建
// ══════════════════════════════════════════════════════════════
describe('🎮导玩员 devops 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('导玩员创建设备固件更新流水线', () => {
    const pipeline = svc.controller.createPipeline({
      name: 'Firmware-OTA', type: 'deploy',
      config: { deviceType: 'arcade-v3', ota_channel: 'stable' },
    })
    expect(pipeline.name).toBe('Firmware-OTA')
    expect(pipeline.status).toBe('idle')
  })

  it('导玩员创建设备绑定构建作业', () => {
    const job = svc.controller.createBuildJob({
      pipelineId: 'p-firmware',
      branch: 'release/v3.2',
      commands: ['compile firmware', 'sign binary', 'upload ota'],
    })
    expect(job.branch).toBe('release/v3.2')
    expect(job.status).toBe('queued')
  })

  it('导玩员查询构建作业列表', async () => {
    svc.controller.createBuildJob({
      pipelineId: 'p-game', branch: 'main',
      commands: ['npm run build:game'],
    })
    svc.controller.createBuildJob({
      pipelineId: 'p-game', branch: 'feature/new-level',
      commands: ['npm run build:game'],
    })
    const list = await svc.controller.listBuildJobs()
    expect(list.total).toBe(2)
  })
})

// ══════════════════════════════════════════════════════════════
// 🎯运行专员 — 日常运维部署管理
// ══════════════════════════════════════════════════════════════
describe('🎯运行专员 devops 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('运行专员创建生产环境部署', async () => {
    svc.controller.createPipeline({
      name: 'Prod-Deploy', type: 'cd',
      config: { env: 'production' },
    })
    const pipelines = await svc.controller.listPipelines()
    const dep = svc.controller.createDeployment({
      pipelineId: pipelines.items[0].id,
      version: 'v3.0.0',
      branch: 'main',
      commit: 'abc123',
      env: 'production',
      notes: 'Release v3.0 正式部署',
    })
    expect(dep.status).toBe('pending')
    expect(dep.steps.length).toBe(4)
  })

  it('运行专员查看部署列表包含创建的部署记录', async () => {
    svc.controller.createPipeline({ name: 'Api-Deploy', type: 'cd', config: {} })
    const pipelines = await svc.controller.listPipelines()
    svc.controller.createDeployment({
      pipelineId: pipelines.items[0].id,
      version: 'v2.5', branch: 'main',
    })
    const deps = await svc.controller.listDeployments()
    expect(deps.total).toBe(1)
    expect(deps.items[0].version).toBe('v2.5')
  })

  it('运行专员查看不存在的部署详情应抛异常', () => {
    expect(() => svc.controller.getDeployment('deploy-nonexistent')).toThrow()
  })
})

// ══════════════════════════════════════════════════════════════
// 🤝团建 — 团建相关的运维构建
// ══════════════════════════════════════════════════════════════
describe('🤝团建 devops 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('团建创建活动报名小程序构建作业', () => {
    const job = svc.controller.createBuildJob({
      pipelineId: 'p-team-building',
      branch: 'feat/signup',
      commands: ['npm install', 'npm run build:mini-program', 'npm test'],
      env: { APP_ENV: 'staging' },
    })
    expect(job.pipelineId).toBe('p-team-building')
  })

  it('团建查看构建列表，按 pipelineId 区分', async () => {
    svc.controller.createBuildJob({ pipelineId: 'p-tb', branch: 'main', commands: ['build'] })
    svc.controller.createBuildJob({ pipelineId: 'p-tb', branch: 'hotfix', commands: ['build'] })
    svc.controller.createBuildJob({ pipelineId: 'p-other', branch: 'main', commands: ['build'] })
    const allJobs = await svc.controller.listBuildJobs()
    expect(allJobs.total).toBe(3)
  })

  it('团建可执行 cleanup 运维操作', () => {
    const result = svc.controller.executeAction({
      action: 'cleanup',
      target: 'temp-artifacts',
    })
    expect(result.action).toBe('cleanup')
    expect(result.status).toBe('accepted')
  })
})

// ══════════════════════════════════════════════════════════════
// 📢营销 — 营销活动部署与构建
// ══════════════════════════════════════════════════════════════
describe('📢营销 devops 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('营销创建营销活动页面部署流水线', () => {
    const pipeline = svc.controller.createPipeline({
      name: 'Campaign-Landing', type: 'deploy',
      config: { framework: 'nextjs', cdn: 'cloudflare' },
      description: '双11活动页部署流水线',
    })
    expect(pipeline.name).toBe('Campaign-Landing')
    expect(pipeline.description).toBe('双11活动页部署流水线')
  })

  it('营销创建 canary 环境部署验证版本', async () => {
    svc.controller.createPipeline({ name: 'Canary-Test', type: 'cd', config: {} })
    const pipelines = await svc.controller.listPipelines()
    const dep = svc.controller.createDeployment({
      pipelineId: pipelines.items[0].id,
      version: 'v1.2.0-rc1',
      branch: 'release/campaign',
      env: 'canary',
    })
    expect(dep.env).toBe('canary')
    expect(dep.version).toBe('v1.2.0-rc1')
  })

  it('营销创建营销数据分析构建作业', () => {
    const job = svc.controller.createBuildJob({
      pipelineId: 'p-analytics',
      branch: 'main',
      commands: [
        'python3 etl/campaign_data.py',
        'python3 analytics/report.py --format html',
      ],
      env: { ANALYTICS_MODE: 'campaign' },
      timeout: 900,
    })
    expect(job.commands.length).toBe(2)
    expect(job.timeout).toBe(900)
  })
})
