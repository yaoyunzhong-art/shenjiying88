/**
 * lineage.module.ts — 数据血缘模块
 *
 * 注册 DataLineageTracker, ImpactAnalyzer, SensitiveDataClassifier,
 * DataFlowMonitor, ComplianceReporter
 */

import { Module } from '@nestjs/common'
import { LineageController } from './lineage.controller'
import { DataLineageTracker, ImpactAnalyzer } from './data-lineage.service'
import {
  SensitiveDataClassifier,
  DataFlowMonitor,
  ComplianceReporter,
} from './sensitive-data.service'

@Module({
  controllers: [LineageController],
  providers: [
    DataLineageTracker,
    ImpactAnalyzer,
    SensitiveDataClassifier,
    DataFlowMonitor,
    ComplianceReporter,
  ],
  exports: [
    DataLineageTracker,
    ImpactAnalyzer,
    SensitiveDataClassifier,
    DataFlowMonitor,
    ComplianceReporter,
  ],
})
export class LineageModule {}
