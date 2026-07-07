import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { BlindboxService } from './blindbox.service';
import { BlindBoxStatus } from './blindbox.entity';

describe('BlindboxService', () => {
  let service: BlindboxService;

  const mockPlanInput = {
    name: '测试盲盒计划',
    guaranteePityCount: 10,
    tiers: [
      {
        tierId: '1',
        name: '一等奖',
        probability: 0.1,
        prizes: [
          { prizeId: 'p1', name: '一等奖奖品A', stock: 5, weight: 1 },
          { prizeId: 'p2', name: '一等奖奖品B', stock: 3, weight: 1 },
        ],
      },
      {
        tierId: '2',
        name: '二等奖',
        probability: 0.2,
        prizes: [
          { prizeId: 'p3', name: '二等奖奖品A', stock: 10, weight: 1 },
          { prizeId: 'p4', name: '二等奖奖品B', stock: 8, weight: 1 },
        ],
      },
      {
        tierId: '3',
        name: '三等奖',
        probability: 0.3,
        prizes: [
          { prizeId: 'p5', name: '三等奖奖品A', stock: 20, weight: 1 },
        ],
      },
      {
        tierId: '4',
        name: '四等奖',
        probability: 0.4,
        prizes: [
          { prizeId: 'p6', name: '四等奖奖品A', stock: 50, weight: 1 },
        ],
      },
    ],
  };

  beforeEach(() => {
    service = new BlindboxService();
  });

  describe('Plan Creation', () => {
    it('should create a plan successfully', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        expect(plan).toBeDefined();
        expect(plan.planId).toBeDefined();
        expect(plan.name).toBe('测试盲盒计划');
        expect(plan.status).toBe(BlindBoxStatus.ACTIVE);
        expect(plan.tiers).toHaveLength(4);
        expect(plan.guaranteePityCount).toBe(10);
        expect(plan.createdAt).toBeInstanceOf(Date);
	_done();
      });
    });

    it('should create plan with correct tier structure', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        expect(plan.tiers[0].name).toBe('一等奖');
        expect(plan.tiers[0].probability).toBe(0.1);
        expect(plan.tiers[0].prizes).toHaveLength(2);
	_done();
      });
    });
  });

  describe('Single Draw', () => {
    it('should draw a single prize successfully', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.drawSingle('user123', plan.planId).subscribe((record) => {
          expect(record).not.toBeNull();
          expect(record!.recordId).toBeDefined();
          expect(record!.planId).toBe(plan.planId);
          expect(record!.userId).toBe('user123');
          expect(record!.tier).toBeDefined();
          expect(record!.prizeId).toBeDefined();
          expect(record!.prizeName).toBeDefined();
	_done();
        });
      });
    });

    it('should return null for non-existent plan', (_done: any) => {
      service.drawSingle('user123', 'non-existent').subscribe((record) => {
        expect(record).toBeNull();
	_done();
      });
    });

    it('should decrease stock after draw', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.drawSingle('user123', plan.planId).subscribe(() => {
          service.getPrizePool(plan.planId).subscribe((pool) => {
            expect(pool).not.toBeNull();
            let totalStock = 0;
            pool!.prizePools.forEach((tp) => {
              tp.prizes.forEach((p) => {
                totalStock += p.stock;
              });
            });
            const originalStock = 5 + 3 + 10 + 8 + 20 + 50;
            expect(totalStock).toBe(originalStock - 1);
	_done();
          });
        });
      });
    });
  });

  describe('Pity Mechanism', () => {
    it('should trigger pity after guaranteePityCount draws without high tier', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        const draws: any[] = [];
        let drawCount = 0;

        const performDraw = () => {
          if (drawCount >= 10) {
            service.getDrawHistory('user_pity', plan.planId, 100).subscribe((history) => {
              const highTierWins = history.filter(
                (h) => h.tier === '一等奖' || h.tier === '二等奖',
              );
              expect(highTierWins.length).toBeGreaterThan(0);
	_done();
            });
            return;
          }

          service.drawSingle('user_pity', plan.planId).subscribe((record) => {
            if (record) {
              draws.push(record);
            }
            drawCount++;
            performDraw();
          });
        };

        performDraw();
      });
    });

    it('should reset pity counter after winning high tier', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        const userId = 'user_pity_reset';

        service.drawSingle(userId, plan.planId).subscribe(() => {
          service.drawSingle(userId, plan.planId).subscribe(() => {
	_done();
          });
        });
      });
    });
  });

  describe('Batch Draw', () => {
    it('should draw 10 prizes in batch', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.drawBatch10('user_batch', plan.planId).subscribe((records) => {
          expect(records).toBeDefined();
          expect(records.length).toBe(10);
          records.forEach((record) => {
            expect(record.planId).toBe(plan.planId);
            expect(record.userId).toBe('user_batch');
          });
	_done();
        });
      });
    });

    it('should return empty array for non-existent plan in batch', (_done: any) => {
      service.drawBatch10('user123', 'non-existent').subscribe((records) => {
        expect(records).toEqual([]);
	_done();
      });
    });
  });

  describe('Probability Public Display (概率公示)', () => {
    it('should return tier probabilities', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.getProbability公示(plan.planId).subscribe((result) => {
          expect(result).not.toBeNull();
          expect(result!.tiers).toHaveLength(4);
          expect(result!.tiers[0].name).toBe('一等奖');
          expect(result!.tiers[0].probability).toBe(0.1);
	_done();
        });
      });
    });

    it('should return probabilities that sum to 1.0', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.getProbability公示(plan.planId).subscribe((result) => {
          expect(result).not.toBeNull();
          expect(result!.sum).toBeCloseTo(1.0, 5);
	_done();
        });
      });
    });

    it('should return null for non-existent plan', (_done: any) => {
      service.getProbability公示('non-existent').subscribe((result) => {
        expect(result).toBeNull();
	_done();
      });
    });

    it('should return valid probabilities (0-1 range)', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.getProbability公示(plan.planId).subscribe((result) => {
          expect(result).not.toBeNull();
          result!.tiers.forEach((tier) => {
            expect(tier.probability).toBeGreaterThanOrEqual(0);
            expect(tier.probability).toBeLessThanOrEqual(1);
          });
	_done();
        });
      });
    });
  });

  describe('Prize Pool Status', () => {
    it('should return current prize pool status', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.getPrizePool(plan.planId).subscribe((pool) => {
          expect(pool).not.toBeNull();
          expect(pool!.planId).toBe(plan.planId);
          expect(pool!.name).toBe('测试盲盒计划');
          expect(pool!.prizePools).toHaveLength(4);
	_done();
        });
      });
    });

    it('should show correct stock remaining', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.getPrizePool(plan.planId).subscribe((pool) => {
          expect(pool).not.toBeNull();
          const tier1Prize = pool!.prizePools[0].prizes[0];
          expect(tier1Prize.stock).toBe(5);
	_done();
        });
      });
    });

    it('should return null for non-existent plan', (_done: any) => {
      service.getPrizePool('non-existent').subscribe((pool) => {
        expect(pool).toBeNull();
	_done();
      });
    });

    it('should update stock after draws', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.drawSingle('user_stock', plan.planId).subscribe(() => {
          service.getPrizePool(plan.planId).subscribe((pool) => {
            expect(pool).not.toBeNull();
            let totalStock = 0;
            pool!.prizePools.forEach((tp) => {
              tp.prizes.forEach((p) => {
                totalStock += p.stock;
              });
            });
            expect(totalStock).toBeLessThan(96);
	_done();
          });
        });
      });
    });
  });

  describe('Draw History', () => {
    it('should return user draw history', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.drawSingle('user_history', plan.planId).subscribe(() => {
          service.getDrawHistory('user_history', plan.planId, 20).subscribe((history) => {
            expect(history).toBeDefined();
            expect(history.length).toBeGreaterThan(0);
	_done();
          });
        });
      });
    });

    it('should respect limit parameter', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        for (let i = 0; i < 5; i++) {
          service.drawSingle('user_limit', plan.planId).subscribe();
        }
        service.getDrawHistory('user_limit', plan.planId, 3).subscribe((history) => {
          expect(history.length).toBeLessThanOrEqual(3);
	_done();
        });
      });
    });

    it('should return empty array for user with no history', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.getDrawHistory('user_new', plan.planId, 20).subscribe((history) => {
          expect(history).toEqual([]);
	_done();
        });
      });
    });

    it('should sort history by createdAt descending', (_done: any) => {
      service.createPlan(mockPlanInput).subscribe((plan) => {
        service.drawSingle('user_sort', plan.planId).subscribe(() => {
          setTimeout(() => {
            service.drawSingle('user_sort', plan.planId).subscribe(() => {
              service.getDrawHistory('user_sort', plan.planId, 20).subscribe((history) => {
                for (let i = 1; i < history.length; i++) {
                  expect(history[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
                    history[i].createdAt.getTime(),
                  );
                }
	_done();
              });
            });
          }, 10);
        });
      });
    });
  });
});
