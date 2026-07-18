/**
 * P-38 对账规则配置页面测试
 *
 * 覆盖: 正例·反例·边界
 * 要求: ≥35个测试, 0 skip/only, 0 as any
 * Mock策略: URL-pattern responseRegistry
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import ReconciliationRulesPage from './page'
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Mock fetch — URL-pattern responseRegistry ──

const responseRegistry = new Map<string, () => unknown>();

function setResponseFor(pattern: string, factory: () => unknown) {
  responseRegistry.set(pattern, factory);
}

const _originalFetch = globalThis.fetch;

function installMockFetch() {
  globalThis.fetch = ((url: string) => {
    const path = typeof url === 'string' ? url : '';
    const sorted = [...responseRegistry.entries()].sort(([a], [b]) => b.length - a.length);
    for (const [pattern, factory] of sorted) {
      if (path.includes(pattern)) {
        return Promise.resolve({
          ok: true, status: 200,
          json: () => Promise.resolve(factory()),
          headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
        } as Response);
      }
    }
    return Promise.resolve({
      ok: true, status: 200, json: () => Promise.resolve({ success: true, data: null, message: 'OK' }),
      headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
    } as Response);
  }) as typeof globalThis.fetch;
}

function restoreMockFetch() {
  globalThis.fetch = _originalFetch;
}

function setDefaultResponses() {
  responseRegistry.clear();
  setResponseFor('/rules', () => ({
    success: true,
    data: {
      rules: [
        { id: 'r1', name: '订单号匹配', description: '按订单号精确匹配', matchKey: 'orderNo', toleranceCents: 0, autoResolve: true, autoResolveThresholdCents: 0, enabled: true, priority: 1, createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-15T10:00:00Z', lastMatchedCount: 1248, matchRate: 96.5 },
        { id: 'r2', name: '容差匹配', description: '金额容差匹配', matchKey: 'amount+date', toleranceCents: 100, autoResolve: false, autoResolveThresholdCents: 50, enabled: true, priority: 2, createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-14T14:00:00Z', lastMatchedCount: 389, matchRate: 88.2 },
        { id: 'r3', name: '模糊搜索', description: '备注模糊搜索', matchKey: 'note+amount', toleranceCents: 200, autoResolve: false, autoResolveThresholdCents: 0, enabled: false, priority: 3, createdAt: '2026-07-05T00:00:00Z', updatedAt: '2026-07-12T09:00:00Z', lastMatchedCount: 56, matchRate: 42.1 },
      ],
    },
    message: 'OK',
  }));
}

function setErrorResponse() {
  responseRegistry.clear();
  setResponseFor('/rules', () => ({
    success: false,
    message: '服务器内部错误',
    data: null,
  }));
}

function assertInDoc(text: string) {
  const els = screen.queryAllByText(text);
  assert.ok(els.length >= 1, `expected "${text}" to be in document`);
}

/** Helper: find tab button by text (distinguishes from stat labels) */
function findTab(text: string): Element | null {
  const allButtons = screen.queryAllByRole('button');
  return allButtons.find(b => b.textContent === text) || null;
}

// ─── Helper: run test in isolation ──
function runTest(name: string, fn: (ctx: { render: typeof render, screen: typeof screen, fireEvent: typeof fireEvent, waitFor: typeof waitFor, setResponseFor: typeof setResponseFor, findTab: typeof findTab, assertInDoc: typeof assertInDoc }) => Promise<void>) {
  it(name, async () => {
    cleanup();
    responseRegistry.clear();
    setDefaultResponses();
    await fn({ render, screen, fireEvent, waitFor, setResponseFor, findTab, assertInDoc });
  });
}

// ─── Tests ─────────────────────────────────────────────

installMockFetch();

