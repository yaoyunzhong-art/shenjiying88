import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * sensitive-data.test.ts - T125-2
 * 用途: 敏感数据流 + 自动分类 + 合规任务测试
 *
 * 16 tests 覆盖:
 * - AC-1..3: 自动分类 (手机号→PII, 信用卡号→财务, 体温→健康)
 * - AC-4..5: 敏感字段识别
 * - AC-6..8: 数据流向追踪
 * - AC-9..11: 暴露检测
 * - AC-12..14: GDPR 报告
 * - AC-15..16: PIPL 报告
 */
import { SensitiveDataClassifier, SensitiveDataClassifier as Classifier } from './sensitive-data.service';
import {
  SensitiveDataClassifier as ClassifierClass,
  DataFlowMonitor,
  ComplianceReporter,
  FieldClassification,
} from './sensitive-data.service';

describe('SensitiveDataClassifier · T125-2', () => {
  let classifier: ClassifierClass;

  beforeEach(() => {
    classifier = new ClassifierClass();
  });

  // AC-1: 手机号自动分类为 PII
  it('AC-1 auto-classify phone number as PII', () => {
    const result = classifier.classifyField('users', 'phone_number');
    expect(result.category).toBe('PII');
    expect(result.level).toBe('restricted');
    expect(result.autoClassified).toBe(true);
  });

  // AC-2: 信用卡号自动分类为财务
  it('AC-2 auto-classify credit card as FINANCIAL', () => {
    const result = classifier.classifyField('payments', 'credit_card_number');
    expect(result.category).toBe('FINANCIAL');
    expect(result.level).toBe('restricted');
    expect(result.autoClassified).toBe(true);
  });

  // AC-3: 体温自动分类为健康
  it('AC-3 auto-classify temperature as HEALTH', () => {
    // 通过样本数据分类
    const result = classifier.classifyField('health_logs', 'temperature', '36.5');
    expect(result.category).toBe('HEALTH');
    expect(result.level).toBe('restricted');
    expect(result.autoClassified).toBe(true);
  });

  // AC-4: 获取已分类字段
  it('AC-4 get classification for classified field', () => {
    classifier.classifyField('users', 'email_address');
    const result = classifier.getClassification('users', 'email_address');
    expect(result).not.toBeNull();
    expect(result!.category).toBe('PII');
  });

  // AC-5: 列出表中所有敏感字段
  it('AC-5 list all sensitive fields in table', () => {
    classifier.classifyField('users', 'email_address');
    classifier.classifyField('users', 'phone_number');
    classifier.classifyField('users', 'name');
    classifier.classifyField('users', 'created_at'); // 非敏感

    const sensitiveFields = classifier.listSensitiveFields('users');
    expect(sensitiveFields.length).toBe(3);
    expect(sensitiveFields.every((f) => f.category !== 'NONE')).toBe(true);
  });

  // AC-6: 手动更新分类级别
  it('AC-6 manually update classification level', () => {
    classifier.classifyField('users', 'name');
    const result = classifier.updateClassification('users', 'name', 'restricted');
    expect(result.level).toBe('restricted');
    expect(result.autoClassified).toBe(false);
  });

  // AC-7: 未分类字段返回 null
  it('AC-7 unclassified field returns null', () => {
    const result = classifier.getClassification('users', 'non_existent_field');
    expect(result).toBeNull();
  });
});

