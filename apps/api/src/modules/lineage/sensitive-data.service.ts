/**
 * sensitive-data.service.ts - T125-2
 * 用途: 敏感数据流 + 自动分类 + 合规任务
 *
 * 三大核心类:
 * - SensitiveDataClassifier: 敏感数据自动分类 (PII/财务/健康/联系方式)
 * - DataFlowMonitor: 数据流监控与暴露风险检测
 * - ComplianceReporter: GDPR/个人信息保护法合规报告
 */
import { Injectable, Logger } from '@nestjs/common';
import {
  isSensitiveCategory,
  iterateAllClassifications,
  filterRecordsByKey,
} from './sensitive-data-collectors';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted';

export type SensitiveCategory =
  | 'PII'           // 个人身份信息
  | 'FINANCIAL'     // 财务数据
  | 'HEALTH'        // 健康医疗数据
  | 'CONTACT'       // 联系方式
  | 'CREDENTIAL'    // 凭证密码
  | 'NONE';         // 非敏感

export interface FieldClassification {
  tableName: string;
  fieldName: string;
  category: SensitiveCategory;
  level: SensitivityLevel;
  autoClassified: boolean;
  updatedAt: Date;
}

export interface DataFlowEdge {
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  via: string; // 关联方式: foreign_key / transformation / export
  trackedAt: Date;
}

export interface ExposureRisk {
  fieldKey: string;
  exposed: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  protectedFields: string[];
}

export interface GDPRReport {
  generatedAt: Date;
  piiFields: FieldClassification[];
  dataFlows: DataFlowEdge[];
  accessRecords: AccessRecord[];
  dataSubjects: number;
  compliant: boolean;
  issues: string[];
}

export interface PIPLReport {
  generatedAt: Date;
  personalInfoFields: FieldClassification[];
  consentRecords: ConsentRecord[];
  erasureRequests: ErasureRequest[];
  compliant: boolean;
  issues: string[];
}

export interface AccessRecord {
  entity: string;
  tableName: string;
  fieldName: string;
  accessedAt: Date;
  operation: 'read' | 'write' | 'delete' | 'export';
}

export interface ConsentRecord {
  entityId: string;
  consentType: string;
  granted: boolean;
  grantedAt: Date;
}

export interface ErasureRequest {
  entityId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  fieldsErased: string[];
}

// ---------------------------------------------------------------------------
// SensitiveDataClassifier
// ---------------------------------------------------------------------------

@Injectable()
export class SensitiveDataClassifier {
  private readonly logger = new Logger(SensitiveDataClassifier.name);

  /** 内存分类存储: tableName → fieldName → FieldClassification */
  private classifications = new Map<string, Map<string, FieldClassification>>();

  /** 自动分类规则 */
  private readonly classificationRules: Array<{
    patterns: RegExp[];
    category: SensitiveCategory;
    level: SensitivityLevel;
  }> = [
    {
      patterns: [
        /phone|mobile|cell|tel/i,
        /email/i,
        /address/i,
        /name|full.?name|surname/i,
        /id_card|identity/i,
      ],
      category: 'PII',
      level: 'restricted',
    },
    {
      patterns: [
        /credit|card|cc_?num/i,
        /bank|account|iban/i,
        /salary|income|revenue/i,
        /transaction|payment/i,
      ],
      category: 'FINANCIAL',
      level: 'restricted',
    },
    {
      patterns: [
        /health|medical|diagnosis/i,
        /temperature|blood|pressure/i,
        /disease|diagnosis/i,
        /prescription|medication/i,
      ],
      category: 'HEALTH',
      level: 'restricted',
    },
    {
      patterns: [
        /wechat|weixin|qq|social/i,
        /fax|postcode|zip/i,
      ],
      category: 'CONTACT',
      level: 'confidential',
    },
    {
      patterns: [
        /password|pwd|secret/i,
        /token|api_?key|jwt/i,
        /credential/i,
      ],
      category: 'CREDENTIAL',
      level: 'restricted',
    },
  ];

