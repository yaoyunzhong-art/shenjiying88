'use client';
import React, { useState, useCallback } from 'react';
import type { FoundationAlertMutationKind } from '@m5/types';

/* --------------- Palette / theme presets --------------- */

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

const adminPalette: FoundationAlertPanelPalette = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(96, 165, 250, 0.18)',
  text: '#f8fafc',
  accentText: '#93c5fd',
  mutedText: '#94a3b8',
  cardBackground: 'rgba(30, 41, 59, 0.55)',
  cardBorder: '1px solid rgba(96, 165, 250, 0.12)',
  toolbarBackground: 'rgba(30, 41, 59, 0.85)',
  toolbarBorder: '1px solid rgba(96, 165, 250, 0.2)',
  badgeBackground: 'rgba(59, 130, 246, 0.15)',
  badgeText: '#60a5fa',
  badgeBorder: '1px solid rgba(96, 165, 250, 0.25)',
};

const adminToolbarPalette: FoundationAlertPanelToolbarPalette = {
  ackBackground: '#1d4ed8',
  ackText: '#f8fafc',
  muteBackground: 'rgba(239, 68, 68, 0.15)',
  muteText: '#fca5a5',
  unmuteBackground: 'rgba(34, 197, 94, 0.15)',
  unmuteText: '#86efac',
  dropdownBackground: 'rgba(30, 41, 59, 0.95)',
  dropdownBorder: '1px solid rgba(96, 165, 250, 0.25)',
  dropdownText: '#f8fafc',
};

const tobPalette: FoundationAlertPanelPalette = {
  background: 'rgba(15, 23, 42, 0.55)',
  border: '1px solid rgba(6, 182, 212, 0.18)',
  text: '#f8fafc',
  accentText: '#67e8f9',
  mutedText: '#94a3b8',
  cardBackground: 'rgba(30, 41, 59, 0.5)',
  cardBorder: '1px solid rgba(6, 182, 212, 0.12)',
  toolbarBackground: 'rgba(30, 41, 59, 0.85)',
  toolbarBorder: '1px solid rgba(6, 182, 212, 0.2)',
  badgeBackground: 'rgba(6, 182, 212, 0.15)',
  badgeText: '#22d3ee',
  badgeBorder: '1px solid rgba(6, 182, 212, 0.25)',
};

const tobToolbarPalette: FoundationAlertPanelToolbarPalette = {
  ackBackground: '#0891b2',
  ackText: '#f8fafc',
  muteBackground: 'rgba(239, 68, 68, 0.15)',
  muteText: '#fca5a5',
  unmuteBackground: 'rgba(34, 197, 94, 0.15)',
  unmuteText: '#86efac',
  dropdownBackground: 'rgba(30, 41, 59, 0.95)',
  dropdownBorder: '1px solid rgba(6, 182, 212, 0.25)',
  dropdownText: '#f8fafc',
};

const storefrontPalette: FoundationAlertPanelPalette = {
  background: 'rgba(15, 23, 42, 0.5)',
  border: '1px solid rgba(59, 130, 246, 0.16)',
  text: '#f8fafc',
  accentText: '#93c5fd',
  mutedText: '#94a3b8',
  cardBackground: 'rgba(30, 41, 59, 0.48)',
  cardBorder: '1px solid rgba(59, 130, 246, 0.1)',
  toolbarBackground: 'rgba(30, 41, 59, 0.85)',
  toolbarBorder: '1px solid rgba(59, 130, 246, 0.18)',
  badgeBackground: 'rgba(59, 130, 246, 0.12)',
  badgeText: '#60a5fa',
  badgeBorder: '1px solid rgba(59, 130, 246, 0.2)',
};

