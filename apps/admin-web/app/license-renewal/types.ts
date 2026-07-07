export interface RenewalStrategy {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: 'day' | 'month' | 'year';
  maxUsers: number;
  maxStores: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RenewalRecord {
  id: string;
  licenseId: string;
  licenseName: string;
  strategyId: string;
  strategyName: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  autoRenewal: boolean;
  renewedAt: string;
  expiresAt: string;
  remark?: string;
}

export interface RenewalQueryDto {
  page: number;
  pageSize: number;
  status?: string;
  licenseName?: string;
  dateRange?: [string, string];
}

export interface RenewalStatistics {
  totalStrategies: number;
  activeStrategies: number;
  totalRecords: number;
  successRate: number;
  autoRenewalEnabled: number;
}

export interface RenewalCreateDto {
  name: string;
  description?: string;
  price: number;
  duration: number;
  durationUnit: 'day' | 'month' | 'year';
  maxUsers: number;
  maxStores: number;
  features?: string[];
  isActive: boolean;
}

export interface RenewalUpdateDto extends Partial<RenewalCreateDto> {}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
