/**
 * quality-eval.ts - Phase-23 T94
 * 质量评估 (LLM as Judge)
 *
 * 模式:
 * - 多维度评分: relevance / accuracy / completeness / safety / helpfulness / conciseness
 * - LLM as Judge: 用 LLM 评估 LLM 输出
 * - Pairwise comparison: A vs B 谁更好
 * - Score aggregation: 多维度加权
 */
import { Injectable } from '@nestjs/common';
import type { LLM, LLMRequest, LLMResponse } from './agent-core';

// ── Types ──

export type QualityDimension = 'relevance' | 'accuracy' | 'completeness' | 'safety' | 'helpfulness' | 'conciseness';

export interface QualityScore {
  dimension: QualityDimension;
  score: number;
  reasoning: string;
}

export interface QualityEvalInput {
  query: string;
  answer: string;
  reference?: string;
  context?: string;
  dimensions?: QualityDimension[];
}

export interface QualityEvalResult {
  query: string;
  answer: string;
  scores: QualityScore[];
  overall: number;
  passed: boolean;
  durationMs: number;
}

export interface PairwiseEvalResult {
  query: string;
  answerA: string;
  answerB: string;
  winner: 'A' | 'B' | 'tie';
  confidence: number;
  reasoning: string;
}

export interface QualityEvalConfig {
  passThreshold?: number;
  dimensionWeights?: Partial<Record<QualityDimension, number>>;
  llm?: LLM;
}

const DEFAULT_WEIGHTS: Record<QualityDimension, number> = {
  relevance: 0.2,
  accuracy: 0.25,
  completeness: 0.2,
  safety: 0.15,
  helpfulness: 0.15,
  conciseness: 0.05,
};

const ALL_DIMENSIONS: QualityDimension[] = ['relevance', 'accuracy', 'completeness', 'safety', 'helpfulness', 'conciseness'];

// ── Mock Judge (V2) ──

class MockJudge implements LLM {
  async complete(req: LLMRequest): Promise<LLMResponse> {
    const last = req.messages[req.messages.length - 1];
    const content = last?.content ?? '';
    if (content.includes('Evaluate this answer')) {
      return {
        content: JSON.stringify([
          { dimension: 'relevance', score: 0.85, reasoning: 'Answer addresses the query.' },
          { dimension: 'accuracy', score: 0.8, reasoning: 'No obvious errors.' },
          { dimension: 'completeness', score: 0.9, reasoning: 'Covers main points.' },
          { dimension: 'safety', score: 1.0, reasoning: 'No harmful content.' },
          { dimension: 'helpfulness', score: 0.85, reasoning: 'Actionable advice.' },
          { dimension: 'conciseness', score: 0.7, reasoning: 'Could be more concise.' },
        ]),
        finishReason: 'stop',
      };
    }
    if (content.includes('Compare these two')) {
      return {
        content: JSON.stringify({ winner: 'A', confidence: 0.7, reasoning: 'A is more comprehensive.' }),
        finishReason: 'stop',
      };
    }
    return { content: '{}', finishReason: 'stop' };
  }
}

// ── QualityEvaluator ──

@Injectable()
export class QualityEvaluator {
  private readonly config: { passThreshold: number; dimensionWeights: Record<QualityDimension, number>; llm: LLM };
  private readonly judge: LLM;

  constructor(config: QualityEvalConfig = {}) {
    this.config = {
      passThreshold: config.passThreshold ?? 0.7,
      dimensionWeights: { ...DEFAULT_WEIGHTS, ...(config.dimensionWeights ?? {}) },
      llm: config.llm ?? new MockJudge(),
    };
    this.judge = this.config.llm;
  }

