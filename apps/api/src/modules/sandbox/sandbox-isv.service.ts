// sandbox-isv.service.ts - T116-2
// 沙箱环境 + ISV 应用商店服务
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SandboxStatus = 'PENDING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'DESTROYED';
export type CodeLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'rust';
export type AppStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED' | 'DEPRECATED';
export type AppCategory = 'CRM' | 'MARKETING' | 'ANALYTICS' | 'PAYMENT' | 'INVENTORY' | 'HR' | 'OTHER';
export type SDKLanguage = 'nodejs' | 'python' | 'java' | 'go';

export interface SandboxInstance {
  id: string;
  appId: string;
  developerId: string;
  status: SandboxStatus;
  language: CodeLanguage;
  createdAt: string;
  lastActiveAt: string;
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
  snapshot?: string;
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
  memoryUsedMB: number;
}

export interface ISVApp {
  id: string;
  name: string;
  description: string;
  developerId: string;
  category: AppCategory;
  status: AppStatus;
  version: string;
  rating: number;
  ratingCount: number;
  installCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  screenshots: string[];
  price: number;
  isFree: boolean;
}

export interface AppInstall {
  id: string;
  appId: string;
  tenantId: string;
  installedAt: string;
  status: 'ACTIVE' | 'DISABLED' | 'UNINSTALLED';
}

export interface AppFilter {
  category?: AppCategory;
  status?: AppStatus;
  developerId?: string;
  keyword?: string;
}

export interface SDKPackage {
  language: SDKLanguage;
  version: string;
  downloadURL: string;
  size: number;
  checksum: string;
  generatedAt: string;
}

// ── SandboxService ─────────────────────────────────────────────────────────────

@Injectable()
export class SandboxService {
  private readonly logger = new Logger(SandboxService.name);
  private readonly sandboxes = new Map<string, SandboxInstance>();

  async createSandbox(appId: string, developerId: string): Promise<SandboxInstance> {
    const sandbox: SandboxInstance = {
      id: `sandbox-${randomUUID()}`,
      appId,
      developerId,
      status: 'RUNNING',
      language: 'javascript',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      resources: {
        cpu: 1,
        memory: 512,
        disk: 1024,
      },
    };
    this.sandboxes.set(sandbox.id, sandbox);
    this.logger.log(`[sandbox ${sandbox.id}] created for app=${appId} developer=${developerId}`);
    return sandbox;
  }

  async destroySandbox(sandboxId: string): Promise<boolean> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      this.logger.warn(`[sandbox ${sandboxId}] not found`);
      return false;
    }
    sandbox.status = 'DESTROYED';
    this.sandboxes.delete(sandboxId);
    this.logger.log(`[sandbox ${sandboxId}] destroyed`);
    return true;
  }

  async getSandboxStatus(sandboxId: string): Promise<SandboxStatus | undefined> {
    const sandbox = this.sandboxes.get(sandboxId);
    return sandbox?.status;
  }

  async executeCode(
    sandboxId: string,
    code: string,
    language: CodeLanguage,
  ): Promise<CodeExecutionResult> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      return {
        success: false,
        output: '',
        error: `Sandbox ${sandboxId} not found`,
        executionTimeMs: 0,
        memoryUsedMB: 0,
      };
    }

    if (sandbox.status !== 'RUNNING') {
      return {
        success: false,
        output: '',
        error: `Sandbox is not running, current status: ${sandbox.status}`,
        executionTimeMs: 0,
        memoryUsedMB: 0,
      };
    }

    sandbox.lastActiveAt = new Date().toISOString();
    const startTime = Date.now();

    // Simulate code execution
    const result: CodeExecutionResult = {
      success: true,
      output: `[${language}] Code executed successfully`,
      executionTimeMs: Math.floor(Math.random() * 500) + 50,
      memoryUsedMB: Math.floor(Math.random() * 128) + 16,
    };

    // Simulate potential errors
    if (code.includes('throw') || code.includes('error')) {
      result.success = false;
      result.error = 'Runtime error detected in code';
      result.output = '';
    }

    this.logger.log(
      `[sandbox ${sandboxId}] executed ${language} code in ${result.executionTimeMs}ms`,
    );
    return result;
  }

  async resetSandbox(sandboxId: string): Promise<SandboxInstance | undefined> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      this.logger.warn(`[sandbox ${sandboxId}] not found`);
      return undefined;
    }

    // Create snapshot before reset
    sandbox.snapshot = JSON.stringify({
      status: sandbox.status,
      lastActiveAt: sandbox.lastActiveAt,
      resources: { ...sandbox.resources },
    });

    sandbox.status = 'RUNNING';
    sandbox.lastActiveAt = new Date().toISOString();
    this.logger.log(`[sandbox ${sandboxId}] reset to initial state`);
    return sandbox;
  }

  getSandbox(sandboxId: string): SandboxInstance | undefined {
    return this.sandboxes.get(sandboxId);
  }

  listSandboxes(developerId?: string): SandboxInstance[] {
    const all = Array.from(this.sandboxes.values());
    if (!developerId) return all;
    return all.filter((s) => s.developerId === developerId);
  }
}

