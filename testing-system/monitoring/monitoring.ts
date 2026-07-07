/**
 * Testing Monitor · 执行监控与告警系统 V1.0
 * 
 * 功能:
 * - 全链路指标采集
 * - 实时告警触发
 * - 告警渠道推送 (邮件/企微)
 */

import { EventEmitter } from 'events'

// ═══════════════════════════════════════════════════════════════════════
// 指标采集
// ═══════════════════════════════════════════════════════════════════════

export interface TestMetrics {
    timestamp: number
    suiteName: string
    total: number
    passed: number
    failed: number
    skipped: number
    duration: number
    passRate: number
    qps: number  // 每秒执行数
    resourceUsage?: ResourceUsage
}

export interface ResourceUsage {
    cpuPercent: number
    memoryMB: number
    heapUsedMB: number
    heapTotalMB: number
}

export interface FailedTest {
    id: string
    name: string
    suite: string
    error: string
    stack?: string
    timestamp: number
    retries: number
}

export interface Alert {
    id: string
    level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
    source: string
    message: string
    timestamp: number
    metadata?: Record<string, any>
    resolved?: boolean
    resolvedAt?: number
}

// ═══════════════════════════════════════════════════════════════════════
// 指标收集器
// ═══════════════════════════════════════════════════════════════════════

export class MetricsCollector extends EventEmitter {
    private metricsHistory: TestMetrics[] = []
    private currentMetrics: Map<string, TestMetrics> = new Map()
    
    constructor(private maxHistory: number = 1000) {
        super()
    }
    
    // 记录测试运行指标
    recordMetrics(metrics: TestMetrics) {
        this.metricsHistory.push(metrics)
        
        // 保持历史记录在限制内
        if (this.metricsHistory.length > this.maxHistory) {
            this.metricsHistory.shift()
        }
        
        // 更新当前指标
        this.currentMetrics.set(metrics.suiteName, metrics)
        
        // 触发指标更新事件
        this.emit('metrics', metrics)
        
        // 检查是否需要告警
        this.checkAlertConditions(metrics)
    }
    
    // 获取历史指标
    getHistory(suiteName?: string, limit?: number): TestMetrics[] {
        let history = suiteName 
            ? this.metricsHistory.filter(m => m.suiteName === suiteName)
            : this.metricsHistory
        
        return limit ? history.slice(-limit) : history
    }
    
    // 获取最新指标
    getLatest(suiteName: string): TestMetrics | undefined {
        return this.currentMetrics.get(suiteName)
    }
    
    // 获取汇总统计
    getSummary(): AggregatedSummary {
        if (this.metricsHistory.length === 0) {
            return { totalTests: 0, totalPassed: 0, totalFailed: 0, avgPassRate: 0 }
        }
        
        const totalTests = this.metricsHistory.reduce((sum, m) => sum + m.total, 0)
        const totalPassed = this.metricsHistory.reduce((sum, m) => sum + m.passed, 0)
        const totalFailed = this.metricsHistory.reduce((sum, m) => sum + m.failed, 0)
        const avgPassRate = this.metricsHistory.reduce((sum, m) => sum + m.passRate, 0) / this.metricsHistory.length
        
        return { totalTests, totalPassed, totalFailed, avgPassRate }
    }
    
    // 检查告警条件
    private checkAlertConditions(metrics: TestMetrics) {
        // 通过率低于阈值
        if (metrics.passRate < 0.8) {
            this.emit('alert', {
                id: `ALERT-${Date.now()}`,
                level: 'ERROR',
                source: metrics.suiteName,
                message: `测试通过率过低: ${(metrics.passRate * 100).toFixed(1)}%`,
                timestamp: Date.now(),
                metadata: { passRate: metrics.passRate, threshold: 0.8 }
            })
        }
        
        // 执行时间超过阈值 (10分钟)
        if (metrics.duration > 600000) {
            this.emit('alert', {
                id: `ALERT-${Date.now()}`,
                level: 'WARNING',
                source: metrics.suiteName,
                message: `测试执行时间过长: ${(metrics.duration / 60000).toFixed(1)}分钟`,
                timestamp: Date.now(),
                metadata: { duration: metrics.duration, threshold: 600000 }
            })
        }
        
        // 失败数激增 (相比上次)
        const lastMetrics = this.getLatest(metrics.suiteName)
        if (lastMetrics && metrics.failed > lastMetrics.failed * 2) {
            this.emit('alert', {
                id: `ALERT-${Date.now()}`,
                level: 'CRITICAL',
                source: metrics.suiteName,
                message: `失败用例数激增: ${lastMetrics.failed} → ${metrics.failed}`,
                timestamp: Date.now(),
                metadata: { previous: lastMetrics.failed, current: metrics.failed }
            })
        }
    }
    
