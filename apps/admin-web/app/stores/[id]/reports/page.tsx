'use client';

/**
 * 门店运营报表 - Store Reports Page
 * 角色: 📊运营管理 / 👔店长
 * 功能: 客流分析、营收趋势、设备利用率、会员分析、热力图
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

// ---- 类型 ----

type ReportCategory = 'daily' | 'weekly' | 'monthly' | 'custom';
type ReportType = 'traffic' | 'revenue' | 'device' | 'member' | 'staff' | 'inventory' | 'comprehensive';
type TrafficPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

interface TrafficData {
  date: string;
  totalVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  peakHour: string;
  peakTraffic: number;
  avgStayDuration: number; // minutes
  avgSpendPerPerson: number;
  conversionRate: number; // %
  periodBreakdown: Record<TrafficPeriod, number>;
  hourBreakdown: number[];
  sourceDistribution: Record<string, number>;
  ageDistribution: Record<string, number>;
  genderRatio: number; // male %
}

interface DeviceUtilization {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  utilizationRate: number; // %
  totalPlayMinutes: number;
  revenueGenerated: number;
  maintenanceCount: number;
  downtimeMinutes: number;
  popularityScore: number; // 1-10
  peakTimes: string[];
  ageGroupPreference: string;
}

interface MemberAnalysis {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  churnRate: number; // %
  avgLTV: number;
  avgRechargeAmount: number;
  topTier: string;
  tierDistribution: Record<string, number>;
  signupSource: Record<string, number>;
  mostActiveDay: string;
  mostActiveHour: string;
  avgVisitsPerMonth: number;
  memberRevenueRatio: number; // %
}

interface ComprehensiveReport {
  period: string;
  statistics: {
    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
    totalVisitors: number;
    avgRevenuePerVisitor: number;
    deviceUtilizationAvg: number;
    staffEfficiency: number;
    memberContribution: number;
    inventoryTurnover: number;
  };
  trends: {
    revenue: 'up' | 'down' | 'stable';
    traffic: 'up' | 'down' | 'stable';
    membership: 'up' | 'down' | 'stable';
    efficiency: 'up' | 'down' | 'stable';
  };
  highlights: string[];
  risks: string[];
  recommendations: string[];
}

// ---- 常量 ----

const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  daily: '日报',
  weekly: '周报',
  monthly: '月报',
  custom: '自定义',
};

const TRAFFIC_PERIOD_LABELS: Record<TrafficPeriod, string> = {
  morning: '早间(08-12)',
  afternoon: '午后(12-18)',
  evening: '晚间(18-22)',
  night: '深夜(22-02)',
};

const SOURCE_LABELS: Record<string, string> = {
  walk_in: '自然客流',
  member_referral: '会员推荐',
  social_media: '社交媒体',
  online_ads: '线上广告',
  partner: '合作渠道',
  event: '活动引流',
  other: '其他',
};

const SOURCE_COLORS: Record<string, string> = {
  walk_in: '#3b82f6',
  member_referral: '#22c55e',
  social_media: '#8b5cf6',
  online_ads: '#f97316',
  partner: '#06b6d4',
  event: '#eab308',
  other: '#6b7280',
};

// ---- Mock 数据 ----

function generateTrafficData(): TrafficData[] {
  const data: TrafficData[] = [];
  const startDate = new Date(2026, 5, 1);
  const endDate = new Date(2026, 6, 11);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseTraffic = isWeekend ? 800 : 500;
    const total = baseTraffic + Math.floor(Math.random() * 400) - 200;
    const newV = Math.floor(total * (0.2 + Math.random() * 0.15));

    data.push({
      date: d.toISOString().split('T')[0],
      totalVisitors: total,
      newVisitors: newV,
      returningVisitors: total - newV,
      peakHour: `${12 + Math.floor(Math.random() * 8)}:00`,
      peakTraffic: Math.floor(total * (0.12 + Math.random() * 0.08)),
      avgStayDuration: 45 + Math.floor(Math.random() * 75),
      avgSpendPerPerson: Math.round((35 + Math.random() * 65) * 100) / 100,
      conversionRate: Math.round((15 + Math.random() * 25) * 10) / 10,
      periodBreakdown: {
        morning: Math.floor(total * (0.08 + Math.random() * 0.08)),
        afternoon: Math.floor(total * (0.25 + Math.random() * 0.15)),
        evening: Math.floor(total * (0.35 + Math.random() * 0.15)),
        night: Math.floor(total * (0.05 + Math.random() * 0.08)),
      },
      hourBreakdown: Array.from({ length: 24 }, (_, h) => {
        if (h < 8) return Math.floor(Math.random() * 10);
        if (h < 12) return Math.floor(30 + Math.random() * 60);
        if (h < 14) return Math.floor(60 + Math.random() * 80);
        if (h < 18) return Math.floor(80 + Math.random() * 100);
        if (h < 22) return Math.floor(100 + Math.random() * 150);
        return Math.floor(20 + Math.random() * 40);
      }),
      sourceDistribution: {
        walk_in: 35 + Math.floor(Math.random() * 15),
        member_referral: 10 + Math.floor(Math.random() * 10),
        social_media: 10 + Math.floor(Math.random() * 15),
        online_ads: 5 + Math.floor(Math.random() * 10),
        partner: 5 + Math.floor(Math.random() * 8),
        event: 3 + Math.floor(Math.random() * 10),
        other: 2 + Math.floor(Math.random() * 5),
      },
      ageDistribution: {
        '0-12': 5 + Math.floor(Math.random() * 10),
        '13-18': 10 + Math.floor(Math.random() * 15),
        '19-25': 20 + Math.floor(Math.random() * 20),
        '26-35': 20 + Math.floor(Math.random() * 15),
        '36-50': 10 + Math.floor(Math.random() * 10),
        '50+': 5 + Math.floor(Math.random() * 8),
      },
      genderRatio: 48 + Math.floor(Math.random() * 8),
    });
  }
  return data.sort((a, b) => b.date.localeCompare(a.date));
}

function generateDeviceUtilization(): DeviceUtilization[] {
  const deviceNames = [
    '街机-拳皇', '街机-赛车', '街机-射击', '篮球机', '娃娃机(大)', '娃娃机(小)',
    'VR体验', '跳舞机', '射击狩猎', '赛车模拟', '音乐鼓', '保龄球',
    '桌上冰球', '飞镖机', '夹娃娃(中)', '扭蛋机', '儿童乐园', '抓鱼机',
  ];

  return deviceNames.map((name, idx) => ({
    deviceId: `DEV-UTIL-${idx + 1}`,
    deviceName: name,
    deviceType: name.includes('娃娃') || name.includes('扭蛋') ? '抓取类' :
                name.includes('街机') || name.includes('射击') ? '街机类' :
                name.includes('VR') || name.includes('赛车') || name.includes('音乐') ? '体验类' :
                name.includes('篮球') || name.includes('保龄') || name.includes('冰球') ? '运动类' :
                name.includes('儿童') || name.includes('抓鱼') ? '儿童类' : '其他',
    utilizationRate: Math.round((45 + Math.random() * 50) * 10) / 10,
    totalPlayMinutes: Math.floor(5000 + Math.random() * 20000),
    revenueGenerated: Math.round((5000 + Math.random() * 30000) * 100) / 100,
    maintenanceCount: Math.floor(Math.random() * 8),
    downtimeMinutes: Math.floor(Math.random() * 300),
    popularityScore: Math.round((3 + Math.random() * 7) * 10) / 10,
    peakTimes: ['14:00-16:00', '18:00-21:00'],
    ageGroupPreference: ['全体', '青少年', '年轻人', '亲子', '儿童', '成人'][Math.floor(Math.random() * 6)],
  }));
}

function generateMemberAnalysis(): MemberAnalysis {
  return {
    totalMembers: 3245,
    activeMembers: 1876,
    newMembersThisMonth: 142,
    churnRate: 5.8,
    avgLTV: 1280,
    avgRechargeAmount: 350,
    topTier: '钻石会员',
    tierDistribution: {
      '普通会员': 40,
      '银卡会员': 25,
      '金卡会员': 20,
      '钻石会员': 10,
      '至尊会员': 5,
    },
    signupSource: {
      '门店注册': 45,
      '线上注册': 25,
      '活动推广': 15,
      '老带新': 10,
      '异业合作': 5,
    },
    mostActiveDay: '星期六',
    mostActiveHour: '19:00-21:00',
    avgVisitsPerMonth: 3.2,
    memberRevenueRatio: 62,
  };
}

function generateComprehensiveReport(traffic: TrafficData[], deviceUtil: DeviceUtilization[]): ComprehensiveReport {
  const totalRevenue = traffic.reduce((s, t) => s + t.totalVisitors * t.avgSpendPerPerson, 0);
  const totalExpense = totalRevenue * (0.55 + Math.random() * 0.15);
  const totalVisitors = traffic.reduce((s, t) => s + t.totalVisitors, 0);
  const avgUtil = deviceUtil.reduce((s, d) => s + d.utilizationRate, 0) / deviceUtil.length;

  return {
    period: '2026-07-11 (累计)',
    statistics: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netProfit: Math.round((totalRevenue - totalExpense) * 100) / 100,
      totalVisitors,
      avgRevenuePerVisitor: Math.round((totalRevenue / totalVisitors) * 100) / 100,
      deviceUtilizationAvg: Math.round(avgUtil * 10) / 10,
      staffEfficiency: Math.round((75 + Math.random() * 20) * 10) / 10,
      memberContribution: 62,
      inventoryTurnover: Math.round((3 + Math.random() * 3) * 10) / 10,
    },
    trends: {
      revenue: 'up',
      traffic: 'up',
      membership: 'up',
      efficiency: 'stable',
    },
    highlights: [
      '周末客流环比增长12.3%，游戏收入贡献占比持续上升',
      '会员活跃度提升至62%，新增会员环比增长8.5%',
      '设备平均利用率81.2%，街机类和篮球机持续热门',
      '客单价¥52.3，同比提升6.8%',
    ],
    risks: [
      '娃娃机维护频次偏高（月均3次），建议增加备件储备',
      '晚间时段(22:00后)客流量下降明显，运营成本与收入不匹配',
      '餐饮区毛利率偏低(32%)，需优化供应链成本',
    ],
    recommendations: [
      '优化晚间时段的灯光/音乐/活动吸引夜间客流',
      '对娃娃机进行预防性维护计划，减少突发故障',
      '增加亲子互动活动和家庭套餐，提升儿童客群占比',
      '推动会员推荐奖励计划，降低获客成本',
      '上线滞销设备回收机制，释放空间引入新游艺',
    ],
  };
}

let trafficCache: TrafficData[] | null = null;
let deviceUtilCache: DeviceUtilization[] | null = null;
let memberAnalysisCache: MemberAnalysis | null = null;
let comprehensiveCache: ComprehensiveReport | null = null;

function getTraffic(): TrafficData[] {
  if (!trafficCache) trafficCache = generateTrafficData();
  return trafficCache;
}

function getDeviceUtil(): DeviceUtilization[] {
  if (!deviceUtilCache) deviceUtilCache = generateDeviceUtilization();
  return deviceUtilCache;
}

function getMemberAnalysis(): MemberAnalysis {
  if (!memberAnalysisCache) memberAnalysisCache = generateMemberAnalysis();
  return memberAnalysisCache;
}

function getComprehensive(useCache = true): ComprehensiveReport {
  if (!comprehensiveCache || !useCache) {
    comprehensiveCache = generateComprehensiveReport(getTraffic(), getDeviceUtil());
  }
  return comprehensiveCache;
}

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---- 柱状条 ----
function Bar({ value, max, color = '#3b82f6', height = 6, label }: { value: number; max: number; color?: string; height?: number; label?: string }) {
  return (
    <div>
      <div style={{ height, borderRadius: 3, background: 'rgba(148,163,184,0.15)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min((value / max) * 100, 100)}%`, borderRadius: 3, background: color }} />
      </div>
      {label !== undefined && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</div>}
    </div>
  );
}

// ---- 主页面 ----

export default function StoreReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const traffic = useMemo(() => getTraffic(), []);
  const deviceUtil = useMemo(() => getDeviceUtil(), []);
  const memberAnalysis = useMemo(() => getMemberAnalysis(), []);
  const comprehensive = useMemo(() => getComprehensive(), []);
  const [reportTab, setReportTab] = useState<'comprehensive' | 'traffic' | 'device' | 'member'>('comprehensive');

  const peakHourArray = useMemo(() => {
    const counts: Record<string, number> = {};
    traffic.forEach(t => {
      const hour = t.peakHour.split(':')[0]! + ':00';
      counts[hour] = (counts[hour] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [traffic]);

  const weekTraffic = useMemo(() => {
    const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const avg: Record<string, { sum: number; count: number }> = {};
    traffic.forEach(t => {
      const day = new Date(t.date).getDay();
      const name = week[day]!;
      if (!avg[name]) avg[name] = { sum: 0, count: 0 };
      avg[name]!.sum += t.totalVisitors;
      avg[name]!.count++;
    });
    return week.map(w => ({ day: w, avg: avg[w] ? Math.round(avg[w]!.sum / avg[w]!.count) : 0 }));
  }, [traffic]);

  const monthlyTraffic = useMemo(() => {
    const byMonth: Record<string, number[]> = {};
    traffic.forEach(t => {
      const m = t.date.substring(0, 7);
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m]!.push(t.totalVisitors);
    });
    return Object.entries(byMonth).map(([m, vals]) => ({ month: m, avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length), total: vals.reduce((s, v) => s + v, 0) }));
  }, [traffic]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb {...buildStandardBreadcrumb({ workspace: 'stores', detailLabel: '运营报表' })} />
      <PageShell title="门店运营报表" subtitle="客流分析 · 设备利用率 · 会员分析 · 综合报告">
        {/* 综合统计 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>综合营收</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{formatMoney(comprehensive.statistics.totalRevenue)}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: trendsColor(comprehensive.trends.revenue) }}>
              {comprehensive.trends.revenue === 'up' ? '↑ 增长趋势' : comprehensive.trends.revenue === 'down' ? '↓ 下降趋势' : '→ 持平'}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总客流量</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{comprehensive.statistics.totalVisitors.toLocaleString()}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: trendsColor(comprehensive.trends.traffic) }}>
              {comprehensive.trends.traffic === 'up' ? '↑ 客流上升' : comprehensive.trends.traffic === 'down' ? '↓ 客流下降' : '→ 平稳'}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>设备利用率</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: comprehensive.statistics.deviceUtilizationAvg > 70 ? '#22c55e' : '#eab308' }}>
              {comprehensive.statistics.deviceUtilizationAvg}%
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{deviceUtil.length} 台设备</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>会员贡献比</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#8b5cf6' }}>{comprehensive.statistics.memberContribution}%</div>
            <div style={{ marginTop: 4, fontSize: 12, color: trendsColor(comprehensive.trends.membership) }}>
              {comprehensive.trends.membership === 'up' ? '↑ 会员增长' : comprehensive.trends.membership === 'down' ? '↓ 会员流失' : '→ 稳定'}
            </div>
          </div>
        </div>

        {/* Tab */}
        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'comprehensive', label: '📊 综合报告' },
              { key: 'traffic', label: '🚶 客流分析' },
              { key: 'device', label: '🎮 设备利用率' },
              { key: 'member', label: '👥 会员分析' },
            ]}
            activeKey={reportTab}
            onChange={(t) => setReportTab(t as typeof reportTab)}
            variant="pills"
          />
        </div>

        {reportTab === 'comprehensive' && (
          <>
            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>关键指标</h3>
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 16 }}>
                <StatCard label="净利润" value={formatMoney(comprehensive.statistics.netProfit)} helper="净利率: 35.2%" />
                <StatCard label="客单价" value={formatMoney(comprehensive.statistics.avgRevenuePerVisitor)} helper="日均恒定" />
                <StatCard label="人员效率" value={`${comprehensive.statistics.staffEfficiency}%`} helper="服务转化率" />
              </div>
            </section>

            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>✨ 运营亮点</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {comprehensive.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <span style={{ color: '#22c55e', fontSize: 16 }}>✅</span>
                    <span style={{ color: '#e2e8f0', fontSize: 14 }}>{h}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>⚠️ 风险提示</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {comprehensive.risks.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <span style={{ color: '#ef4444', fontSize: 16 }}>⚠️</span>
                    <span style={{ color: '#e2e8f0', fontSize: 14 }}>{r}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>💡 优化建议</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {comprehensive.recommendations.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <span style={{ color: '#93c5fd', fontSize: 16 }}>💡</span>
                    <span style={{ color: '#e2e8f0', fontSize: 14 }}>{r}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {reportTab === 'traffic' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>日均客流</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
                  {Math.round(traffic.reduce((s, t) => s + t.totalVisitors, 0) / traffic.length)}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均停留</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>
                  {Math.round(traffic.reduce((s, t) => s + t.avgStayDuration, 0) / traffic.length)}min
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均转化率</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  {(traffic.reduce((s, t) => s + t.conversionRate, 0) / traffic.length).toFixed(1)}%
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>最多高峰时段</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f97316' }}>
                  {peakHourArray[0]?.[0] ?? '—'}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>出现 {peakHourArray[0]?.[1] ?? 0} 次</div>
              </div>
            </div>

            {/* 周客流 */}
            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>周客流分布</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {weekTraffic.map(w => {
                  const max = Math.max(...weekTraffic.map(x => x.avg));
                  return (
                    <div key={w.day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                      <div style={{ width: 50, fontSize: 13, color: '#94a3b8' }}>{w.day}</div>
                      <div style={{ flex: 1 }}>
                        <Bar value={w.avg} max={max} color={w.day === '周六' || w.day === '周日' ? '#f97316' : '#3b82f6'} height={10} label={`${w.avg}人`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 时段分布 */}
            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>今日时段客流</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {(Object.entries(TRAFFIC_PERIOD_LABELS) as [TrafficPeriod, string][]).map(([period, label]) => {
                  const counts = traffic.filter(t => t.periodBreakdown[period] !== undefined).map(t => t.periodBreakdown[period]);
                  const avg = counts.length > 0 ? Math.round(counts.reduce((s, c) => s + c, 0) / counts.length) : 0;
                  return (
                    <div key={period} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                      <div style={{ width: 130, fontSize: 13, color: '#94a3b8' }}>{label}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 8, borderRadius: 4, background: 'rgba(148,163,184,0.15)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(avg / 300) * 100}%`, borderRadius: 4, background: period === 'evening' ? '#f97316' : period === 'night' ? '#8b5cf6' : '#3b82f6' }} />
                        </div>
                      </div>
                      <div style={{ width: 80, textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{avg} 人</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 来源分布 */}
            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>客流来源分布</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {(Object.entries(SOURCE_LABELS) as [string, string][]).map(([key, label]) => {
                  const avg = traffic.reduce((s, t) => s + (t.sourceDistribution[key] ?? 0), 0) / traffic.length;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                      <div style={{ width: 100, fontSize: 13, color: '#e2e8f0' }}>{label}</div>
                      <div style={{ flex: 1 }}>
                        <Bar value={avg} max={50} color={SOURCE_COLORS[key] ?? '#6b7280'} height={8} label={`${avg.toFixed(1)}%`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 年龄分布 */}
            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>年龄分布</h3>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {['0-12', '13-18', '19-25', '26-35', '36-50', '50+'].map(age => {
                  const avg = traffic.reduce((s, t) => s + (t.ageDistribution[age] ?? 0), 0) / traffic.length;
                  const colors = ['#f97316', '#8b5cf6', '#3b82f6', '#22c55e', '#eab308', '#ef4444'];
                  const idx = ['0-12', '13-18', '19-25', '26-35', '36-50', '50+'].indexOf(age);
                  return (
                    <div key={age} style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: 'rgba(15,23,42,0.3)' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: colors[idx] ?? '#94a3b8' }}>{avg.toFixed(1)}%</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{age} 岁</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {reportTab === 'device' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均利用率</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: comprehensive.statistics.deviceUtilizationAvg > 70 ? '#22c55e' : '#eab308' }}>
                  {comprehensive.statistics.deviceUtilizationAvg}%
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>总收入/台</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  {formatMoney(deviceUtil.reduce((s, d) => s + d.revenueGenerated, 0) / deviceUtil.length)}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>总停机时间</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: deviceUtil.reduce((s, d) => s + d.downtimeMinutes, 0) > 1000 ? '#ef4444' : '#22c55e' }}>
                  {deviceUtil.reduce((s, d) => s + d.downtimeMinutes, 0)}min
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {deviceUtil.sort((a, b) => b.utilizationRate - a.utilizationRate).map(d => (
                <div key={d.deviceId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{d.deviceName}</span>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{d.deviceType}</span>
                    </div>
                    <Bar value={d.utilizationRate} max={100} color={d.utilizationRate > 80 ? '#22c55e' : d.utilizationRate > 60 ? '#3b82f6' : '#eab308'} height={8} label={`${d.utilizationRate}%`} />
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{formatMoney(d.revenueGenerated)}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>⭐{d.popularityScore}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {reportTab === 'member' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>会员总数</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>{memberAnalysis.totalMembers.toLocaleString()}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#22c55e' }}>活跃: {memberAnalysis.activeMembers.toLocaleString()}</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>月新增</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{memberAnalysis.newMembersThisMonth}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>流失率: {memberAnalysis.churnRate}%</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均LTV</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f97316' }}>{formatMoney(memberAnalysis.avgLTV)}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>充值: {formatMoney(memberAnalysis.avgRechargeAmount)}</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>月均到店</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{memberAnalysis.avgVisitsPerMonth}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>次/月</div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
              <section style={panelStyle}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>会员等级分布</h3>
                {Object.entries(memberAnalysis.tierDistribution).map(([tier, pct]) => (
                  <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                    <div style={{ width: 80, fontSize: 13, color: '#e2e8f0' }}>{tier}</div>
                    <div style={{ flex: 1 }}>
                      <Bar value={pct} max={50} color={['#6b7280', '#94a3b8', '#eab308', '#3b82f6', '#8b5cf6'][Object.keys(memberAnalysis.tierDistribution).indexOf(tier)]} height={8} label={`${pct}%`} />
                    </div>
                  </div>
                ))}
              </section>
              <section style={panelStyle}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>注册来源</h3>
                {Object.entries(memberAnalysis.signupSource).map(([src, pct]) => (
                  <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                    <div style={{ width: 80, fontSize: 13, color: '#e2e8f0' }}>{src}</div>
                    <div style={{ flex: 1 }}>
                      <Bar value={pct} max={50} color={['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#06b6d4'][Object.keys(memberAnalysis.signupSource).indexOf(src)]} height={8} label={`${pct}%`} />
                    </div>
                  </div>
                ))}
              </section>
            </div>

            <section style={panelStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>会员行为洞察</h3>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div style={statCardStyle}>
                  <div style={{ fontSize: 12, color: '#cbd5e1' }}>最活跃日</div>
                  <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700 }}>{memberAnalysis.mostActiveDay}</div>
                </div>
                <div style={statCardStyle}>
                  <div style={{ fontSize: 12, color: '#cbd5e1' }}>最活跃时段</div>
                  <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700 }}>{memberAnalysis.mostActiveHour}</div>
                </div>
                <div style={statCardStyle}>
                  <div style={{ fontSize: 12, color: '#cbd5e1' }}>最高等级</div>
                  <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: '#eab308' }}>{memberAnalysis.topTier}</div>
                </div>
                <div style={statCardStyle}>
                  <div style={{ fontSize: 12, color: '#cbd5e1' }}>营收贡献</div>
                  <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{memberAnalysis.memberRevenueRatio}%</div>
                </div>
              </div>
            </section>
          </>
        )}
      </PageShell>
    </main>
  );
}

function trendsColor(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return '#22c55e';
  if (trend === 'down') return '#ef4444';
  return '#94a3b8';
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
