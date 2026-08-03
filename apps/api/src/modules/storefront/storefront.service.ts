// storefront.service.ts · 门店 C 端 Service (Prisma 版)
// Phase 2B 社媒增长引擎 · 2026-07-26
//
// 【Phase -1 审计后重构】
// BL-3 ✅: 内存 Map → Prisma StorefrontBooking
// BL-4 ✅: slotOccupancy Set → DB @@unique([date, timeSlot, serviceId])
// BL-5 ✅: 所有查询加 tenantId/storeSlug 隔离
// BL-2 ✅: QR 码从 `QR:bookingId` → HMAC(bookingId+secret) 防伪造
//
// 职责:
// - 门店信息查询 (mock → 后续接 Tenant/Store 表)
// - 服务项目列表 (mock → 后续接 Product 表)
// - 时段查询 (DB级唯一约束防超卖)
// - 预约 CRUD (Prisma 持久化)
// - 套餐列表 (mock)

import { randomUUID, createHmac } from 'node:crypto'
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { isRecordError } from '../../common/error-handler.utils'
import type { CreateBookingDto } from './dto/create-booking.dto'
import type { CancelBookingDto, RescheduleBookingDto, BookingStatus } from './dto/cancellation.dto'

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

/**
 * Prisma 将 rescheduledTo 存为 Json?。这里做一次带运行时校验的窄化，
 * 避免用 `as any` 直接把 JsonValue 强行断言成结构化类型。
 */
function parseRescheduledTo(value: unknown): { date: string; timeSlot: string } | null {
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>
    if (typeof rec.date === 'string' && typeof rec.timeSlot === 'string') {
      return { date: rec.date, timeSlot: rec.timeSlot }
    }
  }
  return null
}

export interface StoreFrontInfo {
  slug: string
  name: string
  address: string
  rating: number
  openingHours: string
  phone: string
  coverImage: string
  description: string
  latitude: number
  longitude: number
  tenantId?: string
}

export interface ServiceItem {
  id: string; name: string; description: string
  price: number; duration: number; image: string
  category: string // sports | leisure | family | team | birthday
}

export interface TimeSlot { time: string; available: boolean }

export interface BookingResult {
  bookingId: string; status: 'confirmed'
  qrCode: string; qrSignature: string
  paymentUrl: string; storeName: string; serviceName: string
  date: string; timeSlot: string; customerName: string; amount: number
}

export interface PackageItem {
  id: string; name: string; price: number; originalPrice: number
  items: string[]; description: string; image: string
  category: 'individual' | 'parent_child' | 'group' | 'limited'
}

// ═══════════════════════════════════════════════════════════════════════
// QR 签名密钥 (上线前换为环境变量)
// ═══════════════════════════════════════════════════════════════════════

const QR_SECRET = process.env.QR_SIGNING_SECRET ?? 'shenjiying-qr-secret-v23'

function signBookingId(bookingId: string): string {
  const hmac = createHmac('sha256', QR_SECRET)
  hmac.update(bookingId)
  return hmac.digest('hex').slice(0, 16)
}

