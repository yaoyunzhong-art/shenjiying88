'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QRCodeType = 'payment' | 'membership' | 'miniapp' | 'coupon' | 'generic';

export interface QRCodeDisplayProps {
  /** QR code value (URL, payload string) */
  value: string;
  /** Visual type label */
  type?: QRCodeType;
  /** Human-readable description shown below the QR */
  label?: string;
  /** Title displayed above the QR image */
  title?: string;
  /** Width/height of the QR image area in px */
  size?: number;
  /** Callback fired after the QR is successfully copied */
  onCopy?: () => void;
  /** Callback fired on refresh / regenerate */
  onRefresh?: () => void;
  /** Whether the QR has expired (shows overlay) */
  expired?: boolean;
  /** Custom image source – defaults to a data-uri or external QR generator URL */
  src?: string;
  /** Extra CSS class */
  className?: string;
  /** Test id */
  'data-testid'?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<QRCodeType, string> = {
  payment: '付款码',
  membership: '会员码',
  miniapp: '小程序码',
  coupon: '优惠券码',
  generic: '通用二维码',
};

const TYPE_ICONS: Record<QRCodeType, string> = {
  payment: '💳',
  membership: '🆔',
  miniapp: '📱',
  coupon: '🎫',
  generic: '📷',
};

/**
 * Build a simple inline SVG data-uri QR placeholder (grid).
 * In production this would be replaced with an actual QR library;
 * for now we render a visual placeholder that resembles a QR code pattern.
 */
function qrPlaceholderSvg(size: number, payload: string): string {
  const seed = payload.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const cells = 11;
  const cellSize = Math.floor(size / cells);
  const actualSize = cellSize * cells;

  const rects: string[] = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const hash = (seed * (r + 1) * (c + 1) * 7) % 17;
      if (hash > 7) {
        rects.push(
          `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b" rx="1" />`,
        );
      }
    }
  }

  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${actualSize}" height="${actualSize}" viewBox="0 0 ${actualSize} ${actualSize}">
        <rect width="${actualSize}" height="${actualSize}" fill="#ffffff" rx="4" />
        ${rects.join('\n')}
        <!-- finder patterns (corners) -->
        <rect x="0" y="0" width="${cellSize * 3}" height="${cellSize * 3}" fill="#1e293b" rx="2" />
        <rect x="${cellSize * 0.5}" y="${cellSize * 0.5}" width="${cellSize * 2}" height="${cellSize * 2}" fill="#ffffff" rx="1" />
        <rect x="${cellSize}" y="${cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b" />
        <rect x="${actualSize - cellSize * 3}" y="0" width="${cellSize * 3}" height="${cellSize * 3}" fill="#1e293b" rx="2" />
        <rect x="${actualSize - cellSize * 2.5}" y="${cellSize * 0.5}" width="${cellSize * 2}" height="${cellSize * 2}" fill="#ffffff" rx="1" />
        <rect x="${actualSize - cellSize * 2}" y="${cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b" />
        <rect x="0" y="${actualSize - cellSize * 3}" width="${cellSize * 3}" height="${cellSize * 3}" fill="#1e293b" rx="2" />
        <rect x="${cellSize * 0.5}" y="${actualSize - cellSize * 2.5}" width="${cellSize * 2}" height="${cellSize * 2}" fill="#ffffff" rx="1" />
        <rect x="${cellSize}" y="${actualSize - cellSize * 2}" width="${cellSize}" height="${cellSize}" fill="#1e293b" />
      </svg>`,
    )
  );
}

function formatLabel(value: string): string {
  if (value.length > 48) return value.slice(0, 20) + '…' + value.slice(-20);
  return value;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  type = 'generic',
  label,
  title,
  size = 160,
  onCopy,
  onRefresh,
  expired = false,
  src,
  className = '',
  'data-testid': testId = 'qr-code-display',
}) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.();
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available – silently ignore
    }
  }, [value, onCopy]);

  const imgSrc = src ?? qrPlaceholderSvg(size, value);
  const finalSize = Math.max(80, Math.min(320, size));

  return (
    <div
      data-testid={testId}
      className={`qr-code-display ${className}`}
      style={containerStyle}
    >
      {/* Header */}
      {title && <div style={titleStyle} data-testid={`${testId}-title`}>{title}</div>}

      {/* QR Image */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src={imgSrc}
          alt={TYPE_LABELS[type]}
          width={finalSize}
          height={finalSize}
          style={{
            ...imgStyle,
            opacity: expired ? 0.35 : 1,
          }}
          data-testid={`${testId}-image`}
        />
        {/* Type badge */}
        <span
          style={badgeStyle}
          data-testid={`${testId}-badge`}
        >
          {TYPE_ICONS[type]} {TYPE_LABELS[type]}
        </span>

        {/* Expired overlay */}
        {expired && (
          <div
            style={expiredOverlayStyle}
            data-testid={`${testId}-expired`}
          >
            <span style={{ fontSize: 18, fontWeight: 600 }}>已过期</span>
            <span style={{ fontSize: 13, marginTop: 4 }}>请刷新二维码</span>
          </div>
        )}
      </div>

      {/* Label / value hint */}
      {label && (
        <div style={labelStyle} data-testid={`${testId}-label`}>
          {label}
        </div>
      )}

      {/* Value fingerprint */}
      <div style={valueStyle} data-testid={`${testId}-value`}>
        {formatLabel(value)}
      </div>

      {/* Action buttons */}
      <div style={actionsStyle}>
        <button
          type="button"
          style={actionBtnStyle}
          onClick={handleCopy}
          disabled={copied}
          data-testid={`${testId}-copy`}
        >
          {copied ? '✓ 已复制' : '复制'}
        </button>
        {onRefresh && (
          <button
            type="button"
            style={actionBtnStyle}
            onClick={onRefresh}
            data-testid={`${testId}-refresh`}
          >
            刷新
          </button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Static styles (inline for portability)
// ---------------------------------------------------------------------------

const containerStyle: React.CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  padding: 20,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(148,163,184,0.16)',
};

const titleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: '#e2e8f0',
};

const imgStyle: React.CSSProperties = {
  borderRadius: 8,
  display: 'block',
  transition: 'opacity 0.2s',
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 6,
  left: 6,
  fontSize: 11,
  background: 'rgba(99,102,241,0.85)',
  color: '#fff',
  padding: '2px 8px',
  borderRadius: 10,
  fontWeight: 500,
  whiteSpace: 'nowrap',
};

const expiredOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.55)',
  borderRadius: 8,
  color: '#f87171',
  backdropFilter: 'blur(2px)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#94a3b8',
  textAlign: 'center',
  maxWidth: 220,
};

const valueStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  fontFamily: 'monospace',
  wordBreak: 'break-all',
  textAlign: 'center',
  maxWidth: 240,
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
};

const actionBtnStyle: React.CSSProperties = {
  padding: '6px 16px',
  fontSize: 13,
  fontWeight: 500,
  border: '1px solid rgba(148,163,184,0.25)',
  borderRadius: 6,
  background: 'rgba(255,255,255,0.04)',
  color: '#e2e8f0',
  cursor: 'pointer',
  transition: 'background 0.15s',
};

export default QRCodeDisplay;
