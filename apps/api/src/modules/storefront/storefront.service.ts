// storefront.service.ts · 门店 C 端 Service
// Phase 1 核心交易闭环 · 2026-07-26
//
// 职责:
// - 门店信息查询
// - 服务项目列表查询
// - 时段可用性查询
// - 预约创建（含并发校验）
// - 套餐列表查询
//
// 当前使用 mock 数据，后续接真实 DB

import { randomUUID } from 'node:crypto'
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import type { CreateBookingDto } from './dto/create-booking.dto'
import type { CancelBookingDto, RescheduleBookingDto, BookingStatus } from './dto/cancellation.dto'

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

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
}

export interface ServiceItem {
  id: string
  name: string
  description: string
  price: number // 单位: 分
  duration: number // 单位: 分钟
  image: string
  category: string // sports / leisure / family / team / birthday
}

export interface TimeSlot {
  time: string // HH:mm
  available: boolean
}

export interface BookingResult {
  bookingId: string
  status: 'confirmed'
  qrCode: string
  paymentUrl: string
  storeName: string
  serviceName: string
  date: string
  timeSlot: string
  customerName: string
  amount: number // 单位: 分
}

export interface PackageItem {
  id: string
  name: string
  price: number
  originalPrice: number
  items: string[]
  description: string
  image: string
  category: 'individual' | 'parent_child' | 'group' | 'limited'
}

// ═══════════════════════════════════════════════════════════════════════
// Mock Stores
// ═══════════════════════════════════════════════════════════════════════

const MOCK_STORES: Record<string, StoreFrontInfo> = {
  'beijing-chaoyang': {
    slug: 'beijing-chaoyang',
    name: '神机营·北京朝阳店',
    address: '北京市朝阳区建国路88号SOHO现代城B1层',
    rating: 4.8,
    openingHours: '09:00 - 22:00',
    phone: '010-8888-6666',
    coverImage: 'https://cdn.shenjiying.com/storefront/beijing-chaoyang-cover.jpg',
    description: '神机营北京朝阳旗舰店，占地2000㎡，配置最新一代电竞设备，提供专业赛事场地、休闲娱乐、亲子互动等多种服务场景，是年轻人周末聚会的首选目的地。',
    latitude: 39.9087,
    longitude: 116.4714,
  },
  'shanghai-pudong': {
    slug: 'shanghai-pudong',
    name: '神机营·上海浦东店',
    address: '上海市浦东新区张杨路1088号陆家嘴中心L5-12',
    rating: 4.9,
    openingHours: '10:00 - 23:00',
    phone: '021-6666-8888',
    coverImage: 'https://cdn.shenjiying.com/storefront/shanghai-pudong-cover.jpg',
    description: '神机营上海浦东旗舰店，位于陆家嘴核心商圈，占地3000㎡，拥有顶级电竞外设、VIP包厢和赛事级直播间，是电竞爱好者的圣地。',
    latitude: 31.2304,
    longitude: 121.4737,
  },
}

// ═══════════════════════════════════════════════════════════════════════
// Mock Services（按门店）
// ═══════════════════════════════════════════════════════════════════════

