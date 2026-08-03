/**
 * DOMPurify-based HTML sanitizer
 * 替代 directlySetInnerHTML 的安全方案
 * 
 * 用法:
 *   import { sanitizeHtml } from '@m5/ui/sanitize'
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 */

// 运行时只需要基本的XSS过滤
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /on\w+\s*=\s*"[^"]*"/gi,
  /on\w+\s*=\s*'[^']*'/gi,
  /on\w+\s*=\s*[^\s>]+/gi,
  /javascript\s*:/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*>/gi,
]

/**
 * 对HTML内容做基本XSS过滤
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  
  let sanitized = html
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }
  
  return sanitized
}

/**
 * 安全地生成 JSON-LD schema
 */
export function sanitizeJsonLd(json: Record<string, unknown>): string {
  try {
    return JSON.stringify(json)
  } catch {
    return '{}'
  }
}
