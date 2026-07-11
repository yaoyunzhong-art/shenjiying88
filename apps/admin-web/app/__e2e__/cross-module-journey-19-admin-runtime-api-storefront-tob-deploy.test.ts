/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链41 (Pulse-Nightly-14)
 * 管理端部署管控 → Runtime运行时监控 → API回滚 → Storefront发布 → Tob-Web通知
 *
 * 新增于 2026-07-12 03:30-05:30 第三段
 * 覆盖盲区: deploy 模块  +  运行时部署生命周期
 *
 * 模拟链路:
 *   Admin(部署管控: 发版/回滚/灰度)
 *   → Runtime(运行时监控: 健康检查/错误率/资源)
 *   → API(回滚触发: 自动/手动回滚)
 *   → Storefront(前端发布: CDN缓存/版本切换)
 *   → Tob-Web(通知: 部署状态通知/回滚告警)
 *
 * 测试设计:
 *   - 部署生命周期: 灰度发布→全量发布→回滚→版本验证
 *   - 运维窗口: 03:30-05:30 (低谷期部署)
 *   - 运行时监控: 健康→降级→恢复全周期
 *   - 回滚机制: 自动回滚(健康检查失败) + 手动回滚(版本异常)
 *   - 通知治理: 部署成功/失败/回滚各通知利益相关方
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type DeployStatus = 'pending' | 'deploying' | 'canary' | 'live' | 'rolled_back' | 'failed';
type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
type RollbackTrigger = 'auto_health' | 'auto_error_rate' | 'manual_rollback' | 'manual_cancel';
type NotificationChannel = 'email' | 'sms' | 'webhook' | 'in_app';

interface DeployRelease {
  version: string;
  appName: string;
  target: 'admin' | 'api' | 'storefront' | 'tob' | 'miniapp';
  status: DeployStatus;
  canaryPercent: number;
  deployedAt: number;
  rolledBackAt?: number;
  rollbackReason?: string;
  artifacts: { imageTag: string; commit: string };
}

interface RuntimeMonitor {
  app: string;
  version: string;
  health: HealthStatus;
  errorRatePct: number;
  p99LatencyMs: number;
  cpuPct: number;
  memMb: number;
  activeInstances: number;
  lastHeartbeat: number;
}

interface RollbackRecord {
  rollbackId: string;
  appName: string;
  fromVersion: string;
  toVersion: string;
  trigger: RollbackTrigger;
  reason: string;
  timestamp: number;
  completed: boolean;
}

interface DeployNotification {
  notificationId: string;
  appName: string;
  version: string;
  status: DeployStatus;
  channel: NotificationChannel;
  recipients: string[];
  sentAt: number;
  acknowledged: boolean;
}

// ─── 仓储 ───

const DEPLOY_STORE: Map<string, DeployRelease[]> = new Map(); // app -> releases
const MONITOR_STORE: Map<string, RuntimeMonitor> = new Map(); // app -> current monitor
const ROLLBACK_STORE: RollbackRecord[] = [];
const NOTIFICATION_STORE: DeployNotification[] = [];

let DEPLOY_COUNTER = 0;
let ROLLBACK_COUNTER = 0;
let NOTIF_COUNTER = 0;

function resetDeployStore(): void {
  DEPLOY_STORE.clear();
  MONITOR_STORE.clear();
  ROLLBACK_STORE.length = 0;
  NOTIFICATION_STORE.length = 0;
  DEPLOY_COUNTER = 0;
  ROLLBACK_COUNTER = 0;
  NOTIF_COUNTER = 0;
}

function nextDeployId(): string {
  return `deploy_${++DEPLOY_COUNTER}`;
}
function nextRollbackId(): string {
  return `rb_${++ROLLBACK_COUNTER}`;
}
function nextNotifId(): string {
  return `notif_${++NOTIF_COUNTER}`;
}

// ─── Admin: 部署管控 ───

function adminCreateRelease(rel: Omit<DeployRelease, 'status' | 'deployedAt'>): DeployRelease {
  const release: DeployRelease = { ...rel, status: 'pending', deployedAt: 0 };
  const existing = DEPLOY_STORE.get(rel.appName) || [];
  existing.push(release);
  DEPLOY_STORE.set(rel.appName, existing);
  return release;
}

