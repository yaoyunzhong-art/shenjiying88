'use client';

import React from 'react';

export interface DetailClosureLink {
  /** Stable key used for React keys and test selectors. */
  key: string;
  /** Card title. */
  title: string;
  /** Short caption under the title, e.g. an audit purpose or href purpose. */
  subtitle: string;
  /** Optional second-line caption for context (e.g. moduleKey). */
  context?: string;
  /** Href for the link card. */
  href: string;
  /** Visual variant — defaults to 'default'. */
  variant?: 'default' | 'warning' | 'danger';
  /** Optional aria-label override for screen readers. */
  ariaLabel?: string;
}

export interface DetailClosureBarProps {
  /** Links to render in the closure grid. */
  links: DetailClosureLink[];
  /** Optional section heading rendered above the cards. */
  heading?: string;
  /** Optional caption describing what this grid represents. */
  caption?: string;
  /** Test id for the wrapper. */
  'data-testid'?: string;
}

/**
 * DetailClosureBar renders the standard three-tier closure footer used by
 * every detail page in the admin workbench.
 *
 *   workspace → detail → action
 *
 * Each card represents a deep link (audit / foundation / workspace /
 * approvals / custom). The grid is responsive and adapts to the existing
 * deep-link card style used by the 7 detail-page batches.
 */
export function DetailClosureBar({
  links,
  heading = '上下文闭环',
  caption = '从详情页一键回到工作台、审计、治理审批或 Foundation 模块',
  'data-testid': testId
}: DetailClosureBarProps) {
  if (links.length === 0) {
    return null;
  }
  return (
    <section
      data-testid={testId ?? 'detail-closure-bar'}
      aria-label="Detail closure bar"
      style={sectionStyle}
    >
      <header style={{ marginBottom: 12 }}>
        <h3 style={headingStyle}>{heading}</h3>
        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{caption}</p>
      </header>
      <div style={gridStyle} data-testid="detail-closure-grid">
        {links.map((link) => (
          <a
            key={link.key}
            href={link.href}
            aria-label={link.ariaLabel ?? link.title}
            data-testid={`detail-closure-link-${link.key}`}
            style={{
              ...cardStyle,
              ...(link.variant === 'warning' ? warningCardStyle : null),
              ...(link.variant === 'danger' ? dangerCardStyle : null)
            }}
          >
            <div style={titleStyle}>{link.title}</div>
            <div style={subtitleStyle}>{link.subtitle}</div>
            {link.context ? <div style={contextStyle}>{link.context}</div> : null}
          </a>
        ))}
      </div>
    </section>
  );
}

export default DetailClosureBar;

const sectionStyle: React.CSSProperties = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 12,
  padding: 16,
  background: 'rgba(15,23,42,0.55)',
  marginTop: 8
};

const headingStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#94a3b8',
  margin: '0 0 4px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.4
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const cardStyle: React.CSSProperties = {
  display: 'block',
  border: '1px solid rgba(59,130,246,0.18)',
  borderRadius: 12,
  padding: 16,
  background: 'rgba(15,23,42,0.55)',
  textDecoration: 'none'
};

const warningCardStyle: React.CSSProperties = {
  border: '1px solid rgba(245,158,11,0.25)',
  background: 'rgba(245,158,11,0.06)'
};

const dangerCardStyle: React.CSSProperties = {
  border: '1px solid rgba(239,68,68,0.25)',
  background: 'rgba(239,68,68,0.06)'
};

const titleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#bfdbfe',
  marginBottom: 4
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8'
};

const contextStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  marginTop: 6,
  fontFamily: 'monospace'
};
