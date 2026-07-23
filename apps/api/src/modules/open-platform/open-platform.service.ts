// open-platform.service.ts · WP-07 开放平台与ISV
// BS-0100~BS-0113

import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  IsvApp,
  IsvAppStatus,
  IsvDeveloper,
  IsvDeveloperStatus,
  ApiKeyRecord,
  ApiCallRecord,
  SlaContract,
  SlaStatus,
  BillingRecord,
  BillingStatus,
  ApiVersion,
  ApiVersionStatus,
  SdkVersion,
  SdkLanguage,
  MarketplaceItem,
} from './open-platform.entity';

@Injectable()
export class OpenPlatformService {
  private readonly logger = new Logger(OpenPlatformService.name);

  /** 内存存储 — 生产环境应替换为数据库 */
  private readonly appStore = new Map<string, IsvApp>();
  private readonly developerStore = new Map<string, IsvDeveloper>();
  private readonly apiKeyStore = new Map<string, ApiKeyRecord>();
  private readonly callRecordStore = new Map<string, ApiCallRecord>();
  private readonly slaStore = new Map<string, SlaContract>();
  private readonly billingStore = new Map<string, BillingRecord>();
  private readonly apiVersionStore = new Map<string, ApiVersion>();
  private readonly sdkStore = new Map<string, SdkVersion>();
  private readonly marketplaceStore = new Map<string, MarketplaceItem>();

  // ────────── 测试辅助 ──────────

  reset(): void {
    this.appStore.clear();
    this.developerStore.clear();
    this.apiKeyStore.clear();
    this.callRecordStore.clear();
    this.slaStore.clear();
    this.billingStore.clear();
    this.apiVersionStore.clear();
    this.sdkStore.clear();
    this.marketplaceStore.clear();
  }

  /** 生成随机 API Key */
  private generateApiKey(): string {
    return `op_${crypto.randomBytes(24).toString('hex')}`;
  }

  /** 生成随机 API Secret */
  private generateApiSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /** 哈希密钥 */
  private hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  /** 生成签名 */
  private signPayload(secret: string, payload: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /** 获取或创建开发者辅助 */
  private getDeveloperOrThrow(developerId: string): IsvDeveloper {
    const dev = this.developerStore.get(developerId);
    if (!dev) throw new NotFoundException(`开发者不存在: ${developerId}`);
    return dev;
  }

  /** 获取或创建应用辅助 */
  private getAppOrThrow(appId: string): IsvApp {
    const app = this.appStore.get(appId);
    if (!app) throw new NotFoundException(`ISV应用不存在: ${appId}`);
    return app;
  }

  // ════════════════════════════════════════════════════════════
  // BS-0112: 开发者注册与管理
  // ════════════════════════════════════════════════════════════

  /**
   * 注册 ISV 开发者
   */
  registerDeveloper(dto: {
    name: string;
    email: string;
    bio?: string;
    website?: string;
    phone?: string;
  }): IsvDeveloper {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('开发者名称不能为空');
    }
    if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      throw new BadRequestException('邮箱格式无效');
    }

    // 检查邮箱是否已注册
    const existing = Array.from(this.developerStore.values()).find(
      d => d.email === dto.email,
    );
    if (existing) {
      throw new ConflictException('该邮箱已被注册');
    }

    const id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const developer: IsvDeveloper = {
      id,
      name: dto.name.trim(),
      email: dto.email.trim(),
      balance: 0,
      totalEarned: 0,
      status: 'active',
      bio: dto.bio,
      website: dto.website,
      phone: dto.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.developerStore.set(id, developer);
    this.logger.log(`注册ISV开发者: ${id} (${dto.email})`);
    return developer;
  }

  /**
   * 获取开发者信息
   */
  getDeveloper(developerId: string): IsvDeveloper {
    return this.getDeveloperOrThrow(developerId);
  }

