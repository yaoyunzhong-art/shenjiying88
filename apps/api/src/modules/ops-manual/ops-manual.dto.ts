/**
 * 🐜 自动: [ops-manual] [A] dto 补全
 */

import type { OpsManualRole, OpsManualExportFormat } from './ops-manual.entity';

// ── 生成手册 ──────────────────────────────────────────

export class GenerateManualDto {
  role!: OpsManualRole;
  tenantId!: string;
  exportFormat?: OpsManualExportFormat;
  generatedBy?: string;
}

// ── 手册信息查询 ──────────────────────────────────────

export class ManualInfoQueryDto {
  role!: OpsManualRole;
  tenantId?: string;
}

export class ManualInfoResponseDto {
  title!: string;
  version!: string;
  sections!: number;
  estimatedReadTime!: number;
  lastUpdated!: string;
}

// ── 手册导出 ──────────────────────────────────────────

export class ExportManualDto {
  role!: OpsManualRole;
  format!: OpsManualExportFormat;
  tenantId?: string;
}

export class ExportManualResponseDto {
  content!: string;
  format!: string;
  role!: string;
  title!: string;
}

// ── 搜索 ──────────────────────────────────────────────

export class SearchManualDto {
  role!: OpsManualRole;
  keyword!: string;
  tenantId?: string;
  searchedBy?: string;
}

export class SearchResultDto {
  sectionId!: string;
  title!: string;
  matchedContent!: string;
}

export class SearchManualResponseDto {
  results!: SearchResultDto[];
  total!: number;
  keyword!: string;
  role!: string;
}

// ── SOP 查询 ──────────────────────────────────────────

export class GetSopDto {
  role!: OpsManualRole;
  sectionId!: string;
  tenantId?: string;
}

export class SopStepDto {
  step!: number;
  action!: string;
  script!: string;
  tips?: string;
}

export class GetSopResponseDto {
  role!: string;
  sectionId!: string;
  steps!: SopStepDto[];
}

// ── 记录 CRUD ─────────────────────────────────────────

export class CreateManualRecordDto {
  tenantId!: string;
  role!: OpsManualRole;
  title!: string;
  version?: string;
  exportFormat?: OpsManualExportFormat;
  content?: string;
  totalSections?: number;
  totalPages?: number;
  estimatedReadTime?: number;
  generatedBy?: string;
}

export class ManualRecordResponseDto {
  id!: string;
  tenantId!: string;
  role!: string;
  title!: string;
  version!: string;
  exportFormat!: string;
  content?: string;
  totalSections!: number;
  totalPages!: number;
  estimatedReadTime!: number;
  generatedBy?: string;
  createdAt!: string;
  updatedAt!: string;
}

export class ManualRecordListResponseDto {
  data!: ManualRecordResponseDto[];
  total!: number;
  page!: number;
  pageSize!: number;
}

export class ManualRecordQueryDto {
  page?: number = 1;
  pageSize?: number = 10;
  tenantId?: string;
  role?: OpsManualRole;
}
