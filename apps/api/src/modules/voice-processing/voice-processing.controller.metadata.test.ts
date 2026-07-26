import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { VoiceProcessingController } from './voice-processing.controller'

describe('VoiceProcessingController metadata', () => {
  it('controller should keep voice path', () => {
    assert.equal(Reflect.getMetadata('path', VoiceProcessingController), 'voice')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [VoiceProcessingController.prototype.createTts, 1, 'tts/tasks'],
      [VoiceProcessingController.prototype.listTts, 0, 'tts/tasks'],
      [VoiceProcessingController.prototype.getTts, 0, 'tts/tasks/:id'],
      [VoiceProcessingController.prototype.cancelTts, 1, 'tts/tasks/:id/cancel'],
      [VoiceProcessingController.prototype.createStt, 1, 'stt/tasks'],
      [VoiceProcessingController.prototype.listStt, 0, 'stt/tasks'],
      [VoiceProcessingController.prototype.getStt, 0, 'stt/tasks/:id'],
      [VoiceProcessingController.prototype.listSttSegments, 0, 'stt/tasks/:id/segments'],
      [VoiceProcessingController.prototype.cancelStt, 1, 'stt/tasks/:id/cancel'],
      [VoiceProcessingController.prototype.cloneVoice, 1, 'clones'],
      [VoiceProcessingController.prototype.listClones, 0, 'clones'],
      [VoiceProcessingController.prototype.deleteClone, 3, 'clones/:id'],
      [VoiceProcessingController.prototype.enrollVoiceprint, 1, 'voiceprints'],
      [VoiceProcessingController.prototype.listVoiceprints, 0, 'voiceprints'],
      [VoiceProcessingController.prototype.identify, 1, 'voiceprints/identify'],
      [VoiceProcessingController.prototype.listTtsEngines, 0, 'engines/tts'],
      [VoiceProcessingController.prototype.listSttEngines, 0, 'engines/stt'],
      [VoiceProcessingController.prototype.listVoices, 0, 'voices'],
      [VoiceProcessingController.prototype.stats, 0, 'stats'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
