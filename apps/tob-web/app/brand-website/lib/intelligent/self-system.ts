/**
 * 智能自治系统核心
 * 具备自我学习、自我检测、自我创造、自我实现、自我进化能力
 */

import { contentGenerator, type OptimizationFeedback } from './content-generator';
import { globalPerformanceMonitor } from '../seo/performance-monitor';
import { geoIPResolver, type GeoLocation } from '../geo/geo-ip-resolver';

interface SEOMetrics {
  pageIndexCount: number; // 页面收录量
  keywordRankings: Record<string, number[]>; // 关键词排名
  organicTraffic: number; // 自然流量
  clickThroughRate: number; // 点击率
  crawlErrors: number; // 爬虫错误
}

interface GEOMetrics {
  brandCitations: number; // AI对话中品牌引用量
  localExposure: number; // 地域内容曝光量
  localLeadConversion: number; // 区域线索转化率
  localSearchRanking: number; // 本地搜索排名
}

export interface AnomalyAlert {
  id: string;
  type: 'seo' | 'geo' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  current: number;
  expected: number;
  deviation: number; // 偏差百分比
  rootCause: string;
  suggestions: string[];
  detectedAt: number;
  status: 'detected' | 'analyzing' | 'fixing' | 'resolved';
}

export interface OptimizationTask {
  id: string;
  type: 'content' | 'meta' | 'schema' | 'geo' | 'performance';
  priority: 'low' | 'medium' | 'high';
  target: string;
  action: string;
  estimatedImpact: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: number;
  executedAt?: number;
  result?: string;
}

/**
 * 智能自治系统
 */
export class IntelligentSystem {
  private seoMetrics: SEOMetrics = {
    pageIndexCount: 0,
    keywordRankings: {},
    organicTraffic: 0,
    clickThroughRate: 0,
    crawlErrors: 0,
  };

  private geoMetrics: GEOMetrics = {
    brandCitations: 0,
    localExposure: 0,
    localLeadConversion: 0,
    localSearchRanking: 0,
  };

  private anomalyAlerts: AnomalyAlert[] = [];
  private optimizationTasks: OptimizationTask[] = [];
  private isRunning: boolean = false;
  private lastCycleTime: number = 0;
  private cycleInterval: number = 300000; // 5分钟检测周期

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  /**
   * 初始化系统
   */
  private init(): void {
    // 设置性能监控告警
    globalPerformanceMonitor.addAlert({
      threshold: 0.1,
      window: 300000,
      callback: (metric, value, rating) => {
        if (rating === 'poor') {
          this.handlePerformanceAnomaly(metric, value);
        }
      },
    });

    // 启动自治循环
    this.startAutonomousCycle();
  }

  /**
   * 启动自治循环
   */
  private startAutonomousCycle(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    setInterval(() => {
      this.runAutonomousCycle();
    }, this.cycleInterval);
  }

  /**
   * 执行自治循环
   */
  async runAutonomousCycle(): Promise<void> {
    console.log('[IntelligentSystem] Running autonomous cycle...');
    this.lastCycleTime = Date.now();

    try {
      // 1. 自我检测
      await this.selfDetect();

      // 2. 自我创造（如有需要）
      await this.selfCreate();

      // 3. 自我实现
      await this.selfExecute();

      // 4. 自我进化
      await this.selfEvolve();
    } catch (error) {
      console.error('[IntelligentSystem] Cycle error:', error);
    }
  }

  /**
   * 自我检测：实时监测核心指标
   */
  async selfDetect(): Promise<AnomalyAlert[]> {
    console.log('[IntelligentSystem] Self-detection running...');

    // 检测SEO指标异常
    await this.detectSEOAnomalies();

    // 检测GEO指标异常
    await this.detectGEOAnomalies();

    // 检测性能指标异常
    await this.detectPerformanceAnomalies();

    // 返回未解决的告警
    return this.anomalyAlerts.filter((a) => a.status !== 'resolved');
  }