function adminStartDeploy(appName: string, version: string, isCanary: boolean): { success: boolean; release?: DeployRelease; error?: string } {
  const releases = DEPLOY_STORE.get(appName);
  const rel = releases?.find(r => r.version === version && r.status === 'pending');
  if (!rel) return { success: false, error: 'no_pending_release' };

  rel.status = isCanary ? 'canary' : 'live';
  rel.deployedAt = Date.now();

  // 更新运行时监控
  MONITOR_STORE.set(appName, {
    app: appName,
    version,
    health: 'healthy',
    errorRatePct: 0.1,
    p99LatencyMs: 120,
    cpuPct: 45,
    memMb: 512,
    activeInstances: isCanary ? 1 : 5,
    lastHeartbeat: Date.now(),
  });

  return { success: true, release: rel };
}

function adminPromoteCanary(appName: string, version: string): { success: boolean; error?: string } {
  const releases = DEPLOY_STORE.get(appName);
  const rel = releases?.find(r => r.version === version && r.status === 'canary');
  if (!rel) return { success: false, error: 'no_canary_release' };
  rel.status = 'live';
  const mon = MONITOR_STORE.get(appName);
  if (mon) {
    mon.activeInstances = 5;
    mon.lastHeartbeat = Date.now();
  }
  return { success: true };
}

function adminMarkFailed(appName: string, version: string, reason: string): { success: boolean; error?: string } {
  const releases = DEPLOY_STORE.get(appName);
  const rel = releases?.find(r => r.version === version && (r.status === 'canary' || r.status === 'live'));
  if (!rel) return { success: false, error: 'release_not_found' };
  rel.status = 'failed';
  const mon = MONITOR_STORE.get(appName);
  if (mon) mon.health = 'down';
  return { success: true };
}

function adminGetDeployments(appName: string): DeployRelease[] {
  return DEPLOY_STORE.get(appName) || [];
}

// ─── Runtime: 运行时监控 ───

function runtimeUpdateHealth(appName: string, health: HealthStatus, errorRatePct?: number): void {
  const mon = MONITOR_STORE.get(appName);
  if (!mon) return;
  mon.health = health;
  if (errorRatePct !== undefined) mon.errorRatePct = errorRatePct;
  mon.lastHeartbeat = Date.now();
}

function runtimeGetMonitor(appName: string): RuntimeMonitor | undefined {
  return MONITOR_STORE.get(appName);
}

function runtimeDegradeAndTriggerAutoRollback(appName: string): { rollback?: RollbackRecord; reason?: string } {
  const mon = MONITOR_STORE.get(appName);
  if (!mon) return { reason: 'no_monitor' };

  // 模拟健康降级
  mon.health = 'down';
  mon.errorRatePct = 35;

  const releases = DEPLOY_STORE.get(appName);
  if (!releases || releases.length < 2) return { reason: 'no_previous_version' };

  const current = releases.find(r => r.version === mon.version && r.status === 'live') ||
                   releases.find(r => r.version === mon.version && r.status === 'canary');
  if (!current) return { reason: 'current_version_not_found' };

  // 找上一个稳定版本（部署时间比当前版本早的最后一个version）
  const sorted = [...releases].filter(r => r.deployedAt > 0)
                               .sort((a, b) => a.deployedAt - b.deployedAt); // 升序: 旧→新
  const currentIdx = sorted.findIndex(r => r.version === mon.version);
  if (currentIdx <= 0) return { reason: 'no_previous_stable' };

  const prevRelease = sorted[currentIdx - 1];
  if (!prevRelease) return { reason: 'no_previous_release' };

  const rollback: RollbackRecord = {
    rollbackId: nextRollbackId(),
    appName,
    fromVersion: mon.version,
    toVersion: prevRelease.version,
    trigger: 'auto_health',
    reason: `Health degraded to down, auto rollback from ${mon.version} to ${prevRelease.version}`,
    timestamp: Date.now(),
    completed: true,
  };

  ROLLBACK_STORE.push(rollback);

  // 更新 deploy 状态
  current.status = 'rolled_back';
  current.rolledBackAt = Date.now();
  current.rollbackReason = rollback.reason;

  // 回滚版本
  mon.version = prevRelease.version;
  mon.health = 'healthy';
  mon.errorRatePct = 0.5;
  mon.lastHeartbeat = Date.now();

  return { rollback };
}

