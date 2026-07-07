import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  DataLineageTracker,
  ImpactAnalyzer,
  FieldRef,
  DashboardRef,
  APIRef
} from './data-lineage.service'

describe('DataLineageTracker', () => {
  let tracker: DataLineageTracker

  beforeEach(() => {
    tracker = new DataLineageTracker()
  })

  describe('trackField', () => {
    it('should record direct field lineage A <- B', () => {
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableB', fieldName: 'fieldB' })
      const upstream = tracker.getUpstream('tableA', 'fieldA')
      assert.equal(upstream.length, 1)
      assert.equal(upstream[0].tableName, 'tableB')
      assert.equal(upstream[0].fieldName, 'fieldB')
    })

    it('should track multiple upstream fields for single output', () => {
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableB', fieldName: 'fieldB' })
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableC', fieldName: 'fieldC' })
      const upstream = tracker.getUpstream('tableA', 'fieldA')
      assert.equal(upstream.length, 2)
      const tableNames = upstream.map((u) => u.tableName).sort()
      assert.deepEqual(tableNames, ['tableB', 'tableC'])
    })

    it('should record downstream relationship when tracking field', () => {
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableB', fieldName: 'fieldB' })
      const downstream = tracker.getDownstream('tableB', 'fieldB')
      assert.equal(downstream.length, 1)
      assert.equal(downstream[0].tableName, 'tableA')
      assert.equal(downstream[0].fieldName, 'fieldA')
    })

    it('should return empty upstream for untracked field', () => {
      const upstream = tracker.getUpstream('nonexistent', 'field')
      assert.equal(upstream.length, 0)
    })

    it('should return empty downstream for untracked field', () => {
      const downstream = tracker.getDownstream('nonexistent', 'field')
      assert.equal(downstream.length, 0)
    })
  })

  describe('trackTransform', () => {
    it('should track transform lineage A <- (B, C)', () => {
      tracker.trackTransform(
        { tableName: 'tableA', fieldName: 'fieldA' },
        [
          { tableName: 'tableB', fieldName: 'fieldB' },
          { tableName: 'tableC', fieldName: 'fieldC' }
        ]
      )
      const upstream = tracker.getUpstream('tableA', 'fieldA')
      assert.equal(upstream.length, 2)
      const tableNames = upstream.map((u) => u.tableName).sort()
      assert.deepEqual(tableNames, ['tableB', 'tableC'])
    })

    it('should populate downstream for each input field after transform', () => {
      tracker.trackTransform(
        { tableName: 'tableA', fieldName: 'fieldA' },
        [
          { tableName: 'tableB', fieldName: 'fieldB' },
          { tableName: 'tableC', fieldName: 'fieldC' }
        ]
      )
      const downstreamB = tracker.getDownstream('tableB', 'fieldB')
      const downstreamC = tracker.getDownstream('tableC', 'fieldC')
      assert.ok(downstreamB.some((d) => d.tableName === 'tableA' && d.fieldName === 'fieldA'))
      assert.ok(downstreamC.some((d) => d.tableName === 'tableA' && d.fieldName === 'fieldA'))
    })

    it('should handle single input transform same as trackField', () => {
      tracker.trackTransform(
        { tableName: 'tableA', fieldName: 'fieldA' },
        [{ tableName: 'tableB', fieldName: 'fieldB' }]
      )
      const upstream = tracker.getUpstream('tableA', 'fieldA')
      assert.equal(upstream.length, 1)
      assert.equal(upstream[0].tableName, 'tableB')
    })
  })

  describe('getLineageGraph', () => {
    it('should return empty graph when no lineage recorded', () => {
      const graph = tracker.getLineageGraph()
      assert.equal(graph.nodes.length, 0)
      assert.equal(graph.edges.length, 0)
    })

    it('should return direct nodes and edges for depth=1', () => {
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableB', fieldName: 'fieldB' })
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableC', fieldName: 'fieldC' })
      const graph = tracker.getLineageGraph('tableA', 1)
      assert.ok(graph.nodes.length >= 1)
      assert.ok(graph.edges.length >= 2)
    })

    it('should limit graph to specified depth', () => {
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableB', fieldName: 'fieldB' })
      tracker.trackField('tableB', 'fieldB', { tableName: 'tableC', fieldName: 'fieldC' })
      tracker.trackField('tableC', 'fieldC', { tableName: 'tableD', fieldName: 'fieldD' })
      const graphDepth1 = tracker.getLineageGraph('tableA', 1)
      const graphDepth2 = tracker.getLineageGraph('tableA', 2)
      assert.ok(graphDepth1.nodes.length <= graphDepth2.nodes.length)
    })

    it('should include all nodes and edges for depth=0 (unlimited)', () => {
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableB', fieldName: 'fieldB' })
      tracker.trackField('tableB', 'fieldB', { tableName: 'tableC', fieldName: 'fieldC' })
      const graph = tracker.getLineageGraph(undefined, 0)
      assert.ok(graph.nodes.length >= 3)
      assert.ok(graph.edges.length >= 2)
    })

    it('should filter by rootTable when specified', () => {
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableB', fieldName: 'fieldB' })
      tracker.trackField('tableX', 'fieldX', { tableName: 'tableY', fieldName: 'fieldY' })
      const graphA = tracker.getLineageGraph('tableA')
      const graphX = tracker.getLineageGraph('tableX')
      assert.ok(graphA.nodes.every((n) => n.tableName === 'tableA' || n.tableName === 'tableB'))
      assert.ok(graphX.nodes.every((n) => n.tableName === 'tableX' || n.tableName === 'tableY'))
    })
  })

  describe('reset', () => {
    it('should clear all lineage data', () => {
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableB', fieldName: 'fieldB' })
      tracker.reset()
      const upstream = tracker.getUpstream('tableA', 'fieldA')
      const downstream = tracker.getDownstream('tableB', 'fieldB')
      assert.equal(upstream.length, 0)
      assert.equal(downstream.length, 0)
    })
  })
})

