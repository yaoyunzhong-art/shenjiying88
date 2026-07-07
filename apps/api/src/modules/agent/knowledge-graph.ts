/**
 * knowledge-graph.ts - Phase-23 T90
 * 知识图谱 (Knowledge Graph)
 *
 * 设计:
 * - Entity (节点): 人/事/物/概念
 * - Relation (边): 关系 (有向 + 带类型)
 * - GraphQuery: 1-hop / 2-hop / shortestPath / 子图提取
 * - V2 mock: in-memory adjacency list (生产接 Neo4j / Memgraph)
 *
 * 应用:
 * - 实体识别 (NER)
 * - 关系抽取 (RE)
 * - 子图检索 (subgraph extraction for GraphRAG)
 */
import { Injectable } from '@nestjs/common';

// ── Types ──

export interface Entity {
  id: string;
  /** 实体类型 (Person / Place / Product / Concept) */
  type: string;
  /** 实体名称 */
  name: string;
  /** 别名 (用于实体链接) */
  aliases: string[];
  /** 属性 (灵活 KV) */
  properties: Record<string, unknown>;
  /** 创建时间 */
  createdAt: number;
}

export interface Relation {
  id: string;
  /** 起始实体 id */
  from: string;
  /** 目标实体 id */
  to: string;
  /** 关系类型 (works_at / located_in / owns / ...) */
  type: string;
  /** 关系属性 */
  properties: Record<string, unknown>;
  /** 置信度 (0-1) */
  confidence: number;
  /** 创建时间 */
  createdAt: number;
}

export interface GraphNode {
  entity: Entity;
  /** 距离 (从查询起点) */
  distance: number;
}

export interface GraphQueryResult {
  nodes: GraphNode[];
  relations: Relation[];
  /** 子图统计 */
  stats: {
    nodeCount: number;
    relationCount: number;
    maxDepth: number;
  };
}

// ── KnowledgeGraph ──

@Injectable()
export class KnowledgeGraph {
  private readonly entities = new Map<string, Entity>();
  private readonly relations = new Map<string, Relation>();
  /** 出边索引 (from id → relation ids) */
  private readonly outIndex = new Map<string, Set<string>>();
  /** 入边索引 (to id → relation ids) */
  private readonly inIndex = new Map<string, Set<string>>();
  /** 名称索引 (lowercase name → entity id) 用于快速查找 */
  private readonly nameIndex = new Map<string, string>();

  // ── Entity CRUD ──

  addEntity(entity: Omit<Entity, 'id' | 'createdAt'> & { id?: string }): Entity {
    const id = entity.id ?? `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const e: Entity = {
      id,
      type: entity.type,
      name: entity.name,
      aliases: entity.aliases ?? [],
      properties: entity.properties ?? {},
      createdAt: Date.now(),
    };
    this.entities.set(id, e);
    this.nameIndex.set(e.name.toLowerCase(), id);
    for (const alias of e.aliases) {
      this.nameIndex.set(alias.toLowerCase(), id);
    }
    return e;
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * 按名称查找实体 (含 aliases)
   */
  findEntityByName(name: string): Entity | undefined {
    const id = this.nameIndex.get(name.toLowerCase());
    return id ? this.entities.get(id) : undefined;
  }

  deleteEntity(id: string): boolean {
    const e = this.entities.get(id);
    if (!e) return false;
    this.entities.delete(id);
    this.nameIndex.delete(e.name.toLowerCase());
    for (const alias of e.aliases) {
      this.nameIndex.delete(alias.toLowerCase());
    }
    // 删除相关 relation
    const outRels = this.outIndex.get(id);
    if (outRels) {
      for (const relId of outRels) {
        const rel = this.relations.get(relId);
        if (rel) this.relations.delete(relId);
      }
      this.outIndex.delete(id);
    }
    const inRels = this.inIndex.get(id);
    if (inRels) {
      for (const relId of inRels) {
        const rel = this.relations.get(relId);
        if (rel) this.relations.delete(relId);
      }
      this.inIndex.delete(id);
    }
    return true;
  }

  // ── Relation CRUD ──

  addRelation(rel: Omit<Relation, 'id' | 'createdAt'> & { id?: string }): Relation {
    const id = rel.id ?? `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const r: Relation = {
      id,
      from: rel.from,
      to: rel.to,
      type: rel.type,
      properties: rel.properties ?? {},
      confidence: rel.confidence ?? 1.0,
      createdAt: Date.now(),
    };
    if (!this.entities.has(r.from) || !this.entities.has(r.to)) {
      throw new Error(`Cannot add relation: entity not found (${r.from} → ${r.to})`);
    }
    this.relations.set(id, r);
    if (!this.outIndex.has(r.from)) this.outIndex.set(r.from, new Set());
    this.outIndex.get(r.from)!.add(id);
    if (!this.inIndex.has(r.to)) this.inIndex.set(r.to, new Set());
    this.inIndex.get(r.to)!.add(id);
    return r;
  }

