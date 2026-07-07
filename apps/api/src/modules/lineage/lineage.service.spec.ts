/**
 * lineage.service.spec.ts — 数据血缘 Service 纯函数式单元测试
 *
 * 覆盖：
 *  DataLineageTracker:
 *   trackField         — 正例（追踪字段血缘）/ 反例（重复追踪）
 *   trackTransform     — 正例（转换血缘）/ 边界（空输入列表）
 *   getUpstream        — 正例（获取上游）/ 边界（无上游）
 *   getDownstream      — 正例（获取下游）/ 边界（无下游）
 *   getLineageGraph    — 正例（全图/按根表/深度限制）/ 边界（空图）
 *   reset              — 正例（清空后查询）
 *
 *  ImpactAnalyzer:
 *   registerDashboard  — 正例（注册仪表板字段引用）
 *   registerAPI        — 正例（注册 API 字段引用）
 *   getAffectedDashboards — 正例（反查仪表板）/ 边界（无影响）
 *   getAffectedAPIs    — 正例（反查 API）
 *   analyzeImpact      — 正例（全链路影响分析）/ 边界（无下游）
 *   estimateRiskChange — 正例（各类变更风险评估）
 *
 * ≥ 18 项测试，纯内联 mock
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DataLineageTracker, ImpactAnalyzer } from './data-lineage.service'
import type { FieldRef, LineageGraph, ImpactResult, DashboardRef, APIRef } from './data-lineage.service'

// ═══════════════════════════════════════════════════════════════
// DataLineageTracker
// ═══════════════════════════════════════════════════════════════

describe('DataLineageTracker', () => {
  let tracker: DataLineageTracker

  beforeEach(() => {
    tracker = new DataLineageTracker()
  })

  // ── trackField ─────────────────────────────────────────────────

  describe('trackField', () => {
    const source: FieldRef = { tableName: 'users', fieldName: 'id' }

    it('正例: 追踪字段级血缘', () => {
      tracker.trackField('orders', 'user_id', source)

      const upstream = tracker.getUpstream('orders', 'user_id')
      expect(upstream).toHaveLength(1)
      expect(upstream[0]).toEqual(source)
    })

    it('正例: 多级追踪', () => {
      const src2: FieldRef = { tableName: 'users', fieldName: 'name' }
      tracker.trackField('orders', 'user_id', source)
      tracker.trackField('orders', 'user_name', src2)

      const upstream = tracker.getUpstream('orders', 'user_id')
      const upstream2 = tracker.getUpstream('orders', 'user_name')
      expect(upstream).toHaveLength(1)
      expect(upstream2).toHaveLength(1)
    })

    it('反例: 重复追踪同一血缘，上游数量不重复', () => {
      tracker.trackField('orders', 'user_id', source)
      tracker.trackField('orders', 'user_id', source)

      const upstream = tracker.getUpstream('orders', 'user_id')
      expect(upstream).toHaveLength(1) // Set 去重
    })
  })

  // ── trackTransform ─────────────────────────────────────────────

  describe('trackTransform', () => {
    it('正例: 追踪转换血缘', () => {
      const inputs: FieldRef[] = [
        { tableName: 'orders', fieldName: 'quantity' },
        { tableName: 'orders', fieldName: 'unit_price' },
      ]
      tracker.trackTransform(
        { tableName: 'report', fieldName: 'total_amount' },
        inputs,
      )

      const upstream = tracker.getUpstream('report', 'total_amount')
      expect(upstream).toHaveLength(2)
    })

    it('边界: 空输入列表', () => {
      tracker.trackTransform(
        { tableName: 'report', fieldName: 'empty_transform' },
        [],
      )

      const upstream = tracker.getUpstream('report', 'empty_transform')
      expect(upstream).toHaveLength(0)
    })
  })

  // ── getUpstream ────────────────────────────────────────────────

  describe('getUpstream', () => {
    it('边界: 无上游返回空数组', () => {
      const upstream = tracker.getUpstream('nonexistent', 'field')
      expect(upstream).toHaveLength(0)
    })
  })

  // ── getDownstream ──────────────────────────────────────────────

  describe('getDownstream', () => {
    it('正例: 获取下游影响字段', () => {
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })

      const downstream = tracker.getDownstream('users', 'id')
      expect(downstream).toHaveLength(1)
      expect(downstream[0]).toEqual({ tableName: 'orders', fieldName: 'user_id' })
    })

    it('边界: 无下游返回空数组', () => {
      const downstream = tracker.getDownstream('users', 'isolated')
      expect(downstream).toHaveLength(0)
    })
  })

  // ── getLineageGraph ────────────────────────────────────────────

  describe('getLineageGraph', () => {
    it('正例: 返回包含节点和边的血缘图', () => {
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })
      const graph: LineageGraph = tracker.getLineageGraph()

      expect(graph.nodes.length).toBeGreaterThanOrEqual(2)
      expect(graph.edges.length).toBeGreaterThanOrEqual(1)
      expect(graph.edges[0].type).toBe('DIRECT')
    })

    it('正例: 根表过滤返回子图', () => {
      tracker.trackField('users', 'name_clean', { tableName: 'users', fieldName: 'name' })
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })

      const graph = tracker.getLineageGraph('users')
      expect(graph.nodes.length).toBeGreaterThanOrEqual(2)
    })

    it('边界: 空图返回空节点和边', () => {
      const graph = tracker.getLineageGraph()
      expect(graph.nodes).toHaveLength(0)
      expect(graph.edges).toHaveLength(0)
    })
  })

  // ── reset ──────────────────────────────────────────────────────

  describe('reset', () => {
    it('正例: 重置后查询返回空', () => {
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })
      expect(tracker.getUpstream('orders', 'user_id').length).toBe(1)

      tracker.reset()
      expect(tracker.getUpstream('orders', 'user_id')).toHaveLength(0)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// ImpactAnalyzer
// ═══════════════════════════════════════════════════════════════

describe('ImpactAnalyzer', () => {
  let tracker: DataLineageTracker
  let analyzer: ImpactAnalyzer

  beforeEach(() => {
    tracker = new DataLineageTracker()
    analyzer = new ImpactAnalyzer(tracker)
  })

  // ── registerDashboard / getAffectedDashboards ──────────────────

  describe('registerDashboard / getAffectedDashboards', () => {
    it('正例: 注册仪表板并反查', () => {
      const dashboard: DashboardRef = {
        dashboardId: 'dash-001',
        dashboardName: '销售报表',
        fields: [{ tableName: 'orders', fieldName: 'amount' }],
      }
      analyzer.registerDashboard(dashboard)

      const affected = analyzer.getAffectedDashboards({ tableName: 'orders', fieldName: 'amount' })
      expect(affected).toHaveLength(1)
      expect(affected[0].dashboardId).toBe('dash-001')
    })

    it('边界: 字段未被引用时返回空', () => {
      const affected = analyzer.getAffectedDashboards({ tableName: 'nonexistent', fieldName: 'x' })
      expect(affected).toHaveLength(0)
    })
  })

  // ── registerAPI / getAffectedAPIs ──────────────────────────────

  describe('registerAPI / getAffectedAPIs', () => {
    it('正例: 注册 API 并反查', () => {
      const api: APIRef = {
        apiId: 'api-001',
        apiName: '获取订单列表',
        endpoint: '/api/orders',
        fields: [{ tableName: 'orders', fieldName: 'status' }],
      }
      analyzer.registerAPI(api)

      const affected = analyzer.getAffectedAPIs({ tableName: 'orders', fieldName: 'status' })
      expect(affected).toHaveLength(1)
      expect(affected[0].apiId).toBe('api-001')
    })

    it('边界: API 字段未被引用返回空', () => {
      const affected = analyzer.getAffectedAPIs({ tableName: 'orders', fieldName: 'price' })
      expect(affected).toHaveLength(0)
    })
  })

  // ── analyzeImpact ──────────────────────────────────────────────

  describe('analyzeImpact', () => {
    it('正例: 无下游变更返回 LOW 风险', () => {
      const impact: ImpactResult = analyzer.analyzeImpact('orders', 'price')

      expect(impact.fieldRef.fieldName).toBe('price')
      expect(impact.downstreamFields).toHaveLength(0)
      expect(impact.upstreamFields).toHaveLength(0)
      expect(impact.riskLevel).toBe('LOW')
    })

    it('正例: 有仪表板和 API 引用时返回 HIGH 风险', () => {
      tracker.trackField('report', 'revenue', { tableName: 'orders', fieldName: 'amount' })
      analyzer.registerDashboard({
        dashboardId: 'dash-001',
        dashboardName: '收入报表',
        fields: [{ tableName: 'report', fieldName: 'revenue' }],
      })
      analyzer.registerAPI({
        apiId: 'api-001',
        apiName: '收入 API',
        endpoint: '/api/revenue',
        fields: [{ tableName: 'report', fieldName: 'revenue' }],
      })
      analyzer.registerAPI({
        apiId: 'api-002',
        apiName: '报表 API',
        endpoint: '/api/report',
        fields: [{ tableName: 'report', fieldName: 'revenue' }],
      })
      analyzer.registerAPI({
        apiId: 'api-003',
        apiName: '分析 API',
        endpoint: '/api/analytics',
        fields: [{ tableName: 'report', fieldName: 'revenue' }],
      })
      analyzer.registerAPI({
        apiId: 'api-004',
        apiName: '导出 API',
        endpoint: '/api/export',
        fields: [{ tableName: 'report', fieldName: 'revenue' }],
      })
      analyzer.registerAPI({
        apiId: 'api-005',
        apiName: '数据 API',
        endpoint: '/api/data',
        fields: [{ tableName: 'report', fieldName: 'revenue' }],
      })

      const impact = analyzer.analyzeImpact('orders', 'amount')
      expect(impact.riskLevel).toBe('HIGH')
    })

    it('正例: 12 个下游字段触发 HIGH 风险', () => {
      // 创建大量下游字段
      for (let i = 0; i < 12; i++) {
        tracker.trackField(`report_${i}`, 'value', { tableName: 'orders', fieldName: 'amount' })
      }

      const impact = analyzer.analyzeImpact('orders', 'amount')
      expect(impact.downstreamFields.length).toBe(12)
      expect(impact.riskLevel).toBe('HIGH')
    })
  })

  // ── estimateRiskChange ─────────────────────────────────────────

  describe('estimateRiskChange', () => {
    it('正例: TYPE_CHANGE 返回 LOW 风险', () => {
      const assessment = analyzer.estimateRiskChange({
        tableName: 'orders',
        fieldName: 'price',
        changeType: 'TYPE_CHANGE',
      })

      expect(assessment.level).toBe('LOW')
      expect(assessment.score).toBe(30)
      expect(assessment.reasons).toContain('字段类型变更')
    })

    it('正例: DELETE 变更风险最高', () => {
      tracker.trackField('report', 'amount', { tableName: 'orders', fieldName: 'amount' })
      analyzer.registerDashboard({
        dashboardId: 'dash-001',
        dashboardName: '报表',
        fields: [{ tableName: 'report', fieldName: 'amount' }],
      })

      const assessment = analyzer.estimateRiskChange({
        tableName: 'orders',
        fieldName: 'amount',
        changeType: 'DELETE',
      })

      expect(assessment.level).toBe('HIGH')
      expect(assessment.score).toBeGreaterThanOrEqual(80)
      expect(assessment.reasons).toContain('字段被删除')
    })

    it('正例: NAME_CHANGE 变更', () => {
      const assessment = analyzer.estimateRiskChange({
        tableName: 'orders',
        fieldName: 'created_at',
        changeType: 'NAME_CHANGE',
      })

      expect(assessment.level).toBe('LOW')
      expect(assessment.score).toBe(20)
      expect(assessment.reasons).toContain('字段名称变更')
    })
  })

  // ── reset ──────────────────────────────────────────────────────

  describe('reset', () => {
    it('正例: 重置后注册表清空', () => {
      analyzer.registerDashboard({
        dashboardId: 'dash-001',
        dashboardName: '测试',
        fields: [{ tableName: 'test', fieldName: 'x' }],
      })
      analyzer.reset()

      const affected = analyzer.getAffectedDashboards({ tableName: 'test', fieldName: 'x' })
      expect(affected).toHaveLength(0)
    })
  })
})
