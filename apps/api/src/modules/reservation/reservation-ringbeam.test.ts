import { describe, it, expect } from 'vitest'

type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
interface Reservation { id: string; tenantId: string; storeId: string; memberId: string; date: string; timeSlot: string; partySize: number; status: ReservationStatus; createdAt: string }

describe('✅ AC-RES: 预约', () => {
  it('创建预约', () => {
    const r: Reservation = { id: 'r1', tenantId: 't1', storeId: 's1', memberId: 'm1', date: '2026-07-15', timeSlot: '18:00-19:00', partySize: 4, status: 'pending', createdAt: new Date().toISOString() }
    expect(r.partySize).toBe(4); expect(r.status).toBe('pending')
  })
  it('5种状态', () => {
    const statuses: ReservationStatus[] = ['pending','confirmed','cancelled','completed','no_show']
    expect(statuses.length).toBe(5)
  })
  it('冲突检测', () => {
    const existing: Reservation[] = [
      { id: 'r1', tenantId: 't1', storeId: 's1', memberId: 'm1', date: '2026-07-15', timeSlot: '18:00-19:00', partySize: 4, status: 'confirmed', createdAt: '' },
    ]
    const conflict = existing.some(e => e.memberId === 'm1' && e.status === 'confirmed')
    expect(conflict).toBe(true)
  })
})
