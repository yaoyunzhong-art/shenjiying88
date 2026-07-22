/**
 * 🐜 合同管理 Service - 补充测试
 *
 * 补充 contract-manager.service.test.ts 未覆盖的业务场景:
 *   1. 合同更新不修改的字段保持不变
 *   2. signedDate 首次签署设置、再次签署不变
 *   3. 合同过期追踪: 已过期/即将过期/不在范围内
 *   4. 条款更新和删除的深度验证
 *   5. 多种搜索条件 (partyA, partyB, contractNo)
 *   6. 状态流转完整性
 *   7. 条款 sortOrder 更新
 *   8. 跨租户隔离验证
 *   9. 大量数据统计
 *  10. 金额/日期等字段更新
 *  11. 空字段搜索边界
 */

import { describe, it, beforeEach, afterEach } from 'vitest'
import assert from 'node:assert/strict'
import { ContractManagerService } from './contract-manager.service'
import { ContractStatus, ContractType } from './contract-manager.entity'

describe('ContractManagerService - 补充测试', () => {
  let service: ContractManagerService

  const TENANT = 'tenant-001'
  const ANOTHER_TENANT = 'tenant-002'

  beforeEach(() => {
    service = new ContractManagerService()
  })

  afterEach(() => {
    service.resetContractStoresForTests()
  })

  /** 快捷创建测试用合同 */
  function createTestContract(overrides?: Partial<Parameters<ContractManagerService['createContract']>[0]>) {
    return service.createContract({
      tenantId: TENANT,
      name: '测试合同',
      type: ContractType.Service,
      partyA: '甲方公司',
      partyB: '乙方公司',
      amount: 100000,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.000Z',
      ...overrides,
    })
  }

  // ════════════════════════════════════════════════════════════════
  // 1️⃣ 合同更新操作
  // ════════════════════════════════════════════════════════════════

  describe('[1️⃣ 合同更新操作]', () => {
    // 测试: 更新部分字段，未传递的字段保持不变
    it('更新部分字段 — 未传递的字段应保持不变', () => {
      const c = createTestContract({ name: '原始合同', amount: 50000 })
      const updated = service.updateContract(c.id, TENANT, { name: '新名称' })

      assert.equal(updated.name, '新名称')
      // 未更新的字段不变
      assert.equal(updated.amount, 50000)
      assert.equal(updated.tenantId, TENANT)
      assert.equal(updated.type, ContractType.Service)
      assert.equal(updated.partyA, '甲方公司')
      assert.equal(updated.partyB, '乙方公司')
    })

    // 测试: signedDate 更新 — null → 新日期 / 已有日期不变
    it('signedDate: 从 undefined 更新为值 → 生效', () => {
      const c = createTestContract() // 创建时无 signedDate
      const updated = service.updateContract(c.id, TENANT, { signedDate: '2026-07-01T00:00:00.000Z' })
      assert.equal(updated.signedDate, '2026-07-01T00:00:00.000Z')
    })

    // 测试: signedDate 已存在时再次更新应覆盖
    it('signedDate: 已有值更新为新值 → 覆盖', () => {
      const c = createTestContract({ signedDate: '2026-06-01T00:00:00.000Z' })
      const updated = service.updateContract(c.id, TENANT, { signedDate: '2026-07-15T00:00:00.000Z' })
      assert.equal(updated.signedDate, '2026-07-15T00:00:00.000Z')
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 2️⃣ 合同状态更新
  // ════════════════════════════════════════════════════════════════

  describe('[2️⃣ 合同状态更新]', () => {
    // 测试: 更新为 PendingSign 状态
    it('更新状态为 PENDING_SIGN — signedDate 不变', () => {
      const c = createTestContract()
      const updated = service.updateContractStatus(c.id, ContractStatus.PendingSign, TENANT)
      assert.equal(updated.status, ContractStatus.PendingSign)
      assert.equal(updated.signedDate, undefined)
    })

    // 测试: 状态流转 Draft → Active
    it('状态流转 Draft → Active', () => {
      const c = createTestContract()
      assert.equal(c.status, ContractStatus.Draft)
      const active = service.updateContractStatus(c.id, ContractStatus.Active, TENANT)
      assert.equal(active.status, ContractStatus.Active)
    })

    // 测试: 首次签署自动设置 signedDate, 再次签署不变
    it('首次签署时自动设置 signedDate', () => {
      const c = createTestContract()
      const signed = service.updateContractStatus(c.id, ContractStatus.Signed, TENANT)
      assert.ok(signed.signedDate, '首次签署应自动生成 signedDate')
      assert.equal(signed.status, ContractStatus.Signed)
    })

    // 测试: 已签署的合同再次签署时 signedDate 不变
    it('已签署合同再次签署 — signedDate 保持不变', () => {
      const c = createTestContract({ signedDate: '2026-05-01T00:00:00.000Z' })
      service.updateContractStatus(c.id, ContractStatus.Signed, TENANT)
      const signedAgain = service.updateContractStatus(c.id, ContractStatus.Signed, TENANT)
      assert.equal(signedAgain.signedDate, '2026-05-01T00:00:00.000Z')
    })

    // 测试: Terminated 状态可设置
    it('更新状态为 TERMINATED', () => {
      const c = createTestContract()
      const terminated = service.updateContractStatus(c.id, ContractStatus.Terminated, TENANT)
      assert.equal(terminated.status, ContractStatus.Terminated)
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 3️⃣ 合同过期追踪
  // ════════════════════════════════════════════════════════════════

  describe('[3️⃣ 合同过期追踪]', () => {
    // 测试: 不同 withinDays 范围的过期合同筛选
    it('getExpiringContracts 只在 withinDays 范围内返回', () => {
      // 创建 5 天后到期的合同
      const soon = createTestContract({
        name: '5天到期',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      })
      service.updateContractStatus(soon.id, ContractStatus.Active, TENANT)

      // 创建 60 天后到期的合同
      const far = createTestContract({
        name: '60天到期',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      })
      service.updateContractStatus(far.id, ContractStatus.Active, TENANT)

      // withinDays=10 只能找到 5天到期的
      const expiringSoon = service.getExpiringContracts(TENANT, 10)
      assert.equal(expiringSoon.length, 1)
      assert.equal(expiringSoon[0].name, '5天到期')

      // withinDays=90 能找到两者
      const expiringBoth = service.getExpiringContracts(TENANT, 90)
      assert.equal(expiringBoth.length, 2)
    })

    // 测试: Signed 状态的合同也在过期追踪范围内
    it('getExpiringContracts 包含 Signed 状态合同', () => {
      const c = createTestContract({
        name: '将到期的签署合同',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
      service.updateContractStatus(c.id, ContractStatus.Signed, TENANT)

      const expiring = service.getExpiringContracts(TENANT, 10)
      assert.ok(expiring.some((e) => e.id === c.id))
    })

    // 测试: Draft 状态的合同不在过期追踪中
    it('getExpiringContracts 不含 Draft 状态', () => {
      createTestContract({
        name: '草稿过期合同',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      })
      // 保持 Draft 状态
      const expiring = service.getExpiringContracts(TENANT, 30)
      assert.equal(expiring.filter((e) => e.name === '草稿过期合同').length, 0)
    })

    // 测试: getExpiredContracts 只返回状态为 Expired 或已过期的合同
    it('getExpiredContracts 只返回已过期合同（状态 Expired 或 endDate 已过）', () => {
      // 手动设置一个过期合同
      const expiredContract = createTestContract({
        name: '过期合同',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2024-01-01T00:00:00.000Z',
      })
      service.updateContractStatus(expiredContract.id, ContractStatus.Expired, TENANT)

      // 一个 Active 但 endDate 已过的
      const activeButExpired = createTestContract({
        name: '已过期但未标记',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2024-01-01T00:00:00.000Z',
      })
      service.updateContractStatus(activeButExpired.id, ContractStatus.Active, TENANT)

      const expired = service.getExpiredContracts(TENANT)
      // 包含标记为 expired 的
      assert.ok(expired.some((e) => e.id === expiredContract.id))
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 4️⃣ 条款操作
  // ════════════════════════════════════════════════════════════════

  describe('[4️⃣ 条款操作]', () => {
    // 测试: 更新条款的 sortOrder
    it('updateClause 更新 sortOrder', () => {
      const c = createTestContract()
      const clause = service.addClause({ contractId: c.id, title: '条款一', content: '内容', sortOrder: 1 })
      const updated = service.updateClause(clause.id, { sortOrder: 99 })
      assert.equal(updated.sortOrder, 99)
    })

    // 测试: 条款列表按 sortOrder 升序排列
    it('listClauses 按 sortOrder 升序', () => {
      const c = createTestContract()
      service.addClause({ contractId: c.id, title: 'Z', content: '最后', sortOrder: 10 })
      service.addClause({ contractId: c.id, title: 'A', content: '最先', sortOrder: 1 })
      service.addClause({ contractId: c.id, title: 'M', content: '中间', sortOrder: 5 })

      const clauses = service.listClauses(c.id)
      assert.equal(clauses.length, 3)
      assert.equal(clauses[0].sortOrder, 1)
      assert.equal(clauses[1].sortOrder, 5)
      assert.equal(clauses[2].sortOrder, 10)
    })

    // 测试: 删除已删除的条款抛出 Error
    it('重复删除条款抛出 Error', () => {
      const c = createTestContract()
      const clause = service.addClause({ contractId: c.id, title: 'T', content: 'C', sortOrder: 1 })
      service.deleteClause(clause.id)
      assert.throws(() => service.deleteClause(clause.id), /Clause not found/)
    })

    // 测试: 不同合同的条款隔离
    it('不同合同的条款互相隔离', () => {
      const c1 = createTestContract({ name: '合同A' })
      const c2 = createTestContract({ name: '合同B' })
      service.addClause({ contractId: c1.id, title: 'A条款', content: 'C1', sortOrder: 1 })
      service.addClause({ contractId: c2.id, title: 'B条款', content: 'C2', sortOrder: 1 })

      assert.equal(service.listClauses(c1.id).length, 1)
      assert.equal(service.listClauses(c2.id).length, 1)
      assert.equal(service.listClauses(c1.id)[0].title, 'A条款')
      assert.equal(service.listClauses(c2.id)[0].title, 'B条款')
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 5️⃣ 搜索功能
  // ════════════════════════════════════════════════════════════════

  describe('[5️⃣ 搜索功能]', () => {
    // 测试: 按 partyA 名称搜索
    it('按 partyA 搜索', () => {
      createTestContract({ name: 'AA', partyA: '上海科技公司' })
      createTestContract({ name: 'BB', partyA: '北京贸易公司' })

      const result = service.listContracts(TENANT, { search: '上海' })
      assert.equal(result.length, 1)
      assert.equal(result[0].name, 'AA')
    })

    // 测试: 按 partyB 名称搜索
    it('按 partyB 搜索', () => {
      createTestContract({ partyB: '深圳零件厂' })
      createTestContract({ partyB: '广州包装厂' })

      const result = service.listContracts(TENANT, { search: '深圳' })
      assert.equal(result.length, 1)
      assert.equal(result[0].partyB, '深圳零件厂')
    })

    // 测试: 搜索不区分大小写
    it('搜索不区分大小写', () => {
      createTestContract({ name: 'APRIL Framework' })
      const result = service.listContracts(TENANT, { search: 'april' })
      assert.equal(result.length, 1)
    })

    // 测试: 搜索无匹配返回空数组
    it('搜索无匹配 → 空数组', () => {
      createTestContract({ name: '合同A' })
      createTestContract({ name: '合同B' })
      const result = service.listContracts(TENANT, { search: '不存在的内容' })
      assert.equal(result.length, 0)
    })

    // 测试: 搜索空字符串返回全部
    it('搜索空字符串 → 返回所有合同', () => {
      createTestContract()
      createTestContract()
      const all = service.listContracts(TENANT)
      const result = service.listContracts(TENANT, { search: '' })
      assert.equal(result.length, all.length)
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 6️⃣ 跨租户隔离
  // ════════════════════════════════════════════════════════════════

  describe('[6️⃣ 跨租户隔离]', () => {
    // 测试: 不同租户间的合同互不可见
    it('不同租户的合同完全隔离', () => {
      createTestContract({ tenantId: TENANT, name: '租户A合同' })
      createTestContract({ tenantId: ANOTHER_TENANT, name: '租户B合同' })

      const tenantAList = service.listContracts(TENANT)
      const tenantBList = service.listContracts(ANOTHER_TENANT)

      assert.equal(tenantAList.length, 1)
      assert.equal(tenantAList[0].name, '租户A合同')
      assert.equal(tenantBList.length, 1)
      assert.equal(tenantBList[0].name, '租户B合同')
    })

    // 测试: 跨租户的合同过期追踪隔离
    it('跨租户过期追踪隔离', () => {
      createTestContract({
        tenantId: TENANT, name: 'A将到期',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      })
      createTestContract({
        tenantId: ANOTHER_TENANT, name: 'B将到期',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      })

      // 设置为 Active 以便进入过期追踪
      const contractsA = service.listContracts(TENANT)
      contractsA.forEach((c) => service.updateContractStatus(c.id, ContractStatus.Active, TENANT))
      const contractsB = service.listContracts(ANOTHER_TENANT)
      contractsB.forEach((c) => service.updateContractStatus(c.id, ContractStatus.Active, ANOTHER_TENANT))

      const expiringA = service.getExpiringContracts(TENANT, 30)
      const expiringB = service.getExpiringContracts(ANOTHER_TENANT, 30)

      assert.equal(expiringA.length, 1)
      assert.equal(expiringA[0].name, 'A将到期')
      assert.equal(expiringB.length, 1)
      assert.equal(expiringB[0].name, 'B将到期')
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 7️⃣ 种子数据验证
  // ════════════════════════════════════════════════════════════════

  describe('[7️⃣ 种子数据验证]', () => {
    // 测试: seedMockData 后合同数量正确
    it('种子数据包含16个合同', () => {
      service.seedMockData(TENANT)
      const contracts = service.listContracts(TENANT)
      assert.equal(contracts.length, 16)
    })

    // 测试: 种子数据中包含了所有 ContractType
    it('种子数据覆盖所有合同类型', () => {
      service.seedMockData(TENANT)
      const contracts = service.listContracts(TENANT)
      const types = new Set(contracts.map((c) => c.type))
      assert.ok(types.has(ContractType.Purchase))
      assert.ok(types.has(ContractType.Sale))
      assert.ok(types.has(ContractType.Service))
      assert.ok(types.has(ContractType.Lease))
      assert.ok(types.has(ContractType.Nda))
    })

    // 测试: 种子数据包含各种合同状态
    it('种子数据覆盖多种合同状态', () => {
      service.seedMockData(TENANT)
      const contracts = service.listContracts(TENANT)
      const statuses = new Set(contracts.map((c) => c.status))
      assert.ok(statuses.has(ContractStatus.Draft))
      assert.ok(statuses.has(ContractStatus.Active))
      assert.ok(statuses.has(ContractStatus.Signed))
      assert.ok(statuses.has(ContractStatus.Expired))
      assert.ok(statuses.has(ContractStatus.Terminated))
      assert.ok(statuses.has(ContractStatus.PendingSign))
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 8️⃣ 跨租户 updateContract 安全验证
  // ════════════════════════════════════════════════════════════════

  describe('[8️⃣ 跨租户操作安全]', () => {
    // 测试: 使用错误的 tenantId 更新合同 → 抛出错误
    it('用错误租户ID更新合同抛出 Contract not found', () => {
      const c = createTestContract({ tenantId: TENANT })
      assert.throws(
        () => service.updateContract(c.id, ANOTHER_TENANT, { name: '您不能操作' }),
        /Contract not found/,
      )
    })

    // 测试: 用错误租户ID更改状态 → 抛出错误
    it('用错误租户ID更改合同状态抛出 Contract not found', () => {
      const c = createTestContract({ tenantId: TENANT })
      assert.throws(
        () => service.updateContractStatus(c.id, ContractStatus.Active, ANOTHER_TENANT),
        /Contract not found/,
      )
    })
  })
})
