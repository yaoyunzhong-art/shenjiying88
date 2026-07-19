/**
 * seo.controller.ts — P-49 SEO 数据模块控制器
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { SeoService } from './seo.service'
import { ChangeFreq } from './seo.entity'

// ── Controller ──────────────────────────────────────────────────────────────

@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  // ── Metadata ──────────────────────────────────────────────────────────

  @Post('metadata')
  createMetadata(
    @Body()
    body: {
      path: string
      title: string
      description: string
      keywords?: string[]
      canonical: string
      locale?: string
      ogImage?: string
      tenantId?: string
    },
  ) {
    try {
      return this.seoService.upsertMetadata(body.path, {
        title: body.title,
        description: body.description,
        keywords: body.keywords,
        canonical: body.canonical,
        locale: body.locale,
        ogImage: body.ogImage,
        tenantId: body.tenantId,
      })
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException(
        '创建 SEO 元数据失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Put('metadata')
  upsertMetadata(
    @Body()
    body: {
      path: string
      title: string
      description: string
      keywords?: string[]
      canonical: string
      locale?: string
      ogImage?: string
      tenantId?: string
    },
  ) {
    try {
      return this.seoService.upsertMetadata(body.path, {
        title: body.title,
        description: body.description,
        keywords: body.keywords,
        canonical: body.canonical,
        locale: body.locale,
        ogImage: body.ogImage,
        tenantId: body.tenantId,
      })
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException(
        '更新 SEO 元数据失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('metadata')
  listMetadata(
    @Query('tenantId') tenantId?: string,
    @Query('locale') locale?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.seoService.listMetadata({
      tenantId,
      locale,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    })
  }

  @Get('metadata/:path')
  getMetadata(
    @Param('path') path: string,
    @Query('locale') locale?: string,
  ) {
    try {
      return this.seoService.getMetadata(path, locale)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND)
      }
      throw new HttpException(
        '获取 SEO 元数据失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Delete('metadata/:path')
  deleteMetadata(@Param('path') path: string) {
    try {
      this.seoService.deleteMetadata(path)
      return { success: true }
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND)
      }
      throw new HttpException(
        '删除 SEO 元数据失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // ── Sitemap ───────────────────────────────────────────────────────────

  @Post('sitemap')
  createSitemap(
    @Body()
    body: {
      path: string
      changefreq?: ChangeFreq
      priority?: number
      lastmod?: string
      tenantId?: string
    },
  ) {
    try {
      return this.seoService.upsertSitemap(body.path, {
        changefreq: body.changefreq,
        priority: body.priority,
        lastmod: body.lastmod,
        tenantId: body.tenantId,
      })
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException(
        '创建 Sitemap 条目失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Put('sitemap')
  upsertSitemap(
    @Body()
    body: {
      path: string
      changefreq?: ChangeFreq
      priority?: number
      lastmod?: string
      tenantId?: string
    },
  ) {
    try {
      return this.seoService.upsertSitemap(body.path, {
        changefreq: body.changefreq,
        priority: body.priority,
        lastmod: body.lastmod,
        tenantId: body.tenantId,
      })
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException(
        '更新 Sitemap 条目失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('sitemap/batch')
  batchUpsertSitemap(
    @Body()
    body: {
      entries: Array<{
        path: string
        changefreq?: ChangeFreq
        priority?: number
        lastmod?: string
        tenantId?: string
      }>
    },
  ) {
    try {
      return this.seoService.batchUpsertSitemap(body.entries)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException(
        '批量更新 Sitemap 失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('sitemap')
  getSitemapEntries(
    @Query('tenantId') tenantId?: string,
    @Query('changefreq') changefreq?: ChangeFreq,
  ) {
    return this.seoService.getSitemapEntries(tenantId, changefreq)
  }

  @Get('sitemap/:path')
  getSitemapByPath(@Param('path') path: string) {
    try {
      return this.seoService.getSitemapByPath(path)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND)
      }
      throw new HttpException(
        '获取 Sitemap 条目失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Delete('sitemap/:path')
  deleteSitemap(@Param('path') path: string) {
    try {
      this.seoService.deleteSitemap(path)
      return { success: true }
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND)
      }
      throw new HttpException(
        '删除 Sitemap 条目失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // ── GeoLocation ───────────────────────────────────────────────────────

  @Post('geo-locations')
  createGeoLocation(
    @Body()
    body: {
      city: string
      district: string
      landmark: string
      lat: number
      lng: number
      radiusKm?: number
      tenantId?: string
    },
  ) {
    try {
      return this.seoService.createGeoLocation({
        city: body.city,
        district: body.district,
        landmark: body.landmark,
        lat: body.lat,
        lng: body.lng,
        radiusKm: body.radiusKm,
        tenantId: body.tenantId,
      })
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException(
        '创建 GEO 位置失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('geo-locations')
  getAllGeoLocations(@Query('tenantId') tenantId?: string) {
    return this.seoService.getAllGeoLocations(tenantId)
  }

  @Get('geo-locations/search')
  searchGeoLocations(
    @Query('city') city: string,
    @Query('district') district: string,
    @Query('keyword') keyword?: string,
  ) {
    try {
      return this.seoService.searchGeoLocations(city, district, keyword)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException(
        '搜索 GEO 位置失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('geo-locations/:id')
  getGeoLocationById(@Param('id') id: string) {
    try {
      return this.seoService.getGeoLocationById(id)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND)
      }
      throw new HttpException(
        '获取 GEO 位置失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Delete('geo-locations/:id')
  deleteGeoLocation(@Param('id') id: string) {
    try {
      this.seoService.deleteGeoLocation(id)
      return { success: true }
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND)
      }
      throw new HttpException(
        '删除 GEO 位置失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
