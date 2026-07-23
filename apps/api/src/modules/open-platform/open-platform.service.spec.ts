// open-platform.service.spec.ts · WP-07 开放平台与ISV
// BS-0100~BS-0113 — service 层测试 ≥20 个

import { Test } from '@nestjs/testing';
import { OpenPlatformService } from './open-platform.service';

describe('OpenPlatformService', () => {
  async function createSvc() {
    const module = await Test.createTestingModule({
      providers: [OpenPlatformService],
    }).compile();
    const svc = module.get(OpenPlatformService);
    svc.reset();
    return svc;
  }

  function registerDev(
    svc: OpenPlatformService,
    overrides: Partial<{ name: string; email: string; bio: string; website: string; phone: string }> = {},
  ) {
    return svc.registerDeveloper({
      name: overrides.name ?? 'Test Dev',
      email: overrides.email ?? 'dev@test.com',
      bio: overrides.bio,
      website: overrides.website,
      phone: overrides.phone,
    });
  }

  function registerApp(
    svc: OpenPlatformService,
    overrides: Partial<{
      name: string;
      description: string;
      developerId: string;
      iconUrl: string;
      category: string;
    }> = {},
  ) {
    const dev = overrides.developerId
      ? svc.getDeveloper(overrides.developerId)
      : registerDev(svc);
    return svc.registerApp({
      name: overrides.name ?? 'TestApp',
      description: overrides.description ?? 'A test ISV app',
      developerId: dev.id,
      iconUrl: overrides.iconUrl,
      category: overrides.category,
    });
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0112: 开发者注册
  // ══════════════════════════════════════════════════════════════

  it('BS-0112: 注册ISV开发者（正例）', async () => {
    const svc = await createSvc();
    const dev = registerDev(svc);
    expect(dev.id).toBeTruthy();
    expect(dev.name).toBe('Test Dev');
    expect(dev.email).toBe('dev@test.com');
    expect(dev.status).toBe('active');
    expect(dev.balance).toBe(0);
  });

  it('BS-0112: 空姓名抛 BadRequest', async () => {
    const svc = await createSvc();
    expect(() =>
      svc.registerDeveloper({ name: '', email: 'dev@test.com' }),
    ).toThrow('开发者名称不能为空');
  });

  it('BS-0112: 无效邮箱抛 BadRequest', async () => {
    const svc = await createSvc();
    expect(() =>
      svc.registerDeveloper({ name: 'Dev', email: 'not-an-email' }),
    ).toThrow('邮箱格式无效');
    expect(() =>
      svc.registerDeveloper({ name: 'Dev', email: '' }),
    ).toThrow('邮箱格式无效');
  });

  it('BS-0112: 重复邮箱抛 Conflict', async () => {
    const svc = await createSvc();
    registerDev(svc, { email: 'dup@test.com' });
    expect(() =>
      registerDev(svc, { email: 'dup@test.com' }),
    ).toThrow('该邮箱已被注册');
  });

  it('BS-0112: 获取开发者信息（正例）', async () => {
    const svc = await createSvc();
    const dev = registerDev(svc);
    const fetched = svc.getDeveloper(dev.id);
    expect(fetched.id).toBe(dev.id);
    expect(fetched.email).toBe('dev@test.com');
  });

  it('BS-0112: 获取不存在的开发者抛 NotFound', async () => {
    const svc = await createSvc();
    expect(() => svc.getDeveloper('nonexist')).toThrow('开发者不存在');
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0100: ISV 应用注册
  // ══════════════════════════════════════════════════════════════

  it('BS-0100: 注册ISV应用（正例）', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    expect(app.id).toBeTruthy();
    expect(app.name).toBe('TestApp');
    expect(app.status).toBe('pending');
    expect(app.apiKey).toBeTruthy();
    expect(app.apiSecret).toBeTruthy();
    expect(app.quota).toBe(10000);
    expect(app.apiVersion).toBe('v1');
  });

  it('BS-0100: 空应用名抛 BadRequest', async () => {
    const svc = await createSvc();
    const dev = registerDev(svc);
    expect(() =>
      svc.registerApp({ name: '', description: 'desc', developerId: dev.id }),
    ).toThrow('应用名称不能为空');
  });

  it('BS-0100: 空描述抛 BadRequest', async () => {
    const svc = await createSvc();
    const dev = registerDev(svc);
    expect(() =>
      svc.registerApp({ name: 'App', description: '', developerId: dev.id }),
    ).toThrow('应用描述不能为空');
  });

  it('BS-0100: 不存在开发者抛 NotFound', async () => {
    const svc = await createSvc();
    expect(() =>
      svc.registerApp({ name: 'App', description: 'desc', developerId: 'nonexist' }),
    ).toThrow('开发者不存在');
  });

  it('BS-0100: 同名应用抛 Conflict', async () => {
    const svc = await createSvc();
    const dev = registerDev(svc);
    svc.registerApp({ name: 'DupApp', description: 'desc', developerId: dev.id });
    expect(() =>
      svc.registerApp({ name: 'DupApp', description: 'desc', developerId: dev.id }),
    ).toThrow('同名应用已存在');
  });

  it('BS-0100: 应用列表按开发者过滤', async () => {
    const svc = await createSvc();
    const dev1 = registerDev(svc, { name: 'Dev1', email: 'dev1@test.com' });
    const dev2 = registerDev(svc, { name: 'Dev2', email: 'dev2@test.com' });
    svc.registerApp({ name: 'App1', description: 'desc', developerId: dev1.id });
    svc.registerApp({ name: 'App2', description: 'desc', developerId: dev2.id });
    svc.registerApp({ name: 'App3', description: 'desc', developerId: dev1.id });

    const dev1Apps = svc.listApps({ developerId: dev1.id });
    expect(dev1Apps.length).toBe(2);
    expect(dev1Apps.every(a => a.developerId === dev1.id)).toBe(true);
  });

  it('BS-0100: 获取不存在的应用详情抛 NotFound', async () => {
    const svc = await createSvc();
    expect(() => svc.getApp('nonexist')).toThrow('ISV应用不存在');
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0101: 应用审核与状态管理
  // ══════════════════════════════════════════════════════════════

  it('BS-0101: 审核应用通过（正例）', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    const approved = svc.updateAppStatus(app.id, {
      status: 'approved',
      reviewer: 'admin',
      reviewNote: '资质齐全',
    });
    expect(approved.status).toBe('approved');
    expect(approved.reviewedBy).toBe('admin');
    expect(approved.reviewNote).toBe('资质齐全');
  });

  it('BS-0101: 无效状态转移抛 BadRequest', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    // pending -> listed 不允许
    expect(() =>
      svc.updateAppStatus(app.id, { status: 'listed', reviewer: 'admin' }),
    ).toThrow('不允许');
  });

  it('BS-0101: 应用上架/下架状态机正确', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    svc.updateAppStatus(app.id, { status: 'approved', reviewer: 'admin' });
    svc.updateAppStatus(app.id, { status: 'listed', reviewer: 'admin' });
    expect(svc.getApp(app.id).status).toBe('listed');

    svc.updateAppStatus(app.id, { status: 'unlisted', reviewer: 'admin' });
    expect(svc.getApp(app.id).status).toBe('unlisted');
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0101: API 密钥管理
  // ══════════════════════════════════════════════════════════════

  it('BS-0101: 生成 API 密钥（正例）', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    const key = svc.generateApiKeyPair(app.id, 'dev-1');
    expect(key.id).toBeTruthy();
    expect(key.apiKey).toBeTruthy();
    expect(key.apiSecret).toBeTruthy();
    expect(key.status).toBe('active');
    expect(key.appId).toBe(app.id);
  });

  it('BS-0101: 密钥轮换（正例）', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    const key = svc.generateApiKeyPair(app.id, 'dev-1');
    const rotated = svc.rotateApiKey(key.id, 'dev-1');
    expect(rotated.old.status).toBe('rotated');
    expect(rotated.old.rotatedToId).toBe(rotated.new.id);
    expect(rotated.new.status).toBe('active');
    expect(rotated.new.apiKey).not.toBe(rotated.old.apiKey);
  });

  it('BS-0101: 密钥吊销（正例）', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    const key = svc.generateApiKeyPair(app.id, 'dev-1');
    const revoked = svc.revokeApiKey(key.id, '安全原因');
    expect(revoked.status).toBe('revoked');
    expect(revoked.revokeReason).toBe('安全原因');
  });

  it('BS-0101: 吊销已吊销密钥抛 BadRequest', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    const key = svc.generateApiKeyPair(app.id, 'dev-1');
    svc.revokeApiKey(key.id, 'reason');
    expect(() => svc.revokeApiKey(key.id, 'again')).toThrow('已被吊销');
  });

  it('BS-0101: 轮换不存在密钥抛 NotFound', async () => {
    const svc = await createSvc();
    expect(() => svc.rotateApiKey('nonexist', 'admin')).toThrow('密钥不存在');
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0102: 请求签名校验
  // ══════════════════════════════════════════════════════════════

  it('BS-0102: 签名校验通过（正例）', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    const timestamp = Date.now();
    const nonce = 'abc123';
    const body = '{"hello":"world"}';
    const crypto = require('crypto');
    const sig = crypto.createHmac('sha256', app.apiSecret).update(`${timestamp}${nonce}${body}`).digest('hex');

    const result = svc.verifySignature({
      apiKey: app.apiKey,
      timestamp,
      nonce,
      signature: sig,
      body,
    });
    expect(result.valid).toBe(true);
    expect(result.app?.id).toBe(app.id);
  });

  it('BS-0102: 无效 API Key 返回 invalid', async () => {
    const svc = await createSvc();
    const result = svc.verifySignature({
      apiKey: 'invalid_key',
      timestamp: Date.now(),
      nonce: 'abc',
      signature: 'sig',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('API Key 无效');
  });

  it('BS-0102: 过期时间戳返回 invalid', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    const result = svc.verifySignature({
      apiKey: app.apiKey,
      timestamp: Date.now() - 10 * 60 * 1000, // 10分钟前
      nonce: 'abc',
      signature: 'sig',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('请求已过期');
  });

  it('BS-0102: 签名不匹配返回 invalid', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    const result = svc.verifySignature({
      apiKey: app.apiKey,
      timestamp: Date.now(),
      nonce: 'abc',
      signature: 'wrong_signature',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('签名不匹配');
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0103: 配额与频控
  // ══════════════════════════════════════════════════════════════

  it('BS-0103: 检查配额（正例）', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    const quota = svc.checkQuota(app.id);
    expect(quota.allowed).toBe(true);
    expect(quota.usedToday).toBe(0);
    expect(quota.quota).toBe(10000);
    expect(quota.remaining).toBe(10000);
  });

  it('BS-0103: 配额耗尽返回 not allowed', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    // 强制设置 quota=0
    app.quota = 0;
    // 重新保存
    const quota = svc.checkQuota(app.id);
    expect(quota.allowed).toBe(false);
    expect(quota.remaining).toBe(0);
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0106~BS-0107: API 版本管理
  // ══════════════════════════════════════════════════════════════

  it('BS-0106: 注册 API 版本（正例）', async () => {
    const svc = await createSvc();
    const ver = svc.registerApiVersion({ version: 'v2', basePath: '/api/v2', changelog: 'Add new features' });
    expect(ver.version).toBe('v2');
    expect(ver.basePath).toBe('/api/v2');
    expect(ver.status).toBe('active');
  });

  it('BS-0106: 无效版本号抛 BadRequest', async () => {
    const svc = await createSvc();
    expect(() =>
      svc.registerApiVersion({ version: 'invalid', basePath: '/api/v1' }),
    ).toThrow('版本号格式无效');
  });

  it('BS-0106: 重复版本号抛 Conflict', async () => {
    const svc = await createSvc();
    svc.registerApiVersion({ version: 'v1', basePath: '/api/v1' });
    expect(() =>
      svc.registerApiVersion({ version: 'v1', basePath: '/api/v1' }),
    ).toThrow('已存在');
  });

  it('BS-0107: 废弃版本（正例）', async () => {
    const svc = await createSvc();
    const ver = svc.registerApiVersion({ version: 'v1', basePath: '/api/v1' });
    const deprecated = svc.deprecateApiVersion(ver.id, '2027-01-01');
    expect(deprecated.status).toBe('deprecated');
    expect(deprecated.sunsetAt?.toISOString().slice(0, 10)).toBe('2027-01-01');
  });

  it('BS-0107: 废弃不存在版本抛 NotFound', async () => {
    const svc = await createSvc();
    expect(() => svc.deprecateApiVersion('nonexist', '2027-01-01')).toThrow('API版本不存在');
  });

  it('BS-0107: 版本列表按创建时间排序', async () => {
    const svc = await createSvc();
    svc.registerApiVersion({ version: 'v1', basePath: '/api/v1' });
    svc.registerApiVersion({ version: 'v2', basePath: '/api/v2' });
    const versions = svc.listApiVersions();
    expect(versions.length).toBe(2);
    expect(versions[0].version).toBe('v1');
    expect(versions[1].version).toBe('v2');
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0104~BS-0105: SDK 版本管理
  // ══════════════════════════════════════════════════════════════

  it('BS-0104: 发布 SDK（正例）', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    const sdk = svc.publishSdk({
      appId: app.id,
      language: 'javascript',
      version: '1.0.0',
      downloadUrl: 'https://cdn.example.com/sdk/v1.0.0/',
      docContent: '# SDK Usage\n## Install\n```\nnpm install\n```',
      changelog: 'Initial release',
    });
    expect(sdk.id).toBeTruthy();
    expect(sdk.language).toBe('javascript');
    expect(sdk.version).toBe('1.0.0');
    expect(sdk.isLatest).toBe(true);
  });

  it('BS-0104: 发布新版本后旧版本 isLatest 变为 false', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    svc.publishSdk({ appId: app.id, language: 'javascript', version: '1.0.0', downloadUrl: 'url1' });
    const v2 = svc.publishSdk({ appId: app.id, language: 'javascript', version: '2.0.0', downloadUrl: 'url2' });
    expect(v2.isLatest).toBe(true);

    const sdks = svc.listSdks(app.id);
    const v1 = sdks.find(s => s.version === '1.0.0');
    expect(v1?.isLatest).toBe(false);
    expect(v2.isLatest).toBe(true);
  });

  it('BS-0104: SDK 列表按发布时间倒序', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    svc.publishSdk({ appId: app.id, language: 'python', version: '2.0.0', downloadUrl: 'url2' });
    svc.publishSdk({ appId: app.id, language: 'python', version: '1.0.0', downloadUrl: 'url1' });
    const sdks = svc.listSdks(app.id);
    expect(sdks.length).toBe(2);
    expect(sdks[0].version).toBe('2.0.0');
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0108~BS-0110: 计费与 SLA
  // ══════════════════════════════════════════════════════════════

  it('BS-0109: 创建 SLA 合同（正例）', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    svc.updateAppStatus(app.id, { status: 'approved', reviewer: 'admin' });
    const sla = svc.createSla({
      appId: app.id,
      tierName: 'Standard',
      uptimeGuarantee: 0.99,
      penaltyRate: 0.05,
      monthlyCallCommitment: 5000,
      overageUnitPrice: 1,
    });
    expect(sla.status).toBe('active');
    expect(sla.uptimeGuarantee).toBe(0.99);
    expect(sla.penaltyRate).toBe(0.05);
  });

  it('BS-0109: 无效 uptimeGuarantee 抛 BadRequest', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    expect(() =>
      svc.createSla({
        appId: app.id,
        tierName: 'Bad',
        uptimeGuarantee: 2,
        penaltyRate: 0.05,
        monthlyCallCommitment: 1000,
        overageUnitPrice: 1,
      }),
    ).toThrow('uptimeGuarantee 必须在 0~1 之间');
  });

  it('BS-0109: 重复创建活跃 SLA 抛 Conflict', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    svc.updateAppStatus(app.id, { status: 'approved', reviewer: 'admin' });
    svc.createSla({
      appId: app.id,
      tierName: 'Standard',
      uptimeGuarantee: 0.99,
      penaltyRate: 0.05,
      monthlyCallCommitment: 1000,
      overageUnitPrice: 1,
    });
    expect(() =>
      svc.createSla({
        appId: app.id,
        tierName: 'Premium',
        uptimeGuarantee: 0.999,
        penaltyRate: 0.1,
        monthlyCallCommitment: 5000,
        overageUnitPrice: 1,
      }),
    ).toThrow('已有活跃SLA合同');
  });

  it('BS-0108: 生成月度账单（正例）', async () => {
    const svc = await createSvc();
    const dev = registerDev(svc);
    const app = registerApp(svc, { developerId: dev.id, name: 'BillingApp' });
    svc.updateAppStatus(app.id, { status: 'approved', reviewer: 'admin' });

    // 模拟部分调用
    svc.recordCall({
      appId: app.id,
      developerId: dev.id,
      endpoint: '/api/v1/test',
      cost: 10,
      statusCode: 200,
      signature: 'sig',
      durationMs: 100,
    });
    svc.recordCall({
      appId: app.id,
      developerId: dev.id,
      endpoint: '/api/v1/test2',
      cost: 20,
      statusCode: 200,
      signature: 'sig2',
      durationMs: 50,
    });

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const bill = svc.generateBilling(month, app.id);
    expect(bill.totalCalls).toBe(2);
    expect(bill.totalAmount).toBe(30); // 10 + 20
  });

  it('BS-0108: 重复生成账单抛 Conflict', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    svc.generateBilling(month, app.id);
    expect(() => svc.generateBilling(month, app.id)).toThrow('账单已生成');
  });

  it('BS-0110: 结算账单（正例）', async () => {
    const svc = await createSvc();
    const dev = registerDev(svc);
    const app = registerApp(svc, { developerId: dev.id, name: 'SettleApp' });
    svc.updateAppStatus(app.id, { status: 'approved', reviewer: 'admin' });

    svc.recordCall({
      appId: app.id, developerId: dev.id, endpoint: '/test', cost: 100,
      statusCode: 200, signature: 'sig', durationMs: 50,
    });

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const bill = svc.generateBilling(month, app.id);
    expect(bill.status).toBe('pending');

    const settled = svc.settleBilling(bill.id);
    expect(settled.status).toBe('settled');
    expect(settled.settledAt).toBeTruthy();

    const devUpdated = svc.getDeveloper(dev.id);
    expect(devUpdated.balance).toBe(100);
    expect(devUpdated.totalEarned).toBe(100);
  });

  it('BS-0110: 结算不存在的账单抛 NotFound', async () => {
    const svc = await createSvc();
    expect(() => svc.settleBilling('nonexist')).toThrow('账单不存在');
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0113: 应用市场
  // ══════════════════════════════════════════════════════════════

  it('BS-0113: 上架应用到市场（正例）', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    svc.updateAppStatus(app.id, { status: 'approved', reviewer: 'admin' });
    svc.updateAppStatus(app.id, { status: 'listed', reviewer: 'admin' });

    const item = svc.publishToMarketplace(app.id, {
      displayName: '超级应用',
      summary: '一个强大的ISV应用',
      description: '这是详细描述',
      tags: ['utility', 'payment'],
      price: 9900,
      screenshots: ['https://cdn.example.com/shot1.png'],
    });
    expect(item.displayName).toBe('超级应用');
    expect(item.price).toBe(9900);
    expect(item.isFeatured).toBe(false);
    expect(item.rating).toBe(0);
  });

  it('BS-0113: 未上架应用发布到市场抛 BadRequest', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    expect(() =>
      svc.publishToMarketplace(app.id, {
        displayName: 'Test',
        summary: 's',
        description: 'd',
        tags: [],
        price: 0,
        screenshots: [],
      }),
    ).toThrow('应用必须先上架');
  });

  it('BS-0113: 搜索应用市场', async () => {
    const svc = await createSvc();
    // 创建两个应用并上架市场
    const dev = registerDev(svc);
    const app1 = registerApp(svc, { developerId: dev.id, name: 'PaymentApp' });
    const app2 = registerApp(svc, { developerId: dev.id, name: 'LogisticsApp' });

    svc.updateAppStatus(app1.id, { status: 'approved', reviewer: 'admin' });
    svc.updateAppStatus(app1.id, { status: 'listed', reviewer: 'admin' });
    svc.updateAppStatus(app2.id, { status: 'approved', reviewer: 'admin' });
    svc.updateAppStatus(app2.id, { status: 'listed', reviewer: 'admin' });

    svc.publishToMarketplace(app1.id, {
      displayName: '支付系统', summary: '快速支付', description: 'desc', tags: ['payment'], price: 5000, screenshots: [],
    });
    svc.publishToMarketplace(app2.id, {
      displayName: '物流系统', summary: '物流管理', description: 'desc', tags: ['logistics'], price: 3000, screenshots: [],
    });

    const searchResult = svc.listMarketplace({ search: '支付' });
    expect(searchResult.length).toBe(1);
    expect(searchResult[0].displayName).toBe('支付系统');

    const all = svc.listMarketplace();
    expect(all.length).toBe(2);
  });

  it('BS-0113: 价格过滤市场列表', async () => {
    const svc = await createSvc();
    const dev = registerDev(svc);
    const app1 = registerApp(svc, { developerId: dev.id, name: 'App1' });
    const app2 = registerApp(svc, { developerId: dev.id, name: 'App2' });

    svc.updateAppStatus(app1.id, { status: 'approved', reviewer: 'admin' });
    svc.updateAppStatus(app1.id, { status: 'listed', reviewer: 'admin' });
    svc.updateAppStatus(app2.id, { status: 'approved', reviewer: 'admin' });
    svc.updateAppStatus(app2.id, { status: 'listed', reviewer: 'admin' });

    svc.publishToMarketplace(app1.id, {
      displayName: '免费应用', summary: 'free', description: 'd', tags: [], price: 0, screenshots: [],
    });
    svc.publishToMarketplace(app2.id, {
      displayName: '付费应用', summary: 'paid', description: 'd', tags: [], price: 9900, screenshots: [],
    });

    const freeOnly = svc.listMarketplace({ maxPrice: 0 });
    expect(freeOnly.length).toBe(1);
    expect(freeOnly[0].displayName).toBe('免费应用');

    const paid = svc.listMarketplace({ minPrice: 5000 });
    expect(paid.length).toBe(1);
    expect(paid[0].displayName).toBe('付费应用');
  });

  // ══════════════════════════════════════════════════════════════
  // 边界与综合场景
  // ══════════════════════════════════════════════════════════════

  it('BS-0108: 无效账单月份格式抛 BadRequest', async () => {
    const svc = await createSvc();
    const app = registerApp(svc);
    expect(() => svc.generateBilling('invalid', app.id)).toThrow('账单月份格式无效');
  });

  it('BS-0103: 记录调用超配额抛 BadRequest', async () => {
    const svc = await createSvc();
    const dev = registerDev(svc);
    const app = registerApp(svc, { developerId: dev.id, name: 'QuotaApp' });
    app.quota = 0;

    expect(() =>
      svc.recordCall({
        appId: app.id,
        developerId: dev.id,
        endpoint: '/test',
        cost: 10,
        statusCode: 200,
        signature: 'sig',
        durationMs: 50,
      }),
    ).toThrow('日配额已耗尽');
  });

  it('BS-0109: SLA 查询按 appId 过滤', async () => {
    const svc = await createSvc();
    const dev = registerDev(svc);
    const app1 = registerApp(svc, { developerId: dev.id, name: 'SlaApp1' });
    const app2 = registerApp(svc, { developerId: dev.id, name: 'SlaApp2' });
    svc.updateAppStatus(app1.id, { status: 'approved', reviewer: 'admin' });
    svc.updateAppStatus(app2.id, { status: 'approved', reviewer: 'admin' });
    svc.createSla({ appId: app1.id, tierName: 'T1', uptimeGuarantee: 0.99, penaltyRate: 0.05, monthlyCallCommitment: 1000, overageUnitPrice: 1 });
    svc.createSla({ appId: app2.id, tierName: 'T2', uptimeGuarantee: 0.95, penaltyRate: 0.1, monthlyCallCommitment: 500, overageUnitPrice: 2 });

    const app1Slas = svc.getSla({ appId: app1.id });
    expect(Array.isArray(app1Slas)).toBe(true);
    expect((app1Slas as any[]).length).toBe(1);
    expect((app1Slas as any[])[0].appId).toBe(app1.id);
  });

  it('BS-0112: 开发者列表返回全部', async () => {
    const svc = await createSvc();
    registerDev(svc, { name: 'Dev A', email: 'a@test.com' });
    registerDev(svc, { name: 'Dev B', email: 'b@test.com' });
    const devs = svc.listDevelopers();
    expect(devs.length).toBe(2);
  });
});
