import { JSDOM } from 'jsdom'
// 全局注入 DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
})
globalThis.document = dom.window.document
globalThis.window = dom.window
globalThis.navigator = dom.window.navigator
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.HTMLInputElement = dom.window.HTMLInputElement
globalThis.HTMLButtonElement = dom.window.HTMLButtonElement
// 将 Node.js 测试的 assert 暴露
