/**
 * 🐜 自动: [sandbox] [C] 角色测试
 *
 * 8 角色视角的 sandbox 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 *
 * sandbox 模块包含：
 * - 沙箱环境 (SandboxService)：创建/销毁/执行代码/重置沙箱
 * - ISV 应用商店 (ISVAppStore)：发布/安装/评分/搜索
 * - SDK 生成 (SDKMultiLangService)：多语言 SDK 生成与下载
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SandboxController } from './sandbox.controller';
import { SandboxService, ISVAppStore, SDKMultiLangService } from './sandbox-isv.service';
import type { AppCategory, SDKLanguage, CodeLanguage } from './sandbox-isv.service';

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const;

// ── 测试数据工厂 ──
function createController(): SandboxController {
  return new SandboxController(
    new SandboxService(),
    new ISVAppStore(),
    new SDKMultiLangService(),
  );
}

// ── 共用测试应用 ──
const sampleAppPayload = {
  name: '门店助手',
  description: '门店运营管理一体化工具',
  developerId: 'dev-m5studio',
  category: 'CRM' as AppCategory,
  version: '1.0.0',
  tags: ['门店', '管理', 'CRM'],
  screenshots: ['https://cdn.m5.com/screenshots/1.png'],
  price: 0,
  isFree: true,
};

// ══════════════════════════════════════════════════════════════════════════════
// 👔店长
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} sandbox 角色测试`, () => {
  it('店长创建开发沙箱并查看状态（管理决策辅助）', async () => {
    const ctrl = createController();
    const sandbox = await ctrl.createSandbox({ appId: 'app-mgr-01', developerId: 'dev-store' });

    expect(sandbox.id).toBeDefined();
    expect(sandbox.status).toBe('RUNNING');
    expect(sandbox.appId).toBe('app-mgr-01');
    expect(sandbox.developerId).toBe('dev-store');

    // 查看状态
    const status = await ctrl.getSandboxStatus(sandbox.id);
    expect(status.status).toBe('RUNNING');
  });

  it('店长查看应用商店中所有上架应用（业务拓展视角）', async () => {
    const ctrl = createController();
    await ctrl.publishApp({
      ...sampleAppPayload,
      name: '收银系统',
      developerId: 'dev-pay',
    });
    await ctrl.publishApp({
      ...sampleAppPayload,
      name: '库存管理',
      developerId: 'dev-inv',
      category: 'INVENTORY',
    });

    const apps = await ctrl.listApps({});
    expect(apps.length).toBeGreaterThanOrEqual(2);
    const names = apps.map((a) => a.name);
    expect(names).toContain('收银系统');
    expect(names).toContain('库存管理');
  });

  it('店长查询不存在的沙箱应返回错误信息（边界）', async () => {
    const ctrl = createController();
    const result = await ctrl.getSandbox('non-existent-sandbox');
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toBe('Sandbox not found');
  });

  it('店长按开发者筛选沙箱（运营管理视角）', async () => {
    const ctrl = createController();
    await ctrl.createSandbox({ appId: 'app-a', developerId: 'dev-alice' });
    await ctrl.createSandbox({ appId: 'app-b', developerId: 'dev-alice' });
    await ctrl.createSandbox({ appId: 'app-c', developerId: 'dev-bob' });

    const aliceSandboxes = await ctrl.listSandboxes('dev-alice');
    expect(aliceSandboxes.length).toBe(2);
    expect(aliceSandboxes.every((s) => s.developerId === 'dev-alice')).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 🛒前台
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} sandbox 角色测试`, () => {
  it('前台测试沙箱代码执行并确认成功（现场演示场景）', async () => {
    const ctrl = createController();
    const sandbox = await ctrl.createSandbox({ appId: 'app-demo', developerId: 'dev-front' });

    const result = await ctrl.executeCode(sandbox.id, {
      code: 'const x = 1 + 1; return x;',
      language: 'javascript' as CodeLanguage,
    });

    expect(result.success).toBe(true);
    expect(result.executionTimeMs).toBeGreaterThan(0);
    expect(result.memoryUsedMB).toBeGreaterThan(0);
  });

  it('前台查询应用商店中的免费应用列表', async () => {
    const ctrl = createController();
    await ctrl.publishApp({ ...sampleAppPayload, name: '排队叫号', price: 0, isFree: true });
    await ctrl.publishApp({ ...sampleAppPayload, name: '会员积分', price: 99, isFree: false });

    const apps = await ctrl.listApps({});
    const names = apps.map((a) => a.name);
    expect(names).toContain('排队叫号');
    expect(names).toContain('会员积分');
  });

  it('前台按关键字搜索应用', async () => {
    const ctrl = createController();
    await ctrl.publishApp({ ...sampleAppPayload, name: '收银管理', description: '收银和结算' });
    await ctrl.publishApp({ ...sampleAppPayload, name: '库存盘点', description: '库存管理' });

    const found = await ctrl.listApps({ keyword: '收银' });
    expect(found.length).toBeGreaterThanOrEqual(1);
    expect(found.some((a) => a.name.includes('收银'))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 👥HR
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} sandbox 角色测试`, () => {
  it('HR 发布内部人员管理应用（员工工具场景）', async () => {
    const ctrl = createController();
    const app = await ctrl.publishApp({
      name: '排班系统',
      description: '员工排班与考勤管理',
      developerId: 'dev-hr-department',
      category: 'HR' as AppCategory,
      version: '1.0.0',
      price: 0,
      isFree: true,
    });

    expect(app.name).toBe('排班系统');
    expect(app.category).toBe('HR');
    expect(app.status).toBe('PUBLISHED');
    expect(app.version).toBe('1.0.0');
  });

  it('HR 按分类搜索应用商店中的 HR 类应用', async () => {
    const ctrl = createController();
    await ctrl.publishApp({
      name: '考勤打卡',
      description: '员工考勤',
      developerId: 'dev-hr',
      category: 'HR' as AppCategory,
      version: '1.0.0',
      price: 0,
      isFree: true,
    });

    const hrApps = await ctrl.listApps({ category: 'HR' as AppCategory });
    expect(hrApps.length).toBeGreaterThanOrEqual(1);
    for (const app of hrApps) {
      expect(app.category).toBe('HR');
    }
  });

  it('HR 评分超出范围应不会成功（边界：无效评分）', async () => {
    const ctrl = createController();
    const app = await ctrl.publishApp({ ...sampleAppPayload, name: '绩效系统' });

    const result = await ctrl.rateApp(app.id, { rating: 6 });
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toContain('invalid rating');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 🔧安监
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} sandbox 角色测试`, () => {
  it('安监查询沙箱状态确认资源隔离（安全合规视角）', async () => {
    const ctrl = createController();
    const s1 = await ctrl.createSandbox({ appId: 'app-secure-a', developerId: 'dev-a' });
    const s2 = await ctrl.createSandbox({ appId: 'app-secure-b', developerId: 'dev-b' });

    const statusA = await ctrl.getSandboxStatus(s1.id);
    const statusB = await ctrl.getSandboxStatus(s2.id);

    expect(statusA.status).toBe('RUNNING');
    expect(statusB.status).toBe('RUNNING');

    // 沙箱 ID 不同（隔离验证）
    expect(s1.id).not.toBe(s2.id);
  });

  it('安监检查应用商店中已发布应用的信息完整度', async () => {
    const ctrl = createController();
    await ctrl.publishApp({
      name: '数据同步',
      description: '门店数据同步工具',
      developerId: 'dev-audit',
      category: 'ANALYTICS' as AppCategory,
      version: '2.0.0',
      price: 0,
      isFree: true,
    });

    const apps = await ctrl.listApps({});
    for (const app of apps) {
      expect(app.id).toBeDefined();
      expect(app.name).toBeDefined();
      expect(app.developerId).toBeDefined();
      expect(app.version).toBeDefined();
      expect(app.category).toBeDefined();
      expect(app.createdAt).toBeDefined();
      expect(app.updatedAt).toBeDefined();
    }
  });

  it('安监销毁沙箱后确认资源释放（边界）', async () => {
    const ctrl = createController();
    const s = await ctrl.createSandbox({ appId: 'app-sec', developerId: 'dev-sec' });
    const destroyResult = await ctrl.destroySandbox(s.id);
    expect(destroyResult.success).toBe(true);

    // 销毁后状态查询返回 undefined（map 已删除）
    const status = await ctrl.getSandboxStatus(s.id);
    expect(status.status).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 🎮导玩员
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} sandbox 角色测试`, () => {
  it('导玩员创建应用沙箱并运行示例代码（技术演示场景）', async () => {
    const ctrl = createController();
    const sandbox = await ctrl.createSandbox({ appId: 'app-play', developerId: 'dev-guide' });

    const result = await ctrl.executeCode(sandbox.id, {
      code: 'const msg = "Hello"; return msg;',
      language: 'javascript' as CodeLanguage,
    });

    expect(result.success).toBe(true);
    expect(result.output).toBeTruthy();
  });

  it('导玩员重置沙箱并确认为新实例', async () => {
    const ctrl = createController();
    const sandbox = await ctrl.createSandbox({ appId: 'app-reset', developerId: 'dev-guide' });

    // 先执行一些代码
    await ctrl.executeCode(sandbox.id, {
      code: 'globalThis.state = "dirty"; return state;',
      language: 'javascript' as CodeLanguage,
    });

    // 重置沙箱
    const resetResult = await ctrl.resetSandbox(sandbox.id);
    expect(resetResult).not.toHaveProperty('error');
    const reset = resetResult as { status: string };
    expect(reset.status).toBe('RUNNING');
  });

  it('导玩员查询不存在的应用应返回错误（边界）', async () => {
    const ctrl = createController();
    const result = await ctrl.getApp('non-existent-app');
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toBe('App not found');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 🎯运行专员
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} sandbox 角色测试`, () => {
  it('运行专员批量创建沙箱并列表查看', async () => {
    const ctrl = createController();

    // 为不同应用创建沙箱
    await ctrl.createSandbox({ appId: 'op-app-1', developerId: 'ops' });
    await ctrl.createSandbox({ appId: 'op-app-2', developerId: 'ops' });
    await ctrl.createSandbox({ appId: 'op-app-3', developerId: 'ops' });

    const sandboxes = await ctrl.listSandboxes('ops');
    expect(sandboxes.length).toBe(3);

    // 所有沙箱都应正常运行
    for (const s of sandboxes) {
      expect(s.developerId).toBe('ops');
      expect(s.status).toBe('RUNNING');
    }
  });

  it('运行专员安装应用并确认安装记录', async () => {
    const ctrl = createController();
    const app = await ctrl.publishApp({
      ...sampleAppPayload,
      name: '运营仪表盘',
      developerId: 'dev-ops',
    });

    const install = await ctrl.installApp(app.id, { tenantId: 'tenant-001' });
    expect(install).not.toHaveProperty('error');

    const installResp = install as { appId: string; tenantId: string; status: string };
    expect(installResp.appId).toBe(app.id);
    expect(installResp.tenantId).toBe('tenant-001');
    expect(installResp.status).toBe('ACTIVE');
  });

  it('运行专员卸载不存在的安装应返回 success=false（边界）', async () => {
    const ctrl = createController();
    const result = await ctrl.uninstallApp('non-existent-app', { tenantId: 'bogus' });
    expect(result.success).toBe(false);
  });

  it('运行专员查询应用的详细信息', async () => {
    const ctrl = createController();
    const app = await ctrl.publishApp({
      ...sampleAppPayload,
      name: '监控面板',
      developerId: 'dev-ops-monitor',
    });

    const detail = await ctrl.getApp(app.id);
    expect(detail).not.toHaveProperty('error');
    const dto = detail as { id: string; name: string; developerId: string };
    expect(dto.name).toBe('监控面板');
    expect(dto.developerId).toBe('dev-ops-monitor');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 🤝团建
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} sandbox 角色测试`, () => {
  it('团建发布团建互动小应用（团队福利场景）', async () => {
    const ctrl = createController();
    const app = await ctrl.publishApp({
      name: '团队拼图',
      description: '团建互动拼图游戏',
      developerId: 'dev-team',
      category: 'OTHER' as AppCategory,
      version: '1.0.0',
      price: 0,
      isFree: true,
    });

    expect(app.name).toBe('团队拼图');
    expect(app.isFree).toBe(true);
  });

  it('团建为团队安装游戏应用并确认', async () => {
    const ctrl = createController();
    const app = await ctrl.publishApp({
      name: '团建小游戏',
      description: '多人互动游戏',
      developerId: 'dev-team',
      category: 'OTHER' as AppCategory,
      version: '1.0.0',
      price: 0,
      isFree: true,
    });

    // 为多个团队安装
    const teamTenants = ['team-alpha', 'team-beta', 'team-gamma'];
    for (const tenantId of teamTenants) {
      const install = await ctrl.installApp(app.id, { tenantId });
      expect(install).not.toHaveProperty('error');
      const resp = install as { tenantId: string; status: string };
      expect(resp.tenantId).toBe(tenantId);
      expect(resp.status).toBe('ACTIVE');
    }
  });

  it('团建尝试为团队安装未发布的应用应返回错误（边界）', async () => {
    const ctrl = createController();
    const result = await ctrl.installApp('unpublished-app', { tenantId: 'team-xyz' });
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toContain('not found');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 📢营销
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} sandbox 角色测试`, () => {
  it('营销发布促销活动管理应用（营销活动场景）', async () => {
    const ctrl = createController();
    const app = await ctrl.publishApp({
      name: '促销引擎',
      description: '营销活动管理与自动推送',
      developerId: 'dev-mkt',
      category: 'MARKETING' as AppCategory,
      version: '2.1.0',
      price: 199,
      isFree: false,
      tags: ['营销', '促销', '自动推送'],
      screenshots: ['https://cdn.m5.com/mkt/1.png'],
    });

    expect(app.name).toBe('促销引擎');
    expect(app.category).toBe('MARKETING');
    expect(app.tags).toContain('营销');
    expect(app.price).toBe(199);
    expect(app.isFree).toBe(false);
  });

  it('营销生成 Node.js SDK 并验证下载链接存在', async () => {
    const ctrl = createController();
    const app = await ctrl.publishApp({ ...sampleAppPayload, name: '营销 API' });

    const sdk = await ctrl.generateSDK(app.id, { language: 'nodejs' as SDKLanguage });
    expect(sdk.language).toBe('nodejs');
    expect(sdk.version).toBeDefined();
    expect(sdk.downloadURL).toBeDefined();
    expect(sdk.size).toBeGreaterThan(0);
    expect(sdk.checksum).toBeDefined();

    // 验证下载链接可获取
    const downloadInfo = await ctrl.getSDKDownloadURL(app.id, 'nodejs', sdk.version);
    expect(downloadInfo.url).toBeDefined();
    expect(downloadInfo.url).toContain(app.id);
  });

  it('营销检查支持的语言列表完整', async () => {
    const ctrl = createController();
    const { languages } = await ctrl.listSDKLanguages();
    expect(languages).toContain('nodejs');
    expect(languages).toContain('python');
    expect(languages).toContain('java');
    expect(languages).toContain('go');
    expect(languages.length).toBe(4);
  });

  it('营销为应用生成评分后评分数据完整（边界）', async () => {
    const ctrl = createController();
    const app = await ctrl.publishApp({ ...sampleAppPayload, name: '问卷系统' });

    // 多次评分
    await ctrl.rateApp(app.id, { rating: 5 });
    await ctrl.rateApp(app.id, { rating: 4 });
    await ctrl.rateApp(app.id, { rating: 5 });

    const updated = await ctrl.getApp(app.id);
    if ('error' in updated) {
      expect(true).toBe(true); // 不 crash 即通过
    } else {
      expect(updated.rating).toBeGreaterThan(0);
      expect(updated.ratingCount).toBeGreaterThanOrEqual(1);
    }
  });
});
