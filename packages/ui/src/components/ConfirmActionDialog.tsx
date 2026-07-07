'use client';

import React from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmActionDialogProps {
  /** 是否可见 */
  open: boolean;
  /** 标题 */
  title: string;
  /** 描述内容 */
  message: string;
  /** 确认按钮文本 */
  confirmLabel?: string;
  /** 取消按钮文本 */
  cancelLabel?: string;
  /** 确认按钮 variant */
  confirmVariant?: 'primary' | 'danger';
  /** 是否处于加载中（防重复提交） */
  loading?: boolean;
  /** 点击确认回调 */
  onConfirm: () => void;
  /** 点击取消 / 关闭回调 */
  onCancel: () => void;
}

/**
 * ConfirmActionDialog — 通用确认操作弹窗
 *
 * 用于删除确认、状态变更确认、高危操作二次确认等场景。
 * 支持加载态防重复提交。
 */
export function ConfirmActionDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  confirmVariant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div style={{ padding: 24, minWidth: 360, maxWidth: 480 }}>
        <h3
          style={{
            margin: 0,
            marginBottom: 12,
            fontSize: 18,
            fontWeight: 600,
            color: '#1e293b',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            marginBottom: 24,
            fontSize: 14,
            lineHeight: 1.6,
            color: '#475569',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            loading={loading}
            onClick={() => {
              if (!loading) onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
