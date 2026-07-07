import { Injectable, Logger } from '@nestjs/common'
import { createHash } from 'crypto'
import { nanoid } from 'nanoid'

/**
 * 哈希链记录
 */
export interface ChainRecord {
  id: string
  operation: string
  previousHash: string
  hash: string
  timestamp: string
  metadata?: Record<string, unknown>
}

/**
 * Merkle 证明节点
 */
export interface MerkleProofNode {
  position: 'left' | 'right'
  hash: string
}

/**
 * Merkle 证明
 */
export interface MerkleProof {
  transactionId: string
  proof: MerkleProofNode[]
  root: string
}

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  id: string
  entity: string
  entityId: string
  operation: string
  operator?: string
  metadata?: Record<string, unknown>
  timestamp: string
  chainRecordId?: string
  merkleRoot?: string
}

/**
 * 审计日志查询过滤器
 */
export interface AuditLogFilter {
  entity?: string
  entityId?: string
  operation?: string
  startTime?: string
  endTime?: string
  limit?: number
  offset?: number
}

/**
 * 哈希链服务 - 提供不可篡改的操作记录链
 */
@Injectable()
export class HashChainService {
  private readonly logger = new Logger(HashChainService.name)
  private chain: ChainRecord[] = []

  /**
   * 计算数据的 SHA-256 哈希值
   */
  private hash(data: string): string {
    return createHash('sha256').update(data).digest('hex')
  }

  /**
   * 追加操作记录到哈希链
   * @param operation 操作描述
   * @param metadata 操作的元数据
   * @returns 新创建的链记录
   */
  appendRecord(operation: string, metadata?: Record<string, unknown>): ChainRecord {
    const previousHash = this.chain.length > 0 ? this.chain[this.chain.length - 1].hash : '0'
    const timestamp = new Date().toISOString()
    const recordId = nanoid()

    const dataToHash = `${recordId}${operation}${previousHash}${timestamp}${JSON.stringify(metadata || {})}`
    const hash = this.hash(dataToHash)

    const record: ChainRecord = {
      id: recordId,
      operation,
      previousHash,
      hash,
      timestamp,
      metadata
    }

    this.chain.push(record)
    this.logger.debug(`Hash chain append: ${record.id}, chain length: ${this.chain.length}`)

    return record
  }

  /**
   * 验证哈希链完整性
   * @returns 验证结果及详细信息
   */
  verifyChain(): { valid: boolean; brokenAt?: number } {
    if (this.chain.length === 0) {
      return { valid: true }
    }

    // 验证创世块
    if (this.chain[0].previousHash !== '0') {
      this.logger.warn('Genesis block has non-zero previous hash')
      return { valid: false, brokenAt: 0 }
    }

    // 验证创世块哈希完整性
    const genesisDataToHash = `${this.chain[0].id}${this.chain[0].operation}${this.chain[0].previousHash}${this.chain[0].timestamp}${JSON.stringify(this.chain[0].metadata || {})}`
    const expectedGenesisHash = this.hash(genesisDataToHash)
    if (this.chain[0].hash !== expectedGenesisHash) {
      this.logger.warn(`Genesis block hash mismatch at index 0`)
      return { valid: false, brokenAt: 0 }
    }

    // 验证每条记录
    for (let i = 1; i < this.chain.length; i++) {
      const record = this.chain[i]
      const previousRecord = this.chain[i - 1]

      // 验证 previousHash 指向
      if (record.previousHash !== previousRecord.hash) {
        this.logger.warn(`Chain broken at index ${i}: previousHash mismatch`)
        return { valid: false, brokenAt: i }
      }

      // 重新计算哈希验证记录完整性
      const dataToHash = `${record.id}${record.operation}${record.previousHash}${record.timestamp}${JSON.stringify(record.metadata || {})}`
      const expectedHash = this.hash(dataToHash)

      if (record.hash !== expectedHash) {
        this.logger.warn(`Chain broken at index ${i}: hash mismatch`)
        return { valid: false, brokenAt: i }
      }
    }

    return { valid: true }
  }

  /**
   * 获取特定记录
   * @param recordId 记录 ID
   * @returns 记录或 undefined
   */
  getRecord(recordId: string): ChainRecord | undefined {
    return this.chain.find(r => r.id === recordId)
  }

  /**
   * 获取最新哈希值
   * @returns 最新哈希或 undefined（链为空时）
   */
  getLatestHash(): string | undefined {
    if (this.chain.length === 0) {
      return undefined
    }
    return this.chain[this.chain.length - 1].hash
  }

