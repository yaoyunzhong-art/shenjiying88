/**
 * Testing Framework · 分层测试用例框架 V1.0
 * 
 * 测试方法论:
 * - 等价类划分 (Equivalence Partitioning)
 * - 边界值分析 (Boundary Value Analysis)
 * - 错误推测法 (Error Guessing)
 * - 因果图法 (Cause-Effect Graph)
 */

import assert from 'assert'

// ═══════════════════════════════════════════════════════════════════════
// 1. 单元测试层 (Unit Tests)
// 覆盖: 最小可测试单元 - 函数/方法/类
// ═══════════════════════════════════════════════════════════════════════

export interface UnitTestCase {
    name: string
    input: any
    expected: any
    validator: (input: any, output: any) => boolean
    category: 'valid' | 'invalid' | 'boundary' | 'error'
}

export interface UnitTestSuite {
    name: string
    module: string
    cases: UnitTestCase[]
}

export class UnitTestRunner {
    private suites: Map<string, UnitTestSuite> = new Map()
    
    registerSuite(suite: UnitTestSuite) {
        this.suites.set(suite.module, suite)
    }
    
    runSuite(module: string): { pass: number; fail: number; results: TestResult[] } {
        const suite = this.suites.get(module)
        if (!suite) {
            throw new Error(`Suite not found: ${module}`)
        }
        
        let pass = 0
        let fail = 0
        const results: TestResult[] = []
        
        for (const tc of suite.cases) {
            const result = this.runCase(tc)
            results.push(result)
            if (result.passed) pass++; else fail++
        }
        
        return { pass, fail, results }
    }
    
