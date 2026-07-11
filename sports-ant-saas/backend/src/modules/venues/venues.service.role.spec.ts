/**
 * VenuesService 角色模拟测试
 *
 * 覆盖场景：
 *  - 店长: 创建场馆 → 配置设施 → 设置营业时间 → 前台可查询
 *  - 场地: 标记维护状态 → 通知 → 维护完成恢复
 *  - 会员: 搜索附近场馆 → 按评分排序
 *  - 异常: 重复邮箱 · 关闭场馆预约
 *  - 边界: 容量为0 · 24小时营业
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenuesService } from './venues.service';
import { Venue, VenueStatus, VenueType } from './entities/venue.entity';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

/* ── mock helpers ── */
function mockRepo<T>(): jest.Mocked<Partial<Repository<T>>> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    count: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(),
    select: jest.fn().mockReturnThis(),
  } as any;
}

function makeMockQb(overrides: {
  getCount?: number;
  getMany?: any[];
  getManyAndCount?: [any[], number];
  getRawMany?: any[];
} = {}) {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(overrides.getCount ?? 0),
    getMany: jest.fn().mockResolvedValue(overrides.getMany ?? []),
    getManyAndCount: jest.fn().mockResolvedValue(overrides.getManyAndCount ?? [[], 0]),
    getRawMany: jest.fn().mockResolvedValue(overrides.getRawMany ?? []),
  };
}

/* ── constants ── */
const ownerId = 'user-manager-001';
const frontDeskId = 'user-frontdesk-001';
const memberId = 'm-loyalty-001';

function makeVenue(overrides: Partial<Venue> = {}): Venue {
  const v = {
    id: 'v-role-001',
    name: '蚂蚁运动中心',
    description: '一流运动设施',
    address: '上海市浦东新区陆家嘴100号',
    city: '上海',
    province: '上海',
    postalCode: '200120',
    country: '中国',
    latitude: 31.2304,
    longitude: 121.4737,
    type: VenueType.INDOOR,
    capacity: 200,
    area: 1500,
    facilities: ['篮球', '游泳', '健身'],
    openingHours: { mon: '08:00-22:00', tue: '08:00-22:00' },
    contactPhone: '021-12345678',
    contactEmail: 'info@sports-ant.com',
    status: VenueStatus.ACTIVE,
    allowOnlineBooking: true,
    bookingAdvanceHours: 24,
    cancellationPolicy: { freeCancelHours: 2 },
    pricing: { hourly: 88 },
    hourlyRate: 88,
    rating: 4.5,
    reviewCount: 128,
    images: ['https://img.example.com/v1.jpg'],
    hasParking: true,
    hasShower: true,
    hasLocker: true,
    hasWifi: true,
    hasCafe: false,
    isFeatured: false,
    createdBy: ownerId,
    ownerId,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    owner: null as any,
    devices: [],
    members: [],
    tickets: [],
    sessions: [],
    coaches: [],
    distance: undefined as number | undefined,
    averageRating: undefined as number | undefined,
    ...overrides,
  } as Venue;
  return v;
}

