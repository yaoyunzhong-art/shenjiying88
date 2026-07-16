import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpendingQueryDto {
  @ApiPropertyOptional({ description: '门店ID' })
  storeId?: string;
  @ApiPropertyOptional({ description: '开始日期' })
  startDate?: string;
  @ApiPropertyOptional({ description: '结束日期' })
  endDate?: string;
  @ApiPropertyOptional({ description: '分析维度', enum: ['daily', 'weekly', 'monthly'] })
  dimension?: string;
  @ApiPropertyOptional({ description: '排序方式', enum: ['amount', 'count', 'frequency'] })
  sortBy?: string;
  @ApiProperty({ description: '分页页码', default: 1 })
  page!: number;
  @ApiProperty({ description: '每页条数', default: 20 })
  pageSize!: number;
}

export class MemberSpendingDto {
  @ApiProperty({ description: '会员ID' })
  memberId!: string;
  @ApiProperty({ description: '会员姓名' })
  memberName!: string;
  @ApiProperty({ description: '会员等级' })
  memberLevel!: string;
  @ApiProperty({ description: '总消费金额' })
  totalAmount!: number;
  @ApiProperty({ description: '消费次数' })
  totalCount!: number;
  @ApiProperty({ description: '平均客单价' })
  avgOrderAmount!: number;
  @ApiProperty({ description: '最近消费日期' })
  lastSpendDate!: string;
  @ApiProperty({ description: '消费频率(天/次)' })
  spendingFrequency!: number;
  @ApiProperty({ description: '偏好项目' })
  preferredItems!: string[];
  @ApiProperty({ description: '消费趋势' })
  spendingTrend!: number;
}

export class SpendingSummaryDto {
  @ApiProperty({ description: '总消费金额' })
  totalAmount!: number;
  @ApiProperty({ description: '总消费次数' })
  totalOrders!: number;
  @ApiProperty({ description: '活跃会员数' })
  activeMembers!: number;
  @ApiProperty({ description: '平均客单价' })
  avgOrderAmount!: number;
  @ApiProperty({ description: '同比变化' })
  yearOverYearChange!: number;
  @ApiProperty({ description: '环比变化' })
  monthOverMonthChange!: number;
}

export class SpendingListDto {
  @ApiProperty({ type: [MemberSpendingDto] })
  items!: MemberSpendingDto[];
  @ApiProperty({ description: '总条数' })
  total!: number;
  @ApiProperty({ description: '消费汇总' })
  summary!: SpendingSummaryDto;
}
