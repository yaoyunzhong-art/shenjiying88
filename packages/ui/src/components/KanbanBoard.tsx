'use client';

import React, { useState, useCallback, useMemo } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export interface KanbanColumn {
  /** Unique column id. */
  id: string;
  /** Column title. */
  title: string;
  /** Optional badge count shown beside the title. */
  count?: number;
  /** CSS background color override. */
  bgColor?: string;
}

export interface KanbanCard {
  /** Unique card id. */
  id: string;
  /** Card title. */
  title: string;
  /** Optional subtitle / description. */
  subtitle?: string;
  /** Current column id the card belongs to. */
  columnId: string;
  /** Optional priority label. */
  priority?: 'low' | 'medium' | 'high' | 'critical';
  /** Optional assignee name. */
  assignee?: string;
  /** Additional metadata rendered as tags. */
  tags?: string[];
  /** ISO date string for display. */
  dueDate?: string;
}

export interface KanbanBoardProps {
  /** Column definitions. */
  columns: KanbanColumn[];
  /** Cards across all columns. */
  cards: KanbanCard[];
  /** Callback when a card is dragged to a new column. */
  onCardMove?: (cardId: string, targetColumnId: string, targetIndex: number) => void;
  /** Callback when a card is clicked. */
  onCardClick?: (card: KanbanCard) => void;
  /** Loading state. */
  loading?: boolean;
  /** Custom class name. */
  className?: string;
  /** Test id. */
  'data-testid'?: string;
}

// ── Priority colours ────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

// ── Sub-components ─────────────────────────────────────────────────────────

interface KanbanCardItemProps {
  card: KanbanCard;
  onClick?: (card: KanbanCard) => void;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
}

function KanbanCardItem({ card, onClick, onDragStart }: KanbanCardItemProps) {
  return (
    <div
      data-testid={`kanban-card-${card.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onClick={() => onClick?.(card)}
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 10,
        border: '1px solid rgba(148, 163, 184, 0.12)',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.12)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Priority indicator */}
      {card.priority && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: PRIORITY_COLORS[card.priority] ?? '#94a3b8',
            }}
          />
          <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>
            {card.priority}
          </span>
        </div>
      )}

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
        {card.title}
      </div>

      {/* Subtitle */}
      {card.subtitle && (
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, lineHeight: 1.4 }}>
          {card.subtitle}
        </div>
      )}

      {/* Footer row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        {/* Assignee */}
        {card.assignee && (
          <span style={{ fontSize: 11, color: '#64748b' }}>{card.assignee}</span>
        )}

        {/* Due date */}
        {card.dueDate && (
          <span style={{ fontSize: 11, color: '#64748b' }}>{card.dueDate}</span>
        )}
      </div>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {card.tags.map((tag, i) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#93c5fd',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function KanbanBoard({
  columns,
  cards,
  onCardMove,
  onCardClick,
  loading = false,
  className,
  'data-testid': dataTestId,
}: KanbanBoardProps) {
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Group cards by column
  const cardsByColumn = useMemo(() => {
    const map: Record<string, KanbanCard[]> = {};
    for (const col of columns) {
      map[col.id] = cards.filter((c) => c.columnId === col.id);
    }
    return map;
  }, [cards, columns]);

  const handleDragStart = useCallback((e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumnId(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumnId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColumnId: string) => {
      e.preventDefault();
      setDragOverColumnId(null);
      const cardId = e.dataTransfer.getData('text/plain');
      if (cardId && draggedCardId) {
        const targetIndex = cardsByColumn[targetColumnId]?.length ?? 0;
        onCardMove?.(cardId, targetColumnId, targetIndex);
      }
      setDraggedCardId(null);
    },
    [draggedCardId, cardsByColumn, onCardMove],
  );

  // Loading state
  if (loading) {
    return (
      <div
        data-testid={dataTestId ?? 'kanban-board'}
        className={className}
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          padding: 8,
          minHeight: 200,
        }}
      >
        {columns.map((col) => (
          <div
            key={col.id}
            style={{
              flex: '1 1 280px',
              minWidth: 260,
              background: 'rgba(15, 23, 42, 0.25)',
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div
              style={{
                height: 20,
                width: '60%',
                background: 'rgba(148, 163, 184, 0.08)',
                borderRadius: 4,
                marginBottom: 12,
              }}
            />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 70,
                  background: 'rgba(148, 163, 184, 0.05)',
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid={dataTestId ?? 'kanban-board'}
      className={className}
      style={{
        display: 'flex',
        gap: 16,
        overflowX: 'auto',
        padding: 8,
        minHeight: 200,
      }}
    >
      {columns.map((col) => (
        <div
          key={col.id}
          data-testid={`kanban-column-${col.id}`}
          onDragOver={(e) => handleDragOver(e, col.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, col.id)}
          style={{
            flex: '1 1 280px',
            minWidth: 260,
            background:
              dragOverColumnId === col.id
                ? 'rgba(59, 130, 246, 0.08)'
                : 'rgba(15, 23, 42, 0.25)',
            borderRadius: 12,
            padding: 12,
            border:
              dragOverColumnId === col.id
                ? '2px dashed rgba(59, 130, 246, 0.4)'
                : '1px solid rgba(148, 163, 184, 0.08)',
            transition: 'background 0.15s, border 0.15s',
          }}
        >
          {/* Column header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              padding: '0 4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                {col.title}
              </span>
              {(col.count ?? cardsByColumn[col.id]?.length ?? 0) > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '1px 8px',
                    borderRadius: 10,
                    background: 'rgba(148, 163, 184, 0.12)',
                    color: '#94a3b8',
                  }}
                >
                  {col.count ?? cardsByColumn[col.id]?.length ?? 0}
                </span>
              )}
            </div>
          </div>

          {/* Cards */}
          <div style={{ minHeight: 60 }}>
            {(cardsByColumn[col.id] ?? []).length === 0 && !loading && (
              <div
                style={{
                  fontSize: 12,
                  color: '#475569',
                  textAlign: 'center',
                  padding: '20px 0',
                }}
              >
                无任务
              </div>
            )}
            {(cardsByColumn[col.id] ?? []).map((card) => (
              <KanbanCardItem
                key={card.id}
                card={card}
                onClick={onCardClick}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
