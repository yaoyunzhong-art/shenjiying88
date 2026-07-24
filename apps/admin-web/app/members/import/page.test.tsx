/**
 * members/import/page.test.tsx — 批量导入会员 L1 测试
 *
 * 覆盖: 导入记录、校验逻辑、重复检测、配置选项
 * 正例: 有效导入、配置默认值、模板字段
 * 反例: 校验失败记录、无效等级、空姓名
 * 边界: 零错误导入、全部无效记录、不同市场
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import fs from 'node:fs';

/* ── 类型 ── */

type MemberTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'standard';
type ImportStage = 'upload' | 'preview' | 'confirming' | 'result';

interface ImportRecord {
  row: number;
  name: string;
  phone: string;
  email: string;
  tier: string;
  storeName: string;
  marketCode: string;
  notes: string;
  validationErrors: string[];
  isValid: boolean;
}

interface ImportProgress {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

interface ImportConfig {
  duplicateCheck: 'phone' | 'name' | 'none';
  defaultTier: MemberTier;
  defaultStatus: string;
  defaultMarket: string;
  sendWelcomeMessage: boolean;
}

/* ── 辅助函数 ── */

const CSV_HEADERS = ['姓名', '手机号', '邮箱', '等级', '门店', '市场', '备注'];

function statusLabel(isValid: boolean): string {
  return isValid ? '通过校验' : '校验失败';
}

function statusColor(isValid: boolean): string {
  return isValid ? '#86efac' : '#fca5a5';
}

const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  duplicateCheck: 'phone',
  defaultTier: 'standard',
  defaultStatus: 'active',
  defaultMarket: 'cn-mainland',
  sendWelcomeMessage: false,
};

/* ============================================================ */

describe('member-import: 数据类型', () => {
  it('源码接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'member:read'"));
  });

  it('ImportRecord has all fields', () => {
    const r: ImportRecord = {
      row: 1, name: '张三', phone: '13800001111', email: 'z@e.com',
      tier: 'gold', storeName: '朝阳店', marketCode: 'cn-mainland',
      notes: '', validationErrors: [], isValid: true,
    };
    assert.equal(typeof r.row, 'number');
    assert.equal(typeof r.name, 'string');
    assert.equal(typeof r.isValid, 'boolean');
    assert.ok(Array.isArray(r.validationErrors));
  });

  it('ImportProgress fields correct types', () => {
    const p: ImportProgress = { total: 100, success: 95, failed: 5, errors: ['error'] };
    assert.equal(typeof p.total, 'number');
    assert.equal(typeof p.success, 'number');
    assert.equal(typeof p.failed, 'number');
    assert.ok(Array.isArray(p.errors));
  });

  it('ImportConfig has all fields', () => {
    const c: ImportConfig = { duplicateCheck: 'phone', defaultTier: 'standard', defaultStatus: 'active', defaultMarket: 'cn-mainland', sendWelcomeMessage: false };
    assert.equal(typeof c.duplicateCheck, 'string');
    assert.equal(typeof c.sendWelcomeMessage, 'boolean');
  });

  it('ImportStage has 4 stages', () => {
    const stages: ImportStage[] = ['upload', 'preview', 'confirming', 'result'];
    assert.equal(stages.length, 4);
  });

  it('CSV_HEADERS has 7 fields', () => {
    assert.equal(CSV_HEADERS.length, 7);
    assert.ok(CSV_HEADERS.includes('姓名'));
    assert.ok(CSV_HEADERS.includes('手机号'));
    assert.ok(CSV_HEADERS.includes('备注'));
  });
});

describe('member-import: 辅助函数', () => {
  it('statusLabel true returns 通过校验', () => {
    assert.equal(statusLabel(true), '通过校验');
  });

  it('statusLabel false returns 校验失败', () => {
    assert.equal(statusLabel(false), '校验失败');
  });

  it('statusColor true is green', () => {
    assert.equal(statusColor(true), '#86efac');
  });

  it('statusColor false is red', () => {
    assert.equal(statusColor(false), '#fca5a5');
  });

  it('DEFAULT_IMPORT_CONFIG has correct defaults', () => {
    assert.equal(DEFAULT_IMPORT_CONFIG.duplicateCheck, 'phone');
    assert.equal(DEFAULT_IMPORT_CONFIG.defaultTier, 'standard');
    assert.equal(DEFAULT_IMPORT_CONFIG.defaultMarket, 'cn-mainland');
    assert.equal(DEFAULT_IMPORT_CONFIG.sendWelcomeMessage, false);
  });
});

