import { Module } from '@nestjs/common';
import { BlindboxService } from './blindbox.service';
import { BlindboxController } from './blindbox.controller';

@Module({
  controllers: [BlindboxController],
  providers: [BlindboxService],
  exports: [BlindboxService],
})
export class BlindboxModule {}
