import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ImageRecognitionController } from './image-recognition.controller'

describe('ImageRecognitionController metadata', () => {
  it('controller should keep image-recognition path', () => {
    assert.equal(Reflect.getMetadata('path', ImageRecognitionController), 'image-recognition')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [ImageRecognitionController.prototype.createRecognition, 1, 'tasks'],
      [ImageRecognitionController.prototype.listTasks, 0, 'tasks'],
      [ImageRecognitionController.prototype.getTask, 0, 'tasks/:id'],
      [ImageRecognitionController.prototype.cancelTask, 1, 'tasks/:id/cancel'],
      [ImageRecognitionController.prototype.visualSearch, 1, 'visual-search'],
      [ImageRecognitionController.prototype.detectDuplicates, 1, 'duplicates'],
      [ImageRecognitionController.prototype.listEngines, 0, 'engines'],
      [ImageRecognitionController.prototype.stats, 0, 'stats'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
