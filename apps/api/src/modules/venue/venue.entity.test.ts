/**
 * venue.entity.test.ts — P-25 场地管理测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { VenueService, VenueType, VenueStatus } from './venue.entity'
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'

describe('VenueService', () => {
  let service: VenueService

  beforeEach(() => {
    service = new VenueService()
  })

  // ── 正例 ──

  it('should list venues with defaults', () => {
    const venues = service.list()
    expect(venues.length).toBeGreaterThanOrEqual(2)
    expect(venues[0].name).toBeDefined()
  })

  it('should get venue by id', () => {
    const venues = service.list()
    const venue = service.getById(venues[0].id)
    expect(venue.id).toBe(venues[0].id)
  })

  it('should create a new venue', () => {
    const venue = service.create({
      name: '测试场地A',
      type: VenueType.INDOOR,
      capacity: 50,
      priceCents: 100000,
    })
    expect(venue.name).toBe('测试场地A')
    expect(venue.status).toBe(VenueStatus.IDLE)
    expect(venue.capacity).toBe(50)
  })

  it('should update venue name', () => {
    const v = service.list()[0]
    const updated = service.update(v.id, { name: '新名字' })
    expect(updated.name).toBe('新名字')
  })

  it('should update venue status', () => {
    const v = service.list()[0]
    const updated = service.changeStatus(v.id, VenueStatus.OCCUPIED)
    expect(updated.status).toBe(VenueStatus.OCCUPIED)
  })

  it('should delete venue', () => {
    const v = service.list()[0]
    service.delete(v.id)
    expect(() => service.getById(v.id)).toThrow(NotFoundException)
  })

  it('should create venue with tags and description', () => {
    const v = service.create({
      name: '带标签场地',
      type: VenueType.OUTDOOR,
      capacity: 100,
      priceCents: 200000,
      tags: ['户外', '活动'],
      description: '户外活动场地',
    })
    expect(v.tags).toContain('户外')
    expect(v.description).toBe('户外活动场地')
  })

  it('should create venue with time slot pricing', () => {
    const v = service.create({
      name: '时段定价场地',
      type: VenueType.BOOTH,
      capacity: 10,
      priceCents: 50000,
      timeSlotPricing: [{ label: '晚场', startHour: 18, endHour: 22, priceCents: 80000 }],
    })
    expect(v.timeSlotPricing).toHaveLength(1)
    expect(v.timeSlotPricing[0].priceCents).toBe(80000)
  })

  it('should filter by type', () => {
    const halls = service.list({ type: VenueType.HALL })
    expect(halls.length).toBeGreaterThanOrEqual(1)
    expect(halls[0].type).toBe(VenueType.HALL)
  })

  it('should filter by status', () => {
    const idle = service.list({ status: VenueStatus.IDLE })
    expect(idle.every((v) => v.status === VenueStatus.IDLE)).toBe(true)
  })

  it('should search by name', () => {
    const results = service.list({ search: '大厅' })
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('should return updatedAt after update', async () => {
    const v = service.list()[0]
    const before = v.updatedAt
    await new Promise((r) => setTimeout(r, 5))
    const updated = service.update(v.id, { description: 'updated' })
    expect(updated.updatedAt).not.toBe(before)
  })

  // ── 反例 ──

  it('should throw on get nonexistent id', () => {
    expect(() => service.getById('nonexistent-uuid')).toThrow(NotFoundException)
  })

  it('should throw on create empty name', () => {
    expect(() => service.create({
      name: '', type: VenueType.INDOOR, capacity: 10, priceCents: 1000,
    })).toThrow(BadRequestException)
  })

  it('should throw on create negative capacity', () => {
    expect(() => service.create({
      name: '负容量', type: VenueType.INDOOR, capacity: -1, priceCents: 1000,
    })).toThrow(BadRequestException)
  })

  it('should throw on create negative price', () => {
    expect(() => service.create({
      name: '负价格', type: VenueType.INDOOR, capacity: 10, priceCents: -100,
    })).toThrow(BadRequestException)
  })

  it('should throw on duplicate name', () => {
    const v = service.list()[0]
    expect(() => service.create({
      name: v.name, type: VenueType.INDOOR, capacity: 10, priceCents: 1000,
    })).toThrow(ConflictException)
  })

  it('should throw on delete nonexistent', () => {
    expect(() => service.delete('nonexistent-uuid')).toThrow(NotFoundException)
  })

  it('should throw on update with empty name', () => {
    const v = service.list()[0]
    expect(() => service.update(v.id, { name: '' })).toThrow(BadRequestException)
  })

  // ── 边界 ──

  it('should handle empty search result', () => {
    const results = service.list({ search: '不可能存在的场地名称xyz' })
    expect(results).toHaveLength(0)
  })

  it('should handle capacity zero', () => {
    const v = service.create({
      name: '零容量', type: VenueType.BOOTH, capacity: 0, priceCents: 0,
    })
    expect(v.capacity).toBe(0)
  })

  it('should handle price zero', () => {
    const v = service.create({
      name: '免费场地', type: VenueType.OUTDOOR, capacity: 100, priceCents: 0,
    })
    expect(v.priceCents).toBe(0)
  })

  it('should order by creation time', () => {
    const v1 = service.create({ name: '场地A', type: VenueType.INDOOR, capacity: 10, priceCents: 1000 })
    const v2 = service.create({ name: '场地B', type: VenueType.INDOOR, capacity: 20, priceCents: 2000 })
    const list = service.list()
    const idx1 = list.findIndex((v) => v.id === v1.id)
    const idx2 = list.findIndex((v) => v.id === v2.id)
    expect(idx1).toBeLessThan(idx2)
  })

  it('should update status to all types', () => {
    const v = service.list()[0]
    for (const s of Object.values(VenueStatus)) {
      const updated = service.changeStatus(v.id, s)
      expect(updated.status).toBe(s)
    }
  })
})

// Total: 25 tests
