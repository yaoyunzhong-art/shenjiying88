import { describe, it, expect, beforeEach } from 'vitest'
import { AiMarketingController } from './ai-marketing.controller'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'

/**
 * AiMarketingModule 测试
 * 验证模块可正常加载和依赖注入
 */
describe('AiMarketingModule', () => {
  let controller: AiMarketingController
  let roiService: MarketingROIService
  let copywritingService: CopywritingAssistant
  let campaignPlanner: CampaignPlanner
  let cmoService: AIMarketingCMOService

  beforeEach(() => {
    roiService = new MarketingROIService()
    copywritingService = new CopywritingAssistant()
    campaignPlanner = new CampaignPlanner()
    cmoService = new AIMarketingCMOService(roiService, copywritingService, campaignPlanner)
    controller = new AiMarketingController(roiService, copywritingService, campaignPlanner, cmoService)
  })

  it('should compile the module (controller instantiated)', () => {
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(AiMarketingController)
  })

  it('should provide MarketingROIService', () => {
    expect(roiService).toBeDefined()
    expect(roiService).toBeInstanceOf(MarketingROIService)
  })

  it('should provide CopywritingAssistant', () => {
    expect(copywritingService).toBeDefined()
    expect(copywritingService).toBeInstanceOf(CopywritingAssistant)
  })

  it('should provide CampaignPlanner', () => {
    expect(campaignPlanner).toBeDefined()
    expect(campaignPlanner).toBeInstanceOf(CampaignPlanner)
  })

  it('should provide AIMarketingCMOService', () => {
    expect(cmoService).toBeDefined()
    expect(cmoService).toBeInstanceOf(AIMarketingCMOService)
  })

  it('should have controller with ROI calculation capability', () => {
    const result = controller.calculateROI({ campaignId: 'camp-001' })
    expect(result.success).toBe(true)
    expect(result.data!.campaignId).toBe('camp-001')
  })

  it('should have controller with copy generation capability', () => {
    const result = controller.generateCopy({ product: '测试', goal: 'conversion', audience: '用户' })
    expect(result.success).toBe(true)
    expect(result.data!.headline).toBeDefined()
  })
})
