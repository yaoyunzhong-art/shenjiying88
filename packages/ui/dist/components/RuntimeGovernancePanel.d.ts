import React from 'react';
export interface RuntimeGovernancePanelPreset<Action extends string = string> {
    action: Action;
    label: string;
    scenario: string;
    nextStep: string;
    riskLevel: 'low' | 'medium' | 'high';
    recommendedAction: string;
    requestEndpoint?: string;
    handlerName?: string;
    payload?: Record<string, unknown>;
}
export interface RuntimeGovernancePanelTemplateProps<TReceipt, TPreset extends RuntimeGovernancePanelPreset> {
    presets: readonly TPreset[];
    defaultAction: TPreset['action'];
    initialMessage: string;
    scopeSummary: string;
    summarizeReceipt: (receipt: TReceipt) => string;
    canReplayReceipt: (receipt: TReceipt) => boolean;
    submitPreset: (preset: TPreset, nonce: string) => Promise<TReceipt>;
    queryReceipt: (receipt: TReceipt) => Promise<TReceipt>;
    replayReceipt: (receipt: TReceipt, nonce: string) => Promise<TReceipt>;
    getReceiptScopeLabel?: (receipt: TReceipt | null) => string;
    submitSuccessLabel?: string;
    querySuccessLabel?: string;
    replaySuccessLabel?: string;
    submitErrorMessage: string;
    queryErrorMessage: string;
    replayErrorMessage: string;
}
export declare function RuntimeGovernancePanelTemplate<TReceipt, TPreset extends RuntimeGovernancePanelPreset>({ presets, defaultAction, initialMessage, scopeSummary, summarizeReceipt, canReplayReceipt, submitPreset, queryReceipt, replayReceipt, getReceiptScopeLabel, submitSuccessLabel, querySuccessLabel, replaySuccessLabel, submitErrorMessage, queryErrorMessage, replayErrorMessage, }: RuntimeGovernancePanelTemplateProps<TReceipt, TPreset>): React.JSX.Element;
