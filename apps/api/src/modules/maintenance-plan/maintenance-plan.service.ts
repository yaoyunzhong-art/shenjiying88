import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  MaintenanceType,
  MaintenanceStatus,
  Priority,
  type MaintenancePlan,
} from './maintenance-plan.entity'

// ── In-memory store ──

const planStore = new Map<string, MaintenancePlan>()

function generatePlanNo(): string {
  const prefix = 'MP'
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `${prefix}${date}${seq}`
}

@Injectable()
export class MaintenancePlanService {
  // ═══════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════

  createPlan(input: {
    tenantId: string
    title: string
    type: MaintenanceType
    priority: Priority
    deviceName: string
    deviceId: string
    assignedTo: string
    scheduledAt: string
    description: string
    result?: string
    cost?: number
  }): MaintenancePlan {
    const now = new Date().toISOString()
    const plan: MaintenancePlan = {
      id: `plan-${randomUUID()}`,
      planNo: generatePlanNo(),
      title: input.title,
      type: input.type,
      status: MaintenanceStatus.Scheduled,
      priority: input.priority,
      deviceName: input.deviceName,
      deviceId: input.deviceId,
      assignedTo: input.assignedTo,
      scheduledAt: input.scheduledAt,
      description: input.description,
      result: input.result,
      cost: input.cost,
      tenantId: input.tenantId,
      createdAt: now,
    }
    planStore.set(plan.id, plan)
    return plan
  }

  getPlan(planId: string, tenantId: string): MaintenancePlan | undefined {
    const p = planStore.get(planId)
    if (!p || p.tenantId !== tenantId) return undefined
    return p
  }

  listPlans(
    tenantId: string,
    filters?: {
      status?: MaintenanceStatus
      type?: MaintenanceType
      priority?: Priority
      deviceName?: string
      assignedTo?: string
    },
  ): MaintenancePlan[] {
    const all = Array.from(planStore.values())
    return all.filter((p) => {
      if (p.tenantId !== tenantId) return false
      if (filters?.status && p.status !== filters.status) return false
      if (filters?.type && p.type !== filters.type) return false
      if (filters?.priority && p.priority !== filters.priority) return false
      if (filters?.deviceName && !p.deviceName.includes(filters.deviceName)) return false
      if (filters?.assignedTo && !p.assignedTo.includes(filters.assignedTo)) return false
      return true
    })
  }

  updatePlan(
    planId: string,
    tenantId: string,
    input: {
      title?: string
      type?: MaintenanceType
      priority?: Priority
      deviceName?: string
      deviceId?: string
      assignedTo?: string
      scheduledAt?: string
      description?: string
      result?: string
      cost?: number
    },
  ): MaintenancePlan {
    const plan = this.getPlan(planId, tenantId)
    if (!plan) {
      throw new Error(`Maintenance plan not found: ${planId}`)
    }
    const updated: MaintenancePlan = {
      ...plan,
      title: input.title ?? plan.title,
      type: input.type ?? plan.type,
      priority: input.priority ?? plan.priority,
      deviceName: input.deviceName ?? plan.deviceName,
      deviceId: input.deviceId ?? plan.deviceId,
      assignedTo: input.assignedTo ?? plan.assignedTo,
      scheduledAt: input.scheduledAt ?? plan.scheduledAt,
      description: input.description ?? plan.description,
      result: input.result !== undefined ? input.result : plan.result,
      cost: input.cost !== undefined ? input.cost : plan.cost,
    }
    planStore.set(planId, updated)
    return updated
  }

