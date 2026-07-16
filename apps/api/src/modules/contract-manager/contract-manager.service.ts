import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  ContractStatus,
  ContractType,
  type Contract,
  type ContractClause,
} from './contract-manager.entity'

// ── In-memory stores ──

const contractStore = new Map<string, Contract>()
const clauseStore = new Map<string, ContractClause>()

function generateContractNo(): string {
  const prefix = 'CT'
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `${prefix}${date}${seq}`
}

@Injectable()
export class ContractManagerService {
  // ═══════════════════════════════════════════════════════════════════
  // Contract CRUD
  // ═══════════════════════════════════════════════════════════════════

  createContract(input: {
    tenantId: string
    name: string
    type: ContractType
    partyA: string
    partyB: string
    amount: number
    startDate: string
    endDate: string
    signedDate?: string
    fileName?: string
    remark?: string
  }): Contract {
    const now = new Date().toISOString()
    const contract: Contract = {
      id: `contract-${randomUUID()}`,
      contractNo: generateContractNo(),
      name: input.name,
      type: input.type,
      status: ContractStatus.Draft,
      partyA: input.partyA,
      partyB: input.partyB,
      amount: input.amount,
      startDate: input.startDate,
      endDate: input.endDate,
      signedDate: input.signedDate,
      fileName: input.fileName,
      remark: input.remark,
      tenantId: input.tenantId,
      createdAt: now,
      updatedAt: now,
    }
    contractStore.set(contract.id, contract)
    return contract
  }

  getContract(contractId: string, tenantId: string): Contract | undefined {
    const c = contractStore.get(contractId)
    if (!c || c.tenantId !== tenantId) return undefined
    return c
  }

  listContracts(
    tenantId: string,
    filters?: {
      status?: ContractStatus
      type?: ContractType
      search?: string
    },
  ): Contract[] {
    const all = Array.from(contractStore.values())
    return all.filter((c) => {
      if (c.tenantId !== tenantId) return false
      if (filters?.status && c.status !== filters.status) return false
      if (filters?.type && c.type !== filters.type) return false
      if (filters?.search) {
        const s = filters.search.toLowerCase()
        if (
          !c.name.toLowerCase().includes(s) &&
          !c.contractNo.toLowerCase().includes(s) &&
          !c.partyA.toLowerCase().includes(s) &&
          !c.partyB.toLowerCase().includes(s)
        ) {
          return false
        }
      }
      return true
    })
  }

