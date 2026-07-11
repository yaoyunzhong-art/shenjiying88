/**
 * Venue Entity 单元测试
 *
 * 覆盖场景（按使用者角色）：
 *   👔 店长：场地创建 / 属性赋值 / 枚举状态
 *   👥 运营：设施管理 / 预订策略 / 价格与评分
 *   🎯 系统管理员：软删除 / 时间戳 / UUID 生成
 *
 * 单模块铁律：仅测试 entity 方法（generateId / constructor / enum / 字段默认值）。
 */

import { Venue, VenueStatus, VenueType } from './venue.entity';
import { v4 as uuidv4 } from 'uuid';

describe('Venue Entity — 角色模拟测试', () => {
  // ═══════════════════════════════════════════════════════════════
  // 👔 店长角色：场地创建 / 属性赋值 / 枚举状态
  // ═══════════════════════════════════════════════════════════════

  describe('👔 店长：场地创建 / 属性赋值 / 枚举状态', () => {
    it('创建场地 → 所有基本字段可赋值', () => {
      const venue = new Venue();
      venue.id = 'venue-001';
      venue.name = '上海体育馆羽毛球馆';
      venue.description = '专业羽毛球场馆，共 12 片场地';
      venue.address = '上海市浦东新区世纪大道 1000 号';
      venue.city = '上海';
      venue.province = '上海';
      venue.postalCode = '200120';
      venue.country = '中国';
      venue.contactPhone = '021-12345678';
      venue.contactEmail = 'contact@venue.example.com';

      expect(venue.id).toBe('venue-001');
      expect(venue.name).toBe('上海体育馆羽毛球馆');
      expect(venue.description).toBe('专业羽毛球场馆，共 12 片场地');
      expect(venue.address).toBe('上海市浦东新区世纪大道 1000 号');
      expect(venue.city).toBe('上海');
      expect(venue.province).toBe('上海');
      expect(venue.postalCode).toBe('200120');
      expect(venue.country).toBe('中国');
      expect(venue.contactPhone).toBe('021-12345678');
      expect(venue.contactEmail).toBe('contact@venue.example.com');
    });

    it('场地类型枚举 → 所有 VenueType 值可用', () => {
      expect(VenueType.GYM).toBe('gym');
      expect(VenueType.STADIUM).toBe('stadium');
      expect(VenueType.COURT).toBe('court');
      expect(VenueType.POOL).toBe('pool');
      expect(VenueType.OTHER).toBe('other');
      expect(VenueType.INDOOR).toBe('indoor');
      expect(VenueType.OUTDOOR).toBe('outdoor');
      expect(VenueType.MIXED).toBe('mixed');
    });

    it('场地状态枚举 → 所有 VenueStatus 值可用', () => {
      expect(VenueStatus.ACTIVE).toBe('active');
      expect(VenueStatus.INACTIVE).toBe('inactive');
      expect(VenueStatus.MAINTENANCE).toBe('maintenance');
      expect(VenueStatus.CLOSED).toBe('closed');
    });

    it('设置场地类型和状态', () => {
      const venue = new Venue();
      venue.type = VenueType.GYM;
      venue.status = VenueStatus.ACTIVE;

      expect(venue.type).toBe(VenueType.GYM);
      expect(venue.status).toBe(VenueStatus.ACTIVE);
    });

    it('场地切换状态 → 停用 / 维护 / 关闭', () => {
      const venue = new Venue();
      venue.status = VenueStatus.ACTIVE;
      expect(venue.status).toBe(VenueStatus.ACTIVE);

      venue.status = VenueStatus.MAINTENANCE;
      expect(venue.status).toBe(VenueStatus.MAINTENANCE);

      venue.status = VenueStatus.INACTIVE;
      expect(venue.status).toBe(VenueStatus.INACTIVE);

      venue.status = VenueStatus.CLOSED;
      expect(venue.status).toBe(VenueStatus.CLOSED);
    });

    it('经纬度坐标赋值', () => {
      const venue = new Venue();
      venue.latitude = 31.2304;
      venue.longitude = 121.4737;

      expect(venue.latitude).toBe(31.2304);
      expect(venue.longitude).toBe(121.4737);
    });

    it('容量和面积赋值', () => {
      const venue = new Venue();
      venue.capacity = 200;
      venue.area = 1500;

      expect(venue.capacity).toBe(200);
      expect(venue.area).toBe(1500);
    });

    it('createdBy 和 ownerId 赋值', () => {
      const venue = new Venue();
      venue.createdBy = 'admin-user-uuid';
      venue.ownerId = 'owner-uuid-001';

      expect(venue.createdBy).toBe('admin-user-uuid');
      expect(venue.ownerId).toBe('owner-uuid-001');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 👥 运营角色：设施管理 / 预订策略 / 价格与评分
  // ═══════════════════════════════════════════════════════════════

  describe('👥 运营：设施管理 / 预订策略 / 价格与评分', () => {
    it('设施列表 → 添加多项设施', () => {
      const venue = new Venue();
      venue.facilities = ['WiFi', '淋浴', '储物柜', '停车场', '咖啡厅'];

      expect(Array.isArray(venue.facilities)).toBe(true);
      expect(venue.facilities).toHaveLength(5);
      expect(venue.facilities).toContain('WiFi');
      expect(venue.facilities).toContain('淋浴');
      expect(venue.facilities).toContain('储物柜');
    });

    it('营业时间 → JSON 格式赋值', () => {
      const venue = new Venue();
      venue.openingHours = {
        monday: { open: '08:00', close: '22:00' },
        tuesday: { open: '08:00', close: '22:00' },
        wednesday: { open: '08:00', close: '22:00' },
        thursday: { open: '08:00', close: '22:00' },
        friday: { open: '08:00', close: '23:00' },
        saturday: { open: '09:00', close: '23:00' },
        sunday: { open: '09:00', close: '21:00' },
      };

      expect(venue.openingHours).toBeDefined();
      expect(venue.openingHours.monday.open).toBe('08:00');
      expect(venue.openingHours.friday.close).toBe('23:00');
    });

    it('预订策略 → 在线预订和提前时间', () => {
      const venue = new Venue();
      venue.allowOnlineBooking = true;
      venue.bookingAdvanceHours = 48;

      expect(venue.allowOnlineBooking).toBe(true);
      expect(venue.bookingAdvanceHours).toBe(48);
    });

    it('取消政策 → JSON 格式赋值', () => {
      const venue = new Venue();
      venue.cancellationPolicy = {
        allowCancel: true,
        freeCancelHours: 24,
        refundPercentage: 80,
      };

      expect(venue.cancellationPolicy.allowCancel).toBe(true);
      expect(venue.cancellationPolicy.freeCancelHours).toBe(24);
      expect(venue.cancellationPolicy.refundPercentage).toBe(80);
    });

    it('价格信息 → JSON 格式小时费率', () => {
      const venue = new Venue();
      venue.pricing = {
        peak: 120,
        offPeak: 80,
        weekend: 150,
      };
      venue.hourlyRate = 100;

      expect(venue.pricing.peak).toBe(120);
      expect(venue.pricing.offPeak).toBe(80);
      expect(venue.hourlyRate).toBe(100);
    });

    it('评分和评论数', () => {
      const venue = new Venue();
      venue.rating = 4.75;
      venue.reviewCount = 328;

      expect(venue.rating).toBe(4.75);
      expect(venue.reviewCount).toBe(328);
    });

    it('特色场馆标识', () => {
      const venue = new Venue();
      venue.isFeatured = true;

      expect(venue.isFeatured).toBe(true);
    });

    it('设施布尔标识 → 停车场/淋浴/储物柜/WiFi/咖啡厅', () => {
      const venue = new Venue();
      venue.hasParking = true;
      venue.hasShower = true;
      venue.hasLocker = false;
      venue.hasWifi = true;
      venue.hasCafe = false;

      expect(venue.hasParking).toBe(true);
      expect(venue.hasShower).toBe(true);
      expect(venue.hasLocker).toBe(false);
      expect(venue.hasWifi).toBe(true);
      expect(venue.hasCafe).toBe(false);
    });

    it('图片URL列表', () => {
      const venue = new Venue();
      venue.images = [
        'https://cdn.example.com/venues/v001/img1.jpg',
        'https://cdn.example.com/venues/v001/img2.jpg',
        'https://cdn.example.com/venues/v001/img3.jpg',
      ];

      expect(venue.images).toHaveLength(3);
      expect(venue.images[0]).toContain('img1.jpg');
    });

    it('虚拟字段 → distance 和 averageRating', () => {
      const venue = new Venue();
      venue.distance = 1500;
      venue.averageRating = 4.8;

      expect(venue.distance).toBe(1500);
      expect(venue.averageRating).toBe(4.8);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 🎯 系统管理员：软删除 / 时间戳 / UUID 生成
  // ═══════════════════════════════════════════════════════════════

  describe('🎯 系统管理员：软删除 / 时间戳 / UUID 生成', () => {
    it('generateId() → UUID v4 格式', () => {
      const venue = new Venue();
      venue.generateId();

      expect(venue.id).toBeTruthy();
      expect(venue.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('generateId() → 已有 id 时不覆盖', () => {
      const venue = new Venue();
      venue.id = 'existing-id-12345';
      venue.generateId();

      expect(venue.id).toBe('existing-id-12345');
    });

    it('generateId() → 空字符串 id 视为无 id，生成新 UUID', () => {
      const venue = new Venue();
      venue.id = '';
      venue.generateId();

      expect(venue.id).toBeTruthy();
      expect(venue.id).not.toBe('');
      expect(venue.id).toMatch(/^[0-9a-f]{8}-/i);
    });

    it('软删除 → deletedAt 可设置', () => {
      const venue = new Venue();
      const deleteTime = new Date('2026-01-15T10:00:00Z');
      venue.deletedAt = deleteTime;

      expect(venue.deletedAt).toBeInstanceOf(Date);
      expect(venue.deletedAt.toISOString()).toBe('2026-01-15T10:00:00.000Z');
    });

    it('创建时间和更新时间 → Date 类型', () => {
      const venue = new Venue();
      venue.createdAt = new Date('2025-06-01');
      venue.updatedAt = new Date('2026-01-01');

      expect(venue.createdAt).toBeInstanceOf(Date);
      expect(venue.updatedAt).toBeInstanceOf(Date);
      expect(venue.updatedAt.getTime()).toBeGreaterThan(venue.createdAt.getTime());
    });

    it('两个不同场地的 UUID 不同', () => {
      const venueA = new Venue();
      const venueB = new Venue();
      venueA.generateId();
      venueB.generateId();

      expect(venueA.id).not.toBe(venueB.id);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 边界 & 异常场景
  // ═══════════════════════════════════════════════════════════════

  describe('边界 & 异常场景', () => {
    it('两个独立实例不共享引用', () => {
      const a = new Venue();
      a.name = '场地A';
      a.address = '地址A';

      const b = new Venue();
      b.name = '场地B';
      b.address = '地址B';

      expect(a.name).not.toBe(b.name);
      expect(a.address).not.toBe(b.address);
    });

    it('默认类型为 INDOOR', () => {
      const venue = new Venue();
      expect(venue.type).toBe(VenueType.INDOOR);
    });

    it('默认状态为 ACTIVE', () => {
      const venue = new Venue();
      expect(venue.status).toBe(VenueStatus.ACTIVE);
    });

    it('默认 id 为空字符串', () => {
      const venue = new Venue();
      expect(venue.id).toBe('');
    });

    it('默认 allowOnlineBooking 为 true', () => {
      const venue = new Venue();
      expect(venue.allowOnlineBooking).toBe(true);
    });

    it('默认 bookingAdvanceHours 为 24', () => {
      const venue = new Venue();
      expect(venue.bookingAdvanceHours).toBe(24);
    });

    it('country 字段 → 构造函数初始化为空字符串（数据库 default 为 中国）', () => {
      const venue = new Venue();
      // 构造函数显式初始化为空字符串，default 是数据库层默认值
      expect(venue.country).toBe('');
      venue.country = '中国';
      expect(venue.country).toBe('中国');
    });

    it('默认 reviewCount 为 0', () => {
      const venue = new Venue();
      expect(venue.reviewCount).toBe(0);
    });

    it('默认设施布尔值均为 false', () => {
      const venue = new Venue();
      expect(venue.hasParking).toBe(false);
      expect(venue.hasShower).toBe(false);
      expect(venue.hasLocker).toBe(false);
      expect(venue.hasWifi).toBe(false);
      expect(venue.hasCafe).toBe(false);
    });

    it('默认 isFeatured 为 false', () => {
      const venue = new Venue();
      expect(venue.isFeatured).toBe(false);
    });

    it('Venue 实例类型检查', () => {
      const venue = new Venue();
      expect(venue).toBeInstanceOf(Venue);
    });
  });
});

// TREE_COMPLETE
