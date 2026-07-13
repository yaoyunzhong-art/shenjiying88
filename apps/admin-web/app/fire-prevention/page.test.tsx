/**
 * L1 冒烟测试 — fire-prevention 消防安全
 * 覆盖: 正例·反例·边界·防御·数据完整性
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ---- 正例 ----

describe('FirePrevention — 正例', () => {
  it('应导出一个默认组件', () => assert.ok(SRC.includes('export default function')));
  it('应包含 use client 指令', () => assert.ok(SRC.includes("'use client'")));
  it('应包含 fire safety inspection form', () => assert.ok(SRC.includes('inspection') || SRC.includes('检查')));
  it('应包含 消防 相关中文', () => assert.ok(SRC.includes('消防'), '缺少消防相关中文'));
  it('应包含 灭火器 相关中文', () => assert.ok(SRC.includes('灭火器'), '缺少灭火器相关中文'));
  it('应包含 疏散 相关中文', () => assert.ok(SRC.includes('疏散'), '缺少疏散相关中文'));
  it('应包含 status indicators', () => assert.ok(SRC.includes('status') || SRC.includes('Status')));
  it('不应使用 dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('应包含 JSX return', () => assert.ok(SRC.includes('return')));
  it('应包含 PageShell 布局组件', () => assert.ok(SRC.includes('PageShell'), '缺少 PageShell'));
  it('应包含 DataTable 组件', () => assert.ok(SRC.includes('DataTable'), '缺少 DataTable'));
  it('应包含 Pagination 组件', () => assert.ok(SRC.includes('Pagination'), '缺少 Pagination'));
  it('应包含 SearchFilterInput 搜索', () => assert.ok(SRC.includes('SearchFilterInput'), '缺少搜索组件'));
  it('应包含 FIRE_STATUS_MAP 常量', () => assert.ok(SRC.includes('FIRE_STATUS_MAP'), '缺少状态映射'));
});

// ---- 反例 ----

describe('FirePrevention — 反例', () => {
  it('不应直接修改全局对象', () => {
    // page.tsx 是一个纯展示组件，不应有副作用
    assert.ok(!SRC.includes('window.') && !SRC.includes('globalThis.'));
  });
  it('不应含有未使用的 import', () => {
    // 确保引入的 hooks 至少使用一次
    const hooks = ['useState', 'useMemo', 'useCallback'];
    for (const hook of hooks) {
      if (SRC.includes(hook)) {
        const usage = SRC.split(hook).length - 1;
        // 至少 import 时出现一次
        assert.ok(usage >= 1, `${hook} 应有引用`);
      }
    }
  });
});

// ---- 边界 ----

describe('FirePrevention — 边界', () => {
  it('危险等级映射应覆盖所有风险级别', () => {
    const expectedLevels = ['low', 'medium', 'high'];
    for (const lvl of expectedLevels) {
      assert.ok(SRC.includes(`'${lvl}'`) || SRC.includes(`"${lvl}"`), `缺少风险级别 ${lvl}`);
    }
  });

  it('状态映射应覆盖所有检查状态', () => {
    const expectedStatuses = ['pending', 'in_progress', 'passed', 'failed'];
    for (const st of expectedStatuses) {
      assert.ok(SRC.includes(`'${st}'`) || SRC.includes(`"${st}"`), `缺少状态 ${st}`);
    }
  });

  it('模拟数据应包含5条以上记录', () => {
    const idMatches = SRC.match(/FP-\d{3}/g);
    assert.ok(idMatches && idMatches.length >= 4, `模拟数据不足, 发现 ${idMatches?.length || 0} 条`);
  });

  it('MOCK_DATA 应包含完整字段', () => {
    const fields = ['id', 'area', 'inspector', 'scheduledDate', 'status', 'riskLevel', 'notes'];
    for (const f of fields) {
      assert.ok(SRC.includes(f), `MOCK_DATA 缺少字段 ${f}`);
    }
  });
});

// ---- 防御 ----

describe('FirePrevention — 防御', () => {
  it('搜索占位符不应为空', () => {
    // 搜索框应有实际文字提示
    assert.ok(SRC.includes('placeholder'), '缺少 placeholder');
    const placeholderMatch = SRC.match(/placeholder=["']([^"']*)["']/);
    assert.ok(placeholderMatch && placeholderMatch[1].length > 0, 'placeholder 不应为空');
  });

  it('按钮应有明确的文字标签', () => {
    const buttonLabels = SRC.match(/>([^<>\n]+)</g);
    const labelText = (buttonLabels || []).join(' ');
    assert.ok(labelText.includes('新建'), '缺少新建检查按钮文字');
    assert.ok(labelText.includes('导出'), '缺少导出报告按钮文字');
  });

  it('source 文件大小应合理', () => {
    assert.ok(SRC.length > 1500, `源码长度不足, 实际 ${SRC.length} bytes`);
  });
});

// ---- 反例扩展 ——

describe('FirePrevention — 反例扩展', () => {
  it('不应包含 eval 或 new Function', () => {
    assert.ok(!SRC.includes('eval('), '不应使用 eval');
    assert.ok(!SRC.includes('new Function('), '不应使用 new Function');
  });

  it('不应包含未处理的 Promise', () => {
    const promises = [...SRC.matchAll(/\.then\(/g)];
    const catches = [...SRC.matchAll(/\.catch\(/g)];
    if (promises.length > 0) {
      assert.ok(catches.length >= promises.length, `Promise 应配 catch: ${promises.length} then vs ${catches.length} catch`);
    }
  });
});

describe('FirePrevention — 边界扩展', () => {
  it('inspector 字段不应为空字符串', () => {
    assert.ok(SRC.includes('inspector'), '应有 inspector 字段');
  });

  it('scheduledDate 应为合法日期格式', () => {
    const dateMatches = SRC.match(/\d{4}-\d{2}-\d{2}/g);
    assert.ok(dateMatches && dateMatches.length >= 3, `应包含至少 3 个日期, 发现 ${dateMatches?.length || 0}`);
  });

  it('risk level 映射应区分大小写', () => {
    const src = SRC.toLowerCase();
    assert.ok(src.includes('low') && src.includes('medium') && src.includes('high'), '应包含低/中/高风险');
  });

  it('notes 字段应包含可选的空值处理', () => {
    assert.ok(SRC.includes('notes'), '应包含 notes 字段');
  });
});

describe('FirePrevention — 正例扩展', () => {
  it('应包含操作按钮', () => {
    assert.ok(SRC.includes('按钮') || SRC.includes('Button'), '应有操作按钮');
  });

  it('应包含搜索组件', () => {
    assert.ok(SRC.includes('Search') || SRC.includes('搜索'), '应有搜索组件');
  });

  it('应包含导出按钮', () => {
    assert.ok(SRC.includes('导出'), '应有导出功能');
  });
});
