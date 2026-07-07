/**
 * entity-linking.ts - Phase-23 T92
 * 实体链接 + 关系抽取
 *
 * 实体链接 (Entity Linking):
 * - 输入文本 → 识别 mention → 映射到 KG entity
 *
 * 关系抽取 (Relation Extraction):
 * - 输入 (entity1, entity2, context) → 预测 relation type
 *
 * V2 mock 设计:
 * - 实体链接: 子串匹配 + 模糊匹配 (Levenshtein distance)
 * - 关系抽取: 关键词匹配 (e.g., "CEO of" → works_at)
 */
import { Injectable } from '@nestjs/common';
import { KnowledgeGraph, Entity } from './knowledge-graph';

// ── Types ──

export interface EntityMention {
  /** 文本中的 mention */
  text: string;
  /** 在原文本中的偏移 (start, end) */
  span: { start: number; end: number };
  /** 链接到的 entity (如果找到) */
  linkedEntity?: Entity;
  /** 链接置信度 (0-1) */
  confidence: number;
}

export interface EntityLinkingResult {
  mentions: EntityMention[];
  /** 未链接的 mentions (用于人工审查) */
  unresolved: EntityMention[];
}

export interface RelationExtraction {
  from: Entity;
  to: Entity;
  type: string;
  confidence: number;
  /** 抽取依据 (文本片段) */
  evidence: string;
}

// ── Entity Linking ──

/**
 * 计算两个字符串的相似度 (Levenshtein-based)
 */
export function stringSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower === bLower) return 1;
  const maxLen = Math.max(aLower.length, bLower.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(aLower, bLower);
  return 1 - distance / maxLen;
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * 从文本中扫描 entity mention (最长匹配优先, 含 word boundary)
 */
export function extractMentions(text: string, graph: KnowledgeGraph): EntityMention[] {
  const mentions: EntityMention[] = [];

  // 收集所有候选 (name + aliases)
  const candidates: Array<{ name: string; entity: Entity }> = [];
  const seenEntityIds = new Set<string>();
  const allEntities: Entity[] = [];
  for (const entity of graph.listEntitiesByType('Person')) allEntities.push(entity);
  for (const entity of graph.listEntitiesByType('Place')) allEntities.push(entity);
  for (const entity of graph.listEntitiesByType('Product')) allEntities.push(entity);
  for (const entity of graph.listEntitiesByType('Concept')) allEntities.push(entity);
  for (const entity of graph.listEntitiesByType('Company')) allEntities.push(entity);

  for (const entity of allEntities) {
    if (seenEntityIds.has(entity.id)) continue;
    seenEntityIds.add(entity.id);
    candidates.push({ name: entity.name, entity });
    for (const alias of entity.aliases) {
      candidates.push({ name: alias, entity });
    }
  }

  // 按长度倒序扫描 (长实体优先匹配)
  candidates.sort((a, b) => b.name.length - a.name.length);

  const lower = text.toLowerCase();
  const matchedSpans: Array<{ start: number; end: number }> = [];

  for (const c of candidates) {
    const cLower = c.name.toLowerCase();
    // 使用 word boundary regex 防止子串误匹配 (Alice vs Alicee)
    const escaped = cLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(lower)) !== null) {
      const start = match.index;
      const end = start + cLower.length;
      const overlaps = matchedSpans.some((s) => !(end <= s.start || start >= s.end));
      if (!overlaps) {
        mentions.push({
          text: text.slice(start, end),
          span: { start, end },
          linkedEntity: c.entity,
          confidence: 1.0,
        });
        matchedSpans.push({ start, end });
      }
    }
  }

  mentions.sort((a, b) => a.span.start - b.span.start);
  return mentions;
}

// ── Relation Extraction ──

const RELATION_KEYWORDS: Array<{ type: string; keywords: string[] }> = [
  { type: 'works_at', keywords: ['works at', 'ceo of', 'employed by', 'founder of'] },
  { type: 'located_in', keywords: ['located in', 'based in', 'headquartered in'] },
  { type: 'owns', keywords: ['owns', 'acquired', 'bought'] },
  { type: 'partners_with', keywords: ['partners with', 'collaborates with'] },
  { type: 'competes_with', keywords: ['competes with', 'rival of'] },
];

/**
 * 关系抽取: 从 (entity1, entity2, context) 推断 relation
 */
