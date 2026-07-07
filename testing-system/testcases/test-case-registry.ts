/**
 * Test Case Registry & Review · 测试用例评审更新机制 V1.0
 * 
 * 功能:
 * - 测试用例注册与管理
 * - 用例版本控制
 * - 定期评审提醒
 * - 业务迭代同步
 */

import { EventEmitter } from 'events'

// ═══════════════════════════════════════════════════════════════════════
// 测试用例元数据
// ═══════════════════════════════════════════════════════════════════════

export interface TestCaseMetadata {
    id: string
    name: string
    module: string
    category: 'unit' | 'integration' | 'api' | 'e2e'
    priority: 'P0' | 'P1' | 'P2' | 'P3'
    tags: string[]
    createdAt: number
    updatedAt: number
    lastReviewedAt?: number
    lastRunAt?: number
    lastRunResult?: 'PASS' | 'FAIL' | 'SKIP'
    author: string
    relatedPhases: string[]  // 关联的Phase
    relatedFeatures: string[]  // 关联的功能
}

export interface TestCaseReview {
    id: string
    testCaseId: string
    reviewedAt: number
    reviewedBy: string
    status: 'APPROVED' | 'NEEDS_UPDATE' | 'DEPRECATED'
    comments: string
    nextReviewAt: number
}

export interface ReviewSchedule {
    monthly: TestCaseMetadata[]      // 每月评审
    quarterly: TestCaseMetadata[]  // 每季度评审
    annually: TestCaseMetadata[]   // 每年评审
}

// ═══════════════════════════════════════════════════════════════════════
// 测试用例注册表
// ═══════════════════════════════════════════════════════════════════════

export class TestCaseRegistry extends EventEmitter {
    private cases: Map<string, TestCaseMetadata> = new Map()
    private reviews: Map<string, TestCaseReview> = new Map()
    private versionHistory: Map<string, VersionEntry[]> = new Map()
    
    constructor() {
        super()
    }
    
    /**
     * 注册测试用例
     */
    register(tc: TestCaseMetadata): void {
        const existing = this.cases.get(tc.id)
        
        if (existing) {
            // 更新版本历史
            this.addVersionHistory(tc.id, existing)
        }
        
        this.cases.set(tc.id, {
            ...tc,
            updatedAt: Date.now()
        })
        
        this.emit('registered', tc)
    }
    
    /**
     * 获取测试用例
     */
    get(id: string): TestCaseMetadata | undefined {
        return this.cases.get(id)
    }
    
    /**
     * 获取所有用例
     */
    getAll(): TestCaseMetadata[] {
        return Array.from(this.cases.values())
    }
    
    /**
     * 按模块获取
     */
    getByModule(module: string): TestCaseMetadata[] {
        return this.getAll().filter(tc => tc.module === module)
    }
    
    /**
     * 按优先级获取
     */
    getByPriority(priority: TestCaseMetadata['priority']): TestCaseMetadata[] {
        return this.getAll().filter(tc => tc.priority === priority)
    }
    
    /**
     * 按标签获取
     */
    getByTag(tag: string): TestCaseMetadata[] {
        return this.getAll().filter(tc => tc.tags.includes(tag))
    }
    
    /**
     * 获取需要评审的用例
     */
    getNeedingReview(): TestCaseMetadata[] {
        const now = Date.now()
        const monthInMs = 30 * 24 * 60 * 60 * 1000
        
        return this.getAll().filter(tc => {
            if (!tc.lastReviewedAt) return true
            
            const monthsSinceReview = (now - tc.lastReviewedAt) / monthInMs
            
            // P0用例每月评审
            if (tc.priority === 'P0') return monthsSinceReview >= 1
            
            // P1用例每季度评审
            if (tc.priority === 'P1') return monthsSinceReview >= 3
            
            // P2用例每半年评审
            if (tc.priority === 'P2') return monthsSinceReview >= 6
            
            // P3用例每年评审
            return monthsSinceReview >= 12
        })
    }
    
    /**
     * 获取高失败率用例 (不稳定用例)
     */
    getFlakyCases(threshold: number = 0.3): TestCaseMetadata[] {
        return this.getAll().filter(tc => {
            // 简单判断: 上次运行失败
            return tc.lastRunResult === 'FAIL'
        })
    }
    
    /**
     * 更新用例运行结果
     */
    updateRunResult(id: string, result: 'PASS' | 'FAIL' | 'SKIP'): void {
        const tc = this.cases.get(id)
        if (tc) {
            tc.lastRunAt = Date.now()
            tc.lastRunResult = result
            tc.updatedAt = Date.now()
            this.emit('resultUpdated', { id, result })
        }
    }
    
    /**
     * 添加评审记录
     */
    addReview(review: TestCaseReview): void {
        this.reviews.set(review.id, review)
        
        const tc = this.cases.get(review.testCaseId)
        if (tc) {
            tc.lastReviewedAt = review.reviewedAt
            tc.updatedAt = Date.now()
        }
        
        this.emit('reviewAdded', review)
    }
    
