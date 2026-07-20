import type { CollabProject, CollabStatus } from './collab.entity'

/**
 * 联名项目合约（对外响应结构）
 */
export interface CollabProjectContract {
  projectId: string
  name: string
  brandId: string
  brandName?: string
  startDate: string
  endDate: string
  status: CollabStatus
  revenueShareRate: number
  budget: number
  description?: string
  createdAt: string
  updatedAt: string
}

/**
 * 将实体转换为合约格式
 */
export function toCollabProjectContract(project: CollabProject): CollabProjectContract {
  return {
    projectId: project.projectId,
    name: project.name,
    brandId: project.brandId,
    brandName: project.brandName,
    startDate: project.startDate,
    endDate: project.endDate,
    status: project.status,
    revenueShareRate: project.revenueShareRate,
    budget: project.budget,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}
