'use client';

import React from 'react';
import type { DomainGovernanceDisplayModel } from '@m5/types';

export interface PortalDomainGovernanceCardProps {
  model: DomainGovernanceDisplayModel;
  accentColor?: string;
  titleColor?: string;
  summaryColor?: string;
  borderColor?: string;
  buttonBackground?: string;
  buttonTextColor?: string;
  background?: string;
  style?: React.CSSProperties;
}

export function PortalDomainGovernanceCard({
  model,
  accentColor = '#93c5fd',
  titleColor = '#f8fafc',
  summaryColor = '#cbd5e1',
  borderColor = 'rgba(148, 163, 184, 0.12)',
  buttonBackground = '#1d4ed8',
  buttonTextColor = '#eff6ff',
  background = 'rgba(15, 23, 42, 0.42)',
  style,
}: PortalDomainGovernanceCardProps) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 16,
        background,
        border: `1px solid ${borderColor}`,
        ...style,
      }}
    >
      <div style={{ fontSize: 12, color: accentColor }}>{model.title}</div>
      <div style={{ marginTop: 6, fontSize: 12, color: summaryColor }}>{model.subtitle}</div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: titleColor }}>{model.sourceSummary}</span>
        <span
          style={{
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 700,
            color: model.requiresAttention ? '#fecaca' : '#bbf7d0',
            background: model.requiresAttention ? 'rgba(127, 29, 29, 0.32)' : 'rgba(20, 83, 45, 0.32)',
          }}
        >
          {model.statusLabel}
        </span>
      </div>
      <div style={{ marginTop: 6, color: summaryColor }}>{model.countsSummary}</div>
      {model.detailLines.map((line) => (
        <div key={line} style={{ marginTop: 6, fontSize: 12, color: accentColor }}>
          {line}
        </div>
      ))}
      <div style={{ marginTop: 8, fontSize: 12, color: accentColor }}>{model.workspaceSummary}</div>
      <a
        href={model.workspaceHref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          marginTop: 12,
          borderRadius: 999,
          padding: '8px 14px',
          background: buttonBackground,
          color: buttonTextColor,
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {model.ctaLabel}
      </a>
    </div>
  );
}
