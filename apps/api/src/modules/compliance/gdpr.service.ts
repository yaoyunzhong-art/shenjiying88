/**
 * gdpr.service.ts - Phase-20 T118-1
 * 用途: GDPR 合规 + 数据删除权 + 用户授权
 * 关联: phase-20-compliance/spec.md §GDPR
 *
 * 功能模块:
 * - Consent Management: 记录/查询/撤回用户同意
 * - Data Subject Rights (DSR): 访问/删除/更正/可携/限制/反对
 * - Data Deletion: 右侧记忆删除 + 匿名化保留统计
 * - Data Inventory: 个人数据字段登记与导出
 * - Retention & Expiry: 数据保留期 + 批量清理
 */
import { Injectable, Logger } from '@nestjs/common';

// ── Types ────────────────────────────────────────────────────────────────────

export type ConsentType = 'marketing' | 'analytics' | 'personalization' | 'third_party_sharing'
export type DataCategory = 'personal' | 'financial' | 'health' | 'biometric' | 'location' | 'behavioral'

export interface UserConsent {
  userId: string
  consentType: ConsentType
  granted: boolean
  grantedAt: Date
  ipAddress?: string
  userAgent?: string
  version: string  // 隐私政策版本
}

export interface DataSubjectRequest {
  id: string
  userId: string
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection'
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  requestedAt: Date
  completedAt?: Date
  responseData?: Record<string, unknown>
  rejectionReason?: string
}

export interface PersonalDataRecord {
  userId: string
  category: DataCategory
  fields: string[]  // 字段名列表
  lastUpdated: Date
  retentionExpiry?: Date
}

interface DeletionRequest {
  deletionId: string
  userId: string
  reason?: string
  status: 'pending' | 'processing' | 'completed'
  requestedAt: Date
  completedAt?: Date
  estimatedCompletion: Date
}

interface AnonymizedStats {
  userIdHash: string
  totalTransactions: number
  totalAmount: number
  lastActivityMonth: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MARKETING_CONSENT_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000  // 1 年
const DSR_DEADLINE_DAYS = 30
const DEFAULT_RETAIN_FINANCIAL_YEARS = 7

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class GDPRService {
  private readonly logger = new Logger(GDPRService.name);

  // In-memory stores
  private readonly consents = new Map<string, UserConsent[]>();           // key: `${userId}:${consentType}`
  private readonly dsrRequests = new Map<string, DataSubjectRequest>();   // key: requestId
  private readonly userDSRs = new Map<string, string[]>();                  // key: userId, value: requestId[]
  private readonly dataRecords = new Map<string, PersonalDataRecord[]>();  // key: userId
  private readonly retentionPeriods = new Map<string, Map<DataCategory, Date>>(); // key: userId
  private readonly deletionRequests = new Map<string, DeletionRequest>();  // key: deletionId
  private readonly anonymizedStats = new Map<string, AnonymizedStats>();  // key: userId
  private readonly deletedUsers = new Set<string>();                        // userIds that are deleted

  private dsrCounter = 0;
  private deletionCounter = 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // Consent Management
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 记录用户同意
   * marketing consent 每次操作需重新确认，有效期 1 年
   */
  async recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    metadata?: { ip?: string; userAgent?: string; policyVersion?: string },
  ): Promise<UserConsent> {
    const key = `${userId}:${consentType}`;
    const existing = this.consents.get(key) ?? [];

    const consent: UserConsent = {
      userId,
      consentType,
      granted,
      grantedAt: new Date(),
      ipAddress: metadata?.ip,
      userAgent: metadata?.userAgent,
      version: metadata?.policyVersion ?? '1.0',
    };

    // Replace existing consent record for this type
    const updated = existing.filter(c => c.consentType !== consentType);
    updated.push(consent);
    this.consents.set(key, updated);

    this.logger.log(`[${userId}] consent ${consentType}=${granted}`);
    return consent;
  }

  /**
   * 查询用户某类同意状态
   * 如果是 marketing，检查是否在有效期内
   * 如果 consent 被撤回（granted=false），返回 null
   */
  async getConsent(userId: string, consentType: ConsentType): Promise<UserConsent | null> {
    const key = `${userId}:${consentType}`;
    const records = this.consents.get(key) ?? [];
    const latest = records.sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime())[0];

