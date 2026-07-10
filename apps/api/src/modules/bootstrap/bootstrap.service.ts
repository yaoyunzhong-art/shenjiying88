import { Injectable } from '@nestjs/common';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { toBootstrapFoundationMetadata } from './bootstrap.contract';

export interface BootstrapHealthResponse {
  status: 'ok';
  uptime: number;
  phase: 'scaffold';
}

export interface BootstrapMetadataResponse {
  tenantContext: RequestTenantContext;
  foundationDependencies: string[];
  foundationContracts: string[];
  phase: 'scaffold';
}

@Injectable()
export class BootstrapService {
  /**
   * Returns bootstrap health with uptime.
   * Delegated from BootstrapController.getHealth().
   */
  getHealth(): BootstrapHealthResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      phase: 'scaffold'
    };
  }

  /**
   * Returns bootstrap metadata for the given tenant context.
   * Delegated from BootstrapController.getBootstrapMetadata().
   */
  getBootstrapMetadata(
    tenantContext: RequestTenantContext
  ): BootstrapMetadataResponse {
    const foundation = toBootstrapFoundationMetadata(undefined);
    return {
      tenantContext,
      ...foundation,
      phase: 'scaffold'
    };
  }
}
