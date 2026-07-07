// CouponModule 定义 · Phase-17 T1
// 创建: 2026-06-26 · Pulse-68 等待期准备
// 更新: 2026-06-26 · 添加 Controller 注册

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponV2 } from './coupon.entity';
import { CouponRedemptionLog } from './coupon-redemption-log.entity';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CouponV2, CouponRedemptionLog]),
  ],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}