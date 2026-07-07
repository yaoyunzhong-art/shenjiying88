import { randomUUID } from 'node:crypto'
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'

/**
 * T110-1 Inventory Product Center
 *
 * P0-5 Redis Lua 原子操作说明:
 * - SKUService.reserveSKU 使用内存锁模拟 Redis Lua 原子操作
 * - 锁 key: `lock:sku:{skuId}`, ttl 30s, 原子执行 "检查可用 → 扣减可用 → 增加预留"
 * - 实际生产应替换为 Redis SETNX + Lua Script
 *
 * 核心机制:
 * - ProductService: 商品维度管理 (含 LYT 关联)
 * - SKUService: SKU 变体维度管理 (颜色/尺码/规格)
 * - availableQty = totalQty - reservedQty
 * - 跨租户防御: 所有操作校验 tenantId
 */

export interface Product {
  id: string
  tenantId: string
  brandId: string
  storeId: string
  name: string
  sku: string
  category: string
  price: number
  cost: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  lytProductId?: string
  createdAt: string
  updatedAt: string
}

export interface SKU {
  id: string
  tenantId: string
  productId: string
  sku: string
  variantName: string
  attributes: Record<string, string>
  totalQty: number
  reservedQty: number
  availableQty: number
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateProductParams {
  name: string
  sku: string
  category: string
  price: number
  cost: number
  lytProductId?: string
}

export interface UpdateProductParams {
  name?: string
  sku?: string
  category?: string
  price?: number
  cost?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
}

export interface ProductFilter {
  category?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  keyword?: string
  limit?: number
  offset?: number
}

export interface SKUVariant {
  color?: string
  size?: string
  spec?: string
}

export interface CreateSKUParams {
  productId: string
  variants: SKUVariant[]
  initialQty?: number
}

export interface ReserveParams {
  skuId: string
  orderId: string
  quantity: number
  ttlSeconds?: number
}

// In-memory stores
const productStore = new Map<string, Product>()
const skuStore = new Map<string, SKU>()
const skuIndex = new Map<string, string>() // `${tenantId}:${sku}` → skuId
const lytLinks = new Map<string, string>() // `productId` → `lytProductId`

// Redis Lua 原子锁模拟 (P0-5)
const lockStore = new Map<string, { owner: string; expiresAt: number }>()

function acquireLock(key: string, owner: string, ttlMs: number = 30000): boolean {
  const now = Date.now()
  const existing = lockStore.get(key)
  if (existing && existing.expiresAt > now && existing.owner !== owner) {
    return false // 已被占用
  }
  lockStore.set(key, { owner, expiresAt: now + ttlMs })
  return true
}

function releaseLock(key: string, owner: string): void {
  const existing = lockStore.get(key)
  if (existing && existing.owner === owner) {
    lockStore.delete(key)
  }
}

function cleanExpiredLocks(): void {
  const now = Date.now()
  for (const [key, val] of lockStore.entries()) {
    if (val.expiresAt <= now) {
      lockStore.delete(key)
    }
  }
}

// ============================================================
// ProductService
// ============================================================

@Injectable()
export class ProductService {
  createProduct(tenantId: string, brandId: string, storeId: string, params: CreateProductParams): Product {
    const now = new Date().toISOString()

    // 检查 SKU 唯一性
    for (const p of productStore.values()) {
      if (p.tenantId === tenantId && p.sku === params.sku) {
        throw new ConflictException(`SKU ${params.sku} already exists`)
      }
    }

    const product: Product = {
      id: `prod-${randomUUID()}`,
      tenantId,
      brandId,
      storeId,
      name: params.name,
      sku: params.sku,
      category: params.category,
      price: params.price,
      cost: params.cost,
      status: 'ACTIVE',
      lytProductId: params.lytProductId,
      createdAt: now,
      updatedAt: now
    }

    productStore.set(product.id, product)

    if (params.lytProductId) {
      lytLinks.set(product.id, params.lytProductId)
    }

    return { ...product }
  }

