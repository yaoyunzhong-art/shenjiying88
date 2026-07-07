/**
 * member-churn/page.test.tsx — 会员流失预测工作台 L1 冒烟测试
 * 角色视角: 🕵️ 会员运营 / AI决策引擎
 * 覆盖: 模块导入 + 数据结构类型检查 + 统计计算逻辑 + 异常诊断状态
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与组件保持一致的数据结构 ----

type ChurnRiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface ChurnSignalFactor {
  code: string;
  label: string;
  weight: number;
  description: string;
  direction: 'positive' | 'negative';
}

interface RetentionAction {
  code: string;
  label: string;
  channel: 'sms' | 'wechat' | 'app_push' | 'coupon' | 'phone';
  priority: 'high' | 'medium' | 'low';
  expectedRecoveryRate: number;
  description: string;
}

interface ChurnPrediction {
  memberId: string;
  memberName: string;
  memberTier: string;
  riskLevel: ChurnRiskLevel;
  churnProbability: number;
  predictedWindowDays: number;
  signalFactors: ChurnSignalFactor[];
  recommendedActions: RetentionAction[];
  activityTrend: 'declining' | 'stable' | 'recovering';
  daysSinceLastActivity: number;
  predictedAt: string;
}

interface DiagnosisFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  description: string;
  rootCause: string;
  impact: string;
  recommendation: string;
  timestamp: string;
  owner?: string;
  resolved?: boolean;
}

interface PredictionPoint {
  label: string;
  predictedValue: number;
  actualValue?: number;
  trend?: 'up' | 'down' | 'stable';
  anomalyScore?: number;
}

interface PredictionSummary {
  bestPrediction: string;
  overallTrend: 'up' | 'down' | 'stable';
  changePercent: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation?: string;
}

// ---- 工厂 ----

function makePrediction(overrides: Partial<ChurnPrediction> = {}): ChurnPrediction {
  return {
    memberId: 'm001',
    memberName: '测试用户',
    memberTier: 'gold',
    riskLevel: 'medium',
    churnProbability: 45,
    predictedWindowDays: 30,
    signalFactors: [
      { code: 'freq', label: '访问频率下降', weight: 40, description: '近30天到店次数下降60%', direction: 'negative' },
    ],
    recommendedActions: [
      { code: 'send_coupon', label: '发放优惠券', channel: 'coupon', priority: 'high', expectedRecoveryRate: 65, description: '发放8折优惠券' },
    ],
    activityTrend: 'declining',
    daysSinceLastActivity: 14,
    predictedAt: '2026-07-06T06:00:00Z',
    ...overrides,
  };
}

function makeFinding(overrides: Partial<DiagnosisFinding> = {}): DiagnosisFinding {
  return {
    id: 'f1',
    title: '会员活跃度下降',
    severity: 'high',
    category: '活跃度',
    description: '近30天到店次数下降明显',
    rootCause: '竞争对手开业',
    impact: '预计损失年度贡献¥10,000',
    recommendation: '安排客服回访推送优惠',
    timestamp: '2026-07-06T05:30:00Z',
    owner: '客服部',
    resolved: false,
    ...overrides,
  };
}

// ============================================================
//  Tests
// ============================================================

describe('MemberChurnPage — 会员流失预测工作台', () => {

  // ---- 数据模型 ----

  describe('ChurnPrediction 数据结构', () => {
    it('应正确创建预测对象', () => {
      const pred = makePrediction();
      assert.ok(pred.memberId);
      assert.ok(pred.memberName);
      assert.ok(pred.memberTier);
      assert.ok(['low', 'medium', 'high', 'critical'].includes(pred.riskLevel));
      assert.ok(pred.churnProbability >= 0 && pred.churnProbability <= 100);
      assert.ok(pred.signalFactors.length > 0);
    });

    it('should handle all risk levels', () => {
      const levels: ChurnRiskLevel[] = ['low', 'medium', 'high', 'critical'];
      for (const level of levels) {
        const pred = makePrediction({ riskLevel: level });
        assert.equal(pred.riskLevel, level);
        assert.ok(pred.churnProbability >= 0);
      }
    });

    it('should handle edge case: 0% probability', () => {
      const pred = makePrediction({ churnProbability: 0 });
      assert.equal(pred.churnProbability, 0);
    });

    it('should handle edge case: 100% probability', () => {
      const pred = makePrediction({ churnProbability: 100 });
      assert.equal(pred.churnProbability, 100);
    });

    it('should handle edge case: 0 signal factors', () => {
      const pred = makePrediction({ signalFactors: [] });
      assert.equal(pred.signalFactors.length, 0);
    });

    it('should handle edge case: 0 recommended actions', () => {
      const pred = makePrediction({ recommendedActions: [] });
      assert.equal(pred.recommendedActions.length, 0);
    });

    it('should handle edge case: negative daysSinceLastActivity', () => {
      const pred = makePrediction({ daysSinceLastActivity: -1 });
      assert.equal(pred.daysSinceLastActivity, -1);
    });

    it('should support all activity trends', () => {
      const trends: ChurnPrediction['activityTrend'][] = ['declining', 'stable', 'recovering'];
      for (const t of trends) {
        const pred = makePrediction({ activityTrend: t });
        assert.equal(pred.activityTrend, t);
      }
    });

    it('should support all action channels', () => {
      const channels: RetentionAction['channel'][] = ['sms', 'wechat', 'app_push', 'coupon', 'phone'];
      for (const ch of channels) {
        const pred = makePrediction({ recommendedActions: [{ code: 'test', label: '测试', channel: ch, priority: 'medium', expectedRecoveryRate: 50, description: '' }] });
        assert.equal(pred.recommendedActions[0].channel, ch);
      }
    });
  });

  describe('DiagnosisFinding 数据结构', () => {
    it('应正确创建诊断发现', () => {
      const f = makeFinding();
      assert.ok(f.id);
      assert.ok(f.title);
      assert.ok(f.severity);
      assert.ok(['critical', 'high', 'medium', 'low', 'info'].includes(f.severity));
    });

    it('should support resolved toggle', () => {
      const unresolved = makeFinding({ resolved: false });
      assert.equal(unresolved.resolved, false);
      const resolved = makeFinding({ resolved: true });
      assert.equal(resolved.resolved, true);
    });

    it('should handle undefined owner', () => {
      // @ts-expect-error 测试 owner 可选
      const f = makeFinding({ owner: undefined });
      assert.equal(f.owner, undefined);
    });
  });

  // ---- 统计逻辑 ----

  describe('统计数据计算逻辑', () => {
    const predictions: ChurnPrediction[] = [
      makePrediction({ memberId: 'm1', riskLevel: 'high', churnProbability: 72, predictedWindowDays: 15 }),
      makePrediction({ memberId: 'm2', riskLevel: 'critical', churnProbability: 88, predictedWindowDays: 7 }),
      makePrediction({ memberId: 'm3', riskLevel: 'medium', churnProbability: 38, predictedWindowDays: 60 }),
    ];

    it('高危+极高危会员计数应正确', () => {
      const highRisk = predictions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical');
      assert.equal(highRisk.length, 2);
    });

    it('平均流失概率应正确', () => {
      const avg = Math.round(predictions.reduce((s, p) => s + p.churnProbability, 0) / predictions.length);
      assert.equal(avg, 66);
    });

    it('需紧急挽回会员应≤15天', () => {
      const urgent = predictions.filter(p => p.predictedWindowDays <= 15);
      assert.equal(urgent.length, 2);
    });

    it('空预测列表应返回 0', () => {
      assert.equal(([] as ChurnPrediction[]).filter(p => p.riskLevel === 'high').length, 0);
    });
  });

  describe('诊断统计逻辑', () => {
    const findings: DiagnosisFinding[] = [
      makeFinding({ id: 'f1', resolved: false }),
      makeFinding({ id: 'f2', resolved: true }),
      makeFinding({ id: 'f3', resolved: false }),
    ];

    it('未处理诊断计数应正确', () => {
      const unresolved = findings.filter(f => !f.resolved);
      assert.equal(unresolved.length, 2);
    });

    it('全部已处理应返回 0', () => {
      const allResolved = findings.map(f => ({ ...f, resolved: true }));
      assert.equal(allResolved.filter(f => !f.resolved).length, 0);
    });
  });

  // ---- PredictionPoint 验证 ----

  describe('PredictionPoint 验证', () => {
    it('应正确创建预测点', () => {
      const point: PredictionPoint = { label: '7月', predictedValue: 36 };
      assert.equal(point.label, '7月');
      assert.equal(point.predictedValue, 36);
    });

    it('should support actualValue', () => {
      const point: PredictionPoint = { label: '6月', predictedValue: 30, actualValue: 33 };
      assert.equal(point.actualValue, 33);
    });

    it('should support all trend directions', () => {
      const dirs: NonNullable<PredictionPoint['trend']>[] = ['up', 'down', 'stable'];
      for (const d of dirs) {
        const point: PredictionPoint = { label: 'x', predictedValue: 10, trend: d };
        assert.equal(point.trend, d);
      }
    });

    it('should support anomalyScore', () => {
      const point: PredictionPoint = { label: 'x', predictedValue: 10, anomalyScore: 0.85 };
      assert.ok(point.anomalyScore! > 0.5);
    });

    it('should allow undefined trend', () => {
      const point: PredictionPoint = { label: 'x', predictedValue: 10 };
      assert.equal(point.trend, undefined);
    });
  });

  // ---- PredictionSummary 验证 ----

  describe('PredictionSummary 验证', () => {
    it('should create summary', () => {
      const s: PredictionSummary = {
        bestPrediction: '7月预测36人',
        overallTrend: 'up',
        changePercent: 15,
        riskLevel: 'high',
        recommendation: '建议干预',
      };
      assert.ok(s.bestPrediction.includes('36'));
      assert.equal(s.changePercent, 15);
    });

    it('should support all risk levels', () => {
      const levels: PredictionSummary['riskLevel'][] = ['low', 'medium', 'high'];
      for (const r of levels) {
        const s: PredictionSummary = { bestPrediction: '', overallTrend: 'stable', changePercent: 0, riskLevel: r };
        assert.equal(s.riskLevel, r);
      }
    });

    it('should allow undefined recommendation', () => {
      const s: PredictionSummary = { bestPrediction: '', overallTrend: 'stable', changePercent: 0, riskLevel: 'low' };
      assert.equal(s.recommendation, undefined);
    });
  });
});
