/**
 * e2e-auto-gen.module.ts - Phase-19 E2E Auto Gen Module
 * 用途: E2E 自动生成模块入口
 * 关联: phase-19-intelligence/spec.md §Phase 2
 */
import { Module } from '@nestjs/common'
import { E2EAutoGenController } from './e2e-auto-gen.controller'
import { E2EAutoGenService } from './e2e-auto-gen.service'
import { OpenAPIParserService } from './openapi-parser.service'
import { TestCaseGeneratorService } from './test-case-generator.service'
import { AutoRunnerService } from './auto-runner.service'

@Module({
  controllers: [E2EAutoGenController],
  providers: [
    E2EAutoGenService,
    OpenAPIParserService,
    TestCaseGeneratorService,
    AutoRunnerService,
  ],
  exports: [E2EAutoGenService, OpenAPIParserService, TestCaseGeneratorService, AutoRunnerService],
})
export class E2EAutoGenModule {}
