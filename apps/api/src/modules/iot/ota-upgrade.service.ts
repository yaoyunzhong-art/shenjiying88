import { Injectable } from '@nestjs/common'
import { nanoid } from 'nanoid'

// ============= Types & Interfaces =============

export interface FirmwareBinary {
  size: number
  checksum: string
  data: Buffer
}

export interface FirmwareRecord {
  id: string
  deviceType: string
  version: string
  binary: FirmwareBinary
  uploadedAt: Date
  uploadedBy: string
}

export interface OTATaskRecord {
  id: string
  deviceId: string
  firmwareId: string
  status: OTAStatus
  progress: number
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export type OTAStatus = 'pending' | 'scheduled' | 'upgrading' | 'completed' | 'failed' | 'cancelled'

export interface DeviceInfo {
  deviceId: string
  deviceType: string
  batteryLevel: number
  networkStatus: 'online' | 'offline' | 'weak'
  currentState: DeviceState
  lastSeen: Date
}

export type DeviceState = 'idle' | 'upgrading' | 'error' | 'maintenance'

export interface DeviceHealthReport {
  deviceId: string
  score: number
  battery: { level: number; health: 'good' | 'degraded' | 'critical' }
  network: { status: 'good' | 'weak' | 'unstable' }
  sensors: { workingCount: number; totalCount: number }
  firmware: { version: string; upToDate: boolean }
  overall: 'healthy' | 'degraded' | 'critical'
}

export interface WorkOrderRecord {
  id: string
  deviceId: string
  issue: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
  assigneeId?: string
  createdAt: Date
  assignedAt?: Date
  resolvedAt?: Date
}

export interface TechnicianInfo {
  id: string
  name: string
  skills: string[]
  currentWorkload: number
  location?: { lat: number; lng: number }
  activeTasks: string[]
}

export interface WorkOrderIssue {
  deviceId: string
  deviceType: string
  description: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  requiredSkills?: string[]
  location?: { lat: number; lng: number }
}

// ============= OTAFirmwareService =============

@Injectable()
export class OTAFirmwareService {
  private readonly firmwares = new Map<string, FirmwareRecord>()
  private readonly otaTasks = new Map<string, OTATaskRecord>()
  private readonly deviceRegistry = new Map<string, DeviceInfo>()

  constructor() {
    this.initMockDevices()
  }

  private initMockDevices() {
    const mockDevices: DeviceInfo[] = [
      {
        deviceId: 'dev-001',
        deviceType: 'sensor-v2',
        batteryLevel: 85,
        networkStatus: 'online',
        currentState: 'idle',
        lastSeen: new Date()
      },
      {
        deviceId: 'dev-002',
        deviceType: 'sensor-v2',
        batteryLevel: 15,
        networkStatus: 'online',
        currentState: 'idle',
        lastSeen: new Date()
      },
      {
        deviceId: 'dev-003',
        deviceType: 'gateway-v1',
        batteryLevel: 92,
        networkStatus: 'weak',
        currentState: 'idle',
        lastSeen: new Date()
      },
      {
        deviceId: 'dev-004',
        deviceType: 'sensor-v2',
        batteryLevel: 45,
        networkStatus: 'online',
        currentState: 'upgrading',
        lastSeen: new Date()
      }
    ]

    for (const device of mockDevices) {
      this.deviceRegistry.set(device.deviceId, device)
    }
  }

  /**
   * 上传固件
   * @param deviceType 设备类型
   * @param version 版本号 (语义化版本)
   * @param binary 固件二进制数据
   * @param uploadedBy 上传者
   */
  async uploadFirmware(
    deviceType: string,
    version: string,
    binary: Buffer,
    uploadedBy = 'system'
  ): Promise<FirmwareRecord> {
    if (!deviceType || !version) {
      throw new Error('deviceType and version are required')
    }

    if (!binary || binary.length === 0) {
      throw new Error('binary data is required')
    }

    this.validateVersion(version)

    const checksum = this.calculateChecksum(binary)
    const firmware: FirmwareRecord = {
      id: `fw-${nanoid(10)}`,
      deviceType,
      version,
      binary: {
        size: binary.length,
        checksum,
        data: binary
      },
      uploadedAt: new Date(),
      uploadedBy
    }

    const key = `${deviceType}:${version}`
    this.firmwares.set(key, firmware)

    return firmware
  }

  /**
   * 列出可用固件版本
   * @param deviceType 设备类型
   */
  async listFirmwares(deviceType: string): Promise<FirmwareRecord[]> {
    const results: FirmwareRecord[] = []

    for (const firmware of this.firmwares.values()) {
      if (firmware.deviceType === deviceType) {
        results.push({
          ...firmware,
          binary: {
            ...firmware.binary,
            data: Buffer.alloc(0)
          }
        })
      }
    }

    return results.sort((a, b) => this.compareVersions(b.version, a.version))
  }