const storefrontToolbarPalette: FoundationAlertPanelToolbarPalette = {
  ackBackground: '#1d4ed8',
  ackText: '#f8fafc',
  muteBackground: 'rgba(239, 68, 68, 0.12)',
  muteText: '#fca5a5',
  unmuteBackground: 'rgba(34, 197, 94, 0.12)',
  unmuteText: '#86efac',
  dropdownBackground: 'rgba(30, 41, 59, 0.95)',
  dropdownBorder: '1px solid rgba(59, 130, 246, 0.22)',
  dropdownText: '#f8fafc',
};

export const foundationAlertPanelThemePresets = {
  admin: {
    palette: adminPalette,
    toolbarPalette: adminToolbarPalette,
  } as FoundationAlertPanelThemePreset,
  tob: {
    palette: tobPalette,
    toolbarPalette: tobToolbarPalette,
    runtimeCallbackAccentColor: '#67e8f9',
    runtimeCallbackBorderColor: 'rgba(6, 182, 212, 0.25)',
  } as FoundationAlertPanelThemePreset,
  storefront: {
    palette: storefrontPalette,
    toolbarPalette: storefrontToolbarPalette,
  } as FoundationAlertPanelThemePreset,
};

/* --------------- useFoundationAsyncLoader --------------- */

export function useFoundationAsyncLoader<T>(loader: () => Promise<T>) {
  return useCallback(() => loader(), [loader]);
}

/* --------------- FoundationAlertPanelFrame --------------- */

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