  getRelation(id: string): Relation | undefined {
    return this.relations.get(id);
  }

  deleteRelation(id: string): boolean {
    const r = this.relations.get(id);
    if (!r) return false;
    this.relations.delete(id);
    this.outIndex.get(r.from)?.delete(id);
    this.inIndex.get(r.to)?.delete(id);
    return true;
  }

  // ── Graph Query ──

  /**
   * 1-hop 邻居 (from → to or to → from)
   */
  getNeighbors(entityId: string, direction: 'out' | 'in' | 'both' = 'both'): Relation[] {
    const rels: Relation[] = [];
    if (direction === 'out' || direction === 'both') {
      const outRels = this.outIndex.get(entityId);
      if (outRels) {
        for (const relId of outRels) {
          const r = this.relations.get(relId);
          if (r) rels.push(r);
        }
      }
    }
    if (direction === 'in' || direction === 'both') {
      const inRels = this.inIndex.get(entityId);
      if (inRels) {
        for (const relId of inRels) {
          const r = this.relations.get(relId);
          if (r) rels.push(r);
        }
      }
    }
    return rels;
  }

  /**
   * BFS 子图提取 (从起点展开 maxHops 跳)
   */
  subgraph(startId: string, maxHops = 2, relationTypes?: string[]): GraphQueryResult {
    const visited = new Map<string, GraphNode>();
    const relations: Relation[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      const entity = this.entities.get(id);
      if (!entity) continue;
      visited.set(id, { entity, distance: depth });

      if (depth < maxHops) {
        const neighbors = this.getNeighbors(id, 'both');
        for (const rel of neighbors) {
          if (relationTypes && !relationTypes.includes(rel.type)) continue;
          if (!relations.find((r) => r.id === rel.id)) {
            relations.push(rel);
          }
          const nextId = rel.from === id ? rel.to : rel.from;
          if (!visited.has(nextId)) {
            queue.push({ id: nextId, depth: depth + 1 });
          }
        }
      }
    }

    return {
      nodes: Array.from(visited.values()),
      relations,
      stats: {
        nodeCount: visited.size,
        relationCount: relations.length,
        maxDepth: Math.max(...Array.from(visited.values()).map((n) => n.distance), 0),
      },
    };
  }

  /**
   * 最短路径 (BFS)
   */
  shortestPath(fromId: string, toId: string): Relation[] | undefined {
    if (fromId === toId) return [];
    const visited = new Set<string>([fromId]);
    const queue: Array<{ id: string; path: Relation[] }> = [{ id: fromId, path: [] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      const neighbors = this.getNeighbors(id, 'both');
      for (const rel of neighbors) {
        const nextId = rel.from === id ? rel.to : rel.from;
        if (visited.has(nextId)) continue;
        const newPath = [...path, rel];
        if (nextId === toId) return newPath;
        visited.add(nextId);
        queue.push({ id: nextId, path: newPath });
      }
    }
    return undefined;
  }

  /**
   * 按 type 列出实体
   */
  listEntitiesByType(type: string): Entity[] {
    return Array.from(this.entities.values()).filter((e) => e.type === type);
  }

  /**
   * 按 relation type 列出
   */
  listRelationsByType(type: string): Relation[] {
    return Array.from(this.relations.values()).filter((r) => r.type === type);
  }

  /**
   * 统计
   */
  stats(): { entityCount: number; relationCount: number; entityTypes: string[]; relationTypes: string[] } {
    const entityTypes = new Set(Array.from(this.entities.values()).map((e) => e.type));
    const relationTypes = new Set(Array.from(this.relations.values()).map((r) => r.type));
    return {
      entityCount: this.entities.size,
      relationCount: this.relations.size,
      entityTypes: Array.from(entityTypes),
      relationTypes: Array.from(relationTypes),
    };
  }
}
