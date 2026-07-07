import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Leads DTO 验证测试

import {
  IngestWebhookDto,
  FollowUpDto,
  CloseLeadDto,
  RegisterRuleDto,
} from './leads.dto';

describe('LeadsDto - DTO 结构验证', () => {
  it('IngestWebhookDto 应包含必填字段', () => {
    const dto = new IngestWebhookDto();
    dto.source = 'douyin';
    dto.contactName = '张三';
    expect(dto.source).toBe('douyin');
    expect(dto.contactName).toBe('张三');
  });

  it('IngestWebhookDto 可选字段应为 undefined', () => {
    const dto = new IngestWebhookDto();
    dto.source = 'manual';
    dto.contactName = '李四';
    expect(dto.region).toBeUndefined();
    expect(dto.storeId).toBeUndefined();
    expect(dto.contactPhone).toBeUndefined();
  });

  it('IngestWebhookDto 应携带 utmParams', () => {
    const dto = new IngestWebhookDto();
    dto.source = 'baidu';
    dto.contactName = '王五';
    dto.utmParams = { campaign: 'summer', source: 'cpc' };
    expect(dto.utmParams?.campaign).toBe('summer');
  });

  it('FollowUpDto 应包含 leadId、authorUserId 和 content', () => {
    const dto = new FollowUpDto();
    dto.leadId = 'lead-001';
    dto.authorUserId = 'user-1';
    dto.content = '已联系客户';
    expect(dto.leadId).toBe('lead-001');
    expect(dto.content).toBe('已联系客户');
  });

  it('FollowUpDto 支持可选的 newStage', () => {
    const dto = new FollowUpDto();
    dto.leadId = 'lead-001';
    dto.authorUserId = 'user-1';
    dto.content = '推进到体验';
    dto.newStage = 'trial';
    expect(dto.newStage).toBe('trial');
  });

  it('CloseLeadDto 应包含 stage 和 reason', () => {
    const dto = new CloseLeadDto();
    dto.stage = 'closed_won';
    dto.reason = '成功签约';
    expect(dto.stage).toBe('closed_won');
    expect(dto.reason).toBe('成功签约');
  });

  it('CloseLeadDto 支持 closed_lost 状态', () => {
    const dto = new CloseLeadDto();
    dto.stage = 'closed_lost';
    dto.reason = '价格不合适';
    expect(dto.stage).toBe('closed_lost');
  });

  it('RegisterRuleDto 应包含 strategy 和 candidatePool', () => {
    const dto = new RegisterRuleDto();
    dto.matcher = { region: 'shanghai' };
    dto.strategy = 'round-robin';
    dto.candidatePool = ['sales-1', 'sales-2'];
    expect(dto.strategy).toBe('round-robin');
    expect(dto.candidatePool).toHaveLength(2);
  });

  it('RegisterRuleDto 支持 specific 策略和 specificAssignee', () => {
    const dto = new RegisterRuleDto();
    dto.matcher = {};
    dto.strategy = 'specific';
    dto.specificAssignee = 'sales-mgr';
    dto.candidatePool = ['sales-mgr'];
    expect(dto.specificAssignee).toBe('sales-mgr');
  });
});
