// ai-profile.module.ts · WP-14 C端AI画像与营销引擎

import { Module } from '@nestjs/common';
import { AiProfileController } from './ai-profile.controller';
import { AiProfileService } from './ai-profile.service';

@Module({
  controllers: [AiProfileController],
  providers: [AiProfileService],
  exports: [AiProfileService],
})
export class AiProfileModule {}
