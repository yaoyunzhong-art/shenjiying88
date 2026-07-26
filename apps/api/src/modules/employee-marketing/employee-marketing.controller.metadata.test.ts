import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { EmployeeMarketingController } from './employee-marketing.controller'

describe('EmployeeMarketingController metadata', () => {
  it('controller should keep employee-marketing path', () => {
    assert.equal(Reflect.getMetadata('path', EmployeeMarketingController), 'employee-marketing')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [EmployeeMarketingController.prototype.createPromoCode, 1, 'promo-code'],
      [EmployeeMarketingController.prototype.listPromoCodes, 0, 'promo-codes'],
      [EmployeeMarketingController.prototype.trackPromotion, 1, 'track'],
      [EmployeeMarketingController.prototype.getEmployeeStats, 0, 'stats/:employeeId'],
      [EmployeeMarketingController.prototype.customerOptOut, 1, 'customer/opt-out/:trackingId'],
      [EmployeeMarketingController.prototype.unbindTracking, 1, 'customer/unbind/:trackingId'],
      [EmployeeMarketingController.prototype.createKpiConfig, 1, 'kpi/config'],
      [EmployeeMarketingController.prototype.getKpiDefaults, 0, 'kpi/config-defaults/:positionType'],
      [EmployeeMarketingController.prototype.getKpiResults, 0, 'kpi/:employeeId'],
      [EmployeeMarketingController.prototype.submitKpiResult, 1, 'kpi/submit'],
      [EmployeeMarketingController.prototype.getPeakRest, 0, 'peak-rest/:employeeId'],
      [EmployeeMarketingController.prototype.getLeaderboard, 0, 'leaderboard'],
      [EmployeeMarketingController.prototype.getLeaderboardLive, 0, 'leaderboard/live'],
      [EmployeeMarketingController.prototype.createTask, 1, 'tasks'],
      [EmployeeMarketingController.prototype.getEmployeeTasks, 0, 'tasks/:employeeId'],
      [EmployeeMarketingController.prototype.replaceTask, 1, 'tasks/:taskId/replace'],
      [EmployeeMarketingController.prototype.appealTask, 1, 'tasks/:taskId/appeal'],
      [EmployeeMarketingController.prototype.getAvailableTasks, 0, 'tasks/available/:employeeId'],
      [EmployeeMarketingController.prototype.autoMatchMentor, 1, 'mentor/match'],
      [EmployeeMarketingController.prototype.getMentorRelations, 0, 'mentor/:employeeId'],
      [EmployeeMarketingController.prototype.updateCoachingScore, 1, 'mentor/coaching-score'],
      [EmployeeMarketingController.prototype.earnBadge, 1, 'badges/earn'],
      [EmployeeMarketingController.prototype.getBadges, 0, 'badges/:employeeId'],
      [EmployeeMarketingController.prototype.checkReservePool, 0, 'badges/check-reserve/:employeeId'],
      [EmployeeMarketingController.prototype.postToCircle, 1, 'circle/post'],
      [EmployeeMarketingController.prototype.getCircleFeed, 0, 'circle/feed'],
      [EmployeeMarketingController.prototype.getMorningShareMaterial, 0, 'morning-share'],
      [EmployeeMarketingController.prototype.registerKol, 1, 'kol/register'],
      [EmployeeMarketingController.prototype.approveKol, 1, 'kol/approve/:id'],
      [EmployeeMarketingController.prototype.getKolLeaderboard, 0, 'kol/leaderboard'],
      [EmployeeMarketingController.prototype.checkCompliance, 1, 'compliance/check'],
      [EmployeeMarketingController.prototype.leaderboardLive, 0, 'leaderboard/live'],
      [EmployeeMarketingController.prototype.pushPromotionCase, 1, 'knowledge/push'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
