/**
 * Sprint 3 Phase 1 - License 套餐管理 Service
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { LicensePackage } from './entities/license-package.entity'
import type {
  CreatePackageDto,
  UpdatePackageDto,
  PackageQueryDto,
  AssignPackageToLicenseDto,
  PackageListResponseDto,
} from './dto'

@Injectable()
export class LicensePackageService {
  private readonly logger = new Logger(LicensePackageService.name)

  constructor(
    @InjectRepository(LicensePackage)
    private readonly packageRepository: Repository<LicensePackage>,
  ) {}

  /**
   * 创建套餐
   */
  async create(createDto: CreatePackageDto, userId: string): Promise<LicensePackage> {
    this.logger.log(`Creating package: ${createDto.name}`)

    // 检查套餐名称是否已存在
    const existing = await this.packageRepository.findOne({
      where: { name: createDto.name },
    })
    if (existing) {
      throw new BadRequestException('套餐名称已存在')
    }

    const packageEntity = this.packageRepository.create({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    })

    return this.packageRepository.save(packageEntity)
  }

  /**
   * 查询套餐列表
   */
  async findAll(queryDto: PackageQueryDto): Promise<PackageListResponseDto> {
    const { page = 1, pageSize = 10, keyword, isActive } = queryDto

    const where: any = {}

    if (keyword) {
      where.name = Like(`%${keyword}%`)
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    const [list, total] = await this.packageRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return {
      list,
      total,
      page,
      pageSize,
    } as unknown as PackageListResponseDto
  }

  /**
   * 查询套餐详情
   */
  async findOne(id: string): Promise<LicensePackage> {
    const packageEntity = await this.packageRepository.findOne({
      where: { id },
    })

    if (!packageEntity) {
      throw new NotFoundException('套餐不存在')
    }

    return packageEntity
  }

  /**
   * 更新套餐
   */
  async update(
    id: string,
    updateDto: UpdatePackageDto,
    userId: string,
  ): Promise<LicensePackage> {
    this.logger.log(`Updating package: ${id}`)

    const packageEntity = await this.findOne(id)

    // 如果修改了名称，检查是否与其他套餐冲突
    if (updateDto.name && updateDto.name !== packageEntity.name) {
      const existing = await this.packageRepository.findOne({
        where: { name: updateDto.name },
      })
      if (existing) {
        throw new BadRequestException('套餐名称已存在')
      }
    }

    // 检查套餐是否已被使用，如果已使用则限制某些字段的修改
    const isUsed = await this.checkPackageInUse(id)
    if (isUsed) {
      // 已使用的套餐不能修改价格和有效期
      if (updateDto.price !== undefined || updateDto.duration !== undefined) {
        throw new BadRequestException('该套餐已被使用，不能修改价格或有效期')
      }
    }

    Object.assign(packageEntity, updateDto, { updatedBy: userId })

    return this.packageRepository.save(packageEntity)
  }

  /**
   * 删除套餐
   */
  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting package: ${id}`)

    const packageEntity = await this.findOne(id)

    // 检查套餐是否已被使用
    const isUsed = await this.checkPackageInUse(id)
    if (isUsed) {
      throw new BadRequestException('该套餐已被 License 使用，无法删除')
    }

    // 逻辑删除
    packageEntity.isDeleted = true
    packageEntity.deletedAt = new Date()
    packageEntity.deletedBy = userId

    await this.packageRepository.save(packageEntity)
  }

  /**
   * 关联套餐到 License - 桩代码
   * License 实体当前为 interface（非 TypeORM entity），后续迁移为 entity 后实现
   */
  async assignToLicense(
    packageId: string,
    _assignDto: AssignPackageToLicenseDto,
    _userId: string,
  ): Promise<void> {
    this.logger.log(`Assigning package ${packageId} to license (stub)`)
    const packageEntity = await this.findOne(packageId)
    if (!packageEntity.isActive) {
      throw new BadRequestException('该套餐未启用')
    }
    this.logger.log(`Package ${packageId} assigned to license successfully (stub)`)
  }

  /**
   * 获取套餐关联的 License 列表 - 桩代码
   */
  async getLicensesByPackage(packageId: string): Promise<{ id: string; tenantId: string }[]> {
    this.logger.log(`Getting licenses for package ${packageId} (stub)`)
    await this.findOne(packageId)
    return []
  }

  /**
   * 检查套餐是否被使用
   */
  private async checkPackageInUse(_packageId: string): Promise<boolean> {
    // License 实体当前为 interface（非 TypeORM entity），暂无法查询
    return false
  }
}