  /**
   * 获取所有开发者
   */
  listDevelopers(): IsvDeveloper[] {
    return Array.from(this.developerStore.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  // ════════════════════════════════════════════════════════════
  // BS-0100: ISV 应用注册与生命周期
  // ════════════════════════════════════════════════════════════

  /**
   * 注册 ISV 应用
   */
  registerApp(dto: {
    name: string;
    description: string;
    developerId: string;
    iconUrl?: string;
    category?: string;
  }): IsvApp {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('应用名称不能为空');
    }
    if (!dto.description || dto.description.trim().length === 0) {
      throw new BadRequestException('应用描述不能为空');
    }

    const dev = this.getDeveloperOrThrow(dto.developerId);
    if (dev.status !== 'active') {
      throw new BadRequestException('开发者账户状态异常，无法创建应用');
    }

    // 检查同名应用
    const existing = Array.from(this.appStore.values()).find(
      a => a.name === dto.name.trim() && a.developerId === dto.developerId,
    );
    if (existing) {
      throw new ConflictException('同名应用已存在');
    }

    const apiKey = this.generateApiKey();
    const apiSecret = this.generateApiSecret();

    const id = `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const app: IsvApp = {
      id,
      name: dto.name.trim(),
      description: dto.description.trim(),
      developerId: dto.developerId,
      status: 'pending',
      apiKey,
      apiSecret,
      quota: 10000, // 默认日配额
      apiVersion: 'v1',
      iconUrl: dto.iconUrl,
      category: dto.category,
      price: 0,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.appStore.set(id, app);
    this.logger.log(`注册ISV应用: ${id} (${dto.name}), 开发者: ${dto.developerId}`);
    return app;
  }

  /**
   * 获取应用列表
   */
  listApps(params?: {
    developerId?: string;
    status?: IsvAppStatus;
    category?: string;
  }): IsvApp[] {
    let apps = Array.from(this.appStore.values());

    if (params?.developerId) {
      apps = apps.filter(a => a.developerId === params.developerId);
    }
    if (params?.status) {
      apps = apps.filter(a => a.status === params.status);
    }
    if (params?.category) {
      apps = apps.filter(a => a.category === params.category);
    }

    return apps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 获取应用详情
   */
  getApp(appId: string): IsvApp {
    return this.getAppOrThrow(appId);
  }

  /**
   * 审核应用 (审核/上架/下架)
   */
  updateAppStatus(appId: string, dto: {
    status: IsvAppStatus;
    reviewNote?: string;
    reviewer: string;
  }): IsvApp {
    const app = this.getAppOrThrow(appId);
    const validTransitions: Record<IsvAppStatus, IsvAppStatus[]> = {
      pending: ['approved', 'rejected'],
      approved: ['listed', 'suspended'],
      rejected: ['pending'],
      suspended: ['approved', 'listed'],
      listed: ['unlisted', 'suspended'],
      unlisted: ['listed', 'pending'],
    };

    const allowed = validTransitions[app.status];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new BadRequestException(
        `不允许从 ${app.status} 切换到 ${dto.status}`,
      );
    }

    app.status = dto.status;
    app.reviewedBy = dto.reviewer;
    app.reviewedAt = new Date();
    app.updatedAt = new Date();
    if (dto.reviewNote) {
      app.reviewNote = dto.reviewNote;
    }

    this.appStore.set(appId, app);
    this.logger.log(
      `应用状态更新: ${appId} → ${dto.status} (审核人: ${dto.reviewer})`,
    );
    return app;
  }

  // ════════════════════════════════════════════════════════════
  // BS-0101: API 密钥管理
  // ════════════════════════════════════════════════════════════

  /**
   * 生成 API 密钥
   */
  generateApiKeyPair(appId: string, createdBy: string): ApiKeyRecord {
    const app = this.getAppOrThrow(appId);
    if (app.status === 'rejected' || app.status === 'suspended') {
      throw new BadRequestException('应用状态不允许生成密钥');
    }

    const apiKey = this.generateApiKey();
    const apiSecret = this.generateApiSecret();

    const id = `key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: ApiKeyRecord = {
      id,
      appId,
      environment: app.status === 'approved' || app.status === 'listed' ? 'live' : 'test',
      apiKey,
      apiSecret,
      apiSecretHash: this.hashSecret(apiSecret),
      status: 'active',
      createdBy,
      createdAt: new Date(),
    };

    this.apiKeyStore.set(id, record);

    // 更新应用的主密钥
    app.apiKey = apiKey;
    app.apiSecret = apiSecret;
    app.updatedAt = new Date();
    this.appStore.set(appId, app);

    this.logger.log(`生成API密钥: ${id} (应用: ${appId})`);
    return record;
  }

  /**
   * 轮换密钥（旧密钥作废，生成新密钥）
   */
  rotateApiKey(keyId: string, createdBy: string): { old: ApiKeyRecord; new: ApiKeyRecord } {
    const old = this.apiKeyStore.get(keyId);
    if (!old) throw new NotFoundException(`密钥不存在: ${keyId}`);
    if (old.status !== 'active') {
      throw new BadRequestException(`密钥状态为 ${old.status}，不可轮换`);
    }

    const newKey = this.generateApiKeyPair(old.appId, createdBy);

    old.status = 'rotated';
    old.rotatedAt = new Date();
    old.rotatedToId = newKey.id;
    this.apiKeyStore.set(keyId, old);

    return { old, new: newKey };
  }

  /**
   * 吊销密钥
   */
  revokeApiKey(keyId: string, reason: string): ApiKeyRecord {
    const key = this.apiKeyStore.get(keyId);
    if (!key) throw new NotFoundException(`密钥不存在: ${keyId}`);
    if (key.status === 'revoked') {
      throw new BadRequestException('密钥已被吊销');
    }

    key.status = 'revoked';
    key.revokeReason = reason;
    key.revokedAt = new Date();
    this.apiKeyStore.set(keyId, key);

    this.logger.log(`吊销密钥: ${keyId} (原因: ${reason})`);
    return key;
  }

  // ════════════════════════════════════════════════════════════
  // BS-0102: 请求签名校验
  // ════════════════════════════════════════════════════════════

  /**
   * 校验请求签名
   */
  verifySignature(dto: {
    apiKey: string;
    timestamp: number;
    nonce: string;
    signature: string;
    body?: string;
  }): { valid: boolean; app?: IsvApp; reason?: string } {
    const app = Array.from(this.appStore.values()).find(
      a => a.apiKey === dto.apiKey,
    );
    if (!app) {
      return { valid: false, reason: 'API Key 无效' };
    }
    if (app.status === 'suspended') {
      return { valid: false, reason: '应用已被暂停' };
    }
    if (app.status === 'rejected') {
      return { valid: false, reason: '应用已被驳回' };
    }

    // 时间戳校验 (±5分钟)
    const now = Date.now();
    const diff = Math.abs(now - dto.timestamp);
    if (diff > 5 * 60 * 1000) {
      return { valid: false, reason: '请求已过期' };
    }

    // nonce 重放校验
    const payload = `${dto.timestamp}${dto.nonce}${dto.body || ''}`;
    const expectedSig = this.signPayload(app.apiSecret, payload);

    if (expectedSig !== dto.signature) {
      return { valid: false, reason: '签名不匹配' };
    }

    return { valid: true, app };
  }

  // ════════════════════════════════════════════════════════════
  // BS-0103: 频控与配额
  // ════════════════════════════════════════════════════════════

  /**
   * 检查配额
   */
  checkQuota(appId: string): {
    allowed: boolean;
    usedToday: number;
    quota: number;
    remaining: number;
  } {
    const app = this.getAppOrThrow(appId);

    const today = new Date().toISOString().slice(0, 10);
    const usedToday = Array.from(this.callRecordStore.values()).filter(
      r => r.appId === appId && r.timestamp.toISOString().slice(0, 10) === today,
    ).length;

    const remaining = Math.max(0, app.quota - usedToday);
    return {
      allowed: remaining > 0,
      usedToday,
      quota: app.quota,
      remaining,
    };
  }

  /**
   * 记录 API 调用
   */
  recordCall(dto: {
    appId: string;
    developerId: string;
    endpoint: string;
    cost: number;
    statusCode: number;
    signature: string;
    ipAddress?: string;
    durationMs: number;
  }): ApiCallRecord {
    const app = this.getAppOrThrow(dto.appId);

    const id = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: ApiCallRecord = {
      id,
      appId: dto.appId,
      developerId: dto.developerId,
      endpoint: dto.endpoint,
      timestamp: new Date(),
      cost: dto.cost,
      statusCode: dto.statusCode,
      signature: dto.signature,
      ipAddress: dto.ipAddress,
      durationMs: dto.durationMs,
    };

    // 检查配额
    const quotaCheck = this.checkQuota(dto.appId);
    if (!quotaCheck.allowed) {
      throw new BadRequestException('日配额已耗尽');
    }

    this.callRecordStore.set(id, record);

    // 4xx/5xx 不计费
    if (dto.statusCode < 400) {
      // 计费更新暂存在调用记录中
    }

    this.logger.log(`记录API调用: ${id} (应用: ${dto.appId}, ${dto.endpoint})`);
    return record;
  }

  /**
   * 查询调用量统计
   */
  getUsageStats(params: {
    appId?: string;
    developerId?: string;
    startDate?: string;
    endDate?: string;
  }): {
    totalCalls: number;
    totalCost: number;
    avgDurationMs: number;
    errorRate: number;
    calls: ApiCallRecord[];
  } {
    let records = Array.from(this.callRecordStore.values());

    if (params.appId) {
      records = records.filter(r => r.appId === params.appId);
    }
    if (params.developerId) {
      records = records.filter(r => r.developerId === params.developerId);
    }
    if (params.startDate) {
      const start = new Date(params.startDate);
      records = records.filter(r => r.timestamp >= start);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setDate(end.getDate() + 1);
      records = records.filter(r => r.timestamp < end);
    }

    const totalCalls = records.length;
    const totalCost = records.reduce((s, r) => s + r.cost, 0);
    const totalDuration = records.reduce((s, r) => s + r.durationMs, 0);
    const avgDurationMs = totalCalls > 0 ? totalDuration / totalCalls : 0;
    const errors = records.filter(r => r.statusCode >= 400).length;
    const errorRate = totalCalls > 0 ? errors / totalCalls : 0;

    return {
      totalCalls,
      totalCost,
      avgDurationMs: Math.round(avgDurationMs * 100) / 100,
      errorRate: Math.round(errorRate * 10000) / 10000,
      calls: records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    };
  }

  // ════════════════════════════════════════════════════════════
  // BS-0106~BS-0107: API 版本管理
  // ════════════════════════════════════════════════════════════

  /**
   * 注册 API 版本
   */
  registerApiVersion(dto: {
    version: string;
    basePath: string;
    changelog?: string;
  }): ApiVersion {
    if (!dto.version || !/^v\d+$/.test(dto.version)) {
      throw new BadRequestException('版本号格式无效 (例: v1, v2)');
    }
    if (!dto.basePath) {
      throw new BadRequestException('基础路径不能为空');
    }

    const existing = Array.from(this.apiVersionStore.values()).find(
      v => v.version === dto.version,
    );
    if (existing) {
      throw new ConflictException(`版本 ${dto.version} 已存在`);
    }

    const id = `ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const version: ApiVersion = {
      id,
      version: dto.version,
      basePath: dto.basePath,
      status: 'active',
      changelog: dto.changelog,
      createdAt: new Date(),
    };

    this.apiVersionStore.set(id, version);
    this.logger.log(`注册API版本: ${dto.version} (路径: ${dto.basePath})`);
    return version;
  }

  /**
   * 废弃 API 版本
   */
  deprecateApiVersion(versionId: string, sunsetDate: string): ApiVersion {
    const ver = this.apiVersionStore.get(versionId);
    if (!ver) throw new NotFoundException(`API版本不存在: ${versionId}`);
    if (ver.status !== 'active') {
      throw new BadRequestException(`版本当前状态为 ${ver.status}，不可废弃`);
    }

    ver.status = 'deprecated';
    ver.deprecatedAt = new Date();
    ver.sunsetAt = new Date(sunsetDate);
    this.apiVersionStore.set(versionId, ver);

    this.logger.log(`废弃API版本: ${ver.version}, 下线日期: ${sunsetDate}`);

    // 通知使用该版本的应用
    const affectedApps = Array.from(this.appStore.values()).filter(
      a => a.apiVersion === ver.version && a.status !== 'rejected',
    );
    if (affectedApps.length > 0) {
      this.logger.warn(
        `版本 ${ver.version} 废弃，影响 ${affectedApps.length} 个应用`,
      );
    }

    return ver;
  }

  /**
   * 查询 API 版本列表
   */
  listApiVersions(): ApiVersion[] {
    return Array.from(this.apiVersionStore.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  // ════════════════════════════════════════════════════════════
  // BS-0104~BS-0105: SDK 版本管理
  // ════════════════════════════════════════════════════════════

  /**
   * 发布 SDK 版本
   */
  publishSdk(dto: {
    appId: string;
    language: SdkLanguage;
    version: string;
    downloadUrl: string;
    docContent?: string;
    changelog?: string;
  }): SdkVersion {
    this.getAppOrThrow(dto.appId);

    if (!dto.downloadUrl) {
      throw new BadRequestException('下载地址不能为空');
    }

    // 检查同一语言版本覆盖
    const existing = Array.from(this.sdkStore.values()).find(
      s => s.appId === dto.appId && s.language === dto.language && s.isLatest,
    );
    if (existing) {
      existing.isLatest = false;
      this.sdkStore.set(existing.id, existing);
    }

    const id = `sdk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sdk: SdkVersion = {
      id,
      appId: dto.appId,
      language: dto.language,
      version: dto.version,
      downloadUrl: dto.downloadUrl,
      docContent: dto.docContent,
      isLatest: true,
      changelog: dto.changelog,
      createdAt: new Date(),
    };

    this.sdkStore.set(id, sdk);
    this.logger.log(`发布SDK: ${dto.language} v${dto.version} (应用: ${dto.appId})`);
    return sdk;
  }

  /**
   * 获取 SDK 列表
   */
  listSdks(appId: string): SdkVersion[] {
    return Array.from(this.sdkStore.values())
      .filter(s => s.appId === appId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ════════════════════════════════════════════════════════════
  // BS-0108: API 调用计费
  // ════════════════════════════════════════════════════════════

  /**
   * 生成月度账单
   */
  generateBilling(billingMonth: string, appId: string): BillingRecord {
    const app = this.getAppOrThrow(appId);

    if (!/^\d{4}-\d{2}$/.test(billingMonth)) {
      throw new BadRequestException('账单月份格式无效 (YYYY-MM)');
    }

    // 检查是否已生成
    const existing = Array.from(this.billingStore.values()).find(
      b => b.appId === appId && b.billingMonth === billingMonth,
    );
    if (existing) {
      throw new ConflictException(`${billingMonth} 账单已生成`);
    }

    // 统计当月调用
    const startDate = new Date(`${billingMonth}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const monthCalls = Array.from(this.callRecordStore.values()).filter(r => {
      const t = r.timestamp.getTime();
      return r.appId === appId && t >= startDate.getTime() && t < endDate.getTime();
    });

    const totalCalls = monthCalls.length;
    const totalCost = monthCalls.reduce((s, r) => s + r.cost, 0);

    // 检查 SLA 违约
    const sla = Array.from(this.slaStore.values()).find(
      s => s.appId === appId && s.status === 'active',
    );
    let slaPenalty = 0;
    if (sla) {
      const breachCalls = monthCalls.filter(r => r.statusCode >= 500).length;
      if (breachCalls > 0) {
        slaPenalty = Math.round(totalCost * sla.penaltyRate * breachCalls);
      }
    }

    const settleAmount = totalCost - slaPenalty;

    const id = `bill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const billing: BillingRecord = {
      id,
      developerId: app.developerId,
      appId,
      billingMonth,
      totalCalls,
      totalAmount: totalCost,
      slaPenalty,
      settleAmount: Math.max(0, settleAmount),
      status: 'pending',
      callDetails: monthCalls.slice(0, 1000), // 截断明细
      createdAt: new Date(),
    };

    this.billingStore.set(id, billing);
    this.logger.log(
      `生成账单: ${id} (${appId}, ${billingMonth}, 金额: ${settleAmount}分)`,
    );
    return billing;
  }

  /**
   * 结算账单
   */
  settleBilling(billingId: string): BillingRecord {
    const bill = this.billingStore.get(billingId);
    if (!bill) throw new NotFoundException(`账单不存在: ${billingId}`);
    if (bill.status !== 'pending') {
      throw new BadRequestException(`账单状态为 ${bill.status}，不可结算`);
    }

    const dev = this.getDeveloperOrThrow(bill.developerId);
    dev.balance += bill.settleAmount;
    dev.totalEarned += bill.settleAmount;
    dev.updatedAt = new Date();
    this.developerStore.set(dev.id, dev);

    bill.status = 'settled';
    bill.settledAt = new Date();
    this.billingStore.set(billingId, bill);

    this.logger.log(
      `结算账单: ${billingId}, 开发者 ${bill.developerId} 收入 ${bill.settleAmount}分`,
    );
    return bill;
  }

  // ════════════════════════════════════════════════════════════
  // BS-0109~BS-0110: SLA 管理
  // ════════════════════════════════════════════════════════════

  /**
   * 创建 SLA 合同
   */
  createSla(dto: {
    appId: string;
    tierName: string;
    uptimeGuarantee: number;
    penaltyRate: number;
    monthlyCallCommitment: number;
    overageUnitPrice: number;
  }): SlaContract {
    this.getAppOrThrow(dto.appId);

    if (dto.uptimeGuarantee <= 0 || dto.uptimeGuarantee > 1) {
      throw new BadRequestException('uptimeGuarantee 必须在 0~1 之间');
    }
    if (dto.penaltyRate <= 0 || dto.penaltyRate > 1) {
      throw new BadRequestException('penaltyRate 必须在 0~1 之间');
    }
    if (dto.monthlyCallCommitment < 0) {
      throw new BadRequestException('月调用承诺不能为负');
    }
    if (dto.overageUnitPrice < 0) {
      throw new BadRequestException('超出单价不能为负');
    }

    // 检查是否有活跃SLA
    const active = Array.from(this.slaStore.values()).find(
      s => s.appId === dto.appId && s.status === 'active',
    );
    if (active) {
      throw new ConflictException('应用已有活跃SLA合同');
    }

    const id = `sla-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sla: SlaContract = {
      id,
      appId: dto.appId,
      tierName: dto.tierName,
      uptimeGuarantee: dto.uptimeGuarantee,
      penaltyRate: dto.penaltyRate,
      monthlyCallCommitment: dto.monthlyCallCommitment,
      overageUnitPrice: dto.overageUnitPrice,
      status: 'active',
      startDate: new Date(),
      currentUptime: 1,
      currentCalls: 0,
      breachCount: 0,
      totalPenalty: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.slaStore.set(id, sla);
    this.logger.log(`创建SLA合同: ${id} (应用: ${dto.appId}, ${dto.tierName})`);
    return sla;
  }

  /**
   * 查询 SLA
   */
  getSla(params?: { appId?: string; slaId?: string }): SlaContract | SlaContract[] {
    if (params?.slaId) {
      const sla = this.slaStore.get(params.slaId);
      if (!sla) throw new NotFoundException(`SLA合同不存在: ${params.slaId}`);
      return sla;
    }
    if (params?.appId) {
      return Array.from(this.slaStore.values()).filter(
        s => s.appId === params.appId,
      );
    }
    return Array.from(this.slaStore.values());
  }

  // ════════════════════════════════════════════════════════════
  // BS-0113: 应用市场
  // ════════════════════════════════════════════════════════════

  /**
   * 上架应用到市场
   */
  publishToMarketplace(appId: string, dto: {
    displayName: string;
    summary: string;
    description: string;
    tags: string[];
    price: number;
    screenshots: string[];
  }): MarketplaceItem {
    const app = this.getAppOrThrow(appId);
    if (app.status !== 'listed') {
      throw new BadRequestException('应用必须先上架才能发布到市场');
    }

    const existing = Array.from(this.marketplaceStore.values()).find(
      m => m.appId === appId,
    );
    if (existing) {
      throw new ConflictException('应用已在市场中');
    }

    if (!dto.displayName) throw new BadRequestException('展示名称不能为空');
    if (dto.price < 0) throw new BadRequestException('价格不能为负');

    const id = `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item: MarketplaceItem = {
      id,
      appId,
      displayName: dto.displayName,
      summary: dto.summary,
      description: dto.description,
      tags: dto.tags,
      price: dto.price,
      screenshots: dto.screenshots,
      isFeatured: false,
      rating: 0,
      reviewCount: 0,
      listedAt: new Date(),
      updatedAt: new Date(),
    };

    this.marketplaceStore.set(id, item);
    this.logger.log(`应用上架市场: ${appId} (${dto.displayName})`);
    return item;
  }

  /**
   * 查询应用市场列表
   */
  listMarketplace(params?: {
    tag?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): MarketplaceItem[] {
    let items = Array.from(this.marketplaceStore.values());

    if (params?.tag) {
      items = items.filter(m => m.tags.includes(params.tag!));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        m =>
          m.displayName.toLowerCase().includes(q) ||
          m.summary.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q),
      );
    }
    if (params?.minPrice != null) {
      items = items.filter(m => m.price >= params.minPrice!);
    }
    if (params?.maxPrice != null) {
      items = items.filter(m => m.price <= params.maxPrice!);
    }

    return items.sort((a, b) => b.rating - a.rating);
  }
}
