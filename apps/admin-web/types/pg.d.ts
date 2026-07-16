declare module 'pg' {
  export class Pool {
    constructor(config?: Record<string, unknown>);
    connect(): Promise<PoolClient>;
    query(text: string, params?: unknown[]): Promise<QueryResult>;
    end(): Promise<void>;
  }
  export class PoolClient {
    query(text: string, params?: unknown[]): Promise<QueryResult>;
    release(): void;
  }
  export interface QueryResult {
    rows: Record<string, unknown>[];
    rowCount: number;
  }
}
