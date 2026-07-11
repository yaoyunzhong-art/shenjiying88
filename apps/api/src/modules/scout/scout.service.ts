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
}
