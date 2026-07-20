'use client';

/**
 * competitor-track/page.tsx — 竞品跟踪看板
 *
 * 功能:
 *  - 竞品列表（名称/城市/评分/价格区间/抖音热度）
 *  - 筛选（按城市/评分范围）
 *  - 详情弹窗（品牌介绍/图文/门店分布/热度趋势）
 *  - 统计卡片（总竞品/跟踪城市/高评分/抖音高热）
 *  - 加载态/空态/错误态
 */

import React, { useState, useMemo, useCallback } from 'react';

// ============================================================
// 类型定义
// ============================================================

type ScoreLevel = 'high' | 'medium' | 'low';

interface CompetitorRecord {
  id: string;
  name: string;
  city: string;
  score: number;
  priceMin: number;
  priceMax: number;
  douyinHeat: number; // 抖音热度指数 0-100
  category: string;
  description: string;
  brandIntro: string;
  storeCount: number;
  mainDistricts: string[];
  heatTrend: 'up' | 'stable' | 'down';
  createdAt: string;
}

// ============================================================
// 常量映射
// ============================================================

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '长沙'];

const SCORE_LABELS: Record<ScoreLevel, string> = {
  high: '高 (≥ 4.0)',
  medium: '中 (3.0-3.9)',
  low: '低 (< 3.0)',
};

const HEAT_LABEL = (h: number): string =>
  h >= 80 ? '🔥 高热' : h >= 50 ? '🔥 中热' : '❄️ 低热';

const TREND_LABEL: Record<string, string> = {
  up: '📈 上升',
  stable: '➡️ 平稳',
  down: '📉 下降',
};

const TREND_COLOR: Record<string, string> = {
  up: '#22c55e',
  stable: '#94a3b8',
  down: '#ef4444',
};

// ============================================================
// 种子数据（10条竞品）
// ============================================================