  updateProduct(productId: string, tenantId: string, params: UpdateProductParams): Product {
    const product = this.requireProduct(productId, tenantId)

    // 检查新 SKU 是否与其他商品冲突
    if (params.sku && params.sku !== product.sku) {
      for (const p of productStore.values()) {
        if (p.tenantId === tenantId && p.id !== productId && p.sku === params.sku) {
          throw new ConflictException(`SKU ${params.sku} already exists`)
        }
      }
    }

    const now = new Date().toISOString()
    const updated: Product = {
      ...product,
      name: params.name ?? product.name,
      sku: params.sku ?? product.sku,
      category: params.category ?? product.category,
      price: params.price ?? product.price,
      cost: params.cost ?? product.cost,
      status: params.status ?? product.status,
      updatedAt: now
    }

    productStore.set(productId, updated)
    return { ...updated }
  }

  getProduct(productId: string, tenantId: string): Product {
    return this.requireProduct(productId, tenantId)
  }

  listProducts(tenantId: string, filter?: ProductFilter): Product[] {
    let products = Array.from(productStore.values())
      .filter((p) => p.tenantId === tenantId)

    if (filter?.category) {
      products = products.filter((p) => p.category === filter.category)
    }
    if (filter?.status) {
      products = products.filter((p) => p.status === filter.status)
    }
    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase()
      products = products.filter(
        (p) => p.name.toLowerCase().includes(kw) || p.sku.toLowerCase().includes(kw)
      )
    }

    products.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    const offset = filter?.offset ?? 0
    const limit = filter?.limit ?? 50
    return products.slice(offset, offset + limit).map((p) => ({ ...p }))
  }

  linkLytProduct(productId: string, lytProductId: string, tenantId: string): void {
    this.requireProduct(productId, tenantId)
    lytLinks.set(productId, lytProductId)
  }

  getLytLink(productId: string, tenantId: string): string | null {
    this.requireProduct(productId, tenantId)
    return lytLinks.get(productId) ?? null
  }

  private requireProduct(productId: string, tenantId: string): Product {
    const product = productStore.get(productId)
    if (!product || product.tenantId !== tenantId) {
      throw new NotFoundException(`Product ${productId} not found`)
    }
    return product
  }

  /** 测试用重置 */
  reset(): void {
    productStore.clear()
    skuStore.clear()
    skuIndex.clear()
    lytLinks.clear()
    lockStore.clear()
  }
}

// ============================================================
// SKUService
// ============================================================

@Injectable()
export class SKUService {
  private productService: ProductService

  constructor(productService: ProductService) {
    this.productService = productService
  }

  createSKU(tenantId: string, params: CreateSKUParams): SKU[] {
    const product = this.productService.getProduct(params.productId, tenantId)
    const now = new Date().toISOString()
    const created: SKU[] = []

    for (const variant of params.variants) {
      const variantKey = this.buildVariantKey(variant)
      const fullSku = `${product.sku}-${variantKey}`
      const indexKey = `${tenantId}:${fullSku}`

      if (skuIndex.has(indexKey)) {
        throw new ConflictException(`SKU variant ${fullSku} already exists`)
      }

      const sku: SKU = {
        id: `sku-${randomUUID()}`,
        tenantId,
        productId: params.productId,
        sku: fullSku,
        variantName: variantKey,
        attributes: { ...variant },
        totalQty: params.initialQty ?? 0,
        reservedQty: 0,
        availableQty: params.initialQty ?? 0,
        version: 1,
        createdAt: now,
        updatedAt: now
      }

      skuStore.set(sku.id, sku)
      skuIndex.set(indexKey, sku.id)
      created.push({ ...sku })
    }

    return created
  }

