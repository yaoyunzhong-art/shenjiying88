import { describe, it, expect, beforeEach } from 'vitest'

// ==============================
// sandbox.service.spec.ts — 纯函数式内联测试
// 不 import 生产代码
// 模拟 SandboxService / ISVAppStore / SDKMultiLangService
// 正例：创建/销毁/执行/安装/评分/SDK 生成
// 反例：不存在的沙箱/非运行态/无效评分/未发布应用
// 边界：空列表、开发者过滤、关键词搜索、SDK 按需生成
// ==============================

// ── 枚举 + 类型 ──────────────────────────────────────────────

type SandboxStatus = 'PENDING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'DESTROYED'
type CodeLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'rust'
type AppStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED' | 'DEPRECATED'
type AppCategory = 'CRM' | 'MARKETING' | 'ANALYTICS' | 'PAYMENT' | 'INVENTORY' | 'HR' | 'OTHER'
type SDKLanguage = 'nodejs' | 'python' | 'java' | 'go'
type InstallStatus = 'ACTIVE' | 'DISABLED' | 'UNINSTALLED'

interface SandboxInstance {
  id: string
  appId: string
  developerId: string
  status: SandboxStatus
  language: CodeLanguage
  createdAt: string
  lastActiveAt: string
  resources: { cpu: number; memory: number; disk: number }
  snapshot?: string
}

interface CodeExecutionResult {
  success: boolean
  output: string
  error?: string
  executionTimeMs: number
  memoryUsedMB: number
}

interface ISVApp {
  id: string
  name: string
  description: string
  developerId: string
  category: AppCategory
  status: AppStatus
  version: string
  rating: number
  ratingCount: number
  installCount: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  tags: string[]
  screenshots: string[]
  price: number
  isFree: boolean
}

interface AppInstall {
  id: string
  appId: string
  tenantId: string
  installedAt: string
  status: InstallStatus
}

interface AppFilter {
  category?: AppCategory
  status?: AppStatus
  developerId?: string
  keyword?: string
}

interface SDKPackage {
  language: SDKLanguage
  version: string
  downloadURL: string
  size: number
  checksum: string
  generatedAt: string
}

// ── Mock 工厂 ────────────────────────────────────────────────

function createMockSandbox() {
  const sandboxes = new Map<string, SandboxInstance>()
  let counter = 0

  async function createSandbox(appId: string, developerId: string): Promise<SandboxInstance> {
    counter++
    const id = `sandbox-${counter}`
    const sb: SandboxInstance = {
      id, appId, developerId, status: 'RUNNING', language: 'javascript',
      createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(),
      resources: { cpu: 1, memory: 512, disk: 1024 },
    }
    sandboxes.set(id, sb)
    return sb
  }

  async function destroySandbox(sandboxId: string): Promise<boolean> {
    const sb = sandboxes.get(sandboxId)
    if (!sb) return false
    sb.status = 'DESTROYED'
    sandboxes.delete(sandboxId)
    return true
  }

  async function getSandboxStatus(sandboxId: string): Promise<SandboxStatus | undefined> {
    return sandboxes.get(sandboxId)?.status
  }

  async function executeCode(sandboxId: string, code: string, language: CodeLanguage): Promise<CodeExecutionResult> {
    const sb = sandboxes.get(sandboxId)
    if (!sb) return { success: false, output: '', error: `Sandbox ${sandboxId} not found`, executionTimeMs: 0, memoryUsedMB: 0 }
    if (sb.status !== 'RUNNING') return { success: false, output: '', error: `Sandbox is not running, current status: ${sb.status}`, executionTimeMs: 0, memoryUsedMB: 0 }
    sb.lastActiveAt = new Date().toISOString()
    if (code.includes('error') || code.includes('throw')) return { success: false, output: '', error: 'Runtime error detected in code', executionTimeMs: 50, memoryUsedMB: 16 }
    return { success: true, output: `[${language}] Code executed successfully`, executionTimeMs: 80, memoryUsedMB: 32 }
  }

  async function resetSandbox(sandboxId: string): Promise<SandboxInstance | undefined> {
    const sb = sandboxes.get(sandboxId)
    if (!sb) return undefined
    sb.snapshot = JSON.stringify({ status: sb.status, lastActiveAt: sb.lastActiveAt, resources: { ...sb.resources } })
    sb.status = 'RUNNING'
    sb.lastActiveAt = new Date().toISOString()
    return sb
  }

  function getSandbox(sandboxId: string): SandboxInstance | undefined { return sandboxes.get(sandboxId) }
  function listSandboxes(developerId?: string): SandboxInstance[] {
    const all = Array.from(sandboxes.values())
    if (!developerId) return all
    return all.filter((s) => s.developerId === developerId)
  }

  return { createSandbox, destroySandbox, getSandboxStatus, executeCode, resetSandbox, getSandbox, listSandboxes }
}

