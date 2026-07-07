/**
 * 🐜 自动: [ops-manual] [A] module 测试
 *
 * 验证模块各组件可正常加载
 */

import { describe, it, expect } from 'vitest'
import { OpsManualService } from './ops-manual.service'

describe('OpsManualModule', () => {
  it('服务导出所有方法', () => {
    const service = new OpsManualService()
    expect(typeof service.generateManual).toBe('function')
    expect(typeof service.exportMarkdown).toBe('function')
    expect(typeof service.exportHTML).toBe('function')
    expect(typeof service.searchManual).toBe('function')
    expect(typeof service.getSOP).toBe('function')
    expect(typeof service.getManualInfo).toBe('function')
    expect(typeof service.generateStoreManagerManual).toBe('function')
    expect(typeof service.generateSalesStaffManual).toBe('function')
    expect(typeof service.generateCashierManual).toBe('function')
    expect(typeof service.generateCustomerServiceManual).toBe('function')
  })
})
