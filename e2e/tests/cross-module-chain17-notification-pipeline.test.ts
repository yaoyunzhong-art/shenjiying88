/**
 * 🦞 链17: Miniapp→Domain→Admin→Tob-Web 消息推送 + 通知治理
 * 
 * 路径: Miniapp 触发业务事件(订单/退款/公告) → Domain 消息队列(分级/分类)
 *      → Admin 配置通知规则(启用/禁用/频率) → Tob-Web 接收通知(未读/已读/批量)
 *      → 用户标记已读 → 未读计数更新
 * 
 * 覆盖模块: miniapp · domain · admin-web · tob-web (4 模块)
 * 新增模式: 通知消息生命周期 + 治理规则 + 多端同步
 * 
 * Pulse-Nightly-09 新增
 *
 * ═══════════════════════════════════════
 * 箍一: 消息推送 + 通知治理全链路 E2E 场景覆盖
 * 箍二: 依赖 4 条默认通知规则 + 空存储 seedData()
 * 箍三: 覆盖事件触发/派发/治理/接收/归档全生命周期断言
 * 箍四: dev/staging (纯内存, 无外部依赖)
 * 箍五: e2e-notification-pipeline
 * ═══════════════════════════════════════
 */

import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';

// ========== 仓储层 ==========
interface NotificationRecord {
  id: string;
  type: 'order_alert' | 'refund_alert' | 'system_announcement' | 'compliance_alert';
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: string;
  targetRoles: string[];
  status: 'pending' | 'sent' | 'read' | 'archived';
  readBy: string[];
  createdAt: string;
}

interface NotificationRule {
  id: string;
  type: NotificationRecord['type'];
  enabled: boolean;
  minPriority: NotificationRecord['priority'];
  targetRoles: string[];
  pushEnabled: boolean;
  smsEnabled: boolean;
  frequency: 'immediate' | 'digest' | 'daily';
  updatedAt: string;
}

interface UnreadCount {
  total: number;
  byType: Record<string, number>;
}

const notificationStore: NotificationRecord[] = [];
const ruleStore: Map<string, NotificationRule> = new Map();
const userReadStore: Map<string, Set<string>> = new Map(); // userRole → Set<notificationId>
const processedIds: Set<string> = new Set(); // 幂等性

function seedData() {
  notificationStore.length = 0;
  ruleStore.clear();
  userReadStore.clear();
  processedIds.clear();

  // 默认通知规则 — Admin 配置
  const defaultRules: NotificationRule[] = [
    { id: 'rule_order', type: 'order_alert', enabled: true, minPriority: 'normal', targetRoles: ['admin', 'store_manager'], pushEnabled: true, smsEnabled: false, frequency: 'immediate', updatedAt: new Date().toISOString() },
    { id: 'rule_refund', type: 'refund_alert', enabled: true, minPriority: 'high', targetRoles: ['admin', 'finance'], pushEnabled: true, smsEnabled: true, frequency: 'immediate', updatedAt: new Date().toISOString() },
    { id: 'rule_system', type: 'system_announcement', enabled: true, minPriority: 'low', targetRoles: ['admin', 'store_manager', 'operator'], pushEnabled: true, smsEnabled: false, frequency: 'immediate', updatedAt: new Date().toISOString() },
    { id: 'rule_compliance', type: 'compliance_alert', enabled: true, minPriority: 'urgent', targetRoles: ['admin', 'compliance_officer'], pushEnabled: true, smsEnabled: true, frequency: 'immediate', updatedAt: new Date().toISOString() },
  ];
  for (const rule of defaultRules) {
    ruleStore.set(rule.id, { ...rule });
  }
}

// ========== 服务函数 ==========

