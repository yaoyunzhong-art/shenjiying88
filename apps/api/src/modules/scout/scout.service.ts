import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ScoutService {
  constructor(private prisma: PrismaService) {}

  async getCities(tier?: string) {
    const sql = `
      SELECT id, name, tier, region, priority, status, last_collected, next_collect
      FROM scout_cities
      ${tier ? 'WHERE tier = $1' : ''}
      ORDER BY priority DESC
    `
    return tier
      ? this.prisma.$queryRawUnsafe(sql, tier)
      : this.prisma.$queryRawUnsafe(sql)
  }

  async getVenues(city?: string, category?: string, limit = 50, offset = 0) {
    const conditions: string[] = []
    const params: any[] = []
    let idx = 1
    if (city) { conditions.push(`city = $${idx++}`); params.push(city) }
    if (category) { conditions.push(`category = $${idx++}`); params.push(category) }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    return this.prisma.$queryRawUnsafe(
      `SELECT * FROM venues ${where} ORDER BY rating DESC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`,
      ...params, limit, offset
    )
  }

  async getPrices(venueId: number) {
    return this.prisma.$queryRawUnsafe(
      'SELECT * FROM competitor_prices WHERE venue_id = $1 ORDER BY captured_at DESC', venueId
    )
  }

  async getDevices(venueId: number) {
    return this.prisma.$queryRawUnsafe(
      'SELECT * FROM competitor_devices WHERE venue_id = $1', venueId
    )
  }

  async getMembership(venueId: number) {
    return this.prisma.$queryRawUnsafe(
      'SELECT * FROM competitor_membership WHERE venue_id = $1', venueId
    )
  }

  async getReviews(venueId: number, sentiment?: string) {
    const sql = sentiment
      ? 'SELECT * FROM competitor_reviews WHERE venue_id = $1 AND sentiment = $2 ORDER BY posted_at DESC'
      : 'SELECT * FROM competitor_reviews WHERE venue_id = $1 ORDER BY posted_at DESC'
    return sentiment
      ? this.prisma.$queryRawUnsafe(sql, venueId, sentiment)
      : this.prisma.$queryRawUnsafe(sql, venueId)
  }

  async getActivities(venueId: number) {
    return this.prisma.$queryRawUnsafe(
      'SELECT * FROM competitor_activities WHERE venue_id = $1 ORDER BY start_date DESC', venueId
    )
  }

  async getCollectionLogs(cityId?: string, limit = 20) {
    const sql = cityId
      ? 'SELECT * FROM scout_collection_logs WHERE city_id = $1 ORDER BY created_at DESC LIMIT $2'
      : 'SELECT * FROM scout_collection_logs ORDER BY created_at DESC LIMIT $1'
    return cityId
      ? this.prisma.$queryRawUnsafe(sql, cityId, limit)
      : this.prisma.$queryRawUnsafe(sql, limit)
  }

  /** 按场馆名搜索 */
  async searchVenues(query: string, limit = 20) {
    return this.prisma.$queryRawUnsafe(
      `SELECT * FROM venues WHERE name ILIKE $1 ORDER BY rating DESC NULLS LAST LIMIT $2`,
      `%${query}%`, limit
    )
  }

  /** 竞品对比分析: 给定场馆ID列表, 返回价格/设备/会员对比 */
  async compareVenues(venueIds: number[]) {
    if (!venueIds.length) return { prices: [], devices: [], memberships: [], summary: null }
    const placeholders = venueIds.map((_, i) => `$${i + 1}`).join(',')
    const [prices, devices, memberships] = await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT venue_id, item_name, price, captured_at FROM competitor_prices WHERE venue_id IN (${placeholders}) ORDER BY venue_id, captured_at DESC`,
        ...venueIds
      ),
      this.prisma.$queryRawUnsafe(
        `SELECT venue_id, device_name, quantity, status FROM competitor_devices WHERE venue_id IN (${placeholders})`,
        ...venueIds
      ),
      this.prisma.$queryRawUnsafe(
        `SELECT venue_id, tier_name, price, benefits FROM competitor_membership WHERE venue_id IN (${placeholders})`,
        ...venueIds
      ),
    ])
    const summary = {
      totalVenues: venueIds.length,
      avgPriceItems: Array.isArray(prices) ? Math.round((prices as any[]).length / venueIds.length) : 0,
      avgDevices: Array.isArray(devices) ? Math.round((devices as any[]).length / venueIds.length) : 0,
    }
    return { prices, devices, memberships, summary }
  }

  /** 对比统计摘要 */
  async getComparisonSummary(venueIds: number[]) {
    const { summary } = await this.compareVenues(venueIds)
    return summary
  }

  /** 批量场馆数据快照 */
  async batchSnapshot(city: string) {
    const venues = await this.getVenues(city)
    const venueIds = (venues as any[])?.map(v => v.id).filter(Boolean) as number[] ?? []
    return this.compareVenues(venueIds)
  }

  /** 按区域聚合统计 */
  async getRegionStats() {
    return this.prisma.$queryRawUnsafe(
      `SELECT region, COUNT(*) as venue_count, AVG(rating) as avg_rating
       FROM scout_cities GROUP BY region ORDER BY venue_count DESC`
    )
  }

  /** 数据采集进度 */
  async getCollectionProgress() {
    return this.prisma.$queryRawUnsafe(
      `SELECT status, COUNT(*) as count FROM scout_cities GROUP BY status`
    )
  }

  /** 最近更新场馆 */
  async getRecentUpdated(limit = 10) {
    return this.prisma.$queryRawUnsafe(
      `SELECT v.*, c.name as city_name
       FROM venues v JOIN scout_cities c ON v.city = c.name
       ORDER BY v.updated_at DESC NULLS LAST LIMIT $1`, limit
    )
  }
}
