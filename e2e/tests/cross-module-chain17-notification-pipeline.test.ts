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
});
