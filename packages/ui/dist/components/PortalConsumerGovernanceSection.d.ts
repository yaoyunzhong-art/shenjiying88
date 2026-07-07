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
export declare function PortalConsumerGovernanceSection({ title, titleColor, primaryTextColor, secondaryTextColor, summaryTextColor, panelStyle, deliverySummary, responsibility, detailLines, governanceCodes, governanceSummary, linkedOverview, runtimePanel, }: PortalConsumerGovernanceSectionProps): React.JSX.Element;