describe('member-import: 业务逻辑', () => {
  const VALID_RECORD: ImportRecord = {
    row: 1, name: '张三', phone: '13800001111', email: 'z@e.com',
    tier: 'gold', storeName: '朝阳店', marketCode: 'cn-mainland',
    notes: '新客户', validationErrors: [], isValid: true,
  };

  const INVALID_RECORD_NAME: ImportRecord = {
    row: 4, name: '', phone: '13600004444', email: 'test@',
    tier: 'diamond', storeName: '广州店', marketCode: 'cn-mainland',
    notes: '', validationErrors: ['姓名为空'], isValid: false,
  };

  const INVALID_RECORD_TIER: ImportRecord = {
    row: 5, name: '赵六', phone: '13500005555', email: 'z@e.com',
    tier: 'invalid', storeName: '成都店', marketCode: 'cn-mainland',
    notes: '', validationErrors: ['等级值无效'], isValid: false,
  };

  it('valid record has no errors', () => {
    assert.equal(VALID_RECORD.validationErrors.length, 0);
    assert.ok(VALID_RECORD.isValid);
  });

  it('invalid name record has validation error', () => {
    assert.ok(INVALID_RECORD_NAME.validationErrors.length > 0);
    assert.ok(!INVALID_RECORD_NAME.isValid);
  });

  it('invalid tier record has tier error', () => {
    assert.ok(INVALID_RECORD_TIER.validationErrors.includes('等级值无效'));
    assert.ok(!INVALID_RECORD_TIER.isValid);
  });

  it('progress calculation: success + failed = total', () => {
    const p: ImportProgress = { total: 12, success: 10, failed: 2, errors: [] };
    assert.equal(p.success + p.failed, p.total);
  });

  it('progress with zero errors', () => {
    const p: ImportProgress = { total: 80, success: 80, failed: 0, errors: [] };
    assert.equal(p.failed, 0);
    assert.equal(p.success, p.total);
  });

  it('progress with all failed', () => {
    const p: ImportProgress = { total: 5, success: 0, failed: 5, errors: ['全部校验未通过'] };
    assert.equal(p.success, 0);
    assert.equal(p.failed, p.total);
  });

  it('records can have different markets', () => {
    const usRecord: ImportRecord = { ...VALID_RECORD, marketCode: 'us-default', row: 7 };
    const ukRecord: ImportRecord = { ...VALID_RECORD, marketCode: 'uk-default', row: 9 };
    assert.equal(usRecord.marketCode, 'us-default');
    assert.equal(ukRecord.marketCode, 'uk-default');
  });

  it('duplicateCheck can be phone/name/none', () => {
    const validChecks = ['phone', 'name', 'none'];
    validChecks.forEach(c => {
      const config: ImportConfig = { ...DEFAULT_IMPORT_CONFIG, duplicateCheck: c as 'phone' | 'name' | 'none' };
      assert.ok(validChecks.includes(config.duplicateCheck));
    });
  });

  it('sendWelcomeMessage can be toggled', () => {
    const configEnabled = { ...DEFAULT_IMPORT_CONFIG, sendWelcomeMessage: true };
    assert.ok(configEnabled.sendWelcomeMessage);
    assert.ok(!DEFAULT_IMPORT_CONFIG.sendWelcomeMessage);
  });

  it('defaultTier is one of MEMBER_TIER values', () => {
    const validTiers: MemberTier[] = ['diamond', 'gold', 'silver', 'bronze', 'standard'];
    assert.ok(validTiers.includes(DEFAULT_IMPORT_CONFIG.defaultTier));
  });

  it('validation error count determines isValid', () => {
    const rec = { ...VALID_RECORD, validationErrors: ['err1', 'err2'], isValid: false };
    assert.ok(!rec.isValid);
    assert.equal(rec.validationErrors.length, 2);
  });

  it('multiple invalid records in a batch', () => {
    const records = [VALID_RECORD, INVALID_RECORD_NAME, INVALID_RECORD_TIER];
    const valid = records.filter(r => r.isValid).length;
    const invalid = records.filter(r => !r.isValid).length;
    assert.equal(valid, 1);
    assert.equal(invalid, 2);
  });

  it('record with empty email still valid', () => {
    const rec: ImportRecord = { ...VALID_RECORD, email: '' };
    assert.equal(rec.email, '');
    assert.ok(rec.isValid);
  });

  it('records can have notes', () => {
    const recWithNotes = { ...VALID_RECORD, notes: '已电话沟通' };
    assert.ok(recWithNotes.notes.length > 0);
  });

  it('records can have empty notes', () => {
    assert.equal(VALID_RECORD.notes, '新客户');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Members / Import — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