export function extractRelation(
  from: Entity,
  to: Entity,
  context: string,
): RelationExtraction | undefined {
  const lower = context.toLowerCase();
  for (const rule of RELATION_KEYWORDS) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        return {
          from,
          to,
          type: rule.type,
          confidence: 0.8, // mock 固定置信度
          evidence: context.slice(Math.max(0, lower.indexOf(kw) - 20), lower.indexOf(kw) + kw.length + 20),
        };
      }
    }
  }
  return undefined;
}

// ── EntityLinker Service ──

export interface EntityLinkerConfig {
  /** 模糊匹配最低相似度阈值 (默认 0.85) */
  fuzzyThreshold?: number;
  /** 是否启用模糊匹配 (默认 true) */
  enableFuzzy?: boolean;
}

@Injectable()
export class EntityLinker {
  private readonly fuzzyThreshold: number;
  private readonly enableFuzzy: boolean;

  constructor(config: EntityLinkerConfig = {}) {
    this.fuzzyThreshold = config.fuzzyThreshold ?? 0.85;
    this.enableFuzzy = config.enableFuzzy ?? true;
  }

  /**
   * 链接文本中所有 entity mentions
   */
  link(text: string, graph: KnowledgeGraph): EntityLinkingResult {
    // 1. 精确匹配
    const mentions = extractMentions(text, graph);

    // 2. 模糊匹配未解析的单词
    if (this.enableFuzzy) {
      const allEntities: Entity[] = [];
      for (const e of graph.listEntitiesByType('Person')) allEntities.push(e);
      for (const e of graph.listEntitiesByType('Place')) allEntities.push(e);
      for (const e of graph.listEntitiesByType('Product')) allEntities.push(e);
      for (const e of graph.listEntitiesByType('Concept')) allEntities.push(e);
      for (const e of graph.listEntitiesByType('Company')) allEntities.push(e);

      const words = text.split(/\s+/).filter((w) => w.length > 2);
      for (const word of words) {
        const wordIdx = text.toLowerCase().indexOf(word.toLowerCase());
        const alreadyLinked = mentions.some(
          (m) => m.span.start <= wordIdx && m.span.end >= wordIdx + word.length,
        );
        if (alreadyLinked) continue;
        // 模糊匹配
        let bestMatch: { entity: Entity; score: number } | undefined;
        for (const e of allEntities) {
          const sim = Math.max(
            stringSimilarity(word, e.name),
            ...e.aliases.map((a) => stringSimilarity(word, a)),
          );
          if (sim >= this.fuzzyThreshold && (!bestMatch || sim > bestMatch.score)) {
            bestMatch = { entity: e, score: sim };
          }
        }
        if (bestMatch) {
          const idx = text.indexOf(word);
          mentions.push({
            text: word,
            span: { start: idx, end: idx + word.length },
            linkedEntity: bestMatch.entity,
            confidence: bestMatch.score,
          });
        }
      }
    }

    mentions.sort((a, b) => a.span.start - b.span.start);
    return {
      mentions,
      unresolved: mentions.filter((m) => !m.linkedEntity),
    };
  }

  /**
   * 从链接的 mentions 抽取 relations
   */
  extractRelations(text: string, linkResult: EntityLinkingResult): RelationExtraction[] {
    const linked = linkResult.mentions.filter((m) => m.linkedEntity);
    const extractions: RelationExtraction[] = [];

    for (let i = 0; i < linked.length; i++) {
      for (let j = i + 1; j < linked.length; j++) {
        const a = linked[i].linkedEntity!;
        const b = linked[j].linkedEntity!;
        // 提取两个 mention 之间的 context
        const start = linked[i].span.end;
        const end = linked[j].span.start;
        if (end <= start) continue;
        const context = text.slice(start, end);
        const extraction = extractRelation(a, b, context) ?? extractRelation(b, a, context);
        if (extraction) extractions.push(extraction);
      }
    }

    return extractions;
  }

  /**
   * 一步完成 link + extract + write to graph
   */
  ingest(text: string, graph: KnowledgeGraph): { mentions: number; relations: number } {
    const linkResult = this.link(text, graph);
    const relations = this.extractRelations(text, linkResult);
    let written = 0;
    for (const rel of relations) {
      try {
        graph.addRelation({
          from: rel.from.id,
          to: rel.to.id,
          type: rel.type,
          properties: {},
          confidence: rel.confidence,
        });
        written++;
      } catch {
        // ignore (entity not found)
      }
    }
    return { mentions: linkResult.mentions.length, relations: written };
  }
}
