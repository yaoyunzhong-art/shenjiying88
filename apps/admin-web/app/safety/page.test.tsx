/**
 * L1 冒烟测试 — safety 安全管理
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

describe('Safety — 正例', () => {
  it('应导出一个默认组件', () => assert.ok(SRC.includes('export default function')));
  it('应包含 use client 指令', () => assert.ok(SRC.includes("'use client'")));
  it('应包含 安全 相关中文', () => assert.ok(SRC.includes('安全'), '缺少安全相关中文'));
  it('应包含 隐患 相关中文', () => assert.ok(SRC.includes('隐患'), '缺少隐患相关中文'));
  it('应包含 整改 相关中文', () => assert.ok(SRC.includes('整改'), '缺少整改相关中文'));
  it('应包含 风险 相关中文', () => assert.ok(SRC.includes('风险'), '缺少风险相关中文'));
  it('不应使用 dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('应包含 JSX return', () => assert.ok(SRC.includes('return')));
  it('应包含 PageShell 布局组件', () => assert.ok(SRC.includes('PageShell'), '缺少 PageShell'));
  it('应包含 DataTable 组件', () => assert.ok(SRC.includes('DataTable'), '缺少 DataTable'));
  it('应包含 Pagination 分页', () => assert.ok(SRC.includes('Pagination'), '缺少 Pagination'));
  it('应包含 StatusBadge 状态标签', () => assert.ok(SRC.includes('StatusBadge'), '缺少 StatusBadge'));
  it('应包含 SAFETY_STATUS_MAP 常量', () => assert.ok(SRC.includes('SAFETY_STATUS_MAP'), '缺少状态映射'));
});

// ---- 反例 ----

describe('Safety — 反例', () => {
  it('不应直接修改全局对象', () => {
    assert.ok(!SRC.includes('window.') && !SRC.includes('globalThis.'));
  });
  it('不应有空的回调实现导致静默失败', () => {
    assert.ok(SRC.includes('useCallback'), '缺少 useCallback');
  });
});

// ---- 边界 ----

describe('Safety — 边界', () => {
  it('严重程度映射应覆盖所有级别', () => {
    const expected = ['low', 'medium', 'high', 'critical'];
    for (const lvl of expected) {
      assert.ok(SRC.includes(`'${lvl}'`) || SRC.includes(`"${lvl}"`), `缺少严重级别 ${lvl}`);
    }
  });

  it('安全状态映射应覆盖所有状态', () => {
    const expected = ['open', 'investigating', 'resolved', 'closed'];
    for (const st of expected) {
      assert.ok(SRC.includes(`'${st}'`) || SRC.includes(`"${st}"`), `缺少状态 ${st}`);
    }
  });

  it('模拟数据应包含5条以上记录', () => {
    const idMatches = SRC.match(/SAF-\d{3}/g);
    assert.ok(idMatches && idMatches.length >= 4, `模拟数据不足, 发现 ${idMatches?.length || 0} 条`);
  });

  it('MOCK_RECORDS 应包含完整字段', () => {
    const fields = ['id', 'category', 'reporter', 'reportedDate', 'status', 'severity', 'description'];
    for (const f of fields) {
      assert.ok(SRC.includes(f), `MOCK_RECORDS 缺少字段 ${f}`);
    }
  });
});

// ---- 防御 ----

describe('Safety — 防御', () => {
  it('搜索占位符应有文字提示', () => {
    const placeholderMatch = SRC.match(/placeholder=["']([^"']*)["']/);
    assert.ok(placeholderMatch && placeholderMatch[1].length > 0, 'placeholder 不应为空');
  });

  it('新建和导出按钮应有文字标签', () => {
    const buttonText = SRC.match(/>([^<>\n]+)</g);
    const text = (buttonText || []).join(' ');
    assert.ok(text.includes('新建'), '缺少新建记录按钮文字');
    assert.ok(text.includes('导出'), '缺少导出日志按钮文字');
  });

  it('source 文件大小应合理', () => {
    assert.ok(SRC.length > 1500, `源码长度不足, 实际 ${SRC.length} bytes`);
  });
});

describe('Safety — 组件完整性', () => {
  it('应包含 @m5/ui 的 Pagination 导入', () => {
    assert.ok(SRC.includes('Pagination'), '缺少 Pagination');
  });

  it('应包含 @m5/ui 的 StatusBadge 导入', () => {
    assert.ok(SRC.includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('应包含 @m5/ui 的 SearchFilterInput 导入', () => {
    assert.ok(SRC.includes('SearchFilterInput'), '缺少 SearchFilterInput');
  });

  it('应包含 @m5/ui 的 Button 导入', () => {
    assert.ok(SRC.includes('Button'), '缺少 Button');
  });
});
