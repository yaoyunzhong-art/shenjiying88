'use client';

import React, { useMemo, useState } from 'react';

import {
  AISummaryCard,
  AISuggestionCard,
  Rating,
  Card,
  PageShell,
  Pagination,
  SearchFilterInput,
  usePagination,
  Tag,
  EmptyState,
  type AISummaryCardProps,
  type SuggestionItem,
  type SuggestionPriority,
  type TagVariant,
} from '@m5/ui';

// ============================================================
//  智能推荐 — AI 产品推荐列表页
//  功能: 基于 AI 的商品推荐、搜索过滤、分页
//  类型: B-列表页 (含搜索/过滤/分页)
// ============================================================

// ---------- Mock 数据 ----------

interface AIRecommendation {
  id: string;
  productName: string;
  category: string;
  predictedScore: number;
  matchReason: string;
  confidence: number;
  tags: string[];
  price: string;
  status: 'recommended' | 'applied' | 'dismissed';
}

const RECOMMENDATIONS: AIRecommendation[] = [
  { id: 'r1', productName: '精品阿拉比卡咖啡豆 500g', category: '咖啡', predictedScore: 96, matchReason: '与会员偏好高度匹配 · 历史回购率 78%', confidence: 0.92, tags: ['畅销品', '高毛利'], price: '¥128', status: 'recommended' },
  { id: 'r2', productName: '手冲咖啡套装（含滤杯）', category: '器具', predictedScore: 91, matchReason: '浏览未购买 · 停留时间超过 2 分钟', confidence: 0.85, tags: ['新品', '组合'], price: '¥299', status: 'recommended' },
  { id: 'r3', productName: '冷萃咖啡液 10 枚装', category: '咖啡', predictedScore: 88, matchReason: '夏季热销品类 · 同店复购率高', confidence: 0.81, tags: ['季节性'], price: '¥68', status: 'recommended' },
  { id: 'r4', productName: '咖啡杯 350ml 陶瓷', category: '器具', predictedScore: 85, matchReason: '搭配购买推荐 · 与咖啡豆关联度高', confidence: 0.78, tags: ['搭配'], price: '¥89', status: 'recommended' },
  { id: 'r5', productName: '挂耳咖啡混合装 20 包', category: '咖啡', predictedScore: 82, matchReason: '新客入门款 · 低客单价易转化', confidence: 0.74, tags: ['引流品'], price: '¥45', status: 'recommended' },
  { id: 'r6', productName: '咖啡机专用除垢剂', category: '配件', predictedScore: 79, matchReason: '已购咖啡机客户的推荐配件', confidence: 0.71, tags: ['配件'], price: '¥39', status: 'applied' },
  { id: 'r7', productName: '燕麦奶植物饮料 1L', category: '饮品', predictedScore: 76, matchReason: '与咖啡搭配率 65% · 健康趋势', confidence: 0.68, tags: ['健康'], price: '¥22', status: 'dismissed' },
  { id: 'r8', productName: '咖啡知识入门书籍', category: '图书', predictedScore: 73, matchReason: '会员画像显示对咖啡文化感兴趣', confidence: 0.65, tags: ['教育'], price: '¥58', status: 'recommended' },
  { id: 'r9', productName: '便携式咖啡研磨机', category: '器具', predictedScore: 71, matchReason: '户外场景推荐 · 露营趋势', confidence: 0.63, tags: ['户外'], price: '¥189', status: 'recommended' },
  { id: 'r10', productName: '订阅制咖啡礼盒月卡', category: '订阅', predictedScore: 68, matchReason: '提升 LTV · 按月自动配送', confidence: 0.60, tags: ['订阅', 'LTV'], price: '¥199/月', status: 'recommended' },
  { id: 'r11', productName: '有机公平贸易咖啡豆', category: '咖啡', predictedScore: 64, matchReason: '可持续消费趋势 · 品牌调性契合', confidence: 0.58, tags: ['有机', '高端'], price: '¥168', status: 'recommended' },
  { id: 'r12', productName: '咖啡拉花练习工具套装', category: '器具', predictedScore: 61, matchReason: '升级推荐 · 已购基础器具会员', confidence: 0.55, tags: ['进阶'], price: '¥139', status: 'recommended' },
];

const CATEGORIES = [...new Set(RECOMMENDATIONS.map((r) => r.category))];

const STATUS_LABELS: Record<string, string> = {
  recommended: '待处理',
  applied: '已采纳',
  dismissed: '已忽略',
};

const STATUS_COLORS: Record<string, TagVariant> = {
  recommended: 'info',
  applied: 'success',
  dismissed: 'default',
};

// ============================================================
//  页面组件
// ============================================================

