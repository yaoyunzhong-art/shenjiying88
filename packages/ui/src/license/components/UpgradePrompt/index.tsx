/**
 * UpgradePrompt - 升级引导弹窗组件 (V9 需求 2 · V10 Day 18-19 Phase 88)
 *
 * 功能:
 * - 套餐选择展示
 * - 试用申请入口
 * - 续费引导
 */

import React from 'react';

export interface UpgradePromptProps {
  open?: boolean;
  onClose?: () => void;
  currentScope?: string;
}

export function UpgradePrompt({ open, onClose, currentScope }: UpgradePromptProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '420px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>升级授权</h3>
        <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 16px' }}>
          {currentScope ? `当前授权: ${currentScope}` : '查看可选套餐提升授权'}
        </p>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            background: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#374151',
          }}
        >
          关闭
        </button>
      </div>
    </div>
  );
}

export default UpgradePrompt;
