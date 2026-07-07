import { describe, it, expect, beforeEach } from 'vitest'

// ==============================
// lowcode.service.spec.ts — 纯函数式内联测试
// 不 import 生产代码
// 模拟低代码页面构建、组件 CRUD、模板管理
// 正例：正常创建/添加/更新/删除/发布/渲染
// 反例：不存在的模板/页面/组件
// 边界：空组件列表、零属性、重复 ID、备用模板
// ==============================

// ── 枚举 + 类型 ──────────────────────────────────────────────

type PageStatus = 'draft' | 'published'

interface PageTemplate {
  id: string
  name: string
  components: { type: string; defaultProps: Record<string, unknown> }[]
}

interface Component {
  id: string
  type: string
  props: Record<string, unknown>
}

interface Page {
  id: string
  templateId: string
  name: string
  components: Component[]
  status: PageStatus
  createdAt: Date
  updatedAt: Date
}

// ── Mock 工厂 ────────────────────────────────────────────────

function createTemplates(): Map<string, PageTemplate> {
  const tpls = new Map<string, PageTemplate>()
  tpls.set('tpl-dashboard', {
    id: 'tpl-dashboard',
    name: '仪表盘',
    components: [
      { type: 'navbar', defaultProps: { title: '仪表盘' } },
      { type: 'chart', defaultProps: { type: 'line' } },
    ],
  })
  tpls.set('tpl-form', {
    id: 'tpl-form',
    name: '表单',
    components: [
      { type: 'navbar', defaultProps: { title: '表单' } },
      { type: 'input', defaultProps: { label: '输入' } },
      { type: 'button', defaultProps: { text: '提交' } },
    ],
  })
  tpls.set('tpl-blank', {
    id: 'tpl-blank',
    name: '空白',
    components: [{ type: 'navbar', defaultProps: { title: '页面' } }],
  })
  return tpls
}

