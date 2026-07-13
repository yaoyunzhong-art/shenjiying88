/**
 * 运动蚂蚁官网 - 转化服务层
 * 连接TOB官网与神机营SaaS营销中台
 * 实现线索收集 → 智能分配 → 跟进转化闭环
 */

// 转化事件类型
export type ConversionEventType =
  | 'page_view'           // 页面浏览
  | 'cta_click'          // CTA点击
  | 'form_submit'        // 表单提交
  | 'phone_click'         // 电话点击
  | 'wechat_click'        // 微信点击
  | 'product_inquiry'     // 产品咨询
  | 'franchise_apply'     // 加盟申请
  | 'epc_consult'         // EPC咨询
  | 'case_view'           // 案例查看
  | 'demo_request'        // 预约演示
  | 'resource_download';  // 资料下载

// 转化来源
export type ConversionSource = 'homepage' | 'products' | 'epc' | 'solutions' | 'franchise' | 'cases' | 'about' | 'contact' | 'pricing' | 'console' | 'resources' | 'ai' | 'ai-demo' | 'ai-empowerment' | 'help' | 'news' | 'privacy' | 'terms' | 'login' | 'register' | 'forgot-password';

// 线索优先级
export type LeadPriority = 'high' | 'medium' | 'low';

// 桑德斯三步法决策阶段
export type DecisionStage = 'pain_point' | 'value_anchor' | 'decision' | 'action';

// 转化数据接口
export interface ConversionData {
  // 事件信息
  eventType: ConversionEventType;
  eventTime: string;
  sourcePage: ConversionSource;

  // 访客信息（可选，有cookie时采集）
  visitorId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;

  // 业务信息
  cooperationType?: string;    // 合作类型
  budgetRange?: string;        // 预算范围
  timeline?: string;           // 计划时间
  location?: string;          // 所在地区

  // 联系信息
  companyName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  message?: string;

  // 优先级（系统自动判定）
  priority?: LeadPriority;

  // 其他扩展数据
  metadata?: Record<string, unknown>;
}

// 线索响应
export interface LeadResponse {
  success: boolean;
  leadId?: string;
  message?: string;
  assignedTo?: string;         // 分配给的销售
  estimatedCallbackTime?: string; // 预计回电时间
}

// 转化服务类
class ConversionService {
  private apiBaseUrl: string;
  private visitorId: string | null = null;

  constructor() {
    this.apiBaseUrl = '/api/crm';
    this.initVisitorId();
  }

  // 初始化访客ID
  private initVisitorId(): void {
    if (typeof window === 'undefined') return;

    // 尝试从localStorage获取
    let visitorId = localStorage.getItem('bigants_visitor_id');

    if (!visitorId) {
      // 生成新的访客ID
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('bigants_visitor_id', visitorId);
    }

    this.visitorId = visitorId;
  }

