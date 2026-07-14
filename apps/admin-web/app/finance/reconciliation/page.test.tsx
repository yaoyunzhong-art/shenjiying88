// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - finance/reconciliation (P-38 财务对账)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ===================== L1 冒烟测试 =====================
describe('finance/reconciliation / L1 冒烟', () => {
  it('应导出一个默认组件', () => { assert.ok(SRC.includes('export default function')); });
  it('应包含 use client 指令', () => { assert.ok(SRC.includes("'use client'")); });
  it('应包含 JSX 模板', () => { assert.ok(SRC.includes('return (') || SRC.includes('return <')); });
  it('不应使用 dangerouslySetInnerHTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
});

// ===================== L2 结构验证 =====================
describe('finance/reconciliation / L2 结构验证', () => {
  it('应包含 PageShell 容器', () => { assert.ok(SRC.includes('PageShell')); });
  it('应包含标题 "财务对账"', () => { assert.ok(SRC.includes('财务对账')); });
  it('应包含对账数据 DATA 数组', () => { assert.ok(SRC.includes('DATA')); });

  it('应定义完整列（日期/订单号/门店/实收/系统/差额/支付/状态）', () => {
    for (const c of ['日期', '订单号', '门店', '实收', '系统', '差额', '支付', '状态']) {
      assert.ok(SRC.includes(c), `缺少列: ${c}`);
    }
  });

  it('应展示统计卡片：交易笔数/一致/差异', () => {
    assert.ok(SRC.includes('交易笔数'));
    assert.ok(SRC.includes('一致'));
    assert.ok(SRC.includes('差异'));
  });

  it('应包含 "执行对账" 和 "导出差异报告" 按钮', () => {
    assert.ok(SRC.includes('执行对账'));
    assert.ok(SRC.includes('导出差异报告'));
  });

  it('应包含筛选控件：状态/支付方式/门店', () => {
    assert.ok(SRC.includes('状态:'));
    assert.ok(SRC.includes('支付方式'));
    assert.ok(SRC.includes('门店:'));
  });

  it('差额列差异值应使用红色 (#f87171)', () => {
    assert.ok(SRC.includes('#f87171') || SRC.includes('#34d399'));
  });

  it('状态列应渲染 "一致/差异" Tag', () => {
    assert.ok(SRC.includes('一致'));
    assert.ok(SRC.includes('match'));
  });

  it('应使用 useState 管理数据', () => {
    assert.ok(SRC.includes('useState'));
  });

  it('金额渲染应加 ¥ 前缀', () => { assert.ok(SRC.includes('¥')); });

  it('应包含 Tab 标签页（交易明细/按门店汇总/按支付方式汇总/对账工具）', () => {
    assert.ok(SRC.includes('交易明细'));
    assert.ok(SRC.includes('按门店汇总'));
    assert.ok(SRC.includes('按支付方式汇总'));
    assert.ok(SRC.includes('对账工具'));
  });

  it('应包含日期范围筛选 Select', () => {
    assert.ok(SRC.includes('dateRange'));
    assert.ok(SRC.includes('近7天'));
    assert.ok(SRC.includes('近30天'));
  });

  it('应包含 Modal 弹窗（执行对账 / 差异详情）', () => {
    assert.ok(SRC.includes('执行自动对账'));
    assert.ok(SRC.includes('交易差异详情'));
  });

  it('应包含门店筛选功能', () => {
    assert.ok(SRC.includes('storeFilter'));
    assert.ok(SRC.includes('全部门店'));
  });

  it('应包含批量操作区域', () => {
    assert.ok(SRC.includes('批量标记已处理'));
    assert.ok(SRC.includes('批量导出'));
    assert.ok(SRC.includes('生成对账报表'));
  });
});

// ===================== L3 防御检查 =====================
describe('finance/reconciliation / L3 防御检查', () => {
  it('不应包含硬编码 secrets', () => {
    for (const s of ['sk-', 'api_key', 'secret_key', 'password=']) {
      assert.ok(!SRC.includes(s));
    }
  });

  it('不应包含生产环境 console.log', () => {
    const lines = SRC.split('\n').filter(l =>
      l.includes('console.log') && !l.trimStart().startsWith('//')
    );
    assert.equal(lines.length, 0);
  });

  it('不应出现 href="#" 而无 onClick', () => {
    for (const line of SRC.split('\n')) {
      if (line.includes('href="#"') && !line.includes('onClick')) {
        assert.fail(`href="#" 无 onClick: ${line.trim()}`);
      }
    }
  });

  it('不应使用 any 类型', () => { assert.ok(!SRC.includes(': any')); });

  it('不应包含被注释掉的 JSX', () => {
    const c = SRC.match(/\/\/\s+.+</g);
    if (c) assert.fail(`被注释 JSX: ${c.join(', ')}`);
  });

  it('PageShell 应成对出现', () => {
    assert.ok(SRC.includes('<PageShell') && SRC.includes('</PageShell>'));
  });

  it('DATA 应有必填字段', () => {
    const fields = ['id', 'date', 'orderId', 'storeId', 'storeName', 'income', 'system', 'diff', 'method', 'status'];
    const match = SRC.match(/\{ id:\s*['"][^'"]+['"]/);
    if (match) {
      for (const f of fields) assert.ok(SRC.includes(`${f}:`), `字段 ${f} 应存在`);
    }
  });

  it('Table 应有 rowKey', () => { assert.ok(SRC.includes('rowKey')); });

  it('组件名称应为 FinanceReconciliationPage', () => {
    assert.ok(SRC.includes('FinanceReconciliationPage'));
  });

  it('应包含 storeSummary 门店汇总数据', () => {
    assert.ok(SRC.includes('storeSummary'));
  });

  it('应包含 methodSummary 支付方式汇总数据', () => {
    assert.ok(SRC.includes('methodSummary'));
  });

  it('应包含 Tooltip 用于差额详情展示', () => {
    assert.ok(SRC.includes('Tooltip'));
  });

  it('应包含 DatePicker 或日期相关导入', () => {
    assert.ok(SRC.includes('DatePicker'));
  });
});