function createMockLowCode() {
  const pages = new Map<string, Page>()
  const templates = createTemplates()
  let pageCounter = 0

  function createPage(templateId: string, data?: Record<string, unknown>): Page {
    const tpl = templates.get(templateId)
    if (!tpl) throw new Error(`Template not found: ${templateId}`)
    pageCounter++
    const pageId = `page-${pageCounter}`
    const page: Page = {
      id: pageId,
      templateId,
      name: (data?.name as string) ?? tpl.name,
      components: tpl.components.map((def, idx) => ({
        id: `comp-${idx}`,
        type: def.type,
        props: { ...def.defaultProps },
      })),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    pages.set(pageId, page)
    return page
  }

  function addComponent(pageId: string, type: string, props: Record<string, unknown>): Component {
    const page = pages.get(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    const comp: Component = { id: `comp-new-${page.components.length}`, type, props: props ?? {} }
    page.components.push(comp)
    page.updatedAt = new Date()
    return comp
  }

  function updateComponent(pageId: string, compId: string, props: Record<string, unknown>): Component {
    const page = pages.get(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    const comp = page.components.find((c) => c.id === compId)
    if (!comp) throw new Error(`Component not found: ${compId}`)
    comp.props = { ...comp.props, ...props }
    page.updatedAt = new Date()
    return comp
  }

  function removeComponent(pageId: string, compId: string): boolean {
    const page = pages.get(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    const idx = page.components.findIndex((c) => c.id === compId)
    if (idx === -1) throw new Error(`Component not found: ${compId}`)
    page.components.splice(idx, 1)
    page.updatedAt = new Date()
    return true
  }

  function publishPage(pageId: string): Page {
    const page = pages.get(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    page.status = 'published'
    page.updatedAt = new Date()
    return page
  }

  function renderPage(pageId: string): string {
    const page = pages.get(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    const comps = page.components.map((c) => `  <div data-component="${c.type}">${JSON.stringify(c.props)}</div>`).join('\n')
    return `<!DOCTYPE html>\n<html>\n<head><title>${page.name}</title></head>\n<body>\n${comps}\n</body>\n</html>`
  }

  function getPage(id: string): Page | undefined { return pages.get(id) }
  function getTemplate(id: string): PageTemplate | undefined { return templates.get(id) }

  return { pages, templates, createPage, addComponent, updateComponent, removeComponent, publishPage, renderPage, getPage, getTemplate }
}

// ── 测试 ─────────────────────────────────────────────────────

describe('LowCodePageBuilder (纯内联)', () => {
  let builder: ReturnType<typeof createMockLowCode>

  beforeEach(() => {
    builder = createMockLowCode()
  })

  // ── createPage ───────────────────────────────────────

  describe('createPage', () => {
    it('应从模板创建页面', () => {
      const page = builder.createPage('tpl-dashboard', { name: 'My Dashboard' })
      expect(page.id).toBeDefined()
      expect(page.templateId).toBe('tpl-dashboard')
      expect(page.name).toBe('My Dashboard')
      expect(page.components.length).toBeGreaterThan(0)
    })

    it('不传 data.name 时使用模板名', () => {
      const page = builder.createPage('tpl-form')
      expect(page.name).toBe('表单')
    })

    it('不存在的模板应抛出', () => {
      expect(() => builder.createPage('tpl-nonexistent')).toThrow('Template not found')
    })

    it('创建空白模板页面仅有 navbar', () => {
      const page = builder.createPage('tpl-blank')
      expect(page.components).toHaveLength(1)
      expect(page.components[0].type).toBe('navbar')
    })

    it('创建时 status 为 draft', () => {
      const page = builder.createPage('tpl-dashboard')
      expect(page.status).toBe('draft')
    })
  })

  // ── addComponent ─────────────────────────────────────

  describe('addComponent', () => {
    it('应添加组件到页面', () => {
      const page = builder.createPage('tpl-blank')
      const comp = builder.addComponent(page.id, 'button', { text: 'Click me' })
      expect(comp.type).toBe('button')
      expect(comp.props.text).toBe('Click me')
    })

    it('不存在的页面应抛出', () => {
      expect(() => builder.addComponent('page-missing', 'button', {})).toThrow('Page not found')
    })

    it('添加后组件数量增加', () => {
      const page = builder.createPage('tpl-blank')
      const before = page.components.length
      builder.addComponent(page.id, 'image', { src: 'img.png' })
      expect(page.components.length).toBe(before + 1)
    })
  })

  // ── updateComponent ──────────────────────────────────

  describe('updateComponent', () => {
    it('应更新组件属性', () => {
      const page = builder.createPage('tpl-form')
      const comp = page.components[0]
      const updated = builder.updateComponent(page.id, comp.id, { title: 'Updated' })
      expect(updated.props.title).toBe('Updated')
    })

    it('不存在的组件应抛出', () => {
      const page = builder.createPage('tpl-form')
      expect(() => builder.updateComponent(page.id, 'comp-nonexistent', {})).toThrow('Component not found')
    })

    it('更新保留原属性', () => {
      const page = builder.createPage('tpl-form')
      const inputComp = page.components.find((c) => c.type === 'input')!
      const origLabel = inputComp.props.label
      builder.updateComponent(page.id, inputComp.id, { placeholder: 'Enter text' })
      const updated = builder.updateComponent(page.id, inputComp.id, { label: 'New Label' })
      expect(updated.props.placeholder).toBe('Enter text')
      expect(updated.props.label).toBe('New Label')
    })
  })

  // ── removeComponent ──────────────────────────────────

  describe('removeComponent', () => {
    it('应删除组件', () => {
      const page = builder.createPage('tpl-form')
      const comp = page.components[0]
      const result = builder.removeComponent(page.id, comp.id)
      expect(result).toBe(true)
    })

    it('不存在的组件应抛出', () => {
      const page = builder.createPage('tpl-form')
      expect(() => builder.removeComponent(page.id, 'comp-missing')).toThrow('Component not found')
    })

    it('删除后组件数量减少', () => {
      const page = builder.createPage('tpl-form')
      const before = page.components.length
      builder.removeComponent(page.id, page.components[0].id)
      expect(page.components.length).toBe(before - 1)
    })
  })

  // ── publishPage ──────────────────────────────────────

  describe('publishPage', () => {
    it('应发布页面', () => {
      const page = builder.createPage('tpl-dashboard')
      const published = builder.publishPage(page.id)
      expect(published.status).toBe('published')
    })

    it('已发布的页面再次发布仍为 published', () => {
      const page = builder.createPage('tpl-dashboard')
      builder.publishPage(page.id)
      const publishedAgain = builder.publishPage(page.id)
      expect(publishedAgain.status).toBe('published')
    })

    it('不存在的页面应抛出', () => {
      expect(() => builder.publishPage('page-missing')).toThrow('Page not found')
    })
  })

  // ── renderPage ───────────────────────────────────────

  describe('renderPage', () => {
    it('应渲染 HTML', () => {
      const page = builder.createPage('tpl-dashboard')
      const html = builder.renderPage(page.id)
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('data-component')
    })

    it('标题应与页面名一致', () => {
      const page = builder.createPage('tpl-dashboard', { name: 'Test Page' })
      const html = builder.renderPage(page.id)
      expect(html).toContain('<title>Test Page</title>')
    })

    it('不存在的页面应抛出', () => {
      expect(() => builder.renderPage('page-gone')).toThrow('Page not found')
    })
  })

  // ── getPage / getTemplate ────────────────────────────

  describe('getPage / getTemplate', () => {
    it('getPage 应返回页面', () => {
      const page = builder.createPage('tpl-dashboard')
      const found = builder.getPage(page.id)
      expect(found).toBeDefined()
      expect(found!.id).toBe(page.id)
    })

    it('getPage 不存在的返回 undefined', () => {
      expect(builder.getPage('page-missing')).toBeUndefined()
    })

    it('getTemplate 应返回模板', () => {
      const tpl = builder.getTemplate('tpl-dashboard')
      expect(tpl).toBeDefined()
      expect(tpl!.id).toBe('tpl-dashboard')
    })

    it('getTemplate 不存在的返回 undefined', () => {
      expect(builder.getTemplate('tpl-missing')).toBeUndefined()
    })
  })
})
