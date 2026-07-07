'use client';

import React, { useCallback, useState } from 'react';

// ==================== 类型定义 ====================

export interface CodeBlockProps {
  /** 代码内容 */
  code: string;
  /** 语言标签（用于显示，如 json / tsx / bash / yaml / log） */
  language?: string;
  /** 是否显示行号，默认 true */
  showLineNumbers?: boolean;
  /** 最大显示行数（超出折叠），默认 0 表示不限制 */
  maxLines?: number;
  /** 是否可复制，默认 true */
  copyable?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 容器类名 */
  className?: string;
  /** 是否默认折叠（当 maxLines 生效时），默认 false */
  defaultCollapsed?: boolean;
  /** 测试 id */
  'data-testid'?: string;
}

// ==================== 语言配色 ====================

const LANGUAGE_COLORS: Record<string, string> = {
  json: '#fbbf24',
  tsx: '#60a5fa',
  ts: '#3b82f6',
  js: '#eab308',
  bash: '#a78bfa',
  yaml: '#34d399',
  log: '#94a3b8',
  text: '#94a3b8',
  html: '#f97316',
  css: '#06b6d4',
  sql: '#8b5cf6',
  graphql: '#ec4899',
  dockerfile: '#0ea5e9',
  diff: '#f43f5e',
};

function getLanguageColor(language?: string): string {
  if (!language) return '#94a3b8';
  return LANGUAGE_COLORS[language.toLowerCase()] ?? '#94a3b8';
}

// ==================== 工具函数 ====================

function countLines(code: string): number {
  return code.split('\n').length;
}

function padLineNumber(num: number, total: number): string {
  const width = String(total).length;
  return String(num).padStart(width, ' ');
}

// ==================== 组件 ====================

export function CodeBlock({
  code,
  language,
  showLineNumbers = true,
  maxLines = 0,
  copyable = true,
  style,
  className,
  defaultCollapsed = false,
  'data-testid': dataTestId,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const totalLines = countLines(code);
  const lines = code.split('\n');
  const isTruncatable = maxLines > 0 && totalLines > maxLines;
  const visibleLines = isTruncatable && collapsed ? lines.slice(0, maxLines) : lines;
  const hasTrailingEmpty = code.endsWith('\n');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const langColor = getLanguageColor(language);

  return (
    <div
      data-testid={dataTestId ?? 'code-block'}
      className={className}
      style={{
        borderRadius: 12,
        background: '#0f172a',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        overflow: 'hidden',
        fontFamily: "'SF Mono','Fira Code','JetBrains Mono','Cascadia Code',monospace",
        fontSize: 13,
        lineHeight: 1.6,
        ...style,
      }}
    >
      {/* ── 头部栏 ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'rgba(15, 23, 42, 0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 语言标识点 */}
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: langColor,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: '#94a3b8',
              fontSize: 12,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {(language ?? 'CODE').toUpperCase()}
          </span>
          {isTruncatable && (
            <span
              style={{
                color: '#64748b',
                fontSize: 11,
                marginLeft: 4,
              }}
            >
              {totalLines} 行
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* 折叠按钮 */}
          {isTruncatable && (
            <button
              onClick={toggleCollapse}
              data-testid="code-block-collapse-toggle"
              style={{
                background: 'rgba(148,163,184,0.1)',
                border: '1px solid rgba(148,163,184,0.15)',
                borderRadius: 6,
                color: '#94a3b8',
                fontSize: 11,
                padding: '3px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(148,163,184,0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(148,163,184,0.1)';
              }}
            >
              {collapsed ? `展开全部` : `收起 (${totalLines}行)`}
            </button>
          )}

          {/* 复制按钮 */}
          {copyable && (
            <button
              onClick={handleCopy}
              data-testid="code-block-copy-btn"
              style={{
                background: copied
                  ? 'rgba(52,211,153,0.15)'
                  : 'rgba(148,163,184,0.1)',
                border: '1px solid rgba(148,163,184,0.15)',
                borderRadius: 6,
                color: copied ? '#34d399' : '#94a3b8',
                fontSize: 11,
                padding: '3px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              onMouseEnter={(e) => {
                if (!copied) e.currentTarget.style.background = 'rgba(148,163,184,0.18)';
              }}
              onMouseLeave={(e) => {
                if (!copied) e.currentTarget.style.background = 'rgba(148,163,184,0.1)';
              }}
            >
              {copied ? '✓ 已复制' : '复制'}
            </button>
          )}
        </div>
      </div>

      {/* ── 代码区域 ── */}
      <div
        style={{
          overflow: 'auto',
          maxHeight: isTruncatable && collapsed ? `${maxLines * 1.6 + 1}em` : 'none',
          padding: '12px 0',
        }}
      >
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre',
            wordBreak: 'normal',
            overflowWrap: 'normal',
            color: '#e2e8f0',
          }}
        >
          <code>
            {visibleLines.map((line, idx) => {
              const lineNum = idx + 1;
              const isEmpty = line.trim() === '';
              const isLast = idx === visibleLines.length - 1;

              // 跳过末尾空行
              if (isLast && hasTrailingEmpty && line === '') return null;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    padding: '0 16px',
                    background: isEmpty ? 'transparent' : 'transparent',
                    minHeight: '1.6em',
                  }}
                >
                  {showLineNumbers && (
                    <span
                      data-testid={`code-block-line-${lineNum}`}
                      style={{
                        display: 'inline-block',
                        width: '3em',
                        minWidth: '3em',
                        textAlign: 'right',
                        marginRight: 16,
                        color: '#475569',
                        userSelect: 'none',
                        flexShrink: 0,
                      }}
                    >
                      {padLineNumber(lineNum, totalLines)}
                    </span>
                  )}
                  <span
                    style={{
                      color: isEmpty ? 'transparent' : '#e2e8f0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {line || ' '}
                  </span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* ── 底部提示（折叠状态） ── */}
      {isTruncatable && collapsed && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px 16px',
            borderTop: '1px solid rgba(148, 163, 184, 0.08)',
            background: 'linear-gradient(transparent, rgba(15,23,42,0.8))',
          }}
        >
          <button
            onClick={toggleCollapse}
            data-testid="code-block-expand-btn"
            style={{
              background: 'rgba(148,163,184,0.08)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 8,
              color: '#94a3b8',
              fontSize: 12,
              padding: '6px 20px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(148,163,184,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(148,163,184,0.08)';
            }}
          >
            展开全部 {totalLines} 行
          </button>
        </div>
      )}
    </div>
  );
}
