import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  ProbationStatus,
  ProbationDuration,
  type ProbationTransfer,
  type ProbationStats,
} from './probation-transfer.entity'

// ── In-memory store ──

const transferStore = new Map<string, ProbationTransfer>()

@Injectable()
export class ProbationTransferService {
  // ═══════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════

  createTransfer(input: {
    tenantId: string
    employeeId: string
    employeeName: string
    department: string
    position: string
    probationDuration: ProbationDuration
    probationStart: string
    probationEnd: string
    evaluation: string
    approver: string
  }): ProbationTransfer {
    const now = new Date().toISOString()
    const transfer: ProbationTransfer = {
      id: `transfer-${randomUUID()}`,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      department: input.department,
      position: input.position,
      probationDuration: input.probationDuration,
      probationStart: input.probationStart,
      probationEnd: input.probationEnd,
      status: ProbationStatus.Ongoing,
      evaluation: input.evaluation,
      approver: input.approver,
      tenantId: input.tenantId,
      createdAt: now,
      updatedAt: now,
    }
    transferStore.set(transfer.id, transfer)
    return transfer
  }

  getTransfer(transferId: string, tenantId: string): ProbationTransfer | undefined {
    const t = transferStore.get(transferId)
    if (!t || t.tenantId !== tenantId) return undefined
    return t
  }

  listTransfers(
    tenantId: string,
    filters?: {
      status?: ProbationStatus
      employeeId?: string
      department?: string
      approver?: string
      fromDate?: string
      toDate?: string
    },
  ): ProbationTransfer[] {
    const all = Array.from(transferStore.values())
    return all.filter((t) => {
      if (t.tenantId !== tenantId) return false
      if (filters?.status && t.status !== filters.status) return false
      if (filters?.employeeId && t.employeeId !== filters.employeeId) return false
      if (filters?.department && t.department !== filters.department) return false
      if (filters?.approver && t.approver !== filters.approver) return false
      if (filters?.fromDate && t.probationStart < filters.fromDate) return false
      if (filters?.toDate && t.probationEnd > filters.toDate) return false
      return true
    })
  }

  // ═══════════════════════════════════════════════════════════════════
  // Approval Flow
  // ═══════════════════════════════════════════════════════════════════

