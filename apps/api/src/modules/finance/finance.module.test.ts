import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { FinanceModule } from './finance.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinanceArchivalService } from './finance-archival.service';
import { PrismaModule } from '../../prisma/prisma.module';

describe('FinanceModule', () => {
  it('exposes controller in metadata', () => {
    const controllers: unknown[] = Reflect.getMetadata('controllers', FinanceModule) || [];

    assert.ok(controllers.includes(FinanceController), 'should register FinanceController');
    assert.equal(controllers.length, 4, 'should have exactly 4 controllers (FinanceController + ReconciliationController + FinanceHealthDashboardController + FinanceSettlementController)');
  });

  it('exposes provider in metadata', () => {
    const providers: unknown[] = Reflect.getMetadata('providers', FinanceModule) || [];

    assert.ok(providers.includes(FinanceService), 'should register FinanceService');
    assert.equal(providers.length, 14, 'should have exactly 14 providers');
  });

  it('imports PrismaModule', () => {
    const imports: unknown[] = Reflect.getMetadata('imports', FinanceModule) || [];

    assert.ok(imports.includes(PrismaModule), 'should import PrismaModule');
    assert.equal(imports.length, 1, 'should have exactly 1 import (PrismaModule)');
  });

  it('exports FinanceService', () => {
    const exports: unknown[] = Reflect.getMetadata('exports', FinanceModule) || [];

    assert.ok(exports.includes(FinanceService), 'should export FinanceService');
    assert.equal(exports.length, 8, 'should export exactly 8 symbols (FinanceService, FinanceArchivalService, FinanceInvoiceService, ReconService, ReconciliationService, ReconciliationCron, FinanceReconciliationReportService, FinanceSettlementCron)');
  });

  it('is a valid NestJS Module class', () => {
    // Module metadata key; NestJS decorator sets 'imports', 'controllers', 'providers', 'exports'
    assert.equal(typeof FinanceModule, 'function');
  });

  it('module can be instantiated', () => {
    const instance = new FinanceModule();
    assert.ok(instance instanceof FinanceModule);
  });

  it('controller/provider/import arrays do not overlap', () => {
    const controllers: unknown[] = Reflect.getMetadata('controllers', FinanceModule) || [];
    const providers: unknown[] = Reflect.getMetadata('providers', FinanceModule) || [];
    const imports: unknown[] = Reflect.getMetadata('imports', FinanceModule) || [];
    const exports: unknown[] = Reflect.getMetadata('exports', FinanceModule) || [];

    // FinanceController should only be in controllers
    assert.ok(
      !providers.includes(FinanceController),
      'FinanceController should not be in providers',
    );
    // FinanceService should only be in providers && exports
    assert.ok(!controllers.includes(FinanceService), 'FinanceService should not be in controllers');
    // Module dependencies should only be in imports
    assert.ok(!controllers.includes(PrismaModule), 'PrismaModule should not be in controllers');
    assert.ok(!providers.includes(PrismaModule), 'PrismaModule should not be in providers');
    assert.ok(!exports.includes(FinanceController), 'export should not include controller');
  });
});