describe('ImpactAnalyzer', () => {
  let tracker: DataLineageTracker
  let analyzer: ImpactAnalyzer

  beforeEach(() => {
    tracker = new DataLineageTracker()
    analyzer = new ImpactAnalyzer(tracker)
  })

  describe('registerDashboard / getAffectedDashboards', () => {
    it('should register and retrieve affected dashboards', () => {
      const dashboard: DashboardRef = {
        dashboardId: 'dash-001',
        dashboardName: 'Sales Dashboard',
        fields: [{ tableName: 'orders', fieldName: 'total_amount' }]
      }
      analyzer.registerDashboard(dashboard)
      const affected = analyzer.getAffectedDashboards({ tableName: 'orders', fieldName: 'total_amount' })
      assert.equal(affected.length, 1)
      assert.equal(affected[0].dashboardId, 'dash-001')
    })

    it('should return multiple dashboards for same field', () => {
      analyzer.registerDashboard({
        dashboardId: 'dash-001',
        dashboardName: 'Dashboard 1',
        fields: [{ tableName: 'orders', fieldName: 'total_amount' }]
      })
      analyzer.registerDashboard({
        dashboardId: 'dash-002',
        dashboardName: 'Dashboard 2',
        fields: [{ tableName: 'orders', fieldName: 'total_amount' }]
      })
      const affected = analyzer.getAffectedDashboards({ tableName: 'orders', fieldName: 'total_amount' })
      assert.equal(affected.length, 2)
    })
  })

  describe('registerAPI / getAffectedAPIs', () => {
    it('should register and retrieve affected APIs', () => {
      const api: APIRef = {
        apiId: 'api-001',
        apiName: 'Get Order Summary',
        endpoint: '/api/orders/summary',
        fields: [{ tableName: 'orders', fieldName: 'total_amount' }]
      }
      analyzer.registerAPI(api)
      const affected = analyzer.getAffectedAPIs({ tableName: 'orders', fieldName: 'total_amount' })
      assert.equal(affected.length, 1)
      assert.equal(affected[0].apiId, 'api-001')
    })
  })

  describe('analyzeImpact', () => {
    it('should analyze impact for field with lineage and consumers', () => {
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableB', fieldName: 'fieldB' })
      analyzer.registerDashboard({
        dashboardId: 'dash-001',
        dashboardName: 'Test Dashboard',
        fields: [{ tableName: 'tableA', fieldName: 'fieldA' }]
      })
      analyzer.registerAPI({
        apiId: 'api-001',
        apiName: 'Test API',
        endpoint: '/api/test',
        fields: [{ tableName: 'tableA', fieldName: 'fieldA' }]
      })
      const impact = analyzer.analyzeImpact('tableB', 'fieldB')
      assert.equal(impact.fieldRef.tableName, 'tableB')
      assert.equal(impact.fieldRef.fieldName, 'fieldB')
      assert.ok(impact.downstreamFields.some((f) => f.tableName === 'tableA' && f.fieldName === 'fieldA'))
      assert.equal(impact.affectedDashboards.length, 1)
      assert.equal(impact.affectedAPIs.length, 1)
    })

    it('should identify all downstream fields recursively', () => {
      tracker.trackField('tableA', 'fieldA', { tableName: 'tableB', fieldName: 'fieldB' })
      tracker.trackField('tableB', 'fieldB', { tableName: 'tableC', fieldName: 'fieldC' })
      const impact = analyzer.analyzeImpact('tableC', 'fieldC')
      assert.ok(impact.downstreamFields.some((f) => f.tableName === 'tableB' && f.fieldName === 'fieldB'))
      assert.ok(impact.downstreamFields.some((f) => f.tableName === 'tableA' && f.fieldName === 'fieldA'))
    })

    it('should return LOW risk when no consumers', () => {
      const impact = analyzer.analyzeImpact('orders', 'new_field')
      assert.equal(impact.riskLevel, 'LOW')
    })

    it('should return HIGH risk when many consumers', () => {
      for (let i = 0; i < 5; i++) {
        analyzer.registerAPI({
          apiId: `api-${i}`,
          apiName: `API ${i}`,
          endpoint: `/api/test/${i}`,
          fields: [{ tableName: 'orders', fieldName: 'total_amount' }]
        })
      }
      for (let i = 0; i < 3; i++) {
        analyzer.registerDashboard({
          dashboardId: `dash-${i}`,
          dashboardName: `Dashboard ${i}`,
          fields: [{ tableName: 'orders', fieldName: 'total_amount' }]
        })
      }
      const impact = analyzer.analyzeImpact('orders', 'total_amount')
      assert.equal(impact.riskLevel, 'HIGH')
    })
  })

  describe('estimateRiskChange', () => {
    it('should assess DELETE change as highest risk', () => {
      analyzer.registerDashboard({
        dashboardId: 'dash-001',
        dashboardName: 'Dashboard',
        fields: [{ tableName: 'orders', fieldName: 'total_amount' }]
      })
      const assessment = analyzer.estimateRiskChange({
        tableName: 'orders',
        fieldName: 'total_amount',
        changeType: 'DELETE'
      })
      assert.equal(assessment.level, 'HIGH')
      assert.ok(assessment.reasons.some((r) => r.includes('删除')))
    })

    it('should assess TYPE_CHANGE with moderate risk', () => {
      analyzer.registerAPI({
        apiId: 'api-001',
        apiName: 'API',
        endpoint: '/api/test',
        fields: [{ tableName: 'orders', fieldName: 'amount' }]
      })
      const assessment = analyzer.estimateRiskChange({
        tableName: 'orders',
        fieldName: 'amount',
        changeType: 'TYPE_CHANGE'
      })
      assert.ok(assessment.score > 0)
      assert.ok(assessment.reasons.some((r) => r.includes('类型变更')))
    })

    it('should return 0 affectedObjects when no impact', () => {
      const assessment = analyzer.estimateRiskChange({
        tableName: 'orders',
        fieldName: 'nonexistent_field',
        changeType: 'NAME_CHANGE'
      })
      assert.equal(assessment.affectedObjects, 0)
      assert.equal(assessment.level, 'LOW')
    })
  })

  describe('reset', () => {
    it('should clear all registry data', () => {
      analyzer.registerDashboard({
        dashboardId: 'dash-001',
        dashboardName: 'Dashboard',
        fields: [{ tableName: 'orders', fieldName: 'amount' }]
      })
      analyzer.reset()
      const affected = analyzer.getAffectedDashboards({ tableName: 'orders', fieldName: 'amount' })
      assert.equal(affected.length, 0)
    })
  })
})
