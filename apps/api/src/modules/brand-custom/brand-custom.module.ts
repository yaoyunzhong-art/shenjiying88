import { Module } from '@nestjs/common'
import { BrandCustomController } from './brand-custom.controller'
import { BrandCustomService } from './brand-custom.service'

@Module({
  controllers: [BrandCustomController],
  providers: [BrandCustomService],
  exports: [BrandCustomService],
})
export class BrandCustomModule {}
