'use client';

/**
 * 门店财务报表 - Store Finance Page
 * 角色: 💰财务管理 / 👔店长
 * 功能: 营收总览、费用分析、利润追踪、账期管理、财务对账
 */

import { useState, useMemo, useCallback, use } from 'react';

import {
  DataTable,
  DetailActionBar,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  Tabs,
  FilterChips,
  usePagination,
  useSearchFilter,
  useSortedItems,
  InfoRow,
  StatCard,
  CopyToClipboard,
  DetailClosureBar,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../components/detail-workspace-registry';

// ---- 类型定义 ----

type TransactionType = 'revenue' | 'expense' | 'refund' | 'transfer' | 'salary' | 'rent' | 'utility' | 'supplies';
type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled' | 'disputed';
type RevenueCategory = 'game' | 'membership' | 'merchandise' | 'food' | 'event' | 'other_revenue';
type ExpenseCategory = 'rent' | 'salary' | 'utility' | 'supplies' | 'maintenance' | 'marketing' | 'tax' | 'other_expense';

interface FinanceTransaction {
  id: string;
  date: string;
  type: TransactionType;
  category: RevenueCategory | ExpenseCategory;
  description: string;
  amount: number;
  tax: number;
  total: number;
  status: TransactionStatus;
  payerOrPayee: string;
  paymentMethod: string;
  invoiceNo: string;
  notes: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

interface DailyFinanceSummary {
  date: string;
  revenue: number;
  expense: number;
  netProfit: number;
  transactionCount: number;
  cashBalance: number;
  cardBalance: number;
  onlineBalance: number;
  memberChargeAmount: number;
  refundAmount: number;
}

interface MonthlyFinanceReport {
  month: string;
  totalRevenue: number;
  totalExpense: number;
  grossProfit: number;
  grossMargin: number;
  laborCost: number;
  rentCost: number;
  utilityCost: number;
  suppliesCost: number;
  marketingCost: number;
  otherCost: number;
  netProfit: number;
  netMargin: number;
  revenueByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
  transactionCount: number;
  avgDailyRevenue: number;
  bestDay: string;
  worstDay: string;
}

// ---- 常量 ----

const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  revenue: '收入',
  expense: '支出',
  refund: '退款',
  transfer: '转账',
  salary: '薪资',
  rent: '房租',
  utility: '水电',
  supplies: '物料',
};

const TRANSACTION_TYPE_VARIANTS: Record<TransactionType, 'success' | 'danger' | 'warning' | 'neutral'> = {
  revenue: 'success',
  expense: 'danger',
  refund: 'warning',
  transfer: 'neutral',
  salary: 'danger',
  rent: 'danger',
  utility: 'warning',
  supplies: 'neutral',
};

const TRANSACTION_STATUS_MAP: Record<TransactionStatus, { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' | 'info' }> = {
  completed: { label: '已完成', variant: 'success' },
  pending: { label: '待处理', variant: 'warning' },
  failed: { label: '失败', variant: 'danger' },
  cancelled: { label: '已取消', variant: 'neutral' },
  disputed: { label: '争议', variant: 'info' },
};

const REVENUE_CATEGORY_LABELS: Record<RevenueCategory, string> = {
  game: '游戏收入',
  membership: '会员收入',
  merchandise: '商品销售',
  food: '餐饮收入',
  event: '活动收入',
  other_revenue: '其他收入',
};

const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: '房租',
  salary: '薪资',
  utility: '水电费',
  supplies: '物料采购',
  maintenance: '维护费',
  marketing: '营销费',
  tax: '税费',
  other_expense: '其他支出',
};

const PAYMENT_METHODS = ['现金', '微信支付', '支付宝', '银行卡', '会员卡', '银联', '数字人民币'];

const REVENUE_CATEGORIES: RevenueCategory[] = ['game', 'membership', 'merchandise', 'food', 'event', 'other_revenue'];
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['rent', 'salary', 'utility', 'supplies', 'maintenance', 'marketing', 'tax', 'other_expense'];

// ---- Mock 数据生成 ----

