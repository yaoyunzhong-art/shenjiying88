/**
 * lowcode.contract.ts
 * 低代码模块跨模块合约类型定义
 */
import type { LowcodePage as LowcodePageEntity, LowcodeComponent } from './lowcode-page.entity'
import type { LowcodeTemplate } from './lowcode.entity'

/**
 * 页面摘要合约（跨模块安全子集）
 */
export interface LowcodePageContract {
  id: string
  name: string
  templateId: string
  status: 'draft' | 'published'
  components: LowcodeComponentContract[]
  createdAt: Date
  updatedAt: Date
}

/**
 * 组件合约（跨模块安全子集）
 */
export interface LowcodeComponentContract {
  id: string
  type: string
  props: Record<string, unknown>
}

/**
 * 模板合约（跨模块安全子集）
 */
export interface LowcodeTemplateContract {
  id: string
  name: string
  description?: string
  components: Array<{ type: string; defaultProps: Record<string, unknown> }>
  status: string
}

/**
 * 页面渲染结果合约
 */
export interface LowcodeRenderResultContract {
  pageId: string
  html: string
  renderedAt: string
}

/**
 * 快照合约
 */
export interface LowcodeSnapshotContract {
  id: string
  pageId: string
  version: number
  changelog?: string
  publishedBy?: string
  createdAt: Date
}

/**
 * 仪表盘统计合约
 */
export interface LowcodeDashboardContract {
  totalPages: number
  publishedPages: number
  draftPages: number
  totalTemplates: number
  totalComponents: number
  totalSnapshots: number
}

// ─── Contract Mappers ───────────────────────

/** 页面实体 → 合约 */
export function toPageContract(entity: LowcodePageEntity): LowcodePageContract {
  return {
    id: entity.id,
    name: entity.name,
    templateId: entity.templateId,
    status: entity.status as 'draft' | 'published',
    components: (entity.components ?? []).map(toComponentContract),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  }
}

/** 组件实体 → 合约 */
export function toComponentContract(entity: LowcodeComponent): LowcodeComponentContract {
  return {
    id: entity.id,
    type: entity.type,
    props: entity.props ?? {},
  }
}

/** 模板实体 → 合约 */
export function toTemplateContract(entity: LowcodeTemplate): LowcodeTemplateContract {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    components: entity.components ?? [],
    status: entity.status,
  }
}
