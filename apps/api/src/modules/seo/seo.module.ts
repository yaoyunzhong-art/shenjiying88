import { Module } from '@nestjs/common'
import { SeoController } from './seo.controller'
import { SeoService } from './seo.service'
import { GeoSearchService } from './geo-search.service'
import { StructuredDataService } from './structured-data.service'

@Module({
  controllers: [SeoController],
  providers: [SeoService, GeoSearchService, StructuredDataService],
  exports: [SeoService, GeoSearchService, StructuredDataService],
})
export class SeoModule {}