  /**
   * 批量安排 OTA 升级
   * @param deviceIds 设备ID列表
   * @param firmwareVersion 目标固件版本
   */
  async scheduleOTA(deviceIds: string[], firmwareVersion: string): Promise<OTATaskRecord[]> {
    if (!deviceIds || deviceIds.length === 0) {
      throw new Error('deviceIds cannot be empty')
    }

    const tasks: OTATaskRecord[] = []

    for (const deviceId of deviceIds) {
      const task = await this.createOTATask(deviceId, firmwareVersion)
      task.status = 'scheduled'
      tasks.push(task)
    }

    return tasks
  }

  /**
   * 执行 OTA 升级
   * @param deviceId 设备ID
   */
  async executeOTA(deviceId: string): Promise<OTATaskRecord> {
    const device = this.deviceRegistry.get(deviceId)
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`)
    }

    if (device.currentState === 'upgrading') {
      throw new Error(`Device ${deviceId} is already upgrading`)
    }

    const latestTask = this.findLatestTaskForDevice(deviceId)
    if (!latestTask) {
      throw new Error(`No scheduled OTA task found for device: ${deviceId}`)
    }

    device.currentState = 'upgrading'
    latestTask.status = 'upgrading'
    latestTask.startedAt = new Date()
    latestTask.progress = 0

    this.simulateOTAProgress(latestTask, device)

    return latestTask
  }

  /**
   * 取消 OTA 任务
   * @param otaTaskId OTA任务ID
   */
  async cancelOTA(otaTaskId: string): Promise<boolean> {
    const task = this.otaTasks.get(otaTaskId)

    if (!task) {
      throw new Error(`OTA task not found: ${otaTaskId}`)
    }

    if (task.status === 'completed' || task.status === 'cancelled') {
      throw new Error(`Cannot cancel task in status: ${task.status}`)
    }

    if (task.status === 'upgrading') {
      const device = this.deviceRegistry.get(task.deviceId)
      if (device && device.currentState === 'upgrading') {
        device.currentState = 'idle'
      }
    }

    task.status = 'cancelled'
    task.completedAt = new Date()

    return true
  }

  /**
   * 获取 OTA 状态
   * @param otaTaskId OTA任务ID
   */
  async getOTAStatus(otaTaskId: string): Promise<OTATaskRecord | null> {
    return this.otaTasks.get(otaTaskId) ?? null
  }

  // ============= Private Helpers =============

  private validateVersion(version: string): void {
    const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/
    if (!semverRegex.test(version)) {
      throw new Error(`Invalid version format: ${version}. Expected semver (e.g., 1.2.3)`)
    }
  }

  private calculateChecksum(data: Buffer): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data[i]
      hash |= 0
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.replace(/[-+].*/, '').split('.').map(Number)
    const parts2 = v2.replace(/[-+].*/, '').split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] ?? 0
      const p2 = parts2[i] ?? 0
      if (p1 !== p2) return p1 - p2
    }
    return 0
  }

  private async createOTATask(deviceId: string, firmwareVersion: string): Promise<OTATaskRecord> {
    const task: OTATaskRecord = {
      id: `ota-${nanoid(10)}`,
      deviceId,
      firmwareId: `${deviceId}:${firmwareVersion}`,
      status: 'pending',
      progress: 0
    }

    this.otaTasks.set(task.id, task)
    return task
  }

  private findLatestTaskForDevice(deviceId: string): OTATaskRecord | undefined {
    let latest: OTATaskRecord | undefined

    for (const task of this.otaTasks.values()) {
      if (task.deviceId === deviceId && task.status === 'scheduled') {
        if (!latest || (task.startedAt && latest.startedAt && task.startedAt > latest.startedAt)) {
          latest = task
        }
      }
    }

    return latest
  }

  private simulateOTAProgress(task: OTATaskRecord, device: DeviceInfo): void {
    const totalSteps = 10
    let currentStep = 0

    const interval = setInterval(() => {
      currentStep++
      task.progress = Math.round((currentStep / totalSteps) * 100)

      if (currentStep >= totalSteps) {
        clearInterval(interval)
        task.status = 'completed'
        task.completedAt = new Date()
        task.progress = 100
        device.currentState = 'idle'
      }
    }, 100)
  }
}

// ============= DeviceStateValidator =============

@Injectable()
export class DeviceStateValidator {
  private readonly deviceStates = new Map<string, DeviceInfo>()
  private readonly sensorHealth = new Map<string, boolean[]>()

  constructor(private readonly otaService: OTAFirmwareService) {
    this.initMockData()
  }

  private initMockData() {
    this.sensorHealth.set('dev-001', [true, true, true, true])
    this.sensorHealth.set('dev-002', [true, true, false, true])
    this.sensorHealth.set('dev-003', [true, true, true])
    this.sensorHealth.set('dev-004', [true, true, true, true])
  }

  /**
   * 升级前校验
   * @param deviceId 设备ID
   */
  async validateBeforeUpgrade(deviceId: string): Promise<{ valid: boolean; reasons: string[] }> {
    const device = await this.getDeviceInfo(deviceId)
    const reasons: string[] = []

    if (!device) {
      return { valid: false, reasons: [`Device not found: ${deviceId}`] }
    }

    if (device.batteryLevel < 20) {
      reasons.push(`Battery level too low: ${device.batteryLevel}% (minimum: 20%)`)
    }

    if (device.networkStatus === 'offline') {
      reasons.push('Device is offline')
    }

    if (device.networkStatus === 'weak') {
      reasons.push('Network signal is weak')
    }

    if (device.currentState !== 'idle') {
      reasons.push(`Device is not idle, current state: ${device.currentState}`)
    }

    return {
      valid: reasons.length === 0,
      reasons
    }
  }

  /**
   * 升级后校验
   * @param deviceId 设备ID
   */
  async validateAfterUpgrade(deviceId: string): Promise<{ valid: boolean; issues: string[] }> {
    const device = await this.getDeviceInfo(deviceId)
    const issues: string[] = []

    if (!device) {
      return { valid: false, issues: [`Device not found: ${deviceId}`] }
    }

    const sensors = this.sensorHealth.get(deviceId)
    if (sensors) {
      const failedSensors = sensors.filter((s) => !s).length
      if (failedSensors > 0) {
        issues.push(`${failedSensors} sensor(s) not working after upgrade`)
      }
    }

    if (device.currentState === 'error') {
      issues.push('Device reported error state after upgrade')
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * 获取设备健康度评分
   * @param deviceId 设备ID
   */
  async getDeviceHealth(deviceId: string): Promise<DeviceHealthReport> {
    const device = await this.getDeviceInfo(deviceId)

    if (!device) {
      return {
        deviceId,
        score: 0,
        battery: { level: 0, health: 'critical' },
        network: { status: 'unstable' },
        sensors: { workingCount: 0, totalCount: 0 },
        firmware: { version: 'unknown', upToDate: false },
        overall: 'critical'
      }
    }

    const batteryHealth = device.batteryLevel > 50 ? 'good' : device.batteryLevel > 20 ? 'degraded' : 'critical'
    const networkStatus = device.networkStatus === 'online' ? 'good' : device.networkStatus === 'weak' ? 'weak' : 'unstable'

    const sensors = this.sensorHealth.get(deviceId) ?? []
    const workingSensors = sensors.filter((s) => s).length

    const score = this.calculateHealthScore(device, sensors)

    let overall: 'healthy' | 'degraded' | 'critical'
    if (score >= 80) overall = 'healthy'
    else if (score >= 50) overall = 'degraded'
    else overall = 'critical'

    return {
      deviceId,
      score,
      battery: { level: device.batteryLevel, health: batteryHealth },
      network: { status: networkStatus },
      sensors: { workingCount: workingSensors, totalCount: sensors.length },
      firmware: { version: '1.0.0', upToDate: true },
      overall
    }
  }

  private calculateHealthScore(device: DeviceInfo, sensors: boolean[]): number {
    let score = 100

    if (device.batteryLevel < 20) score -= 40
    else if (device.batteryLevel < 50) score -= 20

    if (device.networkStatus === 'offline') score -= 30
    else if (device.networkStatus === 'weak') score -= 15

    const failedSensors = sensors.filter((s) => !s).length
    score -= failedSensors * 10

    if (device.currentState === 'error') score -= 20
    else if (device.currentState === 'maintenance') score -= 10

    return Math.max(0, Math.min(100, score))
  }

  private async getDeviceInfo(deviceId: string): Promise<DeviceInfo | undefined> {
    return this.otaService['deviceRegistry'].get(deviceId)
  }
}

// ============= WorkOrderAutoAssignService =============

@Injectable()
export class WorkOrderAutoAssignService {
  private readonly workOrders = new Map<string, WorkOrderRecord>()
  private readonly technicians = new Map<string, TechnicianInfo>()

  constructor(private readonly deviceValidator: DeviceStateValidator) {
    this.initMockTechnicians()
  }

  private initMockTechnicians() {
    const mockTechs: TechnicianInfo[] = [
      {
        id: 'tech-001',
        name: '张三',
        skills: ['sensor-v2', 'gateway-v1'],
        currentWorkload: 2,
        location: { lat: 31.2304, lng: 121.4737 },
        activeTasks: ['wo-001', 'wo-002']
      },
      {
        id: 'tech-002',
        name: '李四',
        skills: ['sensor-v2'],
        currentWorkload: 0,
        location: { lat: 31.2404, lng: 121.4837 },
        activeTasks: []
      },
      {
        id: 'tech-003',
        name: '王五',
        skills: ['gateway-v1', 'sensor-v2'],
        currentWorkload: 5,
        location: { lat: 31.2204, lng: 121.4637 },
        activeTasks: ['wo-003', 'wo-004', 'wo-005', 'wo-006', 'wo-007']
      }
    ]

    for (const tech of mockTechs) {
      this.technicians.set(tech.id, tech)
    }
  }

  /**
   * 创建工单
   * @param issue 工单问题
   * @param deviceId 设备ID
   */
  async createWorkOrder(issue: string, deviceId: string): Promise<WorkOrderRecord> {
    const workOrder: WorkOrderRecord = {
      id: `wo-${nanoid(8)}`,
      deviceId,
      issue,
      priority: 'P3',
      status: 'open',
      createdAt: new Date()
    }

    this.workOrders.set(workOrder.id, workOrder)
    return workOrder
  }

  /**
   * 转派工单
   * @param workOrderId 工单ID
   * @param technicianId 技术人员ID
   */
  async assignWorkOrder(workOrderId: string, technicianId: string): Promise<boolean> {
    const workOrder = this.workOrders.get(workOrderId)
    if (!workOrder) {
      throw new Error(`Work order not found: ${workOrderId}`)
    }

    const technician = this.technicians.get(technicianId)
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`)
    }

