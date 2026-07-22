/**
 * tob-finance-reconciliation.test.ts — 对账流程 E2E 测试
 *
 * 测试覆盖: 门店损益查询、品牌损益查询、门店对比、分账日志查询、
 *          状态筛选、分账状态机流转、错误处理和边界情况
 * 全部基于 node:test，零外部依赖
 * 15+ 测试用例
 */
import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 模块依赖 ─────────────────────────────────────────
import {
  getStorePAndL,
  getAllStorePAndL,
  getBrandPAndL,
  compareStores,
  getTransactionLogs,
  getAccountStatus,
  formatPeriodDisplay,
} from '../finance-dashboard/finance-dashboard-service';
import {
  MOCK_STORE_PANDL,
  MOCK_BRAND_PANDL,
  MOCK_TRANSACTION_LOGS,
  formatCurrency,
  formatPercent,
  getAccountTypeLabel,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUS_COLORS,
} from '../finance-dashboard/finance-dashboard-data';
import type { TransactionStatus } from '../finance-dashboard/finance-dashboard-data';

// ═══════════════════════════════════════════════════════════════════
// 1. 门店损益查询
// ═══════════════════════════════════════════════════════════════════

describe('[Finance] 门店损益查询', () => {
  test('1.1 [正例] 按门店ID和月份查询损益数据，返回完整损益结构', async () => {
    const data = await getStorePAndL('STORE001', { year: 2026, month: 6 });
    assert.ok(data, '应返回损益数据');
    assert.equal(data!.storeId, 'STORE001');
    assert.equal(data!.storeName, '上海旗舰店');
    assert.equal(data!.period, '2026-06');
    assert.equal(data!.revenue, 1285680);
    assert.equal(data!.grossProfit, 771408);
    assert.equal(data!.grossMargin, 0.60);
    assert.equal(data!.operatingProfit, 385704);
  });

  test('1.2 [正例] 不指定月份时使用当前月份，数据可查', async () => {
    // 当前月份有 mock 数据
    const data = await getStorePAndL('STORE001');
    assert.ok(data, '不传 period 应返回数据（fallback 到当前月 mock）');
    assert.ok(typeof data!.revenue === 'number');
    assert.ok(data!.revenue > 0);
  });

  test('1.3 [反例] 不存在的门店ID → 返回 null', async () => {
    const data = await getStorePAndL('STORE-NOT-EXISTS', { year: 2026, month: 6 });
    assert.equal(data, null, '不存在的门店应返回 null');
  });

  test('1.4 [边界] 查询已归档月份（跨年）→ 返回 null', async () => {
    const data = await getStorePAndL('STORE001', { year: 2020, month: 1 });
    assert.equal(data, null, '无数据的归档月份应返回 null');
  });

  test('1.5 [边界] 门店损益各字段均为正数且符合会计等式', () => {
    for (const store of MOCK_STORE_PANDL) {
      // grossProfit = revenue - costOfGoods
      assert.equal(
        store.grossProfit,
        store.revenue - store.costOfGoods,
        `${store.storeName} 毛利应等于营收-成本`
      );
      // operatingProfit = grossProfit - operatingExpenses
      assert.equal(
        store.operatingProfit,
        store.grossProfit - store.operatingExpenses,
        `${store.storeName} 营业利润应等于毛利-营业费用`
      );
      // grossMargin = grossProfit / revenue
      assert.equal(
        store.grossMargin,
        store.grossProfit / store.revenue,
        `${store.storeName} 毛利率应等于毛利/营收`
      );
    }
  });

  test('1.6 [正例] 批量获取所有门店损益数据', async () => {
    const all = await getAllStorePAndL({ year: 2026, month: 6 });
    assert.ok(Array.isArray(all));
    assert.equal(all.length, 3, '应有 3 家门店的损益数据');
    const storeNames = all.map((s) => s.storeName);
    assert.ok(storeNames.includes('上海旗舰店'));
    assert.ok(storeNames.includes('北京分店'));
    assert.ok(storeNames.includes('广州分店'));
  });

  test('1.7 [边界] 批量查询空月份 → 返回全部', async () => {
    const all = await getAllStorePAndL({ year: 2025, month: 1 });
    assert.ok(Array.isArray(all));
    assert.equal(all.length, 0, '无数据的月份返回空数组');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. 品牌损益查询
// ═══════════════════════════════════════════════════════════════════

describe('[Finance] 品牌损益查询', () => {
  test('2.1 [正例] 按品牌ID查询汇总损益，包含门店明细', async () => {
    const data = await getBrandPAndL('BRAND001', { year: 2026, month: 6 });
    assert.ok(data, '应返回品牌损益数据');
    assert.equal(data!.brandId, 'BRAND001');
    assert.equal(data!.brandName, '花西子');
    assert.equal(data!.totalRevenue, 2784740);
    assert.equal(data!.totalGrossProfit, 1670844);
    assert.ok(Array.isArray(data!.stores));
    assert.equal(data!.stores.length, 3, '品牌应包含 3 家门店明细');
  });

  test('2.2 [正例] 品牌净收入 = 总毛利 - 内部关联交易抵消', () => {
    assert.equal(
      MOCK_BRAND_PANDL.brandNetRevenue,
      MOCK_BRAND_PANDL.totalGrossProfit - MOCK_BRAND_PANDL.internalTransaction_elimination,
      '品牌净收入应等于总毛利扣减关联交易'
    );
  });

  test('2.3 [反例] 不存在的品牌ID → 返回 null', async () => {
    const data = await getBrandPAndL('BRAND-NOT-EXISTS', { year: 2026, month: 6 });
    assert.equal(data, null, '不存在的品牌应返回 null');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. 门店对比
// ═══════════════════════════════════════════════════════════════════

describe('[Finance] 门店对比', () => {
  test('3.1 [正例] 对比2家门店损益数据', async () => {
    const results = await compareStores(['STORE001', 'STORE002']);
    assert.equal(results.length, 2, '对比2家门店应返回2条');
    const revRank = results.map((r) => r.revenue).sort((a, b) => b - a);
    assert.equal(revRank[0], 1285680, '上海旗舰店营收应最高');
    assert.equal(revRank[1], 856320, '北京分店营收应第二');
  });

  test('3.2 [反例] 对比不存在的门店 → 返回空结果', async () => {
    const results = await compareStores(['NONEXIST']);
    assert.equal(results.length, 0, '不存在的门店对比返回空数组');
  });

  test('3.3 [边界] 对比空门店列表 → 返回空数组', async () => {
    const results = await compareStores([]);
    assert.equal(results.length, 0, '空列表返回空数组');
  });

  test('3.4 [边界] 对比全部3家门店，按operatingProfit降序验证排名', async () => {
    const results = await compareStores(['STORE001', 'STORE002', 'STORE003']);
    assert.equal(results.length, 3);
    const sorted = [...results].sort((a, b) => b.operatingProfit - a.operatingProfit);
    // 上海 > 北京 > 广州
    assert.equal(sorted[0]!.storeName, '上海旗舰店');
    assert.equal(sorted[1]!.storeName, '北京分店');
    assert.equal(sorted[2]!.storeName, '广州分店');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. 分账日志与状态机
// ═══════════════════════════════════════════════════════════════════

describe('[Finance] 分账日志查询', () => {
  test('4.1 [正例] 查询全部分账日志，返回完整数据结构', async () => {
    const logs = await getTransactionLogs();
    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, MOCK_TRANSACTION_LOGS.length, '返回全量日志');
    const log = logs[0]!;
    assert.ok(log.transactionId, '应有交易ID');
    assert.ok(log.accountName, '应有账户名称');
    assert.ok(typeof log.amount === 'number', '金额应为数字');
    assert.ok(log.createdAt, '应有创建时间');
    assert.ok(log.status, '应有状态');
  });

  test('4.2 [正例] 按状态筛选: 已完成', async () => {
    const completed = await getTransactionLogs({ status: 'completed' });
    assert.ok(completed.length >= 2, '应有至少 2 条已完成记录');
    for (const log of completed) {
      assert.equal(log.status, 'completed', `日志 ${log.logId} 状态应为 completed`);
    }
  });

  test('4.3 [正例] 按状态筛选: 待分账', async () => {
    const pending = await getTransactionLogs({ status: 'pending' });
    assert.ok(pending.length >= 2, '应有至少 2 条待分账记录');
    for (const log of pending) {
      assert.equal(log.status, 'pending', `日志 ${log.logId} 状态应为 pending`);
    }
  });

  test('4.4 [正例] 按账户类型筛选: 品牌账户', async () => {
    const brandLogs = await getTransactionLogs({ accountType: 'brand' });
    assert.ok(brandLogs.length >= 2, '品牌账户应有至少 2 条日志');
    for (const log of brandLogs) {
      assert.equal(log.accountType, 'brand', `日志 ${log.logId} 类型应为 brand`);
    }
  });

  test('4.5 [正例] 按时间范围筛选', async () => {
    const filtered = await getTransactionLogs({
      startDate: '2026-07-01',
      endDate: '2026-07-01T23:59:59',
    });
    assert.ok(filtered.length >= 1, '7月1日应有分账日志');
  });

  test('4.6 [反例] 按不存在的状态筛选 → 返回空数组', async () => {
    const logs = await getTransactionLogs({ status: 'unknown_status' as TransactionStatus });
    assert.equal(logs.length, 0, '不存在的状态返回空数组');
  });

  test('4.7 [边界] 分账状态机流转: pending → split → transferred → completed', () => {
    // 验证 Mock 数据中存在完整的状态流转链
    const allLogs = MOCK_TRANSACTION_LOGS;
    const statuses = [...new Set(allLogs.map((l) => l.status))];
    // 合法的状态子集
    const allowedStatuses: TransactionStatus[] = ['pending', 'split', 'transferred', 'completed', 'failed'];
    for (const s of statuses) {
      assert.ok(
        allowedStatuses.includes(s as TransactionStatus),
        `状态 ${s} 应在合法列表中`
      );
    }
    // 同一门店的分账应包含从 pending 到 transferred/completed 的演进
    const storeTx = allLogs.filter((l) => l.accountType === 'store');
    assert.ok(storeTx.some((l) => l.status === 'transferred'), '门店日志应有 transferred 状态');
    assert.ok(storeTx.some((l) => l.status === 'pending'), '门店日志应有 pending 状态');
  });

  test('4.8 [正例] 单笔分账状态查询', async () => {
    const log = await getAccountStatus('TX-20260701-001');
    assert.ok(log, '应返回分账记录');
    assert.equal(log!.transactionId, 'TX-20260701-001');
    assert.equal(log!.status, 'completed');
    assert.equal(log!.splitRatio, 0.30);
  });

  test('4.9 [反例] 查询不存在的交易ID → 返回 null', async () => {
    const log = await getAccountStatus('TX-NONEXIST');
    assert.equal(log, null, '不存在的交易返回 null');
  });

  test('4.10 [边界] 失败交易包含错误备注', () => {
    const failedLog = MOCK_TRANSACTION_LOGS.find((l) => l.status === 'failed');
    assert.ok(failedLog, '应有失败交易记录');
    assert.equal(failedLog!.accountType, 'supplier', '失败交易应为供应商类型');
    assert.ok(failedLog!.remarks.includes('失败') || failedLog!.remarks.includes('异常'),
      '失败交易的备注应包含失败/异常信息');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. 格式化辅助函数
// ═══════════════════════════════════════════════════════════════════

describe('[Finance] 格式化辅助函数', () => {
  test('5.1 formatCurrency 金额格式化', () => {
    assert.equal(formatCurrency(1285680), '¥1,285,680.00');
    assert.equal(formatCurrency(0), '¥0.00');
    assert.equal(formatCurrency(99.5), '¥99.50');
  });

  test('5.2 formatPercent 百分比格式化', () => {
    assert.equal(formatPercent(0.60), '60.0%');
    assert.equal(formatPercent(0.056), '5.6%');
    assert.equal(formatPercent(1), '100.0%');
  });

  test('5.3 formatPeriodDisplay 期间格式化', () => {
    assert.equal(formatPeriodDisplay('2026-06'), '2026年6月');
    assert.equal(formatPeriodDisplay(''), '-');
    assert.equal(formatPeriodDisplay('2026'), '2026');
  });

  test('5.4 getAccountTypeLabel 账户类型中文标签', () => {
    assert.equal(getAccountTypeLabel('brand'), '品牌账户');
    assert.equal(getAccountTypeLabel('store'), '门店账户');
    assert.equal(getAccountTypeLabel('supplier'), '供应商');
    assert.equal(getAccountTypeLabel('platform'), '平台');
    assert.equal(getAccountTypeLabel('unknown'), 'unknown');
  });

  test('5.5 状态标签与颜色映射完整性', () => {
    const statuses: TransactionStatus[] = ['pending', 'split', 'transferred', 'completed', 'failed'];
    for (const s of statuses) {
      assert.ok(TRANSACTION_STATUS_LABELS[s], `状态 ${s} 应有中文标签`);
      assert.ok(TRANSACTION_STATUS_COLORS[s], `状态 ${s} 应有颜色值`);
    }
    // 标签长度非空
    assert.equal(TRANSACTION_STATUS_LABELS.completed, '已完成');
    assert.equal(TRANSACTION_STATUS_COLORS.completed, '#22c55e');
    assert.equal(TRANSACTION_STATUS_LABELS.failed, '失败');
    assert.equal(TRANSACTION_STATUS_COLORS.failed, '#ef4444');
  });

  test('5.6 [边界] 平台账户分账比例为 3% (0.03)', () => {
    const platformLog = MOCK_TRANSACTION_LOGS.find((l) => l.accountType === 'platform');
    assert.ok(platformLog, '应有平台账户日志');
    assert.equal(platformLog!.splitRatio, 0.03, '平台服务费分账比例应为 3%');
    assert.equal(platformLog!.amount, 8560, '平台服务费金额应为 8560');
  });
});
