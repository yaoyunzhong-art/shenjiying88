'use client';

import React from 'react';

export interface PortalConsumerGovernanceSectionProps {
  title?: string;
  titleColor?: string;
  primaryTextColor?: string;
  secondaryTextColor?: string;
  summaryTextColor?: string;
  panelStyle?: React.CSSProperties;
  deliverySummary: string;
  responsibility: string;
  detailLines?: string[];
  governanceCodes: string[];
  governanceSummary: string;
  linkedOverview: React.ReactNode;
  runtimePanel?: React.ReactNode;
}

export function PortalConsumerGovernanceSection({
  title = 'Contract Consumer',
  titleColor = '#93c5fd',
  primaryTextColor = '#e2e8f0',
  secondaryTextColor = '#cbd5e1',
  summaryTextColor = titleColor,
  panelStyle,
  deliverySummary,
  responsibility,
  detailLines = [],
  governanceCodes,
  governanceSummary,
  linkedOverview,
  runtimePanel,
}: PortalConsumerGovernanceSectionProps) {
  return (
    <div
      style={{
        marginTop: 20,
        borderRadius: 16,
        padding: 18,
        background: 'rgba(15, 23, 42, 0.35)',
        ...panelStyle,
      }}
    >
      <div style={{ color: titleColor, fontSize: 12 }}>{title}</div>
      <div style={{ marginTop: 8, color: primaryTextColor }}>{deliverySummary}</div>
      <div style={{ marginTop: 6, color: titleColor }}>{responsibility}</div>
      {detailLines.map((line) => (
        <div key={line} style={{ marginTop: 6, color: secondaryTextColor }}>
          {line}
        </div>
      ))}
      <div style={{ marginTop: 6, color: titleColor }}>Governance：{governanceCodes.join(' / ')}</div>
      <div style={{ marginTop: 10, color: summaryTextColor }}>{governanceSummary}</div>
      {linkedOverview ? <React.Fragment key="linked-overview">{linkedOverview}</React.Fragment> : null}
      {runtimePanel ? <React.Fragment key="runtime-panel">{runtimePanel}</React.Fragment> : null}
    </div>
  );
}
