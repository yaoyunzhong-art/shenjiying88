// LicensePackageModule · 套餐管理模块
// 补全: 模块定义 + TypeORM 注册

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicensePackage } from './entities/license-package.entity';
import { LicensePackageService } from './license-package.service';
import { LicensePackageController } from './license-package.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([LicensePackage]),
  ],
  controllers: [LicensePackageController],
  providers: [LicensePackageService],
  exports: [LicensePackageService],
})
export class LicensePackageModule {}
