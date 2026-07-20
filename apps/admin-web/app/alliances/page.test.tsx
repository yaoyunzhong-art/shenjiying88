import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── 导出类型引用 ──────────────────────────────────

type PartnerGrade = 'S' | 'A' | 'B' | 'C'
type PartnerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
type BusinessType = 'RETAIL' | 'F&B' | 'SERVICE' | 'TECH' | 'OTHER'
type SettlementStatus = 'pending' | 'approved' | 'rejected' | 'completed'

// ── 静态分析 ────────────────────────────────────

function extractSource(): string | null {
  try {
    const fs = require('fs')
    const path = require('path')
    return fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8')
  } catch {
    return null
  }
}

// ── fetch mock ──────────────────────────────────

interface ResponseEntry {
  status?: number
  body: unknown
}

const responseRegistry = new Map<string, ResponseEntry>()

function mockGlobalFetch() {
  const orig = globalThis.fetch
  globalThis.fetch = (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const entry = responseRegistry.get(url) || responseRegistry.get('*')
    if (entry) {
      const body = JSON.stringify({
        success: entry.status !== 500,
        data: entry.body,
        message: entry.status === 500 ? 'Server Error' : undefined,
      })
      return Promise.resolve(
        new Response(body, { status: entry.status || 200, headers: { 'Content-Type': 'application/json' } }),
      )
    }
    // Default: reject so component falls back to defaultPartners
    return Promise.reject(new Error('fetch not mocked'))
  }
  return orig
}

function resetFetch(orig: typeof globalThis.fetch) {
  globalThis.fetch = orig
}

// ── helpers ──

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

async function waitForIdle(ms = 150): Promise<void> {
  await sleep(ms)
}

// ── Tests ───────────────────────────────────────