const DEFAULT_COMPETITORS: CompetitorRecord[] = [
  { id: 'cp-001', name: '瑞幸咖啡', city: '北京', score: 4.3, priceMin: 9, priceMax: 35, douyinHeat: 92, category: '咖啡茶饮', description: '国内领先咖啡连锁，覆盖度高', brandIntro: '瑞幸咖啡是中国门店数最多的咖啡品牌，以"专业咖啡新鲜式"为理念，主打高性价比现磨咖啡。', storeCount: 15000, mainDistricts: ['朝阳区', '海淀区', '东城区'], heatTrend: 'up', createdAt: '2024-01-15' },
  { id: 'cp-002', name: '星巴克', city: '北京', score: 4.1, priceMin: 30, priceMax: 60, douyinHeat: 85, category: '咖啡茶饮', description: '全球咖啡巨头，品牌力强', brandIntro: '星巴克咖啡公司成立于1971年，全球最大的咖啡连锁品牌，致力于为消费者提供优质的咖啡体验。', storeCount: 7000, mainDistricts: ['朝阳区', '海淀区', '西城区'], heatTrend: 'stable', createdAt: '2024-01-10' },
  { id: 'cp-003', name: 'Manner Coffee', city: '上海', score: 4.5, priceMin: 15, priceMax: 30, douyinHeat: 78, category: '咖啡茶饮', description: '精品咖啡连锁，性价比高', brandIntro: 'Manner Coffee 创立于2015年，以"让咖啡成为生活的一部分"为使命，主打精品平价咖啡。', storeCount: 1200, mainDistricts: ['浦东新区', '静安区', '徐汇区'], heatTrend: 'up', createdAt: '2024-02-20' },
  { id: 'cp-004', name: '霸王茶姬', city: '广州', score: 4.2, priceMin: 18, priceMax: 35, douyinHeat: 90, category: '咖啡茶饮', description: '国风茶饮，年轻化品牌', brandIntro: '霸王茶姬是新中式国风茶饮品牌，以东方美学和现代茶饮创新为核心竞争力。', storeCount: 4500, mainDistricts: ['天河区', '越秀区', '荔湾区'], heatTrend: 'up', createdAt: '2024-03-05' },
  { id: 'cp-005', name: '蜜雪冰城', city: '郑州', score: 3.8, priceMin: 3, priceMax: 12, douyinHeat: 95, category: '咖啡茶饮', description: '平价茶饮之王，下沉市场霸主', brandIntro: '蜜雪冰城创立于1997年，以高性价比冰淇淋和茶饮闻名，门店遍布全国各线城市。', storeCount: 36000, mainDistricts: ['金水区', '二七区', '中原区'], heatTrend: 'up', createdAt: '2024-01-08' },
  { id: 'cp-006', name: '喜茶', city: '深圳', score: 4.4, priceMin: 20, priceMax: 45, douyinHeat: 82, category: '咖啡茶饮', description: '新茶饮头部品牌，创新引领者', brandIntro: '喜茶是高端新茶饮品牌代表，以"灵感之茶"为品牌理念，持续推出市场爆款。', storeCount: 3500, mainDistricts: ['南山区', '福田区', '宝安区'], heatTrend: 'stable', createdAt: '2024-02-14' },
  { id: 'cp-007', name: '奈雪的茶', city: '深圳', score: 4.0, priceMin: 22, priceMax: 48, douyinHeat: 70, category: '咖啡茶饮', description: '茶饮+烘焙复合业态', brandIntro: '奈雪的茶创立于2015年，定位高端茶饮品牌，开创"茶饮+烘焙"复合业态模式。', storeCount: 1800, mainDistricts: ['南山区', '福田区', '罗湖区'], heatTrend: 'down', createdAt: '2024-02-18' },
  { id: 'cp-008', name: '幸运咖', city: '成都', score: 3.9, priceMin: 5, priceMax: 18, douyinHeat: 65, category: '咖啡茶饮', description: '平价咖啡新势力，下沉市场扩张', brandIntro: '幸运咖是蜜雪冰城旗下咖啡品牌，主打极致性价比咖啡，目标下沉市场年轻消费者。', storeCount: 2800, mainDistricts: ['锦江区', '青羊区', '武侯区'], heatTrend: 'up', createdAt: '2024-04-01' },
  { id: 'cp-009', name: '一点点', city: '杭州', score: 3.5, priceMin: 10, priceMax: 22, douyinHeat: 55, category: '咖啡茶饮', description: '传统奶茶品牌，经典口味', brandIntro: '一点点是台湾50岚在内地的品牌授权，以经典奶茶和波霸系列产品受到消费者欢迎。', storeCount: 4000, mainDistricts: ['西湖区', '上城区', '拱墅区'], heatTrend: 'down', createdAt: '2024-01-20' },
  { id: 'cp-010', name: '库迪咖啡', city: '武汉', score: 3.7, priceMin: 8, priceMax: 25, douyinHeat: 88, category: '咖啡茶饮', description: '快速扩张的咖啡新生力量', brandIntro: '库迪咖啡由瑞幸咖啡原核心团队创立，以"全时段咖啡"理念快速扩张，主打高性价比。', storeCount: 8000, mainDistricts: ['武昌区', '洪山区', '江汉区'], heatTrend: 'up', createdAt: '2024-05-10' },
];

// ============================================================
// 样式
// ============================================================

const S: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 1200, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' as const },
  statCard: {
    flex: '1 1 140px', background: 'rgba(30,41,59,0.8)', borderRadius: 12,
    border: '1px solid rgba(148,163,184,0.1)', padding: '16px 20px',
  },
  statLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: 700, color: '#e2e8f0' },
  statSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  toolBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 12 },
  filterRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const },
  searchInput: {
    padding: '6px 12px', borderRadius: 8, fontSize: 13,
    border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(30,41,59,0.6)',
    color: '#e2e8f0', outline: 'none', width: 220,
  },
  select: {
    padding: '6px 12px', borderRadius: 8, fontSize: 13,
    border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(30,41,59,0.6)',
    color: '#e2e8f0', outline: 'none',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600,
    color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.1)',
  },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148,163,184,0.06)' },
  actionCell: { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid rgba(148,163,184,0.06)', display: 'flex', gap: 6 },
  modalOverlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#1e293b', borderRadius: 16, border: '1px solid rgba(148,163,184,0.15)',
    padding: 28, width: 580, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' as const,
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 20 },
  infoLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#e2e8f0', fontWeight: 500 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 8, marginTop: 16 },
  descriptionBox: {
    padding: 12, borderRadius: 8, background: 'rgba(15,23,42,0.5)',
    border: '1px solid rgba(148,163,184,0.08)', fontSize: 13, color: '#cbd5e1', lineHeight: 1.6,
  },
  emptyState: { textAlign: 'center' as const, padding: '60px 20px', color: '#64748b' },
  emptyIcon: { fontSize: 40, marginBottom: 12, opacity: 0.4 },
  emptyText: { fontSize: 14, color: '#64748b' },
  paginationRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 12, color: '#64748b' },
  pageBtn: {
    padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
    border: '1px solid rgba(148,163,184,0.2)', background: 'transparent', color: '#94a3b8',
  },
  pageBtnActive: {
    padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
    border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontWeight: 600,
  },
  loadingCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '80px 20px', flexDirection: 'column' as const, gap: 16,
  },
  errorCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '80px 20px', flexDirection: 'column' as const, gap: 16,
  },
};