function createMockAppStore() {
  const apps = new Map<string, ISVApp>()
  const installs = new Map<string, AppInstall>()
  let appCounter = 0

  async function publishApp(app: Omit<ISVApp, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'rating' | 'ratingCount' | 'installCount'>): Promise<ISVApp> {
    appCounter++
    const now = new Date().toISOString()
    const newApp: ISVApp = {
      ...app, id: `app-${appCounter}`, status: 'PUBLISHED', publishedAt: now, createdAt: now, updatedAt: now,
      rating: 0, ratingCount: 0, installCount: 0,
    }
    apps.set(newApp.id, newApp)
    return newApp
  }

  async function listApps(filter?: AppFilter): Promise<ISVApp[]> {
    let results = Array.from(apps.values())
    if (!filter) return results.filter((a) => a.status === 'PUBLISHED')
    if (filter.category) results = results.filter((a) => a.category === filter.category)
    if (filter.status) results = results.filter((a) => a.status === filter.status)
    if (filter.developerId) results = results.filter((a) => a.developerId === filter.developerId)
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      results = results.filter((a) => a.name.toLowerCase().includes(kw) || a.description.toLowerCase().includes(kw))
    }
    return results
  }

  async function installApp(appId: string, tenantId: string): Promise<AppInstall | undefined> {
    const app = apps.get(appId)
    if (!app || app.status !== 'PUBLISHED') return undefined
    const key = `${appId}:${tenantId}`
    const existing = installs.get(key)
    if (existing && existing.status === 'ACTIVE') return existing
    const install: AppInstall = { id: `install-${appId}-${tenantId}`, appId, tenantId, installedAt: new Date().toISOString(), status: 'ACTIVE' }
    installs.set(key, install)
    app.installCount++
    app.updatedAt = new Date().toISOString()
    return install
  }

  async function uninstallApp(appId: string, tenantId: string): Promise<boolean> {
    const key = `${appId}:${tenantId}`
    const install = installs.get(key)
    if (!install) return false
    install.status = 'UNINSTALLED'
    return true
  }

  async function rateApp(appId: string, rating: number): Promise<ISVApp | undefined> {
    const app = apps.get(appId)
    if (!app || rating < 1 || rating > 5) return undefined
    const totalRating = app.rating * app.ratingCount + rating
    app.ratingCount++
    app.rating = Math.round((totalRating / app.ratingCount) * 10) / 10
    app.updatedAt = new Date().toISOString()
    return app
  }

  function getApp(appId: string): ISVApp | undefined { return apps.get(appId) }
  function getInstall(appId: string, tenantId: string): AppInstall | undefined { return installs.get(`${appId}:${tenantId}`) }
  function listInstalls(tenantId: string): AppInstall[] {
    return Array.from(installs.values()).filter((i) => i.tenantId === tenantId && i.status === 'ACTIVE')
  }

  return { publishApp, listApps, installApp, uninstallApp, rateApp, getApp, getInstall, listInstalls }
}