function generateTransactions(): FinanceTransaction[] {
  const txns: FinanceTransaction[] = [];
  const startDate = new Date(2026, 3, 1);
  const endDate = new Date(2026, 6, 11);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayTransactions = 5 + Math.floor(Math.random() * 15);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    for (let i = 0; i < dayTransactions; i++) {
      const isRevenue = Math.random() > 0.35;
      const type: TransactionType = isRevenue ? 'revenue' : (['expense', 'refund', 'salary', 'rent', 'utility'] as TransactionType[])[Math.floor(Math.random() * 5)];
      const categoryStr: string = isRevenue
        ? REVENUE_CATEGORIES[Math.floor(Math.random() * REVENUE_CATEGORIES.length)]
        : EXPENSE_CATEGORIES[Math.floor(Math.random() * EXPENSE_CATEGORIES.length)];
      const amount = isRevenue ? (50 + Math.random() * 3000) : (100 + Math.random() * 5000);
      const tax = amount * 0.06;
      const statuses: TransactionStatus[] = ['completed', 'completed', 'completed', 'completed', 'completed', 'pending', 'failed', 'refund'];
      const staff = ['张三', '李四', '王五', '赵六', '陈七'];

      const descMap: Record<string, string[]> = {
        game: ['投币收入', '游戏币兑换', '街机投币', 'VR体验', '赛车游戏收入'],
        membership: ['会员开卡', '会员续费', '积分兑换', '会员升级', 'VIP充值'],
        merchandise: ['娃娃销售', '纪念品', '零食饮料', '周边商品', '盲盒'],
        food: ['餐饮消费', '饮品销售', '小吃', '套餐', '外卖'],
        event: ['活动门票', '比赛报名费', '包场费', '生日派对', '团建活动'],
        other_revenue: ['储物柜', '衣服烘干', 'WIFI收费', '打印服务', '其他'],
        rent: ['房租月付', '物业费', '房租押金'],
        salary: ['基本工资', '加班费', '提成', '奖金', '社保'],
        utility: ['电费', '水费', '网络费', '燃气费'],
        supplies: ['采购彩票纸', '采购清洁用品', '办公用品', '设备配件'],
        maintenance: ['设备维修', '空调清洗', '消防检查', '装修'],
        marketing: ['广告投放', '促销活动', '派单印刷', '礼品采购'],
        tax: ['增值税', '所得税', '附加税'],
        other_expense: ['罚款', '快递费', '咨询费', '保险费'],
      };

      txns.push({
        id: `TXN-${dateStr}-${String(i + 1).padStart(3, '0')}`,
        date: dateStr,
        type,
        category: categoryStr as any,
        description: (descMap[categoryStr] ?? ['其他'])[Math.floor(Math.random() * (descMap[categoryStr]!?.length ?? 1))],
        amount: Math.round(amount * 100) / 100,
        tax: Math.round(amount * 0.06 * 100) / 100,
        total: Math.round(amount * 1.06 * 100) / 100,
        status: statuses[Math.floor(Math.random() * statuses.length)]!,
        payerOrPayee: isRevenue ? ['普通会员', 'VIP会员', '散客', '企业客户', '团建客户'][Math.floor(Math.random() * 5)] : staff[Math.floor(Math.random() * staff.length)],
        paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)]!,
        invoiceNo: isRevenue ? `INV-${dateStr.replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}` : '—',
        notes: '',
        createdBy: staff[Math.floor(Math.random() * staff.length)]!,
        approvedBy: Math.random() > 0.3 ? staff[Math.floor(Math.random() * staff.length)] : null,
        approvedAt: Math.random() > 0.3 ? dateStr : null,
      });
    }
  }
  return txns.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

