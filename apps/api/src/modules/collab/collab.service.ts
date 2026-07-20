import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { CollabStatus, type CollabProject } from './collab.entity'

/** 内存存储（Phase 1 简化实现，后续可替换为 DB） */
const collabStore = new Map<string, CollabProject>()

export interface CreateCollabInput {
  tenantContext: RequestTenantContext
  name: string
  brandId: string
  brandName?: string
  startDate: string
  endDate: string
  revenueShareRate: number
  budget: number
  description?: string
}

export interface UpdateCollabInput {
  name?: string
  brandId?: string
  brandName?: string
  startDate?: string
  endDate?: string
  status?: CollabStatus
  revenueShareRate?: number
  budget?: number
  description?: string
}

export interface CollabFilter {
  status?: CollabStatus
  brandId?: string
  name?: string
}

@Injectable()
export class CollabService {
  /**
   * 创建联名项目
   */
  create(input: CreateCollabInput): CollabProject {
    if (input.revenueShareRate < 0 || input.revenueShareRate > 100) {
      throw new Error('Revenue share rate must be between 0 and 100')
    }
    if (input.budget < 0) {
      throw new Error('Budget must be non-negative')
    }
    if (new Date(input.endDate) <= new Date(input.startDate)) {
      throw new Error('End date must be after start date')
    }
    const now = new Date().toISOString()
    const project: CollabProject = {
      projectId: `collab-${randomUUID()}`,
      tenantContext: input.tenantContext,
      tenantId: input.tenantContext.tenantId,
      name: input.name,
      brandId: input.brandId,
      brandName: input.brandName,
      startDate: input.startDate,
      endDate: input.endDate,
      status: CollabStatus.Draft,
      revenueShareRate: input.revenueShareRate,
      budget: input.budget,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    }
    collabStore.set(project.projectId, project)
    return project
  }

  /**
   * 根据 ID 查找联名项目
   */
  findById(projectId: string, tenantId: string): CollabProject | undefined {
    const project = collabStore.get(projectId)
    if (!project || project.tenantContext.tenantId !== tenantId) {
      return undefined
    }
    return project
  }

  /**
   * 查询联名项目列表（支持状态/品牌/名称过滤）
   */
  findAll(tenantId: string, filter?: CollabFilter): CollabProject[] {
    const results: CollabProject[] = []
    for (const project of collabStore.values()) {
      if (project.tenantContext.tenantId !== tenantId) continue
      if (filter?.status && project.status !== filter.status) continue
      if (filter?.brandId && project.brandId !== filter.brandId) continue
      if (filter?.name && !project.name.toLowerCase().includes(filter.name.toLowerCase())) continue
      results.push(project)
    }
    // 按创建时间降序排列
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return results
  }

  /**
   * 更新联名项目（部分更新）
   */
  update(projectId: string, tenantId: string, input: UpdateCollabInput): CollabProject {
    const project = collabStore.get(projectId)
    if (!project || project.tenantContext.tenantId !== tenantId) {
      throw new Error(`Collab project not found: ${projectId}`)
    }

    if (input.name !== undefined) project.name = input.name
    if (input.brandId !== undefined) project.brandId = input.brandId
    if (input.brandName !== undefined) project.brandName = input.brandName
    if (input.startDate !== undefined) project.startDate = input.startDate
    if (input.endDate !== undefined) project.endDate = input.endDate
    if (input.revenueShareRate !== undefined) {
      if (input.revenueShareRate < 0 || input.revenueShareRate > 100) {
        throw new Error('Revenue share rate must be between 0 and 100')
      }
      project.revenueShareRate = input.revenueShareRate
    }
    if (input.budget !== undefined) {
      if (input.budget < 0) {
        throw new Error('Budget must be non-negative')
      }
      project.budget = input.budget
    }
    if (input.description !== undefined) project.description = input.description

    // 状态变更：验证合法性
    if (input.status !== undefined) {
      this.assertValidStatusTransition(project.status, input.status)
      project.status = input.status
    }

    project.updatedAt = new Date().toISOString()
    collabStore.set(projectId, project)
    return project
  }

  /**
   * 删除联名项目
   */
  delete(projectId: string, tenantId: string): void {
    const project = collabStore.get(projectId)
    if (!project || project.tenantContext.tenantId !== tenantId) {
      throw new Error(`Collab project not found: ${projectId}`)
    }
    collabStore.delete(projectId)
  }

  /**
   * 按状态统计项目数量
   */
  countByStatus(tenantId: string): Record<CollabStatus, number> {
    const counts: Record<string, number> = {}
    for (const s of Object.values(CollabStatus)) {
      counts[s] = 0
    }
    for (const project of collabStore.values()) {
      if (project.tenantContext.tenantId === tenantId) {
        counts[project.status] = (counts[project.status] ?? 0) + 1
      }
    }
    return counts as Record<CollabStatus, number>
  }

  /**
   * 验证状态转换合法性
   *
   * 规则:
   *  Draft → NEGOTIATING
   *  NEGOTIATING → ACTIVE | CANCELLED
   *  ACTIVE → PAUSED | COMPLETED
   *  PAUSED → ACTIVE | CANCELLED
   *  COMPLETED → (终结态)
   *  CANCELLED → (终结态)
   */
  private assertValidStatusTransition(from: CollabStatus, to: CollabStatus): void {
    const validTransitions: Record<CollabStatus, CollabStatus[]> = {
      [CollabStatus.Draft]: [CollabStatus.Negotiating, CollabStatus.Cancelled],
      [CollabStatus.Negotiating]: [CollabStatus.Active, CollabStatus.Cancelled],
      [CollabStatus.Active]: [CollabStatus.Paused, CollabStatus.Completed],
      [CollabStatus.Paused]: [CollabStatus.Active, CollabStatus.Cancelled],
      [CollabStatus.Completed]: [],
      [CollabStatus.Cancelled]: [],
    }
    const allowed = validTransitions[from]
    if (!allowed.includes(to)) {
      throw new Error(`Invalid collab status transition: ${from} → ${to}`)
    }
  }

  /** 测试辅助：清空存储 */
  static _resetStoreForTest(): void {
    collabStore.clear()
  }
}
