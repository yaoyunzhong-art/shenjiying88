/**
 * contracts/new page 单元测试 — tob-web
 *
 * 测试重点：表单验证逻辑、数据构造、错误处理
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MOCK_CONTRACTS,
  CONTRACT_STATUS_MAP,
  CONTRACT_TYPE_MAP,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  type ContractStatus,
  type ContractType,
  type ContractItem,
} from '../../contracts-data';

import { FIELDS, type NewContractForm } from './contract-form.data';

// ── 辅助函数 ──

function validateField(
  key: keyof NewContractForm,
  value: unknown,
): string | null {
  const field = FIELDS.find((f: { key: keyof NewContractForm }) => f.key === key);
  if (!field) return null;
  for (const rule of field.rules ?? []) {
    const err = rule.validate(value);
    if (err !== null) return err;
  }
  return null;
}

// ── 测试套件 ──

describe('NewContractPage — 新建合同表单验证', () => {
  // ── 基础必填字段 ──

  it('title — 合法值通过', () => {
    assert.equal(validateField('title', '云帆科技 SaaS 订阅年度合同'), null);
    assert.equal(validateField('title', 'ABCD'), null);
  });

  it('title — 少于4字符报错', () => {
    const err = validateField('title', 'AB');
    assert.ok(err !== null && err.includes('至少 4 个字符'));
  });

  it('title — 空字符串报错', () => {
    const err = validateField('title', '   ');
    assert.ok(err !== null && (err.includes('至少 4 个字符') || err.includes('不能为空')));
  });

  it('title — 超过120字符报错', () => {
    const err = validateField('title', 'A'.repeat(121));
    assert.ok(err !== null && err.includes('最多 120 个字符'));
  });

  // ── 公司名称 ──

  it('companyName — 合法值通过', () => {
    assert.equal(validateField('companyName', '云帆科技集团有限公司'), null);
  });

  it('companyName — 少于2字符报错', () => {
    const err = validateField('companyName', 'X');
    assert.ok(err !== null && err.includes('至少 2 个字符'));
  });

  // ── 签约人 ──

  it('signatory — 合法值通过', () => {
    assert.equal(validateField('signatory', '张伟'), null);
  });

  it('signatory — 少于2字符报错', () => {
    const err = validateField('signatory', '张');
    assert.ok(err !== null && err.includes('至少 2 个字符'));
  });

  // ── 金额验证 ──

  it('amount — 有效金额通过', () => {
    assert.equal(validateField('amount', '480000'), null);
    assert.equal(validateField('amount', '1200'), null);
    assert.equal(validateField('amount', '0'), null);
  });

  it('amount — 负数报错', () => {
    const err = validateField('amount', '-100');
    assert.ok(err !== null && err.includes('有效的正数金额'));
  });

  it('amount — 非数字字符报错', () => {
    const err = validateField('amount', '12a00');
    assert.ok(err !== null && err.includes('有效的正数金额'));
  });

  it('amount — 超过9999万报错', () => {
    const err = validateField('amount', '100000000');
    assert.ok(err !== null && err.includes('不能超过'));
  });

  // ── 日期验证 ──

  it('startDate — 有效格式通过', () => {
    assert.equal(validateField('startDate', '2026-07-01'), null);
  });

  it('startDate — 无效格式报错', () => {
    const err = validateField('startDate', '07/01/2026');
    assert.ok(err !== null && err.includes('有效的开始日期'));
  });

  it('endDate — 有效格式通过', () => {
    assert.equal(validateField('endDate', '2026-12-31'), null);
    assert.equal(validateField('endDate', '2026-06-01'), null);
  });

  // ── 描述验证 ──

  it('description — 空字符串通过（非必填）', () => {
    assert.equal(validateField('description', ''), null);
  });

  it('description — 超过500字符报错', () => {
    const err = validateField('description', 'a'.repeat(501));
    assert.ok(err !== null && err.includes('最多 500 个字符'));
  });

  it('description — 500字符以内通过', () => {
    assert.equal(validateField('description', 'a'.repeat(500)), null);
  });

  // ── 字段定义完整性 ──

  it('所有必填字段都正确配置了 required=true', () => {
    const requiredKeys = [
      'title',
      'companyName',
      'signatory',
      'type',
      'status',
      'amount',
      'startDate',
      'endDate',
    ] as (keyof NewContractForm)[];
    for (const key of requiredKeys) {
      const field = FIELDS.find((f: { key: string }) => f.key === key);
      assert.ok(field, `字段 ${key} 应该存在`);
      assert.equal(field!.required, true, `字段 ${key} 应该为必填`);
    }
  });

  it('description 为非必填', () => {
    const field = FIELDS.find((f: { key: string }) => f.key === 'description');
    assert.ok(field);
    assert.equal(field!.required, false);
  });

  it('type 字段有正确的选项', () => {
    const field = FIELDS.find((f: { key: string }) => f.key === 'type');
    assert.ok(field);
    assert.equal(field!.options?.length, CONTRACT_TYPES.length);
    for (const t of CONTRACT_TYPES) {
      const opts = field!.options as { value: string; label: string }[] | undefined;
      const opt = opts?.find((o: { value: string }) => o.value === t);
      assert.ok(opt, `类型 ${t} 应有对应选项`);
      assert.equal(opt!.label, CONTRACT_TYPE_MAP[t]);
    }
  });

  it('status 字段有正确的选项', () => {
    const field = FIELDS.find((f: { key: string }) => f.key === 'status');
    assert.ok(field);
    assert.equal(field!.options?.length, CONTRACT_STATUSES.length);
    for (const s of CONTRACT_STATUSES) {
      const opts = field!.options as { value: string; label: string }[] | undefined;
      const opt = opts?.find((o: { value: string }) => o.value === s);
      assert.ok(opt, `状态 ${s} 应有对应选项`);
      assert.equal(opt!.label, CONTRACT_STATUS_MAP[s].label);
    }
  });

  it('字段总数正确', () => {
    assert.equal(FIELDS.length, 9);
  });
});