  updatePlanStatus(
    planId: string,
    status: MaintenanceStatus,
    tenantId: string,
    result?: string,
    cost?: number,
  ): MaintenancePlan {
    const plan = this.getPlan(planId, tenantId)
    if (!plan) {
      throw new Error(`Maintenance plan not found: ${planId}`)
    }
    const now = new Date().toISOString()
    const updated: MaintenancePlan = {
      ...plan,
      status,
      completedAt:
        status === MaintenanceStatus.Completed ||
        status === MaintenanceStatus.Cancelled
          ? now
          : plan.completedAt,
      result: result !== undefined ? result : plan.result,
      cost: cost !== undefined ? cost : plan.cost,
    }
    planStore.set(planId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Scheduling helpers
  // ═══════════════════════════════════════════════════════════════════

  getScheduledPlans(tenantId: string, fromDate?: string, toDate?: string): MaintenancePlan[] {
    return Array.from(planStore.values()).filter((p) => {
      if (p.tenantId !== tenantId) return false
      if (p.status !== MaintenanceStatus.Scheduled && p.status !== MaintenanceStatus.InProgress) return false
      if (fromDate && p.scheduledAt < fromDate) return false
      if (toDate && p.scheduledAt > toDate) return false
      return true
    }).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  }

  // ═══════════════════════════════════════════════════════════════════
  // Mock Data
  // ═══════════════════════════════════════════════════════════════════

  seedMockData(tenantId: string): void {
    const now = new Date()
    const mockPlans: Array<{
      title: string
      type: MaintenanceType
      status: MaintenanceStatus
      priority: Priority
      deviceName: string
      deviceId: string
      assignedTo: string
      scheduledAt: string
      description: string
      result?: string
      cost?: number
    }> = [
      {
        title: '月度设备例行检查-1号机',
        type: MaintenanceType.Routine,
        status: MaintenanceStatus.Completed,
        priority: Priority.Medium,
        deviceName: '大疆无人机-1号',
        deviceId: 'DEV-001',
        assignedTo: '张工',
        scheduledAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: '每月例行检查，包括电池、螺旋桨、GPS模块',
        result: '所有项目正常，电池健康度92%',
        cost: 0,
      },
      {
        title: '空调系统紧急维修',
        type: MaintenanceType.Emergency,
        status: MaintenanceStatus.Completed,
        priority: Priority.Urgent,
        deviceName: '中央空调-3号',
        deviceId: 'AC-003',
        assignedTo: '李工',
        scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        description: '3号空调不制冷，温度异常升高',
        result: '更换压缩机电容，添加制冷剂，恢复正常',
        cost: 2500,
      },
      {
        title: '服务器系统升级',
        type: MaintenanceType.Upgrade,
        status: MaintenanceStatus.Completed,
        priority: Priority.High,
        deviceName: '主服务器',
        deviceId: 'SRV-MAIN',
        assignedTo: '王工',
        scheduledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: '升级服务器操作系统到最新LTS版本，安装安全补丁',
        result: '系统升级成功，已安装所有安全补丁',
        cost: 0,
      },
      {
        title: '大疆无人机-2号年度大修',
        type: MaintenanceType.Overhaul,
        status: MaintenanceStatus.Scheduled,
        priority: Priority.Medium,
        deviceName: '大疆无人机-2号',
        deviceId: 'DEV-002',
        assignedTo: '张工',
        scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: '年度大修，全面拆解检测，更换老化零部件',
      },
      {
        title: '电竞椅维护保养',
        type: MaintenanceType.Routine,
        status: MaintenanceStatus.InProgress,
        priority: Priority.Low,
        deviceName: '电竞椅-01至20号',
        deviceId: 'CHAIR-BATCH-001',
        assignedTo: '赵工',
        scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: '对所有电竞椅进行螺丝紧固、气杆检查和清洁',
      },
      {
        title: '投影仪灯泡更换',
        type: MaintenanceType.Routine,
        status: MaintenanceStatus.Scheduled,
        priority: Priority.Medium,
        deviceName: '4K投影仪',
        deviceId: 'PROJ-001',
        assignedTo: '刘工',
        scheduledAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        description: '投影仪灯泡寿命到期，需更换原装灯泡',
      },
      {
        title: '配电房设备检修',
        type: MaintenanceType.Routine,
        status: MaintenanceStatus.Scheduled,
        priority: Priority.High,
        deviceName: '配电柜-A组',
        deviceId: 'PWR-A',
        assignedTo: '陈工',
        scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        description: '季度配电设备检修，包括开关、线路、接地检测',
      },
      {
        title: '监控系统故障修复',
        type: MaintenanceType.Emergency,
        status: MaintenanceStatus.InProgress,
        priority: Priority.Urgent,
        deviceName: '监控摄像头-NO3',
        deviceId: 'CAM-003',
        assignedTo: '王工',
        scheduledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: '3号摄像头画面黑屏，疑似线路故障',
        result: '线路检测中，已临时搭建替代监控',
      },
      {
        title: '游戏主机定期维护',
        type: MaintenanceType.Routine,
        status: MaintenanceStatus.Cancelled,
        priority: Priority.Low,
        deviceName: 'PS5展示机-01至10号',
        deviceId: 'PS5-B1',
        assignedTo: '周工',
        scheduledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: '清洁除尘、系统更新、配件检查',
        result: '因门店活动取消本次维护',
      },
      {
        title: 'VR设备固件升级',
        type: MaintenanceType.Upgrade,
        status: MaintenanceStatus.Scheduled,
        priority: Priority.Medium,
        deviceName: 'VR头显-全部20台',
        deviceId: 'VR-ALL',
        assignedTo: '张工',
        scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: '所有VR设备固件升级到最新版本',
      },
      {
        title: '消防系统年检',
        type: MaintenanceType.Routine,
        status: MaintenanceStatus.Scheduled,
        priority: Priority.High,
        deviceName: '消防报警系统',
        deviceId: 'FIRE-001',
        assignedTo: '物业部',
        scheduledAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        description: '年度消防系统检测，包括烟感、喷淋、报警器',
      },
      {
        title: '电梯维保',
        type: MaintenanceType.Routine,
        status: MaintenanceStatus.Completed,
        priority: Priority.High,
        deviceName: '客梯-1号',
        deviceId: 'ELV-001',
        assignedTo: '奥的斯维保',
        scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: '半月例行维保，检查导轨、钢丝绳、控制系统',
        result: '所有项目正常',
        cost: 0,
      },
      {
        title: '发电机定期试运行',
        type: MaintenanceType.Routine,
        status: MaintenanceStatus.Cancelled,
        priority: Priority.Medium,
        deviceName: '柴油发电机',
        deviceId: 'GEN-001',
        assignedTo: '陈工',
        scheduledAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        description: '月度发电机试运行30分钟',
        result: '因发电机检修取消本次试运行',
      },
      {
        title: '网络设备更换',
        type: MaintenanceType.Upgrade,
        status: MaintenanceStatus.Completed,
        priority: Priority.High,
        deviceName: '核心交换机',
        deviceId: 'NET-CORE-SW',
        assignedTo: '王工',
        scheduledAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        description: '更换核心交换机为万兆设备，提升网络性能',
        result: '新交换机安装完成，网络性能提升300%',
        cost: 45000,
      },
      {
        title: '门禁系统紧急维修',
        type: MaintenanceType.Emergency,
        status: MaintenanceStatus.Completed,
        priority: Priority.Urgent,
        deviceName: '入口门禁',
        deviceId: 'ACS-MAIN',
        assignedTo: '李工',
        scheduledAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        description: '入口门禁刷卡失效，员工无法正常进入',
        result: '门禁控制器主板烧毁，已更换新主板',
        cost: 1800,
      },
      {
        title: '音响系统全面检测',
        type: MaintenanceType.Overhaul,
        status: MaintenanceStatus.Scheduled,
        priority: Priority.Low,
        deviceName: '音响系统',
        deviceId: 'AUDIO-SYS',
        assignedTo: '赵工',
        scheduledAt: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        description: '全面检测音响系统，包括功放、音箱、调音台',
      },
      {
        title: '收银系统服务器维护',
        type: MaintenanceType.Routine,
        status: MaintenanceStatus.Scheduled,
        priority: Priority.Medium,
        deviceName: 'POS服务器',
        deviceId: 'SRV-POS',
        assignedTo: '王工',
        scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: '数据库优化、日志清理、备份验证',
      },
      {
        title: '水冷系统检修',
        type: MaintenanceType.Emergency,
        status: MaintenanceStatus.InProgress,
        priority: Priority.Urgent,
        deviceName: '水冷系统',
        deviceId: 'COOL-WATER',
        assignedTo: '张工',
        scheduledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: '水冷系统报错，温度偏高需要紧急处理',
      },
      {
        title: '灯箱广告更换',
        type: MaintenanceType.Routine,
        status: MaintenanceStatus.Completed,
        priority: Priority.Low,
        deviceName: '外立面灯箱',
        deviceId: 'SIGN-OUTDOOR',
        assignedTo: '刘工',
        scheduledAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        description: '灯箱广告画面更换为新促销活动海报',
        result: '已更换完成',
        cost: 800,
      },
      {
        title: 'UPS电池更换',
        type: MaintenanceType.Upgrade,
        status: MaintenanceStatus.Scheduled,
        priority: Priority.High,
        deviceName: 'UPS不间断电源',
        deviceId: 'UPS-001',
        assignedTo: '陈工',
        scheduledAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'UPS电池组已使用4年，需要全部更换',
      },
    ]

    for (const m of mockPlans) {
      this.createPlan({
        tenantId,
        title: m.title,
        type: m.type,
        priority: m.priority,
        deviceName: m.deviceName,
        deviceId: m.deviceId,
        assignedTo: m.assignedTo,
        scheduledAt: m.scheduledAt,
        description: m.description,
      })

      const planId = Array.from(planStore.values()).find(
        (p) => p.title === m.title && p.tenantId === tenantId,
      )!.id

      const plan = planStore.get(planId)!
      plan.status = m.status
      if (m.status === MaintenanceStatus.Completed || m.status === MaintenanceStatus.Cancelled) {
        plan.completedAt = m.scheduledAt
        plan.result = m.result
        plan.cost = m.cost
      }
      if (m.result && m.status !== MaintenanceStatus.Completed && m.status !== MaintenanceStatus.Cancelled) {
        plan.result = m.result
      }
      planStore.set(planId, plan)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test Helpers
  // ═══════════════════════════════════════════════════════════════════

  resetPlanStoresForTests(): void {
    planStore.clear()
  }
}
