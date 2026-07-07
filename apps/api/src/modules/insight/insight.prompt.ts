/**
 * Phase 94 智能分析 - 提示词模板渲染 (V10 Sprint 2 Day 16)
 *
 * 基于 InsightTemplate + 数据快照 → 最终 LLM prompt
 * 处理 {data} 占位符 + JSON 序列化
 */

import type {
  InsightTemplate,
  InsightTemplateType,
  InsightSource,
} from './insight.entity'
import { BUILTIN_INSIGHT_TEMPLATES } from './insight.entity'

/**
 * 获取模板 (内置 5 个 + 未来可扩展自定义)
 */
export function getTemplate(type: InsightTemplateType): InsightTemplate {
  const tpl = BUILTIN_INSIGHT_TEMPLATES.find((t) => t.type === type)
  if (!tpl) {
    throw new Error(`Unknown insight template type: ${type}`)
  }
  return tpl
}

/**
 * 列出所有模板 (按 type 排序)
 */
export function listTemplates(): InsightTemplate[] {
  return [...BUILTIN_INSIGHT_TEMPLATES].sort((a, b) =>
    a.type.localeCompare(b.type),
  )
}

/**
 * 渲染用户提示词: 将 sources 序列化为可读 markdown
 */
export function renderUserPrompt(
  template: InsightTemplate,
  sources: InsightSource[],
): string {
  // 数据快照序列化 (限制每源最大 8KB 防 prompt 爆炸)
  const MAX_BYTES_PER_SOURCE = 8 * 1024
  const dataBlocks = sources.map((s, idx) => {
    let json = JSON.stringify(s.dataSnapshot, null, 2)
    if (json.length > MAX_BYTES_PER_SOURCE) {
      json = json.slice(0, MAX_BYTES_PER_SOURCE) + '\n... (truncated)'
    }
    return [
      `### 数据源 ${idx + 1}: ${s.type} (${s.refId})`,
      `**时间窗**: ${s.period.from} ~ ${s.period.to}`,
      '',
      '```json',
      json,
      '```',
    ].join('\n')
  })

  const data = dataBlocks.join('\n\n')
  return template.userPromptTemplate.replace('{data}', data)
}

/**
 * 估算 token 数 (粗略: 1 token ≈ 2 中文字符 / 4 英文)
 * 用于 maxTokens 决策
 */
export function estimateTokens(text: string): number {
  let tokens = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    // 中文字符 (CJK) 按 1.5 token / 字估算
    if (code >= 0x4e00 && code <= 0x9fff) {
      tokens += 1.5
    } else if (code < 128) {
      // ASCII 按 0.25 token / 字符 (4 字符 ≈ 1 token)
      tokens += 0.25
    } else {
      tokens += 1
    }
  }
  return Math.ceil(tokens)
}

/**
 * 构建完整 LLM 请求参数
 */
export function buildLLMRequest(
  template: InsightTemplate,
  sources: InsightSource[],
  overrides?: { maxTokens?: number; temperature?: number },
): {
  systemPrompt: string
  userPrompt: string
  maxTokens: number
  temperature: number
  estimatedInputTokens: number
} {
  const userPrompt = renderUserPrompt(template, sources)
  const systemPrompt = template.systemPrompt
  const inputTokens = estimateTokens(systemPrompt + userPrompt)
  const maxTokens = overrides?.maxTokens ?? template.maxTokens
  const temperature = overrides?.temperature ?? template.temperature
  return {
    systemPrompt,
    userPrompt,
    maxTokens,
    temperature,
    estimatedInputTokens: inputTokens,
  }
}