async function runPanelMutation(
  panelAccess: FoundationAlertPanelClientAccess,
  action: FoundationAlertMutationKind,
  alertCode: string
) {
  if (action === 'ACK' && panelAccess.ackAlert) {
    await panelAccess.ackAlert(alertCode);
    return;
  }

  if (action === 'MUTE' && panelAccess.muteAlert) {
    await panelAccess.muteAlert(alertCode);
    return;
  }

  if (action === 'UNMUTE' && panelAccess.unmuteAlert) {
    await panelAccess.unmuteAlert(alertCode);
    return;
  }

  await panelAccess.executeMutation?.(action, alertCode);
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

export function FoundationAlertPanelFrame({
  panelAccess,
  palette,
  focusContext,
  initialGovernance,
  focusAlertCode,
  onFocusChange,
  loadGovernance,
  timelineQueryKey,
  ownerQueryKey,
  sourceQueryKey,
  toolbarPalette,
  runtimeCallbackAccentColor,
  runtimeCallbackBorderColor,
}: FoundationAlertPanelFrameProps) {
  const [governance, setGovernance] = useState<GovernanceReadModel>(initialGovernance);
  const [selectedAlertCode, setSelectedAlertCode] = useState<string | undefined>(focusAlertCode);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleFocusAlert = useCallback(
    (code: string) => {
      setSelectedAlertCode(code);
      onFocusChange?.(code, focusContext ?? 'panel');
    },
    [focusContext, onFocusChange]
  );

  const handleAck = useCallback(
    async (alertCode: string) => {
      setActionLoading(alertCode);
      try {
        await runPanelMutation(panelAccess, 'ACK', alertCode);
        const refreshed = await loadGovernance();
        setGovernance(refreshed);
      } finally {
        setActionLoading(null);
      }
    },
    [loadGovernance, panelAccess]
  );

  const handleMute = useCallback(
    async (alertCode: string) => {
      setActionLoading(alertCode);
      try {
        await runPanelMutation(panelAccess, 'MUTE', alertCode);
        const refreshed = await loadGovernance();
        setGovernance(refreshed);
      } finally {
        setActionLoading(null);
      }
    },
    [loadGovernance, panelAccess]
  );

  const handleUnmute = useCallback(
    async (alertCode: string) => {
      setActionLoading(alertCode);
      try {
        await runPanelMutation(panelAccess, 'UNMUTE', alertCode);
        const refreshed = await loadGovernance();
        setGovernance(refreshed);
      } finally {
        setActionLoading(null);
      }
    },
    [loadGovernance, panelAccess]
  );

  const summary = governance.summary;
  const filteredAlerts = governance.alerts.filter((a) => {
    if (selectedAlertCode) return a.code === selectedAlertCode;
    return true;
  });

  return (
    <div
      data-component="foundation-alert-panel"
      style={{
        borderRadius: 12,
        background: palette.background,
        border: palette.border,
        padding: 16,
        color: palette.text,
        fontSize: 13,
      }}
    >
      {/* Summary bar */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
          padding: '8px 12px',
          borderRadius: 8,
          background: palette.cardBackground,
          border: palette.cardBorder,
        }}
      >
        <SummaryBadge label="总计" value={summary.total} palette={palette} />
        <SummaryBadge label="严重" value={summary.critical} color="#ef4444" palette={palette} />
        <SummaryBadge label="警告" value={summary.warning} color="#f59e0b" palette={palette} />
        <SummaryBadge label="信息" value={summary.info} color="#3b82f6" palette={palette} />
        <SummaryBadge label="已确认" value={summary.acknowledged} color="#22c55e" palette={palette} />
        <SummaryBadge label="已静音" value={summary.muted} color="#6b7280" palette={palette} />
      </div>

      {/* Query key indicators */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, fontSize: 11, color: palette.mutedText }}>
        {timelineQueryKey && <span>⏱ timeline: {timelineQueryKey}</span>}
        {ownerQueryKey && <span>👤 owner: {ownerQueryKey}</span>}
        {sourceQueryKey && <span>📡 source: {sourceQueryKey}</span>}
      </div>

      {/* Alert list */}
      <div style={{ display: 'grid', gap: 10 }}>
        {filteredAlerts.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: palette.mutedText }}>
            {selectedAlertCode ? '未找到指定告警' : '暂无告警'}
          </div>
        )}
        {filteredAlerts.map((alert) => (
          <AlertCard
            key={alert.code}
            alert={alert}
            isSelected={selectedAlertCode === alert.code}
            isActionLoading={actionLoading === alert.code}
            onFocus={handleFocusAlert}
            onAck={handleAck}
            onMute={handleMute}
            onUnmute={handleUnmute}
            palette={palette}
            toolbarPalette={toolbarPalette}
            runtimeCallbackAccentColor={runtimeCallbackAccentColor}
            runtimeCallbackBorderColor={runtimeCallbackBorderColor}
          />
        ))}
      </div>

      {/* Refresh button */}
      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <button
          type="button"
          onClick={async () => {
            const refreshed = await loadGovernance();
            setGovernance(refreshed);
          }}
          style={{
            background: toolbarPalette.ackBackground,
            color: toolbarPalette.ackText,
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          🔄 刷新
        </button>
      </div>
    </div>
  );
}

export function FoundationAlertPanelSurface<TGovernance = GovernanceReadModel>({
  router,
  pathname,
  searchParams,
  panelAccess,
  themePreset,
  initialGovernance,
  loadGovernance,
  focusAlertCode,
  focusContext,
  timelineQueryKey = 'alertAction',
  ownerQueryKey = 'alertOwner',
  sourceQueryKey,
  onFocusChange
}: FoundationAlertPanelSurfaceProps<TGovernance>) {
  const theme = foundationAlertPanelThemePresets[themePreset];
  const asyncGovernanceLoader = useFoundationAsyncLoader(loadGovernance);

  return (
    <FoundationAlertPanelFrame
      router={router}
      pathname={pathname}
      searchParams={searchParams}
      panelAccess={panelAccess}
      palette={theme.palette}
      focusContext={focusContext}
      initialGovernance={initialGovernance}
      focusAlertCode={focusAlertCode}
      onFocusChange={onFocusChange}
      loadGovernance={asyncGovernanceLoader}
      timelineQueryKey={timelineQueryKey}
      ownerQueryKey={ownerQueryKey}
      sourceQueryKey={sourceQueryKey}
      toolbarPalette={theme.toolbarPalette}
      runtimeCallbackAccentColor={theme.runtimeCallbackAccentColor}
      runtimeCallbackBorderColor={theme.runtimeCallbackBorderColor}
    />
  );
}

