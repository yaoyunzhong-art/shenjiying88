/**
 * structured-data.service.ts — 结构化数据生成器 (P-49 V2)
 *
 * 为门店/活动/品牌页生成 JSON-LD 结构化数据
 * 遵循 Schema.org Place/LocalBusiness/Event/Organization
 */

import { Injectable, Logger } from '@nestjs/common'

export interface StoreForStructuredData {
  id: string
  name: string
  description: string
  city: string
  district: string
  streetAddress: string
  latitude: number
  longitude: number
  telephone: string
  openingHours: { dayOfWeek: string[]; opens: string; closes: string }[]
  avgRating: number
  ratingCount: number
  priceRange: string
  imageUrl: string
  url: string
}

export interface EventForStructuredData {
  id: string
  name: string
  description: string
  startDate: string
  endDate?: string
  location: { name: string; address: string }
  imageUrl: string
  url: string
  price?: number
  currency?: string
}

@Injectable()
export class StructuredDataService {
  private readonly logger = new Logger(StructuredDataService.name)

  /**
   * 生成门店 JSON-LD (三重类型)
   */
  generateStoreJsonLd(store: StoreForStructuredData): string {
    const sd = {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'EntertainmentBusiness'],
      '@id': `${store.url}#business`,
      name: store.name,
      description: store.description.slice(0, 160),
      url: store.url,
      telephone: store.telephone,
      image: store.imageUrl,
      address: {
        '@type': 'PostalAddress',
        streetAddress: store.streetAddress,
        addressLocality: store.city,
        addressRegion: store.district,
        addressCountry: 'CN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: store.latitude,
        longitude: store.longitude,
      },
      openingHoursSpecification: store.openingHours.map(h => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.dayOfWeek,
        opens: h.opens,
        closes: h.closes,
      })),
      aggregateRating: store.ratingCount > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: store.avgRating,
        reviewCount: store.ratingCount,
        bestRating: 5,
        worstRating: 1,
      } : undefined,
      priceRange: store.priceRange,
      sameAs: [
        `https://www.douyin.com/search/${encodeURIComponent(store.name)}`,
        `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(store.name)}`,
      ],
    }
    return JSON.stringify(sd, null, 2)
  }

  /**
   * 生成活动 JSON-LD
   */
  generateEventJsonLd(event: EventForStructuredData): string {
    const sd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      '@id': `${event.url}#event`,
      name: event.name,
      description: event.description.slice(0, 160),
      startDate: event.startDate,
      endDate: event.endDate,
      image: event.imageUrl,
      url: event.url,
      location: {
        '@type': 'Place',
        name: event.location.name,
        address: {
          '@type': 'PostalAddress',
          address: event.location.address,
          addressCountry: 'CN',
        },
      },
      offers: event.price ? {
        '@type': 'Offer',
        price: event.price,
        priceCurrency: event.currency || 'CNY',
        availability: 'https://schema.org/InStock',
      } : undefined,
    }
    return JSON.stringify(sd, null, 2)
  }

  /**
   * 生成品牌/组织 JSON-LD
   */
  generateOrganizationJsonLd(
    name: string,
    url: string,
    logo: string,
    description: string,
  ): string {
    const sd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${url}#organization`,
      name,
      url,
      logo,
      description: description.slice(0, 200),
      sameAs: [
        'https://www.douyin.com/',
        'https://www.xiaohongshu.com/',
        'https://www.dianping.com/',
      ],
    }
    return JSON.stringify(sd, null, 2)
  }

  /**
   * 全页面结构化数据 (元数据+页面类型)
   */
  generatePageStructuredData(
    path: string,
    title: string,
    description: string,
  ): string {
    const baseUrl = 'https://domain.com'
    const sd = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${baseUrl}${path}#webpage`,
      name: title,
      description: description.slice(0, 160),
      url: `${baseUrl}${path}`,
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${baseUrl}#website`,
        name: title.split('|').pop()?.trim() || '品牌',
        url: baseUrl,
      },
    }
    return JSON.stringify(sd, null, 2)
  }
}
