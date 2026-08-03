'use client';

/**
 * 🎨 TooltipWrapper — 为图标按钮添加 tooltip 说明
 * 用于 DataTable 操作列等场景
 */
import React from 'react';

interface TooltipWrapperProps {
  label: string;
  children: React.ReactNode;
}

export default function TooltipWrapper({ label, children }: TooltipWrapperProps) {
  return (
    <span
      title={label}
      style={{ cursor: 'pointer', position: 'relative' }}
      aria-label={label}
    >
      {children}
      <style>{`
        span[title]:hover::after {
          content: attr(title);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #1e293b;
          color: #f8fafc;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          white-space: nowrap;
          z-index: 1000;
          margin-bottom: 4px;
          pointer-events: none;
          border: 1px solid rgba(148,163,184,0.2);
        }
      `}</style>
    </span>
  );
}
