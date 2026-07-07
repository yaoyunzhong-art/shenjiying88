import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { HashChainService, MerkleTreeService, AuditLogService } from './chain-audit.service'

describe('HashChainService', () => {
  let hashChainService: HashChainService

  beforeEach(() => {
    hashChainService = new HashChainService()
  })

  describe('appendRecord', () => {
    it('should append a new record to the chain', () => {
      const record = hashChainService.appendRecord('CREATE_USER', { userId: 'u1' })
      expect(record.id).toBeDefined()
      expect(record.operation).toBe('CREATE_USER')
      expect(record.previousHash).toBe('0')
      expect(record.hash).toBeDefined()
      expect(record.timestamp).toBeDefined()
    })

    it('should correctly link to the previous record', () => {
      const first = hashChainService.appendRecord('FIRST_OP')
      const second = hashChainService.appendRecord('SECOND_OP')

      expect(second.previousHash).toBe(first.hash)
    })

    it('should increase chain length by 1 after append', () => {
      expect(hashChainService.getChainLength()).toBe(0)
      hashChainService.appendRecord('OP1')
      expect(hashChainService.getChainLength()).toBe(1)
      hashChainService.appendRecord('OP2')
      expect(hashChainService.getChainLength()).toBe(2)
    })

    it('should store metadata correctly', () => {
      const metadata = { userId: 'u1', action: 'update' }
      const record = hashChainService.appendRecord('UPDATE_USER', metadata)
      expect(record.metadata).toEqual(metadata)
    })
  })

  describe('verifyChain', () => {
    it('should return valid for an empty chain', () => {
      const result = hashChainService.verifyChain()
      expect(result.valid).toBe(true)
    })

    it('should verify chain integrity when not tampered', () => {
      hashChainService.appendRecord('OP1')
      hashChainService.appendRecord('OP2')
      hashChainService.appendRecord('OP3')

      const result = hashChainService.verifyChain()
      expect(result.valid).toBe(true)
      expect(result.brokenAt).toBeUndefined()
    })

    it('should fail verification when record is tampered', () => {
      const record = hashChainService.appendRecord('OP1')
      // Simulate tampering - modify the actual chain record
      const records = hashChainService.getAllRecords()
      records[0].operation = 'TAMPERED_OP'

      const result = hashChainService.verifyChain()
      expect(result.valid).toBe(false)
      expect(result.brokenAt).toBe(0)
    })

    it('should fail when previousHash link is broken', () => {
      hashChainService.appendRecord('OP1')
      hashChainService.appendRecord('OP2')
      // Tamper with the link - modify the actual chain record
      const records = hashChainService.getAllRecords()
      records[1].previousHash = 'invalid_hash'

      const result = hashChainService.verifyChain()
      expect(result.valid).toBe(false)
    })
  })

  describe('getRecord', () => {
    it('should retrieve a specific record by id', () => {
      const created = hashChainService.appendRecord('GET_OP')
      const retrieved = hashChainService.getRecord(created.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(created.id)
      expect(retrieved!.operation).toBe('GET_OP')
    })

    it('should return undefined for non-existent record', () => {
      const retrieved = hashChainService.getRecord('non-existent-id')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('getLatestHash', () => {
    it('should return undefined for empty chain', () => {
      expect(hashChainService.getLatestHash()).toBeUndefined()
    })

    it('should return the hash of the last record', () => {
      const first = hashChainService.appendRecord('OP1')
      const second = hashChainService.appendRecord('OP2')

      expect(hashChainService.getLatestHash()).toBe(second.hash)
    })
  })

  describe('getChainLength', () => {
    it('should return 0 for empty chain', () => {
      expect(hashChainService.getChainLength()).toBe(0)
    })

    it('should return correct length after multiple appends', () => {
      hashChainService.appendRecord('OP1')
      hashChainService.appendRecord('OP2')
      hashChainService.appendRecord('OP3')
      expect(hashChainService.getChainLength()).toBe(3)
    })
  })
})

describe('MerkleTreeService', () => {
  let merkleTreeService: MerkleTreeService

  beforeEach(() => {
    merkleTreeService = new MerkleTreeService()
  })

  describe('buildTree', () => {
    it('should return empty array for empty transactions', () => {
      const tree = merkleTreeService.buildTree([])
      expect(tree).toEqual([])
    })

    it('should return single node for single transaction', () => {
      const tree = merkleTreeService.buildTree(['tx1'])
      expect(tree.length).toBe(1)
      expect(tree[0].length).toBe(1)
    })

    it('should build correct tree for two transactions', () => {
      const tree = merkleTreeService.buildTree(['tx1', 'tx2'])
      expect(tree.length).toBe(2) // leaves + root
      expect(tree[1].length).toBe(1) // single root
    })

    it('should build correct tree for three transactions', () => {
      const tree = merkleTreeService.buildTree(['tx1', 'tx2', 'tx3'])
      expect(tree.length).toBe(3) // leaves + intermediate + root
    })
  })

  describe('getMerkleRoot', () => {
    it('should return undefined for empty transactions', () => {
      expect(merkleTreeService.getMerkleRoot([])).toBeUndefined()
    })

    it('should return correct root for single transaction', () => {
      const root = merkleTreeService.getMerkleRoot(['tx1'])
      expect(root).toBeDefined()
      expect(root).toHaveLength(64) // SHA-256 hex length
    })

    it('should return consistent root for same transactions', () => {
      const root1 = merkleTreeService.getMerkleRoot(['tx1', 'tx2'])
      const root2 = merkleTreeService.getMerkleRoot(['tx1', 'tx2'])
      expect(root1).toBe(root2)
    })

    it('should return different root for different transactions', () => {
      const root1 = merkleTreeService.getMerkleRoot(['tx1', 'tx2'])
      const root2 = merkleTreeService.getMerkleRoot(['tx1', 'tx3'])
      expect(root1).not.toBe(root2)
    })
  })

  describe('generateProof', () => {
    it('should return null for empty transactions', () => {
      const proof = merkleTreeService.generateProof('tx1', [])
      expect(proof).toBeNull()
    })

    it('should generate proof for existing transaction', () => {
      const transactions = ['tx1', 'tx2', 'tx3']
      const proof = merkleTreeService.generateProof('tx1', transactions)
      expect(proof).not.toBeNull()
      expect(proof!.transactionId).toBe('tx1')
      expect(proof!.proof).toBeDefined()
      expect(proof!.root).toBeDefined()
    })

    it('should return null for non-existent transaction', () => {
      const proof = merkleTreeService.generateProof('non-existent', ['tx1', 'tx2'])
      expect(proof).toBeNull()
    })
  })

  describe('verifyProof', () => {
    it('should verify valid proof successfully', () => {
      const transactions = ['tx1', 'tx2', 'tx3']
      const proof = merkleTreeService.generateProof('tx1', transactions)

      const isValid = merkleTreeService.verifyProof('tx1', proof!.proof, proof!.root)
      expect(isValid).toBe(true)
    })

    it('should fail verification with wrong root', () => {
      const transactions = ['tx1', 'tx2']
      const proof = merkleTreeService.generateProof('tx1', transactions)

      const isValid = merkleTreeService.verifyProof('tx1', proof!.proof, 'wrong_root')
      expect(isValid).toBe(false)
    })

    it('should fail verification with tampered proof', () => {
      const transactions = ['tx1', 'tx2']
      const proof = merkleTreeService.generateProof('tx1', transactions)

      // Tamper with proof
      proof!.proof[0].hash = 'tampered_hash'

      const isValid = merkleTreeService.verifyProof('tx1', proof!.proof, proof!.root)
      expect(isValid).toBe(false)
    })
  })
})

describe('AuditLogService', () => {
  let auditLogService: AuditLogService
  let hashChainService: HashChainService
  let merkleTreeService: MerkleTreeService

  beforeEach(() => {
    hashChainService = new HashChainService()
    merkleTreeService = new MerkleTreeService()
    auditLogService = new AuditLogService(hashChainService, merkleTreeService)
  })

  describe('logOperation', () => {
    it('should create audit log with chain record', () => {
      const log = auditLogService.logOperation('User', 'u1', 'CREATE', { name: 'John' })

      expect(log.id).toBeDefined()
      expect(log.entity).toBe('User')
      expect(log.entityId).toBe('u1')
      expect(log.operation).toBe('CREATE')
      expect(log.chainRecordId).toBeDefined()
      expect(log.timestamp).toBeDefined()
    })

    it('should store operator information', () => {
      const log = auditLogService.logOperation('User', 'u1', 'UPDATE', {}, 'admin')
      expect(log.operator).toBe('admin')
    })
  })

  describe('queryLogs', () => {
    it('should return all logs when no filter applied', () => {
      auditLogService.logOperation('User', 'u1', 'CREATE')
      auditLogService.logOperation('Order', 'o1', 'CREATE')

      const logs = auditLogService.queryLogs({})
      expect(logs.length).toBe(2)
    })

    it('should filter logs by entity', () => {
      auditLogService.logOperation('User', 'u1', 'CREATE')
      auditLogService.logOperation('Order', 'o1', 'CREATE')

      const logs = auditLogService.queryLogs({ entity: 'User' })
      expect(logs.length).toBe(1)
      expect(logs[0].entity).toBe('User')
    })

    it('should filter logs by entityId', () => {
      auditLogService.logOperation('User', 'u1', 'CREATE')
      auditLogService.logOperation('User', 'u2', 'CREATE')
      auditLogService.logOperation('Order', 'u1', 'CREATE')

      const logs = auditLogService.queryLogs({ entityId: 'u1' })
      expect(logs.length).toBe(2)
    })

    it('should support pagination with limit and offset', () => {
      for (let i = 0; i < 5; i++) {
        auditLogService.logOperation('User', `u${i}`, 'CREATE')
      }

      const logs = auditLogService.queryLogs({ limit: 2, offset: 1 })
      expect(logs.length).toBe(2)
    })
  })

  describe('exportForCompliance', () => {
    it('should export logs with chain verification', () => {
      auditLogService.logOperation('User', 'u1', 'CREATE')
      auditLogService.logOperation('User', 'u1', 'UPDATE')

      const report = auditLogService.exportForCompliance('u1')

      expect(report.entityId).toBe('u1')
      expect(report.records.length).toBe(2)
      expect(report.chainVerification.valid).toBe(true)
      expect(report.merkleRoot).toBeDefined()
      expect(report.exportedAt).toBeDefined()
    })

    it('should include merkle root in export', () => {
      auditLogService.logOperation('User', 'u1', 'CREATE')

      const report = auditLogService.exportForCompliance('u1')
      expect(report.merkleRoot).toHaveLength(64)
    })

    it('should mark chain as invalid if tampered', () => {
      const log = auditLogService.logOperation('User', 'u1', 'CREATE')
      // Tamper with the chain
      const record = hashChainService.getRecord(log.chainRecordId!)
      if (record) {
        record.operation = 'TAMPERED'
      }

      const report = auditLogService.exportForCompliance('u1')
      expect(report.chainVerification.valid).toBe(false)
    })
  })
})
