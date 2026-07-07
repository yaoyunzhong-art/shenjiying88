// sandbox.controller.test.ts - T116-2
// 沙箱模块控制器测试 (正例 + 反例 + 边界)

import { describe, it, expect, beforeEach } from 'vitest';
import { SandboxController } from './sandbox.controller';
import { SandboxService, ISVAppStore, SDKMultiLangService } from './sandbox-isv.service';
import type { SandboxStatus, CodeLanguage, AppCategory, SDKLanguage } from './sandbox-isv.service';
import {
  CreateSandboxDto,
  ExecuteCodeDto,
  PublishAppDto,
  InstallAppDto,
  RateAppDto,
  GenerateSDKDto,
} from './sandbox.dto';

// ── 辅助函数 ──────────────────────────────────────────────────────────────────

function createController(): SandboxController {
  const sandboxService = new SandboxService();
  const appStore = new ISVAppStore();
  const sdkService = new SDKMultiLangService();
  return new SandboxController(sandboxService, appStore, sdkService);
}

// ── Sandbox Controller Tests ──────────────────────────────────────────────────

describe('SandboxController', () => {
  let controller: SandboxController;

  beforeEach(() => {
    controller = createController();
  });

  // ── createSandbox ───────────────────────────────────────────────────────────

  describe('POST /sandbox (createSandbox)', () => {
    it('should create a sandbox with RUNNING status', async () => {
      const dto: CreateSandboxDto = { appId: 'app-001', developerId: 'dev-001' };
      const result = await controller.createSandbox(dto);
      expect(result.id).toBeDefined();
      expect(result.appId).toBe('app-001');
      expect(result.developerId).toBe('dev-001');
      expect(result.status).toBe('RUNNING');
      expect(result.createdAt).toBeDefined();
      expect(result.lastActiveAt).toBeDefined();
      expect(result.resources.cpu).toBe(1);
      expect(result.resources.memory).toBe(512);
      expect(result.resources.disk).toBe(1024);
    });

    it('should create sandbox with unique IDs', async () => {
      const a = await controller.createSandbox({ appId: 'a', developerId: 'd1' });
      const b = await controller.createSandbox({ appId: 'b', developerId: 'd2' });
      expect(a.id).not.toBe(b.id);
    });
  });

  // ── destroySandbox ─────────────────────────────────────────────────────────

  describe('POST /sandbox/:id/destroy (destroySandbox)', () => {
    it('should destroy an existing sandbox', async () => {
      const created = await controller.createSandbox({ appId: 'app-001', developerId: 'dev-001' });
      const result = await controller.destroySandbox(created.id);
      expect(result.success).toBe(true);
    });

    it('should return success=false for non-existent sandbox', async () => {
      const result = await controller.destroySandbox('nonexistent-id');
      expect(result.success).toBe(false);
    });
  });

  // ── getSandboxStatus ───────────────────────────────────────────────────────

  describe('GET /sandbox/:id/status (getSandboxStatus)', () => {
    it('should return RUNNING status for active sandbox', async () => {
      const created = await controller.createSandbox({ appId: 'app-001', developerId: 'dev-001' });
      const result = await controller.getSandboxStatus(created.id);
      expect(result.status).toBe('RUNNING');
    });

    it('should return undefined for non-existent sandbox', async () => {
      const result = await controller.getSandboxStatus('nonexistent-id');
      expect(result.status).toBeUndefined();
    });
  });

  // ── executeCode ─────────────────────────────────────────────────────────────

  describe('POST /sandbox/:id/execute (executeCode)', () => {
    it('should execute code successfully', async () => {
      const created = await controller.createSandbox({ appId: 'app-001', developerId: 'dev-001' });
      const dto: ExecuteCodeDto = { code: 'console.log("hello")', language: 'javascript' };
      const result = await controller.executeCode(created.id, dto);
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('should fail for non-existent sandbox', async () => {
      const dto: ExecuteCodeDto = { code: 'console.log("hello")', language: 'javascript' };
      const result = await controller.executeCode('nonexistent-id', dto);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should detect throw/error keywords and return failure', async () => {
      const created = await controller.createSandbox({ appId: 'app-001', developerId: 'dev-001' });
      const dto: ExecuteCodeDto = { code: 'throw new Error("boom")', language: 'typescript' };
      const result = await controller.executeCode(created.id, dto);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ── resetSandbox ───────────────────────────────────────────────────────────

  describe('POST /sandbox/:id/reset (resetSandbox)', () => {
    it('should reset an existing sandbox', async () => {
      const created = await controller.createSandbox({ appId: 'app-001', developerId: 'dev-001' });
      const result = await controller.resetSandbox(created.id);
      expect('id' in result).toBe(true);
      if ('id' in result) {
        expect(result.id).toBe(created.id);
        expect(result.status).toBe('RUNNING');
      }
    });

    it('should return error for non-existent sandbox', async () => {
      const result = await controller.resetSandbox('nonexistent-id');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Sandbox not found');
      }
    });
  });

  // ── listSandboxes ─────────────────────────────────────────────────────────

  describe('GET /sandbox (listSandboxes)', () => {
    it('should list all sandboxes', async () => {
      await controller.createSandbox({ appId: 'a', developerId: 'd1' });
      await controller.createSandbox({ appId: 'b', developerId: 'd2' });
      const list = await controller.listSandboxes();
      expect(list.length).toBe(2);
    });

    it('should filter sandboxes by developerId', async () => {
      await controller.createSandbox({ appId: 'a', developerId: 'd1' });
      await controller.createSandbox({ appId: 'b', developerId: 'd2' });
      await controller.createSandbox({ appId: 'c', developerId: 'd1' });
      const list = await controller.listSandboxes('d1');
      expect(list.length).toBe(2);
    });

    it('should return empty array when no sandboxes exist', async () => {
      const list = await controller.listSandboxes();
      expect(list).toEqual([]);
    });
  });

  // ── getSandbox ─────────────────────────────────────────────────────────────

  describe('GET /sandbox/:id (getSandbox)', () => {
    it('should return sandbox by id', async () => {
      const created = await controller.createSandbox({ appId: 'app-001', developerId: 'dev-001' });
      const result = await controller.getSandbox(created.id);
      expect('id' in result).toBe(true);
      if ('id' in result) {
        expect(result.id).toBe(created.id);
        expect(result.appId).toBe('app-001');
      }
    });

    it('should return error for non-existent sandbox', async () => {
      const result = await controller.getSandbox('nonexistent-id');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Sandbox not found');
      }
    });
  });
});

// ── ISV App Store Controller Tests ───────────────────────────────────────────

describe('ISVAppStore (via SandboxController)', () => {
  let controller: SandboxController;

  beforeEach(() => {
    controller = createController();
  });

  // ── publishApp ─────────────────────────────────────────────────────────────

  describe('POST /sandbox/isv/apps (publishApp)', () => {
    it('should publish a new app', async () => {
      const dto: PublishAppDto = {
        name: 'Test App',
        description: 'A test app',
        developerId: 'dev-001',
        category: 'CRM' as AppCategory,
        version: '1.0.0',
        price: 0,
        isFree: true,
      };
      const result = await controller.publishApp(dto);
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test App');
      expect(result.status).toBe('PUBLISHED');
      expect(result.rating).toBe(0);
    });

    it('should auto-assign publishedAt', async () => {
      const dto: PublishAppDto = {
        name: 'App 2',
        description: 'desc',
        developerId: 'dev-001',
        category: 'ANALYTICS' as AppCategory,
        version: '1.0.0',
        price: 0,
        isFree: true,
      };
      const result = await controller.publishApp(dto);
      expect(result.publishedAt).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  // ── listApps ───────────────────────────────────────────────────────────────

  describe('GET /sandbox/isv/apps (listApps)', () => {
    it('should list published apps', async () => {
      const dto: PublishAppDto = {
        name: 'App1', description: 'desc1', developerId: 'dev-001',
        category: 'CRM' as AppCategory, version: '1.0', price: 0, isFree: true,
      };
      await controller.publishApp(dto);
      const list = await controller.listApps({});
      expect(list.length).toBe(1);
      expect(list[0].name).toBe('App1');
    });

    it('should filter by category', async () => {
      const dto1: PublishAppDto = {
        name: 'CRM App', description: 'crm', developerId: 'dev-001',
        category: 'CRM' as AppCategory, version: '1.0', price: 0, isFree: true,
      };
      const dto2: PublishAppDto = {
        name: 'HR App', description: 'hr', developerId: 'dev-001',
        category: 'HR' as AppCategory, version: '1.0', price: 0, isFree: true,
      };
      await controller.publishApp(dto1);
      await controller.publishApp(dto2);
      const list = await controller.listApps({ category: 'CRM' as AppCategory });
      expect(list.length).toBe(1);
      expect(list[0].name).toBe('CRM App');
    });

    it('should return empty when no apps match keyword', async () => {
      const dto: PublishAppDto = {
        name: 'Analytics Pro', description: 'analytics', developerId: 'dev-001',
        category: 'ANALYTICS' as AppCategory, version: '1.0', price: 0, isFree: true,
      };
      await controller.publishApp(dto);
      const list = await controller.listApps({ keyword: 'zzznonexistent' });
      expect(list).toEqual([]);
    });
  });

  // ── installApp / uninstallApp ─────────────────────────────────────────────

  describe('POST /sandbox/isv/apps/:id/install (installApp)', () => {
    it('should install a published app', async () => {
      const dto: PublishAppDto = {
        name: 'App', description: 'desc', developerId: 'dev-001',
        category: 'PAYMENT' as AppCategory, version: '1.0', price: 0, isFree: true,
      };
      const app = await controller.publishApp(dto);
      const result = await controller.installApp(app.id, { tenantId: 'tenant-001' });
      expect('id' in result).toBe(true);
      if ('id' in result) {
        expect(result.appId).toBe(app.id);
        expect(result.tenantId).toBe('tenant-001');
        expect(result.status).toBe('ACTIVE');
      }
    });

    it('should return error for non-existent app', async () => {
      const result = await controller.installApp('nonexistent-app', { tenantId: 'tenant-001' });
      expect('error' in result).toBe(true);
    });
  });

  describe('POST /sandbox/isv/apps/:id/uninstall (uninstallApp)', () => {
    it('should uninstall an installed app', async () => {
      const dto: PublishAppDto = {
        name: 'App', description: 'desc', developerId: 'dev-001',
        category: 'CRM' as AppCategory, version: '1.0', price: 0, isFree: true,
      };
      const app = await controller.publishApp(dto);
      await controller.installApp(app.id, { tenantId: 'tenant-001' });
      const result = await controller.uninstallApp(app.id, { tenantId: 'tenant-001' });
      expect(result.success).toBe(true);
    });

    it('should return false for non-installed app', async () => {
      const result = await controller.uninstallApp('nonexistent-app', { tenantId: 'tenant-001' });
      expect(result.success).toBe(false);
    });
  });

  // ── rateApp ────────────────────────────────────────────────────────────────

  describe('POST /sandbox/isv/apps/:id/rate (rateApp)', () => {
    it('should rate an app and update average', async () => {
      const dto: PublishAppDto = {
        name: 'App', description: 'desc', developerId: 'dev-001',
        category: 'MARKETING' as AppCategory, version: '1.0', price: 0, isFree: true,
      };
      const app = await controller.publishApp(dto);
      const result = await controller.rateApp(app.id, { rating: 5 });
      expect('id' in result).toBe(true);
      if ('id' in result) {
        expect(result.rating).toBeGreaterThan(0);
      }
    });

    it('should return error for invalid rating (boundary)', async () => {
      const dto: PublishAppDto = {
        name: 'App', description: 'desc', developerId: 'dev-001',
        category: 'CRM' as AppCategory, version: '1.0', price: 0, isFree: true,
      };
      const app = await controller.publishApp(dto);
      const result = await controller.rateApp(app.id, { rating: 10 });
      expect('error' in result).toBe(true);
    });

    it('should return error for non-existent app', async () => {
      const result = await controller.rateApp('nonexistent', { rating: 3 });
      expect('error' in result).toBe(true);
    });
  });

  // ── getApp ──────────────────────────────────────────────────────────────

  describe('GET /sandbox/isv/apps/:id (getApp)', () => {
    it('should get app by id', async () => {
      const dto: PublishAppDto = {
        name: 'GetTest', description: 'desc', developerId: 'dev-001',
        category: 'OTHER' as AppCategory, version: '1.0', price: 0, isFree: true,
      };
      const app = await controller.publishApp(dto);
      const result = await controller.getApp(app.id);
      expect('id' in result).toBe(true);
      if ('id' in result) {
        expect(result.name).toBe('GetTest');
      }
    });

    it('should return error for non-existent app', async () => {
      const result = await controller.getApp('nonexistent');
      expect('error' in result).toBe(true);
    });
  });

  // ── listInstalls ──────────────────────────────────────────────────────────

  describe('GET /sandbox/isv/apps/:id/installs (listInstalls)', () => {
    it('should list active installs for tenant', async () => {
      const dto: PublishAppDto = {
        name: 'App', description: 'desc', developerId: 'dev-001',
        category: 'INVENTORY' as AppCategory, version: '1.0', price: 0, isFree: true,
      };
      const app = await controller.publishApp(dto);
      await controller.installApp(app.id, { tenantId: 'tenant-001' });
      const installs = await controller.listInstalls('tenant-001');
      expect(installs.length).toBe(1);
      expect(installs[0].appId).toBe(app.id);
    });

    it('should return empty for tenant with no installs', async () => {
      const installs = await controller.listInstalls('no-installs-tenant');
      expect(installs).toEqual([]);
    });
  });
});

// ── SDK Controller Tests ─────────────────────────────────────────────────────

describe('SDK (via SandboxController)', () => {
  let controller: SandboxController;

  beforeEach(() => {
    controller = createController();
  });

  describe('POST /sandbox/isv/apps/:id/sdk/generate (generateSDK)', () => {
    it('should generate an SDK package', async () => {
      const dto: GenerateSDKDto = { language: 'nodejs' as SDKLanguage };
      const sdk = await controller.generateSDK('app-001', dto);
      expect(sdk.language).toBe('nodejs');
      expect(sdk.version).toBe('1.0.0');
      expect(sdk.downloadURL).toBeDefined();
      expect(sdk.size).toBeGreaterThan(0);
      expect(sdk.checksum).toBeDefined();
    });

    it('should generate SDK for different languages', async () => {
      const languages: SDKLanguage[] = ['nodejs', 'python', 'go'];
      for (const lang of languages) {
        const sdk = await controller.generateSDK('app-001', { language: lang });
        expect(sdk.language).toBe(lang);
      }
    });
  });

  describe('GET /sandbox/isv/apps/:id/sdk/download (getSDKDownloadURL)', () => {
    it('should return download URL for generated SDK', async () => {
      const dto: GenerateSDKDto = { language: 'python' as SDKLanguage };
      await controller.generateSDK('app-001', dto);
      const result = await controller.getSDKDownloadURL('app-001', 'python');
      expect(result.url).toBeDefined();
      expect(result.url).toContain('cdn.isv.com');
    });

    it('should return URL even without pre-generation (on-demand)', async () => {
      const result = await controller.getSDKDownloadURL('app-002', 'go');
      expect(result.url).toBeDefined();
      expect(result.url).toContain('cdn.isv.com');
    });
  });

  describe('GET /sandbox/isv/sdk/languages (listSDKLanguages)', () => {
    it('should list all supported languages', async () => {
      const result = await controller.listSDKLanguages();
      expect(result.languages).toContain('nodejs');
      expect(result.languages).toContain('python');
      expect(result.languages).toContain('java');
      expect(result.languages).toContain('go');
    });
  });
});
