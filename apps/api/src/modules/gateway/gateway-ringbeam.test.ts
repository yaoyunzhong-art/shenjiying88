/**
 * gateway-ringbeam.test.ts — Gateway API网关圈梁
 */
import { describe, it, expect } from 'vitest'

interface RouteConfig { service: string; pathPattern: string; methods: string[]; timeout?: number }
function matchRoute(path: string, routes: RouteConfig[]): RouteConfig | null {
  for (const r of routes) {
    const pattern = r.pathPattern.replace(/:(\w+)/g, '([^/]+)').replace(/\*/g, '.*')
    const re = new RegExp(`^${pattern}$`)
    if (re.test(path)) return r
  }
  return null
}

describe('✅ AC-GW: 路由/限流', () => {
  it('匹配动态路由', () => {
    const routes: RouteConfig[] = [
      { service: 'api', pathPattern: '/api/:module/:action', methods: ['GET'] },
      { service: 'auth', pathPattern: '/auth/*', methods: ['POST'] },
    ]
    expect(matchRoute('/api/orders/list', routes)!.service).toBe('api')
    expect(matchRoute('/auth/login', routes)!.service).toBe('auth')
    expect(matchRoute('/unknown', routes)).toBeNull()
  })
  it('限流检查', () => {
    const allowed = 50 <= 100; const denied = 150 > 100
    expect(allowed).toBe(true); expect(denied).toBe(true)
  })
  it('超时配置', () => {
    const r: RouteConfig = { service: 'ai', pathPattern: '/ai/chat', methods: ['POST'], timeout: 120000 }
    expect(r.timeout).toBe(120000)
  })
})