const btnPrimary: React.CSSProperties = {
  padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
  border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600,
};
const btnGhost: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
  border: '1px solid rgba(148,163,184,0.2)', background: 'transparent', color: '#94a3b8',
};

const scoreTagStyle = (s: number): React.CSSProperties => ({
  fontSize: 13, fontWeight: 600,
  color: s >= 4.0 ? '#22c55e' : s >= 3.0 ? '#f59e0b' : '#ef4444',
});

const heatBarStyle = (h: number): React.CSSProperties => ({
  display: 'inline-block', width: 60, height: 6, borderRadius: 3,
  background: 'rgba(148,163,184,0.15)',
  position: 'relative' as const, overflow: 'hidden' as const, verticalAlign: 'middle', marginRight: 6,
});

const heatFillStyle = (h: number): React.CSSProperties => ({
  position: 'absolute' as const, left: 0, top: 0, height: '100%', borderRadius: 3,
  width: `${Math.min(100, h)}%`,
  background: h >= 80 ? 'linear-gradient(90deg, #f97316, #ef4444)' : h >= 50 ? 'linear-gradient(90deg, #f59e0b, #f97316)' : 'linear-gradient(90deg, #64748b, #94a3b8)',
  transition: 'width 0.3s',
});

const cityTagStyle: React.CSSProperties = {
  fontSize: 11, padding: '2px 8px', borderRadius: 6,
  background: 'rgba(148,163,184,0.12)', color: '#94a3b8',
};

// ============================================================
// 辅助函数
// ============================================================

function formatPrice(min: number, max: number): string {
  return `¥${min} ~ ¥${max}`;
}

function getScoreLevel(score: number): ScoreLevel {
  if (score >= 4.0) return 'high';
  if (score >= 3.0) return 'medium';
  return 'low';
}

function filterCompetitors(
  items: CompetitorRecord[],
  search: string,
  cityFilter: string,
  scoreFilter: ScoreLevel | 'all',
): CompetitorRecord[] {
  let result = items;
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  }
  if (cityFilter !== 'all') {
    result = result.filter(c => c.city === cityFilter);
  }
  if (scoreFilter !== 'all') {
    result = result.filter(c => getScoreLevel(c.score) === scoreFilter);
  }
  return result;
}

// ============================================================
// 子组件 — 详情弹窗
// ============================================================