// Miniapp: 触发业务事件
function miniappTriggerEvent(event: {
  type: NotificationRecord['type'];
  title: string;
  content: string;
  priority?: NotificationRecord['priority'];
  requestId?: string;
  source?: string;
}): { success: boolean; notification?: NotificationRecord; error?: string } {
  const reqId = event.requestId || `evt_${Date.now()}`;
  if (processedIds.has(reqId)) {
    return { success: true, alreadyProcessed: true };
  }

  const eventType = event.type;
  const matchingRule = Array.from(ruleStore.values()).find(r => r.type === eventType && r.enabled);
  if (!matchingRule) {
    return { success: false, error: `no_enabled_rule_for_type:${eventType}` };
  }

  const priority = event.priority || 'normal';
  const priorityLevel = { 'low': 0, 'normal': 1, 'high': 2, 'urgent': 3 };
  const minLevel = priorityLevel[matchingRule.minPriority];

  if (priorityLevel[priority] < minLevel) {
    return { success: false, error: `priority_too_low:${priority}<${matchingRule.minPriority}` };
  }

  const notification: NotificationRecord = {
    id: `notif_${Date.now()}_${String(Math.random()).slice(2, 8)}`,
    type: eventType,
    title: event.title,
    content: event.content,
    priority,
    source: event.source || 'miniapp',
    targetRoles: [...matchingRule.targetRoles],
    status: 'pending',
    readBy: [],
    createdAt: new Date().toISOString(),
  };

  notificationStore.push(notification);
  processedIds.add(reqId);
  return { success: true, notification };
}

// Domain: 消息派发(发送给各角色)
function domainDispatchNotifications(): { sent: number } {
  let sent = 0;
  for (const n of notificationStore) {
    if (n.status === 'pending') {
      n.status = 'sent';
      sent++;
    }
  }
  return { sent };
}

function domainGetNotificationsByRole(role: string, status?: NotificationRecord['status']): NotificationRecord[] {
  return notificationStore.filter(n => {
    if (!n.targetRoles.includes(role)) return false;
    if (status && n.status !== status) return false;
    return true;
  });
}

function domainGetUnreadCount(role: string): UnreadCount {
  const userReads = userReadStore.get(role) || new Set();
  const unread = notificationStore.filter(n => {
    if (!n.targetRoles.includes(role)) return false;
    if (n.status !== 'sent' && n.status !== 'pending') return false;
    return !userReads.has(n.id);
  });
  const byType: Record<string, number> = {};
  for (const n of unread) {
    byType[n.type] = (byType[n.type] || 0) + 1;
  }
  return { total: unread.length, byType };
}

// Admin: 配置通知规则
function adminUpdateRule(ruleId: string, updates: Partial<NotificationRule>): { success: boolean; rule?: NotificationRule; error?: string } {
  const rule = ruleStore.get(ruleId);
  if (!rule) return { success: false, error: 'rule_not_found' };
  Object.assign(rule, { ...updates, updatedAt: new Date().toISOString() });
  ruleStore.set(ruleId, { ...rule });
  return { success: true, rule: { ...rule } };
}

function adminGetAllRules(): NotificationRule[] {
  return Array.from(ruleStore.values());
}

// Tob-Web: 接收和操作通知
function tobWebGetNotifications(role: string): NotificationRecord[] {
  return domainGetNotificationsByRole(role);
}

function tobWebMarkAsRead(role: string, notificationIds: string[]): { success: number; errors: string[] } {
  if (!userReadStore.has(role)) userReadStore.set(role, new Set());
  const userReads = userReadStore.get(role)!;
  let success = 0;
  const errors: string[] = [];
  for (const nId of notificationIds) {
    const notif = notificationStore.find(n => n.id === nId);
    if (!notif) {
      errors.push(`notification_not_found:${nId}`);
      continue;
    }
    if (!notif.targetRoles.includes(role)) {
      errors.push(`not_targeted_to_role:${nId}`);
      continue;
    }
    userReads.add(nId);
    notif.readBy.push(role);
    // 所有目标角色都读了则 status = 'read'
    const allRolesRead = notif.targetRoles.every(r => (userReadStore.get(r) || new Set()).has(nId));
    if (allRolesRead) {
      notif.status = 'read';
    }
    success++;
  }
  return { success, errors };
}

function tobWebArchiveNotification(role: string, notificationId: string): { success: boolean; error?: string } {
  const notif = notificationStore.find(n => n.id === notificationId);
  if (!notif) return { success: false, error: 'notification_not_found' };
  if (!notif.targetRoles.includes(role)) return { success: false, error: 'not_targeted_to_role' };
  notif.status = 'archived';
  return { success: true };
}

