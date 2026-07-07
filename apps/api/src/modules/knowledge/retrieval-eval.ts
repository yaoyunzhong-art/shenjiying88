/**
 * retrieval-eval.ts - Phase-23 T83
 * 检索评估框架
 *
 * 指标:
 * - Recall@K: 前 K 个结果中包含 relevant docs 的比例
 * - Precision@K: 前 K 个结果中 relevant 占的比例
 * - MRR (Mean Reciprocal Rank): 第一个 relevant doc 的倒数排名
 * - NDCG@K: 归一化折损累积增益
 * - MAP (Mean Average Precision): 平均精度均值
 *
 * 用法:
 *   const evaluator = new RetrievalEvaluator();
 *   const result = evaluator.evaluate({
 *     queries: [{ queryId: 'q1', query: '...', relevant: ['d1', 'd3'] }],
 *     results: [{ queryId: 'q1', retrieved: ['d2', 'd1', 'd4', 'd3'] }],
 *   });
 *   console.log(result.recallAt10, result.mrr, result.ndcgAt10);
 */

// ── Types ──

export interface QuerySpec {
  queryId: string;
  query: string;
  /** relevant doc ids (ground truth) */
  relevant: string[];
}

export interface RetrievalResult {
  queryId: string;
  /** 检索返回的 doc ids (按排名降序) */
  retrieved: string[];
  /** 命中文档的相关性分数 (optional, 用于 NDCG graded) */
  relevanceScores?: Record<string, number>;
}

export interface EvalReport {
  totalQueries: number;
  recallAt1: number;
  recallAt5: number;
  recallAt10: number;
  precisionAt1: number;
  precisionAt5: number;
  precisionAt10: number;
  mrr: number;
  ndcgAt5: number;
  ndcgAt10: number;
  map: number;
  /** Per-query 详情 */
  perQuery: Array<{
    queryId: string;
    recallAt10: number;
    mrr: number;
    ndcgAt10: number;
  }>;
}

// ── Metric 计算 ──

export function computeRecallAtK(retrieved: string[], relevant: string[], k: number): number {
  if (relevant.length === 0) return 0;
  const topK = new Set(retrieved.slice(0, k));
  const hits = relevant.filter((id) => topK.has(id)).length;
  return hits / relevant.length;
}

export function computePrecisionAtK(retrieved: string[], relevant: string[], k: number): number {
  if (k === 0) return 0;
  const topK = retrieved.slice(0, k);
  const relSet = new Set(relevant);
  const hits = topK.filter((id) => relSet.has(id)).length;
  return hits / topK.length;
}

export function computeMRR(retrieved: string[], relevant: string[]): number {
  const relSet = new Set(relevant);
  for (let i = 0; i < retrieved.length; i++) {
    if (relSet.has(retrieved[i])) return 1 / (i + 1);
  }
  return 0;
}

export function computeNDCGAtK(
  retrieved: string[],
  relevanceScores: Record<string, number>,
  relevant: string[],
  k: number,
): number {
  const topK = retrieved.slice(0, k);

  // DCG: sum(rel_i / log2(i+2))
  let dcg = 0;
  for (let i = 0; i < topK.length; i++) {
    const rel = relevanceScores[topK[i]] ?? (relevant.includes(topK[i]) ? 1 : 0);
    dcg += (Math.pow(2, rel) - 1) / Math.log2(i + 2);
  }

  // IDCG: ideal ranking
  const idealRels = relevant
    .map((id) => relevanceScores[id] ?? 1)
    .sort((a, b) => b - a);
  let idcg = 0;
  for (let i = 0; i < idealRels.length && i < k; i++) {
    idcg += (Math.pow(2, idealRels[i]) - 1) / Math.log2(i + 2);
  }

  return idcg === 0 ? 0 : dcg / idcg;
}

export function computeMAP(perQueryAP: number[]): number {
  if (perQueryAP.length === 0) return 0;
  return perQueryAP.reduce((s, ap) => s + ap, 0) / perQueryAP.length;
}

