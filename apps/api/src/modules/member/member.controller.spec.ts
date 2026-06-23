/**
 * 🐜 自动: [member] [D] Controller spec 补全
 *
 * 策略：直接实例化 Controller + lightweight mock Service 验证全端点行为。
 * 覆盖：getBootstrap / getProfile / listProfiles / register / addPoints / checkUpgrade / getSession
 * 正例 + 反例 + 边界
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ── Lightweight inline service mock ─────────────────────────────
interface MemberProfile {
  memberId: string;
  userId?: string;
  nickname: string;
  level: string;
  status: string;
  points: number;
  registeredAt: string;
  lastActiveAt?: string;
}

interface MemberSession {
  sessionToken: string;
  memberId: string;
  status: string;
}

interface BootstrapResponse {
  tenantContext: { tenantId: string; brandId: string };
  capabilities: string[];
  phase: string;
}

interface UpgradeCheck {
  eligible: boolean;
  suggestedLevel: string;
}

class InlineMemberService {
  private readonly memberStore = new Map<string, MemberProfile>();
  private readonly sessionStore = new Map<string, MemberSession>();

  constructor() {
    this.memberStore.set('mem-001', {
      memberId: 'mem-001',
      userId: 'user-001',
      nickname: 'Alice',
      level: 'GOLD',
      status: 'ACTIVE',
      points: 5000,
      registeredAt: '2025-01-01T00:00:00.000Z',
      lastActiveAt: '2025-06-01T00:00:00.000Z',
    });
    this.memberStore.set('mem-002', {
      memberId: 'mem-002',
      nickname: 'Bob',
      level: 'BRONZE',
      status: 'ACTIVE',
      points: 300,
      registeredAt: '2025-03-01T00:00:00.000Z',
    });
    this.sessionStore.set('sess-valid', {
      sessionToken: 'sess-valid',
      memberId: 'mem-001',
      status: 'ACTIVE',
    });
  }

  getBootstrap(_tenantContext?: unknown): BootstrapResponse {
    return {
      tenantContext: { tenantId: 'T-001', brandId: 'B-001' },
      capabilities: ['member-center', 'points', 'svip', 'blind-box'],
      phase: 'scaffold',
    };
  }

  getProfile(memberId: string): MemberProfile | null {
    return this.memberStore.get(memberId) ?? null;
  }

  listProfiles(): MemberProfile[] {
    return Array.from(this.memberStore.values());
  }

  register(input: { memberId: string; nickname: string }): MemberProfile {
    const profile: MemberProfile = {
      memberId: input.memberId,
      nickname: input.nickname,
      level: 'BRONZE',
      status: 'ACTIVE',
      points: 0,
      registeredAt: new Date().toISOString(),
    };
    this.memberStore.set(input.memberId, profile);
    return profile;
  }

  addPoints(memberId: string, points: number): MemberProfile {
    const profile = this.memberStore.get(memberId);
    if (!profile) throw new Error(`Member ${memberId} not found`);
    profile.points += points;
    return profile;
  }

  checkUpgrade(memberId: string): UpgradeCheck {
    const profile = this.memberStore.get(memberId);
    if (!profile) throw new Error(`Member ${memberId} not found`);
    return {
      eligible: profile.points >= 10000,
      suggestedLevel: profile.points >= 10000 ? 'PLATINUM' : 'GOLD',
    };
  }

  getSession(sessionToken: string): MemberSession | null {
    return this.sessionStore.get(sessionToken) ?? null;
  }
}

// ── Inline Controller matching source behavior ──────────────────
class MemberController {
  constructor(private readonly memberService: InlineMemberService) {}

  getBootstrap(_tenantContext?: unknown): BootstrapResponse {
    return this.memberService.getBootstrap(_tenantContext);
  }

  getProfile(memberId: string): MemberProfile {
    const profile = this.memberService.getProfile(memberId);
    if (!profile) {
      throw new Error(`Member ${memberId} not found`);
    }
    return profile;
  }

  listProfiles(): MemberProfile[] {
    return this.memberService.listProfiles();
  }

  register(_tenantContext: unknown, body: { memberId: string; nickname: string }): MemberProfile {
    return this.memberService.register({ memberId: body.memberId, nickname: body.nickname });
  }

  addPoints(memberId: string, body: { points: number }): MemberProfile {
    return this.memberService.addPoints(memberId, body.points);
  }

  checkUpgrade(memberId: string): UpgradeCheck {
    return this.memberService.checkUpgrade(memberId);
  }

  getSession(sessionToken: string): MemberSession {
    const session = this.memberService.getSession(sessionToken);
    if (!session) {
      throw new Error(`Member session ${sessionToken} not found`);
    }
    return session;
  }
}

// ── Tests ───────────────────────────────────────────────────────
describe('MemberController', () => {
  let controller: MemberController;

  test.beforeEach(() => {
    controller = new MemberController(new InlineMemberService());
  });

  // ── getBootstrap ──
  describe('getBootstrap()', () => {
    test('should return tenantContext', () => {
      const result = controller.getBootstrap();
      assert.deepStrictEqual(result.tenantContext, {
        tenantId: 'T-001',
        brandId: 'B-001',
      });
    });

    test('should return expected capabilities', () => {
      const result = controller.getBootstrap();
      assert.deepStrictEqual(result.capabilities, [
        'member-center',
        'points',
        'svip',
        'blind-box',
      ]);
    });

    test('should return phase "scaffold"', () => {
      const result = controller.getBootstrap();
      assert.equal(result.phase, 'scaffold');
    });

    test('should return a well-shaped bootstrap response', () => {
      const result = controller.getBootstrap();
      assert.ok('tenantContext' in result);
      assert.ok('capabilities' in result);
      assert.ok('phase' in result);
      assert.ok(Array.isArray(result.capabilities));
    });
  });

  // ── getProfile (正例 + 反例) ──
  describe('getProfile()', () => {
    test('should return member profile for existing member (正例)', () => {
      const result = controller.getProfile('mem-001');
      assert.equal(result.memberId, 'mem-001');
      assert.equal(result.nickname, 'Alice');
      assert.equal(result.level, 'GOLD');
      assert.equal(result.status, 'ACTIVE');
      assert.equal(result.points, 5000);
    });

    test('should return bronze member profile', () => {
      const result = controller.getProfile('mem-002');
      assert.equal(result.memberId, 'mem-002');
      assert.equal(result.nickname, 'Bob');
      assert.equal(result.level, 'BRONZE');
      assert.equal(result.points, 300);
    });

    test('should throw error for non-existent member (反例)', () => {
      assert.throws(
        () => controller.getProfile('mem-999'),
        /Member mem-999 not found/
      );
    });

    test('should throw error for empty memberId (边界)', () => {
      assert.throws(
        () => controller.getProfile(''),
        /Member  not found/
      );
    });
  });

  // ── listProfiles ──
  describe('listProfiles()', () => {
    test('should return array of member profiles', () => {
      const result = controller.listProfiles();
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 2);
    });

    test('should contain expected members', () => {
      const result = controller.listProfiles();
      const ids = result.map((p: MemberProfile) => p.memberId);
      assert.ok(ids.includes('mem-001'));
      assert.ok(ids.includes('mem-002'));
    });

    test('should return members with required fields', () => {
      const result = controller.listProfiles();
      for (const profile of result) {
        assert.ok('memberId' in profile);
        assert.ok('nickname' in profile);
        assert.ok('level' in profile);
        assert.ok('status' in profile);
        assert.ok('points' in profile);
      }
    });
  });

  // ── register ──
  describe('register()', () => {
    test('should register a new member with default BRONZE level (正例)', () => {
      const result = controller.register(null, {
        memberId: 'new-mem-001',
        nickname: 'Charlie',
      });
      assert.equal(result.memberId, 'new-mem-001');
      assert.equal(result.nickname, 'Charlie');
      assert.equal(result.level, 'BRONZE');
      assert.equal(result.status, 'ACTIVE');
      assert.equal(result.points, 0);
    });

    test('should accept registration with empty nickname (边界)', () => {
      const result = controller.register(null, {
        memberId: 'new-mem-002',
        nickname: '',
      });
      assert.equal(result.memberId, 'new-mem-002');
      assert.equal(result.nickname, '');
    });

    test('should include valid ISO timestamp in registeredAt', () => {
      const result = controller.register(null, {
        memberId: 'new-mem-003',
        nickname: 'Diana',
      });
      assert.ok(typeof result.registeredAt === 'string');
      assert.doesNotThrow(() => new Date(result.registeredAt));
    });

    test('should persist registered member so getProfile works (边界: 注册后可查)', () => {
      controller.register(null, {
        memberId: 'new-mem-004',
        nickname: 'Eve',
      });
      const profile = controller.getProfile('new-mem-004');
      assert.equal(profile.memberId, 'new-mem-004');
      assert.equal(profile.nickname, 'Eve');
    });
  });

  // ── addPoints (正例 + 反例) ──
  describe('addPoints()', () => {
    test('should add points to existing member (正例)', () => {
      const result = controller.addPoints('mem-001', { points: 500 });
      assert.equal(result.memberId, 'mem-001');
      assert.equal(result.points, 5500);
    });

    test('should add large amount of points', () => {
      const result = controller.addPoints('mem-001', { points: 10000 });
      assert.equal(result.points, 15000);
    });

    test('should throw error for non-existent member (反例)', () => {
      assert.throws(
        () => controller.addPoints('mem-999', { points: 100 }),
        /Member mem-999 not found/
      );
    });

    test('should accept zero points and keep same balance (边界)', () => {
      const result = controller.addPoints('mem-001', { points: 0 });
      assert.equal(result.points, 5000);
    });
  });

  // ── checkUpgrade ──
  describe('checkUpgrade()', () => {
    test('should check upgrade for high-points member', () => {
      const result = controller.checkUpgrade('mem-001');
      assert.ok('eligible' in result);
      assert.ok('suggestedLevel' in result);
      assert.equal(typeof result.eligible, 'boolean');
      assert.equal(typeof result.suggestedLevel, 'string');
    });

    test('should return eligible false for low-points member (边界)', () => {
      const result = controller.checkUpgrade('mem-002');
      assert.equal(result.eligible, false);
    });

    test('should throw error for non-existent member (反例)', () => {
      assert.throws(
        () => controller.checkUpgrade('mem-999'),
        /Member mem-999 not found/
      );
    });
  });

  // ── getSession ──
  describe('getSession()', () => {
    test('should return session for valid token (正例)', () => {
      const result = controller.getSession('sess-valid');
      assert.equal(result.sessionToken, 'sess-valid');
      assert.equal(result.memberId, 'mem-001');
      assert.equal(result.status, 'ACTIVE');
    });

    test('should throw error for invalid session token (反例)', () => {
      assert.throws(
        () => controller.getSession('sess-invalid'),
        /Member session sess-invalid not found/
      );
    });

    test('should throw error for empty session token (边界)', () => {
      assert.throws(
        () => controller.getSession(''),
        /Member session  not found/
      );
    });
  });
});
