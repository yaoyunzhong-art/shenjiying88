'use client';

import React from 'react';

export interface GovernanceQuickViewSectionProps {
  title?: string;
  titleColor?: string;
  primaryTextColor?: string;
  secondaryTextColor?: string;
  panelStyle?: React.CSSProperties;
  summaryLine: string;
  triageLine?: string;
  children?: React.ReactNode;
}

export interface FoundationConsumerWiringSectionProps {
  title?: string;
  titleColor?: string;
  primaryTextColor?: string;
  secondaryTextColor?: string;
  panelStyle?: React.CSSProperties;
  responsibility: string;
  sequenceLine?: string;
  highRiskLine?: string;
  touchpointsLine?: string;
}

export function GovernanceQuickViewSection({
  title = '治理告警快速视图',
  titleColor = '#93c5fd',
  primaryTextColor = '#cbd5e1',
  secondaryTextColor = titleColor,
  panelStyle,
  summaryLine,
  triageLine,
  children,
}: GovernanceQuickViewSectionProps) {
  return (
    <div
      style={{
        marginTop: 20,
        borderRadius: 18,
        padding: 18,
        background: 'rgba(15, 23, 42, 0.42)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        ...panelStyle,
      }}
    >
      <div style={{ color: titleColor, fontSize: 13 }}>{title}</div>
      <div style={{ marginTop: 8, color: primaryTextColor }}>{summaryLine}</div>
      {triageLine ? <div style={{ marginTop: 8, color: secondaryTextColor }}>{triageLine}</div> : null}
      {children}
    </div>
  );
}

export function FoundationConsumerWiringSection({
  title = '底座接线说明',
  titleColor = '#93c5fd',
  primaryTextColor = '#cbd5e1',
  secondaryTextColor = titleColor,
  panelStyle,
  responsibility,
  sequenceLine,
  highRiskLine,
  touchpointsLine,
}: FoundationConsumerWiringSectionProps) {
  return (
    <div
      style={{
        marginTop: 20,
        borderRadius: 18,
        padding: 18,
        background: 'rgba(15, 23, 42, 0.42)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        ...panelStyle,
      }}
    >
      <div style={{ color: titleColor, fontSize: 13 }}>{title}</div>
      <div style={{ marginTop: 8, color: primaryTextColor }}>{responsibility}</div>
      {sequenceLine ? <div style={{ marginTop: 10, color: secondaryTextColor }}>{sequenceLine}</div> : null}
      {highRiskLine ? <div style={{ marginTop: 8, color: primaryTextColor }}>{highRiskLine}</div> : null}
      {touchpointsLine ? <div style={{ marginTop: 8, color: primaryTextColor }}>{touchpointsLine}</div> : null}
    </div>
  );
}
