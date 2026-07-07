'use client';

/**
 * AI 模型配置 - 历史版本抽屉组件 (V9 需求 1 · V10 Day 2)
 *
 * 显示指定 configId 的历史版本,支持一键回滚
 * 5 端适配: PC 抽屉 / H5 全屏 / 小程序简化列表
 */

import React, { useState, useCallback } from 'react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useConfigHistory, useRollbackAiModel } from './useAiModelPresets';
import type { AiModelConfigHistory, AiModelSwitcherProps } from './types';

export interface AiModelHistoryDrawerProps {
  /** 当前 configId */
  configId: string;
  /** 门店 ID */
  storeId: string;
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 回滚成功回调 */
  onRollback?: (response: { latencyMs: number }) => void;
  /** 端类型 */
  device?: AiModelSwitcherProps['device'];
  /** API base */
  apiBase?: string;
}

const CHANGE_TYPE_LABEL: Record<AiModelConfigHistory['changeType'], string> = {
  create: '创建',
  update: '更新',
  rollback: '回滚',
  activate: '激活',
};

const CHANGE_TYPE_COLOR: Record<AiModelConfigHistory['changeType'], string> = {
  create: '#52c41a',
  update: '#1677ff',
  rollback: '#fa8c16',
  activate: '#722ed1',
};

export function AiModelHistoryDrawer({
  configId,
  storeId,
  open,
  onClose,
  onRollback,
  device = 'pc',
  apiBase,
}: AiModelHistoryDrawerProps) {
  const { data: history, isLoading, error } = useConfigHistory(configId, { apiBase });
  const rollbackMutation = useRollbackAiModel({ storeId, apiBase });
  const [rollbackReason, setRollbackReason] = useState('');
  const [confirmHistId, setConfirmHistId] = useState<string | null>(null);

  const handleRollback = useCallback(
    async (historyId: string) => {
      const reason = rollbackReason.trim() || '门店一键回滚';
      try {
        const response = await rollbackMutation.mutateAsync({ historyId, reason });
        onRollback?.({ latencyMs: response.latencyMs });
        setConfirmHistId(null);
        setRollbackReason('');
      } catch (err) {
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.error('[AiModelHistoryDrawer] rollback failed:', err);
        }
      }
    },
    [rollbackReason, rollbackMutation, onRollback],
  );

  // 小程序端:简化卡片列表 (避免 Drawer)
  if (device === 'miniapp') {
    if (!open) return null;
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#fff',
          zIndex: 1000,
          padding: 12,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14 }}>历史版本 ({history?.length ?? 0})</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        {renderHistoryList(history ?? [], isLoading, error?.message ?? null, device)}
      </div>
    );
  }

  // PC / H5 / Pad:Modal 抽屉
  const width: number = device === 'pad' ? 560 : 520;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`历史版本 (${history?.length ?? 0})`}
      width={width}
    >
      {isLoading && (
        <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 13 }}>
          加载中...
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 12,
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 4,
            color: '#ff4d4f',
            fontSize: 12,
            margin: 12,
          }}
        >
          加载失败: {error.message}
        </div>
      )}

      {history && history.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 13 }}>
          暂无历史版本
        </div>
      )}

      {history && history.length > 0 && (
        <>
          {confirmHistId && (
            <div
              style={{
                padding: 12,
                background: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: 4,
                margin: 12,
                fontSize: 12,
              }}
            >
              <div style={{ marginBottom: 8, color: '#d48806' }}>
                ⚠️ 确认回滚到此版本?当前生效配置将被覆盖。
              </div>
              <input
                type="text"
                placeholder="回滚理由 (可选)"
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  fontSize: 12,
                  marginBottom: 8,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleRollback(confirmHistId)}
                  loading={rollbackMutation.isPending}
                  disabled={rollbackMutation.isPending}
                >
                  确认回滚
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setConfirmHistId(null);
                    setRollbackReason('');
                  }}
                  disabled={rollbackMutation.isPending}
                >
                  取消
                </Button>
              </div>
            </div>
          )}

          <div style={{ maxHeight: 480, overflowY: 'auto', padding: '0 12px 12px' }}>
            {history.map((h) => (
              <HistoryItem
                key={h.id}
                history={h}
                onRollback={() => setConfirmHistId(h.id)}
                rollbackDisabled={!!confirmHistId || rollbackMutation.isPending}
                device={device}
              />
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

interface HistoryItemProps {
  history: AiModelConfigHistory;
  onRollback: () => void;
  rollbackDisabled: boolean;
  device: AiModelSwitcherProps['device'];
}

function HistoryItem({ history: h, onRollback, rollbackDisabled, device }: HistoryItemProps) {
  const color = CHANGE_TYPE_COLOR[h.changeType];
  return (
    <div
      style={{
        padding: '10px 12px',
        border: '1px solid #f0f0f0',
        borderRadius: 6,
        marginBottom: 8,
        background: '#fafafa',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            background: color,
            color: '#fff',
            borderRadius: 3,
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          {CHANGE_TYPE_LABEL[h.changeType]}
        </span>
        <span style={{ fontSize: 11, color: '#999' }}>v{h.versionNumber}</span>
      </div>
      <div style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>
        <strong>{h.changedBy}</strong>
        <span style={{ marginLeft: 8, color: '#999' }}>{formatTime(h.changedAt)}</span>
      </div>
      {h.reason && (
        <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
          理由: {h.reason}
        </div>
      )}
      {h.changeType !== 'create' && h.changeType !== 'activate' && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onRollback}
          disabled={rollbackDisabled}
          style={{ fontSize: 11, padding: '2px 8px' }}
        >
          回滚到此版本
        </Button>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function renderHistoryList(
  history: AiModelConfigHistory[],
  isLoading: boolean,
  errorMessage: string | null,
  device: AiModelSwitcherProps['device'],
): React.ReactNode {
  if (isLoading) return <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>加载中...</div>;
  if (errorMessage) return <div style={{ color: '#ff4d4f', fontSize: 12 }}>错误: {errorMessage}</div>;
  if (history.length === 0) return <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>暂无</div>;
  return history.map((h) => (
    <HistoryItem
      key={h.id}
      history={h}
      onRollback={() => undefined}
      rollbackDisabled
      device={device}
    />
  ));
}

export default AiModelHistoryDrawer;