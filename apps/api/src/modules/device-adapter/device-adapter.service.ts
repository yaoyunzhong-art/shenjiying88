import { Injectable } from '@nestjs/common'

// ── Types ───────────────────────────────────────────────────────────────────

export type DeviceType = 'pos' | 'gate' | 'scanner' | 'printer' | 'scale' | 'kiosk'
export type DeviceBrand = 'huawei' | 'honeywell' | 'zebra' | 'epson' | 'deli' | 'generic'
export type DeviceStatus = 'online' | 'offline' | 'error' | 'maintenance'

export interface DeviceConfig {
  deviceId: string
  deviceType: DeviceType
  brand: DeviceBrand
  model?: string
  connection: 'usb' | 'serial' | 'bluetooth' | 'wifi' | 'ethernet'
  timeout: number
  retries: number
}

export interface DeviceCommand {
  commandId: string
  deviceId: string
  action: string
  params?: Record<string, unknown>
  issuedAt: Date
  issuedBy?: string
}

export interface DeviceResponse {
  commandId: string
  deviceId?: string
  success: boolean
  data?: unknown
  error?: string
  receivedAt: Date
}

// ── Brand Adapters (Strategy Pattern) ──────────────────────────────────────

interface BrandAdapter {
  protocol: string
  execute(action: string, params?: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }>
}

class HuaweiAdapter implements BrandAdapter {
  protocol = 'HiPay SDK'

  async execute(action: string, params?: Record<string, unknown>) {
    switch (action) {
      case 'transaction':
        return { success: true, data: { transactionId: crypto.randomUUID(), status: 'approved' } }
      case 'refund':
        return { success: true, data: { refundId: crypto.randomUUID(), status: 'processed' } }
      case 'readCard':
        return { success: true, data: { cardNumber: '**** **** **** 1234', cardType: 'VISA' } }
      default:
        return { success: false, error: 'unknown_action' }
    }
  }
}

class HoneywellAdapter implements BrandAdapter {
  protocol = 'HHP Protocol'

  async execute(action: string, params?: Record<string, unknown>) {
    if (action === 'scan') {
      return { success: true, data: { rawData: 'TEST123456', format: 'code128' } }
    }
    return { success: false, error: 'unknown_action' }
  }
}

class ZebraAdapter implements BrandAdapter {
  protocol = 'ZPL'

  async execute(action: string, params?: Record<string, unknown>) {
    if (action === 'print') {
      return { success: true, data: { jobId: crypto.randomUUID(), pages: 1 } }
    }
    if (action === 'printQR') {
      return { success: true, data: { jobId: crypto.randomUUID(), format: 'qr' } }
    }
    return { success: false, error: 'unknown_action' }
  }
}

class EpsonAdapter implements BrandAdapter {
  protocol = 'ESC/POS'

  async execute(action: string, params?: Record<string, unknown>) {
    if (action === 'print') {
      return { success: true, data: { jobId: crypto.randomUUID(), pages: 1 } }
    }
    if (action === 'printQR') {
      return { success: true, data: { jobId: crypto.randomUUID(), format: 'qr' } }
    }
    return { success: false, error: 'unknown_action' }
  }
}

class DeliAdapter implements BrandAdapter {
  protocol = 'Deli Custom'

  async execute(action: string, params?: Record<string, unknown>) {
    if (action === 'readWeight') {
      return { success: true, data: { weight: 1.25, unit: 'kg' } }
    }
    return { success: false, error: 'unknown_action' }
  }
}

class GenericAdapter implements BrandAdapter {
  protocol = 'HTTP/REST'

  async execute(action: string, params?: Record<string, unknown>) {
    return { success: true, data: { action, params, timestamp: new Date().toISOString() } }
  }
}

// ── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DeviceAdapterService {
  private readonly devices = new Map<string, DeviceConfig>()
  private readonly deviceStatus = new Map<string, DeviceStatus>()
  private readonly commandHistory = new Map<string, DeviceCommand[]>()
  private readonly MAX_HISTORY = 100

  private readonly adapters: Record<DeviceBrand, BrandAdapter> = {
    huawei: new HuaweiAdapter(),
    honeywell: new HoneywellAdapter(),
    zebra: new ZebraAdapter(),
    epson: new EpsonAdapter(),
    deli: new DeliAdapter(),
    generic: new GenericAdapter(),
  }

  // ── Device Registration ────────────────────────────────────────────────────

  registerDevice(config: DeviceConfig): DeviceConfig {
    this.devices.set(config.deviceId, config)
    this.deviceStatus.set(config.deviceId, 'offline')
    this.commandHistory.set(config.deviceId, [])
    return config
  }

  unregisterDevice(deviceId: string): void {
    this.devices.delete(deviceId)
    this.deviceStatus.delete(deviceId)
    this.commandHistory.delete(deviceId)
  }

  getDevice(deviceId: string): DeviceConfig | null {
    return this.devices.get(deviceId) ?? null
  }

  listDevices(filters?: { type?: DeviceType; brand?: DeviceBrand; status?: DeviceStatus }): DeviceConfig[] {
    let devices = Array.from(this.devices.values())

    if (filters?.type) {
      devices = devices.filter((d) => d.deviceType === filters.type)
    }
    if (filters?.brand) {
      devices = devices.filter((d) => d.brand === filters.brand)
    }
    if (filters?.status) {
      devices = devices.filter((d) => this.getStatus(d.deviceId) === filters.status)
    }

    return devices
  }

  // ── Connection Management ─────────────────────────────────────────────────

  async connect(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId)
    if (!device) return false

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 10))
    this.deviceStatus.set(deviceId, 'online')
    return true
  }

  async disconnect(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId)
    if (!device) return

    await new Promise((resolve) => setTimeout(resolve, 10))
    this.deviceStatus.set(deviceId, 'offline')
  }

  async connectAll(type: DeviceType): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()
    const devices = this.listDevices({ type })

    await Promise.all(
      devices.map(async (device) => {
        const success = await this.connect(device.deviceId)
        results.set(device.deviceId, success)
      })
    )

    return results
  }

  // ── POS Device ────────────────────────────────────────────────────────────

  async posTransaction(deviceId: string, amount: number, currency: string): Promise<DeviceResponse> {
    const status = this.getStatus(deviceId)
    if (status !== 'online') {
      return this.createResponse(deviceId, 'posTransaction', false, undefined, 'device_offline')
    }

    const device = this.devices.get(deviceId)!
    const adapter = this.adapters[device.brand]
    const commandId = crypto.randomUUID()

    const result = await adapter.execute('transaction', { amount, currency })

    this.addToHistory(deviceId, { commandId, deviceId, action: 'posTransaction', params: { amount, currency }, issuedAt: new Date() })

    return {
      commandId,
      success: result.success,
      data: result.data,
      error: result.error,
      receivedAt: new Date(),
    }
  }

  async posRefund(deviceId: string, originalTransactionId: string, amount: number): Promise<DeviceResponse> {
    const status = this.getStatus(deviceId)
    if (status !== 'online') {
      return this.createResponse(deviceId, 'posRefund', false, undefined, 'device_offline')
    }

    const device = this.devices.get(deviceId)!
    const adapter = this.adapters[device.brand]
    const commandId = crypto.randomUUID()

    const result = await adapter.execute('refund', { originalTransactionId, amount })

    this.addToHistory(deviceId, { commandId, deviceId, action: 'posRefund', params: { originalTransactionId, amount }, issuedAt: new Date() })

    return {
      commandId,
      success: result.success,
      data: result.data,
      error: result.error,
      receivedAt: new Date(),
    }
  }

  async posReadCard(deviceId: string): Promise<DeviceResponse> {
    const status = this.getStatus(deviceId)
    if (status !== 'online') {
      return this.createResponse(deviceId, 'posReadCard', false, undefined, 'device_offline')
    }

    const device = this.devices.get(deviceId)!
    const adapter = this.adapters[device.brand]
    const commandId = crypto.randomUUID()

    const result = await adapter.execute('readCard')

    this.addToHistory(deviceId, { commandId, deviceId, action: 'posReadCard', issuedAt: new Date() })

    return {
      commandId,
      success: result.success,
      data: result.data,
      error: result.error,
      receivedAt: new Date(),
    }
  }

  // ── Gate Device ────────────────────────────────────────────────────────────

  async gateOpen(deviceId: string, direction: 'in' | 'out' | 'both'): Promise<DeviceResponse> {
    const status = this.getStatus(deviceId)
    if (status !== 'online') {
      return this.createResponse(deviceId, 'gateOpen', false, undefined, 'device_offline')
    }

    const commandId = crypto.randomUUID()

    this.addToHistory(deviceId, { commandId, deviceId, action: 'gateOpen', params: { direction }, issuedAt: new Date() })

    return {
      commandId,
      success: true,
      data: { gateId: deviceId, direction, openedAt: new Date().toISOString() },
      receivedAt: new Date(),
    }
  }

  async gateGetAccessLog(deviceId: string, limit = 100): Promise<DeviceResponse> {
    const status = this.getStatus(deviceId)
    if (status !== 'online') {
      return this.createResponse(deviceId, 'gateGetAccessLog', false, undefined, 'device_offline')
    }

    const commandId = crypto.randomUUID()

    // Generate mock access log
    const logs = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: crypto.randomUUID(),
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      direction: i % 2 === 0 ? 'in' : 'out',
    }))

    this.addToHistory(deviceId, { commandId, deviceId, action: 'gateGetAccessLog', params: { limit }, issuedAt: new Date() })

    return {
      commandId,
      success: true,
      data: { logs, count: logs.length },
      receivedAt: new Date(),
    }
  }

  // ── Scanner ───────────────────────────────────────────────────────────────

  async scannerScan(deviceId: string): Promise<DeviceResponse> {
    const status = this.getStatus(deviceId)
    if (status !== 'online') {
      return this.createResponse(deviceId, 'scannerScan', false, undefined, 'device_offline')
    }

    const device = this.devices.get(deviceId)!
    const adapter = this.adapters[device.brand]
    const commandId = crypto.randomUUID()

    const result = await adapter.execute('scan')

    this.addToHistory(deviceId, { commandId, deviceId, action: 'scannerScan', issuedAt: new Date() })

    return {
      commandId,
      success: result.success,
      data: result.data,
      error: result.error,
      receivedAt: new Date(),
    }
  }

  scannerParse(data: string): { format: 'qr' | 'code128' | 'ean13' | 'upc'; value: string; metadata?: Record<string, unknown> } {
    // Auto-detect format
    if (data.startsWith('http') || /^[A-Za-z0-9+-/=]{20,}$/.test(data)) {
      return { format: 'qr', value: data, metadata: { decoded: true } }
    }
    if (/^\d{13}$/.test(data)) {
      return { format: 'ean13', value: data }
    }
    if (/^\d{12}$/.test(data)) {
      return { format: 'upc', value: data }
    }
    return { format: 'code128', value: data }
  }

  // ── Printer ───────────────────────────────────────────────────────────────

  async printerPrint(deviceId: string, content: string): Promise<DeviceResponse> {
    const status = this.getStatus(deviceId)
    if (status !== 'online') {
      return this.createResponse(deviceId, 'printerPrint', false, undefined, 'device_offline')
    }

    const device = this.devices.get(deviceId)!
    const adapter = this.adapters[device.brand]
    const commandId = crypto.randomUUID()

    const result = await adapter.execute('print', { content })

    this.addToHistory(deviceId, { commandId, deviceId, action: 'printerPrint', params: { content }, issuedAt: new Date() })

    return {
      commandId,
      success: result.success,
      data: result.data,
      error: result.error,
      receivedAt: new Date(),
    }
  }

  async printerPrintQR(deviceId: string, data: string): Promise<DeviceResponse> {
    const status = this.getStatus(deviceId)
    if (status !== 'online') {
      return this.createResponse(deviceId, 'printerPrintQR', false, undefined, 'device_offline')
    }

    const device = this.devices.get(deviceId)!
    const adapter = this.adapters[device.brand]
    const commandId = crypto.randomUUID()

    const result = await adapter.execute('printQR', { data })

    this.addToHistory(deviceId, { commandId, deviceId, action: 'printerPrintQR', params: { data }, issuedAt: new Date() })

    return {
      commandId,
      success: result.success,
      data: result.data,
      error: result.error,
      receivedAt: new Date(),
    }
  }

  // ── Device Status ─────────────────────────────────────────────────────────

  getStatus(deviceId: string): DeviceStatus {
    return this.deviceStatus.get(deviceId) ?? 'offline'
  }

  checkAllStatus(): Map<string, DeviceStatus> {
    const statuses = new Map<string, DeviceStatus>()
    for (const deviceId of this.devices.keys()) {
      statuses.set(deviceId, this.getStatus(deviceId))
    }
    return statuses
  }

  async heartbeat(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId)
    if (!device) return

    await new Promise((resolve) => setTimeout(resolve, 5))
    this.deviceStatus.set(deviceId, 'online')
  }

  // ── Command History ───────────────────────────────────────────────────────

  getCommandHistory(deviceId: string, limit = 100): DeviceCommand[] {
    const history = this.commandHistory.get(deviceId) ?? []
    return history.slice(-limit)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private addToHistory(deviceId: string, command: DeviceCommand): void {
    const history = this.commandHistory.get(deviceId) ?? []
    history.push(command)

    // Keep only last 100 entries
    if (history.length > this.MAX_HISTORY) {
      history.shift()
    }

    this.commandHistory.set(deviceId, history)
  }

  private createResponse(deviceId: string, action: string, success: boolean, data?: unknown, error?: string): DeviceResponse {
    return {
      commandId: crypto.randomUUID(),
      deviceId,
      success,
      data,
      error,
      receivedAt: new Date(),
    }
  }
}
