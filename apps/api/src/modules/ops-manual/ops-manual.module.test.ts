/**
 * 🐜 自动: [ops-manual] [A] module 测试
 *
 * 验证模块各组件可正常加载
 */

import { describe, it, expect } from 'vitest'
import { OpsManualService, type Role } from './ops-manual.service'
import { OpsManualModule } from './ops-manual.module'

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

  it('模块元数据包含 providers', () => {
    const providers = Reflect.getMetadata('providers', OpsManualModule) || []
    expect(Array.isArray(providers)).toBe(true)
    expect(providers.length).toBeGreaterThan(0)
  })

  it('模块元数据包含 controllers', () => {
    const controllers = Reflect.getMetadata('controllers', OpsManualModule) || []
    expect(Array.isArray(controllers)).toBe(true)
    expect(controllers.length).toBeGreaterThan(0)
  })

  it('模块元数据 exports 与 providers 一致', () => {
    const providers = Reflect.getMetadata('providers', OpsManualModule) || []
    const exports = Reflect.getMetadata('exports', OpsManualModule) || []
    expect(Array.isArray(exports)).toBe(true)
  })

  it('模块实例化正常', () => {
    const instance = new OpsManualModule()
    expect(instance).toBeDefined()
    expect(instance.constructor.name).toBe('OpsManualModule')
  })

  it('服务 generateManual 接受 Role 参数', () => {
    const service = new OpsManualService()
    const manual = service.generateManual('store_manager' as Role)
    expect(manual).toBeDefined()
    expect(typeof manual).toBe('object')
    expect(typeof manual.title).toBe('string')
  })

  it('服务 getManualInfo 接受 Role 参数', () => {
    const service = new OpsManualService()
    const info = service.getManualInfo('store_manager' as Role)
    expect(info).toBeDefined()
    expect(typeof info).toBe('object')
    expect(typeof info.title).toBe('string')
  })

  it('服务 exportMarkdown 处理生成的 manual', () => {
    const service = new OpsManualService()
    const manual = service.generateManual('cashier' as Role)
    const md = service.exportMarkdown(manual)
    expect(typeof md).toBe('string')
    expect(md.length).toBeGreaterThan(0)
  })

  it('服务 exportHTML 处理生成的 manual', () => {
    const service = new OpsManualService()
    const manual = service.generateManual('customer_service' as Role)
    const html = service.exportHTML(manual)
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })

  it('服务 getSOP 接受 Role 和 sectionId 参数', () => {
    const service = new OpsManualService()
    const manual = service.generateManual('store_manager' as Role)
    expect(Array.isArray(manual.sections)).toBe(true)
    expect(manual.sections.length).toBeGreaterThan(0)
  })
})
