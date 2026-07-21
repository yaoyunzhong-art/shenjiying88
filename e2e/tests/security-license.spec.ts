/**
 * Sprint 2 Day 24 - License 模块安全渗透测试
 * 
 * 测试目标:
 * - 0 高危漏洞
 * - SQL 注入防护
 * - XSS 防护
 * - CSRF 防护
 * - 越权访问防护
 * - 敏感信息泄露防护
 */

import { test, expect } from '@playwright/test'

test.describe('【安全测试】License 模块渗透测试', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/license`)
    await page.waitForLoadState('networkidle')
  })

  test.describe('SQL 注入防护测试', () => {
    test('SEC-01: 授权查询 SQL 注入防护', async ({ request }) => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE licenses; --",
        "' UNION SELECT * FROM users --",
        "1; DELETE FROM licenses WHERE '1'='1",
        "' OR 1=1 --",
        "admin'--",
        "' OR 'x'='x",
        "' AND 1=1 --",
        "' AND 1=2 --"
      ]

      for (const payload of sqlInjectionPayloads) {
        const response = await request.get(`${BASE_URL}/api/license/check`, {
          params: {
            tenantId: payload,
            scope: 'default'
          }
        })

        // 验证响应
        expect(response.status()).not.toBe(500) // 不应该返回 500 服务器错误
        const body = await response.text()
        expect(body).not.toContain('SQL') // 不应该暴露 SQL 错误
        expect(body).not.toContain('syntax error') // 不应该暴露语法错误
        expect(body).not.toContain('database error') // 不应该暴露数据库错误
      }
    })

    test('SEC-02: 激活码查询 SQL 注入防护', async ({ request }) => {
      const maliciousCodes = [
        "'; DELETE FROM activation_codes; --",
        "' OR '1'='1' --",
        "1; UPDATE licenses SET status='active'; --",
        "admin'--"
      ]

      for (const code of maliciousCodes) {
        const response = await request.post(`${BASE_URL}/api/license/activate`, {
          data: { code }
        })

        expect(response.status()).not.toBe(500)
        const body = await response.text()
        expect(body).not.toContain('SQL')
        expect(body).not.toContain('syntax error')
      }
    })
  })

  test.describe('XSS 跨站脚本防护测试', () => {
    test('SEC-03: 授权名称 XSS 防护', async ({ page, request }) => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<svg onload=alert("xss")>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
        "' onclick='alert(1)",
        '<body onload=alert("xss")>',
        '<iframe src="javascript:alert(\'xss\')"></iframe>'
      ]

      for (const payload of xssPayloads) {
        // 尝试创建包含 XSS payload 的授权
        const response = await request.post(`${BASE_URL}/api/license`, {
          data: {
            name: payload,
            tenantId: 'xss-test',
            scope: 'default'
          }
        })

        // 验证 XSS 被转义或过滤
        if (response.ok()) {
          const body = await response.json()
          // 如果返回了 name 字段,验证它被正确转义
          if (body.name) {
            expect(body.name).not.toContain('<script>')
            expect(body.name).not.toContain('javascript:')
            expect(body.name).not.toContain('onerror=')
            expect(body.name).not.toContain('onload=')
            expect(body.name).not.toContain('onclick=')
          }
        }
      }
    })

    test('SEC-04: DOM XSS 防护 - 前端渲染安全', async ({ page }) => {
      // 访问可能包含用户输入的页面
      await page.goto(`${BASE_URL}/admin/license`)
      await page.waitForLoadState('networkidle')

      // 检查页面是否设置了正确的 CSP 头
      const cspHeader = await page.evaluate(() => {
        // 检查 meta 标签中的 CSP
        const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
        return meta ? meta.getAttribute('content') : null
      })

      if (cspHeader) {
        // 验证 CSP 配置
        expect(cspHeader).toContain('default-src')
        expect(cspHeader).toContain('script-src')
      }

      // 检查是否使用了 innerHTML/outerHTML 等危险 API
      const dangerousApis = await page.evaluate(() => {
        const results: string[] = []

        // 检查全局作用域
        if (typeof window.eval === 'function') results.push('eval detected')

        // 检查文档中的 script 标签
        const scripts = document.querySelectorAll('script')
        scripts.forEach(script => {
          const src = script.getAttribute('src') || ''
          const content = script.textContent || ''

          // 检查是否包含危险模式
          if (content.includes('eval(')) results.push('eval in inline script')
          if (content.includes('innerHTML')) results.push('innerHTML in inline script')
          if (content.includes('document.write')) results.push('document.write in inline script')
        })

        return results
      })

      // 记录检测到的潜在危险 API (但不一定要失败,因为可能是合法的)
      if (dangerousApis.length > 0) {
        console.log('检测到的潜在危险 API:')
        dangerousApis.forEach(api => console.log(`  - ${api}`))
      }
    })
  })

  test.describe('CSRF 跨站请求伪造防护测试', () => {
    test('SEC-05: 授权管理 API CSRF Token 验证', async ({ request }) => {
      // 尝试不带 CSRF Token 的请求
      const responseWithoutToken = await request.post(`${BASE_URL}/api/license`, {
        data: {
          name: 'csrf-test',
          tenantId: 'csrf-test',
          scope: 'default'
        },
        headers: {
          // 不发送 X-CSRF-Token 头
        }
      })

      // 验证服务器拒绝请求
      expect([403, 419, 422]).toContain(responseWithoutToken.status())

      // 验证响应中包含 CSRF 错误信息
      const body = await responseWithoutToken.text()
      expect(['csrf', 'token', 'forbidden'].some(keyword => body.toLowerCase().includes(keyword))).toBe(true)
    })

    test('SEC-06: 跨域请求 CORS 配置验证', async ({ request }) => {
      // 测试预检请求 (OPTIONS)
      const preflightResponse = await request.fetch(`${BASE_URL}/api/license`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'X-CSRF-Token'
        }
      })

      // 验证服务器不响应恶意的跨域请求
      if (preflightResponse.status() === 204) {
        // 如果返回 204,验证 CORS 头配置正确
        const allowOrigin = preflightResponse.headers()['access-control-allow-origin']
        if (allowOrigin) {
          // 不应该允许任意域名
          expect(allowOrigin).not.toBe('*')
          expect(allowOrigin).not.toBe('https://malicious-site.com')
        }
      } else if (preflightResponse.status() === 403) {
        // 403 也是可接受的,表示服务器拒绝了跨域请求
        console.log('服务器拒绝了跨域预检请求 (403)')
      }

      // 测试实际的跨域请求
      const crossOriginResponse = await request.post(`${BASE_URL}/api/license`, {
        headers: {
          'Origin': 'https://malicious-site.com',
          'Content-Type': 'application/json'
        },
        data: {
          name: 'cors-test',
          tenantId: 'cors-test'
        }
      })

      // 验证跨域请求被拒绝
      expect([403, 419]).toContain(crossOriginResponse.status())
    })
  })

  test.describe('越权访问防护测试', () => {
    test('SEC-07: 租户间数据隔离 - 禁止访问其他租户 License', async ({ request }) => {
      // 租户 A 尝试访问租户 B 的 License
      const tenantA = 'tenant-a-uuid'
      const tenantB = 'tenant-b-uuid'

      // 先为租户 B 创建一个 License
      await request.post(`${BASE_URL}/api/license`, {
        data: {
          name: 'tenant-b-license',
          tenantId: tenantB,
          scope: 'default'
        }
      })

      // 租户 A 尝试查询租户 B 的 License
      const crossTenantResponse = await request.get(`${BASE_URL}/api/license`, {
        params: {
          tenantId: tenantB  // 尝试访问其他租户
        },
        headers: {
          'X-Tenant-Id': tenantA  // 当前登录的是租户 A
        }
      })

      // 验证访问被拒绝
      expect([403, 404]).toContain(crossTenantResponse.status())

      // 验证响应中不包含敏感数据
      const body = await crossTenantResponse.text()
      expect(body).not.toContain('tenant-b-license')
    })

    test('SEC-08: 角色权限控制 - 非管理员禁止敏感操作', async ({ request }) => {
      // 普通用户尝试执行管理员操作
      const normalUser = 'normal-user-uuid'

      // 普通用户尝试挂起 License (管理员操作)
      const suspendResponse = await request.post(`${BASE_URL}/api/license/suspend`, {
        data: {
          licenseId: 'test-license-id'
        },
        headers: {
          'X-User-Role': 'user',  // 普通用户角色
          'X-User-Id': normalUser
        }
      })

      // 验证操作被拒绝
      expect(suspendResponse.status()).toBe(403)

      // 验证错误信息
      const body = await suspendResponse.json()
      expect(body.error).toContain('permission')
      expect(body.error).toContain('admin')
    })
  })

  test.describe('敏感信息泄露防护测试', () => {
    test('SEC-09: API 错误响应不暴露敏感信息', async ({ request }) => {
      // 触发各种错误,验证不泄露敏感信息
      const testCases = [
        {
          name: '数据库连接错误',
          request: () => request.get(`${BASE_URL}/api/license/trigger-db-error`)
        },
        {
          name: '服务器内部错误',
          request: () => request.get(`${BASE_URL}/api/license/trigger-500`)
        },
        {
          name: '不存在的端点',
          request: () => request.get(`${BASE_URL}/api/non-existent-endpoint`)
        }
      ]

      for (const testCase of testCases) {
        console.log(`测试: ${testCase.name}`)

        try {
          const response = await testCase.request()
          const body = await response.text()

          // 验证不泄露敏感信息
          expect(body).not.toContain('password')
          expect(body).not.toContain('secret')
          expect(body).not.toContain('token')
          expect(body).not.toContain('jdbc:')
          expect(body).not.toContain('mongodb://')
          expect(body).not.toContain('redis://')
          expect(body).not.toContain('AWS_ACCESS_KEY')
          expect(body).not.toContain('PRIVATE_KEY')

          // 验证不暴露技术细节
          expect(body.toLowerCase()).not.toContain('stack trace')
          expect(body.toLowerCase()).not.toContain('exception')
          expect(body.toLowerCase()).not.toContain('at ')

          console.log(`✓ ${testCase.name} 通过`)
        } catch (error) {
          console.error(`✗ ${testCase.name} 失败:`, error)
          throw error
        }
      }
    })

    test('SEC-10: 请求/响应中不包含敏感字段', async ({ request }) => {
      // 创建 License 并检查响应
      const createResponse = await request.post(`${BASE_URL}/api/license`, {
        data: {
          name: 'test-license',
          tenantId: 'test-tenant',
          scope: 'default'
        }
      })

      expect(createResponse.ok()).toBe(true)

      const responseBody = await createResponse.text()

      // 验证响应中不包含敏感字段
      const sensitiveFields = [
        'password',
        'secret',
        'privateKey',
        'apiKey',
        'token',
        'auth',
        'credential'
      ]

      for (const field of sensitiveFields) {
        expect(responseBody.toLowerCase()).not.toContain(field)
      }
    })
  })

  test.describe('暴力破解与速率限制防护测试', () => {
    test('SEC-11: 连续失败激活码尝试触发锁定 @smoke @security', async ({ request }) => {
      // Given: 连续的失败激活码尝试
      const failCodes = ['WRONG-0000-0000-0000', 'WRONG-1111-1111-1111', 'WRONG-2222-2222-2222']
      let lastStatusCode = 200

      for (const code of failCodes) {
        const response = await request.post(`${BASE_URL}/api/license/activate`, {
          data: { code }
        })
        lastStatusCode = response.status()
      }

      // Then: 在第5次尝试后应该被锁定或限速
      const response = await request.post(`${BASE_URL}/api/license/activate`, {
        data: { code: 'WRONG-3333-3333-3333' }
      })

      const status = response.status()
      expect(status).toBeGreaterThanOrEqual(429)

      const body = await response.text()
      expect(body.toLowerCase()).toMatch(/too many|rate limit|throttle|retry after|429/i)
    })

    test('SEC-12: 暴力破解后返回 Retry-After 头 @security', async ({ request }) => {
      // Given: 触发速率限制
      for (let i = 0; i < 10; i++) {
        await request.post(`${BASE_URL}/api/license/activate`, {
          data: { code: `SPAM-${i.toString().padStart(4, '0')}` }
        })
      }

      // When: 在限速状态下请求
      const response = await request.post(`${BASE_URL}/api/license/activate`, {
        data: { code: 'SPAM-9999-9999-9999' }
      })

      // Then: 响应头包含 Retry-After
      if (response.status() === 429) {
        const retryAfter = response.headers()['retry-after']
        expect(retryAfter).toBeTruthy()
        const retrySeconds = parseInt(retryAfter!, 10)
        expect(retrySeconds).toBeGreaterThan(0)
        expect(retrySeconds).toBeLessThanOrEqual(3600)
      }
    })

    test('SEC-13: 不同IP触发速率限制独立计算 @security', async ({ request }) => {
      // 模拟不同来源IP的请求
      const ipHeaders = [
        { 'X-Forwarded-For': '192.168.1.1' },
        { 'X-Forwarded-For': '10.0.0.1' },
      ]

      for (const headers of ipHeaders) {
        await request.post(`${BASE_URL}/api/license/activate`, {
          headers: { ...headers, 'Content-Type': 'application/json' },
          data: { code: 'RATE-TEST-0001' }
        })
      }

      // 验证不同IP的请求不被阻断
      const response = await request.post(`${BASE_URL}/api/license/activate`, {
        headers: { 'X-Forwarded-For': '10.0.0.2', 'Content-Type': 'application/json' },
        data: { code: 'RATE-TEST-0002' }
      })

      expect(response.status()).not.toBe(429)
    })

    test('SEC-14: 短时间内大量请求限流 @smoke @security', async ({ request }) => {
      // Given: 短时间内发送大量请求
      const promises: Promise<any>[] = []
      for (let i = 0; i < 50; i++) {
        promises.push(request.post(`${BASE_URL}/api/license/check`, {
          data: { tenantId: `burst-test-${i}`, scope: 'default' }
        }))
      }
      const responses = await Promise.all(promises)

      // Then: 部分请求应被限流
      const statusCodes = responses.map(r => r.status())
      const hasRateLimit = statusCodes.some(code => code === 429)

      if (hasRateLimit) {
        // 找到被限流的响应并验证错误信息
        const rateLimitedResponse = responses.find(r => r.status() === 429)!
        const body = await rateLimitedResponse.text()
        expect(body.toLowerCase()).toMatch(/rate limit|too many|throttle/i)
      } else {
        // 如果全部通过，说明限流阈值高于50次
        console.log('50次并发请求全部通过，限流阈值高于50')
        expect(statusCodes.every(code => code < 500)).toBe(true)
      }
    })
  })

  test.describe('输入验证与边界值测试', () => {
    test('SEC-15: 空激活码处理 @smoke @security', async ({ request }) => {
      // 空字符串
      const response = await request.post(`${BASE_URL}/api/license/activate`, {
        data: { code: '' }
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error || body.message).toBeTruthy()
    })

    test('SEC-16: 超长激活码处理 @security', async ({ request }) => {
      // 超长字符串（500字符）
      const longCode = 'A'.repeat(500)
      const response = await request.post(`${BASE_URL}/api/license/activate`, {
        data: { code: longCode }
      })

      expect(response.status()).toBe(400)
    })

    test('SEC-17: 特殊字符激活码 @security', async ({ request }) => {
      const specialChars = [
        '<script>alert(1)</script>',
        '{{"key": "value"}}',
        '${{7*7}}',
        '<%= system("ls") %>',
        '../../../etc/passwd',
        '\\network\\share\\file',
      ]

      for (const payload of specialChars) {
        const response = await request.post(`${BASE_URL}/api/license/activate`, {
          data: { code: payload }
        })

        // 不返回500错误，应该有适当的错误处理
        expect(response.status()).not.toBe(500)

        const body = await response.text()
        expect(body.toLowerCase()).not.toContain('stack trace')
        expect(body.toLowerCase()).not.toContain('exception')
      }
    })

    test('SEC-18: 缺失必填字段处理 @security', async ({ request }) => {
      // 缺少所有必填字段
      const responseMissing = await request.post(`${BASE_URL}/api/license`, {
        data: {}
      })
      expect(responseMissing.status()).toBe(400)

      // 缺少部分字段
      const responsePartial = await request.post(`${BASE_URL}/api/license`, {
        data: { name: 'partial' }
      })
      expect(responsePartial.status()).toBe(400)

      // null 值
      const responseNull = await request.post(`${BASE_URL}/api/license`, {
        data: { name: null, tenantId: null, scope: null }
      })
      expect(responseNull.status()).toBe(400)
    })

    test('SEC-19: 非法HTTP方法测试 @security', async ({ request }) => {
      // 使用不应该被允许的HTTP方法
      const invalidMethods = ['PUT', 'PATCH', 'DELETE', 'TRACE', 'OPTIONS']

      for (const method of invalidMethods) {
        const response = await request.fetch(`${BASE_URL}/api/license/list`, {
          method: method as any,
          headers: { 'Content-Type': 'application/json' }
        })

        // 应该返回405 Method Not Allowed 或 404
        expect([405, 404, 403]).toContain(response.status())
      }
    })

    test('SEC-20: JSON解析错误处理 @security', async ({ request }) => {
      // 发送无效JSON
      const response = await request.post(`${BASE_URL}/api/license`, {
        headers: { 'Content-Type': 'application/json' },
        data: '{invalid json' as any
      })

      expect(response.status()).toBe(400)

      const body = await response.text()
      expect(body).not.toContain('stack trace')
      expect(body).not.toContain('SyntaxError')
    })
  })

  test.describe('会话管理与Token安全测试', () => {
    test('SEC-21: 缺少认证Token的请求被拒绝 @smoke @security', async ({ request }) => {
      // 不携带任何认证信息
      const response = await request.get(`${BASE_URL}/api/license/list`)
      expect(response.status()).toBe(401)

      const body = await response.text()
      expect(body.toLowerCase()).toMatch(/unauthorized|unauthenticated|login|token/i)
    })

    test('SEC-22: 无效Token被拒绝 @security', async ({ request }) => {
      // 伪造的JWT Token
      const fakeTokens = [
        'invalid-token',
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8',
        'Bearer 12345',
        'token=malicious',
      ]

      for (const token of fakeTokens) {
        const response = await request.get(`${BASE_URL}/api/license/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        expect([401, 403]).toContain(response.status())
      }
    })

    test('SEC-23: 过期Token被拒绝 @security', async ({ request }) => {
      // 已过期的 JWT (exp=0)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjB9.Z7PHSr2IEu0fQ9eUYjq9lL6qJ0e6Ik8mU8TvL3qK0sQ'

      const response = await request.get(`${BASE_URL}/api/license/list`, {
        headers: { 'Authorization': `Bearer ${expiredToken}` }
      })

      expect([401, 403]).toContain(response.status())
    })

    test('SEC-24: Session固定攻击防护 @security', async ({ request }) => {
      // 登录后检查session是否变更
      const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
        data: {
          username: 'admin@example.com',
          password: 'Admin123!'
        }
      })

      if (loginResponse.ok()) {
        const cookies = loginResponse.headers()['set-cookie'] || ''
        // 验证session cookie设置了安全标志
        if (cookies) {
          expect(cookies.toLowerCase()).toMatch(/httponly|secure|samesite/i)
        }
      }
    })
  })

  test.describe('IDOR与权限绕过测试', () => {
    test('SEC-25: 遍历授权ID越权访问 @smoke @security', async ({ request }) => {
      // 尝试遍历授权ID
      const testIds = [
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'lic-admin-001',
        '1',
        '-1',
        '..%2F..%2F..%2Fetc%2Fpasswd',
      ]

      for (const id of testIds) {
        const response = await request.get(`${BASE_URL}/api/license/${encodeURIComponent(id)}`)
        // 不应该返回敏感数据
        expect(response.status()).not.toBe(200)

        const body = await response.text()
        expect(body.toLowerCase()).not.toContain('password')
        expect(body.toLowerCase()).not.toContain('secret')
      }
    })

    test('SEC-26: URL参数篡改防护 @security', async ({ request }) => {
      // 篡改查询参数
      const tamperedParams: Record<string, string>[] = [
        { tenantId: 'admin', role: 'admin' },
        { userId: '__proto__' },
        { page: '1; DROP TABLE users' },
        { limit: '999999999' },
        { offset: '-1' },
      ]

      for (const params of tamperedParams) {
        const response = await request.get(`${BASE_URL}/api/license/list`, {
          params
        })

        expect(response.status()).not.toBe(500)
        const body = await response.text()
        expect(body.toLowerCase()).not.toContain('stack trace')
      }
    })

    test('SEC-27: 批量操作权限校验 @security', async ({ request }) => {
      // 普通用户尝试调用批量挂起API
      const response = await request.post(`${BASE_URL}/api/license/batch-suspend`, {
        data: {
          licenseIds: ['lic-001', 'lic-002', 'lic-003']
        },
        headers: {
          'X-User-Role': 'user'
        }
      })

      expect(response.status()).toBe(403)
    })
  })

  test.describe('HTTP安全头测试', () => {
    test('SEC-28: 安全响应头验证 @smoke @security', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/license`)
      await page.waitForLoadState('networkidle')

      // 获取响应头
      const response = await page.request.get(`${BASE_URL}/admin/license`)
      const headers = response.headers()

      // 验证关键安全头
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy',
        'referrer-policy',
        'permissions-policy',
      ]

      const presentHeaders = securityHeaders.filter(h => headers[h])
      expect(presentHeaders.length).toBeGreaterThanOrEqual(3)

      // 具体验证
      if (headers['x-content-type-options']) {
        expect(headers['x-content-type-options'].toLowerCase()).toBe('nosniff')
      }
      if (headers['x-frame-options']) {
        expect(headers['x-frame-options'].toLowerCase()).toMatch(/deny|sameorigin/i)
      }
      if (headers['strict-transport-security']) {
        expect(headers['strict-transport-security'].toLowerCase()).toContain('max-age=')
      }
    })

    test('SEC-29: CSP策略不包含不安全配置 @security', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/license`)

      const csp = await page.evaluate(() => {
        const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
        return meta ? meta.getAttribute('content') : null
      })

      if (csp) {
        // CSP 不应允许 unsafe-inline 或 unsafe-eval
        expect(csp.toLowerCase()).not.toContain("unsafe-inline")
        expect(csp.toLowerCase()).not.toContain("unsafe-eval")
        expect(csp.toLowerCase()).not.toContain('*')
      }
    })
  })

  test.describe('多角色与租户权限边界测试', () => {
    test('SEC-30: 门店用户无法访问授权管理页面 @smoke @security', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/license`)
      await page.waitForLoadState('networkidle')

      // 门店用户应被重定向或显示无权限
      const currentUrl = page.url()
      const accessDenied = await page.locator('[data-testid="access-denied"]').isVisible().catch(() => false)

      if (currentUrl.includes('/admin/license')) {
        // 如果仍在页面上，验证显示无权限提示
        expect(accessDenied).toBe(true)
      } else {
        // 被重定向
        expect(currentUrl).not.toContain('/admin/license')
      }
    })

    test('SEC-31: 租户管理员不能管理其他租户授权 @security', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/license`, {
        headers: {
          'X-Tenant-Id': 'tenant-a',
          'X-User-Role': 'tenant_admin'
        },
        data: {
          name: 'cross-tenant-license',
          tenantId: 'tenant-b',  // 尝试为其他租户创建
          scope: 'default'
        }
      })

      expect(response.status()).toBe(403)
    })

    test('SEC-32: 已删除用户Token应被拒绝 @security', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/list`, {
        headers: {
          'Authorization': 'Bearer deleted-user-token',
          'X-User-Id': 'deleted-user-uuid'
        }
      })

      expect([401, 403]).toContain(response.status())
    })
  })

  test.describe('参数污染与HTTP拆分测试', () => {
    test('SEC-33: HTTP参数污染防护 @security', async ({ request }) => {
      // 多次发送同一参数
      const response = await request.get(`${BASE_URL}/api/license/list?tenantId=tenant-a&tenantId=tenant-b&tenantId=tenant-c`)

      expect(response.status()).not.toBe(500)
      const body = await response.text()
      expect(body.toLowerCase()).not.toContain('stack trace')
      expect(body.toLowerCase()).not.toContain('exception')
    })

    test('SEC-34: HTTP头部注入防护 @security', async ({ request }) => {
      // 尝试CRLF注入
      const crlfPayload = 'test%0d%0aX-Injected:%20true'

      const response = await request.get(`${BASE_URL}/api/license/list`, {
        headers: {
          'X-Custom-Header': crlfPayload
        }
      })

      expect(response.status()).not.toBe(500)
    })
  })

  test.describe('日志与审计安全测试', () => {
    test('SEC-35: 敏感操作记录审计日志 @smoke @security', async ({ request }) => {
      // 执行敏感操作
      const response = await request.post(`${BASE_URL}/api/license/suspend`, {
        data: { licenseId: 'audit-test-license' },
        headers: {
          'X-User-Role': 'admin',
          'X-User-Id': 'admin-uuid'
        }
      })

      if (response.ok()) {
        // 验证审计日志已被记录（通过审计API查询）
        const auditResponse = await request.get(`${BASE_URL}/api/audit/logs`, {
          params: {
            action: 'license.suspend',
            limit: '1'
          }
        })

        if (auditResponse.ok()) {
          const auditBody = await auditResponse.json()
          expect(auditBody).toBeDefined()
        }
      }
    })

    test('SEC-36: 日志中不记录密码等敏感信息 @security', async ({ page }) => {
      // 登录操作
      await page.goto(`${BASE_URL}/login`)
      await page.fill('[data-testid="login-username"]', 'admin@example.com')
      await page.fill('[data-testid="login-password"]', 'SuperSecretPassword123!')
      await page.click('[data-testid="login-submit"]')

      // 检查网络请求日志中不包含密码
      const requestLogs: string[] = []
      page.on('request', request => {
        requestLogs.push(request.url() + ' ' + request.postData() || '')
      })

      // 再发一次请求
      await page.goto(`${BASE_URL}/admin/license`)
      await page.waitForLoadState('networkidle')

      // 验证password不在网络日志中（如果存在的话）
      for (const log of requestLogs) {
        expect(log).not.toContain('SuperSecretPassword123!')
      }
    })
  })
})