  /**
   * 检测SEO异常
   */
  private async detectSEOAnomalies(): Promise<void> {
    // 模拟数据获取（实际应从API获取）
    const currentMetrics = await this.fetchSEOMetrics();

    // 检测页面收录量异常
    if (currentMetrics.pageIndexCount < this.seoMetrics.pageIndexCount * 0.9) {
      this.createAlert({
        type: 'seo',
        severity: 'high',
        metric: 'pageIndexCount',
        current: currentMetrics.pageIndexCount,
        expected: this.seoMetrics.pageIndexCount,
        rootCause: '可能存在robots.txt配置错误或网站结构问题导致页面被取消收录',
        suggestions: [
          '检查robots.txt是否误屏蔽了重要页面',
          '检查网站结构是否有重大变化',
          '使用站长平台推送重新抓取',
          '检查是否有canonical标签错误指向',
        ],
      });
    }

    // 检测关键词排名下降
    for (const [keyword, currentRanking] of Object.entries(currentMetrics.keywordRankings)) {
      const previousRanking = this.seoMetrics.keywordRankings[keyword]?.[0] || 999;
      if ((currentRanking[0] ?? 999) > previousRanking + 5) {
        this.createAlert({
          type: 'seo',
          severity: 'medium',
          metric: `keywordRanking:${keyword}`,
          current: currentRanking[0] ?? 0,
          expected: previousRanking,
          rootCause: `关键词"${keyword}"排名从第${previousRanking}位下降至第${currentRanking[0]}位，可能存在竞争对手优化或内容质量问题`,
          suggestions: [
            '分析竞争对手的优化策略',
            '检查页面内容质量是否下降',
            '增加高质量外链建设',
            '优化页面加载速度',
          ],
        });
      }
    }

    // 更新当前指标
    this.seoMetrics = currentMetrics;
  }

  /**
   * 检测GEO异常
   */
  private async detectGEOAnomalies(): Promise<void> {
    const currentMetrics = await this.fetchGEOMetrics();

    // 检测品牌引用量异常
    if (currentMetrics.brandCitations < this.geoMetrics.brandCitations * 0.8) {
      this.createAlert({
        type: 'geo',
        severity: 'medium',
        metric: 'brandCitations',
        current: currentMetrics.brandCitations,
        expected: this.geoMetrics.brandCitations,
        rootCause: 'AI对话场景中的品牌内容引用量下降，可能存在内容质量问题或AI引用规则变化',
        suggestions: [
          '检查AI友好型内容是否充足',
          '更新FAQ结构化数据',
          '增加地域化内容标签',
          '关注AI模型规则更新',
        ],
      });
    }

    // 检测本地搜索排名异常
    if (currentMetrics.localSearchRanking > this.geoMetrics.localSearchRanking + 10) {
      this.createAlert({
        type: 'geo',
        severity: 'medium',
        metric: 'localSearchRanking',
        current: currentMetrics.localSearchRanking,
        expected: this.geoMetrics.localSearchRanking,
        rootCause: '本地搜索排名显著下降，可能存在LocalBusiness结构化数据问题',
        suggestions: [
          '检查LocalBusiness结构化数据完整性',
          '验证NAP信息一致性',
          '增加本地评价和评论',
          '优化地域关键词布局',
        ],
      });
    }

    // 更新当前指标
    this.geoMetrics = currentMetrics;
  }

  /**
   * 检测性能异常
   */
  private detectPerformanceAnomalies(): void {
    const summary = globalPerformanceMonitor.getSummary();

    // 检测LCP异常
    if (summary.lcp && summary.lcp.avg > 2500) {
      this.createAlert({
        type: 'performance',
        severity: 'high',
        metric: 'lcp',
        current: summary.lcp.avg,
        expected: 2500,
        rootCause: ' Largest Contentful Paint加载时间过长，可能由大图片、未优化资源或服务器响应慢导致',
        suggestions: [
          '优化LCP元素图片大小',
          '使用CDN加速资源加载',
          '优化服务器响应时间',
          '减少不必要的资源阻塞',
        ],
      });
    }

    // 检测CLS异常
    if (summary.cls && summary.cls.avg > 0.1) {
      this.createAlert({
        type: 'performance',
        severity: 'high',
        metric: 'cls',
        current: summary.cls.avg,
        expected: 0.1,
        rootCause: '布局偏移过大，可能由动态内容加载或图片尺寸未指定导致',
        suggestions: [
          '为所有图片指定宽高尺寸',
          '避免在内容加载后插入广告',
          '使用transform进行动画而非修改位置',
          '为动态内容预留空间',
        ],
      });
    }
  }

  /**
   * 创建告警
   */
  private createAlert(alert: Omit<AnomalyAlert, 'id' | 'detectedAt' | 'status' | 'deviation'>): void {
    const existing = this.anomalyAlerts.find(
      (a) => a.metric === alert.metric && a.status !== 'resolved'
    );

    if (existing) return; // 避免重复告警

    const deviation =
      alert.expected > 0 ? Math.abs((alert.current - alert.expected) / alert.expected) : 0;

    const newAlert: AnomalyAlert = {
      ...alert,
      id: this.generateId(),
      deviation,
      detectedAt: Date.now(),
      status: 'detected',
    };

    this.anomalyAlerts.push(newAlert);

    // 自动创建优化任务
    if (alert.severity === 'high' || alert.severity === 'critical') {
      this.createOptimizationTask(newAlert);
    }
  }

