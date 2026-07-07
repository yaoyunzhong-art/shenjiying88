import { Module } from '@nestjs/common'
import { SecurityController } from './security.controller'
import { SecurityScannerService } from './security-scanner.service'
import { WAFService } from './waf.service'

@Module({
  controllers: [SecurityController],
  providers: [SecurityScannerService, WAFService],
  exports: [SecurityScannerService, WAFService],
})
export class SecurityModule {}
