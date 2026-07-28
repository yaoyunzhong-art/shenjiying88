import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common'
import { IsString, IsOptional, IsNotEmpty } from 'class-validator'
import { TrafficGovernanceGuard } from '../../common/guards/traffic-governance.guard'
import { BrandWorkspaceService } from './brand-workspace.service'
import type { WorkspaceLayout, WorkspaceTask, ApprovalFlow, BrandCalendarEvent, QuickAction, WorkspaceSummary } from './brand-workspace.entity'

class CreateTaskDto { @IsString() tenantId!: string; @IsString() title!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsString() assignee?: string; @IsOptional() @IsString() priority?: string; @IsOptional() @IsString() dueDate?: string }
class UpdateTaskStatusDto { @IsString() status!: string }
class CreateApprovalDto { @IsString() tenantId!: string; @IsString() title!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsString() requestorId?: string }
class ApproveFlowDto { @IsString() approverId!: string; @IsOptional() @IsString() comment?: string }
class CreateEventDto { @IsString() tenantId!: string; @IsString() title!: string; @IsString() startDate!: string; @IsString() endDate!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsString() eventType?: string }
class RegisterActionDto { @IsString() tenantId!: string; @IsString() label!: string; @IsString() icon!: string; @IsString() action!: string; @IsOptional() @IsString() color?: string }

@Controller('brand-workspace')
@UseGuards(TrafficGovernanceGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class BrandWorkspaceController {
  constructor(private readonly service: BrandWorkspaceService) {}

  @Get('layout/:tenantId')
  getLayout(@Param('tenantId') tid: string): Promise<WorkspaceLayout> { return this.service.getLayout(tid) }

  @Patch('layout/:tenantId')
  updateLayout(@Param('tenantId') tid: string, @Body() updates: Partial<WorkspaceLayout>): Promise<WorkspaceLayout> { return this.service.updateLayout(tid, updates) }

  @Post('tasks')
  createTask(@Body() dto: CreateTaskDto): Promise<WorkspaceTask> { return this.service.createTask(dto) }

  @Get('tasks/:tenantId')
  getTasks(@Param('tenantId') tid: string, @Query('status') status?: string, @Query('assignee') assignee?: string): Promise<WorkspaceTask[]> { return this.service.getTasks(tid, { status, assignee }) }

  @Patch('tasks/:id/status')
  updateTaskStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto): Promise<WorkspaceTask> { return this.service.updateTaskStatus(id, dto.status) }

  @Post('approvals')
  createApproval(@Body() dto: CreateApprovalDto): Promise<ApprovalFlow> { return this.service.createApproval(dto) }

  @Get('approvals/:tenantId')
  getApprovals(@Param('tenantId') tid: string, @Query('status') status?: string): Promise<ApprovalFlow[]> { return this.service.getApprovals(tid, { status }) }

  @Patch('approvals/:id/approve')
  approveFlow(@Param('id') id: string, @Body() dto: ApproveFlowDto): Promise<ApprovalFlow> { return this.service.approveFlow(id, dto.approverId, dto.comment) }

  @Post('events')
  createEvent(@Body() dto: CreateEventDto): Promise<BrandCalendarEvent> { return this.service.createEvent(dto) }

  @Get('events/:tenantId')
  getEvents(@Param('tenantId') tid: string, @Query('startDate') sd?: string, @Query('endDate') ed?: string): Promise<BrandCalendarEvent[]> { return this.service.getEvents(tid, sd, ed) }

  @Get('quick-actions/:tenantId')
  getQuickActions(@Param('tenantId') tid: string): Promise<QuickAction[]> { return this.service.getQuickActions(tid) }

  @Post('quick-actions')
  registerAction(@Body() dto: RegisterActionDto): Promise<QuickAction> { return this.service.registerAction(dto) }

  @Get('summary/:tenantId')
  getSummary(@Param('tenantId') tid: string): Promise<WorkspaceSummary> { return this.service.getSummary(tid) }
}
