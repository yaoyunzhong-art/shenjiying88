import { Injectable, Logger } from '@nestjs/common';

export interface FeedbackEntry {
  id: string;
  userId: string;
  tenantId: string;
  type: 'rating' | 'comment' | 'report' | 'suggestion';
  score: number; // 1-5
  content: string;
  source: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  category: string;
  metadata: Record<string, unknown>;
}

export interface FeedbackStats {
  total: number;
  avgScore: number;
  distribution: Record<string, number>;
  bySource: Record<string, number>;
  byCategory: Record<string, number>;
  recentTrend: number[];
}

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
  private entries: FeedbackEntry[] = [];
  private seq = 0;

  submit(entry: Omit<FeedbackEntry, 'id' | 'createdAt'>): FeedbackEntry {
    const id = `fb_${++this.seq}_${Date.now()}`;
    const full: FeedbackEntry = { ...entry, id, createdAt: new Date().toISOString() };
    this.entries.push(full);
    this.logger.log(`Feedback submitted: ${id} (${entry.type}, score=${entry.score})`);
    return full;
  }

  resolve(id: string, resolution: string): FeedbackEntry | null {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) return null;
    entry.resolvedAt = new Date().toISOString();
    entry.resolution = resolution;
    return entry;
  }

  list(options?: { tenantId?: string; type?: string; limit?: number; offset?: number }): FeedbackEntry[] {
    let result = [...this.entries];
    if (options?.tenantId) result = result.filter(e => e.tenantId === options.tenantId);
    if (options?.type) result = result.filter(e => e.type === options.type);
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 20;
    return result.slice(offset, offset + limit);
  }

  getStats(tenantId?: string): FeedbackStats {
    const filtered = tenantId ? this.entries.filter(e => e.tenantId === tenantId) : this.entries;
    const total = filtered.length;
    const avgScore = total > 0
      ? filtered.reduce((s, e) => s + e.score, 0) / total
      : 0;
    const distribution: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    filtered.forEach(e => {
      distribution[e.score] = (distribution[e.score] || 0) + 1;
      bySource[e.source] = (bySource[e.source] || 0) + 1;
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    });
    // 最近7天趋势
    const now = Date.now();
    const recentTrend: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - i * 86400000).toISOString().slice(0, 10);
      const dayEnd = new Date(now - (i - 1) * 86400000).toISOString().slice(0, 10);
      const count = filtered.filter(e => e.createdAt >= dayStart && e.createdAt < dayEnd).length;
      recentTrend.push(count);
    }
    return { total, avgScore, distribution, bySource, byCategory, recentTrend };
  }
}
