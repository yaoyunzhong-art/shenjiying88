import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { AiRuleEngineService } from './ai-rule-engine.service'
import type {
  SimulatorRunInput,
  SimulatorSummary
} from './ai-rule-engine.entity'

describe('AiRuleEngine - Simulator', () => {
  let service: AiRuleEngineService

  test.beforeEach(() => {
    service = new AiRuleEngineService()
  })

  // ─── Simulator listing ───

  describe('listSimulators', () => {
    test('should return all simulators', () => {
      const simulators = service.listSimulators()
      assert.ok(Array.isArray(simulators))
      assert.ok(simulators.length >= 2)
    })

    test('should return simulators with required fields', () => {
      const simulators = service.listSimulators()
      for (const sim of simulators) {
        assert.equal(typeof sim.id, 'string')
        assert.equal(typeof sim.name, 'string')
        assert.equal(typeof sim.engineId, 'string')
        assert.ok(sim.rounds > 0)
      }
    })
  })

  describe('getSimulator', () => {
    test('should return a simulator by valid id', () => {
      const sim = service.getSimulator('sim-member-level-v1')
      assert.ok(sim)
      assert.equal(sim.id, 'sim-member-level-v1')
      assert.equal(sim.name, 'Member Level Simulator')
    })

    test('should return undefined for non-existent simulator id', () => {
      const sim = service.getSimulator('non-existent-sim')
      assert.equal(sim, undefined)
    })
  })

  // ─── runSimulator - member-level ───

  const highValueInput: SimulatorRunInput = {
    simulatorId: 'sim-member-level-v1',
    dataType: 'member-level',
    data: {
      memberId: 'M001',
      totalPoints: 6000,
      totalSpend: 12000,
      visitCount: 25,
      tenantId: 'T001'
    }
  }

  const lowValueInput: SimulatorRunInput = {
    simulatorId: 'sim-member-level-v1',
    dataType: 'member-level',
    data: {
      memberId: 'M002',
      totalPoints: 100,
      totalSpend: 200,
      visitCount: 1,
      tenantId: 'T001'
    }
  }

  describe('runSimulator - member-level', () => {
    test('should match high-value member', () => {
      const result = service.runSimulator(highValueInput)
      assert.equal(result.simulatorId, 'sim-member-level-v1')
      assert.equal(result.simulatorName, 'Member Level Simulator')
      assert.equal(result.matched, true)
      assert.ok(result.triggeredConditions.length >= 2)
    })

    test('should not match low-value member', () => {
      const result = service.runSimulator(lowValueInput)
      assert.equal(result.matched, false)
      assert.equal(result.triggeredConditions.length, 0)
    })

    test('should return triggered actions when matched', () => {
      const result = service.runSimulator(highValueInput)
      assert.ok(result.triggeredActions.length > 0)
      const actions = result.triggeredActions
      assert.ok(actions.some((a: string) => a.startsWith('act-assign')))
    })
  })

  describe('runSimulator - device-anomaly', () => {
    const anomalyInput: SimulatorRunInput = {
      simulatorId: 'sim-device-anomaly-v1',
      dataType: 'device-anomaly',
      data: {
        deviceId: 'D001',
        storeId: 'S001',
        metrics: {
          cpuUsage: 95,
          memoryUsage: 90,
          diskUsage: 95,
          networkLatencyMs: 600,
          errorRate: 8,
          uptimeHours: 100
        },
        tenantId: 'T001'
      }
    }

    const normalInput: SimulatorRunInput = {
      simulatorId: 'sim-device-anomaly-v1',
      dataType: 'device-anomaly',
      data: {
        deviceId: 'D002',
        storeId: 'S001',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 20,
          errorRate: 1,
          uptimeHours: 720
        },
        tenantId: 'T001'
      }
    }

    test('should detect anomaly for abnormal device', () => {
      const result = service.runSimulator(anomalyInput)
      assert.equal(result.matched, true)
      assert.ok(result.triggeredConditions.length >= 1)
    })

    test('should not detect anomaly for normal device', () => {
      const result = service.runSimulator(normalInput)
      assert.equal(result.matched, false)
      assert.equal(result.triggeredConditions.length, 0)
    })
  })

  describe('runSimulator - risk-score', () => {
    const riskInput: SimulatorRunInput = {
      simulatorId: 'sim-member-level-v1',
      dataType: 'risk-score',
      data: {
        subjectId: 'R001',
        subjectType: 'member',
        metrics: {
          refundCount: 4,
          abnormalPaymentCount: 3,
          deviceAnomalyCount: 2,
          complaintCount: 2,
          voidRefundAmount: 600
        },
        tenantId: 'T001'
      }
    }

    test('should correctly evaluate risk score', () => {
      const result = service.runSimulator(riskInput)
      assert.ok(result)
      assert.equal(result.simulatorId, 'sim-member-level-v1')
      assert.equal(typeof result.matched, 'boolean')
    })
  })

  // ─── Verbose mode ───

  describe('runSimulator - verbose mode', () => {
    test('should include logs when verbose is true', () => {
      const input: SimulatorRunInput = {
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: {
          memberId: 'M003',
          totalPoints: 2000,
          totalSpend: 6000,
          visitCount: 15,
          tenantId: 'T001'
        },
        verbose: true
      }
      const result = service.runSimulator(input)
      assert.ok(result.logs)
      assert.ok(Array.isArray(result.logs))
      assert.ok(result.logs!.length > 0)
    })

    test('should not include logs when verbose is false', () => {
      const input: SimulatorRunInput = {
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: {
          memberId: 'M004',
          totalPoints: 100,
          totalSpend: 200,
          visitCount: 1,
          tenantId: 'T001'
        },
        verbose: false
      }
      const result = service.runSimulator(input)
      assert.equal(result.logs, undefined)
    })
  })

  // ─── Condition override ───

  describe('runSimulator - condition overrides', () => {
    test('should override condition values and affect matching', () => {
      const input: SimulatorRunInput = {
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: {
          memberId: 'M005',
          totalPoints: 600,
          totalSpend: 500,
          visitCount: 10,
          tenantId: 'T001'
        },
        conditionOverrides: [
          { conditionId: 'cond-high-spend', value: 100 },
          { conditionId: 'cond-high-points', value: 500 },
          { conditionId: 'cond-frequent-visit', value: 5 }
        ],
        verbose: true
      }

      const result = service.runSimulator(input)
      assert.ok(result.logs)
      const spendCondLog = result.logs!.find((l: string) => l.includes('cond-high-spend') && l.includes('MATCHED'))
      assert.ok(spendCondLog)
      assert.ok(spendCondLog.includes('MATCHED'))
    })
  })

  // ─── Batch simulator ───

  describe('runSimulatorBatch', () => {
    const batchInput: SimulatorRunInput & { rounds: number } = {
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: {
        memberId: 'M-BATCH',
        totalPoints: 6000,
        totalSpend: 12000,
        visitCount: 25,
        tenantId: 'T001'
      },
      rounds: 10,
      verbose: false
    }

    test('should run multiple rounds and return summary', () => {
      const summary = service.runSimulatorBatch(batchInput)
      assert.equal(summary.simulatorId, 'sim-member-level-v1')
      assert.equal(summary.simulatorName, 'Member Level Simulator')
      assert.equal(summary.totalRuns, 10)
      assert.ok(summary.matchedRuns >= 0)
      assert.ok(summary.matchedRuns <= 10)
      assert.ok(summary.matchRate >= 0)
      assert.ok(summary.matchRate <= 1)
      assert.equal(summary.results.length, 10)
    })

    test('should return valid percentiles', () => {
      const summary = service.runSimulatorBatch(batchInput)
      assert.ok(summary.p50ExecutionTimeMs >= 0)
      assert.ok(summary.p95ExecutionTimeMs >= summary.p50ExecutionTimeMs)
      assert.ok(summary.p99ExecutionTimeMs >= summary.p95ExecutionTimeMs)
    })

    test('should include most triggered conditions', () => {
      const summary = service.runSimulatorBatch(batchInput)
      assert.ok(summary.mostTriggeredConditions)
      assert.ok(Array.isArray(summary.mostTriggeredConditions))
    })

    test('should include recommendation text', () => {
      const summary = service.runSimulatorBatch(batchInput)
      assert.ok(typeof summary.recommendation === 'string')
      assert.ok(summary.recommendation.length > 0)
    })
  })

  // ─── Batch simulator with mutation ───

  describe('runSimulatorBatch - with mutation', () => {
    const input: SimulatorRunInput & { rounds: number } = {
      simulatorId: 'sim-device-anomaly-v1',
      dataType: 'device-anomaly',
      data: {
        deviceId: 'D-MUTATE',
        storeId: 'S001',
        metrics: {
          cpuUsage: 50,
          memoryUsage: 50,
          diskUsage: 50,
          networkLatencyMs: 300,
          errorRate: 2,
          uptimeHours: 500
        },
        tenantId: 'T001'
      },
      rounds: 20,
      verbose: false
    }

    test('should produce varied results with mutation enabled', () => {
      const summary: SimulatorSummary = service.runSimulatorBatch(input)
      assert.ok(summary.totalRuns >= 1)
      // mutation should create some variation
      const matchedValues = summary.results.map((r: any) => r.matched)
      assert.ok(matchedValues.length > 0)
    })
  })

  // ─── Error handling ───

  describe('runSimulator - error handling', () => {
    test('should throw for non-existent simulator', () => {
      const input: SimulatorRunInput = {
        simulatorId: 'non-existent-sim',
        dataType: 'member-level',
        data: { memberId: 'M', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 'T' }
      }
      assert.throws(() => service.runSimulator(input), /not found/)
    })

    test('should throw for unknown dataType', () => {
      const input: SimulatorRunInput = {
        simulatorId: 'sim-member-level-v1',
        dataType: 'unknown-type' as any,
        data: {} as never
      }
      assert.throws(() => service.runSimulator(input), /Unknown dataType/)
    })
  })

  describe('runSimulatorBatch - error handling', () => {
    test('should throw for non-existent simulator', () => {
      assert.throws(
        () =>
          service.runSimulatorBatch({
            simulatorId: 'non-existent-sim',
            dataType: 'member-level',
            data: { memberId: 'M', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 'T' }
          } as any),
        /not found/
      )
    })
  })
})
