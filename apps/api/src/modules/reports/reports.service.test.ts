import { describe, it, expect } from 'vitest'
import {
  ReportService,
  ReportAggregationService,
  ReportCacheService,
  ReportExportService,
  ReportQueryService,
} from './reports.service'

describe('reports.service barrel export', () => {
  it('should export ReportService class', () => {
    expect(ReportService).toBeDefined()
  })

  it('should export ReportAggregationService class', () => {
    expect(ReportAggregationService).toBeDefined()
  })

  it('should export ReportCacheService class', () => {
    expect(ReportCacheService).toBeDefined()
  })

  it('should export ReportExportService class', () => {
    expect(ReportExportService).toBeDefined()
  })

  it('should export ReportQueryService class', () => {
    expect(ReportQueryService).toBeDefined()
  })
})
