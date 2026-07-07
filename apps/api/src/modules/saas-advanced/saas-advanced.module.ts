/**
 * Phase 96 SaaS Advanced Module (V10 Sprint 2 Day 23)
 *
 * 包含:
 * - Custom Domain (Day 22)
 * - SSO (Day 23) - SAML 2.0 + OIDC
 */

import { Module, Global } from '@nestjs/common'
import { CustomDomainService } from './custom-domain.service'
import { CustomDomainController } from './custom-domain.controller'
import { SsoService } from './sso.service'
import { SsoController } from './sso.controller'

@Global()
@Module({
  providers: [CustomDomainService, SsoService],
  controllers: [CustomDomainController, SsoController],
  exports: [CustomDomainService, SsoService],
})
export class SaasAdvancedModule {}