    // 获取趋势分析
    getTrend(suiteName: string, windowSize: number = 10): TrendAnalysis {
        const history = this.getHistory(suiteName, windowSize)
        
        if (history.length < 2) {
            return { direction: 'STABLE', changePercent: 0 }
        }
        
        const first = history[0]
        const last = history[history.length - 1]
        
        const passRateChange = last.passRate - first.passRate
        const changePercent = (passRateChange / (first.passRate || 1)) * 100
        
        let direction: 'IMPROVING' | 'DEGRADING' | 'STABLE'
        if (changePercent > 5) direction = 'IMPROVING'
        else if (changePercent < -5) direction = 'DEGRADING'
        else direction = 'STABLE'
        
        return { direction, changePercent }
    }
}

export interface AggregatedSummary {
    totalTests: number
    totalPassed: number
    totalFailed: number
    avgPassRate: number
}

export interface TrendAnalysis {
    direction: 'IMPROVING' | 'DEGRADING' | 'STABLE'
    changePercent: number
}

// ═══════════════════════════════════════════════════════════════════════
// 告警管理器
// ═══════════════════════════════════════════════════════════════════════

export class AlertManager extends EventEmitter {
    private alerts: Map<string, Alert> = new Map()
    private alertHistory: Alert[] = []
    private channels: AlertChannel[] = []
    
    constructor() {
        super()
    }
    
    // 注册告警渠道
    registerChannel(channel: AlertChannel) {
        this.channels.push(channel)
    }
    
    // 发送告警
    sendAlert(alert: Alert) {
        // 去重检查 (5分钟内同一来源的同类告警)
        const key = `${alert.source}-${alert.level}`
        const existing = Array.from(this.alerts.values())
            .find(a => a.source === alert.source && a.level === alert.level && 
                       alert.timestamp - a.timestamp < 300000)
        
        if (existing) {
            console.log(`[AlertManager] 告警去重: ${key}`)
            return
        }
        
        // 存储告警
        this.alerts.set(alert.id, alert)
        this.alertHistory.push(alert)
        
        // 发送到各渠道
        for (const channel of this.channels) {
            channel.send(alert).catch(e => {
                console.error(`[AlertManager] 渠道 ${channel.name} 发送失败:`, e)
            })
        }
        
        // 触发事件
        this.emit('alert', alert)
        
        // 自动解析 (对于非关键告警,30分钟后自动标记为已解决)
        if (alert.level !== 'CRITICAL') {
            setTimeout(() => {
                this.resolveAlert(alert.id)
            }, 30 * 60 * 1000)
        }
    }
    
    // 解决告警
    resolveAlert(alertId: string) {
        const alert = this.alerts.get(alertId)
        if (alert && !alert.resolved) {
            alert.resolved = true
            alert.resolvedAt = Date.now()
            this.emit('resolved', alert)
        }
    }
    
    // 获取活跃告警
    getActiveAlerts(level?: Alert['level']): Alert[] {
        return Array.from(this.alerts.values())
            .filter(a => !a.resolved && (!level || a.level === level))
            .sort((a, b) => b.timestamp - a.timestamp)
    }
    
    // 获取告警统计
    getAlertStats(): AlertStats {
        const active = this.getActiveAlerts()
        const critical = active.filter(a => a.level === 'CRITICAL').length
        const error = active.filter(a => a.level === 'ERROR').length
        const warning = active.filter(a => a.level === 'WARNING').length
        
        return { total: active.length, critical, error, warning }
    }
}

export interface AlertStats {
    total: number
    critical: number
    error: number
    warning: number
}

