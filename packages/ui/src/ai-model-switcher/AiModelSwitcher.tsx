'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Select, type SelectOption } from '../components/Select';
import { useStoreConfigs, useSwitchAiModel } from './useAiModelPresets';
import { AiModelHistoryDrawer } from './AiModelHistoryDrawer';
import type {
  AiModelSwitcherProps,
  AiModelStoreConfig,
  SwitchAiModelResponse,
} from './types';

/**
 * AI 模型切换器 (V9 需求 1 · V10 Day 1)
 *
 * 5 端统一组件 (PC / H5 / APP / Pad / 小程序):
 * - PC: 表格 + 弹窗配置
 * - H5: 全屏卡片
 * - APP: 底部弹层
 * - Pad: 左右分栏
 * - 小程序: 简化卡片 (避免下拉层级)
 *
 * 核心能力:
 * - 一键切换当前生效配置
 * - 显示 API key 脱敏 (sk-****-****-1234)
 * - 切换延迟 < 500ms (V9 硬约束)
 * - 乐观更新 + 失败回滚
 *
 * @example
 * <AiModelSwitcher
 *   storeId="store_001"
 *   currentConfigId={configId}
 *   onSwitch={(resp) => console.log('切换成功', resp.latencyMs)}
 * />
 */
export function AiModelSwitcher({
  storeId,
  currentConfigId,
  onSwitch,
  disabled = false,
  showHistory = true,
  device = 'pc',
  className,
  style,
  apiBase,
}: AiModelSwitcherProps) {
  const { data: configs, isLoading } = useStoreConfigs({
    storeId,
    apiBase,
  });
  const switchMutation = useSwitchAiModel({ storeId, apiBase });
  const [historyOpen, setHistoryOpen] = useState(false);

  const [selectedId, setSelectedId] = useState<string | undefined>(currentConfigId);

  // 构造 Select 选项
  const options: SelectOption[] = useMemo(() => {
    if (!configs) return [];
    return configs.map((c) => ({
      value: c.id,
      label: formatConfigLabel(c, device),
      disabled: !c.isCurrent && (disabled || switchMutation.isPending),
    }));
  }, [configs, disabled, switchMutation.isPending, device]);

  // 当前生效的配置
  const currentConfig = useMemo(
    () => configs?.find((c) => c.id === (selectedId ?? currentConfigId)),
    [configs, selectedId, currentConfigId],
  );

  const handleChange = useCallback(
    async (newId: string) => {
      if (newId === selectedId) return;
      setSelectedId(newId);
      try {
        const response: SwitchAiModelResponse = await switchMutation.mutateAsync({
          configId: newId,
          reason: '门店一键切换',
        });
        onSwitch?.(response);
      } catch (err) {
        // 失败时回滚选择
        setSelectedId(currentConfigId);
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.error('[AiModelSwitcher] 切换失败:', err);
        }
      }
    },
    [selectedId, currentConfigId, switchMutation, onSwitch],
  );

  // 端适配布局
  if (device === 'miniapp') {
    return (
      <MiniappLayout
        configs={configs ?? []}
        currentConfig={currentConfig ?? null}
        onChange={handleChange}
        disabled={disabled || switchMutation.isPending || isLoading}
        loading={isLoading}
        style={style}
        className={className}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: device === 'h5' ? 12 : 16,
        ...style,
      }}
      data-device={device}
      data-store-id={storeId}
      data-loading={isLoading}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: device === 'h5' ? 13 : 14, fontWeight: 600 }}>
          AI 模型配置
        </label>
        {switchMutation.isPending && (
          <span style={{ fontSize: 12, color: '#1677ff' }}>切换中…</span>
        )}
        {switchMutation.isSuccess && !switchMutation.isPending && (
          <span style={{ fontSize: 12, color: '#52c41a' }}>
            ✓ {switchMutation.data.latencyMs}ms
          </span>
        )}
        {switchMutation.isError && (
          <span style={{ fontSize: 12, color: '#ff4d4f' }}>切换失败</span>
        )}
      </div>

      <Select
        value={selectedId ?? currentConfigId}
        onChange={handleChange}
        options={options}
        placeholder={isLoading ? '加载中...' : '请选择配置'}
        disabled={disabled || switchMutation.isPending || isLoading}
        showSearch={!(device as string).startsWith('mini')}
        minWidth={device === 'h5' ? 200 : 280}
        aria-label="AI 模型配置选择器"
      />

      {currentConfig && (
        <div
          style={{
            padding: 12,
            background: '#fafafa',
            borderRadius: 6,
            fontSize: 12,
            color: '#666',
            lineHeight: 1.6,
          }}
        >
          <div>🔑 API Key: <code>{currentConfig.apiKeyMasked}</code></div>
          <div>🌐 端点: <code>{currentConfig.endpointUrl}</code></div>
          <div>
            ⚙️ 参数: 温度 {currentConfig.temperature} · 上下文 {currentConfig.contextWindow} · 最大 {currentConfig.maxTokens}
          </div>
        </div>
      )}

      {showHistory && currentConfig && (
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          style={{
            alignSelf: 'flex-start',
            padding: '4px 12px',
            fontSize: 12,
            color: '#1677ff',
            background: 'transparent',
            border: '1px solid #1677ff',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          查看历史版本
        </button>
      )}

      <AiModelHistoryDrawer
        configId={currentConfig?.id ?? ''}
        storeId={storeId}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        device={device}
        apiBase={apiBase}
        onRollback={() => setHistoryOpen(false)}
      />
    </div>
  );
}

// ============ 子组件: 小程序简化版 ============

interface MiniappLayoutProps {
  configs: AiModelStoreConfig[];
  currentConfig: AiModelStoreConfig | null;
  onChange: (id: string) => void;
  disabled: boolean;
  loading: boolean;
  style?: React.CSSProperties;
  className?: string;
}

function MiniappLayout({
  configs,
  currentConfig,
  onChange,
  disabled,
  loading,
  style,
  className,
}: MiniappLayoutProps) {
  return (
    <div className={className} style={{ padding: 8, ...style }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>AI 模型</div>
      {loading ? (
        <div style={{ fontSize: 12, color: '#999' }}>加载中…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {configs.map((c) => (
            <div
              key={c.id}
              onClick={() => !disabled && onChange(c.id)}
              style={{
                padding: '8px 10px',
                border: '1px solid ' + (c.isCurrent ? '#1677ff' : '#e8e8e8'),
                borderRadius: 4,
                background: c.isCurrent ? '#e6f7ff' : '#fff',
                fontSize: 12,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <div style={{ fontWeight: 500 }}>{c.configName}</div>
              <div style={{ color: '#999', marginTop: 2 }}>{c.apiKeyMasked}</div>
              {c.isCurrent && <div style={{ color: '#1677ff', marginTop: 2 }}>✓ 当前生效</div>}
            </div>
          ))}
        </div>
      )}
      {currentConfig && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
          上下文 {currentConfig.contextWindow} · 最大 {currentConfig.maxTokens}
        </div>
      )}
    </div>
  );
}

// ============ 工具函数 ============

function formatConfigLabel(config: AiModelStoreConfig, device: AiModelSwitcherProps['device']): string {
  const tag = config.isCurrent ? '✓ ' : '   ';
  if (device === 'miniapp') {
    return `${tag}${config.configName}`;
  }
  return `${tag}${config.configName} (${config.provider} · ${config.apiKeyMasked})`;
}

export default AiModelSwitcher;