/**
 * ai-experiments/[id]/page.test.tsx — AI实验详情页 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('ai-experiments/[id]/page — 正例', () => {
  it('应导出一个默认组件 AIExperimentDetailPage', () => {
    const src = readSource();
    assert.match(src, /export default function AIExperimentDetailPage/);
  });

  it('应引用 AIExperimentOptimizationPanel 组件', () => {
    const src = readSource();
    assert.match(src, /AIExperimentOptimizationPanel/);
  });

  it('应引用 DetailShell 作为顶层容器', () => {
    const src = readSource();
    assert.match(src, /DetailShell/);
  });

  it('应使用 DetailShellAction 操作栏模式', () => {
    const src = readSource();
    assert.match(src, /DetailShellAction/);
  });

  it('应引用 DetailClosureBar 关闭结论栏', () => {
    const src = readSource();
    assert.match(src, /DetailClosureBar/);
  });

  it('应引用 ComparisonBreakdownChart 对比图表', () => {
    const src = readSource();
    assert.match(src, /ComparisonBreakdownChart/);
  });

  it('应引用 OptimizationSuggestion 优化建议', () => {
    const src = readSource();
    assert.match(src, /OptimizationSuggestion/);
  });

  it('应包含 4 个 mock 实验数据 (exp-001 ~ exp-004)', () => {
    const src = readSource();
    const matches = src.match(/id: 'exp-\d+'/g);
    assert.ok(matches && matches.length >= 4, `期望 ≥4 个实验, 实际 ${matches?.length ?? 0}`);
  });

  it('应包含 running 状态实验', () => {
    const src = readSource();
    assert.match(src, /status: 'running'/);
  });

  it('应包含 completed 状态实验', () => {
    const src = readSource();
    assert.match(src, /status: 'completed'/);
  });

  it('应包含 winner 优胜者判断逻辑', () => {
    const src = readSource();
    assert.match(src, /winner: '[a-z]+'/);
  });

  it('应包含 handleApplyWinner 优胜方案应用', () => {
    const src = readSource();
    assert.match(src, /handleApplyWinner/);
  });

  it('应包含 handleStop 停止实验', () => {
    const src = readSource();
    assert.match(src, /handleStop/);
  });

  it('应包含 handleRegenerate 重新运行', () => {
    const src = readSource();
    assert.match(src, /handleRegenerate/);
  });

  it('应包含 handleExport 导出数据', () => {
    const src = readSource();
    assert.match(src, /handleExport/);
  });

  it('应包含 suggestions 优化建议数据', () => {
    const src = readSource();
    assert.match(src, /suggestions/);
  });

  it('应包含 breakdownData 指标对比', () => {
    const src = readSource();
    assert.match(src, /breakdownData/);
  });

  it('应包含 generateVariants 辅助函数', () => {
    const src = readSource();
    assert.match(src, /generateVariants/);
  });

  it('应包含 notFound 处理不存在的实验ID', () => {
    const src = readSource();
    assert.match(src, /notFound\(\)/);
  });

  it('应包含具体的实验名称', () => {
    const src = readSource();
    assert.match(src, /首页Banner布局优化/);
    assert.match(src, /会员日折扣力度测试/);
    assert.match(src, /Push通知文案/);
    assert.match(src, /推荐算法版本对比测试/);
  });

  it('应包含创建人信息', () => {
    const src = readSource();
    assert.match(src, /王明/);
    assert.match(src, /李婷/);
    assert.match(src, /赵岩/);
    assert.match(src, /AI训练师/);
  });

  it('应包含 aiRecommendation 字段', () => {
    const src = readSource();
    assert.match(src, /aiRecommendation/);
  });

  it('应包含 MOCK_METRICS_BY_EXP 指标对比数据', () => {
    const src = readSource();
    assert.match(src, /MOCK_METRICS_BY_EXP/);
    assert.match(src, /点击转化率/);
    assert.match(src, /GMV\(元\)/);
  });

  it('应包含置信度显示', () => {
    const src = readSource();
    assert.match(src, /置信度/);
  });
});

describe('ai-experiments/[id]/page — 边界用例', () => {
  it('应包含"应用优胜方案"按钮', () => {
    const src = readSource();
    assert.match(src, /应用优胜方案/);
  });

  it('应包含"停止实验"按钮', () => {
    const src = readSource();
    assert.match(src, /停止实验/);
  });

  it('应包含"返回列表"链接', () => {
    const src = readSource();
    assert.match(src, /返回列表/);
  });

  it('应包含 statusColor 完整映射 (5种状态)', () => {
    const src = readSource();
    const statusEntries = src.match(/statusColor[\s\S]*?\};/);
    const statusKeys = statusEntries ? statusEntries[0].match(/[a-z]+(?=:)/g) ?? [] : [];
    const statusCount = statusKeys.filter(k =>
      /running|completed|draft|paused|failed/.test(k)
    ).length;
    assert.ok(statusCount >= 5, `期望 ≥5 种状态映射, 实际 ${statusCount}`);
  });

  it('应包含 statusLabel 中文映射 (5种)', () => {
    const src = readSource();
    const labels = ['运行中', '已完成', '草稿', '已暂停', '已失败'];
    for (const label of labels) {
      assert.ok(src.includes(label), `缺少状态标签: ${label}`);
    }
  });

  it('应通过 DetailClosureBar 渲染实验结论', () => {
    const src = readSource();
    assert.match(src, /DetailClosureBar/);
    assert.match(src, /ComparisonBreakdownChart/);
  });

  it('应包含 AI 推荐气泡', () => {
    const src = readSource();
    assert.match(src, /AI推荐/);
  });
});

describe('ai-experiments/[id]/page — 防御性编程', () => {
  it('应使用 DetailShell 包装', () => {
    const src = readSource();
    assert.match(src, /<DetailShell/);
  });

  it('不应包含硬编码的 token/密钥', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|token|api[_-]?key|authorization)/i);
  });

  it('不应包含危险的 innerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });

  it('遇到不存在的 ID 应返回 notFound', () => {
    const src = readSource();
    assert.match(src, /MOCK_EXPERIMENTS\[id\] \?\? null/);
  });

  it('confirm 确认框应包含停止确认文案', () => {
    const src = readSource();
    assert.match(src, /确认停止此实验/);
  });

  it('should have ExperimentVariant type assertions', () => {
    const src = readSource();
    assert.match(src, /ExperimentVariant/);
    assert.match(src, /ExperimentEntry/);
  });
});