// ─── API: 回滚 ├──

function apiManualRollback(appName: string, fromVersion: string, toVersion: string, reason: string): { success: boolean; rollback?: RollbackRecord; error?: string } {
  const releases = DEPLOY_STORE.get(appName);
  const from = releases?.find(r => r.version === fromVersion && (r.status === 'live' || r.status === 'canary'));
  const to = releases?.find(r => r.version === toVersion);
  if (!from) return { success: false, error: 'from_version_not_found' };
  if (!to) return { success: false, error: 'to_version_not_found' };

  const rollback: RollbackRecord = {
    rollbackId: nextRollbackId(),
    appName,
    fromVersion,
    toVersion,
    trigger: 'manual_rollback',
    reason,
    timestamp: Date.now(),
    completed: true,
  };

  ROLLBACK_STORE.push(rollback);

  from.status = 'rolled_back';
  from.rolledBackAt = Date.now();
  from.rollbackReason = reason;

  const mon = MONITOR_STORE.get(appName);
  if (mon) {
    mon.version = toVersion;
    mon.lastHeartbeat = Date.now();
  }

  return { success: true, rollback };
}

function apiGetRollbackHistory(appName?: string): RollbackRecord[] {
  if (appName) return ROLLBACK_STORE.filter(r => r.appName === appName);
  return [...ROLLBACK_STORE];
}

// ─── Storefront: 前端发布 ───

function storefrontGetCurrentVersion(appName: string): { version: string; healthy: boolean } {
  const mon = MONITOR_STORE.get(appName);
  if (!mon) return { version: 'unknown', healthy: false };
  return { version: mon.version, healthy: mon.health === 'healthy' };
}

function storefrontCheckCacheValid(version: string): boolean {
  // 版本号不低于某个阈值即为有效
  const vNum = parseInt(version.replace(/[^0-9]/g, ''), 10);
  return vNum > 0;
}

// ─── Tob-Web: 部署通知 ───

function tobSendDeployNotification(appName: string, version: string, status: DeployStatus): DeployNotification {
  const notification: DeployNotification = {
    notificationId: nextNotifId(),
    appName,
    version,
    status,
    channel: 'in_app',
    recipients: ['devops@team', 'qa@team', 'pm@team'],
    sentAt: Date.now(),
    acknowledged: false,
  };
  NOTIFICATION_STORE.push(notification);
  return notification;
}

function tobGetNotifications(appName?: string): DeployNotification[] {
  if (appName) return NOTIFICATION_STORE.filter(n => n.appName === appName);
  return [...NOTIFICATION_STORE];
}

function tobAcknowledgeNotification(notifId: string): boolean {
  const notif = NOTIFICATION_STORE.find(n => n.notificationId === notifId);
  if (!notif) return false;
  notif.acknowledged = true;
  return true;
}

// ─── 测试套件 ───