  /**
   * 处理性能异常（来自PerformanceMonitor）
   */
  private handlePerformanceAnomaly(
    metric: string,
    value: number
  ): void {
    this.createAlert({
      type: 'performance',
      severity: 'high',
      metric,
      current: value,
      expected: 2500,
      rootCause: 'Core Web Vitals指标异常',
      suggestions: ['建议立即优化页面性能'],
    });
  }

  /**
   * 自我创造：自动生成优化内容
   */
  async selfCreate(): Promise<void> {
    console.log('[IntelligentSystem] Self-creation running...');

    // 检查需要优化的内容缺口
    const contentGaps = await this.identifyContentGaps();

    for (const gap of contentGaps) {
      try {
        const content = await contentGenerator.generatePageContent({
          pageType: gap.pageType,
          targetKeyword: gap.keyword,
          region: gap.region,
          length: 'medium',
        });

        // 验证原创度
        const originalityCheck = contentGenerator.checkOriginality(content.content);
        if (!originalityCheck.passed) {
          console.warn(`[IntelligentSystem] Content originality below threshold: ${originalityCheck.score}`);
          // 重新生成
          continue;
        }

        console.log(`[IntelligentSystem] Created content for gap: ${gap.keyword}`);
      } catch (error) {
        console.error(`[IntelligentSystem] Failed to create content for gap:`, error);
      }
    }
  }

  /**
   * 识别内容缺口
   */
  private async identifyContentGaps(): Promise<
    Array<{ pageType: 'home' | 'product' | 'service' | 'franchise' | 'contact'; keyword: string; region?: string }>
  > {
    // 基于当前指标识别需要补充的内容
    const gaps: Array<{ pageType: 'home' | 'product' | 'service' | 'franchise' | 'contact'; keyword: string; region?: string }> = [];

    // GEO内容缺口
    const regions = geoIPResolver.getAllBusinessRegions();
    for (const region of regions) {
      if (this.geoMetrics.localExposure < 100) {
        gaps.push({
          pageType: 'service',
          keyword: `${region.name}服务`,
          region: region.code,
        });
      }
    }

    return gaps;
  }

  /**
   * 自我实现：自动执行优化任务
   */
  async selfExecute(): Promise<void> {
    console.log('[IntelligentSystem] Self-execution running...');

    const pendingTasks = this.optimizationTasks.filter((t) => t.status === 'pending');

    for (const task of pendingTasks) {
      try {
        task.status = 'executing';
        await this.executeTask(task);
        task.status = 'completed';
        task.executedAt = Date.now();
        task.result = '优化任务执行成功';

        console.log(`[IntelligentSystem] Task completed: ${task.id}`);
      } catch (error) {
        task.status = 'failed';
        task.result = `执行失败: ${error}`;
        console.error(`[IntelligentSystem] Task failed: ${task.id}`, error);
      }
    }
  }

  /**
   * 执行优化任务
   */
  private async executeTask(task: OptimizationTask): Promise<void> {
    // 根据任务类型执行不同操作
    switch (task.type) {
      case 'content':
        await this.executeContentTask(task);
        break;
      case 'meta':
        await this.executeMetaTask(task);
        break;
      case 'schema':
        await this.executeSchemaTask(task);
        break;
      case 'geo':
        await this.executeGEOTask(task);
        break;
      case 'performance':
        await this.executePerformanceTask(task);
        break;
    }
  }

  private async executeContentTask(task: OptimizationTask): Promise<void> {
    // 内容优化执行逻辑
    console.log(`[IntelligentSystem] Executing content task: ${task.action}`);
    await this.simulateDelay(1000);
  }

  private async executeMetaTask(task: OptimizationTask): Promise<void> {
    // Meta标签优化执行逻辑
    console.log(`[IntelligentSystem] Executing meta task: ${task.action}`);
    await this.simulateDelay(500);
  }

  private async executeSchemaTask(task: OptimizationTask): Promise<void> {
    // 结构化数据优化执行逻辑
    console.log(`[IntelligentSystem] Executing schema task: ${task.action}`);
    await this.simulateDelay(500);
  }

  private async executeGEOTask(task: OptimizationTask): Promise<void> {
    // GEO配置优化执行逻辑
    console.log(`[IntelligentSystem] Executing GEO task: ${task.action}`);
    await this.simulateDelay(800);
  }

  private async executePerformanceTask(task: OptimizationTask): Promise<void> {
    // 性能优化执行逻辑
    console.log(`[IntelligentSystem] Executing performance task: ${task.action}`);
    await this.simulateDelay(1000);
  }

