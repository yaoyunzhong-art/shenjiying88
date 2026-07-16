import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [task-scheduler] [D] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TaskSchedulerModule } from './task-scheduler.module'
import { TaskSchedulerController } from './task-scheduler.controller'
import { TaskSchedulerService } from './task-scheduler.service'

describe('TaskSchedulerModule', () => {
  it('should be defined', () => {
    const mod = new TaskSchedulerModule()
    assert.ok(mod instanceof TaskSchedulerModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', TaskSchedulerModule)
    const providers = Reflect.getMetadata('providers', TaskSchedulerModule)
    const exports = Reflect.getMetadata('exports', TaskSchedulerModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(TaskSchedulerController))
    assert.ok(providers.includes(TaskSchedulerService))
    assert.ok(exports.includes(TaskSchedulerService))
  })
})
