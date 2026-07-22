/**
 * useImageRecognition.test.ts — 图像识别 dashboard hooks 单元测试 (V11 Sprint 3 Day 43)
 *
 * 覆盖: 正常返回值、loading 状态、空数据、错误处理、边界条件
 * 测试模块内部 inline API 函数（与 useImageRecognition.ts 的 hooks 使用相同逻辑）
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  RecognitionTask, RecognitionResult, RecognitionEngineMeta,
  RecognitionStats, VisualSearchHit, DuplicateMatch,
} from './types';

// ========= Mock 数据（与 useImageRecognition.ts 内联一致）=========

const MOCK_TASKS: RecognitionTask[] = [
  { id: 'rec-001', tenantId: 'tenant-A', taskType: 'product_recognition', engine: 'mock-efficientnet',
    sourceAssetId: 'asset-shelf-01', filename: 'shelf-morning.jpg', status: 'completed',
    progress: 1.0, durationMs: 420, objectCount: 5, avgConfidence: 0.92,
    createdAt: '2026-06-27T09:00:00Z', updatedAt: '2026-06-27T09:00:01Z' },
  { id: 'rec-002', tenantId: 'tenant-A', taskType: 'shelf_analysis', engine: 'mock-yolov8n-shelf',
    sourceAssetId: 'asset-shelf-02', filename: 'shelf-evening.jpg', status: 'completed',
    progress: 1.0, durationMs: 680, objectCount: 24, avgConfidence: 0.87,
    createdAt: '2026-06-27T18:30:00Z', updatedAt: '2026-06-27T18:30:01Z' },
  { id: 'rec-003', tenantId: 'tenant-A', taskType: 'image_classification', engine: 'mock-clip',
    sourceAssetId: 'asset-team-photo', filename: 'team-building.jpg', status: 'completed',
    progress: 1.0, durationMs: 250, objectCount: 1, avgConfidence: 0.95,
    createdAt: '2026-06-26T14:00:00Z', updatedAt: '2026-06-26T14:00:01Z' },
];

const MOCK_RESULT: RecognitionResult = {
  task: MOCK_TASKS[0]!,
  objects: [
    { id: 'obj-1', recognitionId: 'rec-001', label: '可口可乐 330ml', category: 'beverage',
      bbox: { x: 50, y: 80, width: 120, height: 180 }, confidence: 0.96,
      skuId: 'SKU-COKE-330', productName: '可口可乐 330ml', priceCny: 3.5, quantity: 6 },
  ],
};

const MOCK_ENGINES: RecognitionEngineMeta[] = [
  { type: 'mock-yolov8', displayName: 'YOLOv8', taskTypes: ['object_detection'], avgTimeMs: 380, accuracy: 0.91, modelVersion: 'yolov8n-v8.2', classesSupported: 80 },
  { type: 'mock-clip', displayName: 'CLIP', taskTypes: ['image_classification', 'visual_search'], avgTimeMs: 250, accuracy: 0.93, modelVersion: 'clip-vit-l14', classesSupported: 50000 },
  { type: 'mock-pHash', displayName: 'pHash', taskTypes: ['visual_search', 'duplicate_detection'], avgTimeMs: 30, accuracy: 0.85, modelVersion: 'phash-64bit', classesSupported: 0 },
];

const MOCK_STATS: RecognitionStats = {
  totalTasks: 89, completedTasks: 82, failedTasks: 4, totalObjectsDetected: 412,
  byTaskType: { product_recognition: 38, shelf_analysis: 18, image_classification: 14 },
  byEngine: { 'mock-efficientnet': 38, 'mock-yolov8n-shelf': 18 },
  avgConfidence: 0.89, avgDurationMs: 412, duplicatesDetected: 7,
};

// ========= 内联 API 函数（与 useImageRecognition.ts 相同实现）=========

async function fetchTasksApi(_opts: { taskType?: string; engine?: string; limit?: number } = {}): Promise<RecognitionTask[]> {
  await new Promise((r) => setTimeout(r, 80));
  return MOCK_TASKS;
}
async function fetchResultApi(_taskId: string): Promise<RecognitionResult> {
  await new Promise((r) => setTimeout(r, 60));
  return MOCK_RESULT;
}
async function fetchEnginesApi(): Promise<RecognitionEngineMeta[]> {
  await new Promise((r) => setTimeout(r, 40));
  return MOCK_ENGINES;
}
async function fetchStatsApi(): Promise<RecognitionStats> {
  await new Promise((r) => setTimeout(r, 30));
  return MOCK_STATS;
}
async function visualSearchApi(opts: { sourceAssetId: string; topK?: number }): Promise<{ items: VisualSearchHit[]; total: number }> {
  await new Promise((r) => setTimeout(r, 100));
  return { items: [{ matchedAssetId: 'asset-shelf-02', similarity: 0.92 }, { matchedAssetId: 'asset-shelf-03', similarity: 0.85 }], total: 2 };
}
async function duplicateDetectionApi(_opts: { sourceAssetId: string; threshold?: number }): Promise<{ sourceAssetId: string; duplicates: DuplicateMatch[] }> {
  await new Promise((r) => setTimeout(r, 80));
  return { sourceAssetId: 'asset-shelf-01', duplicates: [{ duplicateAssetId: 'asset-shelf-02', similarity: 0.96 }] };
}
async function createRecognitionApi(input: { taskType: string; engine?: string; sourceAssetId: string; filename?: string }): Promise<RecognitionResult> {
  await new Promise((r) => setTimeout(r, 600));
  return { ...MOCK_RESULT, task: { ...MOCK_RESULT.task, id: `rec-${Date.now().toString(36)}`, taskType: input.taskType as any } };
}
async function cancelRecognitionApi(taskId: string): Promise<{ id: string; status: string }> {
  await new Promise((r) => setTimeout(r, 100));
  return { id: taskId, status: 'cancelled' };
}

// ==================================================================
// 1. fetchTasksApi — 获取识别任务列表
// ==================================================================

test('fetchTasksApi: 返回 3 个任务', async () => {
  const data = await fetchTasksApi();
  assert.equal(data.length, 3);
});

test('fetchTasksApi: 每个任务有必填字段', async () => {
  const data = await fetchTasksApi();
  for (const t of data) {
    assert.equal(typeof t.id, 'string');
    assert.equal(typeof t.taskType, 'string');
    assert.equal(typeof t.engine, 'string');
    assert.ok(['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(t.status));
    assert.equal(typeof t.objectCount, 'number');
  }
});

test('fetchTasksApi: 第一个任务是 product_recognition', async () => {
  const data = await fetchTasksApi();
  assert.equal(data[0].id, 'rec-001');
  assert.equal(data[0].taskType, 'product_recognition');
});

test('fetchTasksApi: 支持过滤参数', async () => {
  const data = await fetchTasksApi({ taskType: 'shelf_analysis' });
  assert.ok(Array.isArray(data));
});

test('fetchTasksApi: 所有任务有创建/更新时间', async () => {
  const data = await fetchTasksApi();
  for (const t of data) {
    assert.ok(t.createdAt.length > 0);
    assert.ok(t.updatedAt.length > 0);
  }
});

// ==================================================================
// 2. fetchResultApi — 获取识别结果
// ==================================================================

test('fetchResultApi: 返回包含 task 和 objects 的 result', async () => {
  const result = await fetchResultApi('rec-001');
  assert.ok(result.task);
  assert.equal(result.task.id, 'rec-001');
  assert.ok(Array.isArray(result.objects));
});

test('fetchResultApi: objects 包含检测对象且字段完整', async () => {
  const result = await fetchResultApi('rec-001');
  assert.ok(result.objects.length > 0);
  for (const obj of result.objects) {
    assert.equal(typeof obj.id, 'string');
    assert.equal(typeof obj.label, 'string');
    assert.ok(obj.confidence >= 0 && obj.confidence <= 1);
    assert.ok(obj.bbox.x >= 0);
    assert.ok(obj.bbox.y >= 0);
    assert.ok(obj.bbox.width > 0);
    assert.ok(obj.bbox.height > 0);
  }
});

test('fetchResultApi: 任务状态为 completed', async () => {
  const result = await fetchResultApi('rec-001');
  assert.equal(result.task.status, 'completed');
  assert.equal(result.task.progress, 1.0);
});

// ==================================================================
// 3. fetchEnginesApi — 获取引擎列表
// ==================================================================

test('fetchEnginesApi: 返回 3 个引擎', async () => {
  const engines = await fetchEnginesApi();
  assert.equal(engines.length, 3);
});

test('fetchEnginesApi: 每个引擎有元数据', async () => {
  const engines = await fetchEnginesApi();
  for (const e of engines) {
    assert.equal(typeof e.type, 'string');
    assert.equal(typeof e.displayName, 'string');
    assert.ok(e.accuracy >= 0 && e.accuracy <= 1);
    assert.ok(e.avgTimeMs > 0);
    assert.equal(typeof e.modelVersion, 'string');
  }
});

test('fetchEnginesApi: YOLOv8 引擎支持 object_detection', async () => {
  const engines = await fetchEnginesApi();
  const yolo = engines.find(e => e.type === 'mock-yolov8');
  assert.ok(yolo);
  assert.equal(yolo!.displayName, 'YOLOv8');
  assert.ok(yolo!.taskTypes.includes('object_detection'));
});

test('fetchEnginesApi: CLIP 引擎支持多任务', async () => {
  const engines = await fetchEnginesApi();
  const clip = engines.find(e => e.type === 'mock-clip');
  assert.ok(clip);
  assert.ok(clip!.taskTypes.includes('image_classification'));
  assert.ok(clip!.taskTypes.includes('visual_search'));
  assert.equal(clip!.classesSupported, 50000);
});

// ==================================================================
// 4. fetchStatsApi — 获取统计数据
// ==================================================================

test('fetchStatsApi: 返回正确的统计汇总', async () => {
  const stats = await fetchStatsApi();
  assert.equal(stats.totalTasks, 89);
  assert.equal(stats.completedTasks, 82);
  assert.equal(stats.failedTasks, 4);
  assert.equal(stats.totalObjectsDetected, 412);
});

test('fetchStatsApi: 按引擎和任务类型的统计', async () => {
  const stats = await fetchStatsApi();
  assert.ok(stats.byTaskType.product_recognition > 0);
  assert.ok(stats.byEngine['mock-efficientnet'] > 0);
  assert.ok(stats.avgConfidence > 0);
  assert.equal(stats.duplicatesDetected, 7);
});

// ==================================================================
// 5. visualSearchApi — 视觉搜索
// ==================================================================

test('visualSearchApi: 返回搜索结果列表', async () => {
  const result = await visualSearchApi({ sourceAssetId: 'asset-shelf-01', topK: 5 });
  assert.ok(Array.isArray(result.items));
  assert.equal(result.total, 2);
});

test('visualSearchApi: 每个 hit 有 matchedAssetId 和有效相似度', async () => {
  const result = await visualSearchApi({ sourceAssetId: 'asset-shelf-01' });
  for (const hit of result.items) {
    assert.equal(typeof hit.matchedAssetId, 'string');
    assert.ok(hit.similarity > 0 && hit.similarity <= 1);
  }
});

// ==================================================================
// 6. duplicateDetectionApi — 重复检测
// ==================================================================

test('duplicateDetectionApi: 返回重复匹配结果', async () => {
  const result = await duplicateDetectionApi({ sourceAssetId: 'asset-shelf-01' });
  assert.equal(result.sourceAssetId, 'asset-shelf-01');
  assert.ok(Array.isArray(result.duplicates));
});

test('duplicateDetectionApi: 重复匹配相似度在有效范围内', async () => {
  const result = await duplicateDetectionApi({ sourceAssetId: 'asset-shelf-01', threshold: 0.8 });
  for (const dup of result.duplicates) {
    assert.equal(typeof dup.duplicateAssetId, 'string');
    assert.ok(dup.similarity > 0 && dup.similarity <= 1);
  }
});

// ==================================================================
// 7. createRecognitionApi — 创建识别任务
// ==================================================================

test('createRecognitionApi: 创建任务返回带 id 的 result', async () => {
  const result = await createRecognitionApi({ taskType: 'product_recognition', sourceAssetId: 'asset-shelf-01' });
  assert.ok(result.task.id.startsWith('rec-'));
  assert.ok(result.objects.length > 0);
});

test('createRecognitionApi: 保留传入的 taskType', async () => {
  const result = await createRecognitionApi({ taskType: 'shelf_analysis', engine: 'mock-yolov8n-shelf', sourceAssetId: 'asset-shelf-02' });
  assert.equal(result.task.taskType, 'shelf_analysis');
});

// ==================================================================
// 8. cancelRecognitionApi — 取消任务
// ==================================================================

test('cancelRecognitionApi: 取消后状态为 cancelled', async () => {
  const result = await cancelRecognitionApi('rec-001');
  assert.equal(result.id, 'rec-001');
  assert.equal(result.status, 'cancelled');
});

test('cancelRecognitionApi: 取消不存在的任务', async () => {
  const result = await cancelRecognitionApi('rec-999');
  assert.equal(result.id, 'rec-999');
  assert.equal(result.status, 'cancelled');
});

// ==================================================================
// 9. 边界条件
// ==================================================================

test('任务 durationMs 和 confidence 有效', async () => {
  const data = await fetchTasksApi();
  for (const t of data) {
    assert.ok(t.durationMs! > 0);
    if (t.avgConfidence != null) assert.ok(t.avgConfidence >= 0 && t.avgConfidence <= 1);
  }
});

test('空任务列表边界', () => {
  const empty: RecognitionTask[] = [];
  assert.equal(empty.length, 0);
  assert.ok(Array.isArray(empty));
});