// ── ISVAppStore ────────────────────────────────────────────────────────────────

@Injectable()
export class ISVAppStore {
  private readonly logger = new Logger(ISVAppStore.name);
  private readonly apps = new Map<string, ISVApp>();
  private readonly installs = new Map<string, AppInstall>();

  async publishApp(app: Omit<ISVApp, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'rating' | 'ratingCount' | 'installCount'>): Promise<ISVApp> {
    const now = new Date().toISOString();
    const newApp: ISVApp = {
      ...app,
      id: `app-${randomUUID()}`,
      status: 'PUBLISHED',
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      rating: 0,
      ratingCount: 0,
      installCount: 0,
    };
    this.apps.set(newApp.id, newApp);
    this.logger.log(`[appstore] published app ${newApp.id}: ${newApp.name}`);
    return newApp;
  }

  async listApps(filter?: AppFilter): Promise<ISVApp[]> {
    let results = Array.from(this.apps.values());

    if (!filter) {
      return results.filter((a) => a.status === 'PUBLISHED');
    }

    if (filter.category) {
      results = results.filter((a) => a.category === filter.category);
    }
    if (filter.status) {
      results = results.filter((a) => a.status === filter.status);
    }
    if (filter.developerId) {
      results = results.filter((a) => a.developerId === filter.developerId);
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase();
      results = results.filter(
        (a) =>
          a.name.toLowerCase().includes(kw) ||
          a.description.toLowerCase().includes(kw),
      );
    }

    return results;
  }