export default function RecommendationsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // 过滤
  const filtered = useMemo(() => {
    let items = RECOMMENDATIONS;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          r.productName.toLowerCase().includes(q) ||
          r.matchReason.toLowerCase().includes(q),
      );
    }
    if (categoryFilter) {
      items = items.filter((r) => r.category === categoryFilter);
    }
    if (statusFilter) {
      items = items.filter((r) => r.status === statusFilter);
    }
    return items;
  }, [search, categoryFilter, statusFilter]);

  // 分页
  const PAGE_SIZE = 6;
  const { page, setPage, totalPages, paginate } = usePagination(filtered.length, PAGE_SIZE);
  const pageItems = paginate(filtered);

  // 统计
  const summaryMetrics = useMemo((): AISummaryCardProps['metrics'] => {
    const active = RECOMMENDATIONS.filter((r) => r.status === 'recommended').length;
    const adopted = RECOMMENDATIONS.filter((r) => r.status === 'applied').length;
    const avgScore = Math.round(RECOMMENDATIONS.reduce((s, r) => s + r.predictedScore, 0) / RECOMMENDATIONS.length);
    return [
      { label: '待处理推荐', value: active, trend: 'up' },
      { label: '已采纳', value: adopted, trend: 'flat' },
      { label: '平均推荐分', value: `${avgScore}`, trend: 'up' },
      { label: '推荐转化率', value: `${Math.round((adopted / RECOMMENDATIONS.length) * 100)}%`, trend: 'flat' },
    ];
  }, []);

  return (
    <PageShell
      title="🤖 智能推荐"
      subtitle="AI 驱动的商品推荐 — 基于会员画像与行为分析"
    >
      {/* AI 总结卡片 */}
      <AISummaryCard
        title="今日推荐概览"
        summary={`基于 ${RECOMMENDATIONS.length} 项 AI 分析，当前有 ${RECOMMENDATIONS.filter((r) => r.status === 'recommended').length} 条推荐待处理，预计可提升客单价 12-18%`}
        metrics={summaryMetrics}
        insights={[
          { type: 'positive', text: `推荐采纳率 ${Math.round((RECOMMENDATIONS.filter((r) => r.status === 'applied').length / RECOMMENDATIONS.length) * 100)}%，高于行业平均` },
        ]}
      />

      {/* 筛选栏 */}
      <div style={styles.filterRow}>
        <div style={styles.searchWrapper}>
          <SearchFilterInput
            placeholder="搜索商品名称或推荐理由..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <div style={styles.filterGroup}>
          <select
            style={styles.select}
            value={categoryFilter ?? ''}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
          >
            <option value="">全部分类</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            style={styles.select}
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
          >
            <option value="">全部状态</option>
            <option value="recommended">待处理</option>
            <option value="applied">已采纳</option>
            <option value="dismissed">已忽略</option>
          </select>
        </div>
      </div>

      {/* 推荐列表 */}
      {pageItems.length === 0 ? (
        <EmptyState
          title="暂无匹配推荐"
          description="尝试调整搜索条件或筛选范围"
        />
      ) : (
        <div style={styles.grid}>
          {pageItems.map((rec) => (
            <Card key={rec.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitleRow}>
                  <h3 style={styles.cardTitle}>{rec.productName}</h3>
                  <Tag variant={STATUS_COLORS[rec.status] as any}>
                    {STATUS_LABELS[rec.status]}
                  </Tag>
                </div>
                <span style={styles.price}>{rec.price}</span>
              </div>

              <div style={styles.matchScore}>
                <span style={styles.scoreLabel}>匹配度</span>
                <Rating value={Math.round(rec.predictedScore / 20)} max={5} />
                <span style={styles.scoreValue}>{rec.predictedScore}%</span>
              </div>

              <p style={styles.reason}>{rec.matchReason}</p>

              <div style={styles.tagRow}>
                {rec.tags.map((t) => (
                  <Tag key={t} variant="default" size="sm">{t}</Tag>
                ))}
              </div>

              <div style={styles.confidenceBar}>
                <div style={styles.confidenceLabel}>
                  <span>置信度</span>
                  <span>{Math.round(rec.confidence * 100)}%</span>
                </div>
                <div style={styles.barTrack}>
                  <div
                    style={{
                      ...styles.barFill,
                      width: `${Math.round(rec.confidence * 100)}%`,
                      backgroundColor:
                        rec.confidence > 0.8 ? '#4ade80' : rec.confidence > 0.6 ? '#facc15' : '#f87171',
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          total={filtered.length}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </PageShell>
  );
}

// ============================================================
//  Styles
// ============================================================

const styles: Record<string, React.CSSProperties> = {
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  searchWrapper: {
    flex: 1,
    minWidth: 260,
  },
  filterGroup: {
    display: 'flex',
    gap: 12,
  },
  select: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    backgroundColor: '#fff',
    cursor: 'pointer',
    minWidth: 120,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 20,
    marginBottom: 24,
  },
  card: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  price: {
    fontSize: 16,
    fontWeight: 700,
    color: '#059669',
    whiteSpace: 'nowrap',
    marginLeft: 12,
  },
  matchScore: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1f2937',
    marginLeft: 'auto',
  },
  reason: {
    margin: 0,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  confidenceBar: {
    marginTop: 'auto',
  },
  confidenceLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  barTrack: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
};