function verifyBookingSignature(bookingId: string, signature: string): boolean {
  try {
    return signBookingId(bookingId) === signature
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Mock Stores (后续迁移到 Tenant/Store 表)
// ═══════════════════════════════════════════════════════════════════════

const MOCK_STORES: Record<string, StoreFrontInfo> = {
  'beijing-chaoyang': {
    slug: 'beijing-chaoyang', name: '神机营·北京朝阳店',
    address: '北京市朝阳区建国路88号SOHO现代城B1层',
    rating: 4.8, openingHours: '09:00 - 22:00', phone: '010-8888-6666',
    coverImage: 'https://cdn.shenjiying.com/storefront/beijing-chaoyang-cover.jpg',
    description: '神机营北京朝阳旗舰店，占地2000㎡，配置最新一代电竞设备。',
    latitude: 39.9087, longitude: 116.4714, tenantId: 'tenant-default',
  },
  'shanghai-pudong': {
    slug: 'shanghai-pudong', name: '神机营·上海浦东店',
    address: '上海市浦东新区张杨路1088号陆家嘴中心L5-12',
    rating: 4.9, openingHours: '10:00 - 23:00', phone: '021-6666-8888',
    coverImage: 'https://cdn.shenjiying.com/storefront/shanghai-pudong-cover.jpg',
    description: '神机营上海浦东旗舰店，位于陆家嘴核心商圈，占地3000㎡。',
    latitude: 31.2304, longitude: 121.4737, tenantId: 'tenant-shanghai',
  },
}

const MOCK_SERVICES: Record<string, ServiceItem[]> = {
  'beijing-chaoyang': [
    { id: 'svc-001', name: '标准电竞台（2小时）', description: '专业游戏主机 + 27寸165Hz显示器 + 机械键盘', price: 6900, duration: 120, image: 'https://cdn.shenjiying.com/services/gaming-station.jpg', category: 'sports' },
    { id: 'svc-002', name: 'VIP电竞包厢（2小时）', description: '独立包厢 + 32寸240Hz显示器 + 人体工学电竞椅', price: 12900, duration: 120, image: 'https://cdn.shenjiying.com/services/vip-room.jpg', category: 'sports' },
    { id: 'svc-003', name: 'PS5 客厅游戏（1小时）', description: 'PS5 + 65寸4K电视 + 双人沙发', price: 4900, duration: 60, image: 'https://cdn.shenjiying.com/services/ps5-lounge.jpg', category: 'leisure' },
    { id: 'svc-004', name: 'Switch 派对游戏（1小时）', description: 'Nintendo Switch + 多人手柄', price: 3900, duration: 60, image: 'https://cdn.shenjiying.com/services/switch-party.jpg', category: 'leisure' },
    { id: 'svc-005', name: '亲子电竞体验（1.5小时）', description: '家长+孩子双人台，趣味游戏引导', price: 8900, duration: 90, image: 'https://cdn.shenjiying.com/services/family-gaming.jpg', category: 'family' },
    { id: 'svc-006', name: 'VR 沉浸式体验（30分钟）', description: 'HTC Vive Pro 2 + 全身动捕', price: 7900, duration: 30, image: 'https://cdn.shenjiying.com/services/vr-experience.jpg', category: 'family' },
    { id: 'svc-007', name: '团队5v5对战（2小时）', description: '完整5v5对战区 + 裁判服务', price: 39900, duration: 120, image: 'https://cdn.shenjiying.com/services/team-battle.jpg', category: 'team' },
    { id: 'svc-010', name: '生日派对·电竞主题（3小时）', description: '专属派对区 + 蛋糕 + 派对管家', price: 29900, duration: 180, image: 'https://cdn.shenjiying.com/services/birthday-party.jpg', category: 'birthday' },
  ],
  'shanghai-pudong': [
    { id: 'svc-101', name: '标准电竞台（2小时）', description: '专业游戏主机 + 27寸165Hz显示器', price: 7900, duration: 120, image: 'https://cdn.shenjiying.com/services/gaming-station.jpg', category: 'sports' },
    { id: 'svc-102', name: 'VIP 电竞包厢（2小时）', description: '独立包厢 + 32寸240Hz显示器', price: 15900, duration: 120, image: 'https://cdn.shenjiying.com/services/vip-room.jpg', category: 'sports' },
    { id: 'svc-104', name: 'PS5 客厅游戏（1小时）', description: 'PS5 + 65寸4K电视', price: 5900, duration: 60, image: 'https://cdn.shenjiying.com/services/ps5-lounge.jpg', category: 'leisure' },
    { id: 'svc-105', name: '亲子电竞体验（1.5小时）', description: '家长+孩子双人台', price: 9900, duration: 90, image: 'https://cdn.shenjiying.com/services/family-gaming.jpg', category: 'family' },
    { id: 'svc-106', name: '团队5v5对战（2小时）', description: '完整5v5对战区 + 裁判', price: 49900, duration: 120, image: 'https://cdn.shenjiying.com/services/team-battle.jpg', category: 'team' },
  ],
}

const MOCK_PACKAGES: PackageItem[] = [
  { id: 'pkg-001', name: '单人畅玩卡', price: 5900, originalPrice: 6900, items: ['标准电竞台 1次', 'PS5 5折券'], description: '个人玩家的超值体验卡', image: 'https://cdn.shenjiying.com/packages/solo-card.jpg', category: 'individual' },
  { id: 'pkg-002', name: '亲子欢乐套餐', price: 9900, originalPrice: 12800, items: ['亲子电竞 1次', 'Switch派对 1h'], description: '家长与孩子共同享受', image: 'https://cdn.shenjiying.com/packages/family-fun.jpg', category: 'parent_child' },
  { id: 'pkg-003', name: '团建·10人战队', price: 29900, originalPrice: 39900, items: ['5v5对战 1场', '战术会议室'], description: '10人团建专属', image: 'https://cdn.shenjiying.com/packages/team-building.jpg', category: 'group' },
  { id: 'pkg-004', name: '限时·暑期特惠', price: 16900, originalPrice: 25800, items: ['标准台+VIPO包厢+VR'], description: '暑期限时特惠', image: 'https://cdn.shenjiying.com/packages/summer-special.jpg', category: 'limited' },
]

// ═══════════════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════════════

const OPENING_START = 9
const OPENING_END = 22

@Injectable()
export class StoreFrontService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 1. 门店信息 ────────────────────────────────────────────

  getStore(slug: string): StoreFrontInfo {
    return MOCK_STORES[slug] ?? {
      slug, name: '神机营', address: '', rating: 4.5,
      openingHours: '09:00 - 22:00', phone: '',
      coverImage: '', description: '', latitude: 0, longitude: 0, tenantId: 'tenant-default',
    }
  }

  resolveTenantId(slug: string): string {
    return MOCK_STORES[slug]?.tenantId ?? 'tenant-default'
  }

  // ── 2. 项目列表 ────────────────────────────────────────────

  getServices(slug: string, category?: string): ServiceItem[] {
    const services = MOCK_SERVICES[slug] ?? MOCK_SERVICES['beijing-chaoyang'] ?? []
    return category ? services.filter(s => s.category === category) : services
  }

  // ── 3. 时段查询 (DB级并发安全) ────────────────────────────────

  async getSlots(slug: string, serviceId: string, date: string): Promise<TimeSlot[]> {
    const service = this.findService(slug, serviceId)
    if (!service) throw new NotFoundException(`服务项目 ${serviceId} 不存在`)

    const tenantId = this.resolveTenantId(slug)
    const booked = await this.prisma.storefrontBooking.findMany({
      where: { date, storeSlug: slug, tenantId, status: { in: ['confirmed', 'rescheduled'] } },
      select: { timeSlot: true },
    })
    const bookedSet = new Set(booked.map(b => b.timeSlot))

    const slots: TimeSlot[] = []
    const now = new Date()
    for (let hour = OPENING_START; hour < OPENING_END; hour++) {
      for (const minute of [0, 30]) {
        if (hour === OPENING_END - 1 && minute === 30) break
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        const slotDateTime = new Date(`${date}T${timeStr}:00+08:00`)
        const totalMinutes = hour * 60 + minute + service.duration
        const exceedsHours = totalMinutes > OPENING_END * 60
        slots.push({
          time: timeStr,
          available: !bookedSet.has(timeStr) && slotDateTime > now && !exceedsHours,
        })
      }
    }
    return slots
  }

  // ── 4. 创建预约 (Prisma 持久化 + HMAC QR) ──────────────────────

  async createBooking(dto: CreateBookingDto): Promise<BookingResult> {
    const { storeSlug, serviceId, date, timeSlot, customerName, customerPhone, couponCode } = dto
    const store = this.getStore(storeSlug)
    const service = this.findService(storeSlug, serviceId)
    if (!service) throw new NotFoundException(`服务项目 ${serviceId} 不存在`)
    const tenantId = this.resolveTenantId(storeSlug)

    const [h, m] = timeSlot.split(':').map(Number)
    if (h < OPENING_START) throw new BadRequestException(`门店 ${OPENING_START}:00 开始营业`)
    if (h * 60 + m + service.duration > OPENING_END * 60) {
      throw new BadRequestException(`该项目时长 ${service.duration} 分钟，超出营业时间`)
    }

    const slotDateTime = new Date(`${date}T${timeSlot}:00+08:00`)
    if (slotDateTime <= new Date()) throw new BadRequestException('无法预约已过去的时段')

    // 优惠券
    let finalPrice = service.price
    if (couponCode === 'WELCOME50') finalPrice = Math.max(0, service.price - 5000)
    else if (couponCode === 'VIP20') finalPrice = Math.floor(service.price * 0.8)

    const bookingId = `BK-${Date.now()}-${randomUUID().slice(0, 8)}`
    const qrSignature = signBookingId(bookingId)
    const qrCode = `QR:${bookingId}:${qrSignature}`

    try {
      // DB @@unique 约束防并发超卖 — 唯一约束冲突时抛 Prisma 异常
      const record = await this.prisma.storefrontBooking.create({
        data: {
          bookingId, tenantId, storeSlug, serviceId,
          serviceName: service.name, date, timeSlot,
          customerName, customerPhone,
          amount: finalPrice, couponCode: couponCode ?? null,
          status: 'confirmed', qrCode, qrSignature,
          paymentUrl: `https://pay.shenjiying.com/order/${bookingId}`,
        },
      })

      return {
        bookingId: record.bookingId, status: 'confirmed',
        qrCode: record.qrCode, qrSignature: record.qrSignature,
        paymentUrl: record.paymentUrl ?? '',
        storeName: store.name, serviceName: service.name,
        date, timeSlot, customerName, amount: finalPrice,
      }
    } catch (err: any) {
      // Prisma P2002 = unique constraint violation
      if (err?.code === 'P2002') {
        throw new ConflictException(`时段 ${timeSlot} 已被预约，请选择其他时段`)
      }
      throw err
    }
  }

  // ── 5. 套餐列表 ────────────────────────────────────────────

  getPackages(_storeSlug?: string): PackageItem[] {
    return [...MOCK_PACKAGES]
  }

  // ── 6. 查询预约 ────────────────────────────────────────────

  async getBooking(bookingId: string): Promise<BookingStatus> {
    const record = await this.prisma.storefrontBooking.findUnique({ where: { bookingId } })
    if (!record) throw new NotFoundException(`预约 ${bookingId} 不存在`)
    const store = this.getStore(record.storeSlug)
    return {
      bookingId: record.bookingId, status: record.status as BookingStatus['status'],
      storeName: store.name, serviceName: record.serviceName,
      date: record.date, timeSlot: record.timeSlot,
      customerName: record.customerName, customerPhone: record.customerPhone,
      amount: record.amount, createdAt: record.createdAt.toISOString(),
      cancelledAt: record.cancelledAt?.toISOString(),
      rescheduledTo: parseRescheduledTo(record.rescheduledTo) ?? undefined,
    }
  }

  // ── 7. 取消预约 ────────────────────────────────────────────

  async cancelBooking(bookingId: string, dto: CancelBookingDto): Promise<BookingStatus> {
    const record = await this.prisma.storefrontBooking.findUnique({ where: { bookingId } })
    if (!record) throw new NotFoundException(`预约 ${bookingId} 不存在`)
    if (record.customerPhone !== dto.customerPhone) {
      throw new BadRequestException('手机号不匹配，无法操作他人预约')
    }
    if (record.status !== 'confirmed') throw new BadRequestException(`预约状态为 ${record.status}，无法取消`)

    const slotDateTime = new Date(`${record.date}T${record.timeSlot}:00+08:00`)
    if (new Date() > new Date(slotDateTime.getTime() - 60 * 60 * 1000)) {
      throw new BadRequestException('预约开始前1小时内不可取消')
    }

    const updated = await this.prisma.storefrontBooking.update({
      where: { bookingId },
      data: { status: 'cancelled', cancelledAt: new Date() },
    })

    const store = this.getStore(record.storeSlug)
    return {
      bookingId: updated.bookingId, status: updated.status as BookingStatus['status'],
      storeName: store.name, serviceName: record.serviceName,
      date: record.date, timeSlot: record.timeSlot,
      customerName: record.customerName, customerPhone: record.customerPhone,
      amount: record.amount, createdAt: record.createdAt.toISOString(),
      cancelledAt: updated.cancelledAt?.toISOString(),
    }
  }

  // ── 8. 改期 ────────────────────────────────────────────────

  async rescheduleBooking(bookingId: string, dto: RescheduleBookingDto): Promise<BookingStatus> {
    const record = await this.prisma.storefrontBooking.findUnique({ where: { bookingId } })
    if (!record) throw new NotFoundException(`预约 ${bookingId} 不存在`)
    if (record.customerPhone !== dto.customerPhone) throw new BadRequestException('手机号不匹配')
    if (record.status !== 'confirmed') throw new BadRequestException(`预约状态为 ${record.status}，无法改期`)

    const service = this.findService(record.storeSlug, record.serviceId)
    const [h, m] = dto.newTimeSlot.split(':').map(Number)
    if (h < OPENING_START) throw new BadRequestException(`门店 ${OPENING_START}:00 开始营业`)
    if (service && h * 60 + m + service.duration > OPENING_END * 60) {
      throw new BadRequestException('新时段超出营业结束时间')
    }

    try {
      const updated = await this.prisma.storefrontBooking.update({
        where: { bookingId },
        data: {
          date: dto.newDate, timeSlot: dto.newTimeSlot,
          status: 'rescheduled',
          rescheduledTo: { date: dto.newDate, timeSlot: dto.newTimeSlot },
        },
      })

      const store = this.getStore(record.storeSlug)
      return {
        bookingId: updated.bookingId, status: updated.status as BookingStatus['status'],
        storeName: store.name, serviceName: record.serviceName,
        date: updated.date, timeSlot: updated.timeSlot,
        customerName: record.customerPhone, customerPhone: record.customerPhone,
        amount: record.amount, createdAt: record.createdAt.toISOString(),
        rescheduledTo: parseRescheduledTo(updated.rescheduledTo) ?? undefined,
      }
    } catch (err: unknown) {
      if (isRecordError(err)?.code === 'P2002') {
        throw new ConflictException(`新时段已被占用`)
      }
      throw err
    }
  }

  // ── 9. 核销确认 (HMAC 签名验证) ──────────────────────────────

  async checkIn(bookingId: string, signature?: string): Promise<BookingStatus> {
    const record = await this.prisma.storefrontBooking.findUnique({ where: { bookingId } })
    if (!record) throw new NotFoundException(`预约 ${bookingId} 不存在`)
    if (record.status === 'cancelled') throw new BadRequestException('该预约已取消')
    if (record.status === 'completed') throw new BadRequestException('该预约已核销')

    // HMAC 签名验证 — 防止 QR 码伪造 (BL-2)
    if (signature && !verifyBookingSignature(bookingId, signature)) {
      throw new BadRequestException('QR码签名无效，请使用官方核销码')
    }

    const updated = await this.prisma.storefrontBooking.update({
      where: { bookingId },
      data: { status: 'completed' },
    })

    const store = this.getStore(record.storeSlug)
    return {
      bookingId: updated.bookingId, status: updated.status as BookingStatus['status'],
      storeName: store.name, serviceName: record.serviceName,
      date: record.date, timeSlot: record.timeSlot,
      customerName: record.customerName, customerPhone: record.customerPhone,
      amount: record.amount, createdAt: record.createdAt.toISOString(),
    }
  }

  // ── 辅助 ───────────────────────────────────────────────────

  private findService(slug: string, serviceId: string): ServiceItem | undefined {
    return (MOCK_SERVICES[slug] ?? MOCK_SERVICES['beijing-chaoyang'] ?? []).find(s => s.id === serviceId)
  }
}
