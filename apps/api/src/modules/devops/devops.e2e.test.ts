/**
 * devops.e2e.test.ts — DevOps CI/CD 运维模块 E2E 测试
 *
 * 链路:
 *   HTTP → DevopsController → DevopsService
 *
 * 验证:
 *   - 部署配置 (流水线 CRUD、部署清单)
 *   - 健康检查 (getStatus、pipeline 状态)
 *   - 日志采集 (构建作业列表、运维操作)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DevopsController } from './devops.controller'
import { DevopsService } from './devops.service'

async function buildApp() {
  const service = new DevopsService()
  const moduleRef = await Test.createTestingModule({
    controllers: [DevopsController],
    providers: [
      { provide: DevopsService, useValue: service },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, service }
}

describe('DevOps E2E', () => {
  describe('健康检查 — GET /devops/status', () => {
    it('返回模块基本状态', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer()).get('/devops/status')
        assert.equal(res.statusCode, 200)
        assert.equal(res.body.module, 'devops')
        assert.equal(res.body.status, 'ok')
        assert.ok(res.body.pipelines)
        assert.ok(res.body.deployments)
        assert.ok(res.body.builds)
        assert.equal(res.body.pipelines.ci, 'passing')
        assert.equal(res.body.pipelines.cd, 'passing')
      } finally {
        await app.close()
      }
    })
  })

  describe('流水线 CRUD', () => {
    it('创建流水线并返回完整信息', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/devops/pipelines')
          .send({
            name: 'CI-Build-Pipeline',
            type: 'ci',
            config: { nodeVersion: '20', testCommand: 'pnpm test' },
            description: 'Main CI pipeline',
            triggers: ['push', 'pull_request'],
            env: { NODE_ENV: 'test' },
          })
        assert.equal(res.statusCode, 201)
        assert.ok(res.body.id.startsWith('pipeline-'))
        assert.equal(res.body.name, 'CI-Build-Pipeline')
        assert.equal(res.body.type, 'ci')
        assert.equal(res.body.status, 'idle')
        assert.ok(res.body.createdAt)
      } finally {
        await app.close()
      }
    })

    it('查询流水线列表', async () => {
      const { app } = await buildApp()
      try {
        await request(app.getHttpServer()).post('/devops/pipelines').send({ name: 'Deploy-Pipe', type: 'cd', config: {} })
        await request(app.getHttpServer()).post('/devops/pipelines').send({ name: 'Test-Pipe', type: 'ci', config: {} })

        const res = await request(app.getHttpServer()).get('/devops/pipelines')
        assert.equal(res.statusCode, 200)
        assert.ok(res.body.total >= 2)
        assert.ok(Array.isArray(res.body.items))
      } finally {
        await app.close()
      }
    })

    it('更新流水线配置', async () => {
      const { app } = await buildApp()
      try {
        const created = await request(app.getHttpServer())
          .post('/devops/pipelines')
          .send({ name: 'Update-Test', type: 'custom', config: { key: 'old' } })
        const id = created.body.id

        const updated = await request(app.getHttpServer())
          .put(`/devops/pipelines/${id}`)
          .send({ name: 'Updated-Pipe', config: { key: 'new' } })
        assert.equal(updated.statusCode, 200)
        assert.equal(updated.body.name, 'Updated-Pipe')
        assert.equal(updated.body.config.key, 'new')
      } finally {
        await app.close()
      }
    })
  })

  describe('部署清单', () => {
    it('创建部署任务', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/devops/deployments')
          .send({
            pipelineId: 'pipeline-e2e-01',
            version: 'v2.5.0',
            branch: 'main',
            commit: 'abc123def456',
            env: 'staging',
            notes: 'E2E test deployment',
          })
        assert.equal(res.statusCode, 201)
        assert.ok(res.body.id.startsWith('deploy-'))
        assert.equal(res.body.version, 'v2.5.0')
        assert.equal(res.body.env, 'staging')
        assert.equal(res.body.status, 'pending')
        assert.ok(Array.isArray(res.body.steps))
        assert.equal(res.body.steps.length, 4)
      } finally {
        await app.close()
      }
    })

    it('获取部署列表', async () => {
      const { app } = await buildApp()
      try {
        await request(app.getHttpServer()).post('/devops/deployments').send({ pipelineId: 'p1', version: 'v1', branch: 'main' })
        await request(app.getHttpServer()).post('/devops/deployments').send({ pipelineId: 'p2', version: 'v2', branch: 'develop' })

        const res = await request(app.getHttpServer()).get('/devops/deployments')
        assert.equal(res.statusCode, 200)
        assert.ok(res.body.total >= 2)
      } finally {
        await app.close()
      }
    })
  })

  describe('构建作业', () => {
    it('创建构建作业', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/devops/builds')
          .send({
            pipelineId: 'pipeline-e2e-02',
            branch: 'feature/new-feature',
            commit: 'def789abc012',
            commands: ['pnpm install', 'pnpm build', 'pnpm test'],
            timeout: 600,
          })
        assert.equal(res.statusCode, 201)
        assert.ok(res.body.id.startsWith('build-'))
        assert.equal(res.body.status, 'queued')
        assert.equal(res.body.commands.length, 3)
        assert.equal(res.body.timeout, 600)
      } finally {
        await app.close()
      }
    })

    it('构建作业列表返回所有记录', async () => {
      const { app } = await buildApp()
      try {
        await request(app.getHttpServer()).post('/devops/builds').send({ pipelineId: 'p1', branch: 'main', commands: ['echo 1'] })
        await request(app.getHttpServer()).post('/devops/builds').send({ pipelineId: 'p2', branch: 'develop', commands: ['echo 2'] })

        const res = await request(app.getHttpServer()).get('/devops/builds')
        assert.equal(res.statusCode, 200)
        assert.ok(res.body.total >= 2)
      } finally {
        await app.close()
      }
    })
  })

  describe('运维操作', () => {
    it('执行重启操作返回 accepted', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/devops/actions')
          .send({
            action: 'restart',
            target: 'api-server',
            params: { graceful: true },
          })
        assert.equal(res.statusCode, 200)
        assert.equal(res.body.status, 'accepted')
        assert.equal(res.body.action, 'restart')
        assert.equal(res.body.target, 'api-server')
      } finally {
        await app.close()
      }
    })
  })

  describe('触发流水线', () => {
    it('触发流水线后状态变为 running', async () => {
      const { app } = await buildApp()
      try {
        const created = await request(app.getHttpServer())
          .post('/devops/pipelines')
          .send({ name: 'Trigger-Test', type: 'ci', config: {} })
        const id = created.body.id

        const triggered = await request(app.getHttpServer())
          .post(`/devops/pipelines/${id}/trigger`)
        assert.equal(triggered.statusCode, 200)
        assert.equal(triggered.body.status, 'running')
      } finally {
        await app.close()
      }
    })
  })
})
