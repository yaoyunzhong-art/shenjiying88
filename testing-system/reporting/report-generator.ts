/**
 * Test Report Generator · 测试报告生成与分析 V1.0
 * 
 * 功能:
 * - 每日标准化测试报告
 * - 测试数据分析与聚合
 * - 失败率高发模块识别
 * - 性能波动趋势分析
 */

import { TestMetrics, FailedTest, AggregatedSummary, TrendAnalysis } from '../monitoring/monitoring'

// ═══════════════════════════════════════════════════════════════════════
// 报告数据结构
// ═══════════════════════════════════════════════════════════════════════

export interface DailyReport {
    date: string
    generatedAt: number
    period: {
        start: number
        end: number
    }
    summary: ReportSummary
    suiteResults: SuiteResult[]
    failedTests: FailedTestDetail[]
    trends: TrendReport
    recommendations: Recommendation[]
}

export interface ReportSummary {
    totalTests: number
    totalPassed: number
    totalFailed: number
    totalSkipped: number
    overallPassRate: number
    avgDuration: number
    totalDuration: number
    coveragePercent?: number
}

export interface SuiteResult {
    suiteName: string
    module: string
    total: number
    passed: number
    failed: number
    skipped: number
    passRate: number
    avgDuration: number
    trend: 'IMPROVING' | 'DEGRADING' | 'STABLE'
}

export interface FailedTestDetail {
    id: string
    name: string
    suite: string
    module: string
    error: string
    firstFailedAt: number
    lastFailedAt: number
    failCount: number
    flaky: boolean  // 是否为不稳定测试
}

export interface TrendReport {
    passRateTrend: TrendAnalysis
    durationTrend: DurationTrend
    topFailingModules: ModuleFailure[]
}

export interface DurationTrend {
    direction: 'IMPROVING' | 'DEGRADING' | 'STABLE'
    changePercent: number
    avgDuration: number
}

export interface ModuleFailure {
    module: string
    failCount: number
    failRate: number
    trend: 'UP' | 'DOWN' | 'STABLE'
}

export interface Recommendation {
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    category: 'STABILITY' | 'PERFORMANCE' | 'COVERAGE' | 'MAINTENANCE'
    title: string
    description: string
    actionableSteps: string[]
}

// ═══════════════════════════════════════════════════════════════════════
// 报告生成器
// ═══════════════════════════════════════════════════════════════════════

export class TestReportGenerator {
    
    /**
     * 生成每日报告
     */
    generateDailyReport(
        date: string,
        metricsHistory: TestMetrics[],
        failedTests: FailedTest[]
    ): DailyReport {
        const startOfDay = new Date(date).setHours(0, 0, 0, 0)
        const endOfDay = new Date(date).setHours(23, 59, 59, 999)
        
        // 过滤当天的数据
        const todayMetrics = metricsHistory.filter(
            m => m.timestamp >= startOfDay && m.timestamp <= endOfDay
        )
        
        return {
            date,
            generatedAt: Date.now(),
            period: { start: startOfDay, end: endOfDay },
            summary: this.generateSummary(todayMetrics),
            suiteResults: this.generateSuiteResults(todayMetrics),
            failedTests: this.generateFailedTestDetails(failedTests, todayMetrics),
            trends: this.generateTrendReport(todayMetrics),
            recommendations: this.generateRecommendations(todayMetrics, failedTests)
        }
    }
    
    /**
     * 生成汇总统计
     */
    private generateSummary(metrics: TestMetrics[]): ReportSummary {
        if (metrics.length === 0) {
            return {
                totalTests: 0,
                totalPassed: 0,
                totalFailed: 0,
                totalSkipped: 0,
                overallPassRate: 0,
                avgDuration: 0,
                totalDuration: 0
            }
        }
        
        const totalTests = metrics.reduce((sum, m) => sum + m.total, 0)
        const totalPassed = metrics.reduce((sum, m) => sum + m.passed, 0)
        const totalFailed = metrics.reduce((sum, m) => sum + m.failed, 0)
        const totalSkipped = metrics.reduce((sum, m) => sum + m.skipped, 0)
        const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0)
        