describe('VenuesService — 角色模拟测试', () => {
  let service: VenuesService;
  let venueRepo: jest.Mocked<Partial<Repository<Venue>>>;

  beforeEach(async () => {
    venueRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenuesService,
        { provide: getRepositoryToken(Venue), useValue: venueRepo },
      ],
    }).compile();

    service = module.get<VenuesService>(VenuesService);
  });

  // ════════════════════════════════════════════════
  // 1. 店长角色：创建场馆 → 配置设施 → 设置营业时间 → 前台可查询
  // ════════════════════════════════════════════════

  describe('店长：创建场馆全流程', () => {

    /* ─ 1.1 创建场馆 ─ */
    it('1. 👤 店长创建新场馆 → 保存后返回场馆信息，createdBy 为店长', async () => {
      venueRepo.findOne = jest.fn().mockResolvedValue(null); // no email conflict
      venueRepo.create = jest.fn().mockImplementation((dto: any) => {
        // Return a Venue-like object so save/fromEntity can access properties
        dto.id = 'v-new-001';
        dto.openingHours = dto.openingHours || {};
        dto.facilities = dto.facilities || [];
        dto.distance = undefined;
        dto.hasParking = dto.hasParking ?? false;
        dto.hasShower = dto.hasShower ?? false;
        dto.hasLocker = dto.hasLocker ?? false;
        dto.hasWifi = dto.hasWifi ?? false;
        dto.hasCafe = dto.hasCafe ?? false;
        return dto;
      });
      venueRepo.save = jest.fn().mockImplementation((v: any) => Promise.resolve(v));

      const result = await service.create({
        name: '新海运动馆',
        address: '上海市徐汇区漕河泾88号',
        city: '上海',
        province: '上海',
        postalCode: '200030',
        contactPhone: '021-87654321',
        contactEmail: 'xinhai@sports-ant.com',
        type: VenueType.INDOOR,
        capacity: 150,
        allowOnlineBooking: true,
      } as any, ownerId);

      expect(result.id).toBe('v-new-001');
      expect(result.name).toBe('新海运动馆');
      expect(result.createdBy).toBe(ownerId);
    });

    /* ─ 1.2 配置设施 ─ */
    it('2. 👤 店长配置场馆设施（篮球+泳池+WiFi）→ 保存后前台查询到这些设施', async () => {
      const venue = makeVenue();
      venueRepo.findOne = jest.fn().mockResolvedValue(venue);
      venueRepo.save = jest.fn().mockImplementation((v: Venue) => {
        v.facilities = ['篮球', '游泳池', 'WiFi', '停车场'];
        return Promise.resolve(v);
      });

      const result = await service.update('v-role-001', {
        facilities: ['篮球', '游泳池', 'WiFi', '停车场'],
      } as any, ownerId);

      expect(result.facilities).toContain('篮球');
      expect(result.facilities).toContain('游泳池');
      expect(result.facilities).toContain('WiFi');
    });

    /* ─ 1.3 设置营业时间 ─ */
    it('3. 👤 店长设置营业时间为 07:00-23:00 → 保存后生效', async () => {
      const venue = makeVenue();
      venueRepo.findOne = jest.fn().mockResolvedValue(venue);
      venueRepo.save = jest.fn().mockImplementation((v: Venue) => {
        v.openingHours = {
          mon: '07:00-23:00',
          tue: '07:00-23:00',
          wed: '07:00-23:00',
          thu: '07:00-23:00',
          fri: '07:00-23:00',
          sat: '08:00-22:00',
          sun: '08:00-22:00',
        };
        return Promise.resolve(v);
      });

      const result = await service.update('v-role-001', {
        openingHours: {
          mon: '07:00-23:00',
          tue: '07:00-23:00',
          wed: '07:00-23:00',
          thu: '07:00-23:00',
          fri: '07:00-23:00',
          sat: '08:00-22:00',
          sun: '08:00-22:00',
        },
      } as any, ownerId);

      expect(result.openingHours).toEqual({
        mon: '07:00-23:00',
        tue: '07:00-23:00',
        wed: '07:00-23:00',
        thu: '07:00-23:00',
        fri: '07:00-23:00',
        sat: '08:00-22:00',
        sun: '08:00-22:00',
      });
    });

    /* ─ 1.4 店长创建的场馆前台可查询 ─ */
    it('4. 👤 前台查询 ACTIVE 状态的场馆 → 返回列表包含店长创建的场馆', async () => {
      venueRepo.createQueryBuilder = jest.fn().mockReturnValue(makeMockQb({
        getCount: 2,
        getMany: [
          makeVenue({ id: 'v-1', name: '蚂蚁运动中心', status: VenueStatus.ACTIVE }),
          makeVenue({ id: 'v-2', name: '新海运动馆', status: VenueStatus.ACTIVE }),
        ],
      }));

      const result = await service.findAll({ status: VenueStatus.ACTIVE });
      expect(result.total).toBe(2);
      expect(result.venues.length).toBe(2);
      expect(result.venues[0].name).toBe('蚂蚁运动中心');
      expect(result.venues[1].name).toBe('新海运动馆');
    });
  });

  // ════════════════════════════════════════════════
  // 2. 场地角色：标记维护状态 → 通知 → 维护完成恢复
  // ════════════════════════════════════════════════

  describe('场地：维护状态管理', () => {

    /* ─ 2.1 标记维护 ─ */
    it('5. 👤 店长将场馆标记为 MAINTENANCE → 状态变更为维护中', async () => {
      const venue = makeVenue({ status: VenueStatus.ACTIVE });
      venueRepo.findOne = jest.fn().mockResolvedValue(venue);
      venueRepo.save = jest.fn().mockImplementation((v: Venue) => {
        v.status = VenueStatus.MAINTENANCE;
        return Promise.resolve(v);
      });

      const result = await service.changeStatus('v-role-001', VenueStatus.MAINTENANCE, ownerId);
      expect(result.status).toBe(VenueStatus.MAINTENANCE);
    });

    /* ─ 2.2 维护期间前台无法查到 ─ */
    it('6. 👤 前台只查询 ACTIVE 场馆 → 维护中的场馆不出现', async () => {
      venueRepo.createQueryBuilder = jest.fn().mockReturnValue(makeMockQb({
        getCount: 1,
        getMany: [
          makeVenue({ id: 'v-1', name: '蚂蚁运动中心', status: VenueStatus.ACTIVE }),
        ],
      }));

      const result = await service.findAll({ status: VenueStatus.ACTIVE });
      expect(result.total).toBe(1);
      // 维护中的被过滤掉
      const maintVenue = result.venues.find((v) => v.status === VenueStatus.MAINTENANCE);
      expect(maintVenue).toBeUndefined();
    });

    /* ─ 2.3 维护完成恢复 ─ */
    it('7. 👤 维护完成后恢复为 ACTIVE → 前台重新可见', async () => {
      const venue = makeVenue({ status: VenueStatus.MAINTENANCE });
      venueRepo.findOne = jest.fn().mockResolvedValue(venue);
      venueRepo.save = jest.fn().mockImplementation((v: Venue) => {
        v.status = VenueStatus.ACTIVE;
        return Promise.resolve(v);
      });

      const result = await service.changeStatus('v-role-001', VenueStatus.ACTIVE, ownerId);
      expect(result.status).toBe(VenueStatus.ACTIVE);
    });
  });

  // ════════════════════════════════════════════════
  // 3. 会员角色：搜索附近场馆 → 按评分排序
  // ════════════════════════════════════════════════

  describe('会员：搜索附近场馆 → 按评分排序', () => {

    /* ─ 3.1 按城市搜索 ─ */
    it('8. 👤 会员搜索「上海」的场馆 → 返回上海地区场馆列表', async () => {
      venueRepo.createQueryBuilder = jest.fn().mockReturnValue(makeMockQb({
        getCount: 2,
        getMany: [
          makeVenue({ id: 'v-sh1', name: '浦东体育馆', city: '上海' }),
          makeVenue({ id: 'v-sh2', name: '静安健身中心', city: '上海' }),
        ],
      }));

      const result = await service.findAll({ city: '上海' });
      expect(result.total).toBe(2);
      expect(result.venues[0].city).toBe('上海');
    });

    /* ─ 3.2 搜索附近场馆（地理位置） ─ */
    it('9. 👤 会员搜索 5km 内场馆 → 返回附近场馆按距离排序', async () => {
      const nearby = makeVenue({ id: 'v-near', name: '近距球馆', latitude: 31.235, longitude: 121.48 });
      const far = makeVenue({ id: 'v-far', name: '远距球场', latitude: 31.4, longitude: 121.58 });

      venueRepo.createQueryBuilder = jest.fn().mockReturnValue(makeMockQb({
        getCount: 2,
        getMany: [nearby, far],
      }));

      const result = await service.searchNearby(
        31.2304, 121.4737, 5, // lat, lng, radius (km)
      );

      expect(result.length).toBe(2);
      expect(result[0].distance).toBeLessThan(result[1].distance!);
    });

    /* ─ 3.3 按类型过滤 ─ */
    it('10. 👤 会员按类型筛选 OUTDOOR 场馆 → 露天排球场馆可查到', async () => {
      venueRepo.createQueryBuilder = jest.fn().mockReturnValue(makeMockQb({
        getCount: 1,
        getMany: [
          makeVenue({ id: 'v-outdoor', name: '露天排球场', type: VenueType.OUTDOOR }),
        ],
      }));

      const result = await service.findAll({ type: VenueType.OUTDOOR });
      expect(result.total).toBe(1);
      expect(result.venues[0].type).toBe(VenueType.OUTDOOR);
    });
  });

  // ════════════════════════════════════════════════
  // 4. 异常场景
  // ════════════════════════════════════════════════

  describe('异常场景', () => {

    /* ─ 4.1 重复邮箱 ─ */
    it('11. ❌ 创建场馆时邮箱已被占用 → 抛出 BadRequestException', async () => {
      venueRepo.findOne = jest.fn().mockResolvedValue(
        makeVenue({ contactEmail: 'duplicate@test.com' }),
      );

      await expect(
        service.create({
          name: '重复邮箱场馆',
          address: '上海市',
          city: '上海',
          province: '上海',
          postalCode: '200000',
          contactPhone: '021-11111111',
          contactEmail: 'duplicate@test.com',
          type: VenueType.INDOOR,
          capacity: 100,
        } as any, ownerId),
      ).rejects.toThrow(BadRequestException);
    });

    /* ─ 4.2 修改邮箱时冲突 ─ */
    it('12. ❌ 修改场馆邮箱为已存在的邮箱 → 抛出 BadRequestException', async () => {
      const venue = makeVenue({ contactEmail: 'old@test.com', ownerId });
      const conflictVenue = makeVenue({ id: 'v-conflict', contactEmail: 'taken@test.com' });

      venueRepo.findOne = jest.fn()
        .mockResolvedValueOnce(venue)       // first findOne: find the venue being updated
        .mockResolvedValueOnce(conflictVenue); // second findOne: email conflict check

      await expect(
        service.update('v-role-001', { contactEmail: 'taken@test.com' } as any, ownerId),
      ).rejects.toThrow(BadRequestException);
    });

    /* ─ 4.3 权限不足修改 ─ */
    it('13. ❌ 非负责人尝试修改场馆信息 → 抛出 ForbiddenException', async () => {
      const venue = makeVenue({ createdBy: ownerId, ownerId });
      venueRepo.findOne = jest.fn().mockResolvedValue(venue);

      await expect(
        service.update('v-role-001', { name: 'Hijacked!' } as any, 'random-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    /* ─ 4.4 权限不足删除 ─ */
    it('14. ❌ 非负责人尝试删除场馆 → 抛出 ForbiddenException', async () => {
      const venue = makeVenue({ createdBy: ownerId, ownerId });
      venueRepo.findOne = jest.fn().mockResolvedValue(venue);

      await expect(
        service.remove('v-role-001', 'random-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    /* ─ 4.5 查询不存在的场馆 ─ */
    it('15. ❌ 查询不存在的场馆 ID → 抛出 NotFoundException', async () => {
      venueRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findOne('ghost-venue-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ════════════════════════════════════════════════
  // 5. 边界场景
  // ════════════════════════════════════════════════

  describe('边界场景', () => {

    /* ─ 5.1 容量为 0 ─ */
    it('16. 🔲 创建容量为 0 的场馆 → 创建成功（capacity 无下限校验但允许 0）', async () => {
      venueRepo.findOne = jest.fn().mockResolvedValue(null); // no email conflict
      venueRepo.create = jest.fn().mockImplementation((dto: any) => {
        dto.id = 'v-zero-cap';
        dto.openingHours = dto.openingHours || {};
        dto.facilities = dto.facilities || [];
        dto.distance = undefined;
        dto.hasParking = dto.hasParking ?? false;
        dto.hasShower = dto.hasShower ?? false;
        dto.hasLocker = dto.hasLocker ?? false;
        dto.hasWifi = dto.hasWifi ?? false;
        dto.hasCafe = dto.hasCafe ?? false;
        return dto;
      });
      venueRepo.save = jest.fn().mockImplementation((v: any) => Promise.resolve(v));

      const result = await service.create({
        name: '零容量测试场',
        address: '上海市',
        city: '上海',
        province: '上海',
        postalCode: '200000',
        contactPhone: '021-00000000',
        contactEmail: 'zero@sports-ant.com',
        type: VenueType.INDOOR,
        capacity: 0,
      } as any, ownerId);

      expect(result.capacity).toBe(0);
    });

    /* ─ 5.2 最低容量过滤 ─ */
    it('17. 🔲 搜索 minCapacity=50 → 返回容量 >=50 的场馆', async () => {
      venueRepo.createQueryBuilder = jest.fn().mockReturnValue(makeMockQb({
        getCount: 2,
        getMany: [
          makeVenue({ id: 'v-big', name: '大馆', capacity: 200 }),
          makeVenue({ id: 'v-mid', name: '中馆', capacity: 80 }),
        ],
      }));

      const result = await service.findAll({ minCapacity: 50 });
      expect(result.total).toBe(2);
    });

    /* ─ 5.3 允许/禁止在线预约 ─ */
    it('18. 🔲 关闭场馆在线预约 → allowOnlineBooking=false', async () => {
      const venue = makeVenue({ allowOnlineBooking: true });
      venueRepo.findOne = jest.fn().mockResolvedValue(venue);
      venueRepo.save = jest.fn().mockImplementation((v: Venue) => {
        v.allowOnlineBooking = false;
        return Promise.resolve(v);
      });

      const result = await service.update('v-role-001', {
        allowOnlineBooking: false,
      } as any, ownerId);

      expect(result.allowOnlineBooking).toBe(false);
    });

    /* ─ 5.4 24小时营业 ─ */
    it('19. 🔲 设置 24 小时营业时间 → 保存后 openingHours 为全天', async () => {
      const venue = makeVenue();
      venueRepo.findOne = jest.fn().mockResolvedValue(venue);
      const fullDayHours = {
        mon: '00:00-24:00',
        tue: '00:00-24:00',
        wed: '00:00-24:00',
        thu: '00:00-24:00',
        fri: '00:00-24:00',
        sat: '00:00-24:00',
        sun: '00:00-24:00',
      };
      venueRepo.save = jest.fn().mockImplementation((v: Venue) => {
        v.openingHours = fullDayHours;
        return Promise.resolve(v);
      });

      const result = await service.update('v-role-001', {
        openingHours: fullDayHours,
      } as any, ownerId);

      expect(result.openingHours).toEqual(fullDayHours);
    });

    /* ─ 5.5 空列表分页 ─ */
    it('20. 🔲 搜索无结果 → total=0, venues=[]', async () => {
      venueRepo.createQueryBuilder = jest.fn().mockReturnValue(makeMockQb({
        getCount: 0,
        getMany: [],
      }));

      const result = await service.findAll({ city: '火星' });
      expect(result.total).toBe(0);
      expect(result.venues).toEqual([]);
      expect(result.totalPages).toBe(0);
    });

    /* ─ 5.6 删除场馆 → 状态变为 CLOSED ─ */
    it('21. 🔲 删除场馆 → 软删除，状态变为 CLOSED', async () => {
      const venue = makeVenue({ status: VenueStatus.ACTIVE });
      venueRepo.findOne = jest.fn().mockResolvedValue(venue);
      venueRepo.save = jest.fn().mockImplementation((v: Venue) => {
        v.deletedAt = new Date();
        v.status = VenueStatus.CLOSED;
        return Promise.resolve(v);
      });

      await service.remove('v-role-001', ownerId);
      const savedCall = (venueRepo.save as jest.Mock).mock.calls[0][0];
      expect(savedCall.status).toBe(VenueStatus.CLOSED);
      expect(savedCall.deletedAt).toBeInstanceOf(Date);
    });
  });
});