const MOCK_SERVICES: Record<string, ServiceItem[]> = {
  'beijing-chaoyang': [
    {
      id: 'svc-001',
      name: '标准电竞台（2小时）',
      description: '专业游戏主机 + 27寸165Hz显示器 + 机械键盘 + 游戏鼠标，畅玩主流电竞游戏',
      price: 6900, // ¥69.00
      duration: 120,
      image: 'https://cdn.shenjiying.com/services/gaming-station.jpg',
      category: 'sports',
    },
    {
      id: 'svc-002',
      name: 'VIP电竞包厢（2小时）',
      description: '独立包厢 + 32寸240Hz显示器 + 人体工学电竞椅 + 专属空调 + 免费饮品',
      price: 12900, // ¥129.00
      duration: 120,
      image: 'https://cdn.shenjiying.com/services/vip-room.jpg',
      category: 'sports',
    },
    {
      id: 'svc-003',
      name: 'PS5 客厅游戏（1小时）',
      description: 'PS5主机 + 65寸4K电视 + 双人沙发，支持双人同游，含热门游戏库',
      price: 4900, // ¥49.00
      duration: 60,
      image: 'https://cdn.shenjiying.com/services/ps5-lounge.jpg',
      category: 'leisure',
    },
    {
      id: 'svc-004',
      name: 'Switch 派对游戏（1小时）',
      description: 'Nintendo Switch + 多人手柄，支持马里奥派对、舞力全开等合家欢游戏',
      price: 3900, // ¥39.00
      duration: 60,
      image: 'https://cdn.shenjiying.com/services/switch-party.jpg',
      category: 'leisure',
    },
    {
      id: 'svc-005',
      name: '亲子电竞体验（1.5小时）',
      description: '家长+孩子双人台，适合6岁以上儿童，简单趣味游戏引导，培养亲子默契',
      price: 8900, // ¥89.00
      duration: 90,
      image: 'https://cdn.shenjiying.com/services/family-gaming.jpg',
      category: 'family',
    },
    {
      id: 'svc-006',
      name: 'VR 沉浸式体验（30分钟）',
      description: 'HTC Vive Pro 2 + 全身动捕，支持20+款VR游戏，沉浸式虚拟现实体验',
      price: 7900, // ¥79.00
      duration: 30,
      image: 'https://cdn.shenjiying.com/services/vr-experience.jpg',
      category: 'family',
    },
    {
      id: 'svc-007',
      name: '团队5v5对战（2小时）',
      description: '完整5v5对战区，含裁判服务 + 战术会议室 + 赛后复盘，适合企业团建',
      price: 39900, // ¥399.00
      duration: 120,
      image: 'https://cdn.shenjiying.com/services/team-battle.jpg',
      category: 'team',
    },
    {
      id: 'svc-008',
      name: '赛事级训练赛（3小时）',
      description: '专业赛事环境，含OB视角、直播推流、数据统计，适合战队训练',
      price: 59900, // ¥599.00
      duration: 180,
      image: 'https://cdn.shenjiying.com/services/tournament-training.jpg',
      category: 'team',
    },
    {
      id: 'svc-009',
      name: '生日派对·电竞主题（3小时）',
      description: '专属派对区域 + 蛋糕+ 饮料 + 精美布置 + 专职派对管家 + 纪念合影',
      price: 29900, // ¥299.00
      duration: 180,
      image: 'https://cdn.shenjiying.com/services/birthday-party.jpg',
      category: 'birthday',
    },
    {
      id: 'svc-010',
      name: '生日派对·VR主题（3小时）',
      description: 'VR主题派对 + VR团体游戏 + 蛋糕 + 零食包 + 定制VR纪念视频',
      price: 39900, // ¥399.00
      duration: 180,
      image: 'https://cdn.shenjiying.com/services/birthday-vr.jpg',
      category: 'birthday',
    },
  ],
  'shanghai-pudong': [
    {
      id: 'svc-101',
      name: '标准电竞台（2小时）',
      description: '专业游戏主机 + 27寸165Hz显示器 + 机械键盘，畅玩主流电竞游戏',
      price: 7900, // ¥79.00
      duration: 120,
      image: 'https://cdn.shenjiying.com/services/gaming-station.jpg',
      category: 'sports',
    },
    {
      id: 'svc-102',
      name: 'VIP 电竞包厢（2小时）',
      description: '独立包厢 + 32寸240Hz显示器 + DXRacer电竞椅 + 免费饮品 + 零食包',
      price: 15900, // ¥159.00
      duration: 120,
      image: 'https://cdn.shenjiying.com/services/vip-room.jpg',
      category: 'sports',
    },
    {
      id: 'svc-103',
      name: '电竞直播间（2小时）',
      description: '专业直播设备 + 绿幕 + 补光灯 + 调音台，适合主播直播',
      price: 19900, // ¥199.00
      duration: 120,
      image: 'https://cdn.shenjiying.com/services/streaming-room.jpg',
      category: 'sports',
    },
    {
      id: 'svc-104',
      name: 'PS5 客厅游戏（1小时）',
      description: 'PS5 + 65寸4K电视 + 双人沙发 + 热门游戏库',
      price: 5900, // ¥59.00
      duration: 60,
      image: 'https://cdn.shenjiying.com/services/ps5-lounge.jpg',
      category: 'leisure',
    },
    {
      id: 'svc-105',
      name: '亲子电竞体验（1.5小时）',
      description: '家长+孩子双人台，趣味游戏引导，亲子默契培养',
      price: 9900, // ¥99.00
      duration: 90,
      image: 'https://cdn.shenjiying.com/services/family-gaming.jpg',
      category: 'family',
    },
    {
      id: 'svc-106',
      name: '团队5v5对战（2小时）',
      description: '完整5v5对战区 + 裁判 + 战术会议室 + 赛后复盘',
      price: 49900, // ¥499.00
      duration: 120,
      image: 'https://cdn.shenjiying.com/services/team-battle.jpg',
      category: 'team',
    },
    {
      id: 'svc-107',
      name: '生日派对·电竞主题（3小时）',
      description: '专属派对区 + 蛋糕 + 饮料 + 布置 + 派对准家',
      price: 34900, // ¥349.00
      duration: 180,
      image: 'https://cdn.shenjiying.com/services/birthday-party.jpg',
      category: 'birthday',
    },
  ],
}