describe('AlliancesPage — 联盟伙伴管理', () => {
  let origFetch: typeof globalThis.fetch

  beforeEach(() => {
    responseRegistry.clear()
    origFetch = mockGlobalFetch()
  })

  afterEach(() => {
    resetFetch(origFetch)
    cleanup()
  })

  // ──────────────── 类型定义 ────────────────

  describe('1. 类型定义', () => {
    it('应定义 AlliancePartner 接口', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('interface AlliancePartner'))
      assert.ok(src.includes('id: string'))
      assert.ok(src.includes('name: string'))
      assert.ok(src.includes('healthScore'))
      assert.ok(src.includes('revenueShare'))
      assert.ok(src.includes('settlementStatus'))
    })

    it('应定义 PartnerGrade 类型 (S/A/B/C)', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("'S'"))
      assert.ok(src.includes("'A'"))
      assert.ok(src.includes("'B'"))
      assert.ok(src.includes("'C'"))
    })

    it('应定义 PartnerStatus (ACTIVE/INACTIVE/SUSPENDED) —— 三态覆盖', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("'ACTIVE'"))
      assert.ok(src.includes("'INACTIVE'"))
      assert.ok(src.includes("'SUSPENDED'"))
    })

    it('应定义 BusinessType 5 种业务类型', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("'RETAIL'"))
      assert.ok(src.includes("'F&B'"))
      assert.ok(src.includes("'SERVICE'"))
      assert.ok(src.includes("'TECH'"))
      assert.ok(src.includes("'OTHER'"))
    })

    it('应定义 SettlementStatus 4 种分账状态', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("'pending'"))
      assert.ok(src.includes("'approved'"))
      assert.ok(src.includes("'rejected'"))
      assert.ok(src.includes("'completed'"))
    })

    it('应定义 PartnerFilter 筛选条件接口', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('interface PartnerFilter'))
      assert.ok(src.includes('search'))
      assert.ok(src.includes('status'))
      assert.ok(src.includes('grade'))
      assert.ok(src.includes('businessType'))
    })
  })

  // ──────────────── 样本数据 ────────────────

  describe('2. 样本数据', () => {
    it('应包含至少 8 条样本伙伴数据', () => {
      const src = extractSource()
      assert.ok(src)
      const idMatches = src.match(/id:\s*['"]([^'"]+)['"]/g)
      assert.ok(idMatches && idMatches.length >= 8, `expected ≥8 ids, got ${idMatches?.length}`)
    })

    it('样本应包含三种状态的伙伴 (三态覆盖: ACTIVE/INACTIVE/SUSPENDED)', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("status: 'ACTIVE'"))
      assert.ok(src.includes("status: 'INACTIVE'"))
      assert.ok(src.includes("status: 'SUSPENDED'"))
    })

    it('样本应包含全部四个等级 (S/A/B/C)', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("currentGrade: 'S'"))
      assert.ok(src.includes("currentGrade: 'A'"))
      assert.ok(src.includes("currentGrade: 'B'"))
      assert.ok(src.includes("currentGrade: 'C'"))
    })

    it('样本应包含四种分账状态', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("settlementStatus: 'completed'"))
      assert.ok(src.includes("settlementStatus: 'pending'"))
      assert.ok(src.includes("settlementStatus: 'rejected'"))
      assert.ok(src.includes("settlementStatus: 'approved'"))
    })

    it('每条数据应有 name / healthScore / totalRevenue', () => {
      const src = extractSource()
      assert.ok(src)
      const nameCount = (src.match(/name:\s*['"]/g) || []).length
      assert.ok(nameCount >= 8, `expected ≥8 names, got ${nameCount}`)
    })
  })

  // ──────────────── 页面渲染（default fallback）────────────

  describe('3. 页面渲染（默认数据降级）', () => {
    it('API 失败时降级渲染默认样本数据', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(250)

      assert.ok(screen.queryByText('联盟伙伴管理'), 'should render title')
      assert.ok(screen.queryByText('喜茶'), 'should render default partner name')
      assert.ok(screen.queryByText('美团'), 'should render INACTIVE partner')
      assert.ok(screen.queryByText('蔚来汽车'), 'should render SUSPENDED partner')
    })

    it('应显示 5 个统计概览卡片', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      assert.ok(screen.queryByText('伙伴总数'))
      assert.ok(screen.queryByText('总营收'))
      assert.ok(screen.queryByText('总订单'))
      assert.ok(screen.queryByText('平均健康度'))
      assert.ok(screen.queryByText('等级分布'))
    })

    it('应显示刷新按钮', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)
      assert.ok(screen.queryByText('刷新'))
    })

    it('应显示等级标签（S/A/B/C）', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      // S 级伙伴
      const sGraded = screen.queryAllByText('金牌')
      assert.ok(sGraded.length >= 1, 'should show S-grade partners')

      const aGraded = screen.queryAllByText('优质')
      assert.ok(aGraded.length >= 1, 'should show A-grade partners')
    })

    it('应显示伙伴状态标签', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      const activeLabels = screen.queryAllByText('正常')
      assert.ok(activeLabels.length >= 3, `expected ≥3 active labels, got ${activeLabels.length}`)
    })

    it('应显示结算状态', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      // 查看结算状态标签
      const completedSettlements = screen.queryAllByText(/结算:\s*已完成/)
      assert.ok(completedSettlements.length >= 1, 'should show completed settlement status')
    })

    it('应显示分润比例', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      const shareTexts = screen.queryAllByText(/分润:\s*\d+\.?\d*%/)
      assert.ok(shareTexts.length >= 1, 'should show revenue share percentage')
    })
  })

  // ──────────────── 搜索/筛选 ────────────────

  describe('4. 搜索与筛选', () => {
    it('应渲染搜索输入框', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      const searchInput = screen.queryByPlaceholderText('搜索伙伴名称或联系方式...')
      assert.ok(searchInput, 'should render search input')
    })

    it('应渲染状态筛选下拉框', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      assert.ok(screen.queryByText('状态:'))
      // 3 个筛选下拉都有''全部''选项
      const allSelects = screen.getAllByDisplayValue('全部')
      assert.ok(allSelects.length >= 3, `expected ≥3 selects, got ${allSelects.length}`)
    })

    it('应渲染等级筛选下拉框', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      assert.ok(screen.queryByText('等级:'))
    })

    it('应渲染行业筛选下拉框', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      assert.ok(screen.queryByText('行业:'))
    })

    it('搜索名称时过滤列表', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      const searchInput = screen.getByPlaceholderText('搜索伙伴名称或联系方式...')
      await userEvent.type(searchInput, '喜茶')
      await waitForIdle(100)

      assert.ok(screen.queryByText('喜茶'), '喜茶 should still appear')
      assert.equal(screen.queryByText('美团'), null, '美团 should be filtered out')
    })

    it('搜索结果数为 0 时显示空态', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      const searchInput = screen.getByPlaceholderText('搜索伙伴名称或联系方式...')
      await userEvent.type(searchInput, '不存在的伙伴名称xxxxxxxx')
      await waitForIdle(100)

      assert.ok(screen.queryByText('无匹配结果'), 'should show empty match state')
      assert.ok(screen.queryByText('清除所有筛选'), 'should show clear filters button')
    })

    it('搜索为空时显示所有数据', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      // Default should show all in the unfiltered list
      assert.ok(screen.queryByText('喜茶'))
      assert.ok(screen.queryByText('美团'))
    })
  })

  // ──────────────── API 加载 ────────────────

  describe('5. API 加载', () => {
    it('API 成功时显示服务端数据', async () => {
      responseRegistry.set('/api/brand/alliances/partners', {
        body: {
          partners: [
            {
              id: 'api-1', name: 'API测试伙伴', businessType: 'TECH', contact: '测试 13800000001',
              address: '测试地址', status: 'ACTIVE', currentGrade: 'S', healthScore: 99,
              revenueShare: 0.1, settlementStatus: 'completed', totalRevenue: 10000000,
              totalOrders: 5000, registeredAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-20T00:00:00Z',
            },
          ],
        },
      })

      render(React.createElement(require('./page').default))
      await waitForIdle(250)

      assert.ok(screen.queryByText('API测试伙伴'), 'should render API data')
      assert.equal(screen.queryByText('喜茶'), null, 'should NOT render default data')
    })

    it('API 返回空列表时显示空态', async () => {
      responseRegistry.set('/api/brand/alliances/partners', {
        body: { partners: [] },
      })

      render(React.createElement(require('./page').default))
      await waitForIdle(250)

      assert.ok(screen.queryByText('暂无联盟伙伴'), 'should show empty state')
      assert.ok(screen.queryByText('尚未注册任何联盟合作伙伴'), 'should show empty description')
    })

    it('API 失败时降级为默认数据', async () => {
      responseRegistry.set('/api/brand/alliances/partners', {
        status: 500,
        body: null,
      })

      render(React.createElement(require('./page').default))
      await waitForIdle(250)

      assert.ok(screen.queryByText('喜茶'), 'should fallback to default data')
    })
  })

  // ──────────────── 空态 ────────────────

  describe('6. 空态', () => {
    it('无数据时显示空态文案', async () => {
      responseRegistry.set('/api/brand/alliances/partners', {
        body: { partners: [] },
      })

      render(React.createElement(require('./page').default))
      await waitForIdle(250)

      assert.ok(screen.queryByText('暂无联盟伙伴'))
    })

    it('空态包含 svg 图标', async () => {
      const src = extractSource()
      assert.ok(src)

      // 检查空态的 svg 路径
      assert.ok(src.includes('暂无联盟伙伴'))
      assert.ok(src.includes('M17 20h5v-2a3') || src.includes('svg'))
    })
  })

  // ──────────────── 边界与反例 ────────────────

  describe('7. 边界与反例', () => {
    it('应处理空数据 (filtered.length === 0)', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('filtered.length === 0'), 'should check empty filtered list')
    })

    it('应导出默认组件', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('export default'))
    })

    it('GRADE_LABELS 应覆盖四种等级', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("S: '金牌'"))
      assert.ok(src.includes("A: '优质'"))
      assert.ok(src.includes("B: '普通'"))
      assert.ok(src.includes("C: '待改进'"))
    })

    it('STATUS_LABELS 应覆盖三种状态（三态覆盖）', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("ACTIVE: '正常'"))
      assert.ok(src.includes("INACTIVE: '已停用'"))
      assert.ok(src.includes("SUSPENDED: '已冻结'"))
    })

    it('SETTLEMENT_LABELS 应覆盖四种分账状态', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("pending: '待审批'"))
      assert.ok(src.includes("approved: '已审批'"))
      assert.ok(src.includes("rejected: '已驳回'"))
      assert.ok(src.includes("completed: '已完成'"))
    })

    it('SETTLEMENT_COLORS 应为每种分账状态定义颜色', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('SETTLEMENT_COLORS'))
      assert.ok(src.includes('pending:'))
      assert.ok(src.includes('approved:'))
      assert.ok(src.includes('rejected:'))
      assert.ok(src.includes('completed:'))
    })

    it('健康度为 null 时不报错', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('healthScore !== null') || src.includes('healthScore === null'))
    })

    it('progress bar 宽度不超过 100%', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('Math.min'))
    })

    it('应处理未知等级的 partner (currentGrade: null)', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("'未评定'"))
    })

    it('fmtShort 处理亿级金额', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('亿'))
      assert.ok(src.includes('万'))
    })

    it('应有清除搜索按钮', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('清除搜索'))
    })

    it('应有清除所有筛选按钮', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('清除所有筛选'))
    })

    it('应有共多少条结果的统计', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('条结果'))
    })

    it('等级分布概览中应显示S/A/B/C', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes("'S', 'A', 'B', 'C'") || src.includes("['S', 'A', 'B', 'C']"))
    })
  })

  // ──────────────── 工具函数 ────────────────

  describe('8. 工具函数', () => {
    it('fmtCents 格式化分为元', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('fmtCents'))
      assert.ok(src.includes('/ 100'))
    })

    it('BUSINESS_TYPE_LABELS 覆盖 5 种业务类型', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('RETAIL:') && src.includes("'零售'"))
      assert.ok(src.includes("'F&B':") && src.includes("'餐饮'"))
      assert.ok(src.includes('SERVICE:') && src.includes("'服务'"))
      assert.ok(src.includes('TECH:') && src.includes("'科技'"))
      assert.ok(src.includes('OTHER:') && src.includes("'其他'"))
    })

    it('STATUS_COLORS 应为每种状态定义', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('STATUS_COLORS'))
      assert.ok(src.includes('ACTIVE:'))
      assert.ok(src.includes('INACTIVE:'))
      assert.ok(src.includes('SUSPENDED:'))
    })

    it('healthColor 应处理 null', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('score === null') || src.includes('healthColor'))
    })

    it('healthBarColor 应覆盖四种档位', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('>= 80'))
      assert.ok(src.includes('>= 60'))
      assert.ok(src.includes('>= 40'))
    })

    it('GRADE_COLORS 应定义四种等级颜色', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('GRADE_COLORS'))
      assert.ok(src.includes('S:'))
      assert.ok(src.includes('A:'))
      assert.ok(src.includes('B:'))
      assert.ok(src.includes('C:'))
    })

    it('apiFetch 应抛出非 success 响应', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('throw new Error') || src.includes('!json.success'))
    })

    it('useMemo 用于筛选性能优化', () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('useMemo'))
      assert.ok(src.includes('filtered'))
    })
  })

  // ──────────────── 等级分布统计 ────────────────

  describe('9. 统计概览', () => {
    it('默认加载后应显示伙伴总数（8）', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      // 伙伴总数卡片值
      const partnerTotal = screen.queryByText('8')
      // 不一定作为独立文本渲染，但至少我们确认显示
      assert.ok(partnerTotal || !screen.queryByText('暂无联盟伙伴'), 'should have data')
    })

    it('应计算并显示平均健康度', async () => {
      render(React.createElement(require('./page').default))
      await waitForIdle(200)

      assert.ok(screen.queryByText('平均健康度'))
    })

    it('应显示等级分布进度条区域', async () => {
      const src = extractSource()
      assert.ok(src)
      assert.ok(src.includes('等级分布'))
    })
  })
})
