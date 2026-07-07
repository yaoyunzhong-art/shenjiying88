'use client';

import React, { useState, useCallback } from 'react';
import { StatusBadge } from './StatusBadge';

// ---- 类型定义 ----

/** 顾客会话状态 */
export type SessionStatus = 'active' | 'waiting' | 'checking' | 'completed' | 'cancelled';

/** 顾客信息 */
export interface CustomerInfo {
  id: string;
  name: string;
  phone?: string;
  memberLevel?: string;
  avatar?: string;
  visitCount: number;
  lastVisitAt?: string;
  tags?: string[];
}

/** 服务项 */
export interface ServiceItem {
  id: string;
  name: string;
  duration: number; // 分钟
  price: number;
  assignedTo?: string;
}

/** 会话操作按钮 */
export interface SessionAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: string;
  disabled?: boolean;
}

/** 顾客会话面板属性 */
export interface CustomerSessionPanelProps {
  /** 当前顾客 */
  customer: CustomerInfo;
  /** 会话状态 */
  status: SessionStatus;
  /** 排队人数 (仅 waiting 状态) */
  queueLength?: number;
  /** 已选服务列表 */
  selectedServices?: ServiceItem[];
  /** 预计等待时间 (分钟) */
  estimatedWaitMin?: number;
  /** 开始服务时间 (ISO) */
  startedAt?: string;
  /** 操作按钮列表 */
  actions: SessionAction[];
  /** 操作点击回调 */
  onAction: (actionId: string) => void;
  /** 添加服务回调 */
  onAddService?: () => void;
  /** 移除服务回调 */
  onRemoveService?: (serviceId: string) => void;
  /** 备注 */
  notes?: string;
  /** 备注变更回调 */
  onNotesChange?: (notes: string) => void;
  /** 自定义类名 */
  className?: string;
}

// ---- 状态标签映射 ----

const STATUS_LABELS: Record<SessionStatus, string> = {
  active: '服务中',
  waiting: '等候中',
  checking: '核销中',
  completed: '已完成',
  cancelled: '已取消',
};

const STATUS_VARIANTS: Record<SessionStatus, 'success' | 'warning' | 'info' | 'default' | 'error'> = {
  active: 'success',
  waiting: 'warning',
  checking: 'info',
  completed: 'default',
  cancelled: 'error',
};

// ---- 组件 ----

