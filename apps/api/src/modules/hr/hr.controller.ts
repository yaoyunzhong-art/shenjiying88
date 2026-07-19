import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { TenantGuard } from '../agent/tenant.guard'
import {
  HrService,
  type Employee,
  type EmployeeStatus,
  type AttendanceType,
  type AttendanceRecord,
  type AttendanceStats,
  type Contract,
  type OnboardingRecord,
  type OffboardingRecord,
  type HrStats,
} from './hr.service'

@Controller('hr')
@UseGuards(TenantGuard)
export class HrController {
  constructor(private readonly service: HrService) {}

  // ─────────────────────────────────────────────────────────────────
  // 员工列表
  // ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/hr/employees
   * 员工列表（支持 department/status/search 筛选）
   */
  @Get('employees')
  findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Query('department') department?: string,
    @Query('status') status?: EmployeeStatus | 'all',
    @Query('search') search?: string,
  ): Employee[] {
    return this.service.findAll(tenantId, { department, status, search })
  }

  /**
   * GET /api/v1/hr/employees/:id
   * 员工详情
   */
  @Get('employees/:id')
  findById(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Employee {
    const emp = this.service.findById(id, tenantId)
    if (!emp) {
      throw new Error(`Employee not found: ${id}`)
    }
    return emp
  }

  /**
   * POST /api/v1/hr/employees
   * 新增员工
   */
  @Post('employees')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      name: string
      department: string
      position: string
      phone: string
      email: string
      joinDate: string
      emergencyContact?: string
      remark?: string
    },
  ): Employee {
    return this.service.create({ tenantId, ...body })
  }

  /**
   * PATCH /api/v1/hr/employees/:id
   * 更新员工
   */
  @Patch('employees/:id')
  update(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: Partial<{
      name: string
      department: string
      position: string
      status: EmployeeStatus
      phone: string
      email: string
      joinDate: string
      emergencyContact: string
      remark: string
    }>,
  ): Employee {
    return this.service.update(id, tenantId, body)
  }

  /**
   * DELETE /api/v1/hr/employees/:id
   * 删除员工
   */
  @Delete('employees/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): void {
    this.service.delete(id, tenantId)
  }

  // ─────────────────────────────────────────────────────────────────
  // 统计 & 部门
  // ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/hr/stats
   * 统计（总人数/在职/试用/离职）
   */
  @Get('stats')
  getStats(
    @Headers('x-tenant-id') tenantId: string,
  ): HrStats {
    return this.service.getStats(tenantId)
  }

  /**
   * GET /api/v1/hr/departments
   * 部门列表
   */
  @Get('departments')
  getDepartments(): string[] {
    return this.service.getDepartments()
  }

  // ─────────────────────────────────────────────────────────────────
  // 考勤管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/hr/employees/:id/attendance
   * 记录考勤
   */
  @Post('employees/:id/attendance')
  @HttpCode(HttpStatus.CREATED)
  recordAttendance(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      date: string
      type: AttendanceType
      time: string
      note?: string
    },
  ): AttendanceRecord {
    return this.service.recordAttendance({
      tenantId,
      employeeId: id,
      ...body,
    })
  }

  /**
   * GET /api/v1/hr/employees/:id/attendance
   * 查询考勤记录
   */
  @Get('employees/:id/attendance')
  getAttendance(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): AttendanceRecord[] {
    return this.service.getAttendance(id, tenantId, { startDate, endDate })
  }

  /**
   * GET /api/v1/hr/employees/:id/attendance/stats
   * 考勤统计
   */
  @Get('employees/:id/attendance/stats')
  getAttendanceStats(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): AttendanceStats {
    return this.service.getAttendanceStats(id, tenantId)
  }

  // ─────────────────────────────────────────────────────────────────
  // 入离职管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/hr/employees/:id/onboard
   * 入职
   */
  @Post('employees/:id/onboard')
  @HttpCode(HttpStatus.CREATED)
  onboard(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      plannedDate: string
      mentor?: string
      checklist?: string[]
      remark?: string
    },
  ): OnboardingRecord {
    return this.service.onboard({ tenantId, employeeId: id, ...body })
  }

  /**
   * GET /api/v1/hr/onboarding
   * 入职列表
   */
  @Get('onboarding')
  getOnboardingList(
    @Headers('x-tenant-id') tenantId: string,
  ): OnboardingRecord[] {
    return this.service.getOnboardingList(tenantId)
  }

  /**
   * POST /api/v1/hr/employees/:id/offboard
   * 离职
   */
  @Post('employees/:id/offboard')
  @HttpCode(HttpStatus.CREATED)
  offboard(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      resignationDate: string
      lastWorkingDate: string
      reason: string
      type: 'voluntary' | 'involuntary' | 'retirement'
      checklist?: string[]
      remark?: string
    },
  ): OffboardingRecord {
    return this.service.offboard({ tenantId, employeeId: id, ...body })
  }

  /**
   * GET /api/v1/hr/offboarding
   * 离职列表
   */
  @Get('offboarding')
  getOffboardingList(
    @Headers('x-tenant-id') tenantId: string,
  ): OffboardingRecord[] {
    return this.service.getOffboardingList(tenantId)
  }

  // ─────────────────────────────────────────────────────────────────
  // 合同管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/hr/employees/:id/contracts
   * 合同列表
   */
  @Get('employees/:id/contracts')
  getContracts(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Contract[] {
    return this.service.getContracts(id, tenantId)
  }

  /**
   * POST /api/v1/hr/employees/:id/contracts
   * 创建合同
   */
  @Post('employees/:id/contracts')
  @HttpCode(HttpStatus.CREATED)
  createContract(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      type: Contract['type']
      startDate: string
      endDate: string
      salary: number
      remark?: string
    },
  ): Contract {
    return this.service.createContract({ tenantId, employeeId: id, ...body })
  }

  /**
   * PATCH /api/v1/hr/contracts/:id/renew
   * 续签合同
   */
  @Patch('contracts/:id/renew')
  renewContract(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      startDate: string
      endDate: string
      salary: number
    },
  ): Contract {
    return this.service.renewContract(id, tenantId, body)
  }
}
