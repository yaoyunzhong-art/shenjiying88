import 'reflect-metadata';
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ReferralController } from './referral.controller';
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator';

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ReferralController);

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ReferralController);

describe('ReferralController metadata', () => {
  const readHandlers = [
    ReferralController.prototype.getCode,
    ReferralController.prototype.getMetrics,
    ReferralController.prototype.listRecords,
    ReferralController.prototype.listRewards,
  ];

  const writeHandlers = [
    ReferralController.prototype.generateCode,
    ReferralController.prototype.trackClick,
    ReferralController.prototype.trackSignup,
    ReferralController.prototype.issueRewards,
  ];

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {});
    });
  });

  it('read routes should reuse foundation.governance.read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.read']);
    });
  });

  it('write routes should reuse foundation.governance.write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.write']);
    });
  });
});
