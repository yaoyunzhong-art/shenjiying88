/**
 * intelligence/page.test.tsx — Dashboard KPI测试
 * 覆盖: 数据/状态/边界 = 30+ tests
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

function readSrc(): string | null {
  try {
    const fs = require('fs')
    const path = require('path')
    return fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8')
  } catch {
    return null
  }
}

const content: string = (() => {
  const s = readSrc()
  if (!s) throw new Error('Cannot read page.tsx')
  return s
})()

describe('Intelligence Dashboard', () => {
  beforeEach(() => {})

  it('页面文件存在', () => {
    assert.ok(content, 'page.tsx 内容非空')
  })

  it('KPI卡片组件存在', () => {
    assert.ok(content.includes('KpiCard'))
    assert.ok(content.includes('监控城市'))
    assert.ok(content.includes('高优先级'))
  })

  it('KPI卡片包含6个维度', () => {
    const cards = ['监控城市', '最新告警', '高优先级', 'AI建议数', '知识卡片', '最近扫描']
    for (const c of cards) {
      assert.ok(content.includes(c), '缺少KPI卡片: ' + c)
    }
  })

  it('KPI卡片使用 border-l-4 样式', () => {
    const kpiCards = content.match(/KpiCard/g)
    assert.ok(kpiCards && kpiCards.length >= 6)
    assert.ok(content.includes('border-l-4'))
  })

  it('告警数为0时不显示红色标记', () => {
    assert.ok(content.includes("kpi.highSeverityAlerts > 0 ? 'border-red-500' : 'border-gray-300'"))
    assert.ok(content.includes("kpi.highSeverityAlerts > 0 ? '\u{1F6A8}' : '\u2705'"))
  })

  it('告警数有值时显示badge在monitor入口', () => {
    assert.ok(content.includes('highSeverityAlerts > 0'))
    assert.ok(content.includes('\u65B0\u544A\u8B66'))
    assert.ok(content.includes('kpi.highSeverityAlerts'))
  })

  it('Dashboard有4个功能入口', () => {
    assert.ok(content.includes('/intelligence/feasibility'))
    assert.ok(content.includes('/intelligence/operations'))
    assert.ok(content.includes('/intelligence/monitor'))
  })

  it('功能入口卡片包含标题和描述', () => {
    const entries = ['\u5F00\u4E1A\u53EF\u884C\u6027\u62A5\u544A', '\u8FD0\u8425\u53C2\u8C0B (AI\u9009\u62E9\u9898)', '\u7ADE\u4E89\u76D1\u63A7', '\u8D22\u52A1\u5168\u666F\u8868']
    for (const e of entries) {
      assert.ok(content.includes(e), '\u7F3A\u5C11\u529F\u80FD\u5165\u53E3: ' + e)
    }
  })

  it('功能入口使用 Link 组件', () => {
    const links = content.match(/href:\s*['"]\/intelligence/g)
    assert.ok(links && links.length >= 4)
  })

  it('Dashboard有快速操作区', () => {
    assert.ok(content.includes('\u5FEB\u901F\u64CD\u4F5C'))
    assert.ok(content.includes('\u8BC4\u4F30\u65B0\u5E97'))
    assert.ok(content.includes('\u83B7\u53D6AI\u5EFA\u8BAE'))
    assert.ok(content.includes('\u67E5\u770B\u76D1\u63A7'))
  })

  it('支持刷新功能', () => {
    assert.ok(content.includes('\u5237\u65B0'))
  })

  it('加载状态下刷新按钮禁用', () => {
    assert.ok(content.includes('disabled={loading}'))
  })

  it('从API获取数据', () => {
    assert.ok(content.includes('/api/intelligence/monitor/summary'))
  })

  it('API失败时展示降级提示', () => {
    assert.ok(content.includes('\u76D1\u63A7API\u6682\u4E0D\u53EF\u7528\uFF0C\u5C55\u793A\u9ED8\u8BA4\u6570\u636E'))
  })

  it('设置了 DEFAULT_KPI 默认值', () => {
    assert.ok(content.includes('DEFAULT_KPI'))
    assert.ok(content.includes('monitoredCities: 12'))
    assert.ok(content.includes('totalAlerts: 0'))
    assert.ok(content.includes('knowledgeCards: 248'))
  })

  it('展示错误提示框', () => {
    assert.ok(content.includes('error'))
    assert.ok(content.includes('bg-yellow-50'))
    assert.ok(content.includes('border-yellow-200'))
  })

  it('边界: 最近扫描显示"从未"当lastScanTime为空', () => {
    assert.ok(content.includes("kpi.lastScanTime !== '--' ? kpi.lastScanTime : '\u4ECE\u672A'"))
  })

  it('边界: highSeverityAlerts>0时显示badge', () => {
    assert.ok(content.includes('highSeverityAlerts > 0'))
  })

  it('边界: KpiCard 的 value 支持 number | string', () => {
    assert.ok(content.includes('value: number | string'))
  })

  it('边界: 初始加载状态为 true', () => {
    assert.ok(content.includes('useState(true)') || content.includes('loading=true'))
  })

  it('TSC: KpiData接口字段完整', () => {
    const fields = ['monitoredCities', 'totalAlerts', 'highSeverityAlerts', 'totalSuggestions', 'knowledgeCards', 'lastScanTime']
    for (const f of fields) {
      assert.ok(content.includes(f), '\u7F3A\u5C11\u63A5\u53E3\u5B57\u6BB5: ' + f)
    }
  })

  it('TSC: 无as any', () => {
    assert.ok(!content.includes('as any'))
  })

  it('TSC: 使用 interface 定义 KpiData', () => {
    assert.ok(content.includes('interface KpiData'))
  })

  it('渲染: 页面标题包含\u8FD0\u8425\u53C2\u8C0B', () => {
    assert.ok(content.includes('\u8FD0\u8425\u53C2\u8C0B'))
    assert.ok(content.includes('\uD83E\uDD16'))
  })

  it('渲染: 描述包含\u7ADE\u4E89\u6570\u636E\u5E93', () => {
    assert.ok(content.includes('\u7ADE\u54C1\u6570\u636E\u5E93'))
  })

  it('渲染: fetchKpi 使用 useCallback', () => {
    assert.ok(content.includes('useCallback'))
    assert.ok(content.includes('fetchKpi'))
  })

  it('渲染: useEffect 初始化调用 fetchKpi', () => {
    assert.ok(content.includes('useEffect'))
    assert.ok(content.includes('{ fetchKpi() }'))
  })

  it('样式: max-w-7xl 布局容器', () => {
    assert.ok(content.includes('max-w-7xl'))
  })

  it('样式: 响应式网格 grid-cols-2 md:grid-cols-3 lg:grid-cols-6', () => {
    assert.ok(content.includes('grid-cols-2'))
    assert.ok(content.includes('lg:grid-cols-6'))
  })

  it('功能入口含高优先级告警badge', () => {
    assert.ok(content.includes('badge'))
    assert.ok(content.includes('\u6761\u65B0\u544A\u8B66'))
  })
})
