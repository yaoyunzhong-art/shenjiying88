// @ts-nocheck
import 'reflect-metadata'
import { beforeAll, describe, it } from 'vitest'
import assert from 'node:assert/strict'

describe('OcrController metadata', () => {
  let OcrController: any

  beforeAll(async () => {
    ;({ OcrController } = await import('./ocr.controller.ts'))
  })

  it('controller should keep ocr path', () => {
    assert.equal(Reflect.getMetadata('path', OcrController), 'ocr')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [OcrController.prototype.createTask, 1, 'tasks'],
      [OcrController.prototype.listTasks, 0, 'tasks'],
      [OcrController.prototype.getTask, 0, 'tasks/:id'],
      [OcrController.prototype.cancelTask, 1, 'tasks/:id/cancel'],
      [OcrController.prototype.deleteTask, 3, 'tasks/:id'],
      [OcrController.prototype.listBlocks, 0, 'tasks/:id/blocks'],
      [OcrController.prototype.parseDocument, 1, 'documents'],
      [OcrController.prototype.listDocuments, 0, 'documents'],
      [OcrController.prototype.listEngines, 0, 'engines'],
      [OcrController.prototype.stats, 0, 'stats'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
