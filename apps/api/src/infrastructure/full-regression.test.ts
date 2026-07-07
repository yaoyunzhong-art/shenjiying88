import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 全量回归测试 (T130-1)
 *
 * 对所有已实现的模块进行批量测试验证：
 * - 业务模块（18个）
 * - 基础设施（5个）
 * - 开放平台（3个）
 * - 国际化+合规（7个）
 *
 * 使用 vitest globals
 * 使用 child_process.exec 执行 pnpm vitest run 并解析输出
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

// 项目根目录 (apps/api) - 使用 process.cwd() 因为 vitest 从项目根目录运行
const PROJECT_ROOT = process.cwd()

/**
 * 全量回归测试模块列表
 * key: 模块名
 * value: 测试文件所在路径 (相对于 apps/api/src)
 */
const MODULE_PATHS: Record<string, string> = {
  // 业务模块（18个）
  'member-level': 'src/modules/member-level/',
  'svip': 'src/modules/svip/',
  'blindbox': 'src/modules/blindbox/',
  'cashier': 'src/modules/cashier/',
  'points': 'src/modules/points/',
  'coupon': 'src/modules/coupon/',
  'tournament': 'src/modules/tournament/',
  'inventory': 'src/modules/inventory/',
  'finance': 'src/modules/finance/',
  'alliance': 'src/modules/alliance/',
  'ai-marketing': 'src/modules/ai-marketing/',
  'ai-sales': 'src/modules/ai-sales/',
  'ai-forecast': 'src/modules/ai-forecast/',
  'iot': 'src/modules/iot/',
  'edge': 'src/modules/edge/',
  'realtime': 'src/modules/realtime/',
  'lineage': 'src/modules/lineage/',
  'aiops': 'src/modules/aiops/',
  // 基础设施（5个）
  'clickhouse': 'src/infrastructure/clickhouse/',
  'qdrant': 'src/infrastructure/qdrant/',
  'rabbitmq': 'src/infrastructure/rabbitmq/',
  'ollama': 'src/infrastructure/ollama/',
  'gateway': 'src/modules/gateway/',
  // 开放平台（3个）
  'webhook': 'src/modules/webhook/',
  'sandbox': 'src/modules/sandbox/',
  'payment-gateway': 'src/modules/payment-gateway/',
  // 国际化+合规（7个）
  'i18n': 'src/modules/i18n/',
  'locale': 'src/modules/locale/',
  'currency': 'src/modules/currency/',
  'compliance': 'src/modules/compliance/',
  'audit': 'src/modules/audit/',
  'security': 'src/modules/security/',
  'rbac': 'src/modules/rbac/',
}

const MODULES = Object.keys(MODULE_PATHS)

/**
 * 解析 vitest 输出中的测试数量
 * 输出格式: "Tests  30 passed (30)"
 * 注意: 不能匹配 "Test Files  1 passed (1)" 格式
 */
function parseTestCount(output: string): number {
  // 匹配 "Tests  X passed (X)" 格式 - 精确匹配测试数量
  const passedMatch = output.match(/Tests\s+(\d+)\s+passed\s+\(\d+\)/)
  if (passedMatch) {
    return parseInt(passedMatch[1], 10)
  }

  // 备用: 匹配单个测试数的格式 "(X)" 在行尾，前面是 "passed"
  const simpleMatch = output.match(/Tests\s+(\d+)\s+passed/)
  if (simpleMatch) {
    return parseInt(simpleMatch[1], 10)
  }

  return 0
}

/**
 * 从输出中解析退出码
 */
function parseExitCode(output: string): number {
  // 匹配 "Exit code: X" 格式
  const exitMatch = output.match(/Exit code:\s*(\d+)/i)
  if (exitMatch) {
    return parseInt(exitMatch[1], 10)
  }
  // 如果没有找到退出码标记，检查是否有 "Command failed" 之类的错误
  if (output.includes('Command failed')) {
    return 1
  }
  return 0
}

/**
 * 运行单个模块的 vitest 测试
 */
async function runModuleTest(module: string): Promise<{ passed: boolean; testCount: number; output: string }> {
  const modulePath = MODULE_PATHS[module] || `src/modules/${module}/`
  const command = `cd "${PROJECT_ROOT}" && pnpm vitest run --reporter=dot "${modulePath}" 2>&1`

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 120_000, // 2分钟超时
    })

    // 合并 stdout 和 stderr
    const output = (stdout || '') + (stderr || '')

    // 从输出中解析退出码和测试数量
    const exitCode = parseExitCode(output)
    const testCount = parseTestCount(output)

    // 通过判定: exitCode === 0 且有测试数量
    const passed = exitCode === 0 && testCount > 0

    return {
      passed,
      testCount,
      output,
    }
  } catch (error: unknown) {
    // execAsync 通常不会抛出错误，我们会从输出中解析退出码
    // 但为了完整性处理异常情况
    const err = error as Error & { stdout?: string; stderr?: string }
    const output = (err.stdout || '') + (err.stderr || '') + (error instanceof Error ? error.message : String(error))
    const exitCode = parseExitCode(output)
    const testCount = parseTestCount(output)

    return {
      passed: exitCode === 0 && testCount > 0,
      testCount,
      output,
    }
  }
}

describe('Full Regression Suite (T130-1)', () => {
  // 存储所有模块的测试结果
  const results = new Map<string, { passed: boolean; testCount: number; output: string }>()

  // 在所有测试前先运行所有模块
  beforeAll(async () => {
    for (const module of MODULES) {
      const result = await runModuleTest(module)
      results.set(module, result)
    }
  }, 600_000) // 10分钟超时

  // 汇总报告
  it('summary: total tests > 500', () => {
    const totalTests = Array.from(results.values()).reduce((sum, r) => sum + r.testCount, 0)

    console.log('\n========== 全量回归测试汇总 ==========')
    console.log(`总模块数: ${MODULES.length}`)
    console.log(`通过: ${Array.from(results.values()).filter((r) => r.passed).length}`)
    console.log(`失败: ${Array.from(results.values()).filter((r) => !r.passed).length}`)
    console.log(`总测试数: ${totalTests}`)
    console.log('======================================\n')

    // 断言有足够的测试数量
    expect(totalTests).toBeGreaterThan(500)
  })

  // 为每个模块生成一个测试用例
  for (const module of MODULES) {
    it(`${module}: all tests pass`, () => {
      const result = results.get(module)

      if (!result) {
        console.error(`模块 ${module} 没有测试结果`)
        expect(result).toBeDefined()
        return
      }

      if (!result.passed) {
        console.error(`模块 ${module} 失败:`)
        console.error(result.output.slice(0, 500))
      }

      expect(result.passed).toBe(true)
      expect(result.testCount).toBeGreaterThan(0)
    })
  }
})
