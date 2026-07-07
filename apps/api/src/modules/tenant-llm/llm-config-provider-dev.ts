/**
 * Development-only LLMProvider runtime values for test compatibility.
 * LLMProvider is defined as a type alias in llm-config.entity.ts;
 * this module provides a runtime values object matching the type.
 */
export const LLMProvider = {
  OPENAI: 'openai',
  AZURE_OPENAI: 'azure-openai',
  ANTHROPIC: 'anthropic',
  DEEPSEEK: 'deepseek',
  QWEN: 'qwen',
  MOONSHOT: 'moonshot',
  MINIMAX: 'minimax',
  CUSTOM: 'custom',
} as const