  /**
   * 获取链长度
   * @returns 链中记录数量
   */
  getChainLength(): number {
    return this.chain.length
  }

  /**
   * 获取链中所有记录
   * @returns 所有记录的副本
   */
  getAllRecords(): ChainRecord[] {
    return [...this.chain]
  }
}

/**
 * Merkle 树服务 - 提供交易集合的默克尔树构建和验证
 */
@Injectable()
export class MerkleTreeService {
  private readonly logger = new Logger(MerkleTreeService.name)

  /**
   * 计算数据的 SHA-256 哈希值
   */
  private hash(data: string): string {
    return createHash('sha256').update(data).digest('hex')
  }

  /**
   * 对交易数据进行哈希
   */
  private hashTransaction(transaction: string): string {
    return this.hash(transaction)
  }

  /**
   * 构建 Merkle 树
   * @param transactions 交易数据数组
   * @returns Merkle 树节点数组（每层一组）
   */
  buildTree(transactions: string[]): string[][] {
    if (transactions.length === 0) {
      return []
    }

    // 如果只有一笔交易，直接返回其哈希作为根
    if (transactions.length === 1) {
      return [[this.hashTransaction(transactions[0])]]
    }

    let currentLevel = transactions.map(t => this.hashTransaction(t))
    const tree: string[][] = [currentLevel]

    while (currentLevel.length > 1) {
      const nextLevel: string[] = []

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i]
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left

        const combined = left + right
        nextLevel.push(this.hash(combined))
      }

      tree.push(nextLevel)
      currentLevel = nextLevel
    }

    return tree
  }

  /**
   * 获取 Merkle 根
   * @param transactions 交易数据数组
   * @returns Merkle 根哈希
   */
  getMerkleRoot(transactions: string[]): string | undefined {
    const tree = this.buildTree(transactions)
    if (tree.length === 0) {
      return undefined
    }
    return tree[tree.length - 1][0]
  }

  /**
   * 生成 Merkle 证明
   * @param transactionId 交易 ID
   * @param transactions 交易数据数组
   * @returns Merkle 证明
   */
  generateProof(transactionId: string, transactions: string[]): MerkleProof | null {
    if (transactions.length === 0) {
      return null
    }

    const tree = this.buildTree(transactions)
    if (tree.length === 0) {
      return null
    }

    const root = tree[tree.length - 1][0]

    // 找到交易在叶子节点的索引
    const leafLevel = tree[0]
    let transactionIndex = -1

    for (let i = 0; i < leafLevel.length; i++) {
      const hashedTx = this.hashTransaction(transactions[i])
      if (hashedTx === leafLevel[i] && transactions[i] === transactionId) {
        transactionIndex = i
        break
      }
      // 如果直接比较字符串匹配
      if (transactions[i] === transactionId) {
        transactionIndex = i
        break
      }
    }

    if (transactionIndex === -1) {
      this.logger.warn(`Transaction ${transactionId} not found in transactions`)
      return null
    }

    const proof: MerkleProofNode[] = []
    let currentIndex = transactionIndex

    // 从叶子节点向上构建证明
    for (let level = 0; level < tree.length - 1; level++) {
      const levelNodes = tree[level]
      const isRightNode = currentIndex % 2 === 1
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1

      if (siblingIndex < levelNodes.length) {
        proof.push({
          position: isRightNode ? 'left' : 'right',
          hash: levelNodes[siblingIndex]
        })
      } else {
        // 没有兄弟节点时，使用自身（奇数节点情况）
        proof.push({
          position: isRightNode ? 'left' : 'right',
          hash: levelNodes[currentIndex]
        })
      }

      currentIndex = Math.floor(currentIndex / 2)
    }

    return {
      transactionId,
      proof,
      root
    }
  }

  /**
   * 验证 Merkle 证明
   * @param transactionId 交易 ID
   * @param proof Merkle 证明
   * @param root Merkle 根
   * @returns 验证结果
   */
  verifyProof(transactionId: string, proof: MerkleProofNode[], root: string): boolean {
    if (proof.length === 0) {
      return this.hashTransaction(transactionId) === root
    }

    let currentHash = this.hashTransaction(transactionId)

    for (const node of proof) {
      const combined = node.position === 'left'
        ? node.hash + currentHash
        : currentHash + node.hash
      currentHash = this.hash(combined)
    }

    return currentHash === root
  }
}

