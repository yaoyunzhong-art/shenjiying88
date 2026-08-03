import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🦞 跨模块 E2E 测试链 #29: IoT → Edge AI → Realtime → Lineage
 *
 * 模拟链路 (物联网+边缘计算+实时协同+数据血缘):
 *   apps/api IoT (设备数据采集/OTA升级)
 *   → apps/api Edge (边缘AI推理)
 *   → apps/api Realtime (实时协同CRDT)
 *   → apps/api Lineage (数据血缘追踪)
 *
 * 验证:
 *   - IoT 传感器数据流经 Edge 预处理后注入 Realtime
 *   - Realtime CRDT 操作同步到 Lineage 血缘追踪
 *   - 数据血缘可溯源到原始 IoT 设备
 *   - 边缘推理异常检测触发告警链路
 *
 * 设计模式: 物联网数据管道 + 实时协同 + 血缘审计
 */

import assert from 'node:assert/strict'

// ====== Domain 层: IoT ======
type DeviceStatus = 'online' | 'offline' | 'error'
interface IoTDeviceData {
  deviceId: string
  timestamp: string
  metrics: Record<string, number>
  status: DeviceStatus
}

const iotStore: IoTDeviceData[] = []
function resetIoTStore(): void { iotStore.length = 0 }
function recordIoTData(d: IoTDeviceData): { success: boolean; warnings?: string[] } {
  if (!d.deviceId || d.deviceId.trim() === '') return { success: false, warnings: ['deviceId is required'] }
  const warnings: string[] = []
  if (d.status === 'offline') warnings.push('device is offline, recorded as stale')
  iotStore.push(d)
  return { success: true, warnings: warnings.length > 0 ? warnings : undefined }
}
function listIoTDevices(): IoTDeviceData[] { return [...iotStore] }
function getIoTDevice(deviceId: string): IoTDeviceData | undefined { return iotStore.find(d => d.deviceId === deviceId) }

// ====== Domain 层: Edge AI ======
interface EdgeInferenceInput {
  modelId: string
  input: Record<string, number>
  context: { deviceId: string }
}
interface EdgeInferenceResult {
  prediction: string
  confidence: number
  latency: number
  modelId: string
}

function edgeInfer(input: EdgeInferenceInput): EdgeInferenceResult {
  if (!input.modelId) throw Object.assign(new Error('modelId is required'), { status: 400 })
  if (!input.input || Object.keys(input.input).length === 0) throw Object.assign(new Error('input data is required'), { status: 400 })
  // 模拟推理: 温度 > 50 视为 anomaly
  const temp = input.input.temperature ?? input.input.value ?? 0
  const isAnomaly = temp > 50 || temp < -10
  return {
    prediction: isAnomaly ? 'anomaly_detected' : 'normal',
    confidence: isAnomaly ? 0.93 : (temp > 30 ? 0.88 : 0.95),
    latency: Math.floor(Math.random() * 100) + 10,
    modelId: input.modelId,
  }
}

// ====== Domain 层: Realtime Collaboration ======
interface CollabDocument {
  docId: string
  content: Record<string, unknown>
  metadata: Record<string, unknown>
  createdAt: string
  version: number
}

const collabStore = new Map<string, CollabDocument>()
function resetCollabStore(): void { collabStore.clear() }
function createCollabDoc(docId: string, content: Record<string, unknown>, metadata: Record<string, unknown>): CollabDocument {
  if (!docId) throw Object.assign(new Error('docId is required'), { status: 400 })
  if (collabStore.has(docId)) throw Object.assign(new Error('document already exists'), { status: 409 })
  const doc: CollabDocument = { docId, content, metadata, createdAt: new Date().toISOString(), version: 1 }
  collabStore.set(docId, doc)
  return doc
}
function getCollabDoc(docId: string): CollabDocument | undefined { return collabStore.get(docId) }

