/**
 * document-parser.service.ts - Phase-23 T82
 * 多格式文档解析 (PDF/Word/Excel/Markdown/Image OCR)
 *
 * V2 升级 (vs V1 仅 markdown):
 * - Markdown (内建,V1 兼容)
 * - Plain Text
 * - HTML → text
 * - JSON / YAML (配置文件)
 * - PDF (mock,生产接 pdf-parse)
 * - Word (.docx, mock,生产接 mammoth)
 * - Excel (.xlsx, mock,生产接 xlsx)
 * - Image (OCR mock,生产接 tesseract.js)
 *
 * 设计:
 * - 统一 DocumentChunk 输出 (与 KnowledgeIndexer 兼容)
 * - 结构保留 (表格行/列、代码块、公式占位)
 * - 失败 fallback: 解析失败 → 返回 raw text + 标记 failed=true
 */
import { Injectable, Logger } from '@nestjs/common';
import type { DocumentChunk } from './knowledge-indexer.service';

// ── Types ──

export type DocFormat = 'markdown' | 'text' | 'html' | 'json' | 'yaml' | 'pdf' | 'docx' | 'xlsx' | 'image' | 'unknown';

export interface ParseInput {
  sourcePath: string;
  content: string | Buffer;
  /** 可选:显式声明格式 (用于 base64/file 等无扩展名场景) */
  format?: DocFormat;
  /** OCR 输出 (image 格式时使用) */
  ocrText?: string;
  /** 文档元数据 */
  meta?: Record<string, unknown>;
}

export interface ParseResult {
  chunks: DocumentChunk[];
  format: DocFormat;
  /** 解析是否成功 */
  success: boolean;
  /** 错误信息 (success=false 时) */
  error?: string;
  /** 解析耗时 (ms) */
  durationMs: number;
  /** 文档统计 */
  stats: {
    bytes: number;
    characters: number;
    lines: number;
    tables: number;
    images: number;
  };
}

export interface ParseOptions {
  /** 最大 chunk token 数 (默认 512) */
  maxTokensPerChunk?: number;
  /** 包含的 kinds */
  kinds?: DocumentChunk['metadata']['kind'][];
}

// ── Format Detection ──

export function detectFormat(sourcePath: string, content?: string | Buffer): DocFormat {
  const ext = sourcePath.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'txt':
    case 'log':
      return 'text';
    case 'html':
    case 'htm':
      return 'html';
    case 'json':
      return 'json';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    case 'xlsx':
    case 'xls':
    case 'csv':
      return 'xlsx';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
    case 'gif':
      return 'image';
    default:
      // fallback: 内容嗅探
      if (content && typeof content === 'string') {
        if (content.trimStart().startsWith('{') || content.trimStart().startsWith('[')) return 'json';
        if (content.includes('<!DOCTYPE html>') || content.includes('<html')) return 'html';
        if (content.includes('# ') || content.includes('## ')) return 'markdown';
      }
      return 'unknown';
  }
}

// ── Parsers ──

interface MarkdownParser {
  parse(content: string, options: ParseOptions): DocumentChunk[];
}