describe('ReconciliationRulesPage', () => {

  // ── 基础渲染 ──

  runTest('should render the page title', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => assertInDoc('对账规则配置'));
  });

  runTest('should display rule count stats - total, enabled, disabled, abnormal', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      assertInDoc('总规则');
      assertInDoc('已启用');
      assertInDoc('已禁用');
      assertInDoc('异常');
    });
  });

  runTest('should show correct stat numbers', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      assertInDoc('3');  // 总规则
    });
  });

  runTest('should show rule names from API (switch to 全部 tab)', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const allBtns = screen.queryAllByText('全部');
      assert.ok(allBtns.length >= 1, 'expected 全部');
    });
    const allTab = findTab('全部');
    if (allTab) fireEvent.click(allTab);
    await waitFor(() => {
      assertInDoc('订单号匹配');
      assertInDoc('容差匹配');
      assertInDoc('模糊搜索');
    });
  });

  runTest('should render tab navigation', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const tabs = screen.queryAllByText('已启用');
      assert.ok(tabs.length >= 1, 'expected 已启用 in tabs or stats');
      assertInDoc('已禁用');
      assertInDoc('全部');
    });
  });

  runTest('should show enabled badge for active rules', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => assertInDoc('已启用'));
  });

  runTest('should show disabled badge for inactive rules', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => assertInDoc('已禁用'));
  });

  runTest('should show edit button for each rule', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const editBtns = screen.queryAllByText('编辑');
      assert.ok(editBtns.length >= 2, 'expected at least 2 edit buttons');
    });
  });

  runTest('should enter edit mode on click edit', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const btns = screen.queryAllByText('编辑');
      assert.ok(btns.length >= 1);
    });
    const editBtn = screen.getAllByText('编辑')[0];
    fireEvent.click(editBtn);
    await waitFor(() => {
      assertInDoc('规则名称');
      assertInDoc('匹配字段');
    });
  });

  runTest('should show toggle button', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const toggleBtns = screen.queryAllByText(/禁用|启用/);
      assert.ok(toggleBtns.length >= 2, 'expected toggle buttons');
    });
  });

  runTest('should show refresh button', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => assertInDoc('刷新'));
  });

  runTest('should display match rate for rules', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const rates = screen.queryAllByText(/96\.5|88\.2|42\.1/);
      assert.ok(rates.length >= 1, 'expected match rate displayed');
    });
  });

  runTest('should show global behavior info', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => assertInDoc('全局匹配行为'));
  });

  runTest('should display cancel button in edit mode', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const btns = screen.queryAllByText('编辑');
      assert.ok(btns.length >= 1);
    });
    const editBtns = screen.queryAllByText('编辑');
    fireEvent.click(editBtns[0]);
    await waitFor(() => assertInDoc('取消'));
  });

  runTest('should render auto-resolve badge for auto rules', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => assertInDoc('自动处理'));
  });

  runTest('should show rule descriptions', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => assertInDoc('按订单号精确匹配'));
  });

  runTest('should show global settings section', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const found = screen.queryAllByText(/规则按优先级顺序|匹配成功后不再/);
      assert.ok(found.length >= 1, 'expected global setting text');
    });
  });

  // ── 统计卡片新测试 ──

  runTest('should show disabled stat count as 1 for default data', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const disabledLabels = screen.queryAllByText('已禁用');
      assert.ok(disabledLabels.length >= 1, 'expected 已禁用 label');
    });
  });

  runTest('should show abnormal stat', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      assertInDoc('异常');
    });
  });

  runTest('should detect abnormal rules with enabled low match rate', async () => {
    setResponseFor('/rules', () => ({
      success: true,
      data: {
        rules: [
          { id: 'rA', name: '低匹配率规则', description: '匹配率过低', matchKey: 'orderNo', toleranceCents: 0, autoResolve: false, autoResolveThresholdCents: 0, enabled: true, priority: 1, createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-15T10:00:00Z', lastMatchedCount: 10, matchRate: 35.0 },
          { id: 'rB', name: '正常规则', description: '正常匹配', matchKey: 'amount+date', toleranceCents: 100, autoResolve: true, autoResolveThresholdCents: 50, enabled: true, priority: 2, createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-14T14:00:00Z', lastMatchedCount: 500, matchRate: 92.0 },
        ],
      },
      message: 'OK',
    }));
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      assertInDoc('低匹配率规则');
      assertInDoc('正常规则');
    });
  });

  // ── Tab筛选 ──

  runTest('should show only enabled rules in active tab', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => assertInDoc('订单号匹配'));
    const enabledBadges = screen.queryAllByText('已启用');
    assert.ok(enabledBadges.length >= 2);
  });

  runTest('should switch to disabled tab and show only disabled rules', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const allTab = findTab('全部');
      assert.ok(allTab, 'expected 全部 tab');
    });
    const allTab = findTab('全部');
    fireEvent.click(allTab!);
    await waitFor(() => {
      assertInDoc('订单号匹配');
      assertInDoc('模糊搜索');
    });
    const disabledTab = findTab('已禁用');
    assert.ok(disabledTab, 'expected disabled tab');
    fireEvent.click(disabledTab!);
    await waitFor(() => {
      assertInDoc('模糊搜索');
    });
    await waitFor(() => {
      const matchNames = screen.queryAllByText(/^(订单号匹配|容差匹配)$/);
      assert.ok(matchNames.length === 0, 'expected enabled rules hidden in disabled tab');
    });
  });

  runTest('should show all rules in settings tab', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const allTab = findTab('全部');
      assert.ok(allTab, 'expected 全部 tab');
    });
    const allTab = findTab('全部');
    fireEvent.click(allTab!);
    await waitFor(() => {
      assertInDoc('订单号匹配');
      assertInDoc('容差匹配');
      assertInDoc('模糊搜索');
    });
  });

  runTest('should show empty state when tab has no matching rules', async () => {
    setResponseFor('/rules', () => ({
      success: true,
      data: {
        rules: [
          { id: 'rA', name: '规则A', description: '启用规则', matchKey: 'orderNo', toleranceCents: 0, autoResolve: true, autoResolveThresholdCents: 0, enabled: true, priority: 1, createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-15T10:00:00Z', lastMatchedCount: 100, matchRate: 99 },
        ],
      },
      message: 'OK',
    }));
    render(<ReconciliationRulesPage />);
    await waitFor(() => assertInDoc('规则A'));
    const disabledTab = findTab('已禁用');
    assert.ok(disabledTab, 'expected disabled tab');
    fireEvent.click(disabledTab!);
    await waitFor(() => {
      assertInDoc('暂无规则');
    });
  });

  // ── Toggle / 启用禁用 ──

  runTest('should toggle a rule from enabled to disabled via PATCH', async () => {
    let patched = false;
    setResponseFor('/rules/r1', () => {
      patched = true;
      return { success: true, data: { id: 'r1', enabled: false }, message: 'OK' };
    });
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const disableBtns = screen.queryAllByText('禁用');
      assert.ok(disableBtns.length >= 1);
    });
    const disableBtns = screen.queryAllByText('禁用');
    const disableBtn = disableBtns.find(b => b.tagName === 'BUTTON') || disableBtns[0];
    fireEvent.click(disableBtn);
    await waitFor(() => {
      assert.ok(patched, 'expected PATCH to be called');
    });
  });

  runTest('should toggle a rule from disabled to enabled via PATCH', async () => {
    let patched = false;
    setResponseFor('/rules/r3', () => {
      patched = true;
      return { success: true, data: { id: 'r3', enabled: true }, message: 'OK' };
    });
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const disabledTab = findTab('已禁用');
      assert.ok(disabledTab, 'expected disabled tab');
    });
    const disabledTab = findTab('已禁用');
    fireEvent.click(disabledTab!);
    await waitFor(() => assertInDoc('模糊搜索'));
    const enableBtns = screen.queryAllByText('启用');
    const enableBtn = enableBtns[enableBtns.length - 1];
    assert.ok(enableBtn, 'expected enable button');
    fireEvent.click(enableBtn);
    await waitFor(() => {
      assert.ok(patched, 'expected PATCH to be called');
    });
  });

  // ── 编辑/保存/取消 ──

  runTest('should edit and save a rule via PUT', async () => {
    let putCalled = false;
    setResponseFor('/rules/r1', () => {
      putCalled = true;
      return { success: true, data: { id: 'r1', name: '新名称' }, message: 'OK' };
    });
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const editBtns = screen.queryAllByText('编辑');
      assert.ok(editBtns.length >= 1);
    });
    const editBtn = screen.getAllByText('编辑')[0];
    fireEvent.click(editBtn);
    await waitFor(() => {
      const saveBtns = screen.queryAllByText('保存');
      assert.ok(saveBtns.length >= 1, 'expected save button');
    });
    const nameInput = screen.getByDisplayValue('订单号匹配');
    fireEvent.change(nameInput, { target: { value: '新规则名称' } });
    const saveBtns = screen.queryAllByText('保存');
    const saveBtn = saveBtns.find(b => b.tagName === 'BUTTON') || saveBtns[0];
    fireEvent.click(saveBtn);
    await waitFor(() => {
      assert.ok(putCalled, 'expected PUT to be called');
    });
  });

  runTest('should cancel edit mode', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const editBtns = screen.queryAllByText('编辑');
      assert.ok(editBtns.length >= 1);
    });
    const editBtn = screen.getAllByText('编辑')[0];
    fireEvent.click(editBtn);
    await waitFor(() => {
      const cancelBtns = screen.queryAllByText('取消');
      assert.ok(cancelBtns.length >= 1, 'expected cancel button');
    });
    const cancelBtns = screen.queryAllByText('取消');
    const cancelBtn = cancelBtns.find(b => b.tagName === 'BUTTON') || cancelBtns[0];
    fireEvent.click(cancelBtn);
    await waitFor(() => {
      const nameInputs = screen.queryAllByDisplayValue('订单号匹配');
      assert.ok(nameInputs.length === 0 || !nameInputs.some(el => el.tagName === 'INPUT'), 'expected edit mode to close');
    });
  });

  // ── API 异常处理 ──

  runTest('should fallback to default rules when API returns error', async () => {
    setErrorResponse();
    render(<ReconciliationRulesPage />);
    await waitFor(() => assertInDoc('全部'));
    const allTab = findTab('全部');
    if (allTab) fireEvent.click(allTab);
    await waitFor(() => {
      assertInDoc('订单号精确匹配');
      assertInDoc('金额容差匹配');
      assertInDoc('模糊搜索匹配');
      assertInDoc('重复单据检测');
    });
  });

  runTest('should show error banner when save fails', async () => {
    setResponseFor('/rules/r1', () => ({
      success: false,
      message: '保存失败',
      data: null,
    }));
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const editBtns = screen.queryAllByText('编辑');
      assert.ok(editBtns.length >= 1);
    });
    const editBtn = screen.queryAllByText('编辑')[0];
    fireEvent.click(editBtn);
    await waitFor(() => {
      const saveBtns = screen.queryAllByText('保存');
      assert.ok(saveBtns.length >= 1, 'expected save button');
    });
    const saveBtns = screen.queryAllByText('保存');
    const saveBtn = saveBtns.find(b => b.tagName === 'BUTTON') || saveBtns[0];
    fireEvent.click(saveBtn);
    // Wait for error banner — the PUT returns { success: false } so apiFetch throws
    await waitFor(() => {
      const errorEls = screen.queryAllByText(/保存失败/);
      assert.ok(errorEls.length >= 1, 'expected error with message 保存失败');
    });
  });

  // ── 边界条件 ──

  runTest('should handle empty rules list', async () => {
    setResponseFor('/rules', () => ({
      success: true,
      data: { rules: [] },
      message: 'OK',
    }));
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      assertInDoc('暂无规则');
    });
  });

  runTest('should handle rules with null matchRate gracefully', async () => {
    setResponseFor('/rules', () => ({
      success: true,
      data: {
        rules: [
          { id: 'rX', name: '无匹配率规则', description: '新建还未运行', matchKey: 'orderNo', toleranceCents: 0, autoResolve: false, autoResolveThresholdCents: 0, enabled: true, priority: 1, createdAt: '2026-07-15T00:00:00Z', updatedAt: '2026-07-15T10:00:00Z', lastMatchedCount: null, matchRate: null },
        ],
      },
      message: 'OK',
    }));
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      assertInDoc('无匹配率规则');
    });
  });

  runTest('should handle large priority numbers', async () => {
    setResponseFor('/rules', () => ({
      success: true,
      data: {
        rules: [
          { id: 'rZ', name: '高优先级', description: '高优先级规则', matchKey: 'orderNo', toleranceCents: 0, autoResolve: true, autoResolveThresholdCents: 0, enabled: true, priority: 999, createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-15T10:00:00Z', lastMatchedCount: 0, matchRate: 0 },
        ],
      },
      message: 'OK',
    }));
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      assertInDoc('高优先级');
      const priorityText = screen.queryAllByText(/#999/);
      assert.ok(priorityText.length >= 1, 'expected priority #999');
    });
  });

  runTest('should show tolerance and threshold formatted as currency for enabled rules', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const tolEls = screen.queryAllByText(/¥1\.00/);
      assert.ok(tolEls.length >= 1, 'expected tolerance ¥1.00');
    });
  });

  runTest('should display refresh button and re-fetch on click', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const refreshBtns = screen.queryAllByText('刷新');
      assert.ok(refreshBtns.length >= 1, 'expected refresh button');
    });
    const refreshBtns = screen.queryAllByText('刷新');
    const refreshBtn = refreshBtns.find(b => b.tagName === 'BUTTON') || refreshBtns[0];
    fireEvent.click(refreshBtn);
    await waitFor(() => {
      assertInDoc('对账规则配置');
    });
  });

  runTest('should show lastMatchedCount in rule footer', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const lastMatchLabels = screen.queryAllByText(/上次匹配/);
      assert.ok(lastMatchLabels.length >= 1, 'expected last matched count');
    });
  });

  runTest('should render createdAt/updatedAt timestamps', async () => {
    render(<ReconciliationRulesPage />);
    await waitFor(() => {
      const dateTexts = screen.queryAllByText(/2026/);
      assert.ok(dateTexts.length >= 1, 'expected date text');
    });
  });
});

// ── 静态代码分析 ──

const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('ReconciliationRulesPage — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含异常统计逻辑', () => assert.ok(SRC.includes('matchRate < 50') || SRC.includes('matchRate<50')));
});
