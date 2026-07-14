import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(__dirname, '../../../../../..')

function read(filePath: string): string {
  return fs.readFileSync(path.join(ROOT, filePath), 'utf8')
}

describe('P-53 deploy/devops ringbeam', () => {
  it('AC-53-01: CI 必须对 lint/typecheck 失败敏感', () => {
    const ci = read('.github/workflows/ci.yml')
    expect(ci).toContain('name: Lint')
    expect(ci).toContain('name: TypeCheck')
    expect(ci).not.toMatch(/name:\s*Lint[\s\S]*continue-on-error:\s*true/)
    expect(ci).not.toMatch(/name:\s*TypeCheck[\s\S]*continue-on-error:\s*true/)
  })

  it('AC-53-05: 生产 docker-compose 必须是单一 volumes 顶层定义', () => {
    const compose = read('docker-compose.yml')
    const matches = compose.match(/^volumes:\s*$/gm) ?? []
    expect(matches.length).toBe(1)
  })

  it('AC-53-05: Qdrant volumes 必须收敛在主 volumes 段中', () => {
    const compose = read('docker-compose.yml')
    const volumesIdx = compose.indexOf('\nvolumes:\n')
    const servicesIdx = compose.indexOf('\nservices:\n')
    expect(volumesIdx).toBeGreaterThanOrEqual(0)
    expect(servicesIdx).toBeGreaterThan(volumesIdx)

    const volumesSection = compose.slice(volumesIdx, servicesIdx)
    expect(volumesSection).toContain('qdrant_storage:')
    expect(volumesSection).toContain('qdrant_snapshots:')
  })

  it('AC-53-04: Deploy workflow 必须包含健康失败回滚逻辑', () => {
    const deploy = read('.github/workflows/deploy.yml')
    expect(deploy).toContain('.current_version')
    expect(deploy).toContain('触发回滚')
    expect(deploy).toContain('回滚成功')
    expect(deploy).toContain("COMPOSE_FILE=docker-compose.yml")
  })

  it('AC-53-05: 生产 entrypoint 脚本必须存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'scripts/entrypoint-api.sh'))).toBe(true)
    expect(fs.existsSync(path.join(ROOT, 'scripts/entrypoint-admin.sh'))).toBe(true)
    expect(fs.existsSync(path.join(ROOT, 'scripts/entrypoint-storefront.sh'))).toBe(true)
    expect(fs.existsSync(path.join(ROOT, 'scripts/entrypoint-tob.sh'))).toBe(true)
  })
})

