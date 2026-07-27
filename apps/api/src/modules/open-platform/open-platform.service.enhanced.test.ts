// open-platform.service.enhanced.test.ts
// 深度补强：新增 18 个 test/it 用例，覆盖 normal path / edge cases / error handling 三大维度
// BS-0100~BS-0113

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { OpenPlatformService } from './open-platform.service';
import type { SlaContract } from './open-platform.entity';

describe('OpenPlatformService — Enhanced Tests', () => {
  let svc: OpenPlatformService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [OpenPlatformService],
    }).compile();
    svc = module.get(OpenPlatformService);
    svc.reset();
  });

  // ── 帮助函数 ──

  function registerDev(overrides: Partial<{ name: string; email: string; bio: string; website: string; phone: string }> = {}) {
    return svc.registerDeveloper({
      name: overrides.name ?? 'Dev Name',
      email: overrides.email ?? 'dev@example.com',
      bio: overrides.bio,
      website: overrides.website,
      phone: overrides.phone,
    });
  }

  function registerApp(overrides: Partial<{ name: string; description: string; developerId: string; category: string }> = {}) {
    const dev = overrides.developerId ? svc.getDeveloper(overrides.developerId) : registerDev();
    return svc.registerApp({
      name: overrides.name ?? 'EnhancedApp',
      description: overrides.description ?? 'Enhanced test app',
      developerId: dev.id,
      category: overrides.category,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 正常路径 (Normal Path) — 6 个用例
  // ═══════════════════════════════════════════════════════════

  describe('normal path', () => {
    it('registerApp 应用注册时自动设置 apiVersion 和默认 quota', () => {
      const app = registerApp({ name: 'DefaultApp', description: 'Check defaults' });
      expect(app.apiVersion).toBe('v1');
      expect(app.quota).toBe(10000);
      expect(app.price).toBe(0);
      expect(app.downloadCount).toBe(0);
      expect(app.status).toBe('pending');
    });

    it('完整开发者注册 + 应用注册 + 审核上架 + 市场发布流程', () => {
      // 注册开发者
      const dev = registerDev({ name: '独立开发者', email: 'indie@dev.com' });
      expect(dev.status).toBe('active');

      // 注册应用
      const app = registerApp({ name: '超级工具', description: '集成工具', developerId: dev.id, category: 'utility' });
      expect(app.status).toBe('pending');

      // 审核
      const approved = svc.updateAppStatus(app.id, { status: 'approved', reviewer: 'admin-01' });
      expect(approved.status).toBe('approved');

      // 上架
      svc.updateAppStatus(app.id, { status: 'listed', reviewer: 'admin-01' });
      expect(svc.getApp(app.id).status).toBe('listed');

      // 发布到市场
      const mkt = svc.publishToMarketplace(app.id, {
        displayName: '超级工具 Pro',
        summary: '一把瑞士军刀',
        description: '详细描述内容',
        tags: ['utility', 'productivity'],
        price: 9900,
        screenshots: ['https://cdn.example.com/ss1.png'],
      });
      expect(mkt.isFeatured).toBe(false);
      expect(mkt.rating).toBe(0);
      expect(mkt.tags).toContain('utility');
    });

    it('生成 API 密钥 → 轮换 → 新密钥可正常校验', () => {
      const dev = registerDev();
      const app = registerApp({ developerId: dev.id });
      svc.updateAppStatus(app.id, { status: 'approved', reviewer: 'admin' });

      // 生成密钥
      const key1 = svc.generateApiKeyPair(app.id, 'dev');
      expect(key1.status).toBe('active');
      expect(key1.environment).toBe('live');

      // 轮换
      const rotated = svc.rotateApiKey(key1.id, 'dev');
      expect(rotated.old.status).toBe('rotated');
      expect(rotated.new.environment).toBe('live');

      // 新密钥签名校验
      const timestamp = Date.now();
      const nonce = 'rotate-nonce';
      const crypto = require('crypto');
      const sig = crypto.createHmac('sha256', rotated.new.apiSecret!).update(`${timestamp}${nonce}`).digest('hex');
      const result = svc.verifySignature({
        apiKey: rotated.new.apiKey,
        timestamp,
        nonce,
        signature: sig,
      });
      expect(result.valid).toBe(true);
      expect(result.app!.id).toBe(app.id);
    });

    it('记录调用 → checkQuota → getUsageStats 统计一致', () => {
      const dev = registerDev();
      const app = registerApp({ developerId: dev.id, name: 'StatsApp' });

      // 记录多次调用
      svc.recordCall({ appId: app.id, developerId: dev.id, endpoint: '/a', cost: 10, statusCode: 200, signature: 's1', durationMs: 100 });
      svc.recordCall({ appId: app.id, developerId: dev.id, endpoint: '/b', cost: 20, statusCode: 201, signature: 's2', durationMs: 150 });
      svc.recordCall({ appId: app.id, developerId: dev.id, endpoint: '/c', cost: 5, statusCode: 500, signature: 's3', durationMs: 200 });

      // checkQuota 应反映使用量
      const quota = svc.checkQuota(app.id);
      expect(quota.usedToday).toBe(3);
      expect(quota.remaining).toBe(quota.quota - 3);

      // getUsageStats
      const stats = svc.getUsageStats({ appId: app.id });
      expect(stats.totalCalls).toBe(3);
      expect(stats.totalCost).toBe(35); // 10 + 20 + 5
      expect(stats.errorRate).toBeCloseTo(1 / 3, 4); // 1 out of 3 (500)
    });

    it('创建 SLA → 生成账单 → 结算账单 → 开发者余额增加', () => {
      const dev = registerDev({ name: '收款开发者', email: 'earn@dev.com' });
      const app = registerApp({ developerId: dev.id, name: 'EarningApp' });
      svc.updateAppStatus(app.id, { status: 'approved', reviewer: 'admin' });

      // 创建 SLA
      const sla = svc.createSla({
        appId: app.id,
        tierName: 'Premium',
        uptimeGuarantee: 0.995,
        penaltyRate: 0.05,
        monthlyCallCommitment: 10000,
        overageUnitPrice: 2,
      });
      expect(sla.status).toBe('active');

      // 记录调用
      svc.recordCall({ appId: app.id, developerId: dev.id, endpoint: '/x', cost: 200, statusCode: 200, signature: 'sx', durationMs: 50 });

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const bill = svc.generateBilling(month, app.id);
      expect(bill.totalCalls).toBe(1);
      expect(bill.totalAmount).toBe(200);

      const settled = svc.settleBilling(bill.id);
      expect(settled.status).toBe('settled');
      expect(svc.getDeveloper(dev.id).balance).toBe(200);
    });

    it('发布 SDK → 列表查询版本全覆盖', () => {
      const dev = registerDev();
      const app = registerApp({ developerId: dev.id, name: 'SDKApp' });

      const sdk1 = svc.publishSdk({ appId: app.id, language: 'javascript', version: '1.0.0', downloadUrl: 'url-js-1' });
      const sdk2 = svc.publishSdk({ appId: app.id, language: 'javascript', version: '2.0.0', downloadUrl: 'url-js-2', changelog: 'Major update' });
      const sdk3 = svc.publishSdk({ appId: app.id, language: 'python', version: '1.0.0', downloadUrl: 'url-py-1' });

      const sdks = svc.listSdks(app.id);
      expect(sdks).toHaveLength(3);

      const jsSdks = sdks.filter(s => s.language === 'javascript');
      const jsV1 = jsSdks.find(s => s.version === '1.0.0');
      const jsV2 = jsSdks.find(s => s.version === '2.0.0');
      expect(jsV1?.isLatest).toBe(false);
      expect(jsV2?.isLatest).toBe(true);
      expect(jsV2?.changelog).toBe('Major update');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 边界条件 (Edge Cases) — 6 个用例
  // ═══════════════════════════════════════════════════════════

  describe('edge cases', () => {
    it('listDevelopers 空时返回空数组', () => {
      expect(svc.listDevelopers()).toEqual([]);
    });

    it('listApps 空时返回空数组', () => {
      expect(svc.listApps()).toEqual([]);
    });

    it('listApiVersions 空时返回空数组', () => {
      expect(svc.listApiVersions()).toEqual([]);
    });

    it('getSla 查询不存在的 slaId 抛 NotFoundException', () => {
      expect(() => svc.getSla({ slaId: 'sla-nonexist' })).toThrow('SLA合同不存在');
    });

    it('publishSdk 不存在的 appId 抛 NotFoundException', () => {
      expect(() =>
        svc.publishSdk({ appId: 'app-nonexist', language: 'go', version: '1.0.0', downloadUrl: 'url' }),
      ).toThrow('ISV应用不存在');
    });

    it('listMarketplace 空时返回空数组', () => {
      expect(svc.listMarketplace()).toEqual([]);
      expect(svc.listMarketplace({ tag: 'game' })).toEqual([]);
      expect(svc.listMarketplace({ search: 'anything' })).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 异常路径 (Error Handling) — 6 个用例
  // ═══════════════════════════════════════════════════════════

  describe('error handling', () => {
    it('registerApp 传入空 name 应抛 BadRequestException', () => {
      const dev = registerDev();
      expect(() =>
        svc.registerApp({ name: '   ', description: 'desc', developerId: dev.id }),
      ).toThrow('应用名称不能为空');
    });

    it('registerApp 传入空 description 应抛 BadRequestException', () => {
      const dev = registerDev();
      expect(() =>
        svc.registerApp({ name: 'App', description: '   ', developerId: dev.id }),
      ).toThrow('应用描述不能为空');
    });

    it('generateApiKeyPair 对 rejected/suspended 状态的应用应抛 BadRequestException', () => {
      const dev = registerDev();
      const app = registerApp({ developerId: dev.id, name: 'BadStateApp' });
      svc.updateAppStatus(app.id, { status: 'rejected', reviewer: 'admin' });

      expect(() => svc.generateApiKeyPair(app.id, 'dev')).toThrow('应用状态不允许生成密钥');
    });

    it('verifySignature 签名校验时间戳刚好超过 5 分钟边界应返回 invalid', () => {
      const app = registerApp();
      const result = svc.verifySignature({
        apiKey: app.apiKey,
        timestamp: Date.now() - 5 * 60 * 1000 - 1, // 5分钟 + 1ms
        nonce: 'too-old',
        signature: 'any-sig',
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('请求已过期');
    });

    it('generateBilling 无效月份格式应抛 BadRequestException', () => {
      const app = registerApp();
      expect(() => svc.generateBilling('2026/07', app.id)).toThrow('账单月份格式无效');
      expect(() => svc.generateBilling('abcdef', app.id)).toThrow('账单月份格式无效');
      expect(() => svc.generateBilling('abcd-ef', app.id)).toThrow('账单月份格式无效');
    });

    it('createSla 负数 overageUnitPrice 应抛 BadRequestException', () => {
      const app = registerApp();
      svc.updateAppStatus(app.id, { status: 'approved', reviewer: 'admin' });
      expect(() =>
        svc.createSla({
          appId: app.id,
          tierName: 'Bad',
          uptimeGuarantee: 0.99,
          penaltyRate: 0.05,
          monthlyCallCommitment: 1000,
          overageUnitPrice: -1,
        }),
      ).toThrow('超出单价不能为负');
    });
  });
});