    if (!latest) return null;

    // Withdrawn consent (granted=false) is treated as invalid
    if (!latest.granted) return null;

    // Marketing consent expires after 1 year
    if (consentType === 'marketing') {
      const elapsed = Date.now() - latest.grantedAt.getTime();
      if (elapsed > MARKETING_CONSENT_VALIDITY_MS) {
        return null; // expired
      }
    }

    return latest;
  }

  /**
   * 查询用户所有同意记录
   */
  async getAllConsents(userId: string): Promise<UserConsent[]> {
    const allConsents: UserConsent[] = [];
    for (const [key, records] of this.consents.entries()) {
      if (key.startsWith(`${userId}:`)) {
        for (const c of records) {
          // Filter expired marketing consents
          if (c.consentType === 'marketing') {
            const elapsed = Date.now() - c.grantedAt.getTime();
            if (elapsed > MARKETING_CONSENT_VALIDITY_MS) continue;
          }
          allConsents.push(c);
        }
      }
    }
    return allConsents;
  }

  /**
   * 撤回同意（marketing 可撤回，其他不可）
   * 撤回 = 重新记录 granted=false
   */
  async withdrawConsent(userId: string, consentType: ConsentType): Promise<void> {
    if (consentType !== 'marketing') {
      throw new Error(`Cannot withdraw consent type: ${consentType}. Only marketing consent is withdrawable.`);
    }

    await this.recordConsent(userId, consentType, false, {});
    this.logger.log(`[${userId}] marketing consent withdrawn`);
  }

  /**
   * 检查是否可以处理数据（所有必需 consent 已授权）
   */
  async canProcessData(userId: string, requiredConsents: ConsentType[]): Promise<boolean> {
    for (const ct of requiredConsents) {
      const consent = await this.getConsent(userId, ct);
      if (!consent || !consent.granted) {
        return false;
      }
    }
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Data Subject Rights (DSR)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 提交 DSR 请求（访问/删除/更正/可携/限制/反对）
   */
  async submitDSR(
    userId: string,
    type: DataSubjectRequest['type'],
  ): Promise<DataSubjectRequest> {
    this.dsrCounter++;
    const requestId = `dsr-${this.dsrCounter}-${Date.now()}`;

    const dsr: DataSubjectRequest = {
      id: requestId,
      userId,
      type,
      status: 'pending',
      requestedAt: new Date(),
    };

    this.dsrRequests.set(requestId, dsr);

    const userRequestIds = this.userDSRs.get(userId) ?? [];
    userRequestIds.push(requestId);
    this.userDSRs.set(userId, userRequestIds);

    this.logger.log(`[${userId}] DSR ${type} submitted: ${requestId}`);
    return dsr;
  }

  /**
   * 查询 DSR 状态
   */
  async getDSRStatus(requestId: string): Promise<DataSubjectRequest | null> {
    const dsr = this.dsrRequests.get(requestId);

    // Auto-approve if past 30 days
    if (dsr && dsr.status === 'pending') {
      const deadline = new Date(dsr.requestedAt.getTime() + DSR_DEADLINE_DAYS * 24 * 60 * 60 * 1000);
      if (new Date() > deadline) {
        dsr.status = 'completed';
        dsr.completedAt = deadline;
        dsr.responseData = { autoApproved: true, reason: 'Deadline exceeded' };
        this.dsrRequests.set(requestId, dsr);
      }
    }

    return dsr ?? null;
  }

  /**
   * 获取用户所有 DSR 请求
   */
  async listUserDSRs(userId: string): Promise<DataSubjectRequest[]> {
    const requestIds = this.userDSRs.get(userId) ?? [];
    const dsrs: DataSubjectRequest[] = [];

    for (const id of requestIds) {
      const dsr = await this.getDSRStatus(id);
      if (dsr) dsrs.push(dsr);
    }

    return dsrs;
  }

  /**
   * 处理 DSR（30天内必须完成，否则自动批准）
   */
  async processDSR(
    requestId: string,
    action: 'approve' | 'reject',
    responseData?: Record<string, unknown>,
    rejectionReason?: string,
  ): Promise<void> {
    const dsr = this.dsrRequests.get(requestId);
    if (!dsr) throw new Error(`DSR not found: ${requestId}`);
    if (dsr.status === 'completed' || dsr.status === 'rejected') {
      throw new Error(`DSR already processed: ${dsr.status}`);
    }

    dsr.status = action === 'approve' ? 'completed' : 'rejected';
    dsr.completedAt = new Date();
    dsr.responseData = responseData;

    if (action === 'reject' && rejectionReason) {
      dsr.rejectionReason = rejectionReason;
    }

    this.dsrRequests.set(requestId, dsr);
    this.logger.log(`[${dsr.userId}] DSR ${requestId} ${action}d`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Data Deletion
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 请求删除用户数据（右侧记忆删除）
   */
  async requestDataDeletion(
    userId: string,
    reason?: string,
  ): Promise<{ deletionId: string; estimatedCompletion: Date }> {
    this.deletionCounter++;
    const deletionId = `del-${this.deletionCounter}-${Date.now()}`;
    const estimatedCompletion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const request: DeletionRequest = {
      deletionId,
      userId,
      reason,
      status: 'pending',
      requestedAt: new Date(),
      estimatedCompletion,
    };

    this.deletionRequests.set(deletionId, request);
    this.logger.log(`[${userId}] deletion requested: ${deletionId}`);

    return { deletionId, estimatedCompletion };
  }

  /**
   * 查询删除状态
   */
  async getDeletionStatus(
    deletionId: string,
  ): Promise<{ status: 'pending' | 'processing' | 'completed'; completedAt?: Date }> {
    const request = this.deletionRequests.get(deletionId);
    if (!request) throw new Error(`Deletion request not found: ${deletionId}`);

    return {
      status: request.status,
      completedAt: request.completedAt,
    };
  }

  /**
   * 执行数据删除（匿名化：保留统计用假数据）
   * 保留 userId_hash + aggregated_stats
   * email/phone/address 完全删除
   */
  async executeDeletion(
    userId: string,
    options?: { retainFinancial?: boolean; retainLegal?: boolean },
  ): Promise<void> {
    const dataRecords = this.dataRecords.get(userId) ?? [];

    // Collect financial data before deletion if needed
    let totalTransactions = 0;
    let totalAmount = 0;

    if (options?.retainFinancial) {
      const financialRecords = dataRecords.filter(r => r.category === 'financial');
      for (const fr of financialRecords) {
        // Extract aggregated stats (these are anonymized)
        totalTransactions += 1;
        totalAmount += Math.random() * 1000; // Placeholder aggregation
      }
    }

    // Mark user as deleted
    this.deletedUsers.add(userId);

    // Generate anonymized stats
    const userIdHash = this.hashString(userId);
    const anonymized: AnonymizedStats = {
      userIdHash,
      totalTransactions,
      totalAmount,
      lastActivityMonth: new Date().toISOString().slice(0, 7),
    };

    this.anonymizedStats.set(userId, anonymized);

    // Clear all data records
    this.dataRecords.delete(userId);
    this.retentionPeriods.delete(userId);

    // Clear consents
    for (const key of this.consents.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.consents.delete(key);
      }
    }

    // Mark deletion as completed
    for (const [id, req] of this.deletionRequests.entries()) {
      if (req.userId === userId && req.status !== 'completed') {
        req.status = 'completed';
        req.completedAt = new Date();
        this.deletionRequests.set(id, req);
      }
    }

    this.logger.log(`[${userId}] data deleted, anonymized stats retained`);
  }

  /**
   * 检查数据是否已删除（验证）
   */
  async isDataDeleted(userId: string): Promise<boolean> {
    // Check if userId is in deleted set
    if (!this.deletedUsers.has(userId)) return false;

    // Verify PII is gone by checking data records
    const records = this.dataRecords.get(userId);
    if (records && records.length > 0) return false;

    // Verify consents are cleared
    for (const key of this.consents.keys()) {
      if (key.startsWith(`${userId}:`)) return false;
    }

    // Verify anonymized stats exist
    const stats = this.anonymizedStats.get(userId);
    return stats !== undefined;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Data Inventory
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 记录个人数据字段
   */
  registerDataField(userId: string, category: DataCategory, fields: string[]): void {
    const existing = this.dataRecords.get(userId) ?? [];
    const categoryRecord = existing.find(r => r.category === category);

    if (categoryRecord) {
      // Merge fields
      const mergedFields = [...new Set([...categoryRecord.fields, ...fields])];
      categoryRecord.fields = mergedFields;
      categoryRecord.lastUpdated = new Date();
    } else {
      existing.push({
        userId,
        category,
        fields,
        lastUpdated: new Date(),
      });
    }

    this.dataRecords.set(userId, existing);
    this.logger.log(`[${userId}] registered ${category} fields: ${fields.join(', ')}`);
  }

  /**
   * 列出用户所有个人数据字段
   */
  listDataFields(userId: string): PersonalDataRecord[] {
    return this.dataRecords.get(userId) ?? [];
  }

  /**
   * 导出用户数据（JSON格式，用于 portability）
   */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const records = this.dataRecords.get(userId) ?? [];
    const consents = await this.getAllConsents(userId);
    const dsrs = await this.listUserDSRs(userId);

    const exportData: Record<string, unknown> = {
      userId,
      exportedAt: new Date().toISOString(),
      dataCategories: {} as Record<string, unknown>,
      consents,
      dsrRequests: dsrs,
    };

    for (const record of records) {
      (exportData.dataCategories as Record<string, unknown>)[record.category] = {
        fields: record.fields,
        lastUpdated: record.lastUpdated.toISOString(),
        retentionExpiry: record.retentionExpiry?.toISOString(),
      };
    }

    return exportData;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Retention & Expiry
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 设置数据保留期
   * 如果该 category 的 data record 不存在，会自动创建
   */
  setRetentionPeriod(userId: string, category: DataCategory, expiryDate: Date): void {
    if (!this.retentionPeriods.has(userId)) {
      this.retentionPeriods.set(userId, new Map());
    }

    const userRetentions = this.retentionPeriods.get(userId)!;
    userRetentions.set(category, expiryDate);

    // Update data record with retention expiry, or create one if it doesn't exist
    const records = this.dataRecords.get(userId) ?? [];
    const record = records.find(r => r.category === category);
    if (record) {
      record.retentionExpiry = expiryDate;
    } else {
      // Auto-create data record for this category
      records.push({
        userId,
        category,
        fields: [],
        lastUpdated: new Date(),
        retentionExpiry: expiryDate,
      });
    }
    this.dataRecords.set(userId, records);

    this.logger.log(`[${userId}] ${category} retention set to ${expiryDate.toISOString()}`);
  }

  /**
   * 批量清理过期数据（保留统计用匿名化数据）
   */
  async purgeExpiredData(beforeDate: Date): Promise<number> {
    let purgedCount = 0;

    for (const [userId, records] of this.dataRecords.entries()) {
      const userRetentions = this.retentionPeriods.get(userId) ?? new Map();
      const validRecords: PersonalDataRecord[] = [];

      for (const record of records) {
        const expiry = userRetentions.get(record.category) ?? record.retentionExpiry;
        if (expiry && expiry <= beforeDate) {
          purgedCount++;
        } else {
          validRecords.push(record);
        }
      }

      if (validRecords.length !== records.length) {
        this.dataRecords.set(userId, validRecords);
      }
    }

    this.logger.log(`Purged ${purgedCount} expired data records`);
    return purgedCount;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // ── Test helpers ──
  resetForTests(): void {
    this.consents.clear();
    this.dsrRequests.clear();
    this.userDSRs.clear();
    this.dataRecords.clear();
    this.retentionPeriods.clear();
    this.deletionRequests.clear();
    this.anonymizedStats.clear();
    this.deletedUsers.clear();
    this.dsrCounter = 0;
    this.deletionCounter = 0;
  }
}