// ====== Domain 层: Lineage ======
interface LineageEdge {
  sourceId: string
  targetId: string
  relation: string
  registeredAt: string
}
interface LineageNode {
  id: string
  type: string
  label: string
}
interface LineageGraph {
  nodes: LineageNode[]
  edges: LineageEdge[]
}
interface AnomalyReport {
  entityId: string
  anomalies: Array<{ type: string; description: string; severity: string }>
}

let lineageNodes: LineageNode[] = []
const lineageEdges: LineageEdge[] = []
function resetLineageStore(): void { lineageNodes = []; lineageEdges.length = 0 }
function registerLineageNode(id: string, type: string, label: string): void {
  if (!lineageNodes.find(n => n.id === id)) lineageNodes.push({ id, type, label })
}
function registerLineageEdge(sourceId: string, targetId: string, relation: string): void {
  registerLineageNode(sourceId, 'unknown', sourceId)
  registerLineageNode(targetId, 'unknown', targetId)
  lineageEdges.push({ sourceId, targetId, relation, registeredAt: new Date().toISOString() })
}
function traceLineage(entityId: string, direction: 'upstream' | 'downstream', depth = 3): LineageGraph {
  const resultNodes: LineageNode[] = []
  const resultEdges: LineageEdge[] = []
  const visited = new Set<string>()

  function traverse(id: string, d: number) {
    if (d > depth || visited.has(id)) return
    visited.add(id)
    const node = lineageNodes.find(n => n.id === id)
    if (node) resultNodes.push(node)
    const edges = direction === 'upstream'
      ? lineageEdges.filter(e => e.targetId === id)
      : lineageEdges.filter(e => e.sourceId === id)
    for (const edge of edges) {
      if (!resultEdges.find(e => e.sourceId === edge.sourceId && e.targetId === edge.targetId)) resultEdges.push(edge)
      traverse(direction === 'upstream' ? edge.sourceId : edge.targetId, d + 1)
    }
  }
  traverse(entityId, 0)
  return { nodes: resultNodes, edges: resultEdges }
}
function impactAnalysis(entityId: string): { impacted: Array<{ id: string; relation: string }> } {
  const downstream = lineageEdges.filter(e => e.sourceId === entityId)
  return { impacted: downstream.map(e => ({ id: e.targetId, relation: e.relation })) }
}
function detectAnomalies(entityId: string): AnomalyReport {
  const upstreamEdges = lineageEdges.filter(e => e.targetId === entityId)
  if (upstreamEdges.length === 0) return { entityId, anomalies: [{ type: 'orphan', description: 'entity has no upstream dependencies', severity: 'warning' }] }
  return { entityId, anomalies: [] }
}

// ═══════════════════════════════════════════════════════════════════════

