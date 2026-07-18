'use client';

import React from 'react';
import type { DomainGovernanceDisplayModel, DomainGovernanceDisplayPreset } from '@m5/types';
import {
  buildDomainGovernanceRenderSections,
  resolveDomainGovernanceDetailSlotColor,
  resolveDomainGovernanceDisplayPreset,
} from '@m5/types';

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
  const headerSection = model.headerSection;
  const footerSection = model.footerSection;
  const renderSections = buildDomainGovernanceRenderSections(model);

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
      <div style={{ fontSize: 12, color: preset.accentColor }}>{headerSection.eyebrow}</div>
      <div style={{ marginTop: 6, fontSize: 12, color: preset.subtitleColor }}>{headerSection.subtitle}</div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: preset.titleColor }}>{headerSection.titleSlot.value}</span>
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
          {headerSection.statusBadge.value}
        </span>
      </div>
      {renderSections.map((section) => (
        <div key={section.key} style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: preset.accentColor }}>{section.title}</div>
          {section.slots.map((slot) => (
            <div
              key={slot.key}
              style={{ marginTop: 6, fontSize: 12, color: resolveDomainGovernanceDetailSlotColor(preset, slot.tone) }}
            >
              {slot.label}：{slot.value}
            </div>
          ))}
        </div>
      ))}
      <a
        href={model.footerSection.workspaceSlot.value}
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
        {footerSection.ctaLabel}
      </a>
    </div>
  );
}
