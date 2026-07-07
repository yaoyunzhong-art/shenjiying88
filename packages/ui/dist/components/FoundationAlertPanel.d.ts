import React from 'react';
import type { FoundationAlertMutationKind } from '@m5/types';
export interface FoundationAlertPanelPalette {
    background?: string;
    border?: string;
    text?: string;
    accentText?: string;
    mutedText?: string;
    cardBackground?: string;
    cardBorder?: string;
    toolbarBackground?: string;
    toolbarBorder?: string;
    badgeBackground?: string;
    badgeText?: string;
    badgeBorder?: string;
}
export interface FoundationAlertPanelToolbarPalette {
    ackBackground?: string;
    ackText?: string;
    muteBackground?: string;
    muteText?: string;
    unmuteBackground?: string;
    unmuteText?: string;
    dropdownBackground?: string;
    dropdownBorder?: string;
    dropdownText?: string;
}
export interface FoundationAlertPanelThemePreset {
    palette: FoundationAlertPanelPalette;
    toolbarPalette: FoundationAlertPanelToolbarPalette;
    runtimeCallbackAccentColor?: string;
    runtimeCallbackBorderColor?: string;
}
export declare const foundationAlertPanelThemePresets: {
    admin: FoundationAlertPanelThemePreset;
    tob: FoundationAlertPanelThemePreset;
    storefront: FoundationAlertPanelThemePreset;
};
export declare function useFoundationAsyncLoader<T>(loader: () => Promise<T>): () => Promise<T>;
export interface GovernanceAlert {
    code: string;
    message?: string;
    severity?: string;
    acknowledged?: boolean;
    muted?: boolean;
    source?: string;
    owner?: string;
}
export interface GovernanceReadModel {
    alerts: any[];
    summary: {
        total: number;
        critical: number;
        warning: number;
        info: number;
        acknowledged: number;
        muted: number;
    };
}
export interface FoundationAlertPanelClientAccess {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
    client?: any;
    ackAlert?: (alertCode: string) => Promise<void>;
    muteAlert?: (alertCode: string) => Promise<void>;
    unmuteAlert?: (alertCode: string) => Promise<void>;
    loadDrilldown?: (code: string) => Promise<any>;
    executeMutation?: (action: FoundationAlertMutationKind, code: string) => Promise<any>;
}
interface FoundationAlertPanelFrameProps {
    router?: {
        push: (url: string) => void;
        replace: (url: string) => void;
    };
    pathname?: string;
    searchParams?: any;
    panelAccess: FoundationAlertPanelClientAccess;
    palette: FoundationAlertPanelPalette;
    focusContext?: string;
    initialGovernance: any;
    focusAlertCode?: string;
    onFocusChange?: (code: string, context: string) => void;
    loadGovernance: () => Promise<any>;
    timelineQueryKey?: string;
    ownerQueryKey?: string;
    sourceQueryKey?: string;
    toolbarPalette: FoundationAlertPanelToolbarPalette;
    runtimeCallbackAccentColor?: string;
    runtimeCallbackBorderColor?: string;
}
export interface FoundationAlertPanelSurfaceProps<TGovernance = GovernanceReadModel> {
    router?: FoundationAlertPanelFrameProps['router'];
    pathname?: string;
    searchParams?: FoundationAlertPanelFrameProps['searchParams'];
    panelAccess: FoundationAlertPanelClientAccess;
    themePreset: keyof typeof foundationAlertPanelThemePresets;
    initialGovernance: TGovernance;
    loadGovernance: () => Promise<TGovernance>;
    focusAlertCode?: string;
    focusContext?: string;
    timelineQueryKey?: string;
    ownerQueryKey?: string;
    sourceQueryKey?: string;
    onFocusChange?: (code: string, context: string) => void;
}
export declare function FoundationAlertPanelFrame({ panelAccess, palette, focusContext, initialGovernance, focusAlertCode, onFocusChange, loadGovernance, timelineQueryKey, ownerQueryKey, sourceQueryKey, toolbarPalette, runtimeCallbackAccentColor, runtimeCallbackBorderColor, }: FoundationAlertPanelFrameProps): React.JSX.Element;
export declare function FoundationAlertPanelSurface<TGovernance = GovernanceReadModel>({ router, pathname, searchParams, panelAccess, themePreset, initialGovernance, loadGovernance, focusAlertCode, focusContext, timelineQueryKey, ownerQueryKey, sourceQueryKey, onFocusChange }: FoundationAlertPanelSurfaceProps<TGovernance>): React.JSX.Element;
export {};