  /**
   * classifyField - 自动分类字段
   * @param tableName 表名
   * @param fieldName 字段名
   * @param sampleData 示例数据（可选，用于内容级分类）
   */
  classifyField(tableName: string, fieldName: string, sampleData?: string): FieldClassification {
    const key = `${tableName}.${fieldName}`.toLowerCase();
    const fieldKey = fieldName.toLowerCase();

    let category: SensitiveCategory = 'NONE';
    let level: SensitivityLevel = 'public';

    // 1. 规则匹配
    for (const rule of this.classificationRules) {
      if (rule.patterns.some((p) => p.test(fieldKey))) {
        category = rule.category;
        level = rule.level;
        break;
      }
    }

    // 2. 示例数据模式匹配（增强分类）
    if (sampleData && category === 'NONE') {
      category = this.classifyBySampleData(sampleData);
      if (category !== 'NONE') {
        level = 'confidential';
      }
    }

    // 3. 存储分类
    if (!this.classifications.has(tableName)) {
      this.classifications.set(tableName, new Map());
    }

    const classification: FieldClassification = {
      tableName,
      fieldName,
      category,
      level,
      autoClassified: true,
      updatedAt: new Date(),
    };

    this.classifications.get(tableName)!.set(fieldName, classification);
    this.logger.debug(`Classified ${tableName}.${fieldName} as ${category}/${level}`);

    return classification;
  }

  /**
   * classifyBySampleData - 基于样本数据分类
   */
  private classifyBySampleData(sampleData: string): SensitiveCategory {
    const normalized = sampleData.trim();

    // 手机号
    if (/^1[3-9]\d{9}$/.test(normalized)) return 'CONTACT';

    // 邮箱
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return 'CONTACT';

    // 信用卡号 (13-19位数字)
    if (/^\d{13,19}$/.test(normalized)) return 'FINANCIAL';

    // 体温 (数字 + 小数点)
    if (/^\d+\.\d+$/.test(normalized) && parseFloat(normalized) >= 35 && parseFloat(normalized) <= 42) {
      return 'HEALTH';
    }

    // IP地址
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalized)) return 'CONTACT';

    return 'NONE';
  }

  /**
   * getClassification - 获取字段分类
   */
  getClassification(tableName: string, fieldName: string): FieldClassification | null {
    const tableMap = this.classifications.get(tableName);
    if (!tableMap) return null;
    return tableMap.get(fieldName) || null;
  }

  /**
   * updateClassification - 手动更新分类
   */
  updateClassification(
    tableName: string,
    fieldName: string,
    level: SensitivityLevel,
  ): FieldClassification {
    if (!this.classifications.has(tableName)) {
      this.classifications.set(tableName, new Map());
    }

    const tableMap = this.classifications.get(tableName)!;
    const existing = tableMap.get(fieldName);

    const classification: FieldClassification = {
      tableName,
      fieldName,
      category: existing?.category || 'NONE',
      level,
      autoClassified: false,
      updatedAt: new Date(),
    };

    tableMap.set(fieldName, classification);
    this.logger.log(`Manual update: ${tableName}.${fieldName} -> ${level}`);

    return classification;
  }

  /**
   * listSensitiveFields - 列出表中所有敏感字段
   */
  listSensitiveFields(tableName: string): FieldClassification[] {
    const tableMap = this.classifications.get(tableName);
    if (!tableMap) return [];

    return Array.from(tableMap.values()).filter(
      (c) => c.category !== 'NONE',
    );
  }

  /**
   * getAllClassifications - 暴露内部 Map 给合规收集 (供 ComplianceReporter 收集所有 PII/个人信息)
   * 返回内部 Map 的浅引用, 不允许外部修改
   */
  getAllClassifications(): Map<string, Map<string, FieldClassification>> {
    return this.classifications
  }
}

// ---------------------------------------------------------------------------
// DataFlowMonitor
// ---------------------------------------------------------------------------

@Injectable()
export class DataFlowMonitor {
  private readonly logger = new Logger(DataFlowMonitor.name);

  /** 数据流边存储 */
  private flows = new Map<string, DataFlowEdge[]>();