function computeAP(retrieved: string[], relevant: string[]): number {
  const relSet = new Set(relevant);
  let hits = 0;
  let sumPrecision = 0;
  for (let i = 0; i < retrieved.length; i++) {
    if (relSet.has(retrieved[i])) {
      hits++;
      sumPrecision += hits / (i + 1);
    }
  }
  return relevant.length === 0 ? 0 : sumPrecision / relevant.length;
}

// ── Evaluator ──

export class RetrievalEvaluator {
  private readonly defaultK = [1, 5, 10];

  evaluate(input: {
    queries: QuerySpec[];
    results: RetrievalResult[];
  }): EvalReport {
    const resultMap = new Map(input.results.map((r) => [r.queryId, r]));
    const perQuery: EvalReport['perQuery'] = [];
    const apList: number[] = [];

    const sums = {
      recall1: 0, recall5: 0, recall10: 0,
      precision1: 0, precision5: 0, precision10: 0,
      mrr: 0, ndcg5: 0, ndcg10: 0,
    };

    for (const q of input.queries) {
      const r = resultMap.get(q.queryId);
      if (!r) continue;
      const recall1 = computeRecallAtK(r.retrieved, q.relevant, 1);
      const recall5 = computeRecallAtK(r.retrieved, q.relevant, 5);
      const recall10 = computeRecallAtK(r.retrieved, q.relevant, 10);
      const precision1 = computePrecisionAtK(r.retrieved, q.relevant, 1);
      const precision5 = computePrecisionAtK(r.retrieved, q.relevant, 5);
      const precision10 = computePrecisionAtK(r.retrieved, q.relevant, 10);
      const mrr = computeMRR(r.retrieved, q.relevant);
      const ndcg5 = computeNDCGAtK(r.retrieved, r.relevanceScores ?? {}, q.relevant, 5);
      const ndcg10 = computeNDCGAtK(r.retrieved, r.relevanceScores ?? {}, q.relevant, 10);
      const ap = computeAP(r.retrieved, q.relevant);

      sums.recall1 += recall1;
      sums.recall5 += recall5;
      sums.recall10 += recall10;
      sums.precision1 += precision1;
      sums.precision5 += precision5;
      sums.precision10 += precision10;
      sums.mrr += mrr;
      sums.ndcg5 += ndcg5;
      sums.ndcg10 += ndcg10;
      apList.push(ap);

      perQuery.push({
        queryId: q.queryId,
        recallAt10: recall10,
        mrr,
        ndcgAt10: ndcg10,
      });
    }

    const n = input.queries.length || 1;
    return {
      totalQueries: input.queries.length,
      recallAt1: sums.recall1 / n,
      recallAt5: sums.recall5 / n,
      recallAt10: sums.recall10 / n,
      precisionAt1: sums.precision1 / n,
      precisionAt5: sums.precision5 / n,
      precisionAt10: sums.precision10 / n,
      mrr: sums.mrr / n,
      ndcgAt5: sums.ndcg5 / n,
      ndcgAt10: sums.ndcg10 / n,
      map: computeMAP(apList),
      perQuery,
    };
  }
}

// ── Golden Dataset (人工标注示例) ──

export const SAMPLE_GOLDEN_DATASET = {
  queries: [
    {
      queryId: 'q1',
      query: 'how to handle offline orders',
      relevant: ['d-offline-queue', 'd-sync-engine'],
    },
    {
      queryId: 'q2',
      query: 'mobile push notification setup',
      relevant: ['d-push-notif', 'd-fcm-setup'],
    },
    {
      queryId: 'q3',
      query: 'GDPR data export',
      relevant: ['d-gdpr-export', 'd-audit-log'],
    },
  ] as QuerySpec[],
  results: [
    {
      queryId: 'q1',
      retrieved: ['d-offline-queue', 'd-sync-engine', 'd-other'],
    },
    {
      queryId: 'q2',
      retrieved: ['d-push-notif', 'd-other', 'd-fcm-setup'],
    },
    {
      queryId: 'q3',
      retrieved: ['d-gdpr-export', 'd-other', 'd-audit-log', 'd-foo'],
    },
  ] as RetrievalResult[],
};
