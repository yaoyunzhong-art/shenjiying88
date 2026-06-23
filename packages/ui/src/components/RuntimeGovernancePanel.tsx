'use client';
import React from 'react';
import {
  canReplayRuntimePanelAction,
  createRuntimeOperationToolbarProps,
  createRuntimeReceiptStatusCardProps,
  executeRuntimePanelOperation,
  hasRuntimePanelReceiptCode,
  RuntimeOperationToolbar,
  RuntimePanelFeedback,
  RuntimePanelFrame,
  RuntimePanelGrid,
  RuntimePresetCard,
  RuntimePresetSelector,
  RuntimeReceiptStatusCard,
  useRuntimePanelState,
} from './LinkedOverviewStubs';

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

export interface RuntimeGovernancePanelTemplateProps<
  TReceipt,
  TPreset extends RuntimeGovernancePanelPreset
> {
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

export function RuntimeGovernancePanelTemplate<
  TReceipt,
  TPreset extends RuntimeGovernancePanelPreset
>({
  presets,
  defaultAction,
  initialMessage,
  scopeSummary,
  summarizeReceipt,
  canReplayReceipt,
  submitPreset,
  queryReceipt,
  replayReceipt,
  getReceiptScopeLabel,
  submitSuccessLabel = 'submit 已完成',
  querySuccessLabel = 'query 已刷新',
  replaySuccessLabel = 'replay 已调度',
  submitErrorMessage,
  queryErrorMessage,
  replayErrorMessage,
}: RuntimeGovernancePanelTemplateProps<TReceipt, TPreset>) {
  const [selectedAction, setSelectedAction] = React.useState<TPreset['action']>(defaultAction);
  const activePreset = React.useMemo(
    () => presets.find((item) => item.action === selectedAction) ?? presets[0],
    [presets, selectedAction]
  );
  const { receipt, pendingOperation, message, actionError, runOperation } =
    useRuntimePanelState<TReceipt>(initialMessage);

  const scopeLabel = getReceiptScopeLabel?.(receipt) ?? scopeSummary;

  const submitSelectedAction = React.useCallback(async () => {
    if (!activePreset) {
      return;
    }

    await runOperation('submit', () =>
      executeRuntimePanelOperation({
        run: () => submitPreset(activePreset, String(Date.now())),
        summarize: summarizeReceipt,
        successLabel: submitSuccessLabel,
        errorMessage: submitErrorMessage,
      })
    );
  }, [activePreset, runOperation, submitErrorMessage, submitPreset, submitSuccessLabel, summarizeReceipt]);

  const queryLatestReceipt = React.useCallback(async () => {
    const latestReceipt = receipt;
    if (!hasRuntimePanelReceiptCode(latestReceipt)) {
      return;
    }
    const resolvableReceipt = latestReceipt as TReceipt;

    await runOperation('query', () =>
      executeRuntimePanelOperation({
        run: () => queryReceipt(resolvableReceipt),
        summarize: summarizeReceipt,
        successLabel: querySuccessLabel,
        errorMessage: queryErrorMessage,
      })
    );
  }, [queryErrorMessage, queryReceipt, querySuccessLabel, receipt, runOperation, summarizeReceipt]);

  const replayLatestReceipt = React.useCallback(async () => {
    const latestReceipt = receipt;
    if (!canReplayRuntimePanelAction(latestReceipt, canReplayReceipt)) {
      return;
    }
    const replayableReceipt = latestReceipt as TReceipt;

    await runOperation('replay', () =>
      executeRuntimePanelOperation({
        run: () => replayReceipt(replayableReceipt, String(Date.now())),
        summarize: summarizeReceipt,
        successLabel: replaySuccessLabel,
        errorMessage: replayErrorMessage,
      })
    );
  }, [canReplayReceipt, receipt, replayErrorMessage, replayReceipt, replaySuccessLabel, runOperation, summarizeReceipt]);

  return (
    <RuntimePanelFrame scopeSummary={scopeSummary}>
      <RuntimePresetSelector
        options={presets.map((item) => ({ key: item.action, label: item.label }))}
        selectedKey={selectedAction}
        onSelect={(key: string) => setSelectedAction(key as TPreset['action'])}
      />
      <RuntimePanelGrid>
        {activePreset ? (
          <RuntimePresetCard
            preset={{
              label: activePreset.label,
              scenario: activePreset.scenario,
              nextStep: activePreset.nextStep,
              riskLevel: activePreset.riskLevel,
              recommendedAction: activePreset.recommendedAction,
              requestEndpoint: activePreset.requestEndpoint,
              handlerName: activePreset.handlerName,
              payload: activePreset.payload,
            }}
          />
        ) : null}
        <RuntimeReceiptStatusCard
          {...createRuntimeReceiptStatusCardProps({
            receipt,
            summarize: summarizeReceipt,
            scopeLabel,
          })}
        />
      </RuntimePanelGrid>
      <RuntimeOperationToolbar
        {...createRuntimeOperationToolbarProps({
          pendingOperation,
          receipt,
          canReplay: canReplayReceipt,
          onSubmit: () => void submitSelectedAction(),
          onQuery: () => void queryLatestReceipt(),
          onReplay: () => void replayLatestReceipt(),
        })}
      />
      <RuntimePanelFeedback message={message} receipt={receipt} actionError={actionError} />
    </RuntimePanelFrame>
  );
}