describe('DataFlowMonitor · T125-2', () => {
  let monitor: DataFlowMonitor;

  beforeEach(() => {
    monitor = new DataFlowMonitor();
  });

  // AC-8: 追踪数据流向 A -> B
  it('AC-8 track data flow from A to B', () => {
    const flow = monitor.trackFlow('orders', 'order_items', 'order_id', 'foreign_key');
    expect(flow.fromTable).toBe('orders');
    expect(flow.toTable).toBe('order_items');
    expect(flow.via).toBe('foreign_key');
  });

  // AC-9: 获取数据流出路径
  it('AC-9 get data flow path', () => {
    monitor.trackFlow('users', 'profiles', 'user_id', 'foreign_key');
    monitor.trackFlow('profiles', 'audit_logs', 'profile_id', 'foreign_key');

    const flows = monitor.getDataFlow('users', 'user_id');
    expect(flows.length).toBeGreaterThan(0);
    expect(flows.some((f) => f.fromTable === 'users' && f.fromField === 'user_id')).toBe(true);
  });

  // AC-10: 检测敏感字段暴露风险
  it('AC-10 detect sensitive field exposure risk', () => {
    const risk = monitor.detectSensitiveFieldExposure('phone_number');
    expect(risk.riskLevel).toBe('high');
    expect(risk.exposed).toBe(true);
  });

  // AC-11: 未受保护的电话号码字段被标记为暴露
  it('AC-11 unprotected phone field is marked as exposed', () => {
    const risk = monitor.detectSensitiveFieldExposure('[phone]');
    expect(risk.exposed).toBe(true);
    expect(risk.riskLevel).toBe('high');
  });

  // AC-12: 非敏感字段无暴露风险
  it('AC-12 non-sensitive field has no exposure risk', () => {
    const risk = monitor.detectSensitiveFieldExposure('product_name');
    expect(risk.exposed).toBe(false);
    expect(risk.riskLevel).toBe('none');
  });

  // AC-13: 告警回调触发
  it('AC-13 alert callback is triggered on exposure', () => {
    let alertTriggered = false;
    let receivedRisk = null;

    monitor.registerAlertCallback((risk) => {
      alertTriggered = true;
      receivedRisk = risk;
    });

    monitor.alertIfExposed('phone_number');
    expect(alertTriggered).toBe(true);
    expect(receivedRisk).not.toBeNull();
    expect(receivedRisk!.riskLevel).toBe('high');
  });
});

describe('ComplianceReporter · T125-2', () => {
  let classifier: ClassifierClass;
  let monitor: DataFlowMonitor;
  let reporter: ComplianceReporter;

  beforeEach(() => {
    classifier = new ClassifierClass();
    monitor = new DataFlowMonitor();
    reporter = new ComplianceReporter(classifier, monitor);
  });

  // AC-14: GDPR 报告包含所有 PII 字段访问记录
  it('AC-14 GDPR report contains all PII field access records', () => {
    // 分类 PII 字段
    classifier.classifyField('users', 'email');
    classifier.classifyField('users', 'phone');
    classifier.classifyField('payments', 'credit_card');

    // 记录访问
    reporter.recordAccess('user_1', 'users', 'email', 'read');
    reporter.recordAccess('user_1', 'users', 'phone', 'read');
    reporter.recordAccess('admin_1', 'payments', 'credit_card', 'read');

    const report = reporter.generateGDPRReport();

    expect(report.piiFields.length).toBe(3);
    expect(report.accessRecords.length).toBe(3);
    expect(report.dataSubjects).toBe(2); // user_1, admin_1
  });

  // AC-15: GDPR 报告合规性检查
  it('AC-15 GDPR report compliance check', () => {
    // 分类但级别不足
    classifier.classifyField('users', 'email');
    classifier.updateClassification('users', 'email', 'internal'); // 级别不足

    const report = reporter.generateGDPRReport();
    expect(report.compliant).toBe(false);
    expect(report.issues.length).toBeGreaterThan(0);
  });

  // AC-16: 数据主体请求处理状态
  it('AC-16 data subject request status', () => {
    reporter.recordConsent('entity_123', 'marketing', true);
    reporter.recordAccess('entity_123', 'users', 'email', 'read');

    const erasureRequest = reporter.recordErasureRequest('entity_123');

    const status = reporter.getDataSubjectRequest('entity_123');

    expect(status.consentRecords.length).toBe(1);
    expect(status.accessRecords.length).toBe(1);
    expect(status.erasureRequest).not.toBeUndefined();
    expect(status.erasureRequest!.status).toBe('pending');
  });
});
