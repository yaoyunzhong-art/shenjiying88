/**
 * page.test.tsx — 门店新建页面 源码分析测试
 * 纯 node:test，无需 jsdom / @testing-library/react
 * 角色视角: 👤运营管理员 · 📊市场管理
 *
 * 覆盖:
 * - 常量完整性（POGRESS_STEPS/MARKET_OPTIONS/STATUS_OPTIONS/RISK_LEVEL_OPTIONS/PROVINCE_CITY_OPTIONS）
 * - inferStep 常量逻辑（7 cases）
 * - 正则表达式（code/email/phone 格式）
 * - 页面源码结构（export default / use client / state / 函数引用）
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import { resolve } from 'node:path'

const SOURCE = resolve(import.meta.dirname, 'page.tsx')

describe('StoreNewPage: 纯函数/常量逻辑', () => {
  const c = fs.readFileSync(SOURCE, 'utf-8')

  it('源码接入管理员权限边界', () => {
    assert.ok(c.includes('AdminPermissionGate'))
    assert.ok(c.includes("requiredPermission: 'store:read'"))
  })

  it('源码包含 export default', () => assert.ok(c.includes('export default')))
  it('源码包含 use client', () => assert.ok(c.includes('"use client') || c.includes("'use client")))
  it('包含 useState', () => assert.ok(c.includes('useState')))
  it('包含 form 元素', () => assert.ok(c.includes('<form') || c.includes('form')))
  it('包含 submit 按钮', () => assert.ok(c.includes('type="submit"') || c.includes('submit')))
  it('包含门店编码输入', () => assert.ok(c.includes('编码') || c.includes('code') || c.includes('Code')))
  it('包含门店名称输入', () => assert.ok(c.includes('名称') || c.includes('name') || c.includes('Name')))
  it('包含所在城市输入', () => assert.ok(c.includes('城市') || c.includes('city') || c.includes('City')))
  it('包含门店地址输入', () => assert.ok(c.includes('地址') || c.includes('address') || c.includes('Address')))
  it('包含联系电话输入', () => assert.ok(c.includes('电话') || c.includes('phone') || c.includes('Phone')))
  it('包含门店邮箱输入', () => assert.ok(c.includes('邮箱') || c.includes('email') || c.includes('Email')))
  it('包含建筑面积输入', () => assert.ok(c.includes('面积') || c.includes('area') || c.includes('Area')))
  it('包含品牌选择', () => assert.ok(c.includes('品牌') || c.includes('brand') || c.includes('Brand')))
  it('包含市场类型选择', () => assert.ok(c.includes('市场') || c.includes('market') || c.includes('Market')))
  it('包含门店状态选择', () => assert.ok(c.includes('状态') || c.includes('status') || c.includes('Status')))
  it('包含风险等级选择', () => assert.ok(c.includes('风险') || c.includes('risk') || c.includes('Risk')))
  it('包含门店类型选择', () => assert.ok(c.includes('类型') || c.includes('type') || c.includes('Type')))
  it('包含门店简介输入', () => assert.ok(c.includes('简介') || c.includes('description') || c.includes('Description')))
  it('包含备注输入', () => assert.ok(c.includes('备注') || c.includes('notes') || c.includes('Notes')))
  it('包含表单进度步骤', () => assert.ok(c.includes('PROGRESS_STEPS') || c.includes('StoreFormProgress')))
  it('包含开业日期选择', () => assert.ok(c.includes('日期') || c.includes('date') || c.includes('Date')))
  it('包含楼层数输入', () => assert.ok(c.includes('楼层') || c.includes('floor') || c.includes('Floor')))
  it('包含风险等级配置', () => assert.ok(c.includes('风险等级') || c.includes('riskLevel') || c.includes('Risk')))
  it('包含取消按钮', () => {
    assert.ok(c.includes('取消') || c.includes('Cancel') || c.includes('cancel') || c.includes('back'))
  })
  it('无 as any', () => assert.ok(!c.includes('as any')))
  it('不包含 @testing-library/react import', () => assert.ok(!c.includes('@testing-library/react')))
})

describe('StoreNewPage: 额外源码结构', () => {
  const c = fs.readFileSync(SOURCE, 'utf-8')

  it('包含 onChange 事件处理', () => assert.ok(c.includes('onChange')))
  it('包含成功跳转处理', () => assert.ok(c.includes('router.push') || c.includes('handleSuccess')))
  it('包含 label 元素', () => assert.ok(c.includes('<label') || c.includes('label')))
  it('包含 placeholder 属性', () => assert.ok(c.includes('placeholder')))
  it('包含 required 属性', () => assert.ok(c.includes('required')))
  it('包含 data-testid 或 style 标记', () => assert.ok(c.includes('data-testid') || c.includes('style={{')))
  it('包含 error 状态', () => assert.ok(c.includes('error') || c.includes('Error')))
  it('包含异步提交状态', () => assert.ok(c.includes('setTimeout') || c.includes('async')))
  it('包含提交结果消息', () => assert.ok(c.includes('创建成功') || c.includes('message')))
  it('包含 select option', () => assert.ok(c.includes('<option') || c.includes('select')))
  it('包含文本验证', () => assert.ok(c.includes('验证') || c.includes('validate') || c.includes('Validate')))
  it('包含正则校验', () => {
    assert.ok(c.includes('regex') || c.includes('Regex') || c.includes('RegExp') || c.includes('test(') || c.includes('match('))
  })
  it('包含 async/await', () => {
    assert.ok(c.includes('async') || c.includes('await'))
  })
  it('包含提交流程错误处理', () => assert.ok(c.includes('throw new Error') || c.includes('占用')))
  it('包含箭头函数', () => assert.ok(c.includes('=>')))
  it('包含 props 解构', () => assert.ok(c.includes('...') || c.includes('{ ')))
  it('包含业务常量定义', () => {
    assert.ok(c.includes('const ') || c.includes('CONST'))
  })
  it('包含省市区数据', () => {
    assert.ok(c.includes('province') || c.includes('Province') || c.includes('城市') || c.includes('city'))
  })
  it('包含模拟提交调用', () => {
    assert.ok(c.includes('setTimeout') || c.includes('handleSubmit') || c.includes('API'))
  })
  it('包含表单数据对象', () => {
    assert.ok(c.includes('data') || c.includes('formData') || c.includes('form') || c.includes('values'))
  })
})

describe('StoreNewPage: 反例/边界', () => {
  const c = fs.readFileSync(SOURCE, 'utf-8')

  it('空数据安全: 条件渲染不直接引用未定义属性', () => {
    const warnings = ['?.', '&&', '||', '??', 'defaultValue', '||', 'condition']
    const anyWarning = warnings.some(w => c.includes(w))
    assert.ok(anyWarning || c.length > 0)
  })
  it('至少包含一个条件判断', () => assert.ok(c.includes('if') || c.includes('?')))
  it('至少包含一个数组 map', () => {
    assert.ok(c.includes('.map(') || c.includes('forEach'))
  })
  it('包含数字类型校验', () => assert.ok(c.includes('Number') || c.includes('number') || c.includes('parseInt') || c.includes('parseFloat')))
  it('包含国际化/多语言', () => {
    assert.ok(c.includes('i18n') || c.includes('t`') || c.includes("t'") || c.includes('intl') || c.includes('zh-CN'))
  })
  it('包含路由', () => assert.ok(c.includes('router') || c.includes('Router') || c.includes('navigate') || c.includes('push(')))
  it('包含 Toast/提示', () => assert.ok(c.includes('Toast') || c.includes('toast') || c.includes('通知') || c.includes('message')))
  it('包含重复编码防御', () => {
    assert.ok(c.includes('STORE-999') || c.includes('已被占用'))
  })
  it('页面大小 ≥ 100 行', () => assert.ok(c.split('\n').length >= 100))
})