  /** 暴露告警回调 */
  private alertCallbacks: Array<(risk: ExposureRisk) => void> = [];

  /**
   * trackFlow - 追踪数据流向
   */
  trackFlow(
    fromTable: string,
    toTable: string,
    viaField: string,
    via: DataFlowEdge['via'] = 'foreign_key',
  ): DataFlowEdge {
    const flowKey = `${fromTable}:${viaField}->${toTable}`;
    const edge: DataFlowEdge = {
      fromTable,
      fromField: viaField,
      toTable,
      toField: viaField,
      via,
      trackedAt: new Date(),
    };

    if (!this.flows.has(flowKey)) {
      this.flows.set(flowKey, []);
    }
    this.flows.get(flowKey)!.push(edge);

    this.logger.debug(`Tracked flow: ${flowKey}`);
    return edge;
  }

  /**
   * getDataFlow - 获取数据流出路径
   */
  getDataFlow(fromTable: string, fieldName: string): DataFlowEdge[] {
    const flowKey = `${fromTable}:${fieldName}->`;
    const result: DataFlowEdge[] = [];

    for (const [key, edges] of this.flows.entries()) {
      if (key.startsWith(flowKey) || key.includes(`${fromTable}:`)) {
        result.push(...edges.filter((e) => e.fromField === fieldName));
      }
    }

    return result;
  }

  /**
   * detectSensitiveFieldExposure - 检测敏感字段暴露风险
   */
  detectSensitiveFieldExposure(fieldName: string): ExposureRisk {
    const fieldKey = fieldName.toLowerCase();

    // 敏感字段标识
    const sensitivePatterns = [
      /phone|mobile/i,
      /email/i,
      /address/i,
      /credit|card/i,
      /password/i,
      /health|medical/i,
    ];

    const isSensitive = sensitivePatterns.some((p) => p.test(fieldKey));

    if (!isSensitive) {
      return {
        fieldKey: fieldName,
        exposed: false,
        riskLevel: 'none',
        reason: 'Non-sensitive field',
        protectedFields: [],
      };
    }

    // 检测是否暴露（未受保护）
    const exposedPatterns = [
      /^\[.*\]$/,                    // [phone] 裸字段
      /phone_number(?!_hash|_mask)/i, // phone_number 但无保护后缀
      /email(?!_hash|_mask)/i,        // email 但无保护后缀
    ];

    const isExposed = exposedPatterns.some((p) => p.test(fieldKey));

    let riskLevel: ExposureRisk['riskLevel'] = 'low';
    if (isExposed) {
      riskLevel = fieldKey.includes('password') ? 'critical' : 'high';
    }

    return {
      fieldKey: fieldName,
      exposed: isExposed,
      riskLevel,
      reason: isExposed ? 'Field is publicly exposed without protection' : 'Field has some protection',
      protectedFields: fieldKey.includes('phone') ? ['phone_hash', 'phone_masked'] : [],
    };
  }

  /**
   * alertIfExposed - 敏感字段暴露时触发告警
   */
  alertIfExposed(sensitiveField: string): void {
    const risk = this.detectSensitiveFieldExposure(sensitiveField);

    if (risk.exposed || risk.riskLevel === 'high' || risk.riskLevel === 'critical') {
      this.logger.warn(
        `ALERT: Sensitive field exposure detected - ${sensitiveField} (${risk.riskLevel})`,
      );

      for (const callback of this.alertCallbacks) {
        try {
          callback(risk);
        } catch (err) {
          this.logger.error('Alert callback failed', err);
        }
      }
    }
  }

  /**
   * registerAlertCallback - 注册告警回调
   */
  registerAlertCallback(callback: (risk: ExposureRisk) => void): void {
    this.alertCallbacks.push(callback);
  }
}

// ---------------------------------------------------------------------------
// ComplianceReporter
// ---------------------------------------------------------------------------

@Injectable()
export class ComplianceReporter {
  private readonly logger = new Logger(ComplianceReporter.name);

  constructor(
    private readonly classifier: SensitiveDataClassifier,
    private readonly monitor: DataFlowMonitor,
  ) {}

  /** 访问记录存储 */
  private accessRecords: AccessRecord[] = [];

