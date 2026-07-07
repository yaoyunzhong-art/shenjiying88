import { Injectable } from '@nestjs/common'
import { RFMAdapter } from './datasources/rfm.adapter'
import { RFMCalculator } from './rfm-calculator'
import type {
  TenantId,
  RFMProfile,
  RFMSegmentType,
  RFMStats
} from './marketing.entity'

/**
 * Phase-42 T172: SegmentService (分群服务, 业务层封装)
 */
@Injectable()
export class SegmentService {
  constructor(
    private readonly rfmAdapter: RFMAdapter,
    private readonly rfmCalculator: RFMCalculator
  ) {}

  /**
   * 获取指定分群的所有会员
   */
  getMembersInSegment(tenantId: TenantId, segment: RFMSegmentType): RFMProfile[] {
    return this.rfmAdapter.queryBySegment(tenantId, segment)
  }

  /**
   * 跨分群会员数统计
   */
  getStats(tenantId: TenantId): RFMStats {
    return this.rfmCalculator.getStats(tenantId)
  }

  /**
   * 健康检查 (反模式 v4)
   */
  isHealthy(stats: RFMStats): boolean {
    return this.rfmCalculator.isDistributionHealthy(stats)
  }

  /**
   * 8 分群成员列表 (含名称)
   */
  listSegments(): Array<{ type: RFMSegmentType; name: string; description: string }> {
    return [
      { type: 'CHAMPIONS', name: '冠军客户', description: '高 R + 高 F + 高 M' },
      { type: 'LOYAL', name: '忠诚客户', description: '高 F + 高 M' },
      { type: 'POTENTIAL_LOYALIST', name: '潜力忠诚', description: '高 R + 中 F + 中 M' },
      { type: 'RECENT', name: '新客户', description: '高 R + 低 F + 低 M' },
      { type: 'PROMISING', name: '有潜力', description: '中 R + 低 F + 低 M' },
      { type: 'NEED_ATTENTION', name: '需关注', description: '中 R + 中 F + 中 M' },
      { type: 'AT_RISK', name: '流失风险', description: '低 R + 高 F + 高 M' },
      { type: 'HIBERNATING', name: '休眠客户', description: '低 R + 低 F + 低 M' }
    ]
  }
}