'use client';

import React, { useState, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PrizeCategory = 'toy' | 'plush' | 'figure' | 'card' | 'snack' | 'other';

export interface PrizeItem {
  id: string;
  name: string;
  /** 所需积分/票数 */
  points: number;
  /** 库存数量 */
  stock: number;
  /** 图片 URL */
  imageUrl?: string;
  category: PrizeCategory;
  /** 是否热门推荐 */
  popular?: boolean;
}

export interface RedemptionRecord {
  prizeId: string;
  prizeName: string;
  points: number;
  quantity: number;
  timestamp: string;
}

export interface PrizeRedemptionCounterProps {
  /** 当前可用积分/票数 */
  availablePoints: number;
  /** 奖品列表 */
  prizes: PrizeItem[];
  /** 已选奖品列表（受控） */
  selected: Map<string, number>;
  /** 选择变更回调 */
  onSelectionChange: (selected: Map<string, number>) => void;
  /** 兑换确认回调 */
  onRedeem: (records: RedemptionRecord[]) => void;
  /** 搜索关键词 */
  searchKeyword?: string;
  /** 分类筛选 */
  categoryFilter?: PrizeCategory | 'ALL';
  /** 是否正在兑换处理中 */
  isProcessing?: boolean;
  /** 自定义空状态文案 */
  emptyText?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<PrizeCategory, string> = {
  toy: '玩具',
  plush: '毛绒公仔',
  figure: '手办模型',
  card: '卡牌',
  snack: '零食',
  other: '其他',
};

const CATEGORY_ICONS: Record<PrizeCategory, string> = {
  toy: '🧸',
  plush: '🐻',
  figure: '🎎',
  card: '🃏',
  snack: '🍿',
  other: '🎁',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPoints(n: number): string {
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PrizeCardProps {
  prize: PrizeItem;
  selectedQty: number;
  availablePoints: number;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

function PrizeCard({ prize, selectedQty, availablePoints, onAdd, onRemove }: PrizeCardProps): React.ReactElement {
  const canAfford = prize.points <= availablePoints;
  const disabled = !canAfford || prize.stock <= 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 10,
        background: prize.popular ? 'rgba(251,191,36,0.08)' : 'rgba(30,41,59,0.6)',
        border: `1px solid ${prize.popular ? 'rgba(251,191,36,0.25)' : 'rgba(148,163,184,0.15)'}`,
        transition: 'border 0.2s',
      }}
    >
      {/* 图标占位 */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          background: 'rgba(148,163,184,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        {prize.imageUrl ? (
          <img src={prize.imageUrl} alt={prize.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
        ) : (
          CATEGORY_ICONS[prize.category]
        )}
      </div>

      {/* 信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{prize.name}</span>
          {prize.popular && (
            <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>
              热门
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
          <span>{formatPoints(prize.points)} 积分</span>
          <span>库存: {prize.stock}</span>
          <span>{CATEGORY_LABELS[prize.category]}</span>
        </div>
      </div>

      {/* 数量控制 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => onRemove(prize.id)}
          disabled={selectedQty <= 0}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'rgba(15,23,42,0.5)',
            color: selectedQty > 0 ? '#e2e8f0' : '#475569',
            cursor: selectedQty > 0 ? 'pointer' : 'not-allowed',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          −
        </button>
        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600, color: '#e2e8f0' }}>
          {selectedQty}
        </span>
        <button
          onClick={() => onAdd(prize.id)}
          disabled={disabled || (selectedQty >= prize.stock)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '1px solid rgba(99,102,241,0.4)',
            background: 'rgba(99,102,241,0.15)',
            color: disabled || selectedQty >= prize.stock ? '#475569' : '#818cf8',
            cursor: disabled || selectedQty >= prize.stock ? 'not-allowed' : 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PrizeRedemptionCounter({
  availablePoints,
  prizes,
  selected,
  onSelectionChange,
  onRedeem,
  searchKeyword = '',
  categoryFilter = 'ALL',
  isProcessing = false,
  emptyText = '暂无可用奖品',
}: PrizeRedemptionCounterProps): React.ReactElement {
  const [search, setSearch] = useState(searchKeyword);
  const [category, setCategory] = useState<PrizeCategory | 'ALL'>(categoryFilter);

  // Filter prizes
  const filteredPrizes = useMemo(() => {
    let list = prizes;
    if (category !== 'ALL') {
      list = list.filter((p) => p.category === category);
    }
    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(kw));
    }
    return list;
  }, [prizes, category, search]);

  // Compute total points selected
  const totalSelectedPoints = useMemo(() => {
    let sum = 0;
    for (const [id, qty] of selected.entries()) {
      const prize = prizes.find((p) => p.id === id);
      if (prize) sum += prize.points * qty;
    }
    return sum;
  }, [selected, prizes]);

  const remaining = availablePoints - totalSelectedPoints;
  const canRedeem = totalSelectedPoints > 0 && remaining >= 0 && !isProcessing;

  // Handlers
  const handleAdd = useCallback(
    (id: string) => {
      const next = new Map(selected);
      next.set(id, (next.get(id) || 0) + 1);
      onSelectionChange(next);
    },
    [selected, onSelectionChange],
  );

  const handleRemove = useCallback(
    (id: string) => {
      const next = new Map(selected);
      const cur = next.get(id) || 0;
      if (cur <= 1) {
        next.delete(id);
      } else {
        next.set(id, cur - 1);
      }
      onSelectionChange(next);
    },
    [selected, onSelectionChange],
  );

  const handleRedeem = useCallback(() => {
    const records: RedemptionRecord[] = [];
    for (const [id, qty] of selected.entries()) {
      const prize = prizes.find((p) => p.id === id);
      if (prize && qty > 0) {
        records.push({
          prizeId: id,
          prizeName: prize.name,
          points: prize.points,
          quantity: qty,
          timestamp: new Date().toISOString(),
        });
      }
    }
    if (records.length > 0) {
      onRedeem(records);
    }
  }, [selected, prizes, onRedeem]);

  // Categories for filter bar
  const categories: Array<{ key: PrizeCategory | 'ALL'; label: string }> = [
    { key: 'ALL', label: '全部' },
    ...(['toy', 'plush', 'figure', 'card', 'snack', 'other'] as PrizeCategory[]).map((k) => ({
      key: k,
      label: CATEGORY_LABELS[k],
    })),
  ];

  return (
    <div
      role="region"
      aria-label="积分兑换奖品"
      style={{
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.2)',
        background: 'rgba(15,23,42,0.4)',
        overflow: 'hidden',
      }}
    >
      {/* ===== Header ===== */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(148,163,184,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
            🎁 积分兑换
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            可用积分: <strong style={{ color: '#fbbf24' }}>{formatPoints(availablePoints)}</strong>
            {totalSelectedPoints > 0 && (
              <span> · 已选: <strong style={{ color: '#818cf8' }}>{formatPoints(totalSelectedPoints)}</strong></span>
            )}
            {remaining >= 0 && totalSelectedPoints > 0 && (
              <span> · 剩余: <strong style={{ color: remaining > 0 ? '#4ade80' : '#f87171' }}>{formatPoints(remaining)}</strong></span>
            )}
          </p>
        </div>
        <button
          onClick={handleRedeem}
          disabled={!canRedeem}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: canRedeem ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(148,163,184,0.15)',
            color: canRedeem ? '#fff' : '#475569',
            fontSize: 14,
            fontWeight: 600,
            cursor: canRedeem ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {isProcessing ? '兑换中...' : `确认兑换 (${[...selected.values()].reduce((a, b) => a + b, 0)} 件)`}
        </button>
      </div>

      {/* ===== Filters ===== */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(148,163,184,0.1)',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: category === c.key ? 'rgba(99,102,241,0.5)' : 'rgba(148,163,184,0.2)',
                background: category === c.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: category === c.key ? '#818cf8' : '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          aria-label="搜索奖品"
          placeholder="搜索奖品名称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 180,
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.5)',
            color: '#e2e8f0',
            fontSize: 13,
            outline: 'none',
          }}
        />
      </div>

      {/* ===== Prize List ===== */}
      <div
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
        role="list"
        aria-label="奖品列表"
      >
        {filteredPrizes.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: '#64748b',
              fontSize: 14,
            }}
          >
            {emptyText}
          </div>
        ) : (
          filteredPrizes.map((prize) => (
            <PrizeCard
              key={prize.id}
              prize={prize}
              selectedQty={selected.get(prize.id) || 0}
              availablePoints={remaining}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ))
        )}
      </div>
    </div>
  );
}
