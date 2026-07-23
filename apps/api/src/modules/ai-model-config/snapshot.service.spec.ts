import { afterEach, beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SnapshotService } from './snapshot.service';
import type { AiModelConfigRepository } from './ai-model-config.repository';
import type { AiModelConfigHistory, AiModelStoreConfig } from './ai-model-config.entity';

type MockRepo = Mocked<AiModelConfigRepository> & {
  deleteHistoryBefore: ReturnType<typeof vi.fn>;
  getHistoryStats: ReturnType<typeof vi.fn>;
};

// ── Mocks ───────────────────────────────────────────────────────────────────

function createMockRepo(): MockRepo {
  return {
    listPresets: vi.fn(),
    getPreset: vi.fn(),
    createStoreConfig: vi.fn(),
    listStoreConfigsByStore: vi.fn(),
    getCurrentConfig: vi.fn(),
    switchConfig: vi.fn(),
    listHistory: vi.fn(),
    rollbackToHistory: vi.fn(),
    deleteHistoryBefore: vi.fn(),
    getHistoryStats: vi.fn(),
  } as unknown as MockRepo;
}

function makeHistoryEntry(overrides: Partial<AiModelConfigHistory> = {}): AiModelConfigHistory {
  return {
    id: 'hist-1',
    configId: 'cfg-1',
    changedBy: 'user-1',
    changedAt: '2026-07-20T10:00:00Z',
    versionNumber: 1,
    snapshot: {
      id: 'cfg-1',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      configName: 'gpt-4-config',
      provider: 'openai',
      endpointUrl: 'https://api.openai.com/v1',
      apiKeyEncrypted: 'enc-key-1',
      contextWindow: 8192,
      temperature: 0.7,
      maxTokens: 2048,
      isCurrent: true,
      createdBy: 'user-1',
      createdAt: '2026-07-20T10:00:00Z',
      updatedAt: '2026-07-20T10:00:00Z',
    } as AiModelStoreConfig,
    reason: 'initial setup',
    changeType: 'create',
    ...overrides,
  } as AiModelConfigHistory;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('SnapshotService', () => {
  let service: SnapshotService;
  let repo: MockRepo;

  beforeEach(() => {
    repo = createMockRepo();
    service = new SnapshotService(repo);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── getTimeline ─────────────────────────────────────────────────────────

  describe('getTimeline', () => {
    it('should return timeline from history entries', async () => {
      repo.listHistory.mockResolvedValue([
        makeHistoryEntry(),
      ]);

      const timeline = await service.getTimeline('cfg-1');

      expect(timeline).toHaveLength(1);
      expect(timeline[0].configId).toBe('cfg-1');
      expect(timeline[0].configName).toBe('gpt-4-config');
      expect(timeline[0].provider).toBe('openai');
      expect(timeline[0].changedBy).toBe('user-1');
      expect(timeline[0].changeReason).toBe('initial setup');
    });

    it('should apply default limit of 50', async () => {
      repo.listHistory.mockResolvedValue([]);

      await service.getTimeline('cfg-1');

      expect(repo.listHistory).toHaveBeenCalledWith('cfg-1', 50);
    });

    it('should respect custom limit', async () => {
      repo.listHistory.mockResolvedValue([]);

      await service.getTimeline('cfg-1', 10);

      expect(repo.listHistory).toHaveBeenCalledWith('cfg-1', 10);
    });

    it('should return empty array when no history', async () => {
      repo.listHistory.mockResolvedValue([]);

      const timeline = await service.getTimeline('cfg-1');

      expect(timeline).toEqual([]);
    });

    it('should return fallback empty strings when snapshot fields are missing', async () => {
      repo.listHistory.mockResolvedValue([
        makeHistoryEntry({
          snapshot: {} as AiModelStoreConfig,
        }),
      ]);

      const timeline = await service.getTimeline('cfg-1');

      expect(timeline[0].configName).toBe('');
      expect(timeline[0].provider).toBe('');
    });

    it('should handle string change dates', async () => {
      repo.listHistory.mockResolvedValue([
        makeHistoryEntry({
          changedAt: '2026-07-20T10:00:00Z',
        }),
      ]);

      const timeline = await service.getTimeline('cfg-1');

      expect(timeline[0].timestamp).toBeInstanceOf(Date);
    });

    it('should handle multiple history entries in order', async () => {
      repo.listHistory.mockResolvedValue([
        makeHistoryEntry({ id: 'hist-2', changedAt: '2026-07-22T10:00:00Z', reason: 'update-2' }),
        makeHistoryEntry({ id: 'hist-1', changedAt: '2026-07-21T10:00:00Z', reason: 'update-1' }),
      ]);

      const timeline = await service.getTimeline('cfg-1');

      expect(timeline).toHaveLength(2);
    });
  });

  // ── timeTravel ────────────────────────────────────────────────────────────

  describe('timeTravel', () => {
    it('should return the snapshot closest to but before the target timestamp', async () => {
      repo.listHistory.mockResolvedValue([
        makeHistoryEntry({ id: 'hist-1', changedAt: '2026-07-20T10:00:00Z' }),
        makeHistoryEntry({ id: 'hist-2', changedAt: '2026-07-22T10:00:00Z' }),
      ]);

      const result = await service.timeTravel('cfg-1', new Date('2026-07-21T00:00:00Z'));

      expect(result.config).not.toBeNull();
      expect(result.history!.id).toBe('hist-1');
    });

    it('should return null config and history when no snapshot before timestamp', async () => {
      repo.listHistory.mockResolvedValue([
        makeHistoryEntry({ changedAt: '2026-07-22T10:00:00Z' }),
      ]);

      const result = await service.timeTravel('cfg-1', new Date('2026-07-21T00:00:00Z'));

      expect(result.config).toBeNull();
      expect(result.history).toBeNull();
    });

    it('should return null when no history at all', async () => {
      repo.listHistory.mockResolvedValue([]);

      const result = await service.timeTravel('cfg-1', new Date('2026-07-21T00:00:00Z'));

      expect(result.config).toBeNull();
      expect(result.history).toBeNull();
    });

    it('should return the exact snapshot if changedAt equals timestamp', async () => {
      const target = new Date('2026-07-20T10:00:00Z');
      repo.listHistory.mockResolvedValue([
        makeHistoryEntry({ id: 'hist-1', changedAt: target.toISOString() }),
      ]);

      const result = await service.timeTravel('cfg-1', target);

      expect(result.config).not.toBeNull();
      expect(result.history!.id).toBe('hist-1');
    });

    it('should return a TimeTravelResult with the original timestamp', async () => {
      repo.listHistory.mockResolvedValue([
        makeHistoryEntry({ changedAt: '2026-07-20T10:00:00Z' }),
      ]);

      const target = new Date('2026-07-25T00:00:00Z');
      const result = await service.timeTravel('cfg-1', target);

      expect(result.timestamp).toEqual(target);
    });

    it('should handle up to 1000 history entries', async () => {
      repo.listHistory.mockResolvedValue([
        makeHistoryEntry({ id: 'hist-1', changedAt: '2026-07-20T10:00:00Z' }),
      ]);

      await service.timeTravel('cfg-1', new Date('2026-07-25T00:00:00Z'));

      expect(repo.listHistory).toHaveBeenCalledWith('cfg-1', 1000);
    });
  });

  // ── cleanupExpiredSnapshots ──────────────────────────────────────────────

  describe('cleanupExpiredSnapshots', () => {
    it('should return deleted count', async () => {
      // @ts-expect-error — MockRepo intersect 见 snapshot.service.spec.ts:14
      repo.deleteHistoryBefore.mockResolvedValue(5);

      const result = await service.cleanupExpiredSnapshots();

      expect(result.deleted).toBe(5);
    });

    it('should call deleteHistoryBefore with a date 90 days ago', async () => {
      const mockFn = vi.fn().mockResolvedValue(0);
      // @ts-expect-error — MockRepo intersect
      repo.deleteHistoryBefore = mockFn;

      await service.cleanupExpiredSnapshots();

      const calledArg = (mockFn.mock.calls[0] as [Date])[0];
      const expected = new Date();
      expected.setDate(expected.getDate() - 90);
      // Allow 1s tolerance for test execution
      expect(Math.abs(calledArg.getTime() - expected.getTime())).toBeLessThan(2000);
    });

    it('should return 0 when nothing to delete', async () => {
      repo.deleteHistoryBefore.mockResolvedValue(0);

      const result = await service.cleanupExpiredSnapshots();

      expect(result.deleted).toBe(0);
    });
  });

  // ── getSnapshotStats ──────────────────────────────────────────────────────

  describe('getSnapshotStats', () => {
    it('should return stats from repo', async () => {
      repo.getHistoryStats.mockResolvedValue({
        totalCount: 100,
        oldestDate: new Date('2026-04-01T00:00:00Z'),
        newestDate: new Date('2026-07-23T00:00:00Z'),
        uniqueConfigCount: 10,
      });

      const stats = await service.getSnapshotStats();

      expect(stats.totalSnapshots).toBe(100);
      expect(stats.oldestSnapshot).toEqual(new Date('2026-04-01T00:00:00Z'));
      expect(stats.newestSnapshot).toEqual(new Date('2026-07-23T00:00:00Z'));
      expect(stats.configsWithSnapshots).toBe(10);
    });

    it('should handle null dates', async () => {
      repo.getHistoryStats.mockResolvedValue({
        totalCount: 0,
        oldestDate: null,
        newestDate: null,
        uniqueConfigCount: 0,
      });

      const stats = await service.getSnapshotStats();

      expect(stats.totalSnapshots).toBe(0);
      expect(stats.oldestSnapshot).toBeNull();
      expect(stats.newestSnapshot).toBeNull();
      expect(stats.configsWithSnapshots).toBe(0);
    });
  });

  // ── compareSnapshots ──────────────────────────────────────────────────────

  describe('compareSnapshots', () => {
    const baseConfig: AiModelStoreConfig = {
      id: 'cfg-1',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      configName: 'gpt-4-config',
      provider: 'openai',
      endpointUrl: 'https://api.openai.com/v1',
      apiKeyEncrypted: 'enc-key-1',
      contextWindow: 8192,
      temperature: 0.7,
      maxTokens: 2048,
      isCurrent: true,
      createdBy: 'user-1',
      createdAt: '2026-07-20T10:00:00Z',
      updatedAt: '2026-07-20T10:00:00Z',
    };

    it('should detect changes in configName', () => {
      const changed = { ...baseConfig, configName: 'gpt-4-turbo-config' };
      const diffs = service.compareSnapshots(baseConfig, changed);
      const nameDiff = diffs.find((d) => d.field === 'configName');

      expect(nameDiff!.changed).toBe(true);
      expect(nameDiff!.before).toBe('gpt-4-config');
      expect(nameDiff!.after).toBe('gpt-4-turbo-config');
    });

    it('should detect no changes for identical configs', () => {
      const diffs = service.compareSnapshots(baseConfig, baseConfig);
      const changedFields = diffs.filter((d) => d.changed);
      expect(changedFields).toHaveLength(0);
    });

    it('should detect changes in temperature', () => {
      const changed = { ...baseConfig, temperature: 1.0 };
      const diffs = service.compareSnapshots(baseConfig, changed);
      const tempDiff = diffs.find((d) => d.field === 'temperature');

      expect(tempDiff!.changed).toBe(true);
      expect(tempDiff!.before).toBe(0.7);
      expect(tempDiff!.after).toBe(1.0);
    });

    it('should handle customHeaders change from null to object', () => {
      const changed = { ...baseConfig, customHeaders: { Authorization: 'Bearer xxx' } };
      const diffs = service.compareSnapshots(baseConfig, changed);
      const headersDiff = diffs.find((d) => d.field === 'customHeaders');

      expect(headersDiff!.changed).toBe(true);
      expect(headersDiff!.before).toBeNull();
      expect(headersDiff!.after).toEqual({ Authorization: 'Bearer xxx' });
    });

    it('should detect provider change', () => {
      const changed: AiModelStoreConfig = { ...baseConfig, provider: 'custom' };
      const diffs = service.compareSnapshots(baseConfig, changed);
      const provDiff = diffs.find((d) => d.field === 'provider');

      expect(provDiff!.changed).toBe(true);
      expect(provDiff!.before).toBe('openai');
      expect(provDiff!.after).toBe('custom');
    });

    it('should detect endpointUrl change', () => {
      const changed = { ...baseConfig, endpointUrl: 'https://azure-openai.example.com/v1' };
      const diffs = service.compareSnapshots(baseConfig, changed);
      const urlDiff = diffs.find((d) => d.field === 'endpointUrl');

      expect(urlDiff!.changed).toBe(true);
    });

    it('should detect contextWindow change', () => {
      const changed = { ...baseConfig, contextWindow: 16384 };
      const diffs = service.compareSnapshots(baseConfig, changed);
      const cwDiff = diffs.find((d) => d.field === 'contextWindow');

      expect(cwDiff!.changed).toBe(true);
      expect(cwDiff!.before).toBe(8192);
      expect(cwDiff!.after).toBe(16384);
    });

    it('should return all 7 fields in diff result', () => {
      const diffs = service.compareSnapshots(baseConfig, baseConfig);
      const fields = diffs.map((d) => d.field);
      expect(fields).toEqual([
        'configName',
        'provider',
        'endpointUrl',
        'contextWindow',
        'temperature',
        'maxTokens',
        'customHeaders',
      ]);
    });
  });
});