function CompetitorDetailModal({
  competitor,
  onClose,
}: {
  competitor: CompetitorRecord;
  onClose: () => void;
}) {
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={S.modalTitle}>{competitor.name}</div>
            <div style={S.modalSubtitle}>{competitor.description}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(148,163,184,0.1)', border: 'none', borderRadius: 6,
              color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* 基本信息网格 */}
        <div style={S.infoGrid}>
          <div>
            <div style={S.infoLabel}>所属城市</div>
            <div style={S.infoValue}>{competitor.city}</div>
          </div>
          <div>
            <div style={S.infoLabel}>品类</div>
            <div style={S.infoValue}>{competitor.category}</div>
          </div>
          <div>
            <div style={S.infoLabel}>综合评分</div>
            <div style={{ ...S.infoValue, color: scoreTagStyle(competitor.score).color }}>{competitor.score.toFixed(1)}</div>
          </div>
          <div>
            <div style={S.infoLabel}>价格区间</div>
            <div style={S.infoValue}>{formatPrice(competitor.priceMin, competitor.priceMax)}</div>
          </div>
          <div>
            <div style={S.infoLabel}>抖音热度</div>
            <div style={S.infoValue}>
              <span style={heatBarStyle(competitor.douyinHeat)}>
                <span style={heatFillStyle(competitor.douyinHeat)} />
              </span>
              {competitor.douyinHeat}
            </div>
          </div>
          <div>
            <div style={S.infoLabel}>热度趋势</div>
            <div style={{ ...S.infoValue, color: TREND_COLOR[competitor.heatTrend] }}>{TREND_LABEL[competitor.heatTrend]}</div>
          </div>
          <div>
            <div style={S.infoLabel}>门店总数</div>
            <div style={S.infoValue}>{competitor.storeCount.toLocaleString()} 家</div>
          </div>
          <div>
            <div style={S.infoLabel}>主要区域</div>
            <div style={S.infoValue}>{competitor.mainDistricts.join(' / ')}</div>
          </div>
        </div>

        {/* 品牌介绍 */}
        <div style={S.sectionTitle}>🏢 品牌介绍</div>
        <div style={S.descriptionBox}>{competitor.brandIntro}</div>
      </div>
    </div>
  );
}

// ============================================================
// 主页面组件
// ============================================================