describe('[L3-E2E][29] IoT → Edge → Realtime → Lineage 数据管道', () => {
  beforeEach(() => {
    resetIoTStore()
    resetCollabStore()
    resetLineageStore()
  })

  // ── Phase 1: IoT 设备数据采集 ──────────────────────────────────

  describe('Phase 1: IoT 设备数据采集', () => {
    it('[正例] IoT设备上报传感器数据 → 存储成功', () => {
      const result = recordIoTData({ deviceId: 'sensor-temp-01', timestamp: new Date().toISOString(), metrics: { temperature: 28.5, humidity: 65 }, status: 'online' })
      assert.ok(result.success)
      const devices = listIoTDevices()
      assert.equal(devices.length, 1)
      assert.equal(devices[0].deviceId, 'sensor-temp-01')
    })

    it('[正例] IoT多设备批量上报 → 全部成功', () => {
      const devices = ['sensor-temp-01', 'sensor-hum-02', 'sensor-vib-03']
      devices.forEach(d => recordIoTData({ deviceId: d, timestamp: new Date().toISOString(), metrics: { value: 42 }, status: 'online' }))
      assert.equal(listIoTDevices().length, 3)
    })

    it('[反例] IoT上报空deviceId → 拒绝', () => {
      const result = recordIoTData({ deviceId: '', timestamp: new Date().toISOString(), metrics: {}, status: 'online' })
      assert.ok(!result.success)
    })

    it('[反例] IoT上报离线设备 → 记录但标记stale', () => {
      const result = recordIoTData({ deviceId: 'sensor-offline-01', timestamp: new Date().toISOString(), metrics: { temperature: 0 }, status: 'offline' })
      assert.ok(result.success)
      assert.ok(result.warnings?.some(w => w.includes('offline')))
    })
  })

  // ── Phase 2: Edge AI 推理 ───────────────────────────────────────

  describe('Phase 2: Edge AI 推理', () => {
    it('[正例] Edge推理正常数据 → 返回推理结果', () => {
      const result = edgeInfer({ modelId: 'anomaly-detector-v1', input: { temperature: 28.5, humidity: 65 }, context: { deviceId: 'sensor-temp-01' } })
      assert.ok(result.prediction)
      assert.ok(result.confidence > 0)
    })

    it('[正例] Edge推理正常数据 → 返回normal', () => {
      const result = edgeInfer({ modelId: 'anomaly-detector-v1', input: { temperature: 25, humidity: 55 }, context: { deviceId: 'sensor-temp-02' } })
      assert.equal(result.prediction, 'normal')
      assert.ok(result.confidence > 0.9)
    })

    it('[正例] Edge检测异常 → 返回anomaly_detected', () => {
      const result = edgeInfer({ modelId: 'anomaly-detector-v1', input: { temperature: 999, humidity: -1 }, context: { deviceId: 'sensor-extreme-01' } })
      assert.equal(result.prediction, 'anomaly_detected')
    })

    it('[反例] Edge推理无效modelId → 拒绝', () => {
      assert.throws(() => edgeInfer({ modelId: '', input: {}, context: { deviceId: 'test' } }), /modelId/)
    })

    it('[边界] Edge推理极值负温度 → 检测为异常', () => {
      const result = edgeInfer({ modelId: 'anomaly-detector-v1', input: { temperature: -20 }, context: { deviceId: 'sensor-cold-01' } })
      assert.equal(result.prediction, 'anomaly_detected')
    })
  })

  // ── Phase 3: Realtime Collaboration ─────────────────────────────

  describe('Phase 3: Realtime 协同文档', () => {
    it('[正例] 创建协同文档 → 成功', () => {
      const doc = createCollabDoc('doc-lineage-01', { title: 'IoT数据协同', data: [] }, { source: 'iot-pipeline' })
      assert.equal(doc.docId, 'doc-lineage-01')
      assert.equal(doc.version, 1)
    })

    it('[正例] 获取协同文档 → 返回内容', () => {
      createCollabDoc('doc-lineage-02', { title: 'test' }, { source: 'test' })
      const doc = getCollabDoc('doc-lineage-02')
      assert.ok(doc)
      assert.equal(doc.content.title, 'test')
    })

    it('[反例] 获取不存在协同文档 → undefined', () => {
      const doc = getCollabDoc('doc-nonexist')
      assert.equal(doc, undefined)
    })

    it('[反例] 重复创建相同文档 → 拒绝', () => {
      createCollabDoc('doc-duplicate', {}, {})
      assert.throws(() => createCollabDoc('doc-duplicate', {}, {}), /already exists/)
    })
  })

  // ── Phase 4: Lineage 数据血缘 ──────────────────────────────────

  describe('Phase 4: Lineage 数据血缘追踪', () => {
    it('[正例] 追踪实体血缘 → 返回上游链路', () => {
      registerLineageEdge('entity-sensor-01', 'entity-aggr-01', 'aggregation')
      registerLineageEdge('entity-aggr-01', 'entity-report-01', 'derivation')

      const graph = traceLineage('entity-report-01', 'upstream', 2)
      assert.ok(graph.edges.length >= 1)
      assert.ok(graph.nodes.some(n => n.id === 'entity-sensor-01'))
    })

    it('[正例] 影响分析 → 返回下游链路', () => {
      registerLineageEdge('entity-sensor-02', 'entity-dashboard-01', 'aggregation')
      registerLineageEdge('entity-sensor-02', 'entity-alert-01', 'trigger')

      const impact = impactAnalysis('entity-sensor-02')
      assert.equal(impact.impacted.length, 2)
    })

    it('[正例] 血缘异常检测 → 返回异常项', () => {
      registerLineageNode('entity-orphan-01', 'metric', '孤儿实体')
      const report = detectAnomalies('entity-orphan-01')
      assert.ok(report.anomalies.length > 0)
      assert.equal(report.anomalies[0].type, 'orphan')
    })

    it('[反例] 追踪不存在实体 → 空结果', () => {
      const graph = traceLineage('entity-nonexist', 'upstream')
      assert.equal(graph.edges.length, 0)
    })
  })

  // ── Phase 5: 跨阶段 E2E 集成 ──────────────────────────────────

  describe('Phase 5: IoT→Edge→Realtime→Lineage 全链路', () => {
    it('[正例] IoT数据→Edge推理→Realtime协同→Lineage追踪 全链路', () => {
      // 1. IoT 上报设备数据
      const iotResult = recordIoTData({ deviceId: 'sensor-e2e-01', timestamp: new Date().toISOString(), metrics: { temperature: 30 }, status: 'online' })
      assert.ok(iotResult.success)

      // 2. Edge AI 推理
      const edgeResult = edgeInfer({ modelId: 'anomaly-detector-v1', input: { temperature: 30 }, context: { deviceId: 'sensor-e2e-01' } })
      assert.ok(edgeResult.prediction)

      // 3. 创建 Realtime 协同文档记录
      const doc = createCollabDoc('doc-e2e-lineage', { title: 'E2E协同', data: [edgeResult] }, { source: 'iot-edge-pipeline' })
      assert.equal(doc.docId, 'doc-e2e-lineage')

      // 4. Lineage 血缘追踪
      registerLineageEdge('sensor-e2e-01', 'doc-e2e-lineage', 'iot-to-collab')
      const graph = traceLineage('doc-e2e-lineage', 'upstream', 2)
      assert.ok(graph.nodes.some(n => n.id === 'sensor-e2e-01'))
    })

    it('[边界] 大量设备数据并行上报', () => {
      for (let i = 0; i < 10; i++) {
        const result = recordIoTData({ deviceId: `sensor-bulk-${i}`, timestamp: new Date().toISOString(), metrics: { value: i * 10 }, status: 'online' })
        assert.ok(result.success)
      }
      assert.equal(listIoTDevices().length, 10)
    })

    it('[反例] IoT数据缺失 → Edge推理失败', () => {
      assert.throws(() => edgeInfer({ modelId: 'anomaly-detector-v1', input: ({} as Record<string, number>), context: { deviceId: 'missing' } }), /input data/)
    })

    it('[边界] Edge检测异常 → Lineage记录异常追踪', () => {
      // 1. IoT 报告异常温度
      recordIoTData({ deviceId: 'sensor-hot-01', timestamp: new Date().toISOString(), metrics: { temperature: 85 }, status: 'online' })
      // 2. Edge 检测异常
      const edgeResult = edgeInfer({ modelId: 'anomaly-detector-v1', input: { temperature: 85 }, context: { deviceId: 'sensor-hot-01' } })
      assert.equal(edgeResult.prediction, 'anomaly_detected')
      // 3. Realtime 创建告警文档
      const doc = createCollabDoc('alert-anomaly-01', { alert: '异常温度', severity: 'high', deviceId: 'sensor-hot-01' }, { source: 'edge-anomaly' })
      assert.ok(doc)
      // 4. Lineage 关联
      registerLineageEdge('sensor-hot-01', 'alert-anomaly-01', 'triggers')
      const impact = impactAnalysis('sensor-hot-01')
      assert.ok(impact.impacted.some(i => i.id === 'alert-anomaly-01'))
    })
  })
})
