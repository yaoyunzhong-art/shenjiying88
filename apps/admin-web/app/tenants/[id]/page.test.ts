import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  BILLING_MAP,
  PLAN_MAP,
  STATUS_MAP,
  getTenantById,
  loadTenantDetailSnapshot,
  submitTenantEdit,
  validateForm,
} from './tenant-detail-data'

describe('Tenant detail snapshot contract', () => {
  it('应返回 mock 快照与来源态证据', async () => {
    const snapshot = await loadTenantDetailSnapshot('t1')
    assert.equal(snapshot.deliveryMode, 'mock')
    assert.equal(snapshot.sourceLabel, 'tenant-detail-mock')
    assert.equal(snapshot.tenant.id, 't1')
    assert.ok(snapshot.refreshPath.includes('loadTenantDetailSnapshot'))
    assert.ok(snapshot.controlPlaneSource.includes('getTenantById'))
    assert.ok(snapshot.note.includes('套餐'))
  })

  it('未知租户 id 应回落到默认样本', () => {
    const tenant = getTenantById('unknown-id')
    assert.equal(tenant.id, 't1')
    assert.equal(tenant.name, '华润万象生活')
  })

  it('已知租户样本应保留状态与套餐信息', () => {
    const tenant = getTenantById('t5')
    assert.equal(tenant.status, 'suspended')
    assert.equal(tenant.plan, 'professional')
    assert.equal(tenant.billingMode, 'yearly')
  })

  it('表单校验应拦截必填项与非法邮箱', () => {
    const errors = validateForm({
      name: '   ',
      contactName: '',
      contactPhone: '',
      contactEmail: 'invalid-email',
      description: '',
    })
    assert.equal(errors.name, '租户名称不能为空')
    assert.equal(errors.contactName, '联系人不能为空')
    assert.equal(errors.contactPhone, '联系电话不能为空')
    assert.equal(errors.contactEmail, '邮箱格式不正确')
  })

  it('合法表单应通过校验且提交接口返回成功', async () => {
    const errors = validateForm({
      name: '华润万象生活',
      contactName: '张华润',
      contactPhone: '+86-10-8888-1111',
      contactEmail: 'zhanghr@cr-mixc.com',
      description: '商业地产运营商',
    })
    assert.equal(Object.keys(errors).length, 0)

    const result = await submitTenantEdit({
      name: '华润万象生活',
      contactName: '张华润',
      contactPhone: '+86-10-8888-1111',
      contactEmail: 'zhanghr@cr-mixc.com',
      description: '商业地产运营商',
    })
    assert.equal(result.success, true)
  })

  it('状态、套餐、计费映射应稳定输出', () => {
    assert.equal(STATUS_MAP.active.label, '运营中')
    assert.equal(STATUS_MAP.suspended.variant, 'danger')
    assert.equal(PLAN_MAP.enterprise.label, '企业版')
    assert.equal(PLAN_MAP.starter.variant, 'warning')
    assert.equal(BILLING_MAP.monthly, '月付')
    assert.equal(BILLING_MAP.yearly, '年付')
  })
})