    workOrder.assigneeId = technicianId
    workOrder.status = 'assigned'
    workOrder.assignedAt = new Date()

    technician.activeTasks.push(workOrderId)
    technician.currentWorkload++

    return true
  }

  /**
   * 自动指派工单
   * @param issue 工单问题
   */
  async autoAssign(issue: WorkOrderIssue): Promise<WorkOrderRecord | null> {
    const workOrder = await this.createWorkOrder(issue.description, issue.deviceId)

    const eligibleTechs = this.getEligibleTechnicians(issue)

    if (eligibleTechs.length === 0) {
      return workOrder
    }

    const assignedTech = this.selectBestTechnician(eligibleTechs, issue)

    if (assignedTech) {
      await this.assignWorkOrder(workOrder.id, assignedTech.id)
    }

    return workOrder
  }

  private getEligibleTechnicians(issue: WorkOrderIssue): TechnicianInfo[] {
    const eligible: TechnicianInfo[] = []

    for (const tech of this.technicians.values()) {
      if (issue.requiredSkills && issue.requiredSkills.length > 0) {
        const hasRequiredSkills = issue.requiredSkills.some((skill) => tech.skills.includes(skill))
        if (!hasRequiredSkills) continue
      }

      if (tech.currentWorkload < 10) {
        eligible.push(tech)
      }
    }

    return eligible
  }

  private selectBestTechnician(
    technicians: TechnicianInfo[],
    issue: WorkOrderIssue
  ): TechnicianInfo | null {
    if (technicians.length === 0) return null

    let bestTech: TechnicianInfo | null = null
    let bestScore = -Infinity

    for (const tech of technicians) {
      let score = 100

      // 距离评分 (距离越近分数越高)
      if (issue.location && tech.location) {
        const distance = this.calculateDistance(issue.location, tech.location)
        score -= distance * 0.1
      }

      // 忙碌程度评分 (越闲分数越高)
      score -= tech.currentWorkload * 5

      // 技能匹配评分
      if (issue.requiredSkills) {
        const matchCount = issue.requiredSkills.filter((s) => tech.skills.includes(s)).length
        score += matchCount * 10
      }

      if (score > bestScore) {
        bestScore = score
        bestTech = tech
      }
    }

    return bestTech
  }

  private calculateDistance(
    loc1: { lat: number; lng: number },
    loc2: { lat: number; lng: number }
  ): number {
    const R = 6371
    const dLat = this.toRad(loc2.lat - loc1.lat)
    const dLng = this.toRad(loc2.lng - loc1.lng)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.lat)) *
        Math.cos(this.toRad(loc2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180
  }
}
