import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { OcrController } from './ocr.controller'
import { OcrService } from './ocr.service'
import { runWithTenant } from '../../common/context/tenant-context'
const TENANT_ID = 'test-tenant-001'


describe('OcrController', () => {
  let controller: InstanceType<typeof OcrController>
  let service: InstanceType<typeof OcrService>

  function withTenant<T>(fn: () => T): Promise<T> {
    return runWithTenant({ tenantId: TENANT_ID, userId: 'test-user' }, fn)
  }

  beforeEach(() => {
    service = new OcrService()
    controller = new OcrController(service)
  })

  describe('route metadata', () => {
    it('should have correct controller path', () => {
      const path = Reflect.getMetadata('path', OcrController)
      assert.equal(path, 'ocr')
    })

    it('createTask should be POST method with path tasks', () => {
      const method = Reflect.getMetadata('method', OcrController.prototype.createTask)
      const path = Reflect.getMetadata('path', OcrController.prototype.createTask)
      assert.equal(method, 1) // POST
      assert.equal(path, 'tasks')
    })

    it('listTasks should be GET tasks', () => {
      const method = Reflect.getMetadata('method', OcrController.prototype.listTasks)
      const path = Reflect.getMetadata('path', OcrController.prototype.listTasks)
      assert.equal(method, 0) // GET
      assert.equal(path, 'tasks')
    })

    it('getTask should be GET tasks/:id', () => {
      const method = Reflect.getMetadata('method', OcrController.prototype.getTask)
      const path = Reflect.getMetadata('path', OcrController.prototype.getTask)
      assert.equal(method, 0)
      assert.equal(path, 'tasks/:id')
    })

    it('cancelTask should be POST tasks/:id/cancel', () => {
      const method = Reflect.getMetadata('method', OcrController.prototype.cancelTask)
      const path = Reflect.getMetadata('path', OcrController.prototype.cancelTask)
      assert.equal(method, 1)
      assert.equal(path, 'tasks/:id/cancel')
    })

    it('deleteTask should be DELETE tasks/:id', () => {
      const method = Reflect.getMetadata('method', OcrController.prototype.deleteTask)
      const path = Reflect.getMetadata('path', OcrController.prototype.deleteTask)
      assert.equal(method, 3) // DELETE
      assert.equal(path, 'tasks/:id')
    })

    it('listBlocks should be GET tasks/:id/blocks', () => {
      const method = Reflect.getMetadata('method', OcrController.prototype.listBlocks)
      const path = Reflect.getMetadata('path', OcrController.prototype.listBlocks)
      assert.equal(method, 0)
      assert.equal(path, 'tasks/:id/blocks')
    })

    it('parseDocument should be POST documents', () => {
      const method = Reflect.getMetadata('method', OcrController.prototype.parseDocument)
      const path = Reflect.getMetadata('path', OcrController.prototype.parseDocument)
      assert.equal(method, 1)
      assert.equal(path, 'documents')
    })

    it('listDocuments should be GET documents', () => {
      const method = Reflect.getMetadata('method', OcrController.prototype.listDocuments)
      const path = Reflect.getMetadata('path', OcrController.prototype.listDocuments)
      assert.equal(method, 0)
      assert.equal(path, 'documents')
    })

    it('listEngines should be GET engines', () => {
      const method = Reflect.getMetadata('method', OcrController.prototype.listEngines)
      const path = Reflect.getMetadata('path', OcrController.prototype.listEngines)
      assert.equal(method, 0)
      assert.equal(path, 'engines')
    })

    it('stats should be GET stats', () => {
      const method = Reflect.getMetadata('method', OcrController.prototype.stats)
      const path = Reflect.getMetadata('path', OcrController.prototype.stats)
      assert.equal(method, 0)
      assert.equal(path, 'stats')
    })
  })

  describe('POST /ocr/tasks - createTask', () => {
    it('should create a task and return it', async () => {
      const result = await withTenant(() => controller.createTask({ sourceAssetId: 'asset-001' }))

      assert.ok(result.id)
      assert.equal(result.status, 'completed')
      assert.ok(result.summary)
    })

    it('should create task with custom engine and language', async () => {
      const result = await withTenant(() =>
        controller.createTask({ sourceAssetId: 'asset-002', engine: 'mock-tesseract', language: 'en-US' })
      )

      assert.equal(result.engine, 'mock-tesseract')
      assert.equal(result.language, 'en-US')
    })

    it('should reject invalid engine', async () => {
      await assert.rejects(
        () => withTenant(() => controller.createTask({ sourceAssetId: 'asset-003', engine: 'bad-engine' as any })),
        /OCR 引擎 bad-engine 不存在/
      )
    })
  })

  describe('GET /ocr/tasks - listTasks', () => {
    it('should list all tasks', async () => {
      await withTenant(() => controller.createTask({ sourceAssetId: 'list-001' }))
      await withTenant(() => controller.createTask({ sourceAssetId: 'list-002' }))

      const result = await withTenant(() => controller.listTasks({}))
      assert.ok(result.items.length >= 2)
      assert.equal(result.total, result.items.length)
    })

    it('should filter by status', async () => {
      const result = await withTenant(() => controller.listTasks({ status: 'completed' }))
      result.items.forEach((item: any) => assert.equal(item.status, 'completed'))
    })
  })

  describe('GET /ocr/tasks/:id - getTask', () => {
    it('should return task by id', async () => {
      const created = await withTenant(() => controller.createTask({ sourceAssetId: 'get-task' }))
      const fetched = await withTenant(() => controller.getTask(created.id))
      assert.equal(fetched.id, created.id)
    })

    it('should throw for non-existent task', async () => {
      await assert.rejects(() => withTenant(() => controller.getTask('fake-id')), /不存在/)
    })
  })

  describe('POST /ocr/tasks/:id/cancel - cancelTask', () => {
    it('should throw when cancelling completed task', async () => {
      const task = await withTenant(() => controller.createTask({ sourceAssetId: 'cancel-me' }))
      await assert.rejects(() => withTenant(() => controller.cancelTask(task.id)), /已是终态/)
    })
  })

  describe('DELETE /ocr/tasks/:id - deleteTask', () => {
    it('should delete task without throwing', async () => {
      const task = await withTenant(() => controller.createTask({ sourceAssetId: 'delete-me' }))
      await assert.doesNotReject(() => withTenant(() => controller.deleteTask(task.id)))
    })
  })

  describe('GET /ocr/tasks/:id/blocks - listBlocks', () => {
    it('should return blocks for existing task', async () => {
      const task = await withTenant(() => controller.createTask({ sourceAssetId: 'blocks' }))
      const result = await withTenant(() => controller.listBlocks(task.id))
      assert.ok(result.items.length > 0)
      assert.equal(result.total, result.items.length)
    })
  })

  describe('POST /ocr/documents - parseDocument', () => {
    it('should parse a PDF document', async () => {
      const doc = await withTenant(() => controller.parseDocument({ sourceAssetId: 'test-doc-pdf', parser: 'mock-pdfplumber' }))

      assert.ok(doc.id)
      assert.equal(doc.status, 'parsed')
      assert.equal(doc.format, 'pdf')
    })
  })

  describe('GET /ocr/documents - listDocuments', () => {
    it('should list documents with filter', async () => {
      await withTenant(() => controller.parseDocument({ sourceAssetId: 'list-pdf', parser: 'mock-pdfplumber' }))

      const result = await withTenant(() => controller.listDocuments({ format: 'pdf' }))
      assert.ok(result.items.length >= 1)
      result.items.forEach((d: any) => assert.equal(d.format, 'pdf'))
    })
  })

  describe('GET /ocr/documents/:id - getDocument', () => {
    it('should return document by id', async () => {
      const doc = await withTenant(() => controller.parseDocument({ sourceAssetId: 'get-doc', parser: 'mock-pdfplumber' }))
      const fetched = await withTenant(() => controller.getDocument(doc.id))
      assert.equal(fetched.id, doc.id)
    })
  })

  describe('GET /ocr/engines - listEngines', () => {
    it('should return engine list', async () => {
      const result = await controller.listEngines()
      assert.ok(Array.isArray(result.items))
      assert.ok(result.items.length >= 12)
    })
  })

  describe('GET /ocr/stats - stats', () => {
    it('should return stats', async () => {
      await withTenant(() => controller.createTask({ sourceAssetId: 'stats-asset' }))
      const stats = await withTenant(() => controller.stats())
      assert.ok(stats.totalTasks >= 1)
      assert.ok(typeof stats.avgConfidence === 'number')
    })
  })
})
