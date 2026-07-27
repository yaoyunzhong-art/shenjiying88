'use client'

import { useMemo, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import type { CompetitorTrackSnapshot, CompetitorRecord, ScoreLevel } from './competitor-track-data'
import {
  SCORE_LABELS,
  TREND_LABEL,
  filterCompetitors,
  formatPrice,
} from './competitor-track-data'
import SnapshotRefreshCard from '../components/snapshot-refresh-card'

const TREND_COLOR: Record<CompetitorRecord['heatTrend'], string> = {
  up: '#22c55e',
  stable: '#94a3b8',
  down: '#ef4444',
}

const S: Record<string, CSSProperties> = {
  page: { padding: 32, maxWidth: 1200, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  refreshRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    padding: 14,
    borderRadius: 12,
    background: 'rgba(15, 23, 42, 0.35)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    color: '#cbd5e1',
    fontSize: 12,
  },
  statsRow: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  statCard: {
    flex: '1 1 140px',
    background: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.1)',
    padding: '16px 20px',
  },
  statLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: 700, color: '#e2e8f0' },
  statSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  toolBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  filterRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  searchInput: {
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 13,
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(30, 41, 59, 0.6)',
    color: '#e2e8f0',
    outline: 'none',
    width: 220,
  },
  select: {
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 13,
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(30, 41, 59, 0.6)',
    color: '#e2e8f0',
    outline: 'none',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  },
  td: {
    padding: '10px 12px',
    fontSize: 13,
    color: '#cbd5e1',
    borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
  },
  actionCell: {
    padding: '10px 12px',
    fontSize: 13,
    borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    display: 'flex',
    gap: 6,
  },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#64748b' },
  emptyIcon: { fontSize: 40, marginBottom: 12, opacity: 0.4 },
  emptyText: { fontSize: 14, color: '#64748b' },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    fontSize: 12,
    color: '#64748b',
  },
  pageBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'transparent',
    color: '#94a3b8',
  },
  pageBtnActive: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    border: '1px solid #3b82f6',
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa',
    fontWeight: 600,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#1e293b',
    borderRadius: 16,
    border: '1px solid rgba(148, 163, 184, 0.15)',
    padding: 28,
    width: 580,
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 20 },
  infoLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#e2e8f0', fontWeight: 500 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 8, marginTop: 16 },
  descriptionBox: {
    padding: 12,
    borderRadius: 8,
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(148, 163, 184, 0.08)',
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 1.6,
  },
}

const btnPrimary: CSSProperties = {
  padding: '6px 16px',
  borderRadius: 8,
  fontSize: 13,
  cursor: 'pointer',
  border: 'none',
  background: '#3b82f6',
  color: '#fff',
  fontWeight: 600,
}

const btnGhost: CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  fontSize: 12,
  cursor: 'pointer',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'transparent',
  color: '#94a3b8',
}

function scoreTagStyle(score: number): CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 600,
    color: score >= 4.0 ? '#22c55e' : score >= 3.0 ? '#f59e0b' : '#ef4444',
  }
}

function heatBarStyle(): CSSProperties {
  return {
    display: 'inline-block',
    width: 60,
    height: 6,
    borderRadius: 3,
    background: 'rgba(148, 163, 184, 0.15)',
    position: 'relative',
    overflow: 'hidden',
    verticalAlign: 'middle',
    marginRight: 6,
  }
}

function heatFillStyle(heat: number): CSSProperties {
  return {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 3,
    width: `${Math.min(100, heat)}%`,
    background:
      heat >= 80
        ? 'linear-gradient(90deg, #f97316, #ef4444)'
        : heat >= 50
          ? 'linear-gradient(90deg, #f59e0b, #f97316)'
          : 'linear-gradient(90deg, #64748b, #94a3b8)',
    transition: 'width 0.3s',
  }
}

const cityTagStyle: CSSProperties = {
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 6,
  background: 'rgba(148, 163, 184, 0.12)',
  color: '#94a3b8',
}

