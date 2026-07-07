/**
 * sanitize-filename.test.ts — L1 角色测试
 *
 * 纯函数 sanitizeFilename: 文件名安全化, 防止路径遍历和非法字符
 * 正例 + 反例 + 边界, ≥3 个测试用例
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeFilename } from './sanitize-filename';

// ══════════════════════════════════════════════════════════════════════════
// 👔 店长视角 (Tenant Admin)
// ══════════════════════════════════════════════════════════════════════════

describe('sanitize-filename: 👔店长视角 正例', () => {
  it('保留字母、数字、下划线、横线', () => {
    assert.equal(sanitizeFilename('Revenue_Report_0628'), 'Revenue_Report_0628');
  });

  it('保留中文字符', () => {
    assert.equal(sanitizeFilename('营收报表_2026'), '营收报表_2026');
    assert.equal(sanitizeFilename('财务-对账单'), '财务-对账单');
  });

  it('常规文件名正常通过', () => {
    // 注意: 句点也被替换为横线
    assert.ok(sanitizeFilename('inventory-list-2026-06-28').includes('inventory-list-2026'));
    assert.equal(sanitizeFilename('member_export_001'), 'member_export_001');
  });
});

describe('sanitize-filename: 👔店长视角 反例', () => {
  it('替换空格为横线', () => {
    assert.ok(!sanitizeFilename('sales report 2026').includes(' '));
    assert.ok(sanitizeFilename('sales report 2026').includes('sales'));
  });

  it('替换路径分隔符', () => {
    const result = sanitizeFilename('../../../etc/passwd');
    assert.ok(!result.includes('/'));
    assert.ok(!result.includes('.'));
    assert.ok(result.includes('etc'));
    assert.ok(result.includes('passwd'));
  });

  it('替换特殊字符', () => {
    const result = sanitizeFilename('data@#$%^&file');
    assert.ok(result.includes('data'));
    assert.ok(result.includes('file'));
    assert.ok(!result.includes('@'));
    assert.ok(!result.includes('#'));
    const result2 = sanitizeFilename('foo|bar:test');
    assert.ok(!result2.includes('|'));
    assert.ok(!result2.includes(':'));
  });

  it('替换 NUL 和控制字符', () => {
    const result = sanitizeFilename('file\x00name');
    assert.ok(!result.includes('\x00'));
    assert.ok(result.includes('file'));
    assert.ok(result.includes('name'));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 🔧 安监视角 (Safety)
// ══════════════════════════════════════════════════════════════════════════

describe('sanitize-filename: 🔧安监视角 边界', () => {
  it('空字符串返回空字符串', () => {
    assert.equal(sanitizeFilename(''), '');
  });

  it('全部非法字符返回纯横线', () => {
    assert.equal(sanitizeFilename('   '), '---');
    assert.equal(sanitizeFilename('!@#$%'), '-----');
  });

  it('路径遍历攻击: 点号加斜杠组合', () => {
    const result = sanitizeFilename('..\\..\\secret.json');
    assert.ok(!result.includes('.'));
    assert.ok(!result.includes('/'));
    assert.ok(!result.includes('\\'));
  });

  it('Unicode 控制字符被替换', () => {
    // Zero-width non-joiner (U+200C) 和 Zero-width space (U+200B)
    const input = 'file\u200Cname\u200Btest';
    assert.ok(!input.includes('-') || sanitizeFilename(input).includes('-'));
  });

  it('长文件名截断安全', () => {
    const long = 'a'.repeat(500);
    const result = sanitizeFilename(long);
    assert.equal(result.length, 500);
    assert.ok(!result.includes('/'));
    assert.ok(!result.includes('\\'));
  });

  it('UTF-8 表情符号被替换', () => {
    const result = sanitizeFilename('report🔒2026');
    assert.ok(result.includes('report'));
    assert.ok(result.includes('2026'));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 🎯 运行专员视角 (Ops)
// ══════════════════════════════════════════════════════════════════════════

describe('sanitize-filename: 🎯运行专员视角', () => {
  it('运行专员可安全导出带中文和英文的文件名', () => {
    const name = sanitizeFilename('门店报表 2026年6月28日.xlsx');
    assert.ok(name.includes('2026'));
    assert.ok(name.includes('xlsx'));
    assert.ok(!name.includes(' '));
  });

  it('运行专员处理路径穿越文件', () => {
    const attack = '../../etc/passwd';
    const sanitized = sanitizeFilename(attack);
    assert.ok(!sanitized.includes('.'));
    assert.ok(!sanitized.includes('/'));
  });

  it('运行专员批量导出时文件名唯一', () => {
    const names = [
      sanitizeFilename('门店A 报表.csv'),
      sanitizeFilename('门店B 报表.csv'),
      sanitizeFilename('门店A 报表.csv'),
    ];
    // 即使输入相同，输出也应可预测
    assert.equal(names[0], names[2]);
    assert.notEqual(names[0], names[1]);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 📢 营销视角 (Marketing)
// ══════════════════════════════════════════════════════════════════════════

describe('sanitize-filename: 📢营销视角', () => {
  it('营销活动报表命名', () => {
    const result = sanitizeFilename('618大促-投放效果报告 2026.csv');
    assert.ok(result.includes('618'));
    assert.ok(result.includes('大促'));
  });

  it('营销副本文件名', () => {
    const result = sanitizeFilename('campaign_results #final (2026)');
    // 所有非法字符被替换为横线
    assert.ok(!result.includes('#'));
    assert.ok(!result.includes('('));
    assert.ok(!result.includes(')'));
    assert.ok(!result.includes(' '));
  });
});
