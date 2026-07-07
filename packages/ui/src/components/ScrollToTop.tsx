'use client';
import React from 'react';

export interface ScrollToTopProps {
  /** Scroll threshold in px before the button appears. Default: 300 */
  threshold?: number;
  /** Scroll behavior: 'smooth' (default) or 'auto' */
  behavior?: ScrollBehavior;
  /** Position from bottom in px. Default: 32 */
  bottom?: number;
  /** Position from right in px. Default: 32 */
  right?: number;
  /** Button size in px. Default: 40 */
  size?: number;
  /** Background color. Default: #3b82f6 (blue-500) */
  backgroundColor?: string;
  /** Icon color. Default: #ffffff */
  iconColor?: string;
  /** Hover background color. Default: #2563eb (blue-600) */
  hoverBackgroundColor?: string;
  /** ARIA label */
  'aria-label'?: string;
  /** Test id */
  'data-testid'?: string;
  /** Extra class */
  className?: string;
  /** Inline style override */
  style?: React.CSSProperties;
  /** Custom icon element. Default: upward arrow */
  icon?: React.ReactNode;
}

/**
 * ScrollToTop — floating button that appears after the user scrolls past a threshold.
 *
 * Smoothly scrolls the window to the top when clicked.
 */
export function ScrollToTop({
  threshold = 300,
  behavior = 'smooth',
  bottom = 32,
  right = 32,
  size = 40,
  backgroundColor = '#3b82f6',
  iconColor = '#ffffff',
  hoverBackgroundColor = '#2563eb',
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  className,
  style,
  icon,
}: ScrollToTopProps) {
  const [visible, setVisible] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior });
  };

  return visible ? (
    <button
      data-testid={dataTestId}
      className={className}
      aria-label={ariaLabel ?? 'Back to top'}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        bottom,
        right,
        width: size,
        height: size,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hovered ? hoverBackgroundColor : backgroundColor,
        color: iconColor,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'background-color 0.2s, opacity 0.3s',
        zIndex: 1000,
        ...style,
      }}
    >
      {icon ?? (
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      )}
    </button>
  ) : null;
}
