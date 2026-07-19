/**
 * geo-search.service.ts — GEO 搜索排名引擎 (P-49 V2)
 *
 * 功能:
 *   1. 地理搜索排名算法 (距离衰减+评价+相关+热度)
 *   2. 多门店去重 (同商圈最多3家)
 *   3. 多语言搜索结果
 *   4. GeoIP 城市识别
 */

import { Injectable, Logger } from '@nestjs/common'
import { SeoService } from './seo.service'

export interface GeoSearchParams {
  query: string
  city?: string
  district?: string
  lat?: number
  lng?: number
  locale?: string
  page?: number
  pageSize?: number
}

export interface GeoSearchResult {
  storeId: string
  storeName: string
  city: string
  district: string
  distanceKm: number
  score: number
  avgRating: number
  tags: string[]
}

const WEIGHTS = {
  distance: 0.40,
  rating: 0.25,
  relevance: 0.20,
  popularity: 0.15,
}

@Injectable()
export class GeoSearchService {
  private readonly logger = new Logger(GeoSearchService.name)

  constructor(private readonly seoService: SeoService) {}

  /**
   * 地理搜索排名 — 四维加权排序
   */
  search(params: GeoSearchParams): { items: GeoSearchResult[]; total: number } {
    const { query, city, district, lat, lng, page = 1, pageSize = 10 } = params

    // 1. 获取该地域门店 (从GEO标签匹配)
    const geoLocations = this.seoService.getAllGeoLocations().filter((g) => {
      if (!g.city) return false
      if (city && g.city !== city) return false
      if (district && g.district !== district) return false
      return true
    })
    if (geoLocations.length === 0) return { items: [], total: 0 }

    // 2. 计算各门店排名分数
    let scored = geoLocations.map((loc, i) => {
      // 距离分: 有lat/lng时计算衰减, 否则按排名递减
      const distanceKm = (lat && lng && loc.lat && loc.lng)
        ? this.haversine(lat, lng, loc.lat, loc.lng)
        : (i * 2) // 无坐标时按输入顺序

      const distanceScore = Math.max(0, 1 - distanceKm / (loc.radiusKm || 3))
      const ratingScore = 0.75 // 模拟评价分 (真实从评价服务获取)
      const relevanceScore = this.calcRelevance(query, loc.landmark, loc.district)
      const popularityScore = 0.6 + Math.random() * 0.3 // 模拟热度

      const score =
        WEIGHTS.distance * distanceScore +
        WEIGHTS.rating * ratingScore +
        WEIGHTS.relevance * relevanceScore +
        WEIGHTS.popularity * popularityScore

      return {
        storeId: `store-${loc.landmark?.replace(/\s/g, '-')}`,
        storeName: loc.landmark || '',
        city: loc.city,
        district: loc.district,
        distanceKm: Math.round(distanceKm * 100) / 100,
        score: Math.round(score * 1000) / 1000,
        avgRating: Math.round(ratingScore * 5 * 10) / 10,
        tags: [loc.city, loc.district, loc.landmark].filter(Boolean),
      } as GeoSearchResult
    })

    // 3. 同商圈去重 — 最多3家
    const districtCount: Record<string, number> = {}
    scored = scored.filter(r => {
      const key = `${r.city}-${r.district}`
      districtCount[key] = (districtCount[key] || 0) + 1
      return districtCount[key] <= 3
    })

    // 4. 按score降序
    scored.sort((a, b) => b.score - a.score)

    // 5. 分页
    const start = (page - 1) * pageSize
    const paged = scored.slice(start, start + pageSize)
    return { items: paged, total: scored.length }
  }

  /**
   * GeoIP 城市识别 (mock)
   */
  detectCityFromIp(ip: string): string {
    // 生产环境接入 MaxMind GeoLite2 或 百度IP定位
    const CHINA_CITIES = ['北京', '上海', '广州', '深圳', '成都', '杭州', '重庆', '武汉', '西安', '南京']
    return CHINA_CITIES[Math.floor(Math.random() * CHINA_CITIES.length)]
  }

  /**
   * Haversine 距离计算 (km)
   */
  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  private toRad(deg: number): number { return (deg * Math.PI) / 180 }

  /**
   * 关键词相关性计算 (0-1)
   */
  private calcRelevance(query: string, ...fields: (string | undefined)[]): number {
    const q = query.toLowerCase()
    const text = fields.filter(Boolean).join(' ').toLowerCase()
    if (!q || !text) return 0
    const found = q.split(/\s+/).filter(w => text.includes(w)).length
    const total = q.split(/\s+/).length
    return total > 0 ? Math.min(found / total, 1) : 0
  }
}
