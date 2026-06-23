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

  test('every registry entry is unique by key', () => {
    const keys = Object.keys(DETAIL_WORKSPACE_REGISTRY)
    assert.equal(new Set(keys).size, keys.length)
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

  test('uses auditSource override when set (configuration → config)', () => {
    const links = buildStandardClosureLinks({
      workspace: 'configuration',
      detailId: 'cfg-1'
    })
    // configuration has no override, falls back to href strip
    assert.equal(links[1]!.context, 'configuration:cfg-1')
  })
})