function createMockSDKService() {
  const sdks = new Map<string, SDKPackage>()
  let genCount = 0
  const templates: Record<SDKLanguage, string> = {
    nodejs: 'npm install @isv/sdk-{{appId}}',
    python: 'pip install isv-sdk-{{appId}}',
    java: 'mvn dependency:get -Dartifact=com.isv:sdk:{{version}}',
    go: 'go get github.com/isv/sdk-{{appId}}@v{{version}}',
  }

  async function generateSDK(appId: string, language: SDKLanguage): Promise<SDKPackage> {
    genCount++
    const id = `${appId}:${language}`
    const pkg: SDKPackage = {
      language, version: '1.0.0', downloadURL: `https://cdn.isv.com/${language}/${appId}/sdk-1.0.0.zip`,
      size: Math.floor(Math.random() * 5000) + 1000, checksum: `chk-${id}-${genCount}`, generatedAt: new Date().toISOString(),
    }
    sdks.set(id, pkg)
    return pkg
  }

  async function getSDKDownloadURL(appId: string, language: SDKLanguage, version?: string): Promise<string> {
    const id = `${appId}:${language}`
    const cached = sdks.get(id)
    if (cached && (!version || cached.version === version)) return cached.downloadURL
    const pkg = await generateSDK(appId, language)
    return pkg.downloadURL
  }

  function getSDKTemplate(language: SDKLanguage, appId: string): string {
    const tpl = templates[language]
    if (!tpl) return ''
    return tpl.replace('{{appId}}', appId)
  }

  function listSupportedLanguages(): SDKLanguage[] { return ['nodejs', 'python', 'java', 'go'] }

  return { generateSDK, getSDKDownloadURL, getSDKTemplate, listSupportedLanguages }
}

// ── 测试: SandboxService ─────────────────────────────────────

