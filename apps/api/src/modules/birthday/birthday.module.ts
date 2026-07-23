// birthday.module.ts · WP-15 生日趴引擎

import { Module } from '@nestjs/common';
import { BirthdayController } from './birthday.controller';
import { BirthdayService } from './birthday.service';

@Module({
  controllers: [BirthdayController],
  providers: [BirthdayService],
  exports: [BirthdayService],
})
export class BirthdayModule {}
