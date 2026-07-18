'use client';

import React from 'react';
import type { DomainGovernanceDisplayModel, DomainGovernanceDisplayPreset } from '@m5/types';
import { resolveDomainGovernanceDisplayPreset } from '@m5/types';

export interface PortalDomainGovernanceCardProps {
  model: DomainGovernanceDisplayModel;
  preset?: DomainGovernanceDisplayPreset;
  style?: React.CSSProperties;
}

export function PortalDomainGovernanceCard({
  model,
  preset = resolveDomainGovernanceDisplayPreset('STOREFRONT_PC', model.requiresAttention),
  style,
}: PortalDomainGovernanceCardProps) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 16,
        background: preset.background,
        border: `1px solid ${preset.borderColor}`,
        ...style,
      }}
    >
      <div style={{ fontSize: 12, color: preset.accentColor }}>{model.title}</div>
      <div style={{ marginTop: 6, fontSize: 12, color: preset.subtitleColor }}>{model.subtitle}</div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: preset.titleColor }}>{model.sourceSummary}</span>
        <span
          style={{
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 700,
            color: preset.statusColor,
            background: preset.statusBackground,
          }}
        >
          {model.statusLabel}
        </span>
      </div>
      <div style={{ marginTop: 6, color: preset.summaryColor }}>{model.countsSummary}</div>
      {model.detailLines.map((line) => (
        <div key={line} style={{ marginTop: 6, fontSize: 12, color: preset.detailColor }}>
          {line}
        </div>
      ))}
      <div style={{ marginTop: 8, fontSize: 12, color: preset.accentColor }}>{model.workspaceSummary}</div>
      <a
        href={model.workspaceHref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          marginTop: 12,
          borderRadius: 999,
          padding: '8px 14px',
          background: preset.buttonBackground,
          color: preset.buttonTextColor,
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
