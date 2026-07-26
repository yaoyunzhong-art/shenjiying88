import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { SeoController } from './seo.controller'

describe('SeoController metadata', () => {
  it('controller should keep seo path', () => {
    assert.equal(Reflect.getMetadata('path', SeoController), 'seo')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [SeoController.prototype.upsertMetadata, 2, 'metadata'],
      [SeoController.prototype.getMetadata, 0, 'metadata/:path'],
      [SeoController.prototype.deleteMetadata, 3, 'metadata/:path'],
      [SeoController.prototype.listMetadata, 0, 'metadata'],
      [SeoController.prototype.createSitemap, 1, 'sitemap'],
      [SeoController.prototype.listSitemap, 0, 'sitemap'],
      [SeoController.prototype.getSitemapByPath, 0, 'sitemap/:path'],
      [SeoController.prototype.batchSitemap, 1, 'sitemap/batch'],
      [SeoController.prototype.createGeoLocation, 1, 'geo-locations'],
      [SeoController.prototype.listGeoLocations, 0, 'geo-locations'],
      [SeoController.prototype.searchGeoLocations, 0, 'geo-locations/search'],
      [SeoController.prototype.generateStructuredData, 1, 'generate-structured-data/:path'],
      [SeoController.prototype.geoSearch, 1, 'geo-search'],
      [SeoController.prototype.getHealth, 0, 'health'],
      [SeoController.prototype.getStats, 0, 'stats'],
      [SeoController.prototype.scorePage, 0, 'score-page'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
