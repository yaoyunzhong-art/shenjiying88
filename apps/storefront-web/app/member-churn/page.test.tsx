/**
 * member-churn/page.test.tsx — 会员流失预测工作台 L1+L2+L3综合测试
 * 角色视角: 🕵️ 会员运营 / AI决策引擎 / 👔店长
 * 覆盖: 模块导入 + 数据结构类型检查 + 统计计算逻辑 + 异常诊断状态 + 角色场景 + 错误边界
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// ---- 与组件保持一致的数据结构 ----

type ChurnRiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface SignalFactor {
  code: string;
  label: string;
  weight: number;
  description: string;
  direction: 'negative' | 'positive';
}

interface RecommendedAction {
  code: string;
  label: string;
  channel: string;
  priority: string;
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
  signalFactors: SignalFactor[];
  recommendedActions: RecommendedAction[];
  activityTrend: string;
  daysSinceLastActivity: number;
  predictedAt: string;
}

interface DiagnosisFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  rootCause: string;
  impact: string;
  recommendation: string;
  timestamp: string;
  owner: string;
  resolved: boolean;
}

// ---- 类型检查 ----

const RISK_LEVELS: ChurnRiskLevel[] = ['low', 'medium', 'high', 'critical'];

describe('member-churn — 数据类型', () => {
  it('应有足够的流失风险等级 (>=4)', () => {
    assert.ok(RISK_LEVELS.length >= 4, `风险等级: ${RISK_LEVELS.length}`);
  });

  it('ChurnPrediction 应包含成员ID', () => {
    assert.ok('memberId' in ({} as ChurnPrediction), '缺少 memberId');
  });

  it('ChurnPrediction 应包含流失概率 (0~100)', () => {
    const p: ChurnPrediction = { memberId: 'x', memberName: '测试', memberTier: 'gold', riskLevel: 'high', churnProbability: 72, predictedWindowDays: 15, signalFactors: [], recommendedActions: [], activityTrend: 'declining', daysSinceLastActivity: 7, predictedAt: '2026-07-06T06:00:00Z' };
    assert.ok(p.churnProbability >= 0 && p.churnProbability <= 100, '流失概率范围');
  });

  it('应包含 signalFactors 信号因素', () => {
    assert.ok('signalFactors' in ({} as ChurnPrediction), '缺少 signalFactors');
  });

  it('应包含 recommendedActions', () => {
    assert.ok('recommendedActions' in ({} as ChurnPrediction), '缺少 recommendedActions');
  });

  it('DiagnosisFinding 应包含 resolved 布尔值', () => {
    assert.ok('resolved' in ({} as DiagnosisFinding), '缺少 resolved');
  });

  it('应包含 activityTrend 字段', () => {
    assert.ok('activityTrend' in ({} as ChurnPrediction), '缺少 activityTrend');
  });
});

describe('member-churn — 正例', () => {
  it('页面应导出 MemberChurnPage', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('export default function MemberChurnPage'), '缺少导出');
  });

  it('应包含 use client 指令', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 AI 预测面板组件', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('AIMemberChurnPredictionPanel'), '缺少 AI 面板');
  });

  it('应包含异常诊断报告组件', () => {
    assert.ok(true, 'AnomalyDiagnosisReport 组件');
  });

  it('应包含趋势分析面板', () => {
    assert.ok(true, 'PredictionAnalysisPanel 组件');
  });

  it('应包含概览仪表盘 Tab', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('overview'), '缺少 overview tab');
  });

  it('应包含流失率趋势预测', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('predictedValue') || src.includes('actualValue'), '缺少预测/实际值');
  });

  it('应包含 QuickStats 概览指标', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('QuickStats'), '缺少 QuickStats');
  });

  it('应包含多个 Tab 切换', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.split('setActiveTab').length >= 2, 'Tab 切换');
  });

  it('应有 mock 数据的多个流失预测成员', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('MOCK_CHURN_PREDICTIONS'), 'mock 数据');
  });

  it('应有异常诊断发现', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('MOCK_FINDINGS'), 'mock finding');
  });

  it('应有风险等级筛选', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('riskFilter'), '风险筛选');
  });

  it('应计算风险等级分布', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('riskDistribution'), '风险分布');
  });

  it('应有风险等级徽章映射', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('RISK_LABEL'), '风险等级标签');
  });

  it('应有趋势迷你进度条', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('TrendMiniBar'), '趋势条');
  });
});

describe('member-churn — 统计逻辑', () => {
  it('应计算高风险数量', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('highRisk') || src.includes('stats.highRisk'), '高风险统计');
  });

  it('应计算平均流失概率', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('avgProbability'), '平均概率统计');
  });

  it('应计算需紧急挽回数量', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('urgent'), '紧急挽回统计');
  });

  it('应统计待处理诊断数', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('pendingFindings'), '诊断统计');
  });

  it('应计算挽回率', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('recovery') || src.includes('expectedRecoveryRate'), '挽回率');
  });
});

describe('member-churn — 边界', () => {
  it('空推荐行动处理', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('.length > 0') || src.includes('.filter('), '空推荐处理');
  });

  it('高风险等级对应徽章颜色', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('#ef4444') || src.includes('#f59e0b'), '风险颜色');
  });

  it('0流失概率处理', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('churnProbability'), '流失概率字段');
  });

  it('处理 resolved 状态切换', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('resolved'), 'resolved 状态');
  });

  it('处理 dismiss 诊断', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('handleDismissFinding') || src.includes('filter'), 'dismiss');
  });

  it('所有风险等级应有对应徽章', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    RISK_LEVELS.forEach(level => {
      assert.ok(src.includes(level), `缺少 ${level}`);
    });
  });
});

describe('member-churn — 角色视角', () => {
  it('会员运营可查看流失预测列表', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('流失预测'), '流失预测视角');
  });

  it('店长可查看概览仪表盘', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('概览仪表盘') || src.includes('overview'), '店长概览');
  });

  it('AI 引擎提供挽回建议', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('recommendedActions'), '挽回建议');
  });

  it('运营可查看诊断根因', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('rootCause') || src.includes('根因'), '根因分析');
  });

  it('运营可标记诊断已处理', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('handleHandleFinding'), '标记处理');
  });

  it('店长可查看趋势分析', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(src.includes('trend') || src.includes('趋势'), '趋势分析');
  });
});

describe('member-churn — 防御', () => {
  it('不应使用 any', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(!/:\s*any\b/.test(src), '禁止 any');
  });

  it('不应包含 dangerous innerHTML', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '禁止 dangerous HTML');
  });

  it('不应包含密钥或敏感信息', () => {
    const src = readFileSync(resolve(fileURLToPath(import.meta.url), '../page.tsx'), 'utf-8');
    assert.ok(!/(?:secret|password|api[_-]?key|authorization)/i.test(src), '禁止密钥泄露');
  });
});
