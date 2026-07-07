/**
 * Vitest stub for the `pg` package.
 *
 * 在测试环境 (apps/api) 中, pg 实际包未被安装 (workspace pnpm 受阻).
 * 此文件被 vitest.config.ts alias 替换 `pg` import, 避免测试时抛
 * `Cannot find package 'pg'`.
 *
 * 真实部署使用真实 pg.Pool, 单元测试只需要类型占位 + 最小实现.
 */
export class Pool {
  constructor(_config: any) {}
  async query(_text: string, _params?: any[]): Promise<{ rows: any[]; rowCount: number }> {
    return { rows: [], rowCount: 0 }
  }
  async end(): Promise<void> {}
  on(_event: string, _listener: (...args: any[]) => void): this {
    return this
  }
  removeListener(_event: string, _listener: (...args: any[]) => void): this {
    return this
  }
}

export class Client {
  constructor(_config: any) {}
  async connect(): Promise<void> {}
  async query(_text: string, _params?: any[]): Promise<{ rows: any[]; rowCount: number }> {
    return { rows: [], rowCount: 0 }
  }
  async end(): Promise<void> {}
}

export default { Pool, Client }
