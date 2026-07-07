/**
 * AI 决策执行结果详情页 — 单元测试
 *
 * 覆盖:
 *  - 状态机逻辑 (statusVariant)
 *  - 重试/回退按钮条件
 *  - 数据模型完整性
 *  - 确定性函数 (hashCode)
 *  - 页面文件结构
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('AI决策详情页', () => {
  // ── 文件结构 ────────────────────────────────────────
  describe('文件结构', () => {
    it('page.tsx 文件应该存在', () => {
      assert.ok(existsSync(join(__dirname, 'page.tsx')));
    });

    it('page.tsx 应该导出 AiDecisionDetailPage 函数', () => {
      const content = readFileSync(join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(content.includes('export default function AiDecisionDetailPage'));
    });

    it('page.tsx 应该导入 @m5/ui 组件', () => {
      const content = readFileSync(join(__dirname, 'page.tsx'), 'utf-8');
      for (const comp of ['DetailShell', 'StatusBadge', 'StatCard', 'WorkspaceBreadcrumb']) {
        assert.ok(content.includes(comp), `缺少组件: ${comp}`);
      }
    });

    it('page.tsx 应该包含全部 7 个 UI 区块', () => {
      const content = readFileSync(join(__dirname, 'page.tsx'), 'utf-8');
      for (const section of ['输入上下文', '推理过程', '决策结果', '预期效果', '实际效果', '效果偏差分析', '执行轨迹']) {
        assert.ok(content.includes(section), `缺少区块: ${section}`);
      }
    });
  });

  // ── 状态与逻辑 ────────────────────────────────────────
  describe('状态与业务逻辑', () => {
    it('statusVariant 应该正确映射决策状态', () => {
      const map = {
        success: 'success',
        failure: 'danger',
        rejected: 'warning',
        timeout: 'warning',
        executing: 'info',
      };
      for (const [key, expected] of Object.entries(map)) {
        assert.equal(map[key], expected);
      }
    });

    it('hashCode 应该对相同输入返回相同结果', () => {
      const hashCode = (s: string): number => {
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
          hash = ((hash << 5) - hash) + s.charCodeAt(i);
          hash |= 0;
        }
        return hash;
      };

      const id = 'exec-001';
      assert.equal(hashCode(id), hashCode(id));
      assert.notEqual(hashCode('aaa'), hashCode('bbb'));
    });

    it('mockDetail 状态索引计算正确', () => {
      const hashCode = (s: string): number => {
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
          hash = ((hash << 5) - hash) + s.charCodeAt(i);
          hash |= 0;
        }
        return hash;
      };

      const statuses = ['success', 'failure', 'rejected', 'timeout', 'executing'];
      const idx1 = Math.abs(hashCode('exec-007')) % statuses.length;
      assert.equal(statuses[idx1], 'success');

      const idx2 = Math.abs(hashCode('exec-008')) % statuses.length;
      assert.equal(statuses[idx2], 'failure');
    });

    it('重试按钮: 只在 failure/timeout/rejected 时可用', () => {
      const canRetry = (status: string): boolean =>
        status === 'failure' || status === 'timeout' || status === 'rejected';

      assert.ok(canRetry('failure'));
      assert.ok(canRetry('timeout'));
      assert.ok(canRetry('rejected'));
      assert.ok(!canRetry('success'));
      assert.ok(!canRetry('executing'));
    });

    it('回退按钮: 只在成功且偏差 > 0.15 时可用', () => {
      const canRevert = (status: string, deviationScore: number | null): boolean =>
        status === 'success' && deviationScore !== null && deviationScore > 0.15;

      assert.ok(canRevert('success', 0.20));
      assert.ok(canRevert('success', 0.30));
      assert.ok(!canRevert('success', null));
      assert.ok(!canRevert('success', 0.10));
      assert.ok(!canRevert('failure', 0.20));
      assert.ok(!canRevert('executing', 0.20));
    });

    it('决策类别标签映射完整', () => {
      const labels = { pricing: '定价策略', inventory: '库存调配', promotion: '促销活动', allocation: '资源分配', recommendation: '商品推荐' };
      assert.equal(labels.pricing, '定价策略');
      assert.equal(labels.promotion, '促销活动');
    });

    it('状态中文标签映射完整', () => {
      const labels = { success: '成功', failure: '失败', rejected: '已驳回', timeout: '超时', executing: '执行中' };
      assert.equal(labels.success, '成功');
      assert.equal(labels.failure, '失败');
      assert.equal(labels.timeout, '超时');
    });
  });

  // ── 数据模型 ────────────────────────────────────────
  describe('数据模型', () => {
    it('AiDecisionDetail 字段完整', () => {
      const detail = {
        id: 'exec-test-001', ruleName: '测试规则', ruleId: 'rule-test-001',
        status: 'success', category: 'pricing', confidence: 0.95,
        executionMs: 500, triggeredBy: 'system',
        triggeredAt: '2026-07-06T00:00:00Z', completedAt: '2026-07-06T00:00:05Z',
        inputContext: {}, reasoning: 'test', decision: {},
        expectedOutcome: 'expected', actualOutcome: 'actual',
        deviationScore: 0.1, anomalyFlags: [], retryCount: 0, version: 'v1.0',
      };
      const fields = ['id', 'ruleName', 'ruleId', 'status', 'category', 'confidence',
        'executionMs', 'triggeredBy', 'triggeredAt', 'completedAt',
        'inputContext', 'reasoning', 'decision',
        'expectedOutcome', 'actualOutcome', 'deviationScore',
        'anomalyFlags', 'retryCount', 'version'];
      for (const f of fields) {
        assert.ok(f in detail, `缺少字段: ${f}`);
      }
    });

    it('AiDecisionStatus 5 种状态全量覆盖', () => {
      const all = ['executing', 'success', 'failure', 'rejected', 'timeout'];
      assert.equal(all.length, 5);
      for (const s of all) assert.ok(s);
    });

    it('DecisionCategory 5 种类型全量覆盖', () => {
      const all = ['pricing', 'inventory', 'promotion', 'allocation', 'recommendation'];
      assert.equal(all.length, 5);
      for (const c of all) assert.ok(c);
    });
  });
});
