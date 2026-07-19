/**
 * 🧪 HR 模块 Service 单测
 * 覆盖: 员工CRUD · 考勤 · 合同 · 入离职 · 统计
 * 三件套：正例 + 反例 + 边界
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { HrService } from './hr.service'

describe('HrService', () => {
  let service: HrService

  beforeEach(() => {
    service = new HrService()
  })

  // ════════════════════════════════════════════════════
  // 员工 CRUD
  // ════════════════════════════════════════════════════

  describe('员工 CRUD', () => {
    it('[正例] findAll 返回所有员工', () => {
      const result = service.findAll('tenant-001')
      expect(result.length).toBeGreaterThanOrEqual(10)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('department')
    })

    it('[正例] findAll 支持部门筛选', () => {
      const result = service.findAll('tenant-001', { department: '技术部' })
      expect(result.every(e => e.department === '技术部')).toBe(true)
    })

    it('[正例] findAll 支持状态筛选', () => {
      const result = service.findAll('tenant-001', { status: 'resigned' })
      expect(result.every(e => e.status === 'resigned')).toBe(true)
    })

    it('[正例] findAll 支持关键词搜索', () => {
      const result = service.findAll('tenant-001', { search: '张三' })
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(result[0].name).toContain('张三')
    })

    it('[正例] findById 返回正确员工', () => {
      const all = service.findAll('tenant-001')
      const emp = service.findById(all[0].id, 'tenant-001')
      expect(emp).toBeDefined()
      expect(emp!.id).toBe(all[0].id)
    })

    it('[正例] create 新增员工', () => {
      const emp = service.create({
        tenantId: 'tenant-001',
        name: '测试员工',
        department: '技术部',
        position: '测试工程师',
        phone: '13800138999',
        email: 'test@company.com',
        joinDate: '2026-07-20',
      })
      expect(emp.name).toBe('测试员工')
      expect(emp.status).toBe('probation') // 新员工默认试用
      expect(emp.id).toMatch(/^E\d{3}$/)
    })

    it('[反例] findById 跨租户返回 undefined', () => {
      const all = service.findAll('tenant-001')
      const emp = service.findById(all[0].id, 'tenant-999')
      expect(emp).toBeUndefined()
    })

    it('[反例] update 不存在的员工抛出错误', () => {
      expect(() => service.update('E999', 'tenant-001', { name: '不存在' })).toThrow('Employee not found: E999')
    })

    it('[反例] delete 不存在的员工抛出错误', () => {
      expect(() => service.delete('E999', 'tenant-001')).toThrow('Employee not found: E999')
    })

    it('[边界] findAll 空租户返回空数组', () => {
      const result = service.findAll('empty-tenant')
      expect(result.length).toBe(0)
    })

    it('[边界] update 修改单个字段不影响其他字段', () => {
      const emp = service.create({
        tenantId: 'tenant-001',
        name: '边界测试',
        department: '技术部',
        position: '工程师',
        phone: '13800138998',
        email: 'boundary@company.com',
        joinDate: '2026-07-20',
      })
      const updated = service.update(emp.id, 'tenant-001', { position: '高级工程师' })
      expect(updated.name).toBe('边界测试') // 未修改
      expect(updated.position).toBe('高级工程师') // 已修改
    })
  })

  // ════════════════════════════════════════════════════
  // 考勤管理
  // ════════════════════════════════════════════════════

  describe('考勤管理', () => {
    it('[正例] recordAttendance 记录考勤', () => {
      const all = service.findAll('tenant-001')
      const record = service.recordAttendance({
        tenantId: 'tenant-001',
        employeeId: all[0].id,
        date: '2026-07-20',
        type: 'check-in',
        time: '09:00',
      })
      expect(record.type).toBe('check-in')
      expect(record.id).toMatch(/^att-/)
    })

    it('[正例] getAttendance 返回考勤记录', () => {
      const all = service.findAll('tenant-001')
      service.recordAttendance({
        tenantId: 'tenant-001',
        employeeId: all[0].id,
        date: '2026-07-20',
        type: 'check-in',
        time: '09:00',
      })
      const records = service.getAttendance(all[0].id, 'tenant-001')
      expect(records.length).toBeGreaterThanOrEqual(1)
      expect(records[0].employeeId).toBe(all[0].id)
    })

    it('[正例] getAttendanceStats 返回统计', () => {
      const all = service.findAll('tenant-001')
      const stats = service.getAttendanceStats(all[0].id, 'tenant-001')
      expect(stats).toHaveProperty('total')
      expect(stats).toHaveProperty('checkIns')
      expect(stats).toHaveProperty('late')
    })

    it('[反例] recordAttendance 不存在的员工抛错', () => {
      expect(() => service.recordAttendance({
        tenantId: 'tenant-001',
        employeeId: 'E999',
        date: '2026-07-20',
        type: 'check-in',
        time: '09:00',
      })).toThrow('Employee not found: E999')
    })

    it('[边界] getAttendance 支持日期筛选', () => {
      const all = service.findAll('tenant-001')
      const records = service.getAttendance(all[0].id, 'tenant-001', {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      })
      expect(Array.isArray(records)).toBe(true)
    })
  })

  // ════════════════════════════════════════════════════
  // 合同管理
  // ════════════════════════════════════════════════════

  describe('合同管理', () => {
    it('[正例] createContract 创建合同', () => {
      const all = service.findAll('tenant-001')
      const contract = service.createContract({
        tenantId: 'tenant-001',
        employeeId: all[0].id,
        type: 'full-time',
        startDate: '2026-01-01',
        endDate: '2028-12-31',
        salary: 8000,
      })
      expect(contract.type).toBe('full-time')
      expect(contract.status).toBe('active')
    })

    it('[正例] getContracts 返回合同列表', () => {
      const all = service.findAll('tenant-001')
      const contracts = service.getContracts(all[0].id, 'tenant-001')
      expect(Array.isArray(contracts)).toBe(true)
    })

    it('[正例] renewContract 续签合同', () => {
      const all = service.findAll('tenant-001')
      const contract = service.createContract({
        tenantId: 'tenant-001',
        employeeId: all[0].id,
        type: 'full-time',
        startDate: '2026-01-01',
        endDate: '2028-12-31',
        salary: 8000,
      })
      const renewed = service.renewContract(contract.id, 'tenant-001', {
        startDate: '2029-01-01',
        endDate: '2031-12-31',
        salary: 8800,
      })
      expect(renewed.salary).toBe(8800)
      expect(renewed.startDate).toBe('2029-01-01')
    })

    it('[反例] renewContract 不存在的合同抛错', () => {
      expect(() => service.renewContract('ctr-ctr-999', 'tenant-001', {
        startDate: '2029-01-01',
        endDate: '2031-12-31',
        salary: 8800,
      })).toThrow()
    })
  })

  // ════════════════════════════════════════════════════
  // 入离职管理
  // ════════════════════════════════════════════════════

  describe('入离职管理', () => {
    it('[正例] onboard 创建入职记录并更新员工状态为试用', () => {
      const emp = service.create({
        tenantId: 'tenant-001',
        name: '入职测试',
        department: '技术部',
        position: '前端开发',
        phone: '13800138997',
        email: 'onboard@company.com',
        joinDate: '2026-07-20',
      })
      const onb = service.onboard({
        tenantId: 'tenant-001',
        employeeId: emp.id,
        plannedDate: '2026-07-20',
        mentor: '张三',
      })
      expect(onb.status).toBe('pending')
      expect(onb.checklist.length).toBeGreaterThanOrEqual(4)
      // 员工状态应更新为 probation
      const updated = service.findById(emp.id, 'tenant-001')
      expect(updated!.status).toBe('probation')
    })

    it('[正例] offboard 创建离职记录并更新员工状态为离职', () => {
      const all = service.findAll('tenant-001')
      const active = all.find(e => e.status === 'active')
      if (!active) return
      const offb = service.offboard({
        tenantId: 'tenant-001',
        employeeId: active.id,
        resignationDate: '2026-07-20',
        lastWorkingDate: '2026-08-20',
        reason: '个人发展',
        type: 'voluntary',
      })
      expect(offb.status).toBe('pending')
      // 员工状态应更新为 resigned
      const updated = service.findById(active.id, 'tenant-001')
      expect(updated!.status).toBe('resigned')
    })

    it('[反例] onboard 不存在的员工抛错', () => {
      expect(() => service.onboard({
        tenantId: 'tenant-001',
        employeeId: 'E999',
        plannedDate: '2026-07-20',
      })).toThrow('Employee not found: E999')
    })
  })

  // ════════════════════════════════════════════════════
  // 统计
  // ════════════════════════════════════════════════════

  describe('统计', () => {
    it('[正例] getStats 返回完整统计', () => {
      const stats = service.getStats('tenant-001')
      expect(stats).toHaveProperty('totalEmployees')
      expect(stats).toHaveProperty('active')
      expect(stats).toHaveProperty('probation')
      expect(stats).toHaveProperty('resigned')
      expect(stats).toHaveProperty('departmentCounts')
      expect(stats.totalEmployees).toBeGreaterThan(0)
    })

    it('[正例] getDepartments 返回所有部门', () => {
      const depts = service.getDepartments()
      expect(depts).toContain('技术部')
      expect(depts).toContain('运营部')
      expect(depts).toContain('门店管理')
    })

    it('[边界] getStats 空租户返回0', () => {
      const stats = service.getStats('empty-tenant')
      expect(stats.totalEmployees).toBe(0)
      expect(stats.active).toBe(0)
    })
  })
})