function CompetitorDetailModal({ competitor, onClose }: { competitor: CompetitorRecord; onClose: () => void }) {
  return (
    <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        extra={<>
          竞品样本: {snapshot.competitors.length}
        </>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        contextLabel="客户端快照上下文"
        loadingLabel="刷新中..."
        idleLabel="刷新快照"
      />

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
          <div style={{ ...S.statValue, color: '#22c55e' }}>{stats.highScore}</div>
          <div style={S.statSub}>评分 {'>='} 4.0</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: '#f97316' }}>{stats.highHeat}</div>
          <div style={S.statSub}>热度 {'>='} 80</div>
        </div>
      </div>

      <div style={S.toolBar}>
        <div style={S.filterRow}>
          <input
            style={S.searchInput}
            placeholder="搜索品牌名称/城市/品类..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              safeSetPage(1)
            }}
          />
          <select
            style={S.select}
            value={cityFilter}
            onChange={(event) => {
              setCityFilter(event.target.value)
              safeSetPage(1)
            }}
          >
            <option value="all">全部城市</option>
            {snapshot.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select
            style={S.select}
            value={scoreFilter}
            onChange={(event) => {
              setScoreFilter(event.target.value as ScoreLevel | 'all')
              safeSetPage(1)
            }}
          >
            <option value="all">全部评分</option>
            <option value="high">{SCORE_LABELS.high}</option>
            <option value="medium">{SCORE_LABELS.medium}</option>
            <option value="low">{SCORE_LABELS.low}</option>
          </select>
        </div>
      </div>

      {pagedCompetitors.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>检索为空</div>
          <div style={S.emptyText}>暂无匹配的竞品数据</div>
          <button style={{ ...btnGhost, marginTop: 12 }} onClick={resetFilter}>
            清除筛选
          </button>
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
            {pagedCompetitors.map((competitor) => (
              <tr key={competitor.id}>
                <td style={{ ...S.td, fontWeight: 500, color: '#e2e8f0' }}>{competitor.name}</td>
                <td style={S.td}>
                  <span style={cityTagStyle}>{competitor.city}</span>
                </td>
                <td style={S.td}>
                  <span style={scoreTagStyle(competitor.score)}>{competitor.score.toFixed(1)}</span>
                </td>
                <td style={{ ...S.td, fontSize: 12, color: '#94a3b8' }}>
                  {formatPrice(competitor.priceMin, competitor.priceMax)}
                </td>
                <td style={S.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={heatBarStyle()}>
                      <span style={heatFillStyle(competitor.douyinHeat)} />
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          competitor.douyinHeat >= 80
                            ? '#f97316'
                            : competitor.douyinHeat >= 50
                              ? '#f59e0b'
                              : '#94a3b8',
                        fontWeight: 500,
                      }}
                    >
                      {competitor.douyinHeat}
                    </span>
                  </div>
                </td>
                <td style={{ ...S.td, fontSize: 12, color: TREND_COLOR[competitor.heatTrend] }}>
                  {TREND_LABEL[competitor.heatTrend]}
                </td>
                <td style={S.actionCell}>
                  <button style={btnGhost} onClick={() => setDetailTarget(competitor)}>
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {filteredCompetitors.length > 0 ? (
        <div style={S.paginationRow}>
          <span>
            共 {filteredCompetitors.length} 条，第 {page}/{totalPages} 页
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={S.pageBtn} disabled={page <= 1} onClick={() => safeSetPage(page - 1)}>
              上一页
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                style={pageNumber === page ? S.pageBtnActive : S.pageBtn}
                onClick={() => safeSetPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            {totalPages > 5 ? <span style={{ color: '#64748b', padding: '4px 4px' }}>...</span> : null}
            {totalPages > 5 ? (
              <button
                style={page === totalPages ? S.pageBtnActive : S.pageBtn}
                onClick={() => safeSetPage(totalPages)}
              >
                {totalPages}
              </button>
            ) : null}
            <button style={S.pageBtn} disabled={page >= totalPages} onClick={() => safeSetPage(page + 1)}>
              下一页
            </button>
          </div>
        </div>
      ) : null}

      {detailTarget ? <CompetitorDetailModal competitor={detailTarget} onClose={() => setDetailTarget(null)} /> : null}
    </div>
  )
}
