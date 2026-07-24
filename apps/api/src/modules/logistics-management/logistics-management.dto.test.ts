import { describe, it, expect } from 'vitest'
import {
  SupplyOrderStatusEnum,
  VendorStatusEnum,
  VendorGradeEnum,
  InventoryCategoryEnum,
  MaintenanceTaskTypeEnum,
  MaintenanceTaskPriorityEnum,
  MaintenanceTaskStatusEnum,
} from './logistics-management.dto'

describe('LogisticsManagement DTO Enums', () => {
  it('should have all supply order statuses', () => {
    const statuses = Object.values(SupplyOrderStatusEnum)
    expect(statuses).toEqual(['draft', 'pending_approval', 'approved', 'ordered', 'partial_received', 'received', 'cancelled'])
  })

  it('should have all vendor statuses', () => {
    const statuses = Object.values(VendorStatusEnum)
    expect(statuses).toEqual(['active', 'inactive', 'suspended'])
  })

  it('should have all vendor grades', () => {
    const grades = Object.values(VendorGradeEnum)
    expect(grades).toEqual(['A', 'B', 'C', 'D'])
  })

  it('should have all inventory categories', () => {
    const categories = Object.values(InventoryCategoryEnum)
    expect(categories).toEqual(['consumable', 'spare_part', 'tool', 'equipment', 'cleaning_supply', 'office_supply', 'other'])
  })

  it('should have all maintenance task types', () => {
    const types = Object.values(MaintenanceTaskTypeEnum)
    expect(types).toEqual(['routine_inspection', 'repair', 'preventive_maintenance', 'emergency_repair', 'cleaning'])
  })

  it('should have all maintenance task priorities', () => {
    const priorities = Object.values(MaintenanceTaskPriorityEnum)
    expect(priorities).toEqual(['low', 'medium', 'high', 'critical'])
  })

  it('should have all maintenance task statuses', () => {
    const statuses = Object.values(MaintenanceTaskStatusEnum)
    expect(statuses).toEqual(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'])
  })
})
