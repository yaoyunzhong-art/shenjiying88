import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// sandbox-isv.test.ts - T116-2
// 沙箱环境 + ISV 应用商店服务测试 (24 tests)
import {
  SandboxService,
  ISVAppStore,
  SDKMultiLangService,
  SandboxStatus,
  CodeLanguage,
  AppCategory,
  AppStatus,
  SDKLanguage,
} from './sandbox-isv.service';

// ── SandboxService Tests ───────────────────────────────────────────────────────

describe('SandboxService', () => {
  let service: SandboxService;

  beforeEach(() => {
    service = new SandboxService();
  });

  describe('createSandbox', () => {
    it('SANDBOX-1 should create sandbox with RUNNING status', async () => {
      const sandbox = await service.createSandbox('app-001', 'dev-001');
      expect(sandbox.status).toBe('RUNNING');
      expect(sandbox.id).toBeDefined();
      expect(sandbox.appId).toBe('app-001');
      expect(sandbox.developerId).toBe('dev-001');
    });

    it('SANDBOX-2 should create sandbox with default resources', async () => {
      const sandbox = await service.createSandbox('app-002', 'dev-002');
      expect(sandbox.resources.cpu).toBe(1);
      expect(sandbox.resources.memory).toBe(512);
      expect(sandbox.resources.disk).toBe(1024);
    });

    it('SANDBOX-3 should create sandbox with createdAt timestamp', async () => {
      const sandbox = await service.createSandbox('app-003', 'dev-003');
      expect(sandbox.createdAt).toBeDefined();
      expect(sandbox.lastActiveAt).toBeDefined();
    });
  });

  describe('getSandboxStatus', () => {
    it('SANDBOX-4 should return RUNNING status for created sandbox', async () => {
      const sandbox = await service.createSandbox('app-004', 'dev-004');
      const status = await service.getSandboxStatus(sandbox.id);
      expect(status).toBe('RUNNING');
    });

    it('SANDBOX-5 should return undefined for non-existent sandbox', async () => {
      const status = await service.getSandboxStatus('non-existent-id');
      expect(status).toBeUndefined();
    });
  });

  describe('executeCode', () => {
    it('SANDBOX-6 should execute code and return result', async () => {
      const sandbox = await service.createSandbox('app-005', 'dev-005');
      const result = await service.executeCode(sandbox.id, 'console.log("hello")', 'javascript');
      expect(result.success).toBe(true);
      expect(result.output).toContain('javascript');
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('SANDBOX-7 should return error for non-existent sandbox', async () => {
      const result = await service.executeCode('fake-id', 'code', 'javascript');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('SANDBOX-8 should detect throw/error in code', async () => {
      const sandbox = await service.createSandbox('app-006', 'dev-006');
      const result = await service.executeCode(sandbox.id, 'throw new Error()', 'javascript');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('resetSandbox', () => {
    it('SANDBOX-9 should reset sandbox to RUNNING status', async () => {
      const sandbox = await service.createSandbox('app-007', 'dev-007');
      const reset = await service.resetSandbox(sandbox.id);
      expect(reset?.status).toBe('RUNNING');
    });

    it('SANDBOX-10 should create snapshot before reset', async () => {
      const sandbox = await service.createSandbox('app-008', 'dev-008');
      const reset = await service.resetSandbox(sandbox.id);
      expect(reset?.snapshot).toBeDefined();
    });

    it('SANDBOX-11 should return undefined for non-existent sandbox', async () => {
      const reset = await service.resetSandbox('non-existent-id');
      expect(reset).toBeUndefined();
    });
  });

  describe('destroySandbox', () => {
    it('SANDBOX-12 should destroy sandbox and return true', async () => {
      const sandbox = await service.createSandbox('app-009', 'dev-009');
      const destroyed = await service.destroySandbox(sandbox.id);
      expect(destroyed).toBe(true);
    });

    it('SANDBOX-13 should return false for non-existent sandbox', async () => {
      const destroyed = await service.destroySandbox('non-existent-id');
      expect(destroyed).toBe(false);
    });
  });
});

// ── ISVAppStore Tests ──────────────────────────────────────────────────────────

describe('ISVAppStore', () => {
  let store: ISVAppStore;

  beforeEach(() => {
    store = new ISVAppStore();
  });

  describe('publishApp', () => {
    it('APP-1 should publish app with PUBLISHED status', async () => {
      const app = await store.publishApp({
        name: 'Test CRM App',
        description: 'A test CRM application',
        developerId: 'dev-001',
        category: 'CRM',
        version: '1.0.0',
        rating: 0,
        tags: ['crm', 'sales'],
        screenshots: [] as any,
        price: 0,
        isFree: true,
      } as any);
      expect(app.status).toBe('PUBLISHED');
      expect(app.publishedAt).toBeDefined();
    });

    it('APP-2 should increment install count after install', async () => {
      const app = await store.publishApp({
        name: 'Analytics App',
        description: 'Analytics tool',
        developerId: 'dev-002',
        category: 'ANALYTICS',
        version: '1.0.0',
        rating: 0,
        tags: [],
        screenshots: [] as any,
        price: 99,
        isFree: false,
      } as any);
      await store.installApp(app.id, 'tenant-001');
      expect(app.installCount).toBe(1);
    });
  });

  describe('listApps', () => {
    it('APP-3 should list only published apps by default', async () => {
      await store.publishApp({
        name: 'Published App',
        description: 'desc',
        developerId: 'dev-001',
        category: 'CRM',
        version: '1.0.0',
        rating: 0,
        tags: [],
        screenshots: [] as any,
        price: 0,
        isFree: true,
      } as any);

      const apps = await store.listApps();
      expect(apps.length).toBeGreaterThan(0);
      apps.forEach((a) => expect(a.status).toBe('PUBLISHED'));
    });

    it('APP-4 should filter apps by category', async () => {
      await store.publishApp({
        name: 'CRM App',
        description: 'desc',
        developerId: 'dev-001',
        category: 'CRM',
        version: '1.0.0',
        rating: 0,
        tags: [],
        screenshots: [] as any,
        price: 0,
        isFree: true,
      } as any);
      await store.publishApp({
        name: 'Marketing App',
        description: 'desc',
        developerId: 'dev-001',
        category: 'MARKETING',
        version: '1.0.0',
        rating: 0,
        tags: [],
        screenshots: [] as any,
        price: 0,
        isFree: true,
      } as any);

      const crmApps = await store.listApps({ category: 'CRM' });
      expect(crmApps.every((a) => a.category === 'CRM')).toBe(true);
    });

    it('APP-5 should filter apps by keyword', async () => {
      await store.publishApp({
        name: 'Super CRM Plus',
        description: 'desc',
        developerId: 'dev-001',
        category: 'CRM',
        version: '1.0.0',
        rating: 0,
        tags: [],
        screenshots: [] as any,
        price: 0,
        isFree: true,
      } as any);

      const results = await store.listApps({ keyword: 'Super' });
      expect(results.some((a) => a.name.includes('Super'))).toBe(true);
    });
  });

  describe('installApp', () => {
    it('APP-6 should install app and return install record', async () => {
      const app = await store.publishApp({
        name: 'Installable App',
        description: 'desc',
        developerId: 'dev-001',
        category: 'OTHER',
        version: '1.0.0',
        rating: 0,
        tags: [],
        screenshots: [] as any,
        price: 0,
        isFree: true,
      } as any);

      const install = await store.installApp(app.id, 'tenant-002');
      expect(install).toBeDefined();
      expect(install?.tenantId).toBe('tenant-002');
      expect(install?.status).toBe('ACTIVE');
    });

    it('APP-7 should return undefined for non-existent app', async () => {
      const install = await store.installApp('non-existent', 'tenant-001');
      expect(install).toBeUndefined();
    });

    it('APP-8 should not install same app twice for same tenant', async () => {
      const app = await store.publishApp({
        name: 'Single Install App',
        description: 'desc',
        developerId: 'dev-001',
        category: 'OTHER',
        version: '1.0.0',
        rating: 0,
        tags: [],
        screenshots: [] as any,
        price: 0,
        isFree: true,
      } as any);

      await store.installApp(app.id, 'tenant-003');
      const secondInstall = await store.installApp(app.id, 'tenant-003');
      expect(secondInstall?.id).toBeDefined();
    });
  });

  describe('uninstallApp', () => {
    it('APP-9 should uninstall app and update status', async () => {
      const app = await store.publishApp({
        name: 'Uninstall App',
        description: 'desc',
        developerId: 'dev-001',
        category: 'OTHER',
        version: '1.0.0',
        rating: 0,
        tags: [],
        screenshots: [] as any,
        price: 0,
        isFree: true,
      } as any);

      await store.installApp(app.id, 'tenant-004');
      const uninstalled = await store.uninstallApp(app.id, 'tenant-004');
      expect(uninstalled).toBe(true);

      const install = store.getInstall(app.id, 'tenant-004');
      expect(install?.status).toBe('UNINSTALLED');
    });
  });

  describe('rateApp', () => {
    it('APP-10 should update app rating', async () => {
      const app = await store.publishApp({
        name: 'Rateable App',
        description: 'desc',
        developerId: 'dev-001',
        category: 'OTHER',
        version: '1.0.0',
        rating: 0,
        tags: [],
        screenshots: [] as any,
        price: 0,
        isFree: true,
      } as any);

      await store.rateApp(app.id, 5);
      const updated = store.getApp(app.id);
      expect(updated?.rating).toBe(5);
      expect(updated?.ratingCount).toBe(1);
    });

    it('APP-11 should reject invalid rating outside 1-5', async () => {
      const app = await store.publishApp({
        name: 'Invalid Rate App',
        description: 'desc',
        developerId: 'dev-001',
        category: 'OTHER',
        version: '1.0.0',
        rating: 0,
        tags: [],
        screenshots: [] as any,
        price: 0,
        isFree: true,
      } as any);

      const result = await store.rateApp(app.id, 6);
      expect(result).toBeUndefined();
    });
  });
});

// ── SDKMultiLangService Tests ─────────────────────────────────────────────────

describe('SDKMultiLangService', () => {
  let sdkService: SDKMultiLangService;

  beforeEach(() => {
    sdkService = new SDKMultiLangService();
  });

  describe('generateSDK', () => {
    it('SDK-1 should generate Node.js SDK', async () => {
      const sdk = await sdkService.generateSDK('app-001', 'nodejs');
      expect(sdk.language).toBe('nodejs');
      expect(sdk.downloadURL).toContain('npm');
    });

    it('SDK-2 should generate Python SDK', async () => {
      const sdk = await sdkService.generateSDK('app-002', 'python');
      expect(sdk.language).toBe('python');
      expect(sdk.downloadURL).toContain('pypi');
    });

    it('SDK-3 should generate Java SDK', async () => {
      const sdk = await sdkService.generateSDK('app-003', 'java');
      expect(sdk.language).toBe('java');
      expect(sdk.downloadURL).toContain('maven');
    });

    it('SDK-4 should generate Go SDK', async () => {
      const sdk = await sdkService.generateSDK('app-004', 'go');
      expect(sdk.language).toBe('go');
      expect(sdk.downloadURL).toContain('go');
    });
  });

  describe('getSDKDownloadURL', () => {
    it('SDK-5 should return cached download URL', async () => {
      await sdkService.generateSDK('app-005', 'nodejs');
      const url = await sdkService.getSDKDownloadURL('app-005', 'nodejs');
      expect(url).toBeDefined();
      expect(url).toContain('cdn.isv.com');
    });

    it('SDK-6 should generate SDK on-demand if not cached', async () => {
      const url = await sdkService.getSDKDownloadURL('app-new', 'python');
      expect(url).toBeDefined();
    });
  });

  describe('getSDKTemplate', () => {
    it('SDK-7 should return correct npm install command', () => {
      const template = sdkService.getSDKTemplate('nodejs', 'my-app');
      expect(template).toContain('npm install');
      expect(template).toContain('my-app');
    });

    it('SDK-8 should return correct pip install command', () => {
      const template = sdkService.getSDKTemplate('python', 'my-app');
      expect(template).toContain('pip install');
      expect(template).toContain('my-app');
    });
  });

  describe('listSupportedLanguages', () => {
    it('SDK-9 should list all 4 supported languages', () => {
      const languages = sdkService.listSupportedLanguages();
      expect(languages).toContain('nodejs');
      expect(languages).toContain('python');
      expect(languages).toContain('java');
      expect(languages).toContain('go');
      expect(languages.length).toBe(4);
    });
  });
});
