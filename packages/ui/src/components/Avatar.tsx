'use client';

import React from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away' | 'none';

export interface AvatarProps {
  /** Image source URL. If provided and loads, it takes precedence over initials. */
  src?: string;
  /** Fallback initials when no image or image fails to load (max 2 chars shown). */
  initials?: string;
  /** Alt text for the image. */
  alt?: string;
  /** Size variant. */
  size?: AvatarSize;
  /** Status indicator dot. */
  status?: AvatarStatus;
  /** Custom background color for initials fallback. */
  bgColor?: string;
  /** Custom text color for initials fallback. */
  textColor?: string;
  /** Click handler. */
  onClick?: () => void;
  /** Optional className for external styling. */
  className?: string;
  /** Optional style overrides. */
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<AvatarSize, { px: number; fontSize: number }> = {
  xs: { px: 24, fontSize: 10 },
  sm: { px: 32, fontSize: 12 },
  md: { px: 40, fontSize: 14 },
  lg: { px: 48, fontSize: 16 },
  xl: { px: 64, fontSize: 22 },
};

const STATUS_COLORS: Record<Exclude<AvatarStatus, 'none'>, string> = {
  online: '#22c55e',
  offline: '#94a3b8',
  busy: '#ef4444',
  away: '#f59e0b',
};

const STATUS_RING = '2px solid rgba(15,23,42,0.95)'; // dark ring to separate from bg

function statusDotSize(size: AvatarSize): number {
  const dim = SIZE_MAP[size].px;
  if (dim <= 24) return 6;
  if (dim <= 32) return 8;
  if (dim <= 40) return 10;
  if (dim <= 48) return 11;
  return 13;
}

function statusOffset(size: AvatarSize): number {
  const dim = SIZE_MAP[size].px;
  // Shift dot into bottom-right corner
  return Math.max(0, dim * 0.08);
}

export function Avatar({
  src,
  initials,
  alt = '',
  size = 'md',
  status = 'none',
  bgColor = 'rgba(59,130,246,0.18)',
  textColor = '#93c5fd',
  onClick,
  className,
  style,
}: AvatarProps) {
  const dim = SIZE_MAP[size];
  const [imgFailed, setImgFailed] = React.useState(false);
  const showImage = src && !imgFailed;

  const displayInitials = React.useMemo(() => {
    if (!initials) return '';
    return initials
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [initials]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dim.px,
    height: dim.px,
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : undefined,
    ...style,
  };

  const fallbackStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: bgColor,
    color: textColor,
    fontSize: dim.fontSize,
    fontWeight: 600,
    lineHeight: 1,
    userSelect: 'none',
  };

  return (
    <div
      className={className}
      style={containerStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={alt || initials || 'avatar'}
    >
      {/* Status dot */}
      {status !== 'none' && (
        <span
          style={{
            position: 'absolute',
            bottom: statusOffset(size),
            right: statusOffset(size),
            width: statusDotSize(size),
            height: statusDotSize(size),
            borderRadius: '50%',
            background: STATUS_COLORS[status],
            border: STATUS_RING,
            zIndex: 2,
          }}
          aria-hidden
        />
      )}

      {/* Image or fallback */}
      {showImage ? (
        <img
          src={src}
          alt={alt || ''}
          onError={() => setImgFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <span style={fallbackStyle}>{displayInitials || '?'}</span>
      )}
    </div>
  );
}

export interface AvatarGroupProps {
  children: React.ReactNode;
  /** Max visible avatars before showing +N overflow badge. */
  max?: number;
  /** Spacing between stacked avatars (negative margin). */
  spacing?: number;
}

export function AvatarGroup({ children, max = 4, spacing = -10 }: AvatarGroupProps) {
  const childArray = React.Children.toArray(children).filter(Boolean);
  const visible = childArray.slice(0, max);
  const overflow = childArray.length - max;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((child, i) => (
        <div key={i} style={{ marginRight: i < visible.length - 1 || overflow > 0 ? spacing : 0, zIndex: visible.length - i }}>
          {child}
        </div>
      ))}
      {overflow > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: SIZE_MAP.md.px,
            height: SIZE_MAP.md.px,
            borderRadius: '50%',
            background: 'rgba(148,163,184,0.15)',
            color: '#94a3b8',
            fontSize: 12,
            fontWeight: 600,
            marginLeft: spacing,
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
