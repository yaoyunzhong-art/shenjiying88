import { Global, Module } from '@nestjs/common'
import { IdentityAccessController } from './identity-access.controller'
import { IdentityAccessGuard } from './identity-access.guard'
import { IdentityAccessService } from './identity-access.service'

@Global()
@Module({
  controllers: [IdentityAccessController],
  providers: [IdentityAccessService, IdentityAccessGuard],
  exports: [IdentityAccessService, IdentityAccessGuard]
})
export class IdentityAccessModule {}