  /** 同意记录存储 */
  private consentRecords: ConsentRecord[] = [];

  /** 删除请求存储 */
  private erasureRequests: ErasureRequest[] = [];

  /**
   * generateGDPRReport - 生成 GDPR 合规报告
   */
  generateGDPRReport(): GDPRReport {
    const piiFields = iterateAllClassifications(
      () => this.classifier.getAllClassifications(),
      (c) => isSensitiveCategory(c.category)
    )

    // 收集所有数据流
    const allFlows: DataFlowEdge[] = []
    for (const [, edges] of (this.monitor as any)['flows'].entries()) {
      allFlows.push(...edges)
    }

    // 检查合规性
    const issues: string[] = []
    for (const field of piiFields) {
      if (field.level !== 'restricted') {
        issues.push(`${field.tableName}.${field.fieldName} 分类级别不足`)
      }
    }

    const report: GDPRReport = {
      generatedAt: new Date(),
      piiFields,
      dataFlows: allFlows,
      accessRecords: this.accessRecords,
      dataSubjects: new Set(this.accessRecords.map((r) => r.entity)).size,
      compliant: issues.length === 0,
      issues,
    }

    this.logger.log(`GDPR Report generated: ${piiFields.length} PII fields, ${issues.length} issues`)
    return report
  }

  /**
   * generatePIPLReport - 生成个人信息保护法报告
   */
  generatePIPLReport(): PIPLReport {
    const personalInfoFields = iterateAllClassifications(
      () => this.classifier.getAllClassifications(),
      (c) => c.category !== 'NONE'
    )

    // 检查合规性
    const issues: string[] = []

    // 检查是否有未授权的数据流出
    for (const [, edges] of (this.monitor as any)['flows'].entries()) {
      for (const edge of edges) {
        if (edge.via === 'export') {
          issues.push(`数据导出: ${edge.fromTable}.${edge.fromField} -> ${edge.toTable}`)
        }
      }
    }

    const report: PIPLReport = {
      generatedAt: new Date(),
      personalInfoFields,
      consentRecords: this.consentRecords,
      erasureRequests: this.erasureRequests,
      compliant: issues.length === 0,
      issues,
    }

    this.logger.log(`PIPL Report generated: ${personalInfoFields.length} fields, ${issues.length} issues`)
    return report
  }

  /**
   * auditDataAccess - 审计数据访问记录
   */
  auditDataAccess(entity: string): AccessRecord[] {
    return filterRecordsByKey(this.accessRecords, entity, 'entity')
  }

  /**
   * recordAccess - 记录数据访问
   */
  recordAccess(
    entity: string,
    tableName: string,
    fieldName: string,
    operation: AccessRecord['operation'],
  ): void {
    this.accessRecords.push({
      entity,
      tableName,
      fieldName,
      accessedAt: new Date(),
      operation,
    });
  }

  /**
   * getDataSubjectRequest - 数据主体请求处理状态
   */
  getDataSubjectRequest(entityId: string): {
    erasureRequest?: ErasureRequest;
    consentRecords: ConsentRecord[];
    accessRecords: AccessRecord[];
  } {
    const erasureRequest = this.erasureRequests.find((r) => r.entityId === entityId);
    const consentRecords = filterRecordsByKey(this.consentRecords, entityId, 'entityId');
    const accessRecords = filterRecordsByKey(this.accessRecords, entityId, 'entity');

    return {
      erasureRequest,
      consentRecords,
      accessRecords,
    };
  }

  /**
   * recordConsent - 记录同意
   */
  recordConsent(entityId: string, consentType: string, granted: boolean): void {
    this.consentRecords.push({
      entityId,
      consentType,
      granted,
      grantedAt: new Date(),
    });
  }

  /**
   * recordErasureRequest - 记录删除请求
   */
  recordErasureRequest(entityId: string): ErasureRequest {
    const request: ErasureRequest = {
      entityId,
      requestedAt: new Date(),
      status: 'pending',
      fieldsErased: [],
    };
    this.erasureRequests.push(request);
    return request;
  }
}
