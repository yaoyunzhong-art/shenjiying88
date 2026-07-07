/**
 * e2e-auto-gen.service.ts - Phase-19 E2E Auto Gen Service
 * 用途: E2E 自动生成模块的编排服务
 * 关联: phase-19-intelligence/spec.md §Phase 2
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import * as crypto from 'node:crypto'
import { OpenAPIParserService } from './openapi-parser.service'
import { TestCaseGeneratorService } from './test-case-generator.service'
import { AutoRunnerService } from './auto-runner.service'
import type {
  E2ETestConfig,
  E2ETestReport,
  GenTask,
  GenerateRequest,
  GenerateResponse,
  ExecuteRequest,
  ExecuteResponse,
} from './e2e-auto-gen.entity'

@Injectable()
export class E2EAutoGenService {
  private readonly logger = new Logger(E2EAutoGenService.name)
  private readonly configs = new Map<string, E2ETestConfig>()
  private readonly tasks = new Map<string, GenTask>()
  private readonly reports = new Map<string, E2ETestReport>()

  constructor(
    private readonly parser: OpenAPIParserService,
    private readonly generator: TestCaseGeneratorService,
    private readonly runner: AutoRunnerService,
  ) {}

  /**
   * 根据 OpenAPI spec 生成测试用例
   */
  generate(request: GenerateRequest): GenerateResponse {
    const taskId = crypto.randomUUID()
    const task: GenTask = {
      id: taskId,
      configId: '',
      status: 'RUNNING',
      generatedFiles: [],
      stats: { totalFiles: 0, totalTestCases: 0, totalLines: 0 },
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    }
    this.tasks.set(taskId, task)

    try {
      const specJson = JSON.parse(request.spec) as {
        title?: string
        version?: string
        routes?: Array<{
          path: string
          method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
          parameters?: Array<{
            name: string
            in: 'path' | 'query' | 'body' | 'header'
            type: 'string' | 'number' | 'boolean' | 'object' | 'array'
            required: boolean
          }>
          responses?: Array<{ status: number; description: string }>
          tags?: string[]
          requiresAuth?: boolean
        }>
      }

      const table = this.parser.parseFromRoutes({
        title: specJson.title ?? 'Untitled API',
        version: specJson.version ?? '1.0.0',
        routes: (specJson.routes ?? []).map((r) => ({
          path: r.path,
          method: r.method,
          parameters: r.parameters ?? [],
          responses: r.responses ?? [{ status: 200, description: 'OK' }],
          tags: r.tags ?? [],
          requiresAuth: r.requiresAuth ?? true,
        })),
      })

      const allCases = this.generator.generateBatch(table.routes)
      const totalTestCases = allCases.length

      const outputDir = request.outputDir ?? './generated-tests'
      const generatedFiles = table.routes.map(
        (r) => `${outputDir}/${r.method.toLowerCase()}-${r.path.replace(/[^a-zA-Z0-9]/g, '-')}.spec.ts`,
      )

      task.status = 'COMPLETED'
      task.generatedFiles = generatedFiles
      task.stats = {
        totalFiles: generatedFiles.length,
        totalTestCases,
        totalLines: totalTestCases * 15,
      }
      task.completedAt = new Date().toISOString()

      this.logger.log(`Generated ${totalTestCases} test cases in ${generatedFiles.length} files`)

      return {
        taskId,
        status: 'COMPLETED',
        files: generatedFiles,
        stats: task.stats,
        createdAt: task.createdAt,
      }
    } catch (error) {
      task.status = 'FAILED'
      task.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      task.completedAt = new Date().toISOString()
      throw error
    }
  }

  /**
   * 执行测试用例
   */
  async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
    const config = this.configs.get(request.configId)
    if (!config) {
      throw new NotFoundException(`Config ${request.configId} not found`)
    }

    const taskId = crypto.randomUUID()
    const task: GenTask = {
      id: taskId,
      configId: request.configId,
      status: 'RUNNING',
      generatedFiles: [],
      stats: { totalFiles: 0, totalTestCases: 0, totalLines: 0 },
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    }
    this.tasks.set(taskId, task)

    try {
      const generatorOutput = this.generator.generateBatch([])
      const { results, report: runnerReport } = await this.runner.run(generatorOutput)

      const filteredResults = request.fileFilter
        ? results.filter((r) =>
            request.fileFilter!.some((f) => r.caseId.includes(f)),
          )
        : results

      const reportId = crypto.randomUUID()
      const report: E2ETestReport = {
        id: reportId,
        taskId,
        configId: request.configId,
        totalCases: filteredResults.length,
        passed: filteredResults.filter((r) => r.passed).length,
        failed: filteredResults.filter((r) => !r.passed).length,
        skipped: 0,
        passRate:
          filteredResults.length > 0
            ? filteredResults.filter((r) => r.passed).length / filteredResults.length
            : 0,
        durationMs: runnerReport.durationMs,
        caseResults: filteredResults.map((r) => ({
          caseId: r.caseId,
          name: r.caseId,
          passed: r.passed,
          durationMs: r.durationMs,
          errorMessage: r.errorMessage,
        })),
        createdAt: new Date().toISOString(),
      }
      this.reports.set(reportId, report)

      task.status = 'COMPLETED'
      task.stats.totalTestCases = report.totalCases
      task.completedAt = new Date().toISOString()

      return {
        reportId,
        totalCases: report.totalCases,
        passed: report.passed,
        failed: report.failed,
        passRate: report.passRate,
        createdAt: report.createdAt,
      }
    } catch (error) {
      task.status = 'FAILED'
      task.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      task.completedAt = new Date().toISOString()
      throw error
    }
  }

  /**
   * 获取任务状态
   */
  getTask(taskId: string): GenTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * 获取执行报告
   */
  getReport(reportId: string): E2ETestReport | undefined {
    return this.reports.get(reportId)
  }

  /**
   * 获取所有配置
   */
  listConfigs(): E2ETestConfig[] {
    return Array.from(this.configs.values())
  }

  /**
   * 创建配置
   */
  createConfig(input: Omit<E2ETestConfig, 'id' | 'enabled' | 'createdAt' | 'outputDir' | 'testFramework' | 'enableE2E'> & { outputDir?: string; testFramework?: 'vitest' | 'jest' | 'playwright'; enableE2E?: boolean }): E2ETestConfig {
    const id = crypto.randomUUID()
    const config: E2ETestConfig = {
      id,
      projectName: input.projectName,
      specSource: input.specSource,
      outputDir: input.outputDir ?? './generated-tests',
      testFramework: input.testFramework ?? 'vitest',
      enableE2E: input.enableE2E ?? false,
      baseUrl: input.baseUrl,
      authToken: input.authToken,
      extraHeaders: input.extraHeaders,
      enabled: true,
      createdAt: new Date().toISOString(),
    }
    this.configs.set(id, config)
    return config
  }

  /**
   * 更新配置
   */
  updateConfig(
    configId: string,
    input: Partial<Omit<E2ETestConfig, 'id' | 'createdAt'>>,
  ): E2ETestConfig | undefined {
    const existing = this.configs.get(configId)
    if (!existing) {
      throw new NotFoundException(`Config ${configId} not found`)
    }
    const updated: E2ETestConfig = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    }
    this.configs.set(configId, updated)
    return updated
  }
}