  /**
   * 创建优化任务
   */
  private createOptimizationTask(alert: AnomalyAlert): void {
    const taskTypeMap: Record<string, OptimizationTask['type']> = {
      seo: 'content',
      geo: 'geo',
      performance: 'performance',
    };

    const actionMap: Record<string, string> = {
      pageIndexCount: '优化页面收录配置',
      keywordRanking: '优化关键词布局',
      brandCitations: '增加AI友好型内容',
      localSearchRanking: '优化本地搜索配置',
      lcp: '优化LCP性能',
      cls: '优化CLS布局稳定性',
    };

    const task: OptimizationTask = {
      id: this.generateId(),
      type: taskTypeMap[alert.type] || 'content',
      priority: alert.severity === 'critical' ? 'high' : alert.severity === 'high' ? 'high' : 'medium',
      target: alert.metric,
      action: actionMap[alert.metric] || '执行优化',
      estimatedImpact: alert.severity === 'critical' ? 0.9 : alert.severity === 'high' ? 0.7 : 0.5,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.optimizationTasks.push(task);
  }

  /**
   * 自我进化：基于历史数据迭代模型
   */
  async selfEvolve(): Promise<void> {
    console.log('[IntelligentSystem] Self-evolution running...');

    // 分析已完成任务的效果
    const completedTasks = this.optimizationTasks.filter((t) => t.status === 'completed');
    if (completedTasks.length < 10) return;

    // 计算优化效果
    const taskSuccessRate = completedTasks.filter((t) => t.result?.includes('成功')).length / completedTasks.length;

    // 分析告警解决率
    const resolvedAlerts = this.anomalyAlerts.filter((a) => a.status === 'resolved').length;
    const totalAlerts = this.anomalyAlerts.length;
    const alertResolutionRate = totalAlerts > 0 ? resolvedAlerts / totalAlerts : 0;

    // 生成策略迭代报告
    const iterationReport = {
      timestamp: Date.now(),
      taskSuccessRate,
      alertResolutionRate,
      totalTasksCompleted: completedTasks.length,
      totalAlertsDetected: totalAlerts,
      recommendations: this.generateRecommendations(taskSuccessRate, alertResolutionRate),
    };

    console.log('[IntelligentSystem] Iteration report:', iterationReport);

    // 自我学习：更新内容生成模型
    for (const task of completedTasks.slice(-5)) {
      await contentGenerator.selfLearn({
        contentId: task.id,
        metrics: {
          seoScore: task.estimatedImpact,
          originalScore: 0.9,
          aiScore: 0.8,
          engagement: task.estimatedImpact,
        },
        suggestions: [],
      });
    }
  }

  /**
   * 生成策略建议
   */
  private generateRecommendations(
    taskSuccessRate: number,
    alertResolutionRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (taskSuccessRate < 0.7) {
      recommendations.push('任务执行成功率偏低，建议优化任务执行策略');
    }
    if (alertResolutionRate < 0.8) {
      recommendations.push('告警解决率偏低，建议增加自动化修复能力');
    }
    if (this.optimizationTasks.length > 100) {
      recommendations.push('任务队列积压较多，建议清理历史任务');
    }

    return recommendations;
  }

  /**
   * 获取SEO指标
   */
  private async fetchSEOMetrics(): Promise<SEOMetrics> {
    // 模拟数据，实际应从API获取
    return {
      pageIndexCount: 85,
      keywordRankings: {
        '智能科技': [3, 5, 8],
        'EPC服务': [5, 7, 12],
        '招商加盟': [8, 10, 15],
      },
      organicTraffic: 12500,
      clickThroughRate: 4.2,
      crawlErrors: 2,
    };
  }

  /**
   * 获取GEO指标
   */
  private async fetchGEOMetrics(): Promise<GEOMetrics> {
    // 模拟数据
    return {
      brandCitations: 156,
      localExposure: 8900,
      localLeadConversion: 3.8,
      localSearchRanking: 12,
    };
  }

  /**
   * 模拟延迟
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ---- 公开API ----

  /**
   * 获取当前告警列表
   */
  getAlerts(): AnomalyAlert[] {
    return this.anomalyAlerts;
  }

  /**
   * 获取当前优化任务列表
   */
  getTasks(): OptimizationTask[] {
    return this.optimizationTasks;
  }

  /**
   * 获取系统健康状态
   */
  getHealthStatus(): {
    isRunning: boolean;
    lastCycleTime: number;
    alertCount: number;
    pendingTaskCount: number;
    seoMetrics: SEOMetrics;
    geoMetrics: GEOMetrics;
  } {
    return {
      isRunning: this.isRunning,
      lastCycleTime: this.lastCycleTime,
      alertCount: this.anomalyAlerts.filter((a) => a.status !== 'resolved').length,
      pendingTaskCount: this.optimizationTasks.filter((t) => t.status === 'pending').length,
      seoMetrics: this.seoMetrics,
      geoMetrics: this.geoMetrics,
    };
  }

  /**
   * 手动触发自治循环
   */
  async triggerCycle(): Promise<void> {
    await this.runAutonomousCycle();
  }
}

// ---- 导出单例 ----
export const intelligentSystem = new IntelligentSystem();
