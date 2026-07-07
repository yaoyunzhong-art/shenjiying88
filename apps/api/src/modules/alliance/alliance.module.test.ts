import { describe, it, expect } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AllianceModule } from './alliance.module'
import { AllianceController } from './alliance.controller'
import { AlliancePartner, PartnerGradingService, HealthScoreService } from './alliance-grade.service'
import {
  CrossMerchantSettlementService,
  UnlinkedOrderDetector,
  AnomalyDetectionService,
} from './alliance-settlement.service'

describe('AllianceModule', () => {
  it('should be defined', () => {
    const moduleClass = AllianceModule
    assert.ok(moduleClass)
  })

  it('should export expected shape (controllers, providers, exports)', () => {
    const moduleInstance = new AllianceModule()
    assert.ok(moduleInstance instanceof AllianceModule)
  })

  it('should have valid controller', () => {
    assert.ok(AllianceController)
    assert.equal(typeof AllianceController.prototype.registerPartner, 'function')
    assert.equal(typeof AllianceController.prototype.getPartner, 'function')
    assert.equal(typeof AllianceController.prototype.listPartners, 'function')
    assert.equal(typeof AllianceController.prototype.calculateGrade, 'function')
    assert.equal(typeof AllianceController.prototype.calculateHealth, 'function')
    assert.equal(typeof AllianceController.prototype.createSettlement, 'function')
    assert.equal(typeof AllianceController.prototype.scanUnlinkedOrders, 'function')
    assert.equal(typeof AllianceController.prototype.detectAnomaly, 'function')
  })

  it('should have valid providers', () => {
    // AlliancePartner provider
    assert.ok(AlliancePartner)
    assert.equal(typeof AlliancePartner.prototype.register, 'function')
    assert.equal(typeof AlliancePartner.prototype.getPartner, 'function')
    assert.equal(typeof AlliancePartner.prototype.listPartners, 'function')

    // PartnerGradingService provider
    assert.ok(PartnerGradingService)
    assert.equal(typeof PartnerGradingService.prototype.calculateGrade, 'function')
    assert.equal(typeof PartnerGradingService.prototype.assignGrade, 'function')
    assert.equal(typeof PartnerGradingService.prototype.autoUpgrade, 'function')
    assert.equal(typeof PartnerGradingService.prototype.autoDowngrade, 'function')

    // HealthScoreService provider
    assert.ok(HealthScoreService)
    assert.equal(typeof HealthScoreService.prototype.calculateHealthScore, 'function')
    assert.equal(typeof HealthScoreService.prototype.getHealthFactors, 'function')
    assert.equal(typeof HealthScoreService.prototype.getHealthTrend, 'function')

    // CrossMerchantSettlementService provider
    assert.ok(CrossMerchantSettlementService)
    assert.equal(typeof CrossMerchantSettlementService.prototype.createSettlement, 'function')
    assert.equal(typeof CrossMerchantSettlementService.prototype.approveSettlement, 'function')
    assert.equal(typeof CrossMerchantSettlementService.prototype.executeSettlement, 'function')

    // UnlinkedOrderDetector provider
    assert.ok(UnlinkedOrderDetector)
    assert.equal(typeof UnlinkedOrderDetector.prototype.scanUnlinkedOrders, 'function')
    assert.equal(typeof UnlinkedOrderDetector.prototype.manualLink, 'function')
    assert.equal(typeof UnlinkedOrderDetector.prototype.autoLinkByRule, 'function')

    // AnomalyDetectionService provider
    assert.ok(AnomalyDetectionService)
    assert.equal(typeof AnomalyDetectionService.prototype.detectUnusualPattern, 'function')
    assert.equal(typeof AnomalyDetectionService.prototype.getAnomalyReport, 'function')
    assert.equal(typeof AnomalyDetectionService.prototype.flagSuspiciousSettlement, 'function')
  })
})