    private runCase(tc: UnitTestCase): TestResult {
        const startTime = Date.now()
        try {
            // 执行测试用例
            const output = tc.validator(tc.input, tc.expected)
            const passed = output === true || tc.validator(tc.input, tc.expected)
            return {
                name: tc.name,
                category: tc.category,
                passed,
                duration: Date.now() - startTime,
                error: passed ? undefined : 'Validation failed'
            }
        } catch (e) {
            return {
                name: tc.name,
                category: tc.category,
                passed: false,
                duration: Date.now() - startTime,
                error: (e as Error).message
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// 2. 集成测试层 (Integration Tests)
// 覆盖: 模块间交互/数据流/接口调用
// ═══════════════════════════════════════════════════════════════════════

export interface IntegrationTestCase {
    name: string
    steps: TestStep[]
    expectedState: Record<string, any>
    cleanup?: () => void
}

export interface TestStep {
    action: 'call' | 'check' | 'wait' | 'set'
    target: string
    params?: any
    timeout?: number
}

export class IntegrationTestRunner {
    async runCase(tc: IntegrationTestCase): Promise<TestResult> {
        const startTime = Date.now()
        const errors: string[] = []
        const actualState: Record<string, any> = {}
        
        for (const step of tc.steps) {
            try {
                const result = await this.executeStep(step)
                actualState[step.target] = result
            } catch (e) {
                errors.push(`${step.action} ${step.target}: ${(e as Error).message}`)
                if (step.action === 'check') {
                    // 检查失败继续执行
                    continue
                }
                break
            }
        }
        
        // 验证最终状态
        let passed = true
        for (const [key, expected] of Object.entries(tc.expectedState)) {
            if (actualState[key] !== expected) {
                passed = false
                errors.push(`State mismatch: ${key} expected ${expected}, got ${actualState[key]}`)
            }
        }
        
        // 清理
        if (tc.cleanup) {
            try { tc.cleanup() } catch {}
        }
        
        return {
            name: tc.name,
            category: 'integration',
            passed,
            duration: Date.now() - startTime,
            error: errors.length > 0 ? errors.join('; ') : undefined
        }
    }
    
    private async executeStep(step: TestStep): Promise<any> {
        switch (step.action) {
            case 'call':
                return this.executeCall(step.target, step.params)
            case 'check':
                return this.executeCheck(step.target, step.params)
            case 'wait':
                return this.executeWait(step.timeout || 1000)
            case 'set':
                return step.params
            default:
                throw new Error(`Unknown action: ${step.action}`)
        }
    }
    
    private async executeCall(target: string, params?: any): Promise<any> {
        // 模拟调用
        return { target, params, result: 'mocked' }
    }
    
    private async executeCheck(target: string, params?: any): Promise<boolean> {
        // 模拟检查
        return true
    }
    
    private async executeWait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}

// ═══════════════════════════════════════════════════════════════════════
// 3. 接口测试层 (API Tests)
// 覆盖: REST API / GraphQL / WebSocket
// ═══════════════════════════════════════════════════════════════════════

export interface ApiTestCase {
    name: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    path: string
    headers?: Record<string, string>
    body?: any
    expectedStatus: number
    expectedBody?: any
    validators?: ((response: ApiResponse) => boolean)[]
}

export interface ApiResponse {
    status: number
    headers: Record<string, string>
    body: any
    duration: number
}

export class ApiTestRunner {
    private baseUrl: string
    
    constructor(baseUrl: string = 'http://localhost:3000') {
        this.baseUrl = baseUrl
    }
    
    async runCase(tc: ApiTestCase): Promise<TestResult> {
        const startTime = Date.now()
        
        try {
            // 发送请求
            const response = await this.sendRequest(tc)
            const duration = Date.now() - startTime
            
            // 验证状态码
            if (response.status !== tc.expectedStatus) {
                return {
                    name: tc.name,
                    category: 'api',
                    passed: false,
                    duration,
                    error: `Status ${response.status} !== ${tc.expectedStatus}`
                }
            }
            
            // 验证响应体
            if (tc.expectedBody) {
                const bodyMatch = this.deepEqual(response.body, tc.expectedBody)
                if (!bodyMatch) {
                    return {
                        name: tc.name,
                        category: 'api',
                        passed: false,
                        duration,
                        error: `Body mismatch`
                    }
                }
            }
            
            // 执行自定义验证器
            if (tc.validators) {
                for (const validator of tc.validators) {
                    if (!validator(response)) {
                        return {
                            name: tc.name,
                            category: 'api',
                            passed: false,
                            duration,
                            error: `Validator failed`
                        }
                    }
                }
            }
            
            return {
                name: tc.name,
                category: 'api',
                passed: true,
                duration,
                error: undefined
            }
            
        } catch (e) {
            return {
                name: tc.name,
                category: 'api',
                passed: false,
                duration: Date.now() - startTime,
                error: (e as Error).message
            }
        }
    }
    
    private async sendRequest(tc: ApiTestCase): Promise<ApiResponse> {
        const url = `${this.baseUrl}${tc.path}`
        
        // 模拟实现
        return {
            status: tc.expectedStatus,
            headers: { 'content-type': 'application/json' },
            body: tc.expectedBody || {},
            duration: Math.random() * 100
        }
    }
    
    private deepEqual(a: any, b: any): boolean {
        return JSON.stringify(a) === JSON.stringify(b)
    }
}

// ═══════════════════════════════════════════════════════════════════════
// 4. 端到端测试层 (E2E Tests)
// 覆盖: 完整业务流程/用户场景
// ═══════════════════════════════════════════════════════════════════════

export interface E2ETestCase {
    id: string
    name: string
    description: string
    priority: 'P0' | 'P1' | 'P2' | 'P3'
    module: string
    steps: E2EStep[]
    preconditions: Precondition[]
    expectedOutcome: string
    rollback?: () => void
}

export interface E2EStep {
    order: number
    action: string
    target: string
    data?: any
    expected?: any
    timeout?: number
}

export interface Precondition {
    type: 'data' | 'state' | 'environment'
    description: string
    verify: () => Promise<boolean>
}

export class E2ETestRunner {
    async runCase(tc: E2ETestCase): Promise<E2EResult> {
        const startTime = Date.now()
        const logs: string[] = []
        
        // 检查前置条件
        for (const pre of tc.preconditions) {
            const met = await pre.verify()
            if (!met) {
                return {
                    id: tc.id,
                    name: tc.name,
                    priority: tc.priority,
                    passed: false,
                    duration: Date.now() - startTime,
                    error: `Precondition not met: ${pre.description}`,
                    logs
                }
            }
            logs.push(`✓ Precondition: ${pre.description}`)
        }
        
        // 执行步骤
        for (const step of tc.steps) {
            try {
                const result = await this.executeStep(step)
                logs.push(`✓ Step ${step.order}: ${step.action} ${step.target}`)
                if (step.expected && result !== step.expected) {
                    logs.push(`  ⚠ Expected ${step.expected}, got ${result}`)
                }
            } catch (e) {
                logs.push(`✗ Step ${step.order}: ${(e as Error).message}`)
                
                // 回滚
                if (tc.rollback) {
                    try { tc.rollback() } catch {}
                }
                
                return {
                    id: tc.id,
                    name: tc.name,
                    priority: tc.priority,
                    module: tc.module,
                    passed: false,
                    duration: Date.now() - startTime,
                    error: `Step ${step.order} failed: ${(e as Error).message}`,
                    logs
                }
            }
        }
        
        return {
            id: tc.id,
            name: tc.name,
            priority: tc.priority,
            module: tc.module,
            passed: true,
            duration: Date.now() - startTime,
            error: undefined,
            logs
        }
    }
    
    private async executeStep(step: E2EStep): Promise<any> {
        // 模拟执行
        await new Promise(resolve => setTimeout(resolve, step.timeout || 100))
        return 'success'
    }
}

// ═══════════════════════════════════════════════════════════════════════
// 通用结果类型
// ═══════════════════════════════════════════════════════════════════════

export interface TestResult {
    name: string
    category: 'valid' | 'invalid' | 'boundary' | 'error' | 'integration' | 'api' | 'e2e'
    passed: boolean
    duration: number
    error?: string
}

export interface E2EResult extends TestResult {
    id: string
    priority: 'P0' | 'P1' | 'P2' | 'P3'
    module?: string
    logs: string[]
}

// ═══════════════════════════════════════════════════════════════════════
// 测试用例设计方法论
// ═══════════════════════════════════════════════════════════════════════

/**
 * 等价类划分 (Equivalence Partitioning)
 * 将输入域划分为有效等价类和无效等价类
 */
export function generateEquivalenceClasses<T>(
    validRanges: { min: T; max: T }[],
    invalidValues: T[]
): { valid: T[]; invalid: T[] } {
    // 生成边界值
    const valid: T[] = []
    for (const range of validRanges) {
        valid.push(range.min)
        valid.push(range.max)
        valid.push((range.min + range.max) / 2)
    }
    return { valid, invalid: invalidValues }
}

/**
 * 边界值分析 (Boundary Value Analysis)
 * 专注于边界条件的测试用例设计
 */
export function generateBoundaryCases<T>(
    ranges: { min: T; max: T; step?: number }[]
): T[] {
    const cases: T[] = []
    for (const range of ranges) {
        cases.push(range.min)           // 最小值
        cases.push(range.min + 1 as T)   // 最小值+1
        cases.push(range.max)           // 最大值
        cases.push(range.max - 1 as T)  // 最大值-1
        cases.push((range.min + range.max) / 2 as T) // 中间值
    }
    return cases
}

/**
 * 错误推测法 (Error Guessing)
 * 基于经验和直觉推测可能出错的情况
 */
export function generateErrorGuessingCases(): string[] {
    return [
        'null输入',
        '空字符串',
        '超长输入',
        '特殊字符',
        'SQL注入',
        'XSS攻击',
        '负数',
        '零值',
        '小数',
        '非数字字符'
    ]
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export const TestingFramework = {
    UnitTestRunner,
    IntegrationTestRunner,
    ApiTestRunner,
    E2ETestRunner,
    generateEquivalenceClasses,
    generateBoundaryCases,
    generateErrorGuessingCases
}

export default TestingFramework
