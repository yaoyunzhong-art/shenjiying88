import type {
  ApiResponse,
  PaginatedResponse,
  RenewalCreateDto,
  RenewalRecord,
  RenewalStrategy,
  RenewalUpdateDto,
} from './types';

const BASE_PATH = '/api/license-renewal';

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      return { success: false, data: null as unknown as T, error: `HTTP ${res.status}` };
    }
    return res.json();
  } catch {
    return { success: false, data: null as unknown as T, error: 'Network error' };
  }
}

export const renewalApi = {
  /** Get all renewal strategies */
  getStrategies: async (): Promise<ApiResponse<RenewalStrategy[]>> => {
    return request<RenewalStrategy[]>(BASE_PATH);
  },

  /** Get a single strategy by id */
  getStrategyById: async (id: string): Promise<ApiResponse<RenewalStrategy>> => {
    return request<RenewalStrategy>(`${BASE_PATH}/${id}`);
  },

  /** Create a new strategy */
  createStrategy: async (data: RenewalCreateDto): Promise<ApiResponse<RenewalStrategy>> => {
    return request<RenewalStrategy>(BASE_PATH, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Update an existing strategy */
  updateStrategy: async (id: string, data: RenewalUpdateDto): Promise<ApiResponse<RenewalStrategy>> => {
    return request<RenewalStrategy>(`${BASE_PATH}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /** Delete a strategy */
  deleteStrategy: async (id: string): Promise<ApiResponse<void>> => {
    return request<void>(`${BASE_PATH}/${id}`, { method: 'DELETE' });
  },

  /** Query renewal records */
  getRecords: async (query: {
    page: number;
    pageSize: number;
    status?: string;
    licenseName?: string;
    dateRange?: [string, string];
  }): Promise<ApiResponse<PaginatedResponse<RenewalRecord>>> => {
    const params = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
    });
    if (query.status) params.set('status', query.status);
    if (query.licenseName) params.set('licenseName', query.licenseName);
    if (query.dateRange) {
      params.set('startDate', query.dateRange[0]);
      params.set('endDate', query.dateRange[1]);
    }
    return request<PaginatedResponse<RenewalRecord>>(`${BASE_PATH}/records?${params.toString()}`);
  },

  /** Toggle auto-renewal for a license */
  toggleAutoRenewal: async (licenseId: string, enabled: boolean): Promise<ApiResponse<void>> => {
    return request<void>(`${BASE_PATH}/auto-renewal/${licenseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  },
};
