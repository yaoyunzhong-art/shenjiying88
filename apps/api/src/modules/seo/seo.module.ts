import { Module } from '@nestjs/common'
import { SeoController } from './seo.controller'
import { SeoService } from './seo.service'
import { GeoSearchService } from './geo-search.service'
import { StructuredDataService } from './structured-data.service'
import { SeoHealthService } from './seo-health.service'

@Module({
  controllers: [SeoController],
  providers: [SeoService, GeoSearchService, StructuredDataService, SeoHealthService],
  exports: [SeoService, GeoSearchService, StructuredDataService, SeoHealthService],
})
export class SeoModule {}
