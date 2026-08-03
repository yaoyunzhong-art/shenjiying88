/**
 * Sprint 3 Phase 1 - License 套餐管理 Controller
 * 
 * 功能:
 * - 套餐 CRUD 操作
 * - 套餐与 License 关联
 * - 套餐权限管理
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { LicensePackageService } from './license-package.service'
import {
  CreatePackageDto,
  UpdatePackageDto,
  PackageQueryDto,
  PackageResponseDto,
  PackageListResponseDto,
  AssignPackageToLicenseDto,
} from './dto'

@ApiTags('License 套餐管理')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('api/license-packages')
export class LicensePackageController {
  constructor(private readonly packageService: LicensePackageService) {}

  /**
   * 创建套餐
   */
  @Post()
  @ApiOperation({ summary: '创建 License 套餐', description: '创建一个新的 License 套餐' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功', type: PackageResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '参数错误' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '无权限' })
  async create(
    @Body() createDto: CreatePackageDto,
    ): Promise<any> {
    return this.packageService.create(createDto, 'auto')
  }

  /**
   * 获取套餐列表
   */
  @Get()
  @ApiOperation({
    summary: '获取套餐列表',
    description: '分页获取 License 套餐列表，支持搜索和筛选',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功', type: PackageListResponseDto })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认 1' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数，默认 10' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'isActive', required: false, description: '是否启用' })
  async findAll(@Query() queryDto: PackageQueryDto): Promise<any> {
    return this.packageService.findAll(queryDto)
  }

  /**
   * 获取套餐详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取套餐详情', description: '根据 ID 获取套餐详细信息' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功', type: PackageResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '套餐不存在' })
  async findOne(@Param('id') id: string): Promise<any> {
    return this.packageService.findOne(id)
  }

  /**
   * 更新套餐
   */
  @Put(':id')
  @ApiOperation({ summary: '更新套餐', description: '更新套餐信息' })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功', type: PackageResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '套餐不存在' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '参数错误' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePackageDto,
    ): Promise<any> {
    return this.packageService.update(id, updateDto, 'auto')
  }

  /**
   * 删除套餐
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除套餐', description: '删除套餐（逻辑删除）' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '套餐不存在' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '套餐已被使用，无法删除' })
  async remove(@Param('id') id: string, ): Promise<void> {
    return this.packageService.remove(id, 'auto')
  }

  /**
   * 关联套餐到 License
   */
  @Post(':id/assign')
  @ApiOperation({ summary: '关联套餐到 License', description: '将套餐关联到指定的 License' })
  @ApiResponse({ status: HttpStatus.OK, description: '关联成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '套餐或 License 不存在' })
  async assignToLicense(
    @Param('id') id: string,
    @Body() assignDto: AssignPackageToLicenseDto,
    ): Promise<void> {
    return this.packageService.assignToLicense(id, assignDto, 'auto')
  }

  /**
   * 获取套餐关联的 License 列表
   */
  @Get(':id/licenses')
  @ApiOperation({ summary: '获取套餐关联的 License 列表', description: '获取使用此套餐的所有 License' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getLicensesByPackage(@Param('id') id: string) {
    return this.packageService.getLicensesByPackage(id)
  }
}