    /**
     * 获取用例的评审历史
     */
    getReviewHistory(testCaseId: string): TestCaseReview[] {
        return Array.from(this.reviews.values())
            .filter(r => r.testCaseId === testCaseId)
            .sort((a, b) => b.reviewedAt - a.reviewedAt)
    }
    
    /**
     * 添加版本历史
     */
    private addVersionHistory(testCaseId: string, oldVersion: TestCaseMetadata): void {
        const history = this.versionHistory.get(testCaseId) || []
        
        history.push({
            version: history.length + 1,
            timestamp: Date.now(),
            data: oldVersion
        })
        
        // 保持最近10个版本
        if (history.length > 10) {
            history.shift()
        }
        
        this.versionHistory.set(testCaseId, history)
    }
    
    /**
     * 获取版本历史
     */
    getVersionHistory(testCaseId: string): VersionEntry[] {
        return this.versionHistory.get(testCaseId) || []
    }
    
    /**
     * 生成评审计划
     */
    generateReviewSchedule(): ReviewSchedule {
        const now = Date.now()
        const monthInMs = 30 * 24 * 60 * 60 * 1000
        const quarterInMs = 3 * monthInMs
        const yearInMs = 12 * monthInMs
        
        const cases = this.getAll()
        
        return {
            monthly: cases.filter(tc => {
                if (!tc.lastReviewedAt) return true
                return (now - tc.lastReviewedAt) >= monthInMs
            }),
            quarterly: cases.filter(tc => {
                if (!tc.lastReviewedAt) return false
                const months = (now - tc.lastReviewedAt) / monthInMs
                return months >= 3 && months < 12
            }),
            annually: cases.filter(tc => {
                if (!tc.lastReviewedAt) return false
                return (now - tc.lastReviewedAt) >= yearInMs
            })
        }
    }
    
    /**
     * 同步业务迭代 - 标记受影响的用例
     */
    syncWithBusinessIteration(iterationId: string, affectedFeatures: string[]): AffectedResult {
        const affected: TestCaseMetadata[] = []
        const deprecated: TestCaseMetadata[] = []
        const newRequirements: string[] = []
        
        for (const tc of this.getAll()) {
            // 检查是否有功能受影响
            const tcAffected = tc.relatedFeatures.some(f => 
                affectedFeatures.includes(f)
            )
            
            if (tcAffected) {
                affected.push(tc)
                
                // 如果用例超过1年未更新,标记为需要评审
                const now = Date.now()
                const yearInMs = 365 * 24 * 60 * 60 * 1000
                if (now - tc.updatedAt > yearInMs) {
                    deprecated.push(tc)
                }
            }
        }
        
        // 生成新的测试需求
        for (const feature of affectedFeatures) {
            newRequirements.push(`验证 ${feature} 功能未被回归`)
        }
        
        this.emit('iterationSynced', {
            iterationId,
            affectedCount: affected.length,
            deprecatedCount: deprecated.length
        })
        
        return { affected, deprecated, newRequirements }
    }
    
    /**
     * 导出用例统计
     */
    exportStats(): RegistryStats {
        const cases = this.getAll()
        
        const byPriority = {
            P0: cases.filter(c => c.priority === 'P0').length,
            P1: cases.filter(c => c.priority === 'P1').length,
            P2: cases.filter(c => c.priority === 'P2').length,
            P3: cases.filter(c => c.priority === 'P3').length
        }
        
        const byCategory = {
            unit: cases.filter(c => c.category === 'unit').length,
            integration: cases.filter(c => c.category === 'integration').length,
            api: cases.filter(c => c.category === 'api').length,
            e2e: cases.filter(c => c.category === 'e2e').length
        }
        
        const byModule = new Map<string, number>()
        for (const tc of cases) {
            byModule.set(tc.module, (byModule.get(tc.module) || 0) + 1)
        }
        
        const needingReview = this.getNeedingReview()
        
        return {
            total: cases.length,
            byPriority,
            byCategory,
            byModule: Object.fromEntries(byModule),
            needingReviewCount: needingReview.length,
            lastSyncAt: Date.now()
        }
    }
}

export interface VersionEntry {
    version: number
    timestamp: number
    data: TestCaseMetadata
}

export interface AffectedResult {
    affected: TestCaseMetadata[]
    deprecated: TestCaseMetadata[]
    newRequirements: string[]
}

export interface RegistryStats {
    total: number
    byPriority: Record<string, number>
    byCategory: Record<string, number>
    byModule: Record<string, number>
    needingReviewCount: number
    lastSyncAt: number
}

// ═══════════════════════════════════════════════════════════════════════
// 用例评审服务
// ═══════════════════════════════════════════════════════════════════════

