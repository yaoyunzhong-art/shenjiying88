import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  SupplierStatus,
  SupplierRating,
  type Supplier,
} from './supplier-manager.entity'

// ── In-memory store ──

const supplierStore = new Map<string, Supplier>()

// ── Mock data seeded on first use ──

let seeded = false

function seedMockSuppliers(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'

  const mockSuppliers: Array<{
    name: string; code: string; contactPerson: string; phone: string; email: string
    address: string; status: SupplierStatus; rating: SupplierRating; category: string; remark?: string
  }> = [
    { name: '深圳华强电子', code: 'SUP-001', contactPerson: '张伟', phone: '13800138001', email: 'zhangwei@hqelec.com', address: '深圳市福田区华强北路1001号', status: SupplierStatus.Active, rating: SupplierRating.A, category: '电子元器件', remark: '长期合作供应商' },
    { name: '广州博远包装', code: 'SUP-002', contactPerson: '李明', phone: '13900139002', email: 'liming@boyuan.com', address: '广州市番禺区南村镇兴业路88号', status: SupplierStatus.Active, rating: SupplierRating.B, category: '包装材料' },
    { name: '东莞华美塑料', code: 'SUP-003', contactPerson: '王芳', phone: '13700137003', email: 'wangfang@huamei.com', address: '东莞市长安镇乌沙工业区', status: SupplierStatus.Active, rating: SupplierRating.A, category: '塑料原料' },
    { name: '上海普瑞精密', code: 'SUP-004', contactPerson: '赵强', phone: '13600136004', email: 'zhaoqiang@purui.com', address: '上海市闵行区莘庄工业区', status: SupplierStatus.Active, rating: SupplierRating.A, category: '精密零件' },
    { name: '北京青云软件', code: 'SUP-005', contactPerson: '刘洋', phone: '13500135005', email: 'liuyang@qingyun.com', address: '北京市海淀区中关村大街1号', status: SupplierStatus.Active, rating: SupplierRating.B, category: '软件服务' },
    { name: '成都鑫源物流', code: 'SUP-006', contactPerson: '陈静', phone: '13400134006', email: 'chenjing@xinyuan.com', address: '成都市龙泉驿区物流大道18号', status: SupplierStatus.Active, rating: SupplierRating.C, category: '物流配送', remark: '时效有待提升' },
    { name: '杭州西湖印刷', code: 'SUP-007', contactPerson: '孙涛', phone: '13300133007', email: 'suntao@xihuprint.com', address: '杭州市余杭区五常街道', status: SupplierStatus.Inactive, rating: SupplierRating.B, category: '印刷服务' },
    { name: '武汉长江五金', code: 'SUP-008', contactPerson: '周杰', phone: '13200132008', email: 'zhoujie@changjiang.com', address: '武汉市汉口北大道五金城A区', status: SupplierStatus.Active, rating: SupplierRating.A, category: '五金配件' },
    { name: '南京浩宇建材', code: 'SUP-009', contactPerson: '吴敏', phone: '13100131009', email: 'wumin@haoyu.com', address: '南京市江宁区建材大道66号', status: SupplierStatus.Suspended, rating: SupplierRating.D, category: '建筑材料', remark: '质量问题频发，暂停合作' },
    { name: '重庆力通机械', code: 'SUP-010', contactPerson: '郑伟', phone: '13000130010', email: 'zhengwei@litong.com', address: '重庆市九龙坡区机械工业园', status: SupplierStatus.Active, rating: SupplierRating.B, category: '机械设备' },
    { name: '天津渤海化工', code: 'SUP-011', contactPerson: '黄磊', phone: '12900129011', email: 'huanglei@bohai.com', address: '天津市滨海新区化工路12号', status: SupplierStatus.Active, rating: SupplierRating.A, category: '化工原料' },
    { name: '厦门泛海食品', code: 'SUP-012', contactPerson: '林芳', phone: '12800128012', email: 'linfang@fanhai.com', address: '厦门市海沧区食品加工园区', status: SupplierStatus.Active, rating: SupplierRating.B, category: '食品原料' },
    { name: '青岛海晟制冷', code: 'SUP-013', contactPerson: '马超', phone: '12700127013', email: 'machao@haisheng.com', address: '青岛市黄岛区制冷工业园', status: SupplierStatus.Inactive, rating: SupplierRating.C, category: '制冷设备' },
    { name: '郑州中原纺织', code: 'SUP-014', contactPerson: '朱红', phone: '12600126014', email: 'zhuhong@zhongyuan.com', address: '郑州市中原区纺织街5号', status: SupplierStatus.Active, rating: SupplierRating.A, category: '纺织品' },
    { name: '长沙湘江仪表', code: 'SUP-015', contactPerson: '何军', phone: '12500125015', email: 'hejun@xiangjiang.com', address: '长沙市岳麓区仪器仪表城', status: SupplierStatus.Active, rating: SupplierRating.B, category: '仪器仪表' },
    { name: '西安秦川钢铁', code: 'SUP-016', contactPerson: '高峰', phone: '12400124016', email: 'gaofeng@qinchuan.com', address: '西安市未央区钢铁交易中心', status: SupplierStatus.Suspended, rating: SupplierRating.D, category: '钢材', remark: '合同纠纷中' },
    { name: '大连海天渔业', code: 'SUP-017', contactPerson: '曹雪', phone: '12300123017', email: 'caoxue@haitian.com', address: '大连市甘井子区渔业码头', status: SupplierStatus.Active, rating: SupplierRating.A, category: '水产品' },
    { name: '苏州工业园区电子', code: 'SUP-018', contactPerson: '沈涛', phone: '12200122018', email: 'shentao@szepark.com', address: '苏州市工业园区苏虹路', status: SupplierStatus.Active, rating: SupplierRating.B, category: '电子元器件' },
    { name: '昆明南亚茶叶', code: 'SUP-019', contactPerson: '杨丽', phone: '12100121019', email: 'yangli@nanya.com', address: '昆明市官渡区茶叶市场B区', status: SupplierStatus.Inactive, rating: SupplierRating.C, category: '食品原料' },
    { name: '哈尔滨冰雪饮料', code: 'SUP-020', contactPerson: '韩冰', phone: '12000120020', email: 'hanbing@bingxue.com', address: '哈尔滨市南岗区饮料路8号', status: SupplierStatus.Active, rating: SupplierRating.A, category: '饮品原料' },
    { name: '佛山博展陶瓷', code: 'SUP-021', contactPerson: '梁健', phone: '11900119021', email: 'liangjian@bozhan.com', address: '佛山市禅城区陶瓷总部基地', status: SupplierStatus.Active, rating: SupplierRating.B, category: '建材陶瓷' },
    { name: '合肥科达电子', code: 'SUP-022', contactPerson: '汪洋', phone: '11800118022', email: 'wangyang@kede.com', address: '合肥市高新区科学大道88号', status: SupplierStatus.Active, rating: SupplierRating.A, category: '电子元器件' },
    { name: '济南泉城纸业', code: 'SUP-023', contactPerson: '宋敏', phone: '11700117023', email: 'songmin@quancheng.com', address: '济南市历下区纸业路15号', status: SupplierStatus.Active, rating: SupplierRating.C, category: '包装材料' },
    { name: '福州海峡服装', code: 'SUP-024', contactPerson: '陈宇', phone: '11600116024', email: 'chenyu@haixia.com', address: '福州市闽侯县服装产业园', status: SupplierStatus.Active, rating: SupplierRating.B, category: '纺织品' },
  ]

  for (const m of mockSuppliers) {
    const now = new Date()
    const supplier: Supplier = {
      id: `supplier-${randomUUID()}`,
      name: m.name,
      code: m.code,
      contactPerson: m.contactPerson,
      phone: m.phone,
      email: m.email,
      address: m.address,
      status: m.status,
      rating: m.rating,
      category: m.category,
      remark: m.remark,
      tenantId: tenant,
      createdAt: new Date(now.getTime() - Math.random() * 30 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    }
    supplierStore.set(supplier.id, supplier)
  }
}

@Injectable()
export class SupplierManagerService {
  // ═══════════════════════════════════════════════════════════════════
  // Supplier CRUD
  // ═══════════════════════════════════════════════════════════════════

  createSupplier(input: {
    tenantId: string
    name: string
    code: string
    contactPerson: string
    phone: string
    email: string
    address: string
    status?: SupplierStatus
    rating?: SupplierRating
    category: string
    remark?: string
  }): Supplier {
    const now = new Date().toISOString()
    const supplier: Supplier = {
      id: `supplier-${randomUUID()}`,
      tenantId: input.tenantId,
      name: input.name,
      code: input.code,
      contactPerson: input.contactPerson,
      phone: input.phone,
      email: input.email,
      address: input.address,
      status: input.status ?? SupplierStatus.Active,
      rating: input.rating ?? SupplierRating.B,
      category: input.category,
      remark: input.remark,
      createdAt: now,
      updatedAt: now,
    }
    supplierStore.set(supplier.id, supplier)
    return supplier
  }

  updateSupplier(
    supplierId: string,
    tenantId: string,
    input: {
      name?: string
      code?: string
      contactPerson?: string
      phone?: string
      email?: string
      address?: string
      status?: SupplierStatus
      rating?: SupplierRating
      category?: string
      remark?: string
    }
  ): Supplier {
    const supplier = this.requireSupplier(supplierId, tenantId)

    if (input.name !== undefined) supplier.name = input.name
    if (input.code !== undefined) supplier.code = input.code
    if (input.contactPerson !== undefined) supplier.contactPerson = input.contactPerson
    if (input.phone !== undefined) supplier.phone = input.phone
    if (input.email !== undefined) supplier.email = input.email
    if (input.address !== undefined) supplier.address = input.address
    if (input.status !== undefined) supplier.status = input.status
    if (input.rating !== undefined) supplier.rating = input.rating
    if (input.category !== undefined) supplier.category = input.category
    if (input.remark !== undefined) supplier.remark = input.remark

    supplier.updatedAt = new Date().toISOString()
    supplierStore.set(supplierId, supplier)
    return supplier
  }

  getSupplier(supplierId: string, tenantId: string): Supplier | undefined {
    const supplier = supplierStore.get(supplierId)
    if (!supplier || supplier.tenantId !== tenantId) return undefined
    return supplier
  }

  listSuppliers(
    tenantId: string,
    filter?: {
      status?: SupplierStatus
      rating?: SupplierRating
      category?: string
      search?: string
    }
  ): Supplier[] {
    seedMockSuppliers()
    return Array.from(supplierStore.values())
      .filter((s) => s.tenantId === tenantId)
      .filter((s) => (filter?.status ? s.status === filter.status : true))
      .filter((s) => (filter?.rating ? s.rating === filter.rating : true))
      .filter((s) => (filter?.category ? s.category === filter.category : true))
      .filter((s) => {
        if (!filter?.search) return true
        const q = filter.search.toLowerCase()
        return (
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.phone.includes(q)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  deleteSupplier(supplierId: string, tenantId: string): void {
    const supplier = this.requireSupplier(supplierId, tenantId)
    supplierStore.delete(supplier.id)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Internals
  // ═══════════════════════════════════════════════════════════════════

  private requireSupplier(supplierId: string, tenantId: string): Supplier {
    const supplier = supplierStore.get(supplierId)
    if (!supplier || supplier.tenantId !== tenantId) {
      throw new Error(`Supplier not found: ${supplierId}`)
    }
    return supplier
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetSupplierStoresForTests(): void {
    supplierStore.clear()
    seeded = false
  }
}
