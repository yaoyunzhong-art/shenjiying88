// sandbox.module.ts - T116-2
// 沙箱模块

import { Module } from '@nestjs/common';
import { SandboxController } from './sandbox.controller';
import { SandboxService, ISVAppStore, SDKMultiLangService, SandboxIsvService } from './sandbox-isv.service';

@Module({
  controllers: [SandboxController],
  providers: [SandboxService, ISVAppStore, SDKMultiLangService, SandboxIsvService],
  exports: [SandboxService, ISVAppStore, SDKMultiLangService, SandboxIsvService],
})
export class SandboxModule {}
