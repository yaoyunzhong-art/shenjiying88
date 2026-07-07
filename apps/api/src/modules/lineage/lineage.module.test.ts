/**
 * lineage.module.test.ts — 数据血缘模块集成测试
 *
 * 验证模块可正确初始化并注入所有 provider
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { LineageModule } from './lineage.module'
import { LineageController } from './lineage.controller'
import { DataLineageTracker, ImpactAnalyzer } from './data-lineage.service'
import {
  SensitiveDataClassifier,
  DataFlowMonitor,
  ComplianceReporter,
} from './sensitive-data.service'

describe('LineageModule', () => {
  let moduleRef: TestingModule

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [LineageModule],
    }).compile()
  })

  it('should compile the module', () => {
    expect(moduleRef).toBeDefined()
  })

  it('should provide DataLineageTracker', () => {
    const p = moduleRef.get<DataLineageTracker>(DataLineageTracker)
    expect(p).toBeInstanceOf(DataLineageTracker)
  })

  it('should provide ImpactAnalyzer', () => {
    const p = moduleRef.get<ImpactAnalyzer>(ImpactAnalyzer)
    expect(p).toBeInstanceOf(ImpactAnalyzer)
  })

  it('should provide SensitiveDataClassifier', () => {
    const p = moduleRef.get<SensitiveDataClassifier>(SensitiveDataClassifier)
    expect(p).toBeInstanceOf(SensitiveDataClassifier)
  })

  it('should provide DataFlowMonitor', () => {
    const p = moduleRef.get<DataFlowMonitor>(DataFlowMonitor)
    expect(p).toBeInstanceOf(DataFlowMonitor)
  })

  it('should provide ComplianceReporter', () => {
    const p = moduleRef.get<ComplianceReporter>(ComplianceReporter)
    expect(p).toBeInstanceOf(ComplianceReporter)
  })

  it('should instantiate LineageController', () => {
    const ctrl = moduleRef.get<LineageController>(LineageController)
    expect(ctrl).toBeInstanceOf(LineageController)
  })

  it('should have all dependencies injected', () => {
    const ctrl = moduleRef.get<LineageController>(LineageController)
    expect((ctrl as any).lineageTracker).toBeInstanceOf(DataLineageTracker)
    expect((ctrl as any).classifier).toBeInstanceOf(SensitiveDataClassifier)
    expect((ctrl as any).flowMonitor).toBeInstanceOf(DataFlowMonitor)
    expect((ctrl as any).complianceReporter).toBeInstanceOf(ComplianceReporter)
  })
})
