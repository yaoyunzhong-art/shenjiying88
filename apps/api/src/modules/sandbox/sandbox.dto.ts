// sandbox.dto.ts - T116-2
// 沙箱模块 DTO 定义

import type {
  CodeLanguage,
  AppCategory,
  SDKLanguage,
} from './sandbox-isv.service';

// ── Sandbox DTOs ──────────────────────────────────────────────────────────────

export class CreateSandboxDto {
  /** 应用 ID */
  appId!: string;
  /** 开发者 ID */
  developerId!: string;
}

export class ExecuteCodeDto {
  /** 要执行的代码 */
  code!: string;
  /** 代码语言 */
  language!: CodeLanguage;
}

export class SandboxResponseDto {
  id!: string;
  appId!: string;
  developerId!: string;
  status!: string;
  language!: string;
  createdAt!: string;
  lastActiveAt!: string;
  resources!: {
    cpu: number;
    memory: number;
    disk: number;
  };
  snapshot?: string;
}

export class CodeExecutionResponseDto {
  success!: boolean;
  output!: string;
  error?: string;
  executionTimeMs!: number;
  memoryUsedMB!: number;
}

// ── ISV App Store DTOs ────────────────────────────────────────────────────────

export class PublishAppDto {
  name!: string;
  description!: string;
  developerId!: string;
  category!: AppCategory;
  version!: string;
  tags?: string[];
  screenshots?: string[];
  price!: number;
  isFree!: boolean;
}

export class InstallAppDto {
  tenantId!: string;
}

export class RateAppDto {
  rating!: number;
}

export class AppFilterDto {
  category?: AppCategory;
  status?: string;
  developerId?: string;
  keyword?: string;
}

export class AppResponseDto {
  id!: string;
  name!: string;
  description!: string;
  developerId!: string;
  category!: string;
  status!: string;
  version!: string;
  rating!: number;
  ratingCount!: number;
  installCount!: number;
  publishedAt?: string;
  createdAt!: string;
  updatedAt!: string;
  tags!: string[];
  screenshots!: string[];
  price!: number;
  isFree!: boolean;
}

export class AppInstallResponseDto {
  id!: string;
  appId!: string;
  tenantId!: string;
  installedAt!: string;
  status!: string;
}

// ── SDK DTOs ──────────────────────────────────────────────────────────────────

export class GenerateSDKDto {
  language!: SDKLanguage;
}

export class SDKResponseDto {
  language!: string;
  version!: string;
  downloadURL!: string;
  size!: number;
  checksum!: string;
  generatedAt!: string;
}