  async installApp(appId: string, tenantId: string): Promise<AppInstall | undefined> {
    const app = this.apps.get(appId);
    if (!app) {
      this.logger.warn(`[appstore] app ${appId} not found for install`);
      return undefined;
    }

    if (app.status !== 'PUBLISHED') {
      this.logger.warn(`[appstore] app ${appId} is not published, status: ${app.status}`);
      return undefined;
    }

    const installKey = `${appId}:${tenantId}`;
    const existing = this.installs.get(installKey);
    if (existing && existing.status === 'ACTIVE') {
      this.logger.warn(`[appstore] app ${appId} already installed for tenant ${tenantId}`);
      return existing;
    }

    const install: AppInstall = {
      id: `install-${randomUUID()}`,
      appId,
      tenantId,
      installedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    this.installs.set(installKey, install);

    // Increment install count
    app.installCount++;
    app.updatedAt = new Date().toISOString();

    this.logger.log(`[appstore] installed app ${appId} for tenant ${tenantId}`);
    return install;
  }

  async uninstallApp(appId: string, tenantId: string): Promise<boolean> {
    const installKey = `${appId}:${tenantId}`;
    const install = this.installs.get(installKey);

    if (!install) {
      this.logger.warn(`[appstore] install ${installKey} not found`);
      return false;
    }

    install.status = 'UNINSTALLED';
    this.logger.log(`[appstore] uninstalled app ${appId} from tenant ${tenantId}`);
    return true;
  }

  async rateApp(appId: string, rating: number): Promise<ISVApp | undefined> {
    const app = this.apps.get(appId);
    if (!app) {
      this.logger.warn(`[appstore] app ${appId} not found for rating`);
      return undefined;
    }

    if (rating < 1 || rating > 5) {
      this.logger.warn(`[appstore] invalid rating ${rating}, must be 1-5`);
      return undefined;
    }

    // Update weighted rating
    const totalRating = app.rating * app.ratingCount + rating;
    app.ratingCount++;
    app.rating = Math.round((totalRating / app.ratingCount) * 10) / 10;
    app.updatedAt = new Date().toISOString();

    this.logger.log(`[appstore] rated app ${appId} as ${rating}, new avg: ${app.rating}`);
    return app;
  }

  getApp(appId: string): ISVApp | undefined {
    return this.apps.get(appId);
  }

  getInstall(appId: string, tenantId: string): AppInstall | undefined {
    return this.installs.get(`${appId}:${tenantId}`);
  }

  listInstalls(tenantId: string): AppInstall[] {
    return Array.from(this.installs.values()).filter(
      (i) => i.tenantId === tenantId && i.status === 'ACTIVE',
    );
  }
}

// ── SDKMultiLangService ────────────────────────────────────────────────────────

@Injectable()
export class SDKMultiLangService {
  private readonly logger = new Logger(SDKMultiLangService.name);
  private readonly sdks = new Map<string, SDKPackage>();

  private readonly SDK_TEMPLATES: Record<SDKLanguage, string> = {
    nodejs: 'npm install @isv/sdk-{{appId}}',
    python: 'pip install isv-sdk-{{appId}}',
    java: 'mvn dependency:get -Dartifact=com.isv:sdk:{{version}}',
    go: 'go get github.com/isv/sdk-{{appId}}@v{{version}}',
  };

  async generateSDK(appId: string, language: SDKLanguage): Promise<SDKPackage> {
    const version = '1.0.0';
    const sdkId = `${appId}:${language}`;

    const pkg: SDKPackage = {
      language,
      version,
      downloadURL: this.buildDownloadURL(appId, language, version),
      size: Math.floor(Math.random() * 5000) + 1000,
      checksum: randomUUID().replace(/-/g, '').substring(0, 32),
      generatedAt: new Date().toISOString(),
    };

    this.sdks.set(sdkId, pkg);
    this.logger.log(
      `[sdk] generated ${language} SDK for app ${appId}, version ${version}`,
    );
    return pkg;
  }

  async getSDKDownloadURL(
    appId: string,
    language: SDKLanguage,
    version?: string,
  ): Promise<string> {
    const sdkId = `${appId}:${language}`;
    const sdk = this.sdks.get(sdkId);

    if (sdk && (!version || sdk.version === version)) {
      return sdk.downloadURL;
    }

    // Generate on-demand if not cached
    const pkg = await this.generateSDK(appId, language);
    return pkg.downloadURL;
  }

  getSDKTemplate(language: SDKLanguage, appId: string): string {
    const template = this.SDK_TEMPLATES[language];
    if (!template) {
      this.logger.warn(`[sdk] no template for language ${language}`);
      return '';
    }
    return template.replace('{{appId}}', appId);
  }

  listSupportedLanguages(): SDKLanguage[] {
    return ['nodejs', 'python', 'java', 'go'];
  }

  private buildDownloadURL(appId: string, language: SDKLanguage, version: string): string {
    const baseURLs: Record<SDKLanguage, string> = {
      nodejs: 'https://cdn.isv.com/npm',
      python: 'https://cdn.isv.com/pypi',
      java: 'https://cdn.isv.com/maven',
      go: 'https://cdn.isv.com/go',
    };
    const base = baseURLs[language];
    return `${base}/${appId}/sdk-${version}.zip`;
  }
}
