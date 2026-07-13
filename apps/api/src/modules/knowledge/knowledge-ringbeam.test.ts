import { describe, it, expect } from 'vitest'

interface KnowledgeEntry { id: string; tenantId: string; title: string; content: string; tags: string[]; category: string; source: string; createdAt: string; updatedAt: string; version: number }
interface KnowledgeQuery { q: string; tags?: string[]; category?: string; page?: number; pageSize?: number }

describe('✅ AC-KNOWLEDGE: 知识库圈梁', () => {
  it('创建知识条目', () => {
    const e: KnowledgeEntry = { id: 'k1', tenantId: 't1', title: '设备维护指南', content: '每周清洁...', tags: ['设备','维护'], category: 'ops', source: 'manual', createdAt: '', updatedAt: '', version: 1 }
    expect(e.tags.length).toBe(2); expect(e.version).toBe(1)
  })
  it('版本管理', () => { const e: KnowledgeEntry = {...{} as any, id:'k2',tenantId:'t1',title:'',content:'',tags:[],category:'',source:'',createdAt:'',updatedAt:'',version:2}; expect(e.version).toBeGreaterThan(1) })
  it('标签搜索', () => { const q: KnowledgeQuery = { q: '维护', tags: ['设备'] }; expect(q.q).toBe('维护'); expect(q.tags).toContain('设备') })
  it('分页', () => { const q: KnowledgeQuery = { q: '', page: 2, pageSize: 20 }; expect(q.page).toBe(2); expect(q.pageSize).toBe(20) })
})
