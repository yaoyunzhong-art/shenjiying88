import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  DETAIL_WORKSPACE_REGISTRY,
  buildStandardBreadcrumb,
  buildStandardClosureLinks,
  lookupWorkspaceMeta
} from './components/detail-workspace-registry'

describe('DETAIL_WORKSPACE_REGISTRY', () => {
  test('contains all simple-resource workspaces', () => {
    for (const key of [
      'brands', 'markets', 'staff', 'tenants', 'notifications',
      'stores', 'members', 'approvals', 'alerts', 'operations'
    ]) {
      const meta = DETAIL_WORKSPACE_REGISTRY[key]
      assert.ok(meta, `registry should have ${key}`)
      assert.ok(meta.href.startsWith('/'), `href should start with /`)
      assert.ok(meta.breadcrumbLabel.length > 0, `breadcrumbLabel should be non-empty`)
      assert.ok(meta.closureLabel.length > 0, `closureLabel should be non-empty`)
    }
  })

  test('lookupWorkspaceMeta returns undefined for unknown key', () => {
    assert.equal(lookupWorkspaceMeta('does-not-exist'), undefined)
  })

  test('lookupWorkspaceMeta returns meta for known key', () => {
    const meta = lookupWorkspaceMeta('brands')
    assert.ok(meta)
    assert.equal(meta?.breadcrumbLabel, '品牌管理')
  })

  test('lookupWorkspaceMeta works for stores', () => {
    const meta = lookupWorkspaceMeta('stores')
    assert.ok(meta)
    assert.equal(meta?.breadcrumbLabel, '门店管理')
  })

  test('every registry entry is unique by key', () => {
    const keys = Object.keys(DETAIL_WORKSPACE_REGISTRY)
    assert.equal(new Set(keys).size, keys.length)
  })

  test('all href values start with / and have no double slash', () => {
    for (const [key, meta] of Object.entries(DETAIL_WORKSPACE_REGISTRY)) {
      assert.ok(meta.href.startsWith('/'), `${key}: href should start with /`)
      assert.ok(!meta.href.includes('//'), `${key}: no double slash`)
    }
  })

  test('all entries have minimum label length', () => {
    for (const [key, meta] of Object.entries(DETAIL_WORKSPACE_REGISTRY)) {
      assert.ok(meta.breadcrumbLabel.length >= 2, `${key}: breadcrumbLabel >= 2`)
      assert.ok(meta.closureLabel.length >= 2, `${key}: closureLabel >= 2`)
    }
  })

  test('href for each workspace does not end with trailing slash', () => {
    for (const [key, meta] of Object.entries(DETAIL_WORKSPACE_REGISTRY)) {
      if (meta.href.length > 1) {
        assert.ok(!meta.href.endsWith('/'), `${key}: no trailing slash`)
      }
    }
  })
})

describe('buildStandardBreadcrumb', () => {
  test('returns workspaceLabel / workspaceHref / detailLabel', () => {
    const crumb = buildStandardBreadcrumb({ workspace: 'brands', detailLabel: '星巴克' })
    assert.deepEqual(crumb, {
      workspaceLabel: '品牌管理',
      workspaceHref: '/brands',
      detailLabel: '星巴克'
    })
  })

  test('accepts breadcrumbLabel override', () => {
    const crumb = buildStandardBreadcrumb({
      workspace: 'brands',
      detailLabel: '星巴克',
      breadcrumbLabel: '品牌库'
    })
    assert.equal(crumb.workspaceLabel, '品牌库')
  })

  test('throws for unknown workspace', () => {
    assert.throws(() => buildStandardBreadcrumb({ workspace: 'unknown', detailLabel: 'X' }))
  })

  test('works with stores workspace', () => {
    const crumb = buildStandardBreadcrumb({ workspace: 'stores', detailLabel: '三里屯店' })
    assert.equal(crumb.workspaceLabel, '门店管理')
    assert.equal(crumb.workspaceHref, '/stores')
  })

  test('works with members workspace', () => {
    const crumb = buildStandardBreadcrumb({ workspace: 'members', detailLabel: '会员详情' })
    assert.equal(crumb.workspaceLabel, '会员管理')
    assert.equal(crumb.workspaceHref, '/members')
  })

  test('empty detailLabel does not throw', () => {
    const crumb = buildStandardBreadcrumb({ workspace: 'brands', detailLabel: '' })
    assert.equal(crumb.detailLabel, '')
  })

  test('works with notifications workspace', () => {
    const crumb = buildStandardBreadcrumb({ workspace: 'notifications', detailLabel: '通知' })
    assert.equal(crumb.workspaceLabel, '通知中心')
    assert.equal(crumb.workspaceHref, '/notifications')
  })

  test('works with operations workspace', () => {
    const crumb = buildStandardBreadcrumb({ workspace: 'operations', detailLabel: '操作详情' })
    assert.ok(crumb.workspaceLabel.length > 0)
    assert.equal(crumb.workspaceHref, '/operations')
  })
})

