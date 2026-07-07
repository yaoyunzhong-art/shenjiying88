import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { HealthScoreService, HealthDashboardService } from './health-dashboard.entity';

describe('HealthDashboard Entity exports', () => {
  it('AC-1: HealthScoreService 可实例化', () => {
    const service = new HealthScoreService();
    expect(service).toBeInstanceOf(HealthScoreService);
  });

  it('AC-2: HealthDashboardService 可实例化', () => {
    const healthScore = new HealthScoreService();
    const dashboard = new HealthDashboardService(healthScore);
    expect(dashboard).toBeInstanceOf(HealthDashboardService);
  });
});
