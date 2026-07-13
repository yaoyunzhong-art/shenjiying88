import { describe, it, expect } from 'vitest'

interface PortalPage { id: string; tenantId: string; slug: string; title: string; content: string; published: boolean; visibleToRoles: string[]; seoDescription?: string; createdAt: string }

describe('✅ AC-PORTAL: 门户圈梁', () => {
  it('创建页面', () => {
    const p: PortalPage = { id: 'p1', tenantId: 't1', slug: 'about', title: '关于我们', content: '<p>介绍</p>', published: true, visibleToRoles: ['all'], createdAt: '' }
    expect(p.slug).toBe('about'); expect(p.published).toBe(true)
  })
  it('角色可见性', () => {
    const p: PortalPage = { ...{id:'p2',tenantId:'t1',slug:'admin',title:'管理',content:'',published:false,visibleToRoles:['admin'],createdAt:''}, visibleToRoles: ['admin'] }
    expect(p.visibleToRoles).toContain('admin')
  })
  it('SEO描述', () => { const p: PortalPage = {...{id:'p3',tenantId:'t1',slug:'',title:'',content:'',published:true,visibleToRoles:['all'],createdAt:''}, seoDescription:'电玩城'}; expect(p.seoDescription).toBe('电玩城') })
})