export default function CompetitorTrackPage() {
  const [competitors] = useState<CompetitorRecord[]>(DEFAULT_COMPETITORS);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState<ScoreLevel | 'all'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // 三态
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  // 详情弹窗
  const [detailTarget, setDetailTarget] = useState<CompetitorRecord | null>(null);

  // ---- 派生 ----
  const stats = useMemo(() => ({
    total: competitors.length,
    cities: new Set(competitors.map(c => c.city)).size,
    highScore: competitors.filter(c => c.score >= 4.0).length,
    highHeat: competitors.filter(c => c.douyinHeat >= 80).length,
  }), [competitors]);

  const filteredCompetitors = useMemo(
    () => filterCompetitors(competitors, search, cityFilter, scoreFilter),
    [competitors, search, cityFilter, scoreFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filteredCompetitors.length / pageSize));
  const pagedCompetitors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCompetitors.slice(start, start + pageSize);
  }, [filteredCompetitors, page, pageSize]);

  const safeSetPage = useCallback((p: number) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages]);

  const resetFilter = useCallback(() => {
    setSearch('');
    setCityFilter('all');
    setScoreFilter('all');
    safeSetPage(1);
  }, [safeSetPage]);

  // ---- 加载态 ----
  if (loading) {
    return (
      <div style={{ ...S.page, ...S.loadingCard }}>
        <div style={{ fontSize: 40, opacity: 0.4 }}>🔄</div>
        <div style={{ fontSize: 14, color: '#94a3b8' }}>正在加载竞品数据...</div>
      </div>
    );
  }

  // ---- 错误态 ----
  if (error) {
    return (
      <div style={{ ...S.page, ...S.errorCard }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ fontSize: 16, color: '#ef4444', fontWeight: 600 }}>加载失败</div>
        <div style={{ fontSize: 14, color: '#f87171' }}>{error}</div>
        <button style={btnPrimary} onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <h1 style={S.title}>🔍 竞品跟踪</h1>
      <p style={S.subtitle}>品牌竞品监控看板，覆盖评分、价格区间、抖音热度等维度，辅助市场决策。</p>

      {/* 统计卡片 */}
      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={S.statLabel}>跟踪竞品</div>
          <div style={S.statValue}>{stats.total}</div>
          <div style={S.statSub}>个品牌</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>覆盖城市</div>
          <div style={S.statValue}>{stats.cities}</div>
          <div style={S.statSub}>个城市</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>高评分</div>
          <div style={{ ...S.statValue, color: '#22c55e' }}>{stats.highScore}</div>
          <div style={S.statSub}>评分 ≥ 4.0</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>抖音高热</div>
          <div style={{ ...S.statValue, color: '#f97316' }}>{stats.highHeat}</div>
          <div style={S.statSub}>热度 ≥ 80</div>
        </div>
      </div>

      {/* 工具栏 */}
      <div style={S.toolBar}>
        <div style={S.filterRow}>
          <input
            style={S.searchInput}
            placeholder="🔍 搜索品牌名称/城市/品类..."
            value={search}
            onChange={e => { setSearch(e.target.value); safeSetPage(1); }}
          />
          <select
            style={S.select}
            value={cityFilter}
            onChange={e => { setCityFilter(e.target.value); safeSetPage(1); }}
          >
            <option value="all">全部城市</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            style={S.select}
            value={scoreFilter}
            onChange={e => { setScoreFilter(e.target.value as ScoreLevel | 'all'); safeSetPage(1); }}
          >
            <option value="all">全部评分</option>
            <option value="high">{SCORE_LABELS.high}</option>
            <option value="medium">{SCORE_LABELS.medium}</option>
            <option value="low">{SCORE_LABELS.low}</option>
          </select>
        </div>
      </div>

      {/* 竞品列表 */}
      {pagedCompetitors.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>🔍</div>
          <div style={S.emptyText}>暂无匹配的竞品数据</div>
          <button style={{ ...btnGhost, marginTop: 12 }} onClick={resetFilter}>清除筛选</button>
        </div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>品牌名称</th>
              <th style={S.th}>城市</th>
              <th style={S.th}>综合评分</th>
              <th style={S.th}>价格区间</th>
              <th style={S.th}>抖音热度</th>
              <th style={S.th}>趋势</th>
              <th style={S.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedCompetitors.map(c => (
              <tr key={c.id}>
                <td style={{ ...S.td, fontWeight: 500, color: '#e2e8f0' }}>{c.name}</td>
                <td style={S.td}><span style={cityTagStyle}>{c.city}</span></td>
                <td style={S.td}><span style={scoreTagStyle(c.score)}>{c.score.toFixed(1)}</span></td>
                <td style={{ ...S.td, fontSize: 12, color: '#94a3b8' }}>{formatPrice(c.priceMin, c.priceMax)}</td>
                <td style={S.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={heatBarStyle(c.douyinHeat)}>
                      <span style={heatFillStyle(c.douyinHeat)} />
                    </span>
                    <span style={{ fontSize: 12, color: c.douyinHeat >= 80 ? '#f97316' : c.douyinHeat >= 50 ? '#f59e0b' : '#94a3b8', fontWeight: 500 }}>
                      {c.douyinHeat}
                    </span>
                  </div>
                </td>
                <td style={{ ...S.td, fontSize: 12, color: TREND_COLOR[c.heatTrend] }}>{TREND_LABEL[c.heatTrend]}</td>
                <td style={S.actionCell}>
                  <button style={btnGhost} onClick={() => setDetailTarget(c)}>查看详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 分页 */}
      {filteredCompetitors.length > 0 && (
        <div style={S.paginationRow}>
          <span>共 {filteredCompetitors.length} 条，第 {page}/{totalPages} 页</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={S.pageBtn} disabled={page <= 1} onClick={() => safeSetPage(page - 1)}>上一页</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} style={p === page ? S.pageBtnActive : S.pageBtn} onClick={() => safeSetPage(p)}>{p}</button>
            ))}
            {totalPages > 5 && <span style={{ color: '#64748b', padding: '4px 4px' }}>...</span>}
            {totalPages > 5 && (
              <button style={page === totalPages ? S.pageBtnActive : S.pageBtn} onClick={() => safeSetPage(totalPages)}>{totalPages}</button>
            )}
            <button style={S.pageBtn} disabled={page >= totalPages} onClick={() => safeSetPage(page + 1)}>下一页</button>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {detailTarget && (
        <CompetitorDetailModal
          competitor={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// 导出（供测试使用）
// ============================================================

export type { CompetitorRecord, ScoreLevel };

export {
  DEFAULT_COMPETITORS,
  CITIES,
  SCORE_LABELS,
  filterCompetitors,
  getScoreLevel,
  formatPrice,
  HEAT_LABEL,
  TREND_LABEL,
};
