/**
 * AI 模型切换器 - 公开 API (V9 需求 1 · V10 Day 1+Day 2)
 *
 * 5 端共享导出入口
 */

export { AiModelSwitcher } from './AiModelSwitcher';
export { default } from './AiModelSwitcher';

export { AiModelHistoryDrawer } from './AiModelHistoryDrawer';
export type { AiModelHistoryDrawerProps } from './AiModelHistoryDrawer';

export {
  useAiModelPresets,
  useStoreConfigs,
  useSwitchAiModel,
  useCreateAiModelConfig,
  useConfigHistory,
  useRollbackAiModel,
} from './useAiModelPresets';

export type {
  AiModelSwitcherProps,
  AiModelPreset,
  AiModelStoreConfig,
  AiModelConfigHistory,
  AiModelDefaultParams,
  AiModelProvider,
  IndustryType,
  ConfigChangeType,
  SwitchAiModelRequest,
  SwitchAiModelResponse,
  CreateAiModelConfigRequest,
  RollbackAiModelRequest,
} from './types';