  updateContract(
    contractId: string,
    tenantId: string,
    input: {
      name?: string
      type?: ContractType
      partyA?: string
      partyB?: string
      amount?: number
      startDate?: string
      endDate?: string
      signedDate?: string
      fileName?: string
      remark?: string
    },
  ): Contract {
    const contract = this.getContract(contractId, tenantId)
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`)
    }
    const updated: Contract = {
      ...contract,
      name: input.name ?? contract.name,
      type: input.type ?? contract.type,
      partyA: input.partyA ?? contract.partyA,
      partyB: input.partyB ?? contract.partyB,
      amount: input.amount ?? contract.amount,
      startDate: input.startDate ?? contract.startDate,
      endDate: input.endDate ?? contract.endDate,
      signedDate: input.signedDate !== undefined ? input.signedDate : contract.signedDate,
      fileName: input.fileName !== undefined ? input.fileName : contract.fileName,
      remark: input.remark !== undefined ? input.remark : contract.remark,
      updatedAt: new Date().toISOString(),
    }
    contractStore.set(contractId, updated)
    return updated
  }

  updateContractStatus(
    contractId: string,
    status: ContractStatus,
    tenantId: string,
  ): Contract {
    const contract = this.getContract(contractId, tenantId)
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`)
    }
    const now = new Date().toISOString()
    const updated: Contract = {
      ...contract,
      status,
      signedDate:
        status === ContractStatus.Signed && !contract.signedDate
          ? now
          : contract.signedDate,
      updatedAt: now,
    }
    contractStore.set(contractId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Clause CRUD
  // ═══════════════════════════════════════════════════════════════════

  addClause(input: {
    contractId: string
    title: string
    content: string
    sortOrder: number
  }): ContractClause {
    const clause: ContractClause = {
      id: `clause-${randomUUID()}`,
      contractId: input.contractId,
      title: input.title,
      content: input.content,
      sortOrder: input.sortOrder,
    }
    clauseStore.set(clause.id, clause)
    return clause
  }

  listClauses(contractId: string): ContractClause[] {
    return Array.from(clauseStore.values())
      .filter((c) => c.contractId === contractId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  updateClause(
    clauseId: string,
    input: {
      title?: string
      content?: string
      sortOrder?: number
    },
  ): ContractClause {
    const clause = clauseStore.get(clauseId)
    if (!clause) {
      throw new Error(`Clause not found: ${clauseId}`)
    }
    const updated: ContractClause = {
      ...clause,
      title: input.title ?? clause.title,
      content: input.content ?? clause.content,
      sortOrder: input.sortOrder ?? clause.sortOrder,
    }
    clauseStore.set(clauseId, updated)
    return updated
  }

  deleteClause(clauseId: string): void {
    if (!clauseStore.has(clauseId)) {
      throw new Error(`Clause not found: ${clauseId}`)
    }
    clauseStore.delete(clauseId)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Expiry Tracking
  // ═══════════════════════════════════════════════════════════════════

  getExpiringContracts(tenantId: string, withinDays: number = 30): Contract[] {
    const now = new Date()
    const deadline = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000)
    return Array.from(contractStore.values()).filter((c) => {
      if (c.tenantId !== tenantId) return false
      if (c.status !== ContractStatus.Active && c.status !== ContractStatus.Signed) return false
      const end = new Date(c.endDate)
      return end <= deadline && end >= now
    })
  }

  getExpiredContracts(tenantId: string): Contract[] {
    const now = new Date()
    return Array.from(contractStore.values()).filter((c) => {
      if (c.tenantId !== tenantId) return false
      return c.status === ContractStatus.Expired || new Date(c.endDate) < now
    })
  }

  // ═══════════════════════════════════════════════════════════════════
  // Mock Data
  // ═══════════════════════════════════════════════════════════════════

  seedMockData(tenantId: string): void {
    const mockContracts: Array<{
      name: string
      type: ContractType
      status: ContractStatus
      partyA: string
      partyB: string
      amount: number
      startDate: string
      endDate: string
      signedDate?: string
      remark?: string
      clauses: Array<{ title: string; content: string; sortOrder: number }>
    }> = [
      {
        name: '2026年度采购框架协议',
        type: ContractType.Purchase,
        status: ContractStatus.Active,
        partyA: '上海深极英科技有限公司',
        partyB: '深圳华强电子有限公司',
        amount: 5000000,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        signedDate: '2026-01-05T10:00:00.000Z',
        clauses: [
          { title: '采购范围', content: '乙方应按照甲方订单要求提供电子元器件及配件。', sortOrder: 1 },
          { title: '价格条款', content: '产品价格以双方确认的报价单为准，有效期内价格不变。', sortOrder: 2 },
          { title: '付款方式', content: '月结30天，收到发票后30个工作日内付款。', sortOrder: 3 },
          { title: '交货期限', content: '订单确认后15个工作日内完成交货。', sortOrder: 4 },
          { title: '质量保证', content: '乙方对产品提供12个月质量保证期。', sortOrder: 5 },
        ],
      },
      {
        name: '游戏设备销售合同-北京区域',
        type: ContractType.Sale,
        status: ContractStatus.Active,
        partyA: '上海深极英科技有限公司',
        partyB: '北京电玩之家商贸有限公司',
        amount: 1200000,
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-08-31T23:59:59.000Z',
        signedDate: '2026-02-28T14:00:00.000Z',
        clauses: [
          { title: '产品规格', content: '甲方按乙方订单提供指定型号的游戏设备和配件。', sortOrder: 1 },
          { title: '销售区域', content: '乙方仅限在北京市行政区域内销售甲方的产品。', sortOrder: 2 },
        ],
      },
      {
        name: '市场推广服务合同',
        type: ContractType.Service,
        status: ContractStatus.Signed,
        partyA: '上海深极英科技有限公司',
        partyB: '上海星翼传媒广告有限公司',
        amount: 800000,
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        signedDate: '2026-06-25T09:00:00.000Z',
        clauses: [
          { title: '服务内容', content: '乙方负责甲方在全国范围内的线上媒体投放和品牌推广。', sortOrder: 1 },
          { title: '服务费用', content: '总服务费80万元，分季度支付。', sortOrder: 2 },
        ],
      },
      {
        name: '办公室租赁合同-上海总部',
        type: ContractType.Lease,
        status: ContractStatus.Active,
        partyA: '上海深极英科技有限公司',
        partyB: '上海浦东发展置业有限公司',
        amount: 2400000,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        signedDate: '2024-12-15T10:00:00.000Z',
        remark: '浦东新区张江高科技园区',
        clauses: [
          { title: '租赁标的', content: '上海市浦东新区张江高科技园区博云路2号浦软大厦12层整层。', sortOrder: 1 },
          { title: '租赁期限', content: '自2025年1月1日至2026年12月31日，共计2年。', sortOrder: 2 },
          { title: '租金', content: '月租金20万元，含物业费，每季度支付。', sortOrder: 3 },
        ],
      },
      {
        name: '技术开发保密协议',
        type: ContractType.Nda,
        status: ContractStatus.Signed,
        partyA: '上海深极英科技有限公司',
        partyB: '杭州乐游信息技术有限公司',
        amount: 0,
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2028-03-31T23:59:59.000Z',
        signedDate: '2026-03-30T11:00:00.000Z',
        clauses: [
          { title: '保密信息范围', content: '双方在合作过程中接触到的所有技术资料、源代码、商业计划等。', sortOrder: 1 },
          { title: '保密期限', content: '保密义务自签署之日起持续至合同终止后3年。', sortOrder: 2 },
        ],
      },
      {
        name: '成都门店装修合同',
        type: ContractType.Service,
        status: ContractStatus.Active,
        partyA: '上海深极英科技有限公司',
        partyB: '成都匠心装饰工程有限公司',
        amount: 350000,
        startDate: '2026-05-15T00:00:00.000Z',
        endDate: '2026-07-15T23:59:59.000Z',
        signedDate: '2026-05-10T14:00:00.000Z',
        remark: '成都万象城店装修',
        clauses: [
          { title: '装修范围', content: '成都万象城5层B05铺位，面积120平方米。', sortOrder: 1 },
          { title: '工期', content: '自2026年5月15日至2026年7月15日，共计60天。', sortOrder: 2 },
        ],
      },
      {
        name: '广州仓库租赁合同',
        type: ContractType.Lease,
        status: ContractStatus.Draft,
        partyA: '上海深极英科技有限公司',
        partyB: '广州白云物流园管理有限公司',
        amount: 600000,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2027-07-31T23:59:59.000Z',
        remark: '预计8月签署',
        clauses: [],
      },
      {
        name: '深圳设备采购合同',
        type: ContractType.Purchase,
        status: ContractStatus.PendingSign,
        partyA: '上海深极英科技有限公司',
        partyB: '深圳华普电子设备有限公司',
        amount: 950000,
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-10-31T23:59:59.000Z',
        clauses: [
          { title: '采购内容', content: '采购游戏机测试设备10台，型号HP-3000。', sortOrder: 1 },
          { title: '验收标准', content: '设备到货后7个工作日内验收，验收标准见附件。', sortOrder: 2 },
        ],
      },
      {
        name: '武汉门店设备销售合同',
        type: ContractType.Sale,
        status: ContractStatus.Expired,
        partyA: '上海深极英科技有限公司',
        partyB: '武汉创享科技发展有限公司',
        amount: 450000,
        startDate: '2025-10-01T00:00:00.000Z',
        endDate: '2026-03-31T23:59:59.000Z',
        signedDate: '2025-09-28T10:00:00.000Z',
        clauses: [
          { title: '设备明细', content: '游戏主机50台、显示器50台、配套外设50套。', sortOrder: 1 },
        ],
      },
      {
        name: '南京数据中心托管合同',
        type: ContractType.Service,
        status: ContractStatus.Active,
        partyA: '上海深极英科技有限公司',
        partyB: '南京电信数据中心',
        amount: 360000,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        signedDate: '2025-12-20T15:00:00.000Z',
        clauses: [
          { title: '托管服务', content: '提供20个标准机柜托管服务，含带宽和电力保障。', sortOrder: 1 },
          { title: 'SLA', content: '服务可用性不低于99.9%，每低于0.1%减免当月费用5%。', sortOrder: 2 },
        ],
      },
      {
        name: '西安赛格店租赁合同',
        type: ContractType.Lease,
        status: ContractStatus.Terminated,
        partyA: '上海深极英科技有限公司',
        partyB: '西安赛格商业管理有限公司',
        amount: 480000,
        startDate: '2025-06-01T00:00:00.000Z',
        endDate: '2028-05-31T23:59:59.000Z',
        signedDate: '2025-05-20T10:00:00.000Z',
        remark: '提前终止',
        clauses: [
          { title: '租赁标的', content: '西安赛格国际购物中心B1层A08铺位。', sortOrder: 1 },
          { title: '提前终止条款', content: '任何一方提前3个月书面通知可提前解约。', sortOrder: 2 },
        ],
      },
      {
        name: '线上支付服务协议',
        type: ContractType.Service,
        status: ContractStatus.Active,
        partyA: '上海深极英科技有限公司',
        partyB: '支付宝（中国）网络技术有限公司',
        amount: 0,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        signedDate: '2025-12-01T09:00:00.000Z',
        clauses: [
          { title: '服务费率', content: '线上支付手续费为交易金额的0.6%。', sortOrder: 1 },
          { title: '结算周期', content: 'T+1结算，节假日顺延。', sortOrder: 2 },
        ],
      },
      {
        name: '上海门店设备租赁合同',
        type: ContractType.Lease,
        status: ContractStatus.PendingSign,
        partyA: '上海深极英科技有限公司',
        partyB: '上海智享设备租赁有限公司',
        amount: 180000,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2027-07-31T23:59:59.000Z',
        clauses: [
          { title: '租赁设备', content: 'VR体验设备20套，含安装调试。', sortOrder: 1 },
        ],
      },
      {
        name: '企业微信定制开发合同',
        type: ContractType.Service,
        status: ContractStatus.Draft,
        partyA: '上海深极英科技有限公司',
        partyB: '深圳企微云科技有限公司',
        amount: 200000,
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        clauses: [],
      },
      {
        name: '重庆区域销售代理合同',
        type: ContractType.Sale,
        status: ContractStatus.Active,
        partyA: '上海深极英科技有限公司',
        partyB: '重庆电娱无限科技有限公司',
        amount: 600000,
        startDate: '2026-02-01T00:00:00.000Z',
        endDate: '2026-07-31T23:59:59.000Z',
        signedDate: '2026-01-25T14:00:00.000Z',
        remark: '即将到期',
        clauses: [
          { title: '代理区域', content: '重庆市行政区域内的独家代理权。', sortOrder: 1 },
          { title: '销售目标', content: '半年销售目标60万元。', sortOrder: 2 },
        ],
      },
      {
        name: '杭州云服务器采购合同',
        type: ContractType.Purchase,
        status: ContractStatus.Active,
        partyA: '上海深极英科技有限公司',
        partyB: '阿里云计算有限公司',
        amount: 150000,
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2027-03-31T23:59:59.000Z',
        signedDate: '2026-03-25T10:00:00.000Z',
        clauses: [
          { title: '服务内容', content: 'ECS云服务器20台，RDS数据库5套，OSS存储1PB。', sortOrder: 1 },
          { title: '自动续费', content: '合同到期前30天自动续签，除非任一方书面通知不续签。', sortOrder: 2 },
        ],
      },
    ]

    for (const m of mockContracts) {
      const contract = this.createContract({
        tenantId,
        name: m.name,
        type: m.type,
        partyA: m.partyA,
        partyB: m.partyB,
        amount: m.amount,
        startDate: m.startDate,
        endDate: m.endDate,
        signedDate: m.signedDate,
        remark: m.remark,
      })

      contract.status = m.status
      contractStore.set(contract.id, contract)

      for (const clause of m.clauses) {
        this.addClause({
          contractId: contract.id,
          title: clause.title,
          content: clause.content,
          sortOrder: clause.sortOrder,
        })
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test Helpers
  // ═══════════════════════════════════════════════════════════════════

  resetContractStoresForTests(): void {
    contractStore.clear()
    clauseStore.clear()
  }
}