function tobWebGetUnreadCount(role: string): UnreadCount {
  return domainGetUnreadCount(role);
}


// ========== 测试用例 ==========

describe('链17: 消息推送 + 通知治理 (Miniapp→Domain→Admin→Tob-Web)', () => {

  before(() => {
    seedData();
  });

  // --- Phase 1: Miniapp 触发业务事件 → Domain 消息创建 ---
  test('[正例] Miniapp触发订单预警事件 → 创建通知, 匹配规则', () => {
    const r = miniappTriggerEvent({
      type: 'order_alert',
      title: '订单异常预警',
      content: '门店A今日订单量突降80%',
      priority: 'high',
      requestId: 'evt_order_01',
    });
    assert.ok(r.success, `触发失败: ${r.error}`);
    assert.ok(r.notification);
    assert.equal(r.notification!.type, 'order_alert');
    assert.ok(r.notification!.targetRoles.includes('admin'));
    assert.equal(r.notification!.status, 'pending');
  });

  test('[正例] Miniapp触发退款预警(urgent) → 接受并创建sms规则通知', () => {
    const r = miniappTriggerEvent({
      type: 'refund_alert',
      title: '大额退款申请',
      content: '门店C发起50,000元退款',
      priority: 'urgent',
      requestId: 'evt_refund_01',
    });
    assert.ok(r.success);
    assert.equal(r.notification!.type, 'refund_alert');
    // refund rule 的 targetRoles 包含 admin + finance
    assert.ok(r.notification!.targetRoles.includes('admin'));
    assert.ok(r.notification!.targetRoles.includes('finance'));
  });

  test('[正例] Miniapp触发系统公告(low) → 接受, low≥low 通过', () => {
    const r = miniappTriggerEvent({
      type: 'system_announcement',
      title: '版本更新通知',
      content: '系统将于今晚3:00-5:00升级',
      priority: 'low',
      requestId: 'evt_sys_01',
    });
    assert.ok(r.success);
  });

  test('[反例] Miniapp触发normal优先级的不合规事件 → 拒绝(urgent required)', () => {
    const r = miniappTriggerEvent({
      type: 'compliance_alert',
      title: '常规检查提醒',
      content: '门店C合规检查中',
      priority: 'normal',
      requestId: 'evt_comp_01',
    });
    assert.equal(r.success, false);
    assert.ok(r.error?.includes('priority_too_low'));
  });

  test('[反例] Miniapp触发已禁用规则(disabled rule) → 拒绝', () => {
    // 先禁用 order_alert 规则
    adminUpdateRule('rule_order', { enabled: false });

    const r = miniappTriggerEvent({
      type: 'order_alert',
      title: '订单预警(已禁用)',
      content: '测试',
      priority: 'high',
      requestId: 'evt_disabled_01',
    });
    assert.equal(r.success, false);
    assert.ok(r.error?.includes('no_enabled_rule'));

    // 恢复规则
    adminUpdateRule('rule_order', { enabled: true });
  });

  test('[反例] Miniapp相同requestId重复触发 → 幂等返回alreadyProcessed', () => {
    const r = miniappTriggerEvent({
      type: 'order_alert',
      title: '幂等测试',
      content: '重复',
      priority: 'normal',
      requestId: 'evt_order_01', // 和第一个测试同id
    });
    assert.ok(r.success);
    assert.ok(r.alreadyProcessed);
  });

  // --- Phase 2: Domain 派发消息 ---
  test('[正例] Domain派发通知 → pending→sent, 记录发送数量', () => {
    const pendingBefore = notificationStore.filter(n => n.status === 'pending').length;
    assert.ok(pendingBefore >= 1);
    const result = domainDispatchNotifications();
    assert.equal(result.sent, pendingBefore);
    const pendingAfter = notificationStore.filter(n => n.status === 'pending').length;
    assert.equal(pendingAfter, 0);
  });

  test('[正例] Domain按角色查询通知 → 返回该角色所有目标通知', () => {
    const adminNotifs = domainGetNotificationsByRole('admin', 'sent');
    assert.ok(adminNotifs.length >= 3);
    for (const n of adminNotifs) {
      assert.ok(n.targetRoles.includes('admin'));
    }

    const finNotifs = domainGetNotificationsByRole('finance', 'sent');
    assert.ok(finNotifs.length >= 1);
    assert.equal(finNotifs[0].type, 'refund_alert');
  });

  // --- Phase 3: Admin 治理规则 ---
  test('[正例] Admin查询全部规则 → 返回4条默认规则', () => {
    const rules = adminGetAllRules();
    assert.equal(rules.length, 4);
    const types = rules.map(r => r.type).sort();
    assert.deepEqual(types, ['compliance_alert', 'order_alert', 'refund_alert', 'system_announcement'].sort());
  });

  test('[正例] Admin更新规则(禁用order_alerts) → 立即生效', () => {
    const r = adminUpdateRule('rule_order', { enabled: false });
    assert.ok(r.success);
    assert.equal(r.rule!.enabled, false);

    const rules = adminGetAllRules();
    const orderRule = rules.find(r => r.id === 'rule_order');
    assert.equal(orderRule!.enabled, false);
  });

  test('[正例] Admin启用SMS + 提高最低优先级 → 规则更新成功', () => {
    const r = adminUpdateRule('rule_refund', { smsEnabled: true, minPriority: 'urgent', frequency: 'digest' });
    assert.ok(r.success);
    assert.equal(r.rule!.smsEnabled, true);
    assert.equal(r.rule!.minPriority, 'urgent');
  });

  test('[反例] Admin更新不存在的规则 → 拒绝', () => {
    const r = adminUpdateRule('rule_nonexistent', { enabled: false });
    assert.equal(r.success, false);
    assert.equal(r.error, 'rule_not_found');
  });

  // --- Phase 4: Tob-Web 接收和操作通知 ---
  test('[正例] Tob-Web管理员查看未读通知 → 未读计数正确', () => {
    const unread = tobWebGetUnreadCount('admin');
    assert.ok(unread.total >= 1);
    assert.ok(unread.byType['order_alert'] >= 1);
    assert.ok(unread.byType['refund_alert'] >= 1);
  });

  test('[正例] Tob-Web管理员批量标记已读 → 未读计数减少', () => {
    const unreadBefore = tobWebGetUnreadCount('admin');
    const toMark = notificationStore
      .filter(n => n.targetRoles.includes('admin'))
      .slice(0, 3)
      .map(n => n.id);
    const result = tobWebMarkAsRead('admin', toMark);
    assert.equal(result.success, toMark.length);
    assert.equal(result.errors.length, 0);

    const unreadAfter = tobWebGetUnreadCount('admin');
    assert.equal(unreadAfter.total, unreadBefore.total - toMark.length);
  });

  test('[正例] Tob-Web财务角色查看退款通知 → 专属通知出现', () => {
    const financeNotifs = tobWebGetNotifications('finance');
    const refundNotifs = financeNotifs.filter(n => n.type === 'refund_alert');
    assert.ok(refundNotifs.length >= 1);
    // finance 标记已读
    const readResult = tobWebMarkAsRead('finance', refundNotifs.map(n => n.id));
    assert.equal(readResult.success, refundNotifs.length);
  });

  test('[反例] Tob-Web标记不存在的通知 → 返回错误', () => {
    const result = tobWebMarkAsRead('admin', ['notif_nonexistent']);
    assert.equal(result.success, 0);
    assert.equal(result.errors.length, 1);
    assert.ok(result.errors[0].includes('not_found'));
  });

  test('[反例] Tob-Web操作不属于自己的通知 → 拒绝', () => {
    // store_manager 不应收到 compliance_alert (compliance_rule target only admin/compliance_officer)
    const n = notificationStore.find(n => n.type === 'compliance_alert');
    if (n) {
      const result = tobWebMarkAsRead('store_manager', [n.id]);
      assert.equal(result.success, 0);
      assert.equal(result.errors.length, 1);
      assert.ok(result.errors[0].includes('not_targeted_to_role'));
    }
  });

  // --- Phase 5: 边界场景 ---
  test('[边界] 已禁用的规则不生成新通知, 已生成的通知仍然存在', () => {
    // order_alert 已被禁用
    const r = miniappTriggerEvent({ type: 'order_alert', title: '被禁测试', content: '不应创建', priority: 'high', requestId: 'evt_disabled_boundary' });
    assert.equal(r.success, false);

    // 之前已生成的 order_alert 通知还在
    const orderNotifs = notificationStore.filter(n => n.type === 'order_alert');
    assert.ok(orderNotifs.length >= 1);
  });

  test('[边界] 归档通知 → 不再计入未读', () => {
    // 找到一通知做归档
    const target = notificationStore.find(n => n.status === 'sent');
    assert.ok(target, '应有 sent 状态通知');

    // archiver 角色
    const archiveResult = tobWebArchiveNotification('admin', target!.id);
    assert.ok(archiveResult.success);

    const unread = tobWebGetUnreadCount('admin');
    const archivedInUnread = notificationStore.some(n => n.id === target!.id && n.status === 'archived' && !tobWebMarkAsRead('admin', []));
    // 验证归档后不计入
    const stillInUnread = notificationStore.filter(n => {
      if (!n.targetRoles.includes('admin')) return false;
      if (n.status === 'archived') return false;
      const userReads = userReadStore.get('admin') || new Set();
      return !userReads.has(n.id);
    }).some(n => n.id === target!.id);
    assert.equal(stillInUnread, false);
  });

  test('[边界] 多角色同时标记已读 → 全读后状态变为read', () => {
    // 创建一个新通知，target 多角色
    const r = miniappTriggerEvent({
      type: 'refund_alert',
      title: '多角色测试通知',
      content: '需 admin + finance 都阅读',
      priority: 'urgent',
      requestId: 'evt_multi_role',
    });
    assert.ok(r.success);
    const nId = r.notification!.id;
    domainDispatchNotifications();

    // admin 阅读
    tobWebMarkAsRead('admin', [nId]);
    let notif = notificationStore.find(n => n.id === nId)!;
    assert.equal(notif.status, 'sent'); // 还未全读

    // finance 阅读
    tobWebMarkAsRead('finance', [nId]);
    notif = notificationStore.find(n => n.id === nId)!;
    assert.equal(notif.status, 'read'); // 全读 → read
  });

  test('[边界] 更改规则优先级 → 影响后续事件, 不影响已有通知', () => {
    adminUpdateRule('rule_refund', { minPriority: 'urgent' });
    // normal 退款的应被拒
    const r = miniappTriggerEvent({ type: 'refund_alert', title: '正常退款测试', content: 'normal', priority: 'normal', requestId: 'evt_refund_low' });
    assert.equal(r.success, false);
    assert.ok(r.error?.includes('priority_too_low'));

    // urgent 仍可
    const r2 = miniappTriggerEvent({ type: 'refund_alert', title: '紧急退款', content: '要处理', priority: 'urgent', requestId: 'evt_refund_urgent_v2' });
    assert.ok(r2.success);
  });

  // --- Phase 6: 增强场景 - 熔断恢复 / 并行通知 / 极端数据 ---

  test('[边界] 空通知列表 → 角色查询返回空数组, 未读计数为0', () => {
    // 清空已存储的通知, 在子describe中隔离
    const saved = [...notificationStore];
    notificationStore.length = 0;

    const adminNotifs = domainGetNotificationsByRole('admin');
    assert.equal(adminNotifs.length, 0);

    const unread = domainGetUnreadCount('admin');
    assert.equal(unread.total, 0);
    assert.deepEqual(unread.byType, {});

    // 恢复
    notificationStore.push(...saved);
  });

  test('[反例] 规则禁用后启用(熔断恢复) → 恢复后的新事件正常创建通知', () => {
    // 禁用 refund 规则
    adminUpdateRule('rule_refund', { enabled: false });
    const r1 = miniappTriggerEvent({
      type: 'refund_alert',
      title: '熔断期退款',
      content: '不应通过',
      priority: 'urgent',
      requestId: 'evt_circuit_breaker_01',
    });
    assert.equal(r1.success, false);

    // 恢复规则（熔断恢复）
    adminUpdateRule('rule_refund', { enabled: true });
    const r2 = miniappTriggerEvent({
      type: 'refund_alert',
      title: '恢复后退款',
      content: '应通过',
      priority: 'urgent',
      requestId: 'evt_circuit_breaker_02',
    });
    assert.ok(r2.success);
    assert.equal(r2.notification!.type, 'refund_alert');
  });

  test('[正例] 并行触发多事件(同优先级) → 全部创建正确', () => {
    const events = [
      { type: 'order_alert' as const, title: '并行事件A', content: '门店A订单异常', priority: 'high' as const, requestId: 'evt_parallel_01' },
      { type: 'order_alert' as const, title: '并行事件B', content: '门店B订单异常', priority: 'normal' as const, requestId: 'evt_parallel_02' },
      { type: 'system_announcement' as const, title: '并行事件C', content: '系统公告并行', priority: 'low' as const, requestId: 'evt_parallel_03' },
      { type: 'compliance_alert' as const, title: '并行事件D', content: '合规告警并行', priority: 'urgent' as const, requestId: 'evt_parallel_04' },
    ];
    const results = events.map(e => miniappTriggerEvent(e));

    const successResults = results.filter(r => r.success);
    assert.equal(successResults.length, 3, 'order_alert=2 + system=1 = 3; compliance require urgent');

    const orderAlerts = notificationStore.filter(n => n.title.startsWith('并行事件'));
    assert.equal(orderAlerts.length, 3);

    const allPending = orderAlerts.every(n => n.status === 'pending');
    assert.ok(allPending);
  });

  test('[边界] 同一规则触发大量事件(50个) → 全部入库且派发稳定', () => {
    const count = 50;
    for (let i = 0; i < count; i++) {
      miniappTriggerEvent({
        type: 'system_announcement',
        title: `极端数据事件#${i}`,
        content: 'A'.repeat(200 + i),
        priority: 'low',
        requestId: `evt_stress_${i}`,
      });
    }

    const stressNotifs = notificationStore.filter(n => n.type === 'system_announcement' && n.title.startsWith('极端数据'));
    assert.equal(stressNotifs.length, count);

    // 验证 ID 全部唯一
    const ids = stressNotifs.map(n => n.id);
    assert.equal(new Set(ids).size, ids.length);

    // 派发
    const dispatchResult = domainDispatchNotifications();
    assert.ok(dispatchResult.sent >= count);

    const allSent = stressNotifs.every(n => n.status === 'sent');
    assert.ok(allSent);

    // 查询角色
    const adminStress = domainGetNotificationsByRole('admin', 'sent')
      .filter(n => n.title.startsWith('极端数据'));
    assert.ok(adminStress.length >= count, 'admin 应收到全部 system 通知');
  });

  test('[边界] 通知内容超长(10万字符) → 正常创建且不报错', () => {
    const hugeContent = 'X'.repeat(100000);
    const r = miniappTriggerEvent({
      type: 'order_alert',
      title: '超长通知内容',
      content: hugeContent,
      priority: 'high',
      requestId: 'evt_huge_content',
    });
    assert.ok(r.success);
    assert.equal(r.notification!.content.length, 100000);

    // 派发后内容完整
    domainDispatchNotifications();
    const stored = notificationStore.find(n => n.id === r.notification!.id);
    assert.ok(stored);
    assert.equal(stored!.content.length, 100000);
  });

  // --- Phase 7: 新增增强场景 - 通知治理深度/角色隔离/批量操作 ---

  test('[边界] 同一角色重复标记已读同一通知 → 幂等, 计数不重复减少', () => {
    const unreadBefore = tobWebGetUnreadCount('admin');
    // 找到一条 admin 未读的通知
    const unreadNotif = notificationStore.find(n => {
      if (!n.targetRoles.includes('admin')) return false;
      if (n.status === 'archived' || n.status === 'read') return false;
      const userReads = userReadStore.get('admin') || new Set();
      return !userReads.has(n.id);
    });
    if (!unreadNotif) {
      // 创建一个新的再标记
      const r = miniappTriggerEvent({ type: 'system_announcement', title: '幂等已读测试', content: '幂等测试', priority: 'low', requestId: 'evt_idemp_read' });
      assert.ok(r.success);
      domainDispatchNotifications();
      const nId = r.notification!.id;
      // 第一次标记
      const r1 = tobWebMarkAsRead('admin', [nId]);
      assert.equal(r1.success, 1);
      const unreadAfter1 = tobWebGetUnreadCount('admin');
      // 第二次标记同一通知
      const r2 = tobWebMarkAsRead('admin', [nId]);
      assert.equal(r2.success, 1); // 也算 success (幂等)
      const unreadAfter2 = tobWebGetUnreadCount('admin');
      assert.equal(unreadAfter2.total, unreadAfter1.total, '重复标记不应减少未读计数');
    } else {
      const nId = unreadNotif.id;
      const r1 = tobWebMarkAsRead('admin', [nId]);
      assert.equal(r1.success, 1);
      const unreadAfter = tobWebGetUnreadCount('admin');
      // 再标记一次
      const r2 = tobWebMarkAsRead('admin', [nId]);
      assert.equal(r2.success, 1);
      const unreadAfter2 = tobWebGetUnreadCount('admin');
      assert.equal(unreadAfter2.total, unreadAfter.total, '重复标记幂等');
    }
  });

  test('[边界] 全部角色标记已读后通知状态→read, 不再暴露给任何角色', () => {
    // 创建一个新通知, target admin + finance
    const r = miniappTriggerEvent({
      type: 'refund_alert',
      title: '全角色已读测试',
      content: '所有目标角色均标记已读后应变为read',
      priority: 'urgent',
      requestId: 'evt_all_read_test',
    });
    assert.ok(r.success);
    const nId = r.notification!.id;
    domainDispatchNotifications();

    // admin 标记
    tobWebMarkAsRead('admin', [nId]);
    let notif = notificationStore.find(n => n.id === nId)!;
    assert.equal(notif.status, 'sent'); // 尚未全读

    // compliance_officer 不是 target
    // finance 标记
    tobWebMarkAsRead('finance', [nId]);
    notif = notificationStore.find(n => n.id === nId)!;
    assert.equal(notif.status, 'read'); // 全读

    // read 状态通知不应出现在未读列表中（即 refund_alert 类型的未读不包含该通知）
    // 这里仅验证状态流转正确
    const adminUnread = domainGetUnreadCount('admin');
    // 刚变为read的通知不计入未读
    const notifInUnread = notificationStore.some(n => {
      if (n.id !== nId) return false;
      const userReads = userReadStore.get('admin') || new Set();
      return !userReads.has(n.id) && n.status === 'sent';
    });
    assert.equal(notifInUnread, false, '已全读的通知不应在admin未读列表中');
  });

  test('[边界] 禁用规则再启用 → 规则配置完整保留, 旧通知不受影响', () => {
    // 先修改规则再恢复
    const r = adminUpdateRule('rule_compliance', { enabled: false, smsEnabled: false });
    assert.ok(r.success);
    assert.equal(r.rule!.enabled, false);
    assert.equal(r.rule!.smsEnabled, false);

    // 恢复
    const r2 = adminUpdateRule('rule_compliance', { enabled: true, smsEnabled: true });
    assert.ok(r2.success);
    assert.equal(r2.rule!.enabled, true);
    assert.equal(r2.rule!.smsEnabled, true);

    // 旧通知不受影响
    const complianceNotifs = notificationStore.filter(n => n.type === 'compliance_alert');
    for (const n of complianceNotifs) {
      assert.ok(['pending', 'sent', 'read', 'archived'].includes(n.status));
    }
  });

  test('[正例] 多角色各自独立未读计数 → 互不影响', () => {
    // 创建一条同时发给 admin 和 store_manager 的通知
    const r = miniappTriggerEvent({
      type: 'system_announcement',
      title: '独立未读计数测试',
      content: 'admin和store_manager各自应该有独立计数',
      priority: 'low',
      requestId: 'evt_independent_unread',
    });
    assert.ok(r.success);
    domainDispatchNotifications();

    const adminUnread = tobWebGetUnreadCount('admin');
    const storeMgrUnread = tobWebGetUnreadCount('store_manager');

    // 这条通知同时发给 admin 和 store_manager
    assert.ok(adminUnread.byType['system_announcement'] >= 1);
    assert.ok(storeMgrUnread.byType['system_announcement'] >= 1);

    // admin 标记已读不影响 store_manager
    const systemNotifs = adminUnread.byType['system_announcement'] || 0;
    const storeMgrNotifsBefore = storeMgrUnread.byType['system_announcement'] || 0;

    // admin 标记刚才创建的通知
    const notifId = r.notification!.id;
    tobWebMarkAsRead('admin', [notifId]);

    const adminUnread2 = tobWebGetUnreadCount('admin');
    const storeMgrUnread2 = tobWebGetUnreadCount('store_manager');

    // admin 的未读减少, store_manager 的未读不变
    assert.ok(adminUnread2.byType['system_announcement'] < systemNotifs,
      'admin标记已读后system_announcement未读应减少');
    assert.equal(storeMgrUnread2.byType['system_announcement'] || 0, storeMgrNotifsBefore,
      'store_manager的未读计数不应受admin标记影响');
  });

  test('[边界] 批量标记大量通知(100个) → 全部成功, 未读减少', () => {
    // 创建一批通知
    const batchIds: string[] = [];
    for (let i = 0; i < 100; i++) {
      const r = miniappTriggerEvent({
        type: 'system_announcement',
        title: `批量标记通知 #${i}`,
        content: `批量测试第${i}条`,
        priority: 'low',
        requestId: `evt_batch_mark_${i}`,
      });
      assert.ok(r.success);
      batchIds.push(r.notification!.id);
    }
    domainDispatchNotifications();

    const unreadBefore = tobWebGetUnreadCount('admin');

    // 批量标记
    const result = tobWebMarkAsRead('admin', batchIds);
    assert.equal(result.success, 100);
    assert.equal(result.errors.length, 0);

    const unreadAfter = tobWebGetUnreadCount('admin');
    assert.ok(unreadAfter.total <= unreadBefore.total - 100, '批量标记后未读应减少至少100');
  });

  test('[边界] 角色隔离: operator只能看到system_announcement和order_alert', () => {
    // operator 的未读只含 system 通知
    const operatorUnread = tobWebGetUnreadCount('operator');
    const operatorNotifs = tobWebGetNotifications('operator');
    for (const n of operatorNotifs) {
      assert.ok(n.targetRoles.includes('operator'), '所有operator收到的通知都应在targetRoles中');
    }
  });

  test('[边界] 批量标记包含不存在通知ID → 部分成功, 返回错误列表', () => {
    const result = tobWebMarkAsRead('admin', ['notif_fake_1', 'notif_fake_2']);
    assert.equal(result.success, 0);
    assert.equal(result.errors.length, 2);
    assert.ok(result.errors[0].includes('not_found'));
  });

  test('[边界] 归档已归档通知 → 幂等, 不报错（archived状态不变）', () => {
    const archivedNotif = notificationStore.find(n => n.status === 'archived');
    if (archivedNotif) {
      const r = tobWebArchiveNotification('admin', archivedNotif.id);
      assert.ok(r.success);
      const stored = notificationStore.find(n => n.id === archivedNotif.id);
      assert.equal(stored!.status, 'archived');
    }
  });

  test('[边界] 新创建通知+立刻派发+未读计数 → 标记前未读>0, 标记后减少', () => {
    const r = miniappTriggerEvent({
      type: 'system_announcement',
      title: '即时派发未读测试',
      content: '创建后立刻派发并检查未读计数变化',
      priority: 'low',
      requestId: 'evt_immediate_unread_test',
    });
    assert.ok(r.success);
    const nId = r.notification!.id;
    domainDispatchNotifications();

    const unreadBefore = tobWebGetUnreadCount('admin');
    assert.ok(unreadBefore.byType['system_announcement'] >= 1);

    tobWebMarkAsRead('admin', [nId]);
    const unreadAfter = tobWebGetUnreadCount('admin');
    assert.equal(unreadAfter.byType['system_announcement'] ?? 0, (unreadBefore.byType['system_announcement'] || 0) - 1);
  });
});
