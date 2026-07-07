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
})