export function CustomerSessionPanel({
  customer,
  status,
  queueLength,
  selectedServices = [],
  estimatedWaitMin,
  startedAt,
  actions,
  onAction,
  onAddService,
  onRemoveService,
  notes = '',
  onNotesChange,
  className = '',
}: CustomerSessionPanelProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(notes);

  const handleSaveNotes = useCallback(() => {
    onNotesChange?.(notesDraft);
    setEditingNotes(false);
  }, [notesDraft, onNotesChange]);

  const handleCancelEditNotes = useCallback(() => {
    setNotesDraft(notes);
    setEditingNotes(false);
  }, [notes]);

  return (
    <div
      className={className}
      style={{
        background: 'var(--surface-card, #1e293b)',
        border: '1px solid var(--border-color, #334155)',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* 头部 - 顾客信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {customer.avatar ? (
            <img
              src={customer.avatar}
              alt={customer.name}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            customer.name.charAt(0)
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#f1f5f9' }}>
              {customer.name}
            </span>
            {customer.memberLevel && (
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(99,102,241,0.15)',
                  color: '#a5b4fc',
                  fontSize: 11,
                }}
              >
                {customer.memberLevel}
              </span>
            )}
            <StatusBadge variant={STATUS_VARIANTS[status]} label={STATUS_LABELS[status]} />
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 12 }}>
            {customer.phone && <span>{customer.phone}</span>}
            <span>第 {customer.visitCount} 次到店</span>
            {customer.tags && customer.tags.length > 0 && (
              <span>{customer.tags.join(' · ')}</span>
            )}
          </div>
        </div>
      </div>

      {/* 状态信息栏 */}
      {status === 'waiting' && queueLength !== undefined && (
        <div
          style={{
            background: 'rgba(250,204,21,0.08)',
            border: '1px solid rgba(250,204,21,0.2)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            color: '#fde047',
          }}
        >
          当前排队 {queueLength} 位
          {estimatedWaitMin != null && ` · 预计等待 ${estimatedWaitMin} 分钟`}
        </div>
      )}

      {status === 'active' && startedAt && (
        <div
          style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            color: '#86efac',
          }}
        >
          服务开始: {new Date(startedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {/* 服务清单 */}
      {selectedServices.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#e2e8f0',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>服务项目</span>
            <span style={{ color: '#94a3b8', fontWeight: 400 }}>
              合计 ¥{selectedServices.reduce((s, i) => s + i.price, 0).toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selectedServices.map((service) => (
              <div
                key={service.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ color: '#e2e8f0' }}>{service.name}</span>
                  {service.assignedTo && (
                    <span style={{ color: '#94a3b8', marginLeft: 8, fontSize: 12 }}>
                      → {service.assignedTo}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#cbd5e1' }}>{service.duration}min</span>
                  <span style={{ color: '#e2e8f0' }}>¥{service.price.toFixed(2)}</span>
                  {onRemoveService && (status === 'active' || status === 'checking') && (
                    <button
                      type="button"
                      onClick={() => onRemoveService(service.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: 0,
                        lineHeight: 1,
                      }}
                      aria-label={`移除 ${service.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {onAddService && (status === 'active' || status === 'checking') && (
            <button
              type="button"
              onClick={onAddService}
              style={{
                marginTop: 8,
                background: 'rgba(99,102,241,0.1)',
                border: '1px dashed rgba(99,102,241,0.3)',
                borderRadius: 6,
                padding: '6px 12px',
                color: '#a5b4fc',
                cursor: 'pointer',
                fontSize: 12,
                width: '100%',
              }}
            >
              + 添加服务
            </button>
          )}
        </div>
      )}

      {/* 备注 */}
      {!editingNotes ? (
        <div
          style={{
            fontSize: 13,
            color: notes ? '#cbd5e1' : '#64748b',
            cursor: onNotesChange ? 'pointer' : 'default',
            padding: '6px 0',
            borderTop: '1px solid var(--border-color, #334155)',
          }}
          onClick={() => {
            if (onNotesChange) {
              setNotesDraft(notes);
              setEditingNotes(true);
            }
          }}
        >
          {notes ? (
            <>
              <span style={{ color: '#94a3b8', marginRight: 6 }}>📝</span>
              {notes}
            </>
          ) : onNotesChange ? (
            <span style={{ color: '#64748b' }}>+ 添加备注...</span>
          ) : null}
        </div>
      ) : (
        <div style={{ borderTop: '1px solid var(--border-color, #334155)', paddingTop: 8 }}>
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="添加备注..."
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #475569',
              borderRadius: 6,
              color: '#e2e8f0',
              padding: '8px 10px',
              fontSize: 13,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={handleSaveNotes}
              style={{
                background: '#6366f1',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                padding: '4px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              保存
            </button>
            <button
              type="button"
              onClick={handleCancelEditNotes}
              style={{
                background: 'transparent',
                border: '1px solid #475569',
                borderRadius: 6,
                color: '#94a3b8',
                padding: '4px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {actions.map((action) => {
          const variantStyles = {
            primary: { background: '#6366f1', border: 'none', color: '#fff' },
            secondary: { background: 'rgba(255,255,255,0.06)', border: '1px solid #475569', color: '#e2e8f0' },
            danger: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' },
            ghost: { background: 'transparent', border: 'none', color: '#94a3b8' },
          }[action.variant ?? 'secondary'];

          return (
            <button
              key={action.id}
              type="button"
              disabled={action.disabled}
              onClick={() => onAction(action.id)}
              style={{
                ...variantStyles,
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
