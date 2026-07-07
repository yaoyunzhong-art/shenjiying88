/**
 * Phase 102 语音处理 前台 Tests (V11 Sprint 3 Day 44)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useVoiceProcessing' && parent?.filename?.includes('voice-processing-panel')) {
    return require.resolve('./useVoiceProcessing.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { VoiceProcessingPanel } = require('./index')
Module._resolveFilename = origResolveFilename

describe('语音处理前台 V11 Sprint 3 Day 44', () => {
  it('VoiceProcessingPanel 渲染主面板', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, {}))
    assert.ok(html.includes('data-testid="voice-processing-panel"'))
    assert.ok(html.includes('语音处理'))
  })

  it('6 个统计框 (TTS/STT/克隆/声纹/音频/字符)', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, {}))
    assert.ok(html.includes('vp-stat-tts'))
    assert.ok(html.includes('vp-stat-stt'))
    assert.ok(html.includes('vp-stat-clones'))
    assert.ok(html.includes('vp-stat-vps'))
    assert.ok(html.includes('vp-stat-audiosec'))
    assert.ok(html.includes('vp-stat-chars'))
  })

  it('统计数字正确', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, {}))
    assert.ok(html.includes('248'))   // totalTtsTasks
    assert.ok(html.includes('132'))   // totalSttTasks
    assert.ok(html.includes('38,420')) // totalCharacters
  })

  it('4 个 Tab 渲染', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, {}))
    assert.ok(html.includes('vp-tab-tts'))
    assert.ok(html.includes('vp-tab-stt'))
    assert.ok(html.includes('vp-tab-clones'))
    assert.ok(html.includes('vp-tab-voiceprints'))
  })

  it('默认选中 TTS tab', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, {}))
    assert.ok(html.includes('vp-tts-tab'))
  })

  it('渲染 6 个音色', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, {}))
    assert.ok(html.includes('vp-voice-zh-female-xiaoxian'))
    assert.ok(html.includes('vp-voice-zh-male-yunxi'))
    assert.ok(html.includes('vp-voice-en-female-jenny'))
    assert.ok(html.includes('vp-voice-ja-female-nanami'))
  })

  it('音色引擎显示 Azure TTS/Google TTS', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, {}))
    assert.ok(html.includes('Azure TTS'))
    assert.ok(html.includes('Google TTS'))
    assert.ok(html.includes('MiniMax TTS'))
  })

  it('TTS 任务列表显示 2 个', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, {}))
    assert.ok(html.includes('vp-tts-task-tts-001'))
    assert.ok(html.includes('vp-tts-task-tts-002'))
  })

  it('TTS 任务状态 (completed/processing)', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, {}))
    assert.ok(html.includes('已完成'))
    assert.ok(html.includes('合成中'))
  })

  it('TTS 任务情感显示', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, {}))
    assert.ok(html.includes('友好'))  // friendly
    assert.ok(html.includes('专业'))  // professional
  })

  it('5 端 variant: h5', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('5 端 variant: app', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, { variant: 'app' }))
    assert.ok(html.includes('data-variant="app"'))
  })

  it('5 端 variant: miniprogram', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, { variant: 'miniprogram' }))
    assert.ok(html.includes('data-variant="miniprogram"'))
  })

  it('5 端 variant: pad', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, { variant: 'pad' }))
    assert.ok(html.includes('data-variant="pad"'))
  })

  it('defaultTab prop (stt)', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, { defaultTab: 'stt' }))
    // STT tab 包含 STT 任务列表
    assert.ok(html.includes('vp-stt-tab'))
  })

  it('defaultTab prop (clones)', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, { defaultTab: 'clones' }))
    assert.ok(html.includes('vp-clones-tab'))
  })

  it('defaultTab prop (voiceprints)', () => {
    const html = renderToStaticMarkup(React.createElement(VoiceProcessingPanel, { defaultTab: 'voiceprints' }))
    assert.ok(html.includes('vp-vp-tab'))
  })
})