// ═══════════════════════════════════════════════════════════════════════
// Mock Packages
// ═══════════════════════════════════════════════════════════════════════

const MOCK_PACKAGES: PackageItem[] = [
  {
    id: 'pkg-001',
    name: '单人畅玩卡',
    price: 5900, // ¥59.00
    originalPrice: 6900, // ¥69.00
    items: [
      '标准电竞台 1次（2小时）',
      'PS5客厅游戏 5折券 ×1',
      '免费饮品 ×1',
    ],
    description: '适合个人玩家的超值体验卡，含2小时标准电竞台 + 游戏折扣',
    image: 'https://cdn.shenjiying.com/packages/solo-card.jpg',
    category: 'individual',
  },
  {
    id: 'pkg-002',
    name: '亲子欢乐套餐',
    price: 9900, // ¥99.00
    originalPrice: 12800, // ¥128.00
    items: [
      '亲子电竞体验 1次（1.5小时）',
      'Switch派对游戏 1小时',
      '亲子零食包 ×1',
    ],
    description: '家长与孩子共同享受的电竞时光，含亲子体验 + Switch派对',
    image: 'https://cdn.shenjiying.com/packages/family-fun.jpg',
    category: 'parent_child',
  },
  {
    id: 'pkg-003',
    name: '团建·10人战队',
    price: 29900, // ¥299.00
    originalPrice: 39900, // ¥399.00
    items: [
      '团队5v5对战 1场（2小时）',
      '定制造型合影',
      '战术会议室使用',
      '饮料无限畅饮',
    ],
    description: '10人团建专属，含5v5对战 + 战术复盘 + 定制合影',
    image: 'https://cdn.shenjiying.com/packages/team-building.jpg',
    category: 'group',
  },
  {
    id: 'pkg-004',
    name: '限时·暑期特惠',
    price: 16900, // ¥169.00
    originalPrice: 25800, // ¥258.00
    items: [
      '标准电竞台 1次（2小时）',
      'VIP电竞包厢 1次（2小时）',
      'VR体验 1次（30分钟）',
      '季度会员体验卡',
    ],
    description: '暑期限时特惠套餐，含标准台+VIP包厢+VR体验，低至6.5折！',
    image: 'https://cdn.shenjiying.com/packages/summer-special.jpg',
    category: 'limited',
  },
  {
    id: 'pkg-005',
    name: '生日派对·基础款',
    price: 39900, // ¥399.00
    originalPrice: 49800, // ¥498.00
    items: [
      '生日派对·电竞主题 1场（3小时）',
      '专属生日蛋糕',
      '精美布置 + 气球',
      '专职派对准家',
      '纪念合影 + 电子相册',
    ],
    description: '一站式电竞主题生日派对，让孩子度过难忘的生日',
    image: 'https://cdn.shenjiying.com/packages/birthday-basic.jpg',
    category: 'limited',
  },
]

// ═══════════════════════════════════════════════════════════════════════
// In-memory booking store（模拟数据库）
// ═══════════════════════════════════════════════════════════════════════

interface BookingRecord {
  bookingId: string
  storeSlug: string
  serviceId: string
  date: string
  timeSlot: string
  customerName: string
  customerPhone: string
  amount: number // 分
  couponCode?: string
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show'
  createdAt: string
  cancelledAt?: string
  rescheduledTo?: { date: string; timeSlot: string }
  qrCode: string
  paymentUrl: string
}

const bookingStore = new Map<string, BookingRecord>()

// key: `${storeSlug}:${serviceId}:${date}:${timeSlot}`
const slotOccupancy = new Set<string>()

// ═══════════════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════════════

const OPENING_START = 9 // 09:00
const OPENING_END = 22 // 22:00 — 最后一个时段从 21:30 开始

@Injectable()
export class StoreFrontService {
  // ── 1. 门店信息 ────────────────────────────────────────────

  getStore(slug: string): StoreFrontInfo {
    const store = MOCK_STORES[slug]
    if (!store) {
      // 返回默认 mock 门店
      return {
        slug,
        name: '神机营·北京朝阳店',
        address: '北京市朝阳区建国路88号SOHO现代城B1层',
        rating: 4.8,
        openingHours: '09:00 - 22:00',
        phone: '010-8888-6666',
        coverImage: 'https://cdn.shenjiying.com/storefront/default-cover.jpg',
        description: '神机营北京朝阳旗舰店，专业电竞体验空间。',
        latitude: 39.9087,
        longitude: 116.4714,
      }
    }
    return store
  }

  // ── 2. 项目列表 ────────────────────────────────────────────

  getServices(slug: string, category?: string): ServiceItem[] {
    const services = MOCK_SERVICES[slug] ?? MOCK_SERVICES['beijing-chaoyang'] ?? []
    if (category) {
      return services.filter((s) => s.category === category)
    }
    return services
  }

  // ── 3. 时段查询 ────────────────────────────────────────────

  getSlots(slug: string, serviceId: string, date: string): TimeSlot[] {
    const service = this.findService(slug, serviceId)
    if (!service) {
      throw new NotFoundException(`服务项目 ${serviceId} 不存在`)
    }

    const slots: TimeSlot[] = []
    const now = new Date()
    const dateStr = date // YYYY-MM-DD

    for (let hour = OPENING_START; hour < OPENING_END; hour++) {
      for (const minute of [0, 30]) {
        if (hour === OPENING_END - 1 && minute === 30) break // 最后一个时段 21:30

        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        const slotKey = `${slug}:${serviceId}:${dateStr}:${timeStr}`

        // 已过去的时段标记不可用
        const slotDateTime = new Date(`${dateStr}T${timeStr}:00+08:00`)
        const isPast = slotDateTime <= now

        const occupied = slotOccupancy.has(slotKey)
        slots.push({
          time: timeStr,
          available: !occupied && !isPast,
        })
      }
    }

    return slots
  }

  // ── 4. 创建预约 ────────────────────────────────────────────