  // 获取归因参数
  private getAttributionParams(): {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
  } {
    if (typeof window === 'undefined') return {};

    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    };
  }

  // 发送转化数据
  private async sendConversion(data: ConversionData): Promise<void> {
    // 合并UTM参数
    const attributionParams = this.getAttributionParams();

    const payload: ConversionData = {
      ...data,
      visitorId: this.visitorId || undefined,
      eventTime: new Date().toISOString(),
      ...attributionParams,
    };

    // 发送到神机营SaaS CRM系统
    try {
      await fetch(`${this.apiBaseUrl}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('[ConversionService] Failed to send conversion:', error);
    }
  }

  // 判定线索优先级
  private determinePriority(data: Partial<ConversionData>): LeadPriority {
    // 高优先级条件
    if (data.contactPhone && data.companyName) {
      const budgetHigh = ['50万以上', '100万以上', '200万以上', '500万以上'];
      if (budgetHigh.some(b => data.budgetRange?.includes(b))) {
        return 'high';
      }
      const timelineUrgent = ['立即', '1个月内', '尽快'];
      if (timelineUrgent.some(t => data.timeline?.includes(t))) {
        return 'high';
      }
    }

    // 低优先级条件
    if (!data.contactPhone || !data.companyName) {
      return 'low';
    }

    return 'medium';
  }

  // 页面浏览事件
  async trackPageView(page: ConversionSource): Promise<void> {
    await this.sendConversion({
      eventType: 'page_view',
      sourcePage: page,
      eventTime: new Date().toISOString(),
    });
  }

  // CTA点击事件
  async trackCTAClick(page: ConversionSource, ctaType: string): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: page,
      metadata: { ctaType },
      eventTime: new Date().toISOString(),
    });
  }

  // 电话点击事件
  async trackPhoneClick(phoneNumber: string): Promise<void> {
    await this.sendConversion({
      eventType: 'phone_click',
      sourcePage: 'contact',
      metadata: { phoneNumber },
      eventTime: new Date().toISOString(),
    });

    // 触发拨打电话
    if (typeof window !== 'undefined') {
      window.location.href = `tel:${phoneNumber}`;
    }
  }

  // 微信点击事件
  async trackWechatClick(wechatId: string): Promise<void> {
    await this.sendConversion({
      eventType: 'wechat_click',
      sourcePage: 'contact',
      metadata: { wechatId },
      eventTime: new Date().toISOString(),
    });
  }

  // 表单提交（核心转化）
  async submitContactForm(formData: {
    companyName: string;
    contactPerson: string;
    phone: string;
    cooperationType: string;
    message: string;
  }): Promise<LeadResponse> {
    const conversionData: ConversionData = {
      eventType: 'form_submit',
      sourcePage: 'contact',
      companyName: formData.companyName,
      contactName: formData.contactPerson,
      contactPhone: formData.phone,
      cooperationType: formData.cooperationType,
      message: formData.message,
      priority: this.determinePriority(formData),
      eventTime: new Date().toISOString(),
    };

    await this.sendConversion(conversionData);

    return {
      success: true,
      leadId: `lead_${Date.now()}`,
      message: '表单提交成功',
      assignedTo: '商务顾问-李明',
      estimatedCallbackTime: '2小时内',
    };
  }

  // 产品询价
  async submitProductInquiry(data: {
    productName: string;
    quantity: number;
    companyName: string;
    contactName: string;
    contactPhone: string;
    message?: string;
  }): Promise<LeadResponse> {
    await this.sendConversion({
      eventType: 'product_inquiry',
      sourcePage: 'products',
      companyName: data.companyName,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      message: `产品:${data.productName}, 数量:${data.quantity}${data.message ? ', ' + data.message : ''}`,
      priority: this.determinePriority(data),
      eventTime: new Date().toISOString(),
    });

    return {
      success: true,
      leadId: `lead_${Date.now()}`,
      message: '询价提交成功',
      assignedTo: '产品顾问-张华',
      estimatedCallbackTime: '24小时内',
    };
  }

  // 加盟申请
  async submitFranchiseApplication(data: {
    companyName: string;
    contactName: string;
    contactPhone: string;
    investmentBudget: string;
    location: string;
    timeline: string;
  }): Promise<LeadResponse> {
    await this.sendConversion({
      eventType: 'franchise_apply',
      sourcePage: 'franchise',
      companyName: data.companyName,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      budgetRange: data.investmentBudget,
      location: data.location,
      timeline: data.timeline,
      priority: this.determinePriority(data),
      eventTime: new Date().toISOString(),
    });

    return {
      success: true,
      leadId: `lead_${Date.now()}`,
      message: '申请提交成功',
      assignedTo: '招商经理-王芳',
      estimatedCallbackTime: '1小时内',
    };
  }

  // EPC咨询
  async submitEPCConsult(data: {
    companyName: string;
    contactName: string;
    contactPhone: string;
    projectType: string;
    budget: string;
    area: string;
  }): Promise<LeadResponse> {
    await this.sendConversion({
      eventType: 'epc_consult',
      sourcePage: 'epc',
      companyName: data.companyName,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      message: `项目类型:${data.projectType}, 预算:${data.budget}, 面积:${data.area}`,
      priority: this.determinePriority(data),
      eventTime: new Date().toISOString(),
    });

    return {
      success: true,
      leadId: `lead_${Date.now()}`,
      message: '咨询提交成功',
      assignedTo: 'EPC项目经理-陈总',
      estimatedCallbackTime: '2小时内',
    };
  }

  // 预约考察
  async requestSiteVisit(data: {
    companyName: string;
    contactName: string;
    contactPhone: string;
    preferredDate: string;
    location: string;
    caseName?: string;  // 参考案例名称
  }): Promise<LeadResponse> {
    await this.sendConversion({
      eventType: 'demo_request',
      sourcePage: 'cases',
      companyName: data.companyName,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      message: `参考案例:${data.caseName || '未指定'}, 预约日期:${data.preferredDate}, 地点:${data.location}`,
      priority: 'high', // 预约考察都是高意向
      eventTime: new Date().toISOString(),
    });

    return {
      success: true,
      leadId: `lead_${Date.now()}`,
      message: '预约成功',
      assignedTo: '商务经理-刘洋',
      estimatedCallbackTime: '30分钟内确认',
    };
  }

  // 资料下载
  async trackResourceDownload(resourceName: string): Promise<void> {
    await this.sendConversion({
      eventType: 'resource_download',
      sourcePage: 'homepage',
      message: `下载资料:${resourceName}`,
      eventTime: new Date().toISOString(),
    });
  }

  // ========== 三步转化法追踪 ==========

  // 追踪CTA点击（三步转化法）
  async trackThreeStepCTAClick(location: string, action: string): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: location as ConversionSource,
      message: `CTA点击_${action}`,
      metadata: {
        ctaLocation: location,
        ctaAction: action,
        threeStepMethod: true,
      },
      eventTime: new Date().toISOString(),
    });
  }

  // 追踪弹窗展示
  async trackPopupShow(popupType: string): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `弹窗展示_${popupType}`,
      metadata: {
        popupType,
        intentType: 'exit_intent',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // 追踪弹窗关闭
  async trackPopupClose(popupType: string): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `弹窗关闭_${popupType}`,
      metadata: {
        popupType,
        intentType: 'exit_intent',
        action: 'closed',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // 追踪弹窗选项点击
  async trackPopupClick(popupType: string, option: string): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `弹窗选项点击_${popupType}_${option}`,
      metadata: {
        popupType,
        intentType: 'exit_intent',
        action: option,
      },
      eventTime: new Date().toISOString(),
    });
  }

  // 追踪视频播放
  async trackVideoPlay(videoId: string, position: number): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `视频播放_${videoId}_位置${position}秒`,
      metadata: {
        videoId,
        position,
      },
      eventTime: new Date().toISOString(),
    });
  }

  // 追踪视频转化卡点
  async trackVideoConversionPoint(videoId: string, pointType: string): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `视频转化卡点_${videoId}_${pointType}`,
      metadata: {
        videoId,
        pointType, // 'pain_point', 'value_anchor', 'decision'
      },
      eventTime: new Date().toISOString(),
    });
  }

  // ========== 用户人群追踪 ==========

  // 追踪用户人群标记
  async trackUserPersona(personaId: string, confidence: number): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `人群识别_${personaId}`,
      metadata: {
        personaId,
        confidence,
        action: 'persona_identified',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // 追踪人群切换
  async trackPersonaSwitch(fromPersona: string, toPersona: string): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `人群切换_${fromPersona}_to_${toPersona}`,
      metadata: {
        fromPersona,
        toPersona,
        action: 'persona_switched',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // ========== SaaS功能浏览追踪 ==========

  // 追踪SaaS功能浏览
  async trackSaaSFeatureView(featureId: string, featureName: string): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `SaaS功能浏览_${featureName}`,
      metadata: {
        featureId,
        featureName,
        action: 'saas_feature_viewed',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // 追踪SaaS功能演示申请
  async trackSaaSDemoRequest(featureId: string, featureName: string): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `SaaS演示申请_${featureName}`,
      metadata: {
        featureId,
        featureName,
        action: 'saas_demo_requested',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // ========== 决策阶段追踪 ==========

  // 追踪决策阶段变化
  async trackDecisionProgress(
    stage: DecisionStage,
    previousStage?: DecisionStage,
    context?: Record<string, unknown>
  ): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `决策阶段_${stage}`,
      metadata: {
        currentStage: stage,
        previousStage,
        stageProgress: this.getStageProgressValue(stage),
        ...context,
        action: 'decision_progress',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // 获取阶段进度值
  private getStageProgressValue(stage: DecisionStage): number {
    const stageValues: Record<DecisionStage, number> = {
      pain_point: 1,
      value_anchor: 2,
      decision: 3,
      action: 4,
    };
    return stageValues[stage] || 0;
  }

  // 追踪ROI计算器使用
  async trackROICalculatorUsage(inputData: Record<string, unknown>, result: Record<string, unknown>): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `ROI计算器使用`,
      metadata: {
        inputData,
        result,
        action: 'roi_calculated',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // 追踪解决方案匹配
  async trackSolutionMatch(personaId: string, solutionId: string, matchScore: number): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `解决方案匹配_${personaId}_${solutionId}`,
      metadata: {
        personaId,
        solutionId,
        matchScore,
        action: 'solution_matched',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // ========== 个性化推荐追踪 ==========

  // 追踪推荐内容点击
  async trackRecommendationClick(recommendationType: string, itemId: string, itemName: string): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `推荐内容点击_${itemName}`,
      metadata: {
        recommendationType,
        itemId,
        itemName,
        action: 'recommendation_clicked',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // 追踪推荐内容展示
  async trackRecommendationView(recommendationType: string, itemCount: number): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `推荐内容展示_${recommendationType}`,
      metadata: {
        recommendationType,
        itemCount,
        action: 'recommendation_viewed',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // ========== AI客服追踪 ==========

  // 追踪AI客服交互
  async trackAIChatInteraction(intent: string, isResolved: boolean, escalation?: boolean): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `AI客服交互_${intent}`,
      metadata: {
        intent,
        isResolved,
        escalation,
        action: 'ai_chat_interaction',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // 追踪AI客服意图识别
  async trackAIIntentRecognition(recognizedIntent: string, confidence: number): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'homepage',
      message: `AI意图识别_${recognizedIntent}`,
      metadata: {
        recognizedIntent,
        confidence,
        action: 'intent_recognized',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // ========== 表单预填追踪 ==========

  // 追踪表单数据预填（从解决方案/案例/产品页跳转）
  async trackFormPrefill(sourceType: string, sourceId: string, prefilledFields: string[]): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'contact',
      message: `表单预填_${sourceType}_${sourceId}`,
      metadata: {
        sourceType,
        sourceId,
        prefilledFields,
        action: 'form_prefilled',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // ========== 页面停留追踪 ==========

  // 追踪页面深度停留（用于判断决策质量）
  async trackDeepEngagement(page: ConversionSource, engagementScore: number): Promise<void> {
    await this.sendConversion({
      eventType: 'page_view',
      sourcePage: page,
      message: `深度停留_${page}_得分${engagementScore}`,
      metadata: {
        engagementScore,
        action: 'deep_engagement',
      },
      eventTime: new Date().toISOString(),
    });
  }

  // ========== 决策资源追踪 ==========

  // 追踪决策资源查看
  async trackDecisionResourceView(resourceId: string): Promise<void> {
    await this.sendConversion({
      eventType: 'cta_click',
      sourcePage: 'resources',
      message: `决策资源查看_${resourceId}`,
      metadata: {
        resourceId,
        action: 'decision_resource_viewed',
      },
      eventTime: new Date().toISOString(),
    });
  }
}

// 导出单例
export const conversionService = new ConversionService();