function computeDailySummaries(txns: FinanceTransaction[]): DailyFinanceSummary[] {
  const grouped: Record<string, FinanceTransaction[]> = {};
  // Only completed and pending
  const valid = txns.filter(t => t.status !== 'cancelled');
  valid.forEach(t => {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date]!.push(t);
  });

  return Object.entries(grouped).map(([date, dayTxns]) => {
    const revenue = dayTxns.filter(t => t.type === 'revenue').reduce((s, t) => s + t.total, 0);
    const refund = dayTxns.filter(t => t.type === 'refund').reduce((s, t) => s + t.total, 0);
    const expense = dayTxns.filter(t => t.type === 'expense' || t.type === 'salary' || t.type === 'rent' || t.type === 'utility' || t.type === 'supplies').reduce((s, t) => s + t.total, 0);
    const memberCharge = dayTxns.filter(t => t.category === 'membership').reduce((s, t) => s + t.total, 0);
    return {
      date,
      revenue: Math.round(revenue * 100) / 100,
      expense: Math.round((expense + refund) * 100) / 100,
      netProfit: Math.round((revenue - expense - refund) * 100) / 100,
      transactionCount: dayTxns.length,
      cashBalance: Math.round(dayTxns.filter(t => t.paymentMethod === '现金').reduce((s, t) => s + t.total, 0) * 100) / 100,
      cardBalance: Math.round(dayTxns.filter(t => t.paymentMethod === '银行卡' || t.paymentMethod === '银联').reduce((s, t) => s + t.total, 0) * 100) / 100,
      onlineBalance: Math.round(dayTxns.filter(t => t.paymentMethod === '微信支付' || t.paymentMethod === '支付宝' || t.paymentMethod === '数字人民币').reduce((s, t) => s + t.total, 0) * 100) / 100,
      memberChargeAmount: Math.round(memberCharge * 100) / 100,
      refundAmount: Math.round(refund * 100) / 100,
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

function computeMonthlyReport(txns: FinanceTransaction[]): MonthlyFinanceReport[] {
  const grouped: Record<string, FinanceTransaction[]> = {};
  txns.filter(t => t.status !== 'cancelled').forEach(t => {
    const month = t.date.substring(0, 7);
    if (!grouped[month]) grouped[month] = [];
    grouped[month]!.push(t);
  });

  return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([month, monthTxns]) => {
    const totalRevenue = monthTxns.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    const refundAmount = monthTxns.filter(t => t.type === 'refund').reduce((s, t) => s + t.amount, 0);
    const salaryCost = monthTxns.filter(t => t.type === 'salary').reduce((s, t) => s + t.amount, 0);
    const rentCost = monthTxns.filter(t => t.type === 'rent').reduce((s, t) => s + t.amount, 0);
    const utilityCost = monthTxns.filter(t => t.type === 'utility').reduce((s, t) => s + t.amount, 0);
    const suppliesCost = monthTxns.filter(t => t.type === 'supplies').reduce((s, t) => s + t.amount, 0);
    const otherExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const marketingCost = monthTxns.filter(t => t.category === 'marketing').reduce((s, t) => s + t.amount, 0);
    const totalExpense = salaryCost + rentCost + utilityCost + suppliesCost + otherExpense + marketingCost;
    const grossProfit = totalRevenue - totalExpense;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfit = grossProfit - refundAmount;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const expenseByCat: Record<string, number> = {
      salary: salaryCost, rent: rentCost, utility: utilityCost, supplies: suppliesCost,
      maintenance: otherExpense, marketing: marketingCost, tax: 0, other_expense: otherExpense,
    };
    const revenueByCat: Record<string, number> = {};
    REVENUE_CATEGORIES.forEach(cat => {
      revenueByCat[cat] = monthTxns.filter(t => t.category === cat && t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    });

    const daysInMonth = new Date(parseInt(month.split('-')[0]!), parseInt(month.split('-')[1]!), 0).getDate();
    const validDays = new Set(monthTxns.map(t => t.date)).size;

    return {
      month,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossMargin: Math.round(grossMargin * 100) / 100,
      laborCost: Math.round(salaryCost * 100) / 100,
      rentCost: Math.round(rentCost * 100) / 100,
      utilityCost: Math.round(utilityCost * 100) / 100,
      suppliesCost: Math.round(suppliesCost * 100) / 100,
      marketingCost: Math.round(marketingCost * 100) / 100,
      otherCost: Math.round(otherExpense * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      netMargin: Math.round(netMargin * 100) / 100,
      revenueByCategory: revenueByCat,
      expenseByCategory: expenseByCat,
      transactionCount: monthTxns.length,
      avgDailyRevenue: validDays > 0 ? Math.round((totalRevenue / validDays) * 100) / 100 : 0,
      bestDay: '2026-06-15',
      worstDay: '2026-04-03',
    };
  });
}

let txnCache: FinanceTransaction[] | null = null;
let dailyCache: DailyFinanceSummary[] | null = null;
let monthlyCache: MonthlyFinanceReport[] | null = null;

function getTxns(): FinanceTransaction[] {
  if (!txnCache) txnCache = generateTransactions();
  return txnCache;
}

function getDaily(): DailyFinanceSummary[] {
  if (!dailyCache) dailyCache = computeDailySummaries(getTxns());
  return dailyCache;
}

function getMonthly(): MonthlyFinanceReport[] {
  if (!monthlyCache) monthlyCache = computeMonthlyReport(getTxns());
  return monthlyCache;
}

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function moneyColor(amount: number): string {
  if (amount > 0) return '#22c55e';
  if (amount < 0) return '#ef4444';
  return '#94a3b8';
}

// ---- 交易列 ----

function buildTxnColumns(): DataTableColumn<FinanceTransaction>[] {
  return [
    { key: 'date', title: '日期', dataKey: 'date', sortable: true },
    { key: 'description', title: '描述', dataKey: 'description', sortable: true },
    {
      key: 'type', title: '类型', sortable: true, sortValue: (i) => i.type,
      render: (i) => <StatusBadge label={TRANSACTION_TYPE_LABELS[i.type]} variant={TRANSACTION_TYPE_VARIANTS[i.type]} size="sm" />,
    },
    {
      key: 'category', title: '分类', sortable: true, sortValue: (i) => i.category,
      render: (i) => {
        const label = (REVENUE_CATEGORIES as readonly string[]).includes(i.category)
          ? REVENUE_CATEGORY_LABELS[i.category as RevenueCategory]
          : EXPENSE_CATEGORY_LABELS[i.category as ExpenseCategory];
        return <span style={{ color: '#cbd5e1' }}>{label}</span>;
      },
    },
    { key: 'amount', title: '金额', dataKey: 'amount', sortable: true, align: 'right',
      render: (i) => {
        const isIncome = i.type === 'revenue';
        return <span style={{ color: isIncome ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{isIncome ? '+' : '-'}{formatMoney(i.amount)}</span>;
      }
    },
    { key: 'paymentMethod', title: '支付方式', dataKey: 'paymentMethod', sortable: true },
    { key: 'status', title: '状态', sortable: true, sortValue: (i) => i.status,
      render: (i) => <StatusBadge label={TRANSACTION_STATUS_MAP[i.status].label} variant={TRANSACTION_STATUS_MAP[i.status].variant} size="sm" dot />
    },
  ];
}

// ---- 主页面 ----

export default function StoreFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const txns = useMemo(() => getTxns(), []);
  const daily = useMemo(() => getDaily(), []);
  const monthly = useMemo(() => getMonthly(), []);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'daily' | 'monthly'>('overview');

  const currentMonth = monthly[0];
  const currentDay = daily[0];

  const searchFields = useMemo<(keyof FinanceTransaction)[]>(() => ['description', 'payerOrPayee', 'paymentMethod', 'category', 'invoiceNo'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(txns, searchFields);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const typeFiltered = useMemo(
    () => typeFilter === 'ALL' ? filteredItems : filteredItems.filter(t => t.type === typeFilter),
    [filteredItems, typeFilter]
  );
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const txnColumns = useMemo(() => buildTxnColumns(), []);
  const sortedTxns = useSortedItems(typeFiltered, txnColumns, sortConfig);
  const pagination = usePagination({ initialPageSize: 15 });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, typeFilter, pagination]);
  const pageTxns = pagination.paginate(sortedTxns);

  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);
  const totalExpense = daily.reduce((s, d) => s + d.expense, 0);
  const totalProfit = daily.reduce((s, d) => s + d.netProfit, 0);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb {...buildStandardBreadcrumb({ workspace: 'stores', detailLabel: '财务管理' })} />
      <PageShell title="门店财务管理" subtitle="营收分析 · 费用管控 · 利润追踪 · 交易明细">
        {/* 概要卡片 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>累计营收</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{formatMoney(totalRevenue)}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{daily.length} 天交易数据</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>累计支出</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{formatMoney(totalExpense)}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>含薪资·房租·水电·物料</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>累计净利润</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: moneyColor(totalProfit) }}>
              {formatMoney(totalProfit)}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              利润率: {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : '—'}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>交易笔数</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{txns.length.toLocaleString()}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              日均 {Math.round(txns.length / daily.length)} 笔
            </div>
          </div>
        </div>

        {/* 本月概览 */}
        {currentMonth && (
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
            <div style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>本月营收</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                {formatMoney(currentMonth.totalRevenue)}
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>支出: {formatMoney(currentMonth.totalExpense)}</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>毛利率</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: currentMonth.grossMargin > 40 ? '#22c55e' : currentMonth.grossMargin > 20 ? '#eab308' : '#ef4444' }}>
                {currentMonth.grossMargin}%
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
                净利率: {currentMonth.netMargin}%
              </div>
            </div>
            <div style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>最大支出项</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
                {formatMoney(Math.max(currentMonth.laborCost, currentMonth.rentCost, currentMonth.utilityCost))}
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
                {currentMonth.laborCost > currentMonth.rentCost ? '人力成本' : '房租'}
              </div>
            </div>
          </div>
        )}

        {/* Tab 切换 */}
        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'overview', label: '📊 营收概览' },
              { key: 'transactions', label: '📋 交易明细' },
              { key: 'daily', label: '📅 日报表' },
              { key: 'monthly', label: '📆 月报表' },
            ]}
            activeKey={activeTab}
            onChange={(t) => setActiveTab(t as typeof activeTab)}
            variant="pills"
          />
        </div>

        {activeTab === 'overview' && (
          <>
            {/* 营收分类 */}
            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>营收分类（当月）</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {currentMonth && REVENUE_CATEGORIES.map(cat => {
                  const amount = currentMonth.revenueByCategory[cat] ?? 0;
                  const pct = currentMonth.totalRevenue > 0 ? (amount / currentMonth.totalRevenue) * 100 : 0;
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.3)' }}>
                      <div style={{ width: 100, flexShrink: 0, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                        {REVENUE_CATEGORY_LABELS[cat]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 8, borderRadius: 4, background: 'rgba(148,163,184,0.15)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 4, background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
                        </div>
                      </div>
                      <div style={{ width: 120, textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#22c55e' }}>
                        {formatMoney(amount)}
                      </div>
                      <div style={{ width: 60, textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>
                        {pct.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 支出分类 */}
            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>支出分类（当月）</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {currentMonth && EXPENSE_CATEGORIES.map(cat => {
                  const amount = currentMonth.expenseByCategory[cat] ?? 0;
                  const pct = currentMonth.totalExpense > 0 ? (amount / currentMonth.totalExpense) * 100 : 0;
                  if (amount === 0) return null;
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.3)' }}>
                      <div style={{ width: 100, flexShrink: 0, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                        {EXPENSE_CATEGORY_LABELS[cat]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 8, borderRadius: 4, background: 'rgba(148,163,184,0.15)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 4, background: 'linear-gradient(90deg, #ef4444, #dc2626)' }} />
                        </div>
                      </div>
                      <div style={{ width: 120, textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#ef4444' }}>
                        {formatMoney(amount)}
                      </div>
                      <div style={{ width: 60, textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>
                        {pct.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 每日趋势快照 */}
            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>最近七天营收趋势</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {daily.slice(0, 7).map(d => (
                  <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.3)' }}>
                    <div style={{ width: 100, fontSize: 13, color: '#94a3b8' }}>{d.date}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 20 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 6, borderRadius: 3, background: 'rgba(34,197,94,0.15)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min((d.revenue / 50000) * 100, 100)}%`, borderRadius: 3, background: '#22c55e' }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#22c55e', marginTop: 2 }}>{formatMoney(d.revenue)}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 6, borderRadius: 3, background: 'rgba(239,68,68,0.15)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min((d.expense / 50000) * 100, 100)}%`, borderRadius: 3, background: '#ef4444' }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{formatMoney(d.expense)}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ width: 120, textAlign: 'right', fontSize: 14, fontWeight: 700, color: moneyColor(d.netProfit) }}>
                      {formatMoney(d.netProfit)}
                    </div>
                    <div style={{ width: 50, textAlign: 'right', fontSize: 12, color: d.netProfit > 0 ? '#22c55e' : '#ef4444' }}>
                      {d.transactionCount}笔
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'transactions' && (
          <>
            <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索描述/付款方/支付方式/分类..." />
            <div style={{ marginTop: 12 }}>
              <Tabs
                items={[
                  { key: 'ALL', label: '全部', count: filteredItems.length },
                  ...(['revenue', 'expense', 'refund', 'salary', 'rent'] as TransactionType[]).map(t => ({
                    key: t,
                    label: TRANSACTION_TYPE_LABELS[t]!,
                    count: filteredItems.filter(i => i.type === t).length,
                  })),
                ]}
                activeKey={typeFilter} onChange={setTypeFilter}
                variant="pills" size="sm"
              />
            </div>
            <DataTable title={`交易明细（${sortedTxns.length} 条）`} columns={txnColumns} items={pageTxns} rowKey={(i) => i.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
            <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sortedTxns.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
          </>
        )}

        {activeTab === 'daily' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>今日营收</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{currentDay ? formatMoney(currentDay.revenue) : '—'}</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>今日支出</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{currentDay ? formatMoney(currentDay.expense) : '—'}</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>今日净利</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: currentDay ? moneyColor(currentDay.netProfit) : '#94a3b8' }}>
                  {currentDay ? formatMoney(currentDay.netProfit) : '—'}
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>日期</th>
                  <th style={thStyle}>营收</th>
                  <th style={thStyle}>支出</th>
                  <th style={thStyle}>退款</th>
                  <th style={thStyle}>净利</th>
                  <th style={thStyle}>现金余额</th>
                  <th style={thStyle}>线上余额</th>
                  <th style={thStyle}>会员充值</th>
                  <th style={thStyle}>交易数</th>
                </tr>
              </thead>
              <tbody>
                {daily.map(d => (
                  <tr key={d.date}>
                    <td style={tdStyle}>{d.date}</td>
                    <td style={{ ...tdStyle, color: '#22c55e', fontWeight: 600 }}>{formatMoney(d.revenue)}</td>
                    <td style={{ ...tdStyle, color: '#ef4444' }}>{formatMoney(d.expense)}</td>
                    <td style={{ ...tdStyle, color: '#eab308' }}>{formatMoney(d.refundAmount)}</td>
                    <td style={{ ...tdStyle, color: moneyColor(d.netProfit), fontWeight: 700 }}>{formatMoney(d.netProfit)}</td>
                    <td style={tdStyle}>{formatMoney(d.cashBalance)}</td>
                    <td style={tdStyle}>{formatMoney(d.onlineBalance)}</td>
                    <td style={tdStyle}>{formatMoney(d.memberChargeAmount)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{d.transactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'monthly' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>当前月度</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{currentMonth?.month ?? '—'}</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>日均营收</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  {currentMonth ? formatMoney(currentMonth.avgDailyRevenue) : '—'}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>交易总数</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
                  {currentMonth?.transactionCount.toLocaleString() ?? '—'}
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>月份</th>
                  <th style={thStyle}>营收</th>
                  <th style={thStyle}>支出</th>
                  <th style={thStyle}>毛利</th>
                  <th style={thStyle}>毛利率</th>
                  <th style={thStyle}>人力成本</th>
                  <th style={thStyle}>房租</th>
                  <th style={thStyle}>净利</th>
                  <th style={thStyle}>净利率</th>
                  <th style={thStyle}>交易数</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map(m => (
                  <tr key={m.month}>
                    <td style={tdStyle}>{m.month}</td>
                    <td style={{ ...tdStyle, color: '#22c55e', fontWeight: 600 }}>{formatMoney(m.totalRevenue)}</td>
                    <td style={{ ...tdStyle, color: '#ef4444' }}>{formatMoney(m.totalExpense)}</td>
                    <td style={{ ...tdStyle, color: moneyColor(m.grossProfit), fontWeight: 600 }}>{formatMoney(m.grossProfit)}</td>
                    <td style={{ ...tdStyle, color: m.grossMargin > 40 ? '#22c55e' : m.grossMargin > 20 ? '#eab308' : '#ef4444' }}>{m.grossMargin}%</td>
                    <td style={tdStyle}>{formatMoney(m.laborCost)}</td>
                    <td style={tdStyle}>{formatMoney(m.rentCost)}</td>
                    <td style={{ ...tdStyle, color: moneyColor(m.netProfit), fontWeight: 700 }}>{formatMoney(m.netProfit)}</td>
                    <td style={{ ...tdStyle, color: m.netMargin > 20 ? '#22c55e' : m.netMargin > 10 ? '#eab308' : '#ef4444' }}>{m.netMargin}%</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{m.transactionCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </PageShell>
    </main>
  );
}

const panelStyle: React.CSSProperties = {
  borderRadius: 16, padding: 24,
  background: 'rgba(15,23,42,0.35)',
  border: '1px solid rgba(148,163,184,0.18)',
  marginBottom: 24,
};

const statCardStyle: React.CSSProperties = {
  borderRadius: 16, padding: 18,
  background: 'rgba(15,23,42,0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px',
  color: '#94a3b8', fontSize: 12,
  borderBottom: '1px solid rgba(148,163,184,0.18)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#e2e8f0', fontSize: 13,
  borderBottom: '1px solid rgba(148,163,184,0.1)',
};