export class TestCaseReviewService extends EventEmitter {
    private registry: TestCaseRegistry
    private reviewReminders: Map<string, NodeJS.Timeout> = new Map()
    
    constructor(registry: TestCaseRegistry) {
        super()
        this.registry = registry
    }
    
    /**
     * 启动评审提醒
     */
    startReviewReminders(): void {
        // 每天检查一次
        const interval = setInterval(() => {
            this.checkAndNotifyReview()
        }, 24 * 60 * 60 * 1000)
        
        this.reviewReminders.set('daily', interval)
        
        // 启动时立即检查
        this.checkAndNotifyReview()
    }
    
    /**
     * 停止评审提醒
     */
    stopReviewReminders(): void {
        for (const timeout of this.reviewReminders.values()) {
            clearInterval(timeout)
        }
        this.reviewReminders.clear()
    }
    
    /**
     * 检查并通知需要评审的用例
     */
    private checkAndNotifyReview(): void {
        const needingReview = this.registry.getNeedingReview()
        
        if (needingReview.length > 0) {
            this.emit('reviewNeeded', {
                count: needingReview.length,
                cases: needingReview.map(tc => ({
                    id: tc.id,
                    name: tc.name,
                    module: tc.module,
                    priority: tc.priority
                }))
            })
        }
    }
    
    /**
     * 执行用例评审
     */
    async performReview(
        testCaseId: string,
        reviewer: string,
        status: TestCaseReview['status'],
        comments: string
    ): Promise<TestCaseReview> {
        const tc = this.registry.get(testCaseId)
        if (!tc) {
            throw new Error(`Test case not found: ${testCaseId}`)
        }
        
        const review: TestCaseReview = {
            id: `REV-${Date.now()}`,
            testCaseId,
            reviewedAt: Date.now(),
            reviewedBy: reviewer,
            status,
            comments,
            nextReviewAt: this.calculateNextReview(tc.priority)
        }
        
        this.registry.addReview(review)
        
        // 如果标记为需要更新或废弃,发出事件
        if (status === 'DEPRECATED') {
            this.emit('caseDeprecated', tc)
        } else if (status === 'NEEDS_UPDATE') {
            this.emit('caseNeedsUpdate', tc)
        }
        
        return review
    }
    
    /**
     * 计算下次评审时间
     */
    private calculateNextReview(priority: TestCaseMetadata['priority']): number {
        const now = Date.now()
        const monthInMs = 30 * 24 * 60 * 60 * 1000
        
        switch (priority) {
            case 'P0': return now + monthInMs
            case 'P1': return now + 3 * monthInMs
            case 'P2': return now + 6 * monthInMs
            case 'P3': return now + 12 * monthInMs
        }
    }
    
    /**
     * 生成评审报告
     */
    generateReviewReport(): ReviewReport {
        const schedule = this.registry.generateReviewSchedule()
        const stats = this.registry.exportStats()
        
        return {
            generatedAt: Date.now(),
            summary: {
                totalCases: stats.total,
                needingReview: stats.needingReviewCount,
                monthlyReviewCount: schedule.monthly.length,
                quarterlyReviewCount: schedule.quarterly.length,
                annuallyReviewCount: schedule.annually.length
            },
            urgentCases: schedule.monthly.map(tc => ({
                id: tc.id,
                name: tc.name,
                module: tc.module,
                lastReviewedAt: tc.lastReviewedAt
            })),
            recommendations: this.generateRecommendations(schedule)
        }
    }
    
    /**
     * 生成建议
     */
    private generateRecommendations(schedule: ReviewSchedule): string[] {
        const recommendations: string[] = []
        
        if (schedule.monthly.length > 10) {
            recommendations.push(`⚠️ ${schedule.monthly.length} 个用例需要月度评审,建议加快评审进度`)
        }
        
        if (schedule.quarterly.length > 20) {
            recommendations.push(`⚠️ ${schedule.quarterly.length} 个用例需要季度评审,请安排时间`)
        }
        
        const deprecatedCount = schedule.annually.filter(tc => {
            const yearInMs = 365 * 24 * 60 * 60 * 1000
            return Date.now() - (tc.lastReviewedAt || tc.createdAt) > yearInMs
        }).length
        
        if (deprecatedCount > 0) {
            recommendations.push(`🔴 ${deprecatedCount} 个用例超过1年未评审,建议重新评估或移除`)
        }
        
        return recommendations
    }
}

export interface ReviewReport {
    generatedAt: number
    summary: {
        totalCases: number
        needingReview: number
        monthlyReviewCount: number
        quarterlyReviewCount: number
        annuallyReviewCount: number
    }
    urgentCases: Array<{
        id: string
        name: string
        module: string
        lastReviewedAt?: number
    }>
    recommendations: string[]
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export {
    TestCaseRegistry,
    TestCaseReviewService
}

export default {
    TestCaseRegistry,
    TestCaseReviewService
}