describe('buildStandardClosureLinks', () => {
  test('emits workspace + audit by default', () => {
    const links = buildStandardClosureLinks({ workspace: 'brands', detailId: 'b-1' })
    assert.equal(links.length, 2)
    const workspaceLink = links[0]!
    const auditLink = links[1]!
    assert.equal(workspaceLink.key, 'workspace')
    assert.equal(workspaceLink.title, '返回品牌管理')
    assert.equal(workspaceLink.href, '/brands')
    assert.equal(auditLink.key, 'audit')
    assert.equal(auditLink.context, 'brands:b-1')
    assert.ok(auditLink.href.includes('source=brands'))
    assert.ok(auditLink.href.includes('purpose=brands%3Ab-1'))
  })

  test('inserts extraLinks between workspace and audit', () => {
    const links = buildStandardClosureLinks({
      workspace: 'members',
      detailId: 'm-1',
      extraLinks: [
        {
          key: 'member',
          title: '返回会员详情',
          subtitle: '回到会员 m-1 详情',
          href: '/members/m-1'
        }
      ]
    })
    assert.equal(links.length, 3)
    assert.equal(links[0]!.key, 'workspace')
    assert.equal(links[1]!.key, 'member')
    assert.equal(links[2]!.key, 'audit')
  })

  test('accepts closureLabel override for the workspace link', () => {
    const links = buildStandardClosureLinks({
      workspace: 'alerts',
      detailId: 'a-1',
      closureLabel: '返回告警中心'
    })
    assert.equal(links[0]!.title, '返回告警中心')
  })

  test('uses auditSource override when set (configuration -> config)', () => {
    const links = buildStandardClosureLinks({
      workspace: 'configuration',
      detailId: 'cfg-1'
    })
    assert.equal(links[1]!.context, 'configuration:cfg-1')
  })

  test('accepts auditSource override for alerts workspace', () => {
    const links = buildStandardClosureLinks({
      workspace: 'alerts',
      detailId: 'a-1'
    })
    assert.equal(links[0]!.key, 'workspace')
    assert.equal(links[1]!.context, 'alerts:a-1')
  })

  test('links all have unique keys', () => {
    const links = buildStandardClosureLinks({
      workspace: 'members',
      detailId: 'm-1',
      extraLinks: [
        { key: 'member', title: 'Back', href: '/members/m-1' }
      ]
    })
    const keys = links.map(l => l.key)
    assert.equal(new Set(keys).size, keys.length)
  })

  test('empty detailId does not throw (falls back)', () => {
    const links = buildStandardClosureLinks({ workspace: 'brands', detailId: '' })
    assert.equal(links.length, 2)
    assert.equal(links[0]!.key, 'workspace')
    assert.ok(links[1]!.href.includes('source=brands'))
  })

  test('audit link contains source and purpose query params', () => {
    const links = buildStandardClosureLinks({ workspace: 'stores', detailId: 's-1' })
    assert.ok(links[1]!.href.includes('source='))
    assert.ok(links[1]!.href.includes('purpose='))
  })
})