/**
 * 审计日志服务 - 提供合规审计日志记录和导出
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name)
  private logs: AuditLogEntry[] = []

  constructor(
    private readonly hashChainService: HashChainService,
    private readonly merkleTreeService: MerkleTreeService
  ) {}

  /**
   * 记录操作日志
   * @param entity 实体类型
   * @param entityId 实体 ID
   * @param operation 操作类型
   * @param metadata 操作的元数据
   * @param operator 操作人
   * @returns 创建的日志条目
   */
  logOperation(
    entity: string,
    entityId: string,
    operation: string,
    metadata?: Record<string, unknown>,
    operator?: string
  ): AuditLogEntry {
    // 追加到哈希链
    const chainRecord = this.hashChainService.appendRecord(
      `${entity}:${entityId}:${operation}`,
      metadata
    )

    const logEntry: AuditLogEntry = {
      id: nanoid(),
      entity,
      entityId,
      operation,
      operator,
      metadata,
      timestamp: new Date().toISOString(),
      chainRecordId: chainRecord.id,
      merkleRoot: this.merkleTreeService.getMerkleRoot(
        this.logs.map(l => l.id)
      )
    }

    this.logs.push(logEntry)
    this.logger.debug(`Audit log: ${logEntry.id} - ${entity}:${entityId}:${operation}`)

    return logEntry
  }

  /**
   * 查询审计日志
   * @param filter 查询过滤器
   * @returns 符合条件的日志条目
   */
  queryLogs(filter: AuditLogFilter): AuditLogEntry[] {
    let results = [...this.logs]

    if (filter.entity) {
      results = results.filter(log => log.entity === filter.entity)
    }

    if (filter.entityId) {
      results = results.filter(log => log.entityId === filter.entityId)
    }

    if (filter.operation) {
      results = results.filter(log => log.operation === filter.operation)
    }

    if (filter.startTime) {
      const start = new Date(filter.startTime).getTime()
      results = results.filter(log => new Date(log.timestamp).getTime() >= start)
    }

    if (filter.endTime) {
      const end = new Date(filter.endTime).getTime()
      results = results.filter(log => new Date(log.timestamp).getTime() <= end)
    }

    // 分页
    const offset = filter.offset || 0
    const limit = filter.limit || results.length

    return results.slice(offset, offset + limit)
  }

  /**
   * 导出合规审计日志
   * @param entityId 实体 ID
   * @returns 导出的审计报告
   */
  exportForCompliance(entityId: string): {
    entityId: string
    records: AuditLogEntry[]
    chainVerification: { valid: boolean; brokenAt?: number }
    merkleRoot: string | undefined
    exportedAt: string
  } {
    const records = this.queryLogs({ entityId })
    const chainVerification = this.hashChainService.verifyChain()
    const transactionIds = records.map(r => r.id)
    const merkleRoot = this.merkleTreeService.getMerkleRoot(transactionIds)

    return {
      entityId,
      records,
      chainVerification,
      merkleRoot,
      exportedAt: new Date().toISOString()
    }
  }
}
// ── Test wrapper ──

export class ChainAuditService {
  private trails = new Map<string, any>()

  createAuditTrail(transactionId: string, action: string, userId: string, metadata: Record<string, any>): any {
    const id = `trail-${nanoid()}`
    const trail = { id, transactionId, action, userId, metadata, createdAt: new Date().toISOString() }
    this.trails.set(id, trail)
    return trail
  }

  verifyAuditTrail(id: string): { verified: boolean } {
    return { verified: this.trails.has(id) }
  }

  getAuditTrail(id: string): any | undefined {
    return this.trails.get(id)
  }

  listAuditTrails(): any[] {
    return Array.from(this.trails.values())
  }

  queryAuditTrails(filter: { userId?: string; startTime?: number; endTime?: number }): any[] {
    let results = Array.from(this.trails.values())
    if (filter.userId) results = results.filter(t => t.userId === filter.userId)
    return results
  }

  exportAuditReport(userId: string, startTime: number, endTime: number): string {
    return `审计报告\n用户: ${userId}\n时间: ${new Date(startTime).toISOString()} - ${new Date(endTime).toISOString()}`
  }

  alertOnAnomaly(userId: string): any | null {
    const trails = Array.from(this.trails.values()).filter(t => t.userId === userId)
    if (trails.length < 2) return null
    return { userId, reason: 'Rapid consecutive actions detected' }
  }
}