  createBooking(dto: CreateBookingDto): BookingResult {
    const { storeSlug, serviceId, date, timeSlot, customerName, customerPhone, couponCode } = dto

    // 校验门店
    const store = this.getStore(storeSlug)

    // 校验服务项目
    const service = this.findService(storeSlug, serviceId)
    if (!service) {
      throw new NotFoundException(`服务项目 ${serviceId} 不存在`)
    }

    // 校验时段是否在营业时间范围内
    const [hourStr, minuteStr] = timeSlot.split(':')
    const hour = parseInt(hourStr, 10)
    const minute = parseInt(minuteStr, 10)

    if (hour < OPENING_START) {
      throw new BadRequestException(`门店 ${OPENING_START}:00 开始营业，无法预约 ${timeSlot}`)
    }

    // 计算该服务结束时间是否超过营业时间
    const totalMinutes = hour * 60 + minute + service.duration
    if (totalMinutes > OPENING_END * 60) {
      throw new BadRequestException(
        `该项目时长 ${service.duration} 分钟，${timeSlot} 开始将超出营业结束时间 ${OPENING_END}:00`,
      )
    }

    // 并发校验：检查时段是否已被占用
    const slotKey = `${storeSlug}:${serviceId}:${date}:${timeSlot}`
    if (slotOccupancy.has(slotKey)) {
      throw new ConflictException(`时段 ${timeSlot} 已被预约，请选择其他时段`)
    }

    // 校验是否为过去的日期/时段
    const slotDateTime = new Date(`${date}T${timeSlot}:00+08:00`)
    if (slotDateTime <= new Date()) {
      throw new BadRequestException('无法预约已过去的时段')
    }

    // 优惠券校验（mock）
    let finalPrice = service.price
    if (couponCode) {
      if (couponCode === 'WELCOME50') {
        finalPrice = Math.max(0, service.price - 5000) // 减50元
      } else if (couponCode === 'VIP20') {
        finalPrice = Math.floor(service.price * 0.8) // 8折
      }
      // 其他优惠券码忽略，不影响预约
    }

    // 创建预约记录
    const bookingId = `BK-${Date.now()}-${randomUUID().slice(0, 8)}`
    const now = new Date().toISOString()

    const booking: BookingRecord = {
      bookingId,
      storeSlug,
      serviceId,
      date,
      timeSlot,
      customerName,
      customerPhone,
      amount: finalPrice,
      couponCode,
      status: 'confirmed',
      createdAt: now,
      qrCode: `QR:${bookingId}`,
      paymentUrl: `https://pay.shenjiying.com/order/${bookingId}`,
    }

    // 模拟原子写入
    bookingStore.set(bookingId, booking)
    slotOccupancy.add(slotKey)

    // 返回结果
    return {
      bookingId,
      status: 'confirmed',
      qrCode: `QR:${bookingId}`,
      paymentUrl: `https://pay.shenjiying.com/order/${bookingId}`,
      storeName: store.name,
      serviceName: service.name,
      date,
      timeSlot,
      customerName,
      amount: finalPrice,
    }
  }

  // ── 5. 套餐列表 ────────────────────────────────────────────

  getPackages(storeSlug?: string): PackageItem[] {
    void storeSlug
    return [...MOCK_PACKAGES]
  }

  // ── 6. 查询预约 ────────────────────────────────────────────

  getBooking(bookingId: string): BookingStatus {
    const record = bookingStore.get(bookingId)
    if (!record) throw new NotFoundException(`预约 ${bookingId} 不存在`)
    const service = this.findService(record.storeSlug, record.serviceId)
    const store = this.getStore(record.storeSlug)
    return {
      bookingId: record.bookingId,
      status: record.status,
      storeName: store.name,
      serviceName: service?.name ?? record.serviceId,
      date: record.date,
      timeSlot: record.timeSlot,
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      amount: record.amount,
      createdAt: record.createdAt,
      cancelledAt: record.cancelledAt,
      rescheduledTo: record.rescheduledTo,
    }
  }

  // ── 7. 取消预约 ────────────────────────────────────────────

  cancelBooking(bookingId: string, dto: CancelBookingDto): BookingStatus {
    const record = bookingStore.get(bookingId)
    if (!record) throw new NotFoundException(`预约 ${bookingId} 不存在`)
    if (record.customerPhone !== dto.customerPhone) {
      throw new BadRequestException('手机号不匹配，无法操作他人预约')
    }
    if (record.status !== 'confirmed') {
      throw new BadRequestException(`预约状态为 ${record.status}，无法取消`)
    }

    // 取消前至少提前1小时
    const slotDateTime = new Date(`${record.date}T${record.timeSlot}:00+08:00`)
    const oneHourBefore = new Date(slotDateTime.getTime() - 60 * 60 * 1000)
    if (new Date() > oneHourBefore) {
      throw new BadRequestException('预约开始前1小时内不可取消，请直接联系门店')
    }

    record.status = 'cancelled'
    record.cancelledAt = new Date().toISOString()

    // 释放时段
    bookingStore.set(bookingId, record)
    const slotKey = `${record.storeSlug}:${record.serviceId}:${record.date}:${record.timeSlot}`
    slotOccupancy.delete(slotKey)

    const service = this.findService(record.storeSlug, record.serviceId)
    const store = this.getStore(record.storeSlug)
    return {
      bookingId: record.bookingId,
      status: record.status,
      storeName: store.name,
      serviceName: service?.name ?? record.serviceId,
      date: record.date,
      timeSlot: record.timeSlot,
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      amount: record.amount,
      createdAt: record.createdAt,
      cancelledAt: record.cancelledAt,
    }
  }

