import { Injectable } from '@nestjs/common'

export interface AtomicOperationResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface TransferResult {
  fromNewBalance: number
  toNewBalance: number
}

export interface DeductResult {
  newBalance: number
  alreadyProcessed: boolean
}

export interface BatchAwardResult {
  awardedCount: number
  memberBalances: Map<string, number>
}

export interface IssuanceRule {
  singleMax: number
  dailyMax: number
  monthlyMax: number
}

export interface RedemptionRule {
  minBalance: number
  singleMax: number
}

export interface InflationParams {
  threshold: number
  warningRatio: number
}

const pointsStore = new Map<string, number>()
const deductProcessedStore = new Map<string, boolean>()
const lockStore = new Map<string, boolean>()

export function resetTestState(): void {
  pointsStore.clear()
  deductProcessedStore.clear()
  lockStore.clear()
}

@Injectable()
export class PointsAtomicService {
  private async acquireLock(key: string, timeoutMs = 5000): Promise<boolean> {
    const start = Date.now()
    while (lockStore.has(key)) {
      if (Date.now() - start > timeoutMs) return false
      await new Promise(resolve => setImmediate(resolve))
    }
    lockStore.set(key, true)
    return true
  }

  private releaseLock(key: string): void {
    lockStore.delete(key)
  }

  async incrementPointsAtomic(
    memberId: string,
    delta: number,
    reason: string
  ): Promise<AtomicOperationResult<number>> {
    const lockKey = `${memberId}`
    const acquired = await this.acquireLock(lockKey)
    if (!acquired) return { success: false, error: 'Lock acquisition timeout' }

    try {
      const currentBalance = pointsStore.get(memberId) ?? 0
      const newBalance = currentBalance + delta
      if (newBalance < 0) return { success: false, error: 'Insufficient balance' }
      pointsStore.set(memberId, newBalance)
      return { success: true, data: newBalance }
    } finally {
      this.releaseLock(lockKey)
    }
  }

  async transferPointsAtomic(
    fromMemberId: string,
    toMemberId: string,
    amount: number
  ): Promise<AtomicOperationResult<TransferResult>> {
    if (fromMemberId === toMemberId) return { success: false, error: 'Cannot transfer to self' }
    if (amount <= 0) return { success: false, error: 'Amount must be positive' }

    const [lock1, lock2] = fromMemberId < toMemberId
      ? [fromMemberId, toMemberId]
      : [toMemberId, fromMemberId]

    const acquired1 = await this.acquireLock(lock1)
    if (!acquired1) return { success: false, error: 'Lock acquisition timeout for fromMember' }
    const acquired2 = await this.acquireLock(lock2)
    if (!acquired2) {
      this.releaseLock(lock1)
      return { success: false, error: 'Lock acquisition timeout for toMember' }
    }

    try {
      const fromBalance = pointsStore.get(fromMemberId) ?? 0
      if (fromBalance < amount) return { success: false, error: 'Insufficient balance for transfer' }

      const toBalance = pointsStore.get(toMemberId) ?? 0
      pointsStore.set(fromMemberId, fromBalance - amount)
      pointsStore.set(toMemberId, toBalance + amount)
      return { success: true, data: { fromNewBalance: fromBalance - amount, toNewBalance: toBalance + amount } }
    } finally {
      this.releaseLock(lock1)
      this.releaseLock(lock2)
    }
  }

  async deductForPurchaseAtomic(
    memberId: string,
    amount: number,
    orderId: string
  ): Promise<AtomicOperationResult<DeductResult>> {
    if (amount <= 0) return { success: false, error: 'Deduction amount must be positive' }

    const lockKey = `deduct:${orderId}`
    const acquired = await this.acquireLock(lockKey)
    if (!acquired) return { success: false, error: 'Lock acquisition timeout' }

    try {
      if (deductProcessedStore.has(orderId)) {
        return { success: true, data: { newBalance: pointsStore.get(memberId) ?? 0, alreadyProcessed: true } }
      }

      const currentBalance = pointsStore.get(memberId) ?? 0
      if (currentBalance < amount) return { success: false, error: 'Insufficient balance' }

      const newBalance = currentBalance - amount
      pointsStore.set(memberId, newBalance)
      deductProcessedStore.set(orderId, true)
      return { success: true, data: { newBalance, alreadyProcessed: false } }
    } finally {
      this.releaseLock(lockKey)
    }
  }

  async batchAwardAtomic(
    memberIds: string[],
    pointsEach: number,
    reason: string
  ): Promise<AtomicOperationResult<BatchAwardResult>> {
    if (memberIds.length === 0) return { success: true, data: { awardedCount: 0, memberBalances: new Map() } }
    if (pointsEach <= 0) return { success: false, error: 'Points each must be positive' }

    const sortedIds = [...memberIds].sort()
    const locks: string[] = []
    try {
      for (const memberId of sortedIds) {
        const acquired = await this.acquireLock(memberId)
        if (!acquired) return { success: false, error: `Lock acquisition timeout for member ${memberId}` }
        locks.push(memberId)
      }

      const memberBalances = new Map<string, number>()
      for (const memberId of memberIds) {
        const currentBalance = pointsStore.get(memberId) ?? 0
        const newBalance = currentBalance + pointsEach
        pointsStore.set(memberId, newBalance)
        memberBalances.set(memberId, newBalance)
      }
      return { success: true, data: { awardedCount: memberIds.length, memberBalances } }
    } finally {
      for (const lock of locks) this.releaseLock(lock)
    }
  }

  getBalance(memberId: string): number {
    return pointsStore.get(memberId) ?? 0
  }

  isOrderProcessed(orderId: string): boolean {
    return deductProcessedStore.has(orderId)
  }
}

export class PointsConfigValidator {
  validateIssuanceRule(rule: IssuanceRule): void {
    if (rule.singleMax <= 0) throw new Error('Single issuance max must be positive')
    if (rule.dailyMax < rule.singleMax) throw new Error('Daily max must be >= single max')
    if (rule.monthlyMax < rule.dailyMax) throw new Error('Monthly max must be >= daily max')
  }

  validateRedemptionRule(rule: RedemptionRule): void {
    if (rule.minBalance < 0) throw new Error('Minimum balance cannot be negative')
    if (rule.singleMax <= 0) throw new Error('Single redemption max must be positive')
    if (rule.singleMax < rule.minBalance) throw new Error('Single max must be >= minimum balance')
  }

  validateInflationParams(params: InflationParams): void {
    if (params.threshold <= 0) throw new Error('Inflation threshold must be positive')
    if (params.warningRatio <= 0 || params.warningRatio >= 1) throw new Error('Warning ratio must be between 0 and 1')
  }
}
