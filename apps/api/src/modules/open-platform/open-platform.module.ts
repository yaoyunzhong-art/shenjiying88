// open-platform.module.ts · WP-07 开放平台与ISV
// BS-0100~BS-0113

import { Module } from '@nestjs/common';
import { OpenPlatformController } from './open-platform.controller';
import { OpenPlatformService } from './open-platform.service';

@Module({
  controllers: [OpenPlatformController],
  providers: [OpenPlatformService],
  exports: [OpenPlatformService],
})
export class OpenPlatformModule {}