  // ── 8. 改期 ────────────────────────────────────────────────

  rescheduleBooking(bookingId: string, dto: RescheduleBookingDto): BookingStatus {
    const record = bookingStore.get(bookingId)
    if (!record) throw new NotFoundException(`预约 ${bookingId} 不存在`)
    if (record.customerPhone !== dto.customerPhone) {
      throw new BadRequestException('手机号不匹配')
    }
    if (record.status !== 'confirmed') {
      throw new BadRequestException(`预约状态为 ${record.status}，无法改期`)
    }

    // 校验新时段是否可用
    const newSlotKey = `${dto.storeSlug}:${record.serviceId}:${dto.newDate}:${dto.newTimeSlot}`
    if (slotOccupancy.has(newSlotKey)) {
      throw new ConflictException(`新时段 ${dto.newDate} ${dto.newTimeSlot} 已被占用`)
    }

    // 校验新时段是否在营业时间范围内
    const [h, m] = dto.newTimeSlot.split(':').map(Number)
    if (h < OPENING_START) throw new BadRequestException(`门店 ${OPENING_START}:00 开始营业`)
    const service = this.findService(record.storeSlug, record.serviceId)
    if (service && (h * 60 + m + service.duration > OPENING_END * 60)) {
      throw new BadRequestException('新时段超出营业结束时间')
    }

    // 释放旧时段
    const oldSlotKey = `${record.storeSlug}:${record.serviceId}:${record.date}:${record.timeSlot}`
    slotOccupancy.delete(oldSlotKey)

    // 占用新时段
    slotOccupancy.add(newSlotKey)

    record.rescheduledTo = { date: dto.newDate, timeSlot: dto.newTimeSlot }
    record.date = dto.newDate
    record.timeSlot = dto.newTimeSlot
    record.status = 'rescheduled'
    bookingStore.set(bookingId, record)

    const store = this.getStore(record.storeSlug)
    return {
      bookingId: record.bookingId,
      status: record.status,
      storeName: store.name,
      serviceName: service?.name ?? record.serviceId,
      date: record.date,
      timeSlot: record.timeSlot,
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      amount: record.amount,
      createdAt: record.createdAt,
      rescheduledTo: record.rescheduledTo,
    }
  }

  // ── 9. 核销确认 ────────────────────────────────────────────

  checkIn(bookingId: string): BookingStatus {
    const record = bookingStore.get(bookingId)
    if (!record) throw new NotFoundException(`预约 ${bookingId} 不存在`)
    if (record.status === 'cancelled') throw new BadRequestException('该预约已取消')
    if (record.status === 'completed') throw new BadRequestException('该预约已核销，请勿重复操作')

    record.status = 'completed'
    bookingStore.set(bookingId, record)

    const service = this.findService(record.storeSlug, record.serviceId)
    const store = this.getStore(record.storeSlug)
    return {
      bookingId: record.bookingId,
      status: record.status,
      storeName: store.name,
      serviceName: service?.name ?? record.serviceId,
      date: record.date,
      timeSlot: record.timeSlot,
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      amount: record.amount,
      createdAt: record.createdAt,
    }
  }

  // ── 辅助方法 ───────────────────────────────────────────────

  private findService(slug: string, serviceId: string): ServiceItem | undefined {
    const services = MOCK_SERVICES[slug] ?? MOCK_SERVICES['beijing-chaoyang'] ?? []
    return services.find((s) => s.id === serviceId)
  }
}
