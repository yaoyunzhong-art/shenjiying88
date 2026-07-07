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
export declare function GovernanceQuickViewSection({ title, titleColor, primaryTextColor, secondaryTextColor, panelStyle, summaryLine, triageLine, children, }: GovernanceQuickViewSectionProps): React.JSX.Element;
export declare function FoundationConsumerWiringSection({ title, titleColor, primaryTextColor, secondaryTextColor, panelStyle, responsibility, sequenceLine, highRiskLine, touchpointsLine, }: FoundationConsumerWiringSectionProps): React.JSX.Element;