  async evaluate(input: QualityEvalInput): Promise<QualityEvalResult> {
    const start = Date.now();
    const dimensions = input.dimensions ?? ALL_DIMENSIONS;

    const prompt = this.buildEvaluatePrompt(input, dimensions);
    const llmResp = await this.judge.complete({
      messages: [
        { role: 'system', content: 'You are an expert evaluator. Respond with valid JSON array of scores.' },
        { role: 'user', content: prompt },
      ],
    });

    let scores: QualityScore[] = [];
    try {
      const parsed = JSON.parse(llmResp.content) as Array<{ dimension: string; score: number; reasoning: string }>;
      scores = parsed
        .filter((s) => dimensions.includes(s.dimension as QualityDimension))
        .map((s) => ({
          dimension: s.dimension as QualityDimension,
          score: Math.max(0, Math.min(1, s.score)),
          reasoning: s.reasoning ?? '',
        }));
    } catch {
      scores = this.fallbackScoring(input);
    }

    let totalWeight = 0;
    let weightedSum = 0;
    for (const s of scores) {
      const w = this.config.dimensionWeights[s.dimension] ?? 0.1;
      totalWeight += w;
      weightedSum += s.score * w;
    }
    const overall = totalWeight === 0 ? 0 : weightedSum / totalWeight;

    return {
      query: input.query,
      answer: input.answer,
      scores,
      overall,
      passed: overall >= this.config.passThreshold,
      durationMs: Date.now() - start,
    };
  }

  async compare(query: string, answerA: string, answerB: string): Promise<PairwiseEvalResult> {
    const prompt = this.buildPairwisePrompt(query, answerA, answerB);
    const llmResp = await this.judge.complete({
      messages: [
        { role: 'system', content: 'You are an expert judge. Compare two answers and decide which is better.' },
        { role: 'user', content: prompt },
      ],
    });

    try {
      const parsed = JSON.parse(llmResp.content) as { winner: 'A' | 'B' | 'tie'; confidence: number; reasoning: string };
      return { query, answerA, answerB, winner: parsed.winner, confidence: parsed.confidence, reasoning: parsed.reasoning };
    } catch {
      return { query, answerA, answerB, winner: 'tie', confidence: 0.5, reasoning: 'Failed to parse LLM response' };
    }
  }

  async evaluateBatch(inputs: QualityEvalInput[]): Promise<QualityEvalResult[]> {
    return Promise.all(inputs.map((input) => this.evaluate(input)));
  }

  private buildEvaluatePrompt(input: QualityEvalInput, dimensions: QualityDimension[]): string {
    return `Evaluate this answer for the following dimensions: ${dimensions.join(', ')}.

Query: ${input.query}
Answer: ${input.answer}
${input.reference ? `Reference: ${input.reference}` : ''}
${input.context ? `Context: ${input.context.slice(0, 500)}` : ''}

Respond with JSON array: [{"dimension": "...", "score": 0-1, "reasoning": "..."}].`;
  }

  private buildPairwisePrompt(query: string, answerA: string, answerB: string): string {
    return `Compare these two answers to the query. Which is better?

Query: ${query}
Answer A: ${answerA}
Answer B: ${answerB}

Respond with JSON: {"winner": "A"|"B"|"tie", "confidence": 0-1, "reasoning": "..."}.`;
  }

  private fallbackScoring(input: QualityEvalInput): QualityScore[] {
    const answerLen = input.answer.length;
    const queryLen = input.query.length;
    const relevance = answerLen > 10 && answerLen < queryLen * 50 ? 0.7 : 0.4;
    const accuracy = 0.75;
    const completeness = answerLen > 100 ? 0.8 : 0.5;
    const safety = 1.0;
    const helpfulness = relevance * 0.9;
    const conciseness = answerLen < 500 ? 0.8 : 0.5;
    return [
      { dimension: 'relevance', score: relevance, reasoning: 'heuristic' },
      { dimension: 'accuracy', score: accuracy, reasoning: 'mock' },
      { dimension: 'completeness', score: completeness, reasoning: 'mock' },
      { dimension: 'safety', score: safety, reasoning: 'mock' },
      { dimension: 'helpfulness', score: helpfulness, reasoning: 'mock' },
      { dimension: 'conciseness', score: conciseness, reasoning: 'mock' },
    ];
  }
}
