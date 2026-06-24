'use client';

import React, { useState, useCallback } from 'react';

export interface CopyToClipboardProps {
  /** 要复制的文本 */
  text: string;
  /** 复制按钮的标签，不传则只显示图标 */
  label?: string;
  /** 复制成功后的提示文本 */
  successLabel?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 大小变体 */
  size?: 'sm' | 'md';
  /** 是否以图标按钮形式（紧凑模式） */
  iconOnly?: boolean;
  /** 自定义 className（预留） */
  className?: string;
}

/**
 * CopyToClipboard — 一键复制组件。
 *
 * 点击后将 text 写入系统剪贴板，并短暂显示复制成功反馈。
 * 支持紧凑图标模式（详情页 ID 旁）和完整标签模式（代码块复制）。
 *
 * @example
 * // 紧凑图标模式 — 复制 ID
 * <CopyToClipboard text={record.id} size="sm" iconOnly />
 *
 * @example
 * // 完整标签模式 — 复制代码
 * <CopyToClipboard text={codeSnippet} label="复制代码" successLabel="已复制！" />
 */
export function CopyToClipboard({
  text,
  label,
  successLabel = 'Copied',
  style,
  size = 'md',
  iconOnly = false,
}: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级：使用传统 execCommand
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // 静默失败
      }
    }
  }, [text]);

  const isSmall = size === 'sm';
  const buttonSize = isSmall ? 28 : 34;
  const iconSize = isSmall ? 14 : 16;

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? successLabel : 'Copy to clipboard'}
        aria-label={copied ? successLabel : 'Copy to clipboard'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: buttonSize,
          height: buttonSize,
          borderRadius: 6,
          border: copied
            ? '1px solid rgba(74,222,128,0.3)'
            : '1px solid rgba(148,163,184,0.12)',
          background: copied
            ? 'rgba(74,222,128,0.1)'
            : 'rgba(15,23,42,0.3)',
          color: copied ? '#4ade80' : '#64748b',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.15s',
          ...style,
        }}
      >
        {copied ? (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M13.3 3.3L6 10.6L2.7 7.3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill="none"
          >
            <rect
              x="5"
              y="5"
              width="9"
              height="9"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={copied}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? 5 : 7,
        padding: isSmall ? '5px 11px' : '7px 15px',
        fontSize: isSmall ? 12 : 13,
        fontWeight: 500,
        borderRadius: 8,
        border: copied
          ? '1px solid rgba(74,222,128,0.25)'
          : '1px solid rgba(148,163,184,0.14)',
        background: copied
          ? 'rgba(74,222,128,0.08)'
          : 'rgba(15,23,42,0.3)',
        color: copied ? '#4ade80' : '#94a3b8',
        cursor: copied ? 'default' : 'pointer',
        transition: 'all 0.15s',
        ...style,
      }}
    >
      {copied ? (
        <>
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M13.3 3.3L6 10.6L2.7 7.3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{successLabel}</span>
        </>
      ) : (
        <>
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill="none"
          >
            <rect
              x="5"
              y="5"
              width="9"
              height="9"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
          <span>{label ?? 'Copy'}</span>
        </>
      )}
    </button>
  );
}
