import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import SitemapPage from './page'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ADMIN_USER_KEY = 'admin_user'
const SRC = readFileSync(resolve(process.cwd(), 'app/seo/sitemap/page.tsx'), 'utf-8')

beforeEach(() => {
  window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify({
    userId: 'admin:test',
    username: 'sitemap_test',
    role: 'super-admin',
    permissions: ['dashboard:read'],
  }))
})

afterEach(() => {
  window.localStorage.clear()
  cleanup()
})

async function renderSitemapPageReady() {
  render(React.createElement(SitemapPage))
  await waitFor(() => screen.getByText('Sitemap 管理'))
}

describe('Sitemap管理页', () => {
  it('正例: 渲染标题', async () => {
    await renderSitemapPageReady()
    assert.ok(screen.getByText('Sitemap 管理'))
  })
  it('正例: 6条目', async () => {
    await renderSitemapPageReady()
    assert.ok(screen.getByText('/stores/shanghai-xuhui'))
    assert.ok(screen.getByText('/about'))
  })
  it('正例: 筛选每日', async () => {
    await renderSitemapPageReady()
    fireEvent.click(screen.getByText('每日'))
    assert.ok(screen.getByText('/'))
    assert.equal(screen.queryByText('/about'), null)
  })
  it('边界: 筛选每月', async () => {
    await renderSitemapPageReady()
    fireEvent.click(screen.getByText('每月'))
    assert.ok(screen.getByText('/about'))
  })
  it('正例: 优先级渲染', async () => {
    await renderSitemapPageReady()
    assert.ok(screen.getByText('0.9'))
    assert.ok(screen.getByText('0.5'))
  })
  it('源码接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'))
    assert.ok(SRC.includes("requiredPermission: 'dashboard:read'"))
  })
})