const markdownParser: MarkdownParser = {
  parse(content, options) {
    const maxTokens = options.maxTokensPerChunk ?? 512;
    const chunks: DocumentChunk[] = [];
    const lines = content.split('\n');
    let currentTitle = '';
    let currentSection = '';
    let buffer: string[] = [];
    let chunkIndex = 0;

    const flush = () => {
      const text = buffer.join('\n').trim();
      if (!text) return;
      const tokens = estimateTokens(text);
      if (tokens <= maxTokens) {
        chunks.push(makeChunk(text, currentTitle, currentSection, chunkIndex++));
      } else {
        // 超长 section 按段落切分
        const paragraphs = text.split(/\n\s*\n/);
        for (const p of paragraphs) {
          chunks.push(makeChunk(p.trim(), currentTitle, currentSection, chunkIndex++));
        }
      }
      buffer = [];
    };

    for (const line of lines) {
      const h1 = line.match(/^#\s+(.+)$/);
      const h2 = line.match(/^##\s+(.+)$/);
      const h3 = line.match(/^###\s+(.+)$/);
      if (h1) { flush(); currentTitle = h1[1].trim(); }
      else if (h2 || h3) { flush(); currentSection = (h2?.[1] ?? h3?.[1] ?? '').trim(); }
      else if (line.trim() === '') flush();
      else buffer.push(line);
    }
    flush();
    return chunks;
  },
};

function makeChunk(content: string, title: string, section: string, index: number): DocumentChunk {
  return {
    id: `chunk-${Buffer.from(`${title}-${section}-${index}`).toString('base64').slice(0, 8)}`,
    sourcePath: '',
    chunkIndex: index,
    content,
    tokenCount: estimateTokens(content),
    metadata: { title, section, kind: 'doc' },
    createdAt: new Date().toISOString(),
  };
}

function estimateTokens(text: string): number {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const words = text.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length;
  return Math.ceil(cjk / 1.5) + words;
}

// ── HTML Parser (tag stripper) ──

function parseHtml(content: string, options: ParseOptions): DocumentChunk[] {
  // 移除 script/style
  const cleaned = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return markdownParser.parse(cleaned, options);
}

// ── JSON Parser ──

function parseJson(content: string, options: ParseOptions): DocumentChunk[] {
  try {
    const obj = JSON.parse(content);
    const flattened = flattenJson(obj);
    return markdownParser.parse(flattened, options);
  } catch (e) {
    // 解析失败 → 当文本处理
    return markdownParser.parse(content, options);
  }
}

function flattenJson(obj: unknown, prefix = ''): string {
  if (obj === null || obj === undefined) return `${prefix}: null\n`;
  if (typeof obj !== 'object') return `${prefix}: ${String(obj)}\n`;
  if (Array.isArray(obj)) {
    return obj.map((v, i) => flattenJson(v, `${prefix}[${i}]`)).join('');
  }
  return Object.entries(obj)
    .map(([k, v]) => flattenJson(v, prefix ? `${prefix}.${k}` : k))
    .join('');
}

// ── YAML Parser (mock: 简单 key: value) ──

function parseYaml(content: string, options: ParseOptions): DocumentChunk[] {
  // 简化:当作 indented text 处理
  const lines = content.split('\n').map((l) => l.trimEnd());
  return markdownParser.parse(lines.join('\n'), options);
}

// ── PDF Parser (mock,生产接 pdf-parse) ──

function parsePdf(content: string | Buffer, options: ParseOptions): DocumentChunk[] {
  // V1 mock: PDF 文本通常已经是 extract 后的纯文本
  const text = typeof content === 'string' ? content : content.toString('utf-8');
  // PDF 文本通常有奇怪空格,清理
  const cleaned = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  return markdownParser.parse(cleaned, options);
}

// ── DOCX Parser (mock,生产接 mammoth) ──

function parseDocx(content: string | Buffer, options: ParseOptions): DocumentChunk[] {
  const text = typeof content === 'string' ? content : content.toString('utf-8');
  // DOCX 内部是 XML,简化当 markdown
  return markdownParser.parse(text, options);
}

// ── XLSX Parser (mock,生产接 xlsx) ──

function parseXlsx(content: string | Buffer, options: ParseOptions): DocumentChunk[] {
  const text = typeof content === 'string' ? content : content.toString('utf-8');
  // CSV-like 处理
  const lines = text.split('\n');
  const markdownLines = lines.map((line, i) => {
    const cells = line.split(/[,\t]/);
    if (i === 0) {
      return `| ${cells.join(' | ')} |`;
    }
    return `| ${cells.join(' | ')} |`;
  });
  return markdownParser.parse(markdownLines.join('\n'), options);
}

// ── Image OCR (mock,生产接 tesseract.js) ──

function parseImage(input: ParseInput, options: ParseOptions): DocumentChunk[] {
  const text = input.ocrText ?? `[Image OCR placeholder for ${input.sourcePath}]`;
  return markdownParser.parse(text, options);
}

// ── DocumentParserService ──

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  /**
   * 解析文档 → DocumentChunk[]
   */
  parse(input: ParseInput, options: ParseOptions = {}): ParseResult {
    const start = Date.now();
    const format = input.format ?? detectFormat(input.sourcePath, input.content);
    const bytes = typeof input.content === 'string' ? Buffer.byteLength(input.content, 'utf-8') : input.content.length;
    const text = typeof input.content === 'string' ? input.content : input.content.toString('utf-8');

    let chunks: DocumentChunk[] = [];
    let success = true;
    let error: string | undefined;

    try {
      switch (format) {
        case 'markdown':
          chunks = markdownParser.parse(text, options);
          break;
        case 'text':
          chunks = markdownParser.parse(text, options);
          break;
        case 'html':
          chunks = parseHtml(text, options);
          break;
        case 'json':
          chunks = parseJson(text, options);
          break;
        case 'yaml':
          chunks = parseYaml(text, options);
          break;
        case 'pdf':
          chunks = parsePdf(text, options);
          break;
        case 'docx':
          chunks = parseDocx(text, options);
          break;
        case 'xlsx':
          chunks = parseXlsx(text, options);
          break;
        case 'image':
          chunks = parseImage(input, options);
          break;
        default:
          chunks = markdownParser.parse(text, options);
      }
    } catch (e) {
      success = false;
      error = (e as Error).message;
      this.logger.warn(`[parse] ${input.sourcePath}: ${error}`);
      chunks = [{
        id: `chunk-fallback-${Date.now()}`,
        sourcePath: input.sourcePath,
        chunkIndex: 0,
        content: text.slice(0, 1000),
        tokenCount: Math.ceil(text.length / 4),
        metadata: { kind: 'doc', tags: ['parse-failed'] },
        createdAt: new Date().toISOString(),
      }];
    }

    // 填充 sourcePath
    chunks = chunks.map((c) => ({ ...c, sourcePath: input.sourcePath }));

    // 统计
    const stats = {
      bytes,
      characters: text.length,
      lines: text.split('\n').length,
      tables: (text.match(/\|/g) ?? []).length > 0 ? Math.floor((text.match(/\|/g) ?? []).length / 3) : 0,
      images: (text.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []).length,
    };

    return { chunks, format, success, error, durationMs: Date.now() - start, stats };
  }

  /**
   * 批量解析多文档
   */
  parseBatch(inputs: ParseInput[], options?: ParseOptions): ParseResult[] {
    return inputs.map((input) => this.parse(input, options));
  }
}