  updateSKUStock(skuId: string, tenantId: string, delta: number): SKU {
    const sku = this.requireSKU(skuId, tenantId)
    const now = new Date().toISOString()

    if (sku.totalQty + delta < 0) {
      throw new Error(`Insufficient stock: current ${sku.totalQty}, delta ${delta}`)
    }

    const newTotal = sku.totalQty + delta
    const newAvailable = newTotal - sku.reservedQty

    const updated: SKU = {
      ...sku,
      totalQty: newTotal,
      availableQty: newAvailable,
      version: sku.version + 1,
      updatedAt: now
    }

    skuStore.set(skuId, updated)
    return { ...updated }
  }

  listSKUs(productId: string, tenantId: string): SKU[] {
    // 验证 product 归属
    this.productService.getProduct(productId, tenantId)
    return Array.from(skuStore.values())
      .filter((s) => s.tenantId === tenantId && s.productId === productId)
      .map((s) => ({ ...s }))
  }

  /**
   * P0-5 Redis Lua 原子操作模拟
   *
   * 实际 Redis Lua Script:
   *   local key = KEYS[1]
   *   local qty = tonumber(ARGV[1])
   *   local available = tonumber(redis.call('GET', key .. ':available') or '0')
   *   if available < qty then return {err='INSUFFICIENT'} end
   *   redis.call('DECRBY', key .. ':available', qty)
   *   redis.call('INCRBY', key .. ':reserved', qty)
   *   return {ok=1}
   *
   * 这里用内存锁模拟同等的原子性保证
   */
  reserveSKU(tenantId: string, params: ReserveParams): SKU {
    cleanExpiredLocks()

    const lockKey = `lock:sku:${params.skuId}`
    const lockOwner = `order-${params.orderId}`

    // 获取锁 (SETNX 语义)
    let attempts = 0
    while (!acquireLock(lockKey, lockOwner)) {
      attempts++
      if (attempts > 100) {
        throw new Error(`Failed to acquire lock for SKU ${params.skuId} after 100 attempts`)
      }
      // 退避后重试 (简单 spin-wait, 生产用 Redisson)
      const start = Date.now()
      while (Date.now() - start < 5) { /* spin */ }
    }

    try {
      const sku = this.requireSKU(params.skuId, tenantId)

      if (sku.availableQty < params.quantity) {
        throw new ConflictException(
          `Insufficient available stock: requested ${params.quantity}, available ${sku.availableQty}`
        )
      }

      const now = new Date().toISOString()
      const updated: SKU = {
        ...sku,
        reservedQty: sku.reservedQty + params.quantity,
        availableQty: sku.totalQty - (sku.reservedQty + params.quantity),
        version: sku.version + 1,
        updatedAt: now
      }

      skuStore.set(params.skuId, updated)
      return { ...updated }
    } finally {
      releaseLock(lockKey, lockOwner)
    }
  }

  releaseReservation(skuId: string, tenantId: string, quantity: number): SKU {
    const sku = this.requireSKU(skuId, tenantId)
    const now = new Date().toISOString()

    if (quantity > sku.reservedQty) {
      throw new Error(`Cannot release ${quantity} more than reserved ${sku.reservedQty}`)
    }

    const updated: SKU = {
      ...sku,
      reservedQty: sku.reservedQty - quantity,
      availableQty: sku.totalQty - (sku.reservedQty - quantity),
      version: sku.version + 1,
      updatedAt: now
    }

    skuStore.set(skuId, updated)
    return { ...updated }
  }

  getSKU(skuId: string, tenantId: string): SKU {
    return this.requireSKU(skuId, tenantId)
  }

  private requireSKU(skuId: string, tenantId: string): SKU {
    const sku = skuStore.get(skuId)
    if (!sku || sku.tenantId !== tenantId) {
      throw new NotFoundException(`SKU ${skuId} not found`)
    }
    return sku
  }

  private buildVariantKey(variant: SKUVariant): string {
    const parts: string[] = []
    if (variant.color) parts.push(`C-${variant.color}`)
    if (variant.size) parts.push(`S-${variant.size}`)
    if (variant.spec) parts.push(`SP-${variant.spec}`)
    return parts.join('-') || 'DEFAULT'
  }
}
