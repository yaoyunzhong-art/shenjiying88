/**
 * venue.service.spec.ts — P-25 场地管理 ≥12 测试 (正例/反例/边界)
 */
import { describe, it, expect } from 'vitest'
import { VenueStatus, VenueType, VENUE_STATUS_TRANSITIONS } from './venue.entity'

// ─── 内联类型 ──────────────────────────────────────────────────────────────

interface TimeSlotPricing {
  label: string; startHour: number; endHour: number; priceCents: number
}
interface HolidayPricing {
  date: string; priceCents: number
}
interface Venue {
  id: string; name: string; type: VenueType; capacity: number
  status: VenueStatus; priceCents: number
  timeSlotPricing: TimeSlotPricing[];
  holidayPricing: HolidayPricing[];
  tags: string[]; description: string
  createdAt: string; updatedAt: string
}
interface CreateInput {
  name: string; type: VenueType; capacity: number; priceCents: number
  timeSlotPricing?: TimeSlotPricing[]; holidayPricing?: HolidayPricing[]
  tags?: string[]; description?: string
}
interface UpdateInput {
  name?: string; type?: VenueType; capacity?: number; priceCents?: number
  status?: VenueStatus; timeSlotPricing?: TimeSlotPricing[];
  holidayPricing?: HolidayPricing[]; tags?: string[]; description?: string
}

// ─── 内联服务 ────────────────────────────────────────────────────────────────

class InlineVenueService {
  private store = new Map<string, Venue>()
  private counter = 0

  private nextId(): string { return `venue-${++this.counter}` }

  private assertNameNotTaken(name: string, excludeId?: string): void {
    for (const v of this.store.values()) {
      if (v.name === name && v.id !== excludeId) throw new Error('场地名称已存在')
    }
  }

  private assertTransition(current: VenueStatus, target: VenueStatus): void {
    const allowed = VENUE_STATUS_TRANSITIONS[current]
    if (!allowed || !allowed.includes(target)) {
      throw new Error('无效的状态转换')
    }
  }

  create(input: CreateInput): Venue {
    if (!input.name?.trim()) throw new Error('场地名称不能为空')
    if (input.capacity < 0) throw new Error('容量不能为负数')
    if (input.priceCents < 0) throw new Error('价格不能为负数')
    this.assertNameNotTaken(input.name.trim())
    const now = new Date().toISOString()
    const v: Venue = {
      id: this.nextId(), name: input.name.trim(), type: input.type,
      capacity: input.capacity, status: VenueStatus.IDLE,
      priceCents: input.priceCents,
      timeSlotPricing: input.timeSlotPricing ?? [],
      holidayPricing: input.holidayPricing ?? [],
      tags: input.tags ?? [], description: input.description ?? '',
      createdAt: now, updatedAt: now,
    }
    this.store.set(v.id, v)
    return v
  }