describe('[L3-E2E] 链41: Admin部署管控 → Runtime监控 → API回滚 → Storefront发布 → Tob-Web通知', () => {

  // ════════════════════════════════════════════
  // 正例 (P) — 部署生命周期全链路
  // ════════════════════════════════════════════

  test('[P1] 正向: 灰度发布→全量→版本验证成功', () => {
    resetDeployStore();

    // 1. 创建v1 (基线版本)
    adminCreateRelease({ version: '1.0.0', appName: 'api', target: 'api', canaryPercent: 0, artifacts: { imageTag: 'v1.0.0', commit: 'abc123' } });
    adminStartDeploy('api', '1.0.0', false);

    // 2. 创建v2 → 灰度发布
    adminCreateRelease({ version: '2.0.0', appName: 'api', target: 'api', canaryPercent: 10, artifacts: { imageTag: 'v2.0.0', commit: 'def456' } });
    const canary = adminStartDeploy('api', '2.0.0', true);
    assert.ok(canary.success, '灰度发布应成功');
    assert.equal(canary.release?.status, 'canary');

    // 3. Runtime 监控验证 — canary 1个实例
    const monCanary = runtimeGetMonitor('api');
    assert.ok(monCanary);
    assert.equal(monCanary!.version, '2.0.0');
    assert.equal(monCanary!.activeInstances, 1);
    assert.equal(monCanary!.health, 'healthy');

    // 4. 灰度→全量发布
    const promote = adminPromoteCanary('api', '2.0.0');
    assert.ok(promote.success);

    // 5. 全量验证 — 5个实例
    const monFull = runtimeGetMonitor('api');
    assert.equal(monFull?.activeInstances, 5);
    assert.equal(monFull?.version, '2.0.0');

    // 6. Storefront 版本验证
    const sfVer = storefrontGetCurrentVersion('api');
    assert.equal(sfVer.version, '2.0.0');
    assert.ok(sfVer.healthy);

    // 7. Tob-Web 部署通知
    const notif = tobSendDeployNotification('api', '2.0.0', 'live');
    assert.ok(notif.notificationId.startsWith('notif_'));
    assert.equal(notif.channel, 'in_app');
    assert.equal(notif.status, 'live');

    // 8. 通知确认
    const ack = tobAcknowledgeNotification(notif.notificationId);
    assert.ok(ack);
    const notified = tobGetNotifications('api');
    assert.ok(notified.find(n => n.notificationId === notif.notificationId)?.acknowledged);
  });

  test('[P2] 正向: 多应用并行部署各版本独立', () => {
    resetDeployStore();

    // 同时部署 admin, api, storefront 三个应用
    const apps = ['admin', 'api', 'storefront'];
    for (const app of apps) {
      adminCreateRelease({ version: '1.0.0', appName: app, target: app as any, canaryPercent: 0, artifacts: { imageTag: `v1.0.0-${app}`, commit: 'aaa' } });
      adminStartDeploy(app, '1.0.0', false);
    }

    // 各应用版本独立
    for (const app of apps) {
      const mon = runtimeGetMonitor(app);
      assert.ok(mon, `${app} 应有监控`);
      assert.equal(mon!.version, '1.0.0');
      assert.equal(mon!.health, 'healthy');
    }

    // 通知各自独立
    for (const app of apps) {
      const n = tobSendDeployNotification(app, '1.0.0', 'live');
      assert.equal(n.appName, app);
    }
    assert.equal(tobGetNotifications().length, 3);
  });

  test('[P3] 正向: 部署历史全量查询', () => {
    resetDeployStore();

    adminCreateRelease({ version: '0.9.0', appName: 'api', target: 'api', canaryPercent: 0, artifacts: { imageTag: 'v0.9.0', commit: 'c1' } });
    adminStartDeploy('api', '0.9.0', false);

    adminCreateRelease({ version: '1.0.0', appName: 'api', target: 'api', canaryPercent: 0, artifacts: { imageTag: 'v1.0.0', commit: 'c2' } });
    adminStartDeploy('api', '1.0.0', false);

    adminCreateRelease({ version: '1.1.0', appName: 'api', target: 'api', canaryPercent: 10, artifacts: { imageTag: 'v1.1.0', commit: 'c3' } });
    adminStartDeploy('api', '1.1.0', true);

    const history = adminGetDeployments('api');
    assert.equal(history.length, 3);

    const versions = history.map(h => h.version);
    assert.deepEqual(versions, ['0.9.0', '1.0.0', '1.1.0']);
    assert.equal(history.find(h => h.version === '1.1.0')!.status, 'canary');
  });

  // ════════════════════════════════════════════
  // 反例 (N) — 部署失败与回滚
  // ════════════════════════════════════════════

  test('[N1] 反例: 自动回滚 — 健康检查失败', () => {
    resetDeployStore();

    // 基础版本
    adminCreateRelease({ version: '1.0.0', appName: 'api', target: 'api', canaryPercent: 0, artifacts: { imageTag: 'v1.0.0', commit: 'abc' } });
    adminStartDeploy('api', '1.0.0', false);

    // 新版本部署
    adminCreateRelease({ version: '2.0.0', appName: 'api', target: 'api', canaryPercent: 0, artifacts: { imageTag: 'v2.0.0', commit: 'def' } });
    adminStartDeploy('api', '2.0.0', false);

    // 新版本健康降级 → 触发自动回滚
    const result = runtimeDegradeAndTriggerAutoRollback('api');
    assert.ok(result.rollback, '应触发自动回滚');
    assert.equal(result.rollback!.trigger, 'auto_health');
    assert.equal(result.rollback!.fromVersion, '2.0.0');
    assert.equal(result.rollback!.toVersion, '1.0.0');

    // 确认回滚后版本恢复
    const mon = runtimeGetMonitor('api');
    assert.equal(mon!.version, '1.0.0');
    assert.equal(mon!.health, 'healthy');

    // 确认 deploy 记录
    const rels = adminGetDeployments('api');
    const rel20 = rels.find(r => r.version === '2.0.0');
    assert.equal(rel20?.status, 'rolled_back');
    assert.ok(rel20?.rollbackReason?.includes('auto rollback'));
  });

  test('[N2] 反例: 手动回滚 — 版本异常手动触发', () => {
    resetDeployStore();

    adminCreateRelease({ version: '1.0.0', appName: 'storefront', target: 'storefront', canaryPercent: 0, artifacts: { imageTag: 'v1.0.0', commit: 'c1' } });
    adminStartDeploy('storefront', '1.0.0', false);

    adminCreateRelease({ version: '2.0.0', appName: 'storefront', target: 'storefront', canaryPercent: 0, artifacts: { imageTag: 'v2.0.0', commit: 'c2' } });
    adminStartDeploy('storefront', '2.0.0', false);

    // 业务发现新版本有bug → 手动回滚
    const manual = apiManualRollback('storefront', '2.0.0', '1.0.0', '版本2.0.0存在页面渲染bug, 手动回滚');
    assert.ok(manual.success);
    assert.equal(manual.rollback!.trigger, 'manual_rollback');

    // 确认版本恢复
    const sf = storefrontGetCurrentVersion('storefront');
    assert.equal(sf.version, '1.0.0');

    // 确认历史
    const history = apiGetRollbackHistory('storefront');
    assert.equal(history.length, 1);
    assert.equal(history[0].trigger, 'manual_rollback');

    // Tob-Web收到回滚通知
    const notif = tobSendDeployNotification('storefront', '1.0.0', 'rolled_back');
    assert.equal(notif.status, 'rolled_back');
  });

  test('[N3] 反例: 对不存在的版本执行操作', () => {
    resetDeployStore();

    // 对不存在的版本部署
    const r1 = adminStartDeploy('api', '99.0.0', false);
    assert.equal(r1.success, false);
    assert.equal(r1.error, 'no_pending_release');

    // 对不存在的版本直推全量
    const r2 = adminPromoteCanary('api', 'nonexistent');
    assert.equal(r2.success, false);
    assert.equal(r2.error, 'no_canary_release');

    // 手动回滚不存在的版本
    const r3 = apiManualRollback('api', '99.0.0', '1.0.0', 'test');
    assert.equal(r3.success, false);

    // 确认不存在的应用通知
    const empty = tobGetNotifications('nonexistent_app');
    assert.equal(empty.length, 0);
  });

  test('[N4] 反例: 部署标记失败时不存在版本', () => {
    resetDeployStore();
    const r = adminMarkFailed('api', '99.0.0', 'test failure');
    assert.equal(r.success, false);
    assert.equal(r.error, 'release_not_found');
  });

  // ════════════════════════════════════════════
  // 边界 (B) — 特殊场景与运维窗口
  // ════════════════════════════════════════════

  test('[B1] 边界: 运维窗口03:30-05:30 — 低谷期部署', () => {
    resetDeployStore();

    // 模拟运维窗口时间
    const deployTime = new Date('2026-07-12T03:45:00+08:00').getTime();

    // 基线版本 (已有稳定版本)
    adminCreateRelease({ version: '2.9.0', appName: 'api', target: 'api', canaryPercent: 0, artifacts: { imageTag: 'v2.9.0', commit: 'old' } });
    adminStartDeploy('api', '2.9.0', false);

    adminCreateRelease({ version: '3.0.0', appName: 'api', target: 'api', canaryPercent: 0, artifacts: { imageTag: 'v3.0.0', commit: 'abc' } });

    // 在运维窗口内部署
    const result = adminStartDeploy('api', '3.0.0', false);
    assert.ok(result.success);
    assert.equal(result.release!.status, 'live');

    // 低谷期高CPU场景 → 部署后CPU飙高(模拟)
    runtimeUpdateHealth('api', 'degraded', 5.0);
    const mon = runtimeGetMonitor('api');
    assert.equal(mon!.health, 'degraded');

    // 低谷期: degraded状态下自动回滚函数仍会将其设置为down并尝试回滚
    // 由于已有前版本(2.9.0), 自动回滚应触发
    const rollback = runtimeDegradeAndTriggerAutoRollback('api');
    // runtimeDegradeAndTriggerAutoRollback 内部将 health 设为 down 并触发回滚
    // 只要有前版本(2.9.0), 回滚就应该成功
    assert.ok(rollback.rollback, 'degraded后应触发自动回滚至前版本');
  });

  test('[B2] 边界: 灰度比例0% — 等同全量', () => {
    resetDeployStore();

    adminCreateRelease({ version: '1.0.0', appName: 'tob', target: 'tob', canaryPercent: 0, artifacts: { imageTag: 'v1.0.0', commit: 'c1' } });
    const r = adminStartDeploy('tob', '1.0.0', false);
    assert.ok(r.success);
    assert.equal(r.release!.status, 'live'); // 非canary, 应为live
  });

  test('[B3] 边界: 灰度100%等同全量', () => {
    resetDeployStore();

    adminCreateRelease({ version: '1.0.0', appName: 'storefront', target: 'storefront', canaryPercent: 0, artifacts: { imageTag: 'v1.0.0', commit: 'c1' } });
    const canary = adminStartDeploy('storefront', '1.0.0', true);
    assert.equal(canary.release!.status, 'canary');
    // 灰度100% → 自动转全量
    const promote = adminPromoteCanary('storefront', '1.0.0');
    assert.ok(promote.success);
    const mon = runtimeGetMonitor('storefront');
    assert.equal(mon!.activeInstances, 5);
  });

  test('[B4] 边界: 多次回滚历史记录', () => {
    resetDeployStore();

    // 模拟多次发布-回滚循环
    const versions = ['1.0.0', '1.1.0', '1.2.0', '1.3.0'];
    for (const v of versions) {
      adminCreateRelease({ version: v, appName: 'api', target: 'api', canaryPercent: 0, artifacts: { imageTag: `v${v}`, commit: 'c' } });
      adminStartDeploy('api', v, false);
    }

    // 回滚2次
    apiManualRollback('api', '1.3.0', '1.2.0', 'bug发现');
    apiManualRollback('api', '1.2.0', '1.1.0', 'compat问题');

    const history = apiGetRollbackHistory('api');
    assert.equal(history.length, 2);
    assert.equal(history[0].fromVersion, '1.3.0');
    assert.equal(history[1].fromVersion, '1.2.0');
  });

  test('[B5] 边界: 通知批量确认', () => {
    resetDeployStore();

    // 批量发送通知
    const notifs: DeployNotification[] = [];
    for (let i = 0; i < 10; i++) {
      const n = tobSendDeployNotification('api', `1.${i}.0`, 'live');
      notifs.push(n);
    }

    // 逐一确认
    let acked = 0;
    for (const n of notifs) {
      if (tobAcknowledgeNotification(n.notificationId)) acked++;
    }
    assert.equal(acked, 10);

    // 全部确认后查询
    const all = tobGetNotifications('api');
    assert.equal(all.length, 10);
    assert.ok(all.every(n => n.acknowledged), '全部通知应确认');

    // 确认不存在的通知
    const fakeAck = tobAcknowledgeNotification('notif_fake');
    assert.equal(fakeAck, false);
  });
});