// ═══════════════════════════════════════════════════════════════════════
// 告警渠道接口
// ═══════════════════════════════════════════════════════════════════════

export interface AlertChannel {
    name: string
    send: (alert: Alert) => Promise<void>
}

// 邮件告警渠道
export class EmailAlertChannel implements AlertChannel {
    name = 'email'
    
    constructor(
        private smtpConfig: { host: string; port: number; user: string; pass: string },
        private recipients: string[]
    ) {}
    
    async send(alert: Alert): Promise<void> {
        // 模拟发送邮件
        console.log(`[Email] 发送告警到 ${this.recipients.join(', ')}:`, alert.message)
        // 实际实现需要 nodemailer
    }
}

// 企业微信告警渠道
export class WeChatAlertChannel implements AlertChannel {
    name = 'wechat'
    
    constructor(private webhookUrl: string) {}
    
    async send(alert: Alert): Promise<void> {
        // 模拟发送企微消息
        console.log(`[WeChat] 发送告警:`, alert.message)
        // 实际实现需要 axios post 到 webhookUrl
    }
}

// 钉钉告警渠道
export class DingTalkAlertChannel implements AlertChannel {
    name = 'dingtalk'
    
    constructor(private webhookUrl: string) {}
    
    async send(alert: Alert): Promise<void> {
        // 模拟发送钉钉消息
        console.log(`[DingTalk] 发送告警:`, alert.message)
        // 实际实现需要 axios post 到 webhookUrl
    }
}

// 日志告警渠道 (始终启用)
export class LogAlertChannel implements AlertChannel {
    name = 'log'
    
    async send(alert: Alert): Promise<void> {
        const emoji = alert.level === 'CRITICAL' ? '🚨' : 
                      alert.level === 'ERROR' ? '❌' : 
                      alert.level === 'WARNING' ? '⚠️' : 'ℹ️'
        console.log(`${emoji} [${alert.level}] [${alert.source}] ${alert.message}`)
    }
}

// ═══════════════════════════════════════════════════════════════════════
// 监控仪表板
// ═══════════════════════════════════════════════════════════════════════

export class MonitoringDashboard extends EventEmitter {
    private metrics: MetricsCollector
    private alerts: AlertManager
    
    constructor() {
        super()
        this.metrics = new MetricsCollector()
        this.alerts = new AlertManager()
        
        // 连接指标到告警
        this.metrics.on('alert', (alert: Alert) => {
            this.alerts.sendAlert(alert)
        })
        
        // 初始化日志渠道
        this.alerts.registerChannel(new LogAlertChannel())
    }
    
    // 获取监控数据
    getDashboardData(): DashboardData {
        return {
            timestamp: Date.now(),
            metrics: {
                summary: this.metrics.getSummary(),
                recent: this.metrics.getHistory(undefined, 10)
            },
            alerts: {
                stats: this.alerts.getAlertStats(),
                active: this.alerts.getActiveAlerts()
            },
            system: this.getSystemStatus()
        }
    }
    
    // 获取系统状态
    private getSystemStatus(): SystemStatus {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        }
    }
    
    // 添加指标
    addMetrics(m: TestMetrics) {
        this.metrics.recordMetrics(m)
    }
    
    // 发送告警
    sendAlert(alert: Alert) {
        this.alerts.sendAlert(alert)
    }
    
    // 注册告警渠道
    registerAlertChannel(channel: AlertChannel) {
        this.alerts.registerChannel(channel)
    }
}

export interface DashboardData {
    timestamp: number
    metrics: {
        summary: AggregatedSummary
        recent: TestMetrics[]
    }
    alerts: {
        stats: AlertStats
        active: Alert[]
    }
    system: SystemStatus
}

export interface SystemStatus {
    uptime: number
    memory: NodeJS.MemoryUsage
    cpu: NodeJS.CpuUsage
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export {
    MetricsCollector,
    AlertManager,
    MonitoringDashboard,
    EmailAlertChannel,
    WeChatAlertChannel,
    DingTalkAlertChannel,
    LogAlertChannel
}

export default {
    MetricsCollector,
    AlertManager,
    MonitoringDashboard
}
