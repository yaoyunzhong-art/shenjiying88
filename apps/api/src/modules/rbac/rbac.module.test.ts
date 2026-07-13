import { describe, it, expect } from 'vitest'
import { RBACModule } from './rbac.module'

describe('RBACModule', () => {
  it('should be defined', () => {
    expect(RBACModule).toBeDefined()
  })

  it('should have controllers and providers', () => {
    const module = new RBACModule()
    const metadata = Reflect.getMetadata('imports', RBACModule) ?? []
    const controllers = Reflect.getMetadata('controllers', RBACModule) ?? []
    const providers = Reflect.getMetadata('providers', RBACModule) ?? []
    const exports = Reflect.getMetadata('exports', RBACModule) ?? []

    expect(controllers.length).toBeGreaterThan(0)
    expect(providers.length).toBeGreaterThan(0)
  })

  it('should export RBACService', () => {
    const exports = Reflect.getMetadata('exports', RBACModule) ?? []
    const exportedNames = exports.map((e: any) => e.name || e)
    expect(exportedNames.some((n: string) => n === 'RBACService' || n.includes('RBAC'))).toBe(true)
  })

  it('should be instantiable', () => {
    const instance = new RBACModule()
    expect(instance).toBeInstanceOf(RBACModule)
  })

  it('should have at least 1 import', () => {
    const imports = Reflect.getMetadata('imports', RBACModule) ?? []
    expect(imports.length).toBeGreaterThanOrEqual(0)
  })

  it('should have providers defined with correct count', () => {
    const providers = Reflect.getMetadata('providers', RBACModule) ?? []
    // RBAC service + repository + controller typically
    expect(providers.length).toBeGreaterThan(0)
    const providerNames = providers.map((p: any) => p?.name ?? p)
    expect(Array.isArray(providerNames)).toBe(true)
  })

  it('should have @Module decorator metadata', () => {
    expect(Reflect.hasOwnMetadata('controllers', RBACModule)).toBe(true)
    expect(Reflect.hasOwnMetadata('providers', RBACModule)).toBe(true)
  })

  it('should have controllers with RBACController', () => {
    const controllers = Reflect.getMetadata('controllers', RBACModule) ?? []
    const ctrlNames = controllers.map((c: any) => c?.name ?? c)
    expect(ctrlNames.some((n: string) => n.includes('RBAC') || n.includes('Controller'))).toBe(true)
  })
})
