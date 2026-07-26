import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { DECORATORS } from '@nestjs/swagger/dist/constants'
import { DevopsController } from './devops.controller'

describe('DevopsController metadata', () => {
  it('controller should keep devops path and swagger tags', () => {
    assert.equal(Reflect.getMetadata('path', DevopsController), 'devops')
    assert.deepEqual(Reflect.getMetadata(DECORATORS.API_TAGS, DevopsController), ['devops'])
  })

  it('GET routes should keep REST metadata and swagger summaries', () => {
    const cases = [
      [DevopsController.prototype.getStatus, 'status', 'DevOps 运维服务状态'],
      [DevopsController.prototype.listPipelines, 'pipelines', '流水线列表'],
      [DevopsController.prototype.getPipeline, 'pipelines/:id', '流水线详情'],
      [DevopsController.prototype.getPipelineStatus, 'pipelines/:id/status', '查询流水线状态'],
      [DevopsController.prototype.listDeployments, 'deployments', '部署列表'],
      [DevopsController.prototype.getDeployment, 'deployments/:id', '部署详情'],
      [DevopsController.prototype.listBuildJobs, 'builds', '构建作业列表'],
      [DevopsController.prototype.getBuildJob, 'builds/:id', '构建作业详情'],
    ] as const

    cases.forEach(([handler, path, summary]) => {
      assert.equal(Reflect.getMetadata('method', handler), 0)
      assert.equal(Reflect.getMetadata('path', handler), path)
      assert.equal(Reflect.getMetadata(DECORATORS.API_OPERATION, handler)?.summary, summary)
    })
  })

  it('write routes should keep REST metadata and swagger summaries', () => {
    const cases = [
      [DevopsController.prototype.createPipeline, 'pipelines', '创建流水线'],
      [DevopsController.prototype.updatePipeline, 'pipelines/:id', '更新流水线'],
      [DevopsController.prototype.deletePipeline, 'pipelines/:id', '删除流水线'],
      [DevopsController.prototype.triggerPipeline, 'pipelines/:id/trigger', '触发流水线运行'],
      [DevopsController.prototype.createDeployment, 'deployments', '创建部署'],
      [DevopsController.prototype.createBuildJob, 'builds', '创建构建作业'],
      [DevopsController.prototype.executeAction, 'actions', '执行运维操作'],
    ] as const

    const expectedMethods = [1, 2, 3, 1, 1, 1, 1]

    cases.forEach(([handler, path, summary], index) => {
      assert.equal(Reflect.getMetadata('method', handler), expectedMethods[index])
      assert.equal(Reflect.getMetadata('path', handler), path)
      assert.equal(Reflect.getMetadata(DECORATORS.API_OPERATION, handler)?.summary, summary)
    })
  })
})
