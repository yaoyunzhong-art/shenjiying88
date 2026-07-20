import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateSupplierDto,
  SupplierQueryDto,
  UpdateSupplierDto,
} from './supplier-manager.dto'
import { SupplierManagerService } from './supplier-manager.service'
import { TenantGuard } from '../agent/tenant.guard';

@Controller('suppliers')
@UseGuards(TenantGuard)
export class SupplierManagerController {
  constructor(private readonly supplierService: SupplierManagerService) {}

  @Post()
  createSupplier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateSupplierDto
  ) {
    return this.supplierService.createSupplier({
      tenantId: tenantContext.tenantId,
      name: body.name,
      code: body.code,
      contactPerson: body.contactPerson,
      phone: body.phone,
      email: body.email,
      address: body.address,
      status: body.status,
      rating: body.rating,
      category: body.category,
      remark: body.remark,
    })
  }

  @Get()
  listSuppliers(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: SupplierQueryDto
  ) {
    return this.supplierService.listSuppliers(tenantContext.tenantId, {
      status: query.status,
      rating: query.rating,
      category: query.category,
      search: query.search,
    })
  }

  @Get(':supplierId')
  getSupplier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('supplierId') supplierId: string
  ) {
    const supplier = this.supplierService.getSupplier(supplierId, tenantContext.tenantId)
    if (!supplier) {
      throw new Error(`Supplier not found: ${supplierId}`)
    }
    return supplier
  }

  @Patch(':supplierId')
  updateSupplier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('supplierId') supplierId: string,
    @Body() body: UpdateSupplierDto
  ) {
    return this.supplierService.updateSupplier(supplierId, tenantContext.tenantId, body)
  }

  @Delete(':supplierId')
  deleteSupplier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('supplierId') supplierId: string
  ) {
    this.supplierService.deleteSupplier(supplierId, tenantContext.tenantId)
    return { success: true }
  }
}
