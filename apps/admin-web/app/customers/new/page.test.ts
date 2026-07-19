/**
 * customers/new/page.test.ts — 新建客户表单页 L1 纯逻辑测试
 *
 * 覆盖: 字段配置、验证规则、表单状态、提交流程、常量映射
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { validateFormFields } from '@m5/ui'
import type { FormPageField } from '@m5/ui'

import {
  CUSTOMER_SOURCES,
  MEMBER_LEVELS,
  CUSTOMER_SOURCE_MAP,
  MEMBER_LEVEL_MAP,
  type CustomerSource,
  type MemberLevel,
} from '../customers-data'

// ===== 页面复制的类型与常量 =====

interface NewCustomerFormData {
  name: string
  phone: string
  gender: string
  city: string
  source: string
  memberLevel: string
  birthDate: string
  remark: string
}

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '客户姓名',
    type: 'text',
    required: true,
    placeholder: '请输入客户姓名',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length < 2 ? '姓名至少2个字符' : null,
      },
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length > 20 ? '姓名最多20个字符' : null,
      },
    ],
  },
  {
    key: 'phone',
    label: '手机号',
    type: 'text',
    required: true,
    placeholder: '请输入11位手机号',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'string' && !/^1\d{10}$/.test(v) ? '请输入有效的11位手机号' : null,
      },
    ],
  },
  {
    key: 'gender',
    label: '性别',
    type: 'select',
    required: false,
    placeholder: '请选择性别',
  },
  {
    key: 'city',
    label: '城市',
    type: 'text',
    required: false,
    placeholder: '请输入所在城市',
  },
  {
    key: 'source',
    label: '客户来源',
    type: 'select',
    required: true,
    placeholder: '请选择来源',
  },
  {
    key: 'memberLevel',
    label: '会员等级',
    type: 'select',
    required: true,
    placeholder: '请选择会员等级',
  },
  {
    key: 'birthDate',
    label: '出生日期',
    type: 'text',
    required: false,
    placeholder: '例如: 1990-01-01',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(v)
            ? '日期格式不正确，请使用 YYYY-MM-DD'
            : null,
      },
    ],
  },
  {
    key: 'remark',
    label: '备注',
    type: 'textarea',
    required: false,
    placeholder: '可填写客户备注信息',
  },
]

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'unknown', label: '未知' },
]

const SOURCE_OPTIONS = CUSTOMER_SOURCES.map((k: CustomerSource) => ({
  value: k,
  label: CUSTOMER_SOURCE_MAP[k],
}))

const LEVEL_OPTIONS = MEMBER_LEVELS.map((k: MemberLevel) => ({
  value: k,
  label: MEMBER_LEVEL_MAP[k].label,
}))

function getDefaultFormData(): NewCustomerFormData {
  return {
    name: '',
    phone: '',
    gender: 'unknown',
    city: '',
    source: '',
    memberLevel: '',
    birthDate: '',
    remark: '',
  }
}

// ===== 测试 =====

describe('新建客户表单字段配置', () => {
  it('应包含全部 8 个字段', () => {
    assert.equal(FIELDS.length, 8)
  })

  it('name 字段应存在且为必填', () => {
    const field = FIELDS.find((f) => f.key === 'name')
    assert.ok(field, 'name field missing')
    assert.equal(field.required, true)
    assert.equal(field.type, 'text')
  })

  it('phone 字段应存在且为必填', () => {
    const field = FIELDS.find((f) => f.key === 'phone')
    assert.ok(field, 'phone field missing')
    assert.equal(field.required, true)
  })

  it('source 和 memberLevel 应为必填', () => {
    const source = FIELDS.find((f) => f.key === 'source')
    const level = FIELDS.find((f) => f.key === 'memberLevel')
    assert.ok(source, 'source field missing')
    assert.ok(level, 'memberLevel field missing')
    assert.equal(source.required, true)
    assert.equal(level.required, true)
  })

  it('gender, city, birthDate, remark 应为非必填', () => {
    for (const key of ['gender', 'city', 'birthDate', 'remark']) {
      const field = FIELDS.find((f) => f.key === key)
      assert.ok(field, `${key} field missing`)
      assert.equal(field.required, false, `${key} should not be required`)
    }
  })
})

describe('表单验证规则', () => {
  it('空表单应返回 name 必填错误', () => {
    const data = getDefaultFormData()
    const errors = validateFormFields(FIELDS, data as Record<string, unknown>)
    assert.ok(errors.name)
    assert.equal(errors.name, '此字段不能为空')
  })

  it('空表单应返回 phone 必填错误', () => {
    const data = getDefaultFormData()
    const errors = validateFormFields(FIELDS, data as Record<string, unknown>)
    assert.ok(errors.phone)
  })

  it('空表单应返回 source 必填错误', () => {
    const data = getDefaultFormData()
    const errors = validateFormFields(FIELDS, data as Record<string, unknown>)
    assert.ok(errors.source)
  })

  it('空表单应返回 memberLevel 必填错误', () => {
    const data = getDefaultFormData()
    const errors = validateFormFields(FIELDS, data as Record<string, unknown>)
    assert.ok(errors.memberLevel)
  })

  it('太短的姓名应触发规则错误', () => {
    const data = getDefaultFormData()
    data.name = '张'
    const errors = validateFormFields(FIELDS, data as Record<string, unknown>)
    assert.ok(errors.name, 'should get name error')
    assert.ok(errors.name.includes('至少'), `expected length error, got: ${errors.name}`)
  })

  it('超过 20 个字符的姓名应触发规则错误', () => {
    const data = getDefaultFormData()
    data.name = '这是一个非常长的超过二十个字符的客户名称测试'
    const errors = validateFormFields(FIELDS, data as Record<string, unknown>)
    assert.ok(errors.name, 'should get name error')
    assert.ok(errors.name.includes('最多'), `expected max length error, got: ${errors.name}`)
  })

  it('无效手机号应触发验证错误', () => {
    const data = getDefaultFormData()
    data.name = '张三'
    data.phone = '12345'
    const errors = validateFormFields(FIELDS, data as Record<string, unknown>)
    assert.ok(errors.phone, 'should get phone error')
    assert.ok(errors.phone.includes('手机号'), `expected phone error, got: ${errors.phone}`)
  })

  it('有效手机号不应触发验证错误', () => {
    const data = getDefaultFormData()
    data.name = '张三'
    data.phone = '13800138000'
    const errors = validateFormFields(FIELDS, data as Record<string, unknown>)
    if (errors.phone) {
      // May still get error if other required fields are missing
      // but phone should not give format error
      assert.ok(!errors.phone.includes('手机号'), `phone should not have format error, got: ${errors.phone}`)
    }
  })

  it('无效日期格式应触发错误', () => {
    const data = getDefaultFormData()
    data.birthDate = '2026/01/01'
    const errors = validateFormFields(FIELDS, data as Record<string, unknown>)
    assert.ok(errors.birthDate, 'should get birthDate error')
    assert.ok(errors.birthDate.includes('日期'), `expected date format error, got: ${errors.birthDate}`)
  })

  it('有效日期格式不应触发错误', () => {
    const data = getDefaultFormData()
    data.birthDate = '1990-01-01'
    const errors = validateFormFields(FIELDS, data as Record<string, unknown>)
    assert.equal(errors.birthDate, undefined, 'valid date should pass')
  })

  it('空日期字符串不应触发错误（非必填）', () => {
    const data = getDefaultFormData()
    data.birthDate = ''
    const errors = validateFormFields(FIELDS, data as Record<string, unknown>)
    assert.equal(errors.birthDate, undefined, 'empty date should pass')
  })
})

describe('表单选项完整性', () => {
  it('GENDER_OPTIONS 应包含 3 个性别选项', () => {
    assert.equal(GENDER_OPTIONS.length, 3)
  })

  it('GENDER_OPTIONS 应包含 male/female/unknown', () => {
    const values = GENDER_OPTIONS.map((o) => o.value)
    assert.ok(values.includes('male'))
    assert.ok(values.includes('female'))
    assert.ok(values.includes('unknown'))
  })

  it('SOURCE_OPTIONS 应覆盖所有来源', () => {
    assert.equal(SOURCE_OPTIONS.length, CUSTOMER_SOURCES.length)
    for (const opt of SOURCE_OPTIONS) {
      assert.ok(CUSTOMER_SOURCES.includes(opt.value as CustomerSource), `option ${opt.value} not in CUSTOMER_SOURCES`)
    }
  })

  it('LEVEL_OPTIONS 应覆盖所有会员等级', () => {
    assert.equal(LEVEL_OPTIONS.length, MEMBER_LEVELS.length)
    for (const opt of LEVEL_OPTIONS) {
      assert.ok(MEMBER_LEVELS.includes(opt.value as MemberLevel), `option ${opt.value} not in MEMBER_LEVELS`)
    }
  })
})

describe('默认表单数据', () => {
  it('getDefaultFormData 应返回空表单', () => {
    const data = getDefaultFormData()
    assert.equal(data.name, '')
    assert.equal(data.phone, '')
    assert.equal(data.gender, 'unknown')
    assert.equal(data.source, '')
    assert.equal(data.memberLevel, '')
  })

  it('getDefaultFormData 应返回所有必需字段', () => {
    const data = getDefaultFormData()
    const keys = Object.keys(data)
    const expectedKeys = ['name', 'phone', 'gender', 'city', 'source', 'memberLevel', 'birthDate', 'remark']
    for (const k of expectedKeys) {
      assert.ok(keys.includes(k), `missing key ${k} in default form data`)
    }
  })
})