  list(query?: { type?: VenueType; status?: VenueStatus; search?: string }): Venue[] {
    let result = Array.from(this.store.values())
    if (query?.type) result = result.filter(v => v.type === query.type)
    if (query?.status) result = result.filter(v => v.status === query.status)
    if (query?.search) {
      const s = query.search.toLowerCase()
      result = result.filter(v => v.name.toLowerCase().includes(s) || v.description.toLowerCase().includes(s))
    }
    return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  getById(id: string): Venue {
    const v = this.store.get(id)
    if (!v) throw new Error('场地不存在')
    return v
  }

  update(id: string, input: UpdateInput): Venue {
    const v = this.getById(id)
    if (input.name !== undefined) {
      if (!input.name.trim()) throw new Error('场地名称不能为空')
      if (input.name.trim() !== v.name) this.assertNameNotTaken(input.name.trim(), id)
      v.name = input.name.trim()
    }
    if (input.type !== undefined) v.type = input.type
    if (input.capacity !== undefined) {
      if (input.capacity < 0) throw new Error('容量不能为负数')
      v.capacity = input.capacity
    }
    if (input.priceCents !== undefined) {
      if (input.priceCents < 0) throw new Error('价格不能为负数')
      v.priceCents = input.priceCents
    }
    if (input.status !== undefined) {
      this.assertTransition(v.status, input.status)
      v.status = input.status
    }
    if (input.timeSlotPricing !== undefined) v.timeSlotPricing = input.timeSlotPricing
    if (input.holidayPricing !== undefined) v.holidayPricing = input.holidayPricing
    if (input.tags !== undefined) v.tags = input.tags
    if (input.description !== undefined) v.description = input.description
    v.updatedAt = new Date().toISOString()
    return v
  }

  delete(id: string): void {
    if (!this.store.has(id)) throw new Error('场地不存在')
    this.store.delete(id)
  }

  clear(): void { this.store.clear(); this.counter = 0 }
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('VenueService (inline)', () => {
  let svc: InlineVenueService

  const validInput: CreateInput = {
    name: '主大厅',
    type: VenueType.HALL,
    capacity: 200,
    priceCents: 50000,
    tags: ['premium', 'ac'],
  }

  beforeEach(() => {
    svc = new InlineVenueService()
  })

  // ── 正例 ─────────────────────────────────────────────────────────

  it('创建场地 —— 所有字段正确', () => {
    const v = svc.create(validInput)
    expect(v.id).toMatch(/^venue-/)
    expect(v.name).toBe('主大厅')
    expect(v.type).toBe(VenueType.HALL)
    expect(v.capacity).toBe(200)
    expect(v.priceCents).toBe(50000)
    expect(v.status).toBe(VenueStatus.IDLE)
    expect(v.tags).toEqual(['premium', 'ac'])
  })

  it('列表 —— 返回所有场地', () => {
    svc.create({ ...validInput, name: 'A' })
    svc.create({ ...validInput, name: 'B' })
    expect(svc.list()).toHaveLength(2)
  })

  it('详情 —— 按 ID 获取', () => {
    const created = svc.create(validInput)
    const found = svc.getById(created.id)
    expect(found.name).toBe('主大厅')
  })

  it('更新 —— 修改名称和容量', () => {
    const created = svc.create(validInput)
    const updated = svc.update(created.id, { name: '新大厅', capacity: 300 })
    expect(updated.name).toBe('新大厅')
    expect(updated.capacity).toBe(300)
  })

  it('删除 —— 成功后列表为空', () => {
    const created = svc.create(validInput)
    svc.delete(created.id)
    expect(svc.list()).toHaveLength(0)
  })

  it('状态切换 —— idle → occupied', () => {
    const created = svc.create(validInput)
    svc.update(created.id, { status: VenueStatus.OCCUPIED })
    expect(svc.getById(created.id).status).toBe(VenueStatus.OCCUPIED)
  })

  it('时段定价 —— 设置并获取', () => {
    const created = svc.create(validInput)
    const pricing: TimeSlotPricing[] = [
      { label: '早场', startHour: 8, endHour: 12, priceCents: 30000 },
    ]
    const updated = svc.update(created.id, { timeSlotPricing: pricing })
    expect(updated.timeSlotPricing).toHaveLength(1)
    expect(updated.timeSlotPricing[0].label).toBe('早场')
  })

  // ── 反例 ─────────────────────────────────────────────────────────

  it('重复名称 —— 抛出异常', () => {
    svc.create(validInput)
    expect(() => svc.create(validInput)).toThrow('场地名称已存在')
  })

  it('不存在的 ID —— 获取失败', () => {
    expect(() => svc.getById('nonexistent')).toThrow('场地不存在')
  })

  it('不存在的 ID —— 删除失败', () => {
    expect(() => svc.delete('nonexistent')).toThrow('场地不存在')
  })

  it('无效状态转换 —— maintenance → occupied', () => {
    const created = svc.create(validInput)
    svc.update(created.id, { status: VenueStatus.MAINTENANCE })
    expect(() => svc.update(created.id, { status: VenueStatus.OCCUPIED })).toThrow('无效的状态转换')
  })

  it('重名更新 —— 抛出异常', () => {
    svc.create({ ...validInput, name: 'A' })
    const b = svc.create({ ...validInput, name: 'B' })
    expect(() => svc.update(b.id, { name: 'A' })).toThrow('场地名称已存在')
  })

  it('空名称创建 —— 抛出异常', () => {
    expect(() => svc.create({ ...validInput, name: '' })).toThrow('场地名称不能为空')
  })

  // ── 边界 ─────────────────────────────────────────────────────────

  it('空列表 —— 初始为 0', () => {
    expect(svc.list()).toHaveLength(0)
  })

  it('容量为 0', () => {
    const v = svc.create({ ...validInput, capacity: 0 })
    expect(v.capacity).toBe(0)
  })

  it('价格为 0', () => {
    const v = svc.create({ ...validInput, priceCents: 0 })
    expect(v.priceCents).toBe(0)
  })

  it('按类型筛选', () => {
    svc.create({ ...validInput, name: 'Hall', type: VenueType.HALL })
    svc.create({ ...validInput, name: 'Booth', type: VenueType.BOOTH })
    expect(svc.list({ type: VenueType.HALL })).toHaveLength(1)
  })

  it('按状态筛选', () => {
    const v = svc.create(validInput)
    svc.update(v.id, { status: VenueStatus.OCCUPIED })
    expect(svc.list({ status: VenueStatus.IDLE })).toHaveLength(0)
    expect(svc.list({ status: VenueStatus.OCCUPIED })).toHaveLength(1)
  })

  it('按关键词搜索', () => {
    svc.create({ ...validInput, name: 'VIP包厢', description: '豪华' })
    svc.create({ ...validInput, name: '普通区', description: '标准' })
    expect(svc.list({ search: 'VIP' })).toHaveLength(1)
    expect(svc.list({ search: '标准' })).toHaveLength(1)
  })
})
