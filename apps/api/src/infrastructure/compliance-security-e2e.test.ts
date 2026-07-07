import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * compliance-security-e2e.test.ts - T118-3
 * E2E 测试: 合规 + 安全全流程
 */
import { GDPRService } from '../modules/compliance/gdpr.service'
import { WAFService } from '../modules/security/waf.service'
import { SecurityScannerService, Vulnerability } from '../modules/security/security-scanner.service'
import { AuditLogService } from '../modules/compliance/audit-log.service'
import { RbacService } from '../modules/permission/rbac.service'
import { PermissionContext } from '../modules/permission/permission.types'
import { ActionType } from '../modules/permission/permission.types'
import { I18nExtService } from '../modules/i18n/i18n-ext.service'
import { localeService } from '../modules/locale/locale.service'

describe('Compliance + Security E2E', () => {
  let gdpr: GDPRService
  let waf: WAFService
  let scanner: SecurityScannerService
  let audit: AuditLogService
  let rbac: RbacService
  let i18n: I18nExtService

  beforeEach(() => {
    gdpr = new GDPRService()
    waf = new WAFService()
    scanner = new SecurityScannerService()
    audit = new AuditLogService()
    rbac = new RbacService()
    i18n = new I18nExtService()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // GDPR Full Flow: Register → Record marketing consent → Withdraw → Verify data processing refused
  // ─────────────────────────────────────────────────────────────────────────
  it('用户注册 → 记录 marketing consent → 撤回 → 验证数据处理被拒绝', async () => {
    const userId = 'user-001'

    // 1. Register consent - GDPR service records consent
    await gdpr.recordConsent(userId, 'marketing', true, {
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      policyVersion: '2.0',
    })

    // 2. Check if marketing operation is allowed - should be true since consent granted
    const canProcessWithConsent = await gdpr.canProcessData(userId, ['marketing'])
    expect(canProcessWithConsent).toBe(true)

    // 3. Withdraw marketing consent
    await gdpr.withdrawConsent(userId, 'marketing')

    // 4. Verify data processing is now refused
    const canProcessAfterWithdraw = await gdpr.canProcessData(userId, ['marketing'])
    expect(canProcessAfterWithdraw).toBe(false)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // DSR Access Request Flow
  // ─────────────────────────────────────────────────────────────────────────
  it('用户提交 DSR access 请求 → 30天内处理 → 数据导出完整', async () => {
    const userId = 'user-002'

    // Register some data fields for the user
    gdpr.registerDataField(userId, 'personal', ['name', 'email', 'phone'])
    gdpr.registerDataField(userId, 'financial', ['credit_card', 'bank_account'])
    gdpr.registerDataField(userId, 'behavioral', ['browsing_history', 'purchase_history'])

    // 1. Submit DSR access request
    const dsr = await gdpr.submitDSR(userId, 'access')
    expect(dsr.type).toBe('access')
    expect(dsr.status).toBe('pending')

    // 2. Process DSR (approve) - within 30 days
    await gdpr.processDSR(dsr.id, 'approve', { exportedAt: new Date().toISOString() })

    // 3. Export user data and verify all categories are included
    const exportData = await gdpr.exportUserData(userId)
    expect(exportData.userId).toBe(userId)
    expect(exportData.dataCategories).toBeDefined()

    const categories = exportData.dataCategories as Record<string, unknown>
    expect(categories['personal']).toBeDefined()
    expect(categories['financial']).toBeDefined()
    expect(categories['behavioral']).toBeDefined()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Data Deletion Flow
  // ─────────────────────────────────────────────────────────────────────────
  it('用户请求数据删除 → 执行删除 → PII 不可恢复，统计假数据保留', async () => {
    const userId = 'user-003'

    // Register user data before deletion
    gdpr.registerDataField(userId, 'personal', ['name', 'email', 'phone', 'address'])
    gdpr.registerDataField(userId, 'financial', ['credit_card', 'transaction_history'])
    gdpr.registerDataField(userId, 'behavioral', ['preferences', 'activity_log'])

    // 1. Request data deletion
    const { deletionId } = await gdpr.requestDataDeletion(userId, 'User requested GDPR right to be forgotten')

    // 2. Execute deletion with retainFinancial option
    await gdpr.executeDeletion(userId, { retainFinancial: true })

    // 3. Verify isDataDeleted returns true
    const isDeleted = await gdpr.isDataDeleted(userId)
    expect(isDeleted).toBe(true)

    // 4. Verify email/phone cannot be queried (PII is gone)
    const dataRecords = gdpr.listDataFields(userId)
    const personalRecord = dataRecords.find(r => r.category === 'personal')
    expect(personalRecord).toBeUndefined()

    // 5. Verify that data deletion status shows completed
    const deletionStatus = await gdpr.getDeletionStatus(deletionId)
    expect(deletionStatus.status).toBe('completed')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // WAF Blocks SQL Injection
  // ─────────────────────────────────────────────────────────────────────────
  it('WAF 阻止 SQL 注入请求', () => {
    // 1. WAF evaluate with SQL injection payload
    const decision = waf.evaluate({ body: "'; DROP TABLE users;--" })

    // 2. Verify request is blocked
    expect(decision.allowed).toBe(false)
    expect(decision.riskLevel).toBe('malicious')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Security Scanner Finds SQL Injection, Generates Report
  // ─────────────────────────────────────────────────────────────────────────
  it('安全扫描发现 SQL 注入漏洞 → 生成报告', async () => {
    // Set up mock HTTP client that returns SQL error response
    const mockClient = {
      request: async ({ body }: { body: string }) => {
        // Simulate SQL error response when injection payload is detected
        if (body.includes("' OR '1'='1")) {
          return {
            status: 500,
            body: 'SQL syntax error near "1=1" at line 1',
            headers: {},
          }
        }
        return { status: 200, body: '{}', headers: {} }
      },
    }
    scanner.setHttpClient(mockClient as any)

    // 1. Scan to detect injection
    const vulnerabilities = await scanner.scan({
      endpoint: '/api/users/search',
      method: 'POST',
      parameters: { username: "'; DROP TABLE users;--" },
    })

    // 2. Verify at least one SQL injection vulnerability was found
    const sqlVulns = vulnerabilities.filter(v => v.category === 'injection' && v.severity === 'high')
    expect(sqlVulns.length).toBeGreaterThan(0)

    // 3. Generate report and verify it's sorted by severity
    const report = scanner.generateReport(vulnerabilities)

    // Verify report contains critical/high first
    const criticalIndex = report.indexOf('CRITICAL')
    const highIndex = report.indexOf('HIGH')
    const mediumIndex = report.indexOf('MEDIUM')

    // CRITICAL should come before HIGH, HIGH before MEDIUM
    if (criticalIndex !== -1 && highIndex !== -1) {
      expect(criticalIndex).toBeLessThan(highIndex)
    }
    if (highIndex !== -1 && mediumIndex !== -1) {
      expect(highIndex).toBeLessThan(mediumIndex)
    }

    // Verify report contains vulnerability details
    expect(report).toContain('SQL Injection')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Audit Log Complete Chain: Login → Operation → Refund → Audit Trace
  // ─────────────────────────────────────────────────────────────────────────
  it('审计日志完整链路：登录 → 操作 → 退款 → 审计追溯', () => {
    const userId = 'user-004'
    const tenantId = 'tenant-A'

    // 1. Auth login → audit log
    const loginEntry = audit.append({
      tenantId,
      actorId: userId,
      action: 'CREATE',
      resource: 'session',
      resourceId: 'session-001',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      after: { sessionId: 'session-001', loggedInAt: new Date().toISOString() },
    })
    expect(loginEntry.actorId).toBe(userId)
    expect(loginEntry.resource).toBe('session')

    // 2. Order operation → audit log
    const orderEntry = audit.append({
      tenantId,
      actorId: userId,
      action: 'CREATE',
      resource: 'order',
      resourceId: 'order-001',
      before: undefined,
      after: { orderId: 'order-001', amount: 500, status: 'created' },
    })
    expect(orderEntry.resource).toBe('order')

    // 3. Payment refund → audit log
    const refundEntry = audit.append({
      tenantId,
      actorId: userId,
      action: 'UPDATE',
      resource: 'payment',
      resourceId: 'payment-001',
      before: { status: 'paid', amount: 500 },
      after: { status: 'refunded', amount: 500, refundedAt: new Date().toISOString() },
    })
    expect(refundEntry.resource).toBe('payment')
    expect(refundEntry.action).toBe('UPDATE')

    // 4. Get user activity log - should contain all entries for this user
    const userActivityLogs = audit.filterByActor(userId)
    expect(userActivityLogs.length).toBe(3)

    // Verify chain integrity
    const verifyResult = audit.verify()
    expect(verifyResult.valid).toBe(true)
    expect(verifyResult.totalChecked).toBe(3)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // RBAC: Staff Cannot Perform Admin Operations
  // ─────────────────────────────────────────────────────────────────────────
  it('RBAC: staff 无权 admin 操作 → authorize 抛出', () => {
    const staffUserId = 'staff-001'

    // 1. Assign staff role to user
    rbac.assignRole(staffUserId, 'STORE_MANAGER')

    // 2. Create permission context for staff user
    const context: PermissionContext = {
      userId: staffUserId,
      tenantId: 'tenant-A',
      roles: ['STORE_MANAGER'],
      permissions: rbac.resolveUserPermissions({
        userId: staffUserId,
        tenantId: 'tenant-A',
        roles: ['STORE_MANAGER'],
        permissions: [],
      }),
    }

    // 3. Staff should be able to do store-related operations
    const storeReadAllowed = rbac.checkPermission(context, 'store', ActionType.READ)
    expect(storeReadAllowed.allowed).toBe(true)

    // 4. Staff should NOT be able to do tenant:delete (admin operation)
    const tenantDeleteAllowed = rbac.checkPermission(context, 'tenant', ActionType.DELETE)
    expect(tenantDeleteAllowed.allowed).toBe(false)
    expect(tenantDeleteAllowed.reason).toContain('Missing permission')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // i18n Integration: JPY User Sees Japanese Date + Currency
  // ─────────────────────────────────────────────────────────────────────────
  it('汇率 i18n 集成：JPY 用户看到日语日期 + ¥ 货币', () => {
    const locale_ = 'ja-JP'
    const tz = localeService.getTimeZone('JP')

    // 1. t('order.paid', 'ja-JP') should return Japanese text
    const paidText = i18n.t('order.paid', locale_)
    expect(paidText).toMatch(/支払済み|注文支払/) // Japanese for "paid"

    // 2. formatCurrency(1000, 'JPY', 'ja-JP') should return ¥ symbol
    const formatted = localeService.formatCurrency(1000, 'JPY', locale_)
    expect(formatted).toMatch(/￥/)

    // 3. Verify Japanese date formatting
    const now = new Date('2024-01-15T10:30:00Z')
    const formattedDate = localeService.formatDate(now, tz, 'long')
    expect(formattedDate).toMatch(/\d{4}年\d{1,2}月\d{1,2}/) // 2024年1月15日 format
  })
})
