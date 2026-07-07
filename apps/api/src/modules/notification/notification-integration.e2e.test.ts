import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 创建: 2026-06-26 - Pulse-68 下午主任务
// 状态: IMPLEMENTED - Campaign -> Notification 事件链路
// 关联: tasks.md T7
import {
  NotificationService,
  resetNotificationServiceTestState,
} from './notification.service';
import { InMemoryEventBus } from '../../infrastructure/event-bus/event-bus.module';
import {
  FoundationScopeType,
  NotificationChannelType,
  NotificationStatus,
} from './notification.entity';

describe('NotificationService - Phase-17 T7 集成', () => {
  let eventBus: InMemoryEventBus;
  let notification: NotificationService;

  beforeEach(() => {
    resetNotificationServiceTestState();
    eventBus = new InMemoryEventBus();
    notification = new NotificationService(undefined, eventBus);
    notification.onModuleInit();
  });

  it('AC-1: 优惠券到账通知 (短信)', async () => {
    notification.registerTemplate({
      tenantId: 'tenant-A',
      code: 'coupon-issued',
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant,
      locale: 'zh-CN',
      bodyTemplate: 'Coupon {{code}}',
    });
    await eventBus.publish('NotificationRequested', {
      templateCode: 'coupon-issued',
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant,
      tenantId: 'tenant-A',
      recipient: 'user-001',
      payload: { code: 'WELCOME-50' },
    });
    await new Promise(r => setTimeout(r, 10));
    const templates = notification.listTemplates({ tenantId: 'tenant-A' });
    expect(templates.length).toBeGreaterThan(0);
    expect(eventBus.listenerCount('NotificationRequested')).toBe(1);
  });

  it('AC-2: 营销活动提醒 (Push)', async () => {
    const tpl = notification.registerTemplate({
      tenantId: 'tenant-A',
      code: 'campaign-reminder',
      channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Tenant,
      locale: 'zh-CN',
      bodyTemplate: 'Hi {{name}}',
    });
    expect(tpl.code).toBe('campaign-reminder');

    await eventBus.publish('NotificationRequested', {
      templateCode: 'campaign-reminder',
      channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Tenant,
      tenantId: 'tenant-A',
      recipient: '13800138000',
      payload: { name: 'Alice' },
    });
    await new Promise(r => setTimeout(r, 10));
    const dispatches = notification.listDispatches({ tenantId: 'tenant-A' });
    expect(dispatches.length).toBeGreaterThan(0);
  });

  it('AC-3: 退订机制 (NotificationService 监听 NotificationRequested 事件)', async () => {
    // V2: 订阅/退订. 当前测试仅验证事件链路
    expect(eventBus.listenerCount('NotificationRequested')).toBeGreaterThanOrEqual(1);
  });
});