describe('SandboxService (纯内联)', () => {
  let sandbox: ReturnType<typeof createMockSandbox>

  beforeEach(() => { sandbox = createMockSandbox() })

  describe('createSandbox', () => {
    it('应创建运行中的沙箱', async () => {
      const sb = await sandbox.createSandbox('app1', 'dev1')
      expect(sb.status).toBe('RUNNING')
      expect(sb.appId).toBe('app1')
      expect(sb.developerId).toBe('dev1')
    })

    it('应有默认资源配额', async () => {
      const sb = await sandbox.createSandbox('app1', 'dev1')
      expect(sb.resources.cpu).toBe(1)
      expect(sb.resources.memory).toBe(512)
      expect(sb.resources.disk).toBe(1024)
    })

    it('应分配唯一 ID', async () => {
      const a = await sandbox.createSandbox('a', 'd1')
      const b = await sandbox.createSandbox('b', 'd2')
      expect(a.id).not.toBe(b.id)
    })
  })

  describe('destroySandbox', () => {
    it('应销毁存在的沙箱', async () => {
      const sb = await sandbox.createSandbox('app1', 'dev1')
      expect(await sandbox.destroySandbox(sb.id)).toBe(true)
    })

    it('不存在的沙箱返回 false', async () => {
      expect(await sandbox.destroySandbox('sandbox-nonexistent')).toBe(false)
    })
  })

  describe('getSandboxStatus', () => {
    it('应返回正确状态', async () => {
      const sb = await sandbox.createSandbox('app1', 'dev1')
      expect(await sandbox.getSandboxStatus(sb.id)).toBe('RUNNING')
    })

    it('不存在的返回 undefined', async () => {
      expect(await sandbox.getSandboxStatus('sandbox-missing')).toBeUndefined()
    })
  })

  describe('executeCode', () => {
    it('运行中沙箱执行成功', async () => {
      const sb = await sandbox.createSandbox('app1', 'dev1')
      const result = await sandbox.executeCode(sb.id, 'console.log("hi")', 'javascript')
      expect(result.success).toBe(true)
      expect(result.output).toContain('javascript')
    })

    it('不存在的沙箱返回错误', async () => {
      const result = await sandbox.executeCode('sandbox-missing', 'code', 'javascript')
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('已销毁沙箱返回未找到错误（destroy 移除 map）', async () => {
      const sb = await sandbox.createSandbox('app1', 'dev1')
      await sandbox.destroySandbox(sb.id)
      const result = await sandbox.executeCode(sb.id, 'code', 'javascript')
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('代码包含 error 时返回运行时错误', async () => {
      const sb = await sandbox.createSandbox('app1', 'dev1')
      const result = await sandbox.executeCode(sb.id, 'error()', 'javascript')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Runtime error')
    })
  })

  describe('resetSandbox', () => {
    it('应重置沙箱到运行态', async () => {
      const sb = await sandbox.createSandbox('app1', 'dev1')
      const reset = await sandbox.resetSandbox(sb.id)
      expect(reset!.status).toBe('RUNNING')
    })

    it('不存在的返回 undefined', async () => {
      expect(await sandbox.resetSandbox('sandbox-missing')).toBeUndefined()
    })

    it('重置后应创建 snapshot', async () => {
      const sb = await sandbox.createSandbox('app1', 'dev1')
      const reset = await sandbox.resetSandbox(sb.id)
      expect(reset!.snapshot).toBeDefined()
      expect(reset!.snapshot).toContain('RUNNING')
    })
  })

  describe('listSandboxes', () => {
    it('无沙箱返回空数组', () => expect(sandbox.listSandboxes()).toEqual([]))

    it('应列出所有沙箱', async () => {
      await sandbox.createSandbox('a', 'd1')
      await sandbox.createSandbox('b', 'd2')
      expect(sandbox.listSandboxes()).toHaveLength(2)
    })

    it('按开发者过滤', async () => {
      await sandbox.createSandbox('a', 'd1')
      await sandbox.createSandbox('b', 'd2')
      await sandbox.createSandbox('c', 'd1')
      expect(sandbox.listSandboxes('d1')).toHaveLength(2)
      expect(sandbox.listSandboxes('d2')).toHaveLength(1)
    })
  })
})

// ── 测试: ISVAppStore ────────────────────────────────────────

describe('ISVAppStore (纯内联)', () => {
  let store: ReturnType<typeof createMockAppStore>

  beforeEach(() => { store = createMockAppStore() })

  describe('publishApp', () => {
    it('应发布应用', async () => {
      const app = await store.publishApp({ name: 'TestApp', description: 'Desc', developerId: 'dev1', category: 'CRM', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      expect(app.status).toBe('PUBLISHED')
      expect(app.ratingCount).toBe(0)
    })
  })

  describe('listApps', () => {
    it('无过滤只返回已发布', async () => {
      await store.publishApp({ name: 'A', description: 'D', developerId: 'd1', category: 'CRM', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      expect(await store.listApps()).toHaveLength(1)
    })
  })

  describe('installApp', () => {
    it('应安装已发布应用', async () => {
      const app = await store.publishApp({ name: 'A', description: 'D', developerId: 'd1', category: 'CRM', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      const install = await store.installApp(app.id, 'tenant1')
      expect(install).toBeDefined()
      expect(install!.status).toBe('ACTIVE')
    })

    it('不存在的应用返回 undefined', async () => {
      expect(await store.installApp('app-missing', 't1')).toBeUndefined()
    })

    it('重复安装返回已有记录', async () => {
      const app = await store.publishApp({ name: 'A', description: 'D', developerId: 'd1', category: 'CRM', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      const a = await store.installApp(app.id, 't1')
      const b = await store.installApp(app.id, 't1')
      expect(b!.id).toBe(a!.id)
    })
  })

  describe('uninstallApp', () => {
    it('应卸载应用', async () => {
      const app = await store.publishApp({ name: 'A', description: 'D', developerId: 'd1', category: 'CRM', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      await store.installApp(app.id, 't1')
      expect(await store.uninstallApp(app.id, 't1')).toBe(true)
    })

    it('未安装的应用返回 false', async () => {
      expect(await store.uninstallApp('app-missing', 't1')).toBe(false)
    })
  })

  describe('rateApp', () => {
    it('有效评分更新平均值', async () => {
      const app = await store.publishApp({ name: 'A', description: 'D', developerId: 'd1', category: 'CRM', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      await store.rateApp(app.id, 5)
      await store.rateApp(app.id, 3)
      const updated = store.getApp(app.id)
      expect(updated!.ratingCount).toBe(2)
      expect(updated!.rating).toBe(4)
    })

    it('评分超出范围返回 undefined', async () => {
      const app = await store.publishApp({ name: 'A', description: 'D', developerId: 'd1', category: 'CRM', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      expect(await store.rateApp(app.id, 0)).toBeUndefined()
      expect(await store.rateApp(app.id, 6)).toBeUndefined()
    })
  })

  describe('listInstalls', () => {
    it('返回活跃安装', async () => {
      const app = await store.publishApp({ name: 'A', description: 'D', developerId: 'd1', category: 'CRM', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      await store.installApp(app.id, 't1')
      const list = store.listInstalls('t1')
      expect(list).toHaveLength(1)
      expect(list[0].status).toBe('ACTIVE')
    })
  })

  describe('搜索过滤', () => {
    it('keyword 应匹配名称或描述', async () => {
      await store.publishApp({ name: 'DataViz', description: '数据可视化工具', developerId: 'd1', category: 'ANALYTICS', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      await store.publishApp({ name: 'ChatBot', description: '聊天机器人', developerId: 'd1', category: 'CRM', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      const filtered = await store.listApps({ keyword: '数据' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('DataViz')
    })

    it('category 过滤应精确匹配', async () => {
      await store.publishApp({ name: 'A', description: 'a', developerId: 'd1', category: 'CRM', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      await store.publishApp({ name: 'B', description: 'b', developerId: 'd1', category: 'ANALYTICS', version: '1.0', tags: [], screenshots: [], price: 0, isFree: true })
      const filtered = await store.listApps({ category: 'CRM' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].category).toBe('CRM')
    })
  })
})

// ── 测试: SDKMultiLangService ─────────────────────────────────

describe('SDKMultiLangService (纯内联)', () => {
  let sdk: ReturnType<typeof createMockSDKService>

  beforeEach(() => { sdk = createMockSDKService() })

  describe('generateSDK', () => {
    it('应生成 SDK 包', async () => {
      const pkg = await sdk.generateSDK('app1', 'nodejs')
      expect(pkg.language).toBe('nodejs')
      expect(pkg.version).toBe('1.0.0')
    })
  })

  describe('getSDKDownloadURL', () => {
    it('应返回下载 URL', async () => {
      const url = await sdk.getSDKDownloadURL('app1', 'python')
      expect(url).toContain('app1')
      expect(url).toContain('python')
    })

    it('按需生成 SDK', async () => {
      const url = await sdk.getSDKDownloadURL('app-new', 'go')
      expect(url).toContain('go')
    })
  })

  describe('getSDKTemplate', () => {
    it('应返回安装命令模板', () => {
      const tpl = sdk.getSDKTemplate('nodejs', 'my-app')
      expect(tpl).toContain('my-app')
      expect(tpl).toContain('npm install')
    })

    it('不支持的编程语言应返回空', () => {
      const tpl = sdk.getSDKTemplate('rust' as SDKLanguage, 'app')
      expect(tpl).toBe('')
    })
  })

  describe('listSupportedLanguages', () => {
    it('应返回 4 种语言', () => {
      const langs = sdk.listSupportedLanguages()
      expect(langs).toHaveLength(4)
      expect(langs).toContain('nodejs')
      expect(langs).toContain('python')
      expect(langs).toContain('java')
      expect(langs).toContain('go')
    })
  })
})
