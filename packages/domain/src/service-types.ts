// Types used by domain service mock implementations.
// These are local contracts for mock alert/operation data — not shared @m5/types exports.

export interface FoundationAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  source: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoundationAlertFilter {
  severity?: string | string[];
  status?: string | string[];
  source?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RuntimeOperation {
  id: string;
  type: string;
  status: string;
  targetId: string;
  createdAt: string;
  finishedAt?: string;
}

export interface RuntimeReceipt {
  id: string;
  operationId: string;
  code: string;
  message: string;
  status: string;
  timestamp: string;
}
