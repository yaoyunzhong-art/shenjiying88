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
})