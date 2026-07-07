// runbook.controller.ts - 运维手册 API 控制器
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common'
import { RunbookService } from './runbook.service'
import {
  CreateRunbookDto,
  UpdateRunbookDto,
  ListRunbookQueryDto,
  MapAlertDto,
} from './runbook.dto'
import type { Runbook, AlertMapping } from './runbook.entity'

@Controller('runbook')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class RunbookController {
  constructor(private readonly runbookService: RunbookService) {}

  @Post()
  create(@Body() dto: CreateRunbookDto): Runbook {
    return this.runbookService.create(dto)
  }

  @Get()
  list(@Query() query: ListRunbookQueryDto): Runbook[] {
    return this.runbookService.list(query)
  }

  @Get('search')
  search(@Query('q') keyword: string): Runbook[] {
    return this.runbookService.search(keyword || '')
  }

  @Get(':id')
  get(@Param('id') id: string): Runbook {
    const runbook = this.runbookService.get(id)
    if (!runbook) {
      throw new NotFoundException(`Runbook not found: ${id}`)
    }
    return runbook
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRunbookDto): Runbook {
    return this.runbookService.update(id, dto)
  }

  @Delete(':id')
  delete(@Param('id') id: string): { success: boolean } {
    this.runbookService.delete(id)
    return { success: true }
  }

  @Post('alert-mapping')
  mapAlert(@Body() dto: MapAlertDto): AlertMapping {
    return this.runbookService.mapAlert(
      dto.alertName,
      dto.runbookId,
      dto.possibleCauses,
      dto.severity,
      dto.autoAction,
    )
  }

  @Get('alert-mapping/:alertName')
  findByAlert(@Param('alertName') alertName: string): AlertMapping | null {
    return this.runbookService.findByAlert(alertName)
  }

  @Get(':id/critical-steps')
  getCriticalSteps(@Param('id') id: string) {
    return this.runbookService.getCriticalSteps(id)
  }

  @Get(':id/validate')
  validate(@Param('id') id: string) {
    return this.runbookService.validate(id)
  }
}
