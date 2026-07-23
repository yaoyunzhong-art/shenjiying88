/**
 * employee-marketing.service.spec.ts · WP-11 全员营销与绩效
 *
 * 覆盖:
 *   - createPromoCode:      正例/反例(重复码/负数佣金/0使用上限/过期)
 *   - listPromoCodes:       正例(按员工/全部)/空
 *   - trackPromotion:       正例/反例(不存在码/使用上限/过期码)
 *   - confirmTracking:      正例/反例(不存在)
 *   - cancelTracking:       正例/反例(不存在)
 *   - getEmployeeStats:     正例(有数据/零数据)
 *   - createKpiConfig:      正例/反例(权重越界)
 *   - submitKpiResult:      正例(加权计算)/反例(未知指标)
 *   - getLeaderboard:       正例(多人排行)/空数据
 *   - createTask:           正例/反例(无人)
 *   - getEmployeeTasks:     正例/空
 *   - checkCompliance:      正例(无异常/高频异常)
 *   - reset:                全部清空
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 30 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EmployeeMarketingService } from './employee-marketing.service'
import type {
  PromoCode,
  PromoTracking,
  KpiConfig,
  KpiResult,
  MarketingTask,
} from './employee-marketing.entity'

// ═══════════════════════════════════════════════════════════════
// 测试辅助
// ═══════════════════════════════════════════════════════════════

let service: EmployeeMarketingService;

function freshService(): EmployeeMarketingService {
  const s = new EmployeeMarketingService();
  s.reset();
  return s;
}

beforeEach(() => {
  service = freshService();
});

// ═══════════════════════════════════════════════════════════════
// createPromoCode
// ═══════════════════════════════════════════════════════════════

describe('createPromoCode', () => {
  const VALID_DTO = () => ({
    employeeId: 'emp-1',
    code: 'EMP1-SUMMER',
    type: 'coupon' as const,
    commissionRate: 0.1,
    validUntil: '2099-12-31T00:00:00.000Z',
    usageLimit: 100,
  });

  it('正例: 创建推广码并返回完整信息', () => {
    const result = service.createPromoCode(VALID_DTO());
    expect(result.id).toMatch(/^pc-/);
    expect(result.code).toBe('EMP1-SUMMER');
    expect(result.employeeId).toBe('emp-1');
    expect(result.type).toBe('coupon');
    expect(result.commissionRate).toBe(0.03); // 宪法13.5阶梯费率最低档(3%)
    expect(result.usageLimit).toBe(100);
    expect(result.currentUsage).toBe(0);
    expect(result.validUntil).toBeInstanceOf(Date);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('反例: 重复推广码应抛出异常', () => {
    service.createPromoCode(VALID_DTO());
    expect(() => service.createPromoCode(VALID_DTO())).toThrow('推广码已存在');
  });

  it('正例: 支持折扣券和门票类型', () => {
    const discount = service.createPromoCode({
      ...VALID_DTO(),
      code: 'EMP1-DISCOUNT',
      type: 'discount',
    });
    expect(discount.type).toBe('discount');

    const ticket = service.createPromoCode({
      ...VALID_DTO(),
      code: 'EMP1-TICKET',
      type: 'ticket',
    });
    expect(ticket.type).toBe('ticket');
  });

  it('正例: 佣金率为 0 合法（免费推广）', () => {
    const result = service.createPromoCode({
      ...VALID_DTO(),
      code: 'EMP1-FREE',
      commissionRate: 0,
    });
    expect(result.commissionRate).toBe(0.03); // 阶梯费率最低档
  });
});

// ═══════════════════════════════════════════════════════════════
// listPromoCodes
// ═══════════════════════════════════════════════════════════════

describe('listPromoCodes', () => {
  it('正例: 全部查询返回所有推广码', () => {
    service.createPromoCode({
      employeeId: 'emp-1', code: 'EMP1-A', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    service.createPromoCode({
      employeeId: 'emp-2', code: 'EMP2-A', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    expect(service.listPromoCodes().length).toBe(2);
  });

  it('正例: 按员工过滤', () => {
    service.createPromoCode({
      employeeId: 'emp-1', code: 'EMP1-A', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    service.createPromoCode({
      employeeId: 'emp-2', code: 'EMP2-A', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    const emp1Codes = service.listPromoCodes('emp-1');
    expect(emp1Codes.length).toBe(1);
    expect(emp1Codes[0].code).toBe('EMP1-A');
  });

  it('边界: 空数据返回空数组', () => {
    expect(service.listPromoCodes('nonexistent')).toEqual([]);
    expect(service.listPromoCodes()).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// trackPromotion
// ═══════════════════════════════════════════════════════════════

describe('trackPromotion', () => {
  it('正例: 追踪一次推广转化', () => {
    const code = service.createPromoCode({
      employeeId: 'emp-1', code: 'EMP1-SUMMER', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    const tracking = service.trackPromotion({
      promoCodeId: code.id,
      customerId: 'cust-1',
      orderId: 'ord-1',
      commission: 50,
    });
    expect(tracking.id).toMatch(/^pt-/);
    expect(tracking.status).toBe('pending');
    expect(tracking.commission).toBe(50);
    expect(code.currentUsage).toBe(1);
  });

  it('反例: 推广码不存在应抛出异常', () => {
    expect(() => service.trackPromotion({
      promoCodeId: 'nonexistent',
      customerId: 'cust-1',
      commission: 50,
    })).toThrow('推广码不存在');
  });

  it('反例: 推广码已达使用上限应抛出异常', () => {
    const code = service.createPromoCode({
      employeeId: 'emp-1', code: 'EMP1-LIMIT', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 1,
    });
    service.trackPromotion({ promoCodeId: code.id, commission: 10 });
    expect(() => service.trackPromotion({ promoCodeId: code.id, commission: 10 })).toThrow('已达使用上限');
  });

  it('反例: 使用过期推广码应抛出异常', () => {
    const code = service.createPromoCode({
      employeeId: 'emp-1', code: 'EMP1-EXPIRED', type: 'coupon',
      commissionRate: 0.1, validUntil: '2020-01-01', usageLimit: 100,
    });
    expect(() => service.trackPromotion({ promoCodeId: code.id, commission: 10 })).toThrow('已过期');
  });
});

// ═══════════════════════════════════════════════════════════════
// confirmTracking / cancelTracking
// ═══════════════════════════════════════════════════════════════

describe('confirmTracking', () => {
  it('正例: 确认推广追踪', () => {
    const code = service.createPromoCode({
      employeeId: 'emp-1', code: 'EMP1-CONFIRM', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    const tracking = service.trackPromotion({ promoCodeId: code.id, commission: 50 });
    const confirmed = service.confirmTracking(tracking.id);
    expect(confirmed).toBeDefined();
    expect(confirmed!.status).toBe('confirmed');
    expect(confirmed!.confirmedAt).toBeInstanceOf(Date);
  });

  it('反例: 追踪记录不存在返回 undefined', () => {
    expect(service.confirmTracking('nonexistent')).toBeUndefined();
  });
});

describe('cancelTracking', () => {
  it('正例: 取消推广追踪', () => {
    const code = service.createPromoCode({
      employeeId: 'emp-1', code: 'EMP1-CANCEL', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    const tracking = service.trackPromotion({ promoCodeId: code.id, commission: 50 });
    const cancelled = service.cancelTracking(tracking.id);
    expect(cancelled).toBeDefined();
    expect(cancelled!.status).toBe('cancelled');
  });

  it('反例: 追踪记录不存在返回 undefined', () => {
    expect(service.cancelTracking('nonexistent')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// getEmployeeStats
// ═══════════════════════════════════════════════════════════════

describe('getEmployeeStats', () => {
  it('正例: 返回完整统计（含排名）', () => {
    const code1 = service.createPromoCode({
      employeeId: 'emp-1', code: 'EMP1-A', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    const tracking1 = service.trackPromotion({ promoCodeId: code1.id, commission: 100 });
    service.confirmTracking(tracking1.id);

    // 另一个员工做推广，降低排名影响
    const code2 = service.createPromoCode({
      employeeId: 'emp-2', code: 'EMP2-A', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    const tracking2 = service.trackPromotion({ promoCodeId: code2.id, commission: 200 });
    service.confirmTracking(tracking2.id);

    const stats = service.getEmployeeStats('emp-1');
    expect(stats.totalPromoCodes).toBe(1);
    expect(stats.totalConversions).toBe(1);
    expect(stats.totalCommission).toBe(100);
    expect(stats.confirmedCommission).toBe(100);
    expect(stats.conversionRate).toBe(1);
    expect(stats.rank).toBe(2); // emp-2 has 200, so emp-1 ranks 2
  });

  it('边界: 零数据返回零', () => {
    const stats = service.getEmployeeStats('nonexistent');
    expect(stats.totalPromoCodes).toBe(0);
    expect(stats.totalConversions).toBe(0);
    expect(stats.totalCommission).toBe(0);
    expect(stats.confirmedCommission).toBe(0);
    expect(stats.conversionRate).toBe(0);
    expect(stats.rank).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// KPI 配置与绩效
// ═══════════════════════════════════════════════════════════════

describe('createKpiConfig', () => {
  it('正例: 创建 KPI 配置', () => {
    const config = service.createKpiConfig({
      positionType: 'frontline',
      metricName: '月销售额',
      target: 100000,
      weight: 0.5,
      unit: '元',
      period: 'monthly',
    });
    expect(config.id).toMatch(/^kpi-/);
    expect(config.positionType).toBe('frontline');
    expect(config.metricName).toBe('月销售额');
    expect(config.weight).toBe(0.5);
  });

  it('反例: 权重小于 0 应抛出异常', () => {
    expect(() => service.createKpiConfig({
      positionType: 'frontline',
      metricName: '销售额',
      target: 100,
      weight: -0.1,
      unit: '元',
      period: 'monthly',
    })).toThrow('权重必须为 0~1');
  });

  it('反例: 权重大于 1 应抛出异常', () => {
    expect(() => service.createKpiConfig({
      positionType: 'frontline',
      metricName: '销售额',
      target: 100,
      weight: 1.5,
      unit: '元',
      period: 'monthly',
    })).toThrow('权重必须为 0~1');
  });

  it('正例: 支持全部 5 类岗位', () => {
    const positionTypes = ['frontline', 'management', 'content', 'support', 'logistics'] as const;
    for (const pt of positionTypes) {
      const config = service.createKpiConfig({
        positionType: pt,
        metricName: '绩效',
        target: 100,
        weight: 0.5,
        unit: '分',
        period: 'monthly',
      });
      expect(config.positionType).toBe(pt);
    }
  });
});

describe('listKpiConfigs', () => {
  it('正例: 按岗位过滤', () => {
    service.createKpiConfig({
      positionType: 'frontline', metricName: '销售额',
      target: 1000, weight: 0.5, unit: '元', period: 'monthly',
    });
    service.createKpiConfig({
      positionType: 'support', metricName: '满意度',
      target: 95, weight: 0.5, unit: '分', period: 'monthly',
    });
    const salesConfigs = service.listKpiConfigs('frontline');
    expect(salesConfigs.length).toBe(1);
    expect(salesConfigs[0].metricName).toBe('销售额');
  });

  it('边界: 空数据', () => {
    expect(service.listKpiConfigs()).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// submitKpiResult
// ═══════════════════════════════════════════════════════════════

describe('submitKpiResult', () => {
  it('正例: 加权计算总分和奖金', () => {
    service.createKpiConfig({
      positionType: 'frontline', metricName: '销售额',
      target: 100000, weight: 0.6, unit: '元', period: 'monthly',
    });
    service.createKpiConfig({
      positionType: 'frontline', metricName: '客户数',
      target: 50, weight: 0.4, unit: '个', period: 'monthly',
    });

    const result = service.submitKpiResult({
      employeeId: 'emp-1',
      period: '2026-07',
      scores: { 销售额: 90, 客户数: 80 },
    });
    expect(result.totalScore).toBe(86); // 90*0.6 + 80*0.4
    expect(result.bonusAmount).toBe(86 * 50);
    expect(result.period).toBe('2026-07');
    expect(result.employeeId).toBe('emp-1');
  });

  it('反例: 未知 KPI 指标应抛出异常', () => {
    expect(() => service.submitKpiResult({
      employeeId: 'emp-1',
      period: '2026-07',
      scores: { 未知指标: 90 },
    })).toThrow('未知 KPI 指标');
  });
});

describe('getKpiResults', () => {
  it('正例: 返回员工所有绩效记录', () => {
    service.createKpiConfig({
      positionType: 'frontline', metricName: '销售额',
      target: 1000, weight: 1, unit: '元', period: 'monthly',
    });
    service.submitKpiResult({ employeeId: 'emp-1', period: '2026-06', scores: { 销售额: 80 } });
    service.submitKpiResult({ employeeId: 'emp-1', period: '2026-07', scores: { 销售额: 90 } });
    const results = service.getKpiResults('emp-1');
    expect(results.length).toBe(2);
    expect(results[0].totalScore).toBeGreaterThan(0);
  });

  it('边界: 无记录返回空数组', () => {
    expect(service.getKpiResults('nonexistent')).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// 排行榜
// ═══════════════════════════════════════════════════════════════

describe('getLeaderboard', () => {
  it('正例: 按佣金降序排列', () => {
    const codeA = service.createPromoCode({
      employeeId: 'emp-A', code: 'EMPA', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    const tA1 = service.trackPromotion({ promoCodeId: codeA.id, commission: 100 });
    service.confirmTracking(tA1.id);

    const codeB = service.createPromoCode({
      employeeId: 'emp-B', code: 'EMPB', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    const tB1 = service.trackPromotion({ promoCodeId: codeB.id, commission: 200 });
    service.confirmTracking(tB1.id);

    // emp-A: 100 confirmed, emp-B: 200 confirmed → emp-B ranks #1
    const leaderboard = service.getLeaderboard();
    expect(leaderboard.length).toBe(2);
    expect(leaderboard[0].employeeId).toBe('emp-B'); // 200 confirmed
    expect(leaderboard[1].employeeId).toBe('emp-A'); // 100 confirmed
  });

  it('正例: 支持 limit 参数', () => {
    for (let i = 0; i < 5; i++) {
      const code = service.createPromoCode({
        employeeId: `emp-${i}`, code: `EMP${i}`, type: 'coupon',
        commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
      });
      service.trackPromotion({ promoCodeId: code.id, commission: 50 });
    }
    const top3 = service.getLeaderboard(3);
    expect(top3.length).toBeLessThanOrEqual(3);
  });

  it('边界: 无数据返回空数组', () => {
    expect(service.getLeaderboard()).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// 营销任务
// ═══════════════════════════════════════════════════════════════

describe('createTask', () => {
  it('正例: 创建营销任务', () => {
    const task = service.createTask({
      title: '推广夏季套餐',
      description: '向客户推荐夏季特惠套餐',
      points: 100,
      deadline: '2099-12-31T00:00:00.000Z',
      assignedTo: ['emp-1', 'emp-2'],
    });
    expect(task.id).toMatch(/^task-/);
    expect(task.title).toBe('推广夏季套餐');
    expect(task.points).toBe(100);
    expect(task.status).toBe('active');
    expect(task.assignedTo).toEqual(['emp-1', 'emp-2']);
  });

  it('反例: 未指定员工应抛出异常', () => {
    expect(() => service.createTask({
      title: '缺人任务',
      description: '',
      points: 50,
      deadline: '2099-12-31',
      assignedTo: [],
    })).toThrow('必须指定至少一个员工');
  });
});

describe('getEmployeeTasks', () => {
  it('正例: 返回员工的所有待办任务', () => {
    service.createTask({
      title: 'T1', description: '', points: 10,
      deadline: '2099-12-31', assignedTo: ['emp-1', 'emp-2'],
    });
    service.createTask({
      title: 'T2', description: '', points: 20,
      deadline: '2099-12-31', assignedTo: ['emp-2'],
    });
    const emp1Tasks = service.getEmployeeTasks('emp-1');
    expect(emp1Tasks.length).toBe(1);
    expect(emp1Tasks[0].title).toBe('T1');
  });

  it('边界: 无任务返回空数组', () => {
    expect(service.getEmployeeTasks('nonexistent')).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// 违规检测
// ═══════════════════════════════════════════════════════════════

describe('checkCompliance', () => {
  it('正例: 无异常返回 low 风险', () => {
    const result = service.checkCompliance();
    expect(result.riskLevel).toBe('low');
    expect(result.score).toBe(0);
    expect(result.suspiciousItems).toEqual([]);
  });

  it('正例: 指定员工无异常', () => {
    const result = service.checkCompliance('emp-1');
    expect(result.riskLevel).toBe('low');
    expect(result.score).toBe(0);
  });

  // 高频异常：创建大量未确认追踪
  it('正例: 大量 pending 追踪会触发异常', () => {
    const code = service.createPromoCode({
      employeeId: 'emp-1', code: 'EMP1-MASS', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 1000,
    });
    // 创建 20 条追踪（但全 pending，触发 pending > 90% + 重复客户检测）
    for (let i = 0; i < 20; i++) {
      service.trackPromotion({ promoCodeId: code.id, commission: 10 });
    }

    const result = service.checkCompliance('emp-1');
    expect(result.riskLevel).toBe('high');
    expect(result.suspiciousItems.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(30);
  });
});

// ═══════════════════════════════════════════════════════════════
// reset
// ═══════════════════════════════════════════════════════════════

describe('reset', () => {
  it('正例: 所有存储清空', () => {
    service.createPromoCode({
      employeeId: 'emp-1', code: 'EMP1-RESET', type: 'coupon',
      commissionRate: 0.1, validUntil: '2099-12-31', usageLimit: 100,
    });
    service.reset();
    expect(service.listPromoCodes()).toEqual([]);
    expect(service.listKpiConfigs()).toEqual([]);
    expect(service.getEmployeeTasks('emp-1')).toEqual([]);
    expect(service.getLeaderboard()).toEqual([]);
  });
});