  approveTransfer(
    transferId: string,
    status: ProbationStatus,
    tenantId: string,
    options?: {
      performanceRating?: string
      approvalRemark?: string
      rejectReason?: string
    },
  ): ProbationTransfer {
    const transfer = this.getTransfer(transferId, tenantId)
    if (!transfer) {
      throw new Error(`Probation transfer not found: ${transferId}`)
    }
    if (transfer.status !== ProbationStatus.Ongoing) {
      throw new Error(`Cannot approve a transfer that is already ${transfer.status}`)
    }
    const now = new Date().toISOString()
    const updated: ProbationTransfer = {
      ...transfer,
      status,
      transferDate: status === ProbationStatus.Completed ? now : undefined,
      performanceRating: options?.performanceRating ?? transfer.performanceRating,
      approvalRemark: options?.approvalRemark ?? transfer.approvalRemark,
      rejectReason: options?.rejectReason ?? transfer.rejectReason,
      updatedAt: now,
    }
    transferStore.set(transferId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Statistics
  // ═══════════════════════════════════════════════════════════════════════

  getStats(tenantId: string): ProbationStats {
    const transfers = this.listTransfers(tenantId)

    // byStatus
    const byStatus = {
      [ProbationStatus.Ongoing]: 0,
      [ProbationStatus.Completed]: 0,
      [ProbationStatus.Extended]: 0,
      [ProbationStatus.Terminated]: 0,
    }
    for (const t of transfers) {
      byStatus[t.status]++
    }

    // byDepartment
    const deptMap = new Map<string, number>()
    for (const t of transfers) {
      const cur = deptMap.get(t.department) ?? 0
      deptMap.set(t.department, cur + 1)
    }
    const byDepartment = Array.from(deptMap.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)

    // rates
    const total = transfers.length
    const completedCount = byStatus[ProbationStatus.Completed]
    const extendedCount = byStatus[ProbationStatus.Extended]
    const terminatedCount = byStatus[ProbationStatus.Terminated]
    const decidedCount = completedCount + extendedCount + terminatedCount

    const completedRate = decidedCount > 0 ? completedCount / decidedCount : 0
    const extensionRate = decidedCount > 0 ? extendedCount / decidedCount : 0
    const terminationRate = decidedCount > 0 ? terminatedCount / decidedCount : 0

    // averageDurationDays（从申请到审批）
    const completed = transfers.filter(
      (t) => t.status === ProbationStatus.Completed && t.transferDate,
    )
    let averageDurationDays = 0
    if (completed.length > 0) {
      let totalDays = 0
      for (const t of completed) {
        const start = new Date(t.probationStart).getTime()
        const end = new Date(t.transferDate!).getTime()
        totalDays += Math.round((end - start) / (1000 * 60 * 60 * 24))
      }
      averageDurationDays = Math.round(totalDays / completed.length)
    }

    // monthlyTrend
    const monthMap = new Map<string, { completed: number; extended: number; terminated: number }>()
    for (const t of transfers) {
      if (t.status !== ProbationStatus.Completed && t.status !== ProbationStatus.Extended && t.status !== ProbationStatus.Terminated) continue
      const month = (t.transferDate ?? t.updatedAt).slice(0, 7)
      const cur = monthMap.get(month) ?? { completed: 0, extended: 0, terminated: 0 }
      if (t.status === ProbationStatus.Completed) cur.completed++
      else if (t.status === ProbationStatus.Extended) cur.extended++
      else if (t.status === ProbationStatus.Terminated) cur.terminated++
      monthMap.set(month, cur)
    }
    const monthlyTrend = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // performanceDistribution
    const perfMap = new Map<string, number>()
    for (const t of transfers) {
      if (t.performanceRating) {
        const cur = perfMap.get(t.performanceRating) ?? 0
        perfMap.set(t.performanceRating, cur + 1)
      }
    }
    const performanceDistribution = Array.from(perfMap.entries())
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => b.count - a.count)

    return {
      total,
      byStatus,
      byDepartment,
      completedRate,
      extensionRate,
      terminationRate,
      averageDurationDays,
      monthlyTrend,
      performanceDistribution,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Mock Data
  // ═══════════════════════════════════════════════════════════════════

  seedMockData(tenantId: string): void {
    const mockData: Array<{
      employeeId: string
      employeeName: string
      department: string
      position: string
      probationDuration: ProbationDuration
      probationStart: string
      probationEnd: string
      evaluation: string
      approver: string
      status: ProbationStatus
      performanceRating?: string
      approvalRemark?: string
      rejectReason?: string
    }> = [
      {
        employeeId: 'EMP-001', employeeName: '张三',
        department: '运营部', position: '活动策划专员',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-04-01', probationEnd: '2026-06-30',
        evaluation: '表现优异，提前完成试用期目标，团队协作良好',
        approver: '李经理',
        status: ProbationStatus.Completed,
        performanceRating: 'A',
        approvalRemark: '表现优秀，正式录用',
      },
      {
        employeeId: 'EMP-002', employeeName: '李四',
        department: '技术部', position: '前端开发工程师',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-04-15', probationEnd: '2026-07-14',
        evaluation: '技术能力达标，但项目交付节奏需加快',
        approver: '王总监',
        status: ProbationStatus.Completed,
        performanceRating: 'B',
        approvalRemark: '基本合格，正式录用',
      },
      {
        employeeId: 'EMP-003', employeeName: '王五',
        department: '销售部', position: '客户经理',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-05-01', probationEnd: '2026-07-31',
        evaluation: '业绩达标率120%，客户满意度高',
        approver: '赵总监',
        status: ProbationStatus.Ongoing,
      },
      {
        employeeId: 'EMP-004', employeeName: '赵六',
        department: '运营部', position: '内容运营',
        probationDuration: ProbationDuration.SixMonths,
        probationStart: '2026-01-01', probationEnd: '2026-06-30',
        evaluation: '内容产出稳定，但创新能力不足',
        approver: '李经理',
        status: ProbationStatus.Extended,
        performanceRating: 'C',
        approvalRemark: '延长试用期2个月，需进一步提升创新能力',
      },
      {
        employeeId: 'EMP-005', employeeName: '孙七',
        department: '人事部', position: 'HR专员',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-03-01', probationEnd: '2026-05-31',
        evaluation: '工作认真细致，招聘效率高',
        approver: '人事总监',
        status: ProbationStatus.Completed,
        performanceRating: 'A',
        approvalRemark: '表现突出，正式录用',
      },
      {
        employeeId: 'EMP-006', employeeName: '周八',
        department: '技术部', position: '后端开发工程师',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-06-01', probationEnd: '2026-08-31',
        evaluation: '基础扎实，学习能力强',
        approver: '王总监',
        status: ProbationStatus.Ongoing,
      },
      {
        employeeId: 'EMP-007', employeeName: '吴九',
        department: '市场部', position: '市场专员',
        probationDuration: ProbationDuration.TwoMonths,
        probationStart: '2026-05-15', probationEnd: '2026-07-14',
        evaluation: '市场活动执行能力一般，沟通需改进',
        approver: '市场总监',
        status: ProbationStatus.Terminated,
        performanceRating: 'D',
        rejectReason: '试用期评估不合格，未达到岗位要求',
      },
      {
        employeeId: 'EMP-008', employeeName: '郑十',
        department: '财务部', position: '会计',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-06-15', probationEnd: '2026-09-14',
        evaluation: '财务基础扎实，工作严谨',
        approver: '财务总监',
        status: ProbationStatus.Ongoing,
      },
      {
        employeeId: 'EMP-009', employeeName: '陈一',
        department: '运营部', position: '新媒体运营',
        probationDuration: ProbationDuration.OneMonth,
        probationStart: '2026-07-01', probationEnd: '2026-07-31',
        evaluation: '创意丰富，适合岗位要求',
        approver: '李经理',
        status: ProbationStatus.Ongoing,
      },
      {
        employeeId: 'EMP-010', employeeName: '黄二',
        department: '销售部', position: '销售代表',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-02-01', probationEnd: '2026-04-30',
        evaluation: '业绩未达预期，缺乏主动性',
        approver: '赵总监',
        status: ProbationStatus.Extended,
        performanceRating: 'C',
        approvalRemark: '延长试用期1个月，需达到月度KPI',
      },
    ]

    for (const m of mockData) {
      const t = this.createTransfer({
        tenantId,
        employeeId: m.employeeId,
        employeeName: m.employeeName,
        department: m.department,
        position: m.position,
        probationDuration: m.probationDuration,
        probationStart: m.probationStart,
        probationEnd: m.probationEnd,
        evaluation: m.evaluation,
        approver: m.approver,
      })
      // Override status if not Ongoing
      if (m.status !== ProbationStatus.Ongoing) {
        transferStore.set(t.id, {
          ...transferStore.get(t.id)!,
          status: m.status,
          transferDate: new Date().toISOString(),
          performanceRating: m.performanceRating,
          approvalRemark: m.approvalRemark,
          rejectReason: m.rejectReason,
          updatedAt: new Date().toISOString(),
        })
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test Helpers
  // ═══════════════════════════════════════════════════════════════════

  resetTransferStoresForTests(): void {
    transferStore.clear()
  }
}