        return {
            totalTests,
            totalPassed,
            totalFailed,
            totalSkipped,
            overallPassRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
            avgDuration: metrics.length > 0 ? totalDuration / metrics.length : 0,
            totalDuration
        }
    }
    
    /**
     * 生成分模块结果
     */
    private generateSuiteResults(metrics: TestMetrics[]): SuiteResult[] {
        const suiteMap = new Map<string, TestMetrics[]>()
        
        for (const m of metrics) {
            const existing = suiteMap.get(m.suiteName) || []
            existing.push(m)
            suiteMap.set(m.suiteName, existing)
        }
        
        const results: SuiteResult[] = []
        
        for (const [suiteName, suiteMetrics] of suiteMap) {
            const total = suiteMetrics.reduce((sum, m) => sum + m.total, 0)
            const passed = suiteMetrics.reduce((sum, m) => sum + m.passed, 0)
            const failed = suiteMetrics.reduce((sum, m) => sum + m.failed, 0)
            const skipped = suiteMetrics.reduce((sum, m) => sum + m.skipped, 0)
            const totalDuration = suiteMetrics.reduce((sum, m) => sum + m.duration, 0)
            
            // 计算趋势
            const passRates = suiteMetrics.map(m => m.passRate)
            const trend = this.calculateTrend(passRates)
            
            results.push({
                suiteName,
                module: this.extractModule(suiteName),
                total,
                passed,
                failed,
                skipped,
                passRate: total > 0 ? (passed / total) * 100 : 0,
                avgDuration: suiteMetrics.length > 0 ? totalDuration / suiteMetrics.length : 0,
                trend
            })
        }
        
        return results.sort((a, b) => b.failCount - a.failCount)
    }
    
    /**
     * 生成失败测试详情
     */
    private generateFailedTestDetails(
        failedTests: FailedTest[],
        metrics: TestMetrics[]
    ): FailedTestDetail[] {
        const details: FailedTestDetail[] = []
        
        for (const ft of failedTests) {
            const existing = details.find(d => d.id === ft.id)
            
            if (existing) {
                existing.failCount++
                existing.lastFailedAt = ft.timestamp
            } else {
                details.push({
                    id: ft.id,
                    name: ft.name,
                    suite: ft.suite,
                    module: this.extractModule(ft.suite),
                    error: ft.error,
                    firstFailedAt: ft.timestamp,
                    lastFailedAt: ft.timestamp,
                    failCount: 1,
                    flaky: false  // 需要历史数据判断
                })
            }
        }
        
        // 标记不稳定测试 (失败次数 > 总运行次数的30%)
        for (const d of details) {
            const suiteMetrics = metrics.find(m => m.suiteName === d.suite)
            if (suiteMetrics && d.failCount > (suiteMetrics.total * 0.3)) {
                d.flaky = true
            }
        }
        
        return details.sort((a, b) => b.failCount - a.failCount)
    }
    
    /**
     * 生成趋势报告
     */
    private generateTrendReport(metrics: TestMetrics[]): TrendReport {
        // 通过率趋势
        const passRates = metrics.map(m => m.passRate)
        const passRateTrend = this.calculateTrendAnalysis(passRates)
        
        // 执行时间趋势
        const durations = metrics.map(m => m.duration)
        const durationTrend = this.calculateDurationTrend(durations)
        
        // 高失败率模块
        const moduleFailures = this.calculateModuleFailures(metrics)
        
        return {
            passRateTrend,
            durationTrend,
            topFailingModules: moduleFailures.slice(0, 5)
        }
    }
    
    /**
     * 计算模块失败情况
     */
    private calculateModuleFailures(metrics: TestMetrics[]): ModuleFailure[] {
        const moduleMap = new Map<string, { fail: number; total: number }>()
        
        for (const m of metrics) {
            const module = this.extractModule(m.suiteName)
            const existing = moduleMap.get(module) || { fail: 0, total: 0 }
            existing.fail += m.failed
            existing.total += m.total
            moduleMap.set(module, existing)
        }
        
        const failures: ModuleFailure[] = []
        
        for (const [module, data] of moduleMap) {
            failures.push({
                module,
                failCount: data.fail,
                failRate: data.total > 0 ? (data.fail / data.total) * 100 : 0,
                trend: 'STABLE'  // 需要更多历史数据
            })
        }
        
        return failures.sort((a, b) => b.failRate - a.failRate)
    }
    
    /**
     * 计算执行时间趋势
     */
    private calculateDurationTrend(durations: number[]): DurationTrend {
        if (durations.length < 2) {
            return { direction: 'STABLE', changePercent: 0, avgDuration: durations[0] || 0 }
        }
        
        const firstHalf = durations.slice(0, Math.floor(durations.length / 2))
        const secondHalf = durations.slice(Math.floor(durations.length / 2))
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        
        const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0
        
        let direction: 'IMPROVING' | 'DEGRADING' | 'STABLE'
        if (changePercent < -5) direction = 'IMPROVING'  // 时间减少
        else if (changePercent > 5) direction = 'DEGRADING'  // 时间增加
        else direction = 'STABLE'
        
        return {
            direction,
            changePercent,
            avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length
        }
    }
    
    /**
     * 计算趋势 (简单线性)
     */
    private calculateTrend(values: number[]): 'IMPROVING' | 'DEGRADING' | 'STABLE' {
        if (values.length < 2) return 'STABLE'
        
        const analysis = this.calculateTrendAnalysis(values)
        return analysis.direction
    }
    
    /**
     * 计算趋势分析
     */
    private calculateTrendAnalysis(values: number[]): TrendAnalysis {
        if (values.length < 2) {
            return { direction: 'STABLE', changePercent: 0 }
        }
        
        // 简单计算: 比较前后差异
        const first = values.slice(0, Math.floor(values.length / 2))
        const second = values.slice(Math.floor(values.length / 2))
        
        const firstAvg = first.reduce((a, b) => a + b, 0) / first.length
        const secondAvg = second.reduce((a, b) => a + b, 0) / second.length
        
        const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0
        
        let direction: 'IMPROVING' | 'DEGRADING' | 'STABLE'
        if (changePercent > 5) direction = 'IMPROVING'
        else if (changePercent < -5) direction = 'DEGRADING'
        else direction = 'STABLE'
        
        return { direction, changePercent }
    }
    
    /**
     * 提取模块名
     */
    private extractModule(suiteName: string): string {
        const parts = suiteName.split('/')
        return parts[parts.length - 2] || parts[0]
    }
    
    /**
     * 生成建议
     */
    private generateRecommendations(
        metrics: TestMetrics[],
        failedTests: FailedTest[]
    ): Recommendation[] {
        const recommendations: Recommendation[] = []
        
        // 基于通过率
        const summary = this.generateSummary(metrics)
        if (summary.overallPassRate < 80) {
            recommendations.push({
                priority: 'HIGH',
                category: 'STABILITY',
                title: '测试通过率过低',
                description: `当前通过率 ${summary.overallPassRate.toFixed(1)}%, 低于80%阈值`,
                actionableSteps: [
                    '分析失败用例,识别共性问题',
                    '优先修复高频失败用例',
                    '检查是否有环境或数据问题'
                ]
            })
        }
        
        // 基于不稳定测试
        const flakyTests = failedTests.filter(f => {
            // 简单判断: 同一个测试失败多次
            return failedTests.filter(ff => ff.id === f.id).length > 3
        })
        
        if (flakyTests.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'STABILITY',
                title: '存在不稳定性测试',
                description: `发现 ${flakyTests.length} 个疑似不稳定的测试用例`,
                actionableSteps: [
                    '标记这些用例为 @flaky',
                    '分析不稳定原因 (时序/并发/数据依赖)',
                    '修复或移除问题用例'
                ]
            })
        }
        
        // 基于性能趋势
        const durationTrend = this.calculateDurationTrend(metrics.map(m => m.duration))
        if (durationTrend.direction === 'DEGRADING') {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'PERFORMANCE',
                title: '测试执行时间增长',
                description: `执行时间相比上期增长 ${durationTrend.changePercent.toFixed(1)}%`,
                actionableSteps: [
                    '分析耗时最长的测试用例',
                    '检查是否有性能回退',
                    '考虑增加测试并行度'
                ]
            })
        }
        
        return recommendations
    }
    
    /**
     * 生成Markdown格式报告
     */
    generateMarkdownReport(report: DailyReport): string {
        const lines: string[] = []
        
        lines.push(`# 测试日报 · ${report.date}`)
        lines.push('')
        lines.push(`> 生成时间: ${new Date(report.generatedAt).toLocaleString()}`)
        lines.push('')
        lines.push('---')
        lines.push('')
        
        // 汇总
        lines.push('## 📊 测试概况')
        lines.push('')
        lines.push('| 指标 | 值 |')
        lines.push('|------|---|')
        lines.push(`| 总测试数 | ${report.summary.totalTests} |`)
        lines.push(`| 通过 | ${report.summary.totalPassed} |`)
        lines.push(`| 失败 | ${report.summary.totalFailed} |`)
        lines.push(`| 跳过 | ${report.summary.totalSkipped} |`)
        lines.push(`| 通过率 | ${report.summary.overallPassRate.toFixed(1)}% |`)
        lines.push(`| 总耗时 | ${(report.summary.totalDuration / 60000).toFixed(1)}分钟 |`)
        lines.push('')
        
        // 模块结果
        lines.push('## 📦 模块结果')
        lines.push('')
        lines.push('| 模块 | 通过率 | 趋势 |')
        lines.push('|------|--------|------|')
        for (const suite of report.suiteResults) {
            const emoji = suite.passRate >= 90 ? '🟢' : suite.passRate >= 70 ? '🟡' : '🔴'
            const trendEmoji = suite.trend === 'IMPROVING' ? '📈' : 
                              suite.trend === 'DEGRADING' ? '📉' : '➡️'
            lines.push(`| ${suite.suiteName} | ${emoji} ${suite.passRate.toFixed(1)}% | ${trendEmoji} |`)
        }
        lines.push('')
        
        // 失败测试
        if (report.failedTests.length > 0) {
            lines.push('## ❌ 失败测试')
            lines.push('')
            for (const ft of report.failedTests.slice(0, 10)) {
                lines.push(`### ${ft.name}`)
                lines.push(`- 模块: ${ft.module}`)
                lines.push(`- 失败次数: ${ft.failCount}`)
                lines.push(`- 错误: ${ft.error}`)
                lines.push('')
            }
        }
        
        // 趋势
        lines.push('## 📈 趋势分析')
        lines.push('')
        lines.push(`- 通过率趋势: ${report.trends.passRateTrend.direction}`)
        lines.push(`- 执行时间趋势: ${report.trends.durationTrend.direction}`)
        lines.push('')
        
        // 建议
        if (report.recommendations.length > 0) {
            lines.push('## 💡 改进建议')
            lines.push('')
            for (const rec of report.recommendations) {
                const emoji = rec.priority === 'HIGH' ? '🔴' : 
                             rec.priority === 'MEDIUM' ? '🟡' : '🟢'
                lines.push(`### ${emoji} ${rec.title}`)
                lines.push('')
                lines.push(rec.description)
                lines.push('')
                lines.push('**建议措施:**')
                for (const step of rec.actionableSteps) {
                    lines.push(`- ${step}`)
                }
                lines.push('')
            }
        }
        
        return lines.join('\n')
    }
}

export default TestReportGenerator
