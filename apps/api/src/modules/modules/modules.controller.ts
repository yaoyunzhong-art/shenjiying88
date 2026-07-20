import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { TenantGuard } from '../agent/tenant.guard';

@Controller('modules')
@UseGuards(TenantGuard)
export class ModulesController {
  constructor(private readonly svc: ModulesService) {}

  @Post('register')
  register(
    @Body() body: { id: string; name: string; version: string; dependencies?: string[] },
  ) {
    return this.svc.register(body.id, body.name, body.version, body.dependencies);
  }

  @Get()
  getAll() {
    return this.svc.getAll();
  }

  @Get('topology')
  topology() {
    return {
      sort: this.svc.getTopologicalSort(),
      cycles: this.svc.detectCycles(),
    };
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Get(':id/check')
  checkDeps(@Param('id') id: string) {
    return this.svc.checkDependencies(id);
  }

  @Post(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.svc.toggleStatus(id);
  }
}