/* --------------- Internal components --------------- */

function SummaryBadge({
  label,
  value,
  color,
  palette,
}: {
  label: string;
  value: number;
  color?: string;
  palette: FoundationAlertPanelPalette;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 6,
        background: palette.badgeBackground,
        border: palette.badgeBorder,
      }}
    >
      {color && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            display: 'inline-block',
          }}
        />
      )}
      <span style={{ color: palette.mutedText }}>{label}</span>
      <span style={{ color: palette.badgeText, fontWeight: 700 }}>{value}</span>
    </span>
  );
}

function AlertCard({
  alert,
  isSelected,
  isActionLoading,
  onFocus,
  onAck,
  onMute,
  onUnmute,
  palette,
  toolbarPalette,
  runtimeCallbackAccentColor,
  runtimeCallbackBorderColor,
}: {
  alert: GovernanceAlert;
  isSelected: boolean;
  isActionLoading: boolean;
  onFocus: (code: string) => void;
  onAck: (code: string) => Promise<void>;
  onMute: (code: string) => Promise<void>;
  onUnmute: (code: string) => Promise<void>;
  palette: FoundationAlertPanelPalette;
  toolbarPalette: FoundationAlertPanelToolbarPalette;
  runtimeCallbackAccentColor?: string;
  runtimeCallbackBorderColor?: string;
}) {
  const severityColor =
    alert.severity === 'critical'
      ? '#ef4444'
      : alert.severity === 'warning'
        ? '#f59e0b'
        : '#3b82f6';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onFocus(alert.code)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onFocus(alert.code);
      }}
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: isSelected
          ? runtimeCallbackAccentColor
            ? `rgba(6, 182, 212, 0.12)`
            : 'rgba(59, 130, 246, 0.12)'
          : palette.cardBackground,
        border: isSelected
          ? runtimeCallbackBorderColor ?? '1px solid rgba(59, 130, 246, 0.35)'
          : palette.cardBorder,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'grid',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: severityColor,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 600, color: palette.accentText }}>{alert.code}</span>
        {alert.acknowledged && (
          <span style={{ fontSize: 11, color: '#22c55e' }}>✓ 已确认</span>
        )}
        {alert.muted && <span style={{ fontSize: 11, color: '#6b7280' }}>🔇 已静音</span>}
      </div>
      <div style={{ color: palette.text, fontSize: 13 }}>{alert.message}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', fontSize: 11, color: palette.mutedText }}>
        {alert.source && <span>📡 {alert.source}</span>}
        {alert.owner && <span>👤 {alert.owner}</span>}
      </div>

      {/* Toolbar actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {!alert.acknowledged && (
          <ActionButton
            label={isActionLoading ? '确认中...' : '确认'}
            onClick={() => onAck(alert.code)}
            disabled={isActionLoading}
            bg={toolbarPalette.ackBackground}
            color={toolbarPalette.ackText}
          />
        )}
        {alert.muted ? (
          <ActionButton
            label={isActionLoading ? '取消静音...' : '取消静音'}
            onClick={() => onUnmute(alert.code)}
            disabled={isActionLoading}
            bg={toolbarPalette.unmuteBackground}
            color={toolbarPalette.unmuteText}
          />
        ) : (
          <ActionButton
            label={isActionLoading ? '静音中...' : '静音'}
            onClick={() => onMute(alert.code)}
            disabled={isActionLoading}
            bg={toolbarPalette.muteBackground}
            color={toolbarPalette.muteText}
          />
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  bg,
  color,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  bg?: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        borderRadius: 4,
        border: 'none',
        background: bg ?? 'rgba(59, 130, 246, 0.15)',
        color: color ?? '#60a5fa',
        fontSize: 11,
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {label}
    </button>
  );
}
