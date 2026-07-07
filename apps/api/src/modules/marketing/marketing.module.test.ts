import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [marketing] [A] module 补全 — marketing.module.test.ts
 *
 * 测试 MarketingModule 的模块结构：controller / providers / exports 完整性
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MarketingModule } from './marketing.module'
import { MarketingController } from './marketing.controller'
import { RFMCalculator } from './rfm-calculator'
import { ABTestEngine } from './ab-test'
import { CouponIssuer } from './coupon-issuer'
import { AttributionEngine } from './attribution'
import { SegmentService } from './segment.service'
import { FrequencyCapService } from './frequency-cap.service'
import { ROICalculator } from './roi-calculator'
import { ChannelRouter } from './channel-router'
import { RFMAdapter } from './datasources/rfm.adapter'
import { MemberAdapter } from './datasources/member.adapter'
import { OrderAdapter } from './datasources/order.adapter'
import { ExperimentAdapter } from './datasources/experiment.adapter'
import { CouponAdapter } from './datasources/coupon.adapter'

describe('MarketingModule', () => {
  it('module class should be defined', () => {
    assert.ok(MarketingModule)
    assert.equal(typeof MarketingModule, 'function')
  })

  it('module instance should be constructible', () => {
    const instance = new MarketingModule()
    assert.ok(instance instanceof MarketingModule)
  })

  it('controller should exist and expose expected endpoints', () => {
    assert.ok(MarketingController)
    const proto = MarketingController.prototype

    // RFM endpoints
    assert.equal(typeof proto.computeRFM, 'function', 'computeRFM')
    assert.equal(typeof proto.rfmStats, 'function', 'rfmStats')
    assert.equal(typeof proto.listSegments, 'function', 'listSegments')

    // AB test endpoints
    assert.equal(typeof proto.createExperiment, 'function', 'createExperiment')
    assert.equal(typeof proto.recordEvent, 'function', 'recordEvent')
    assert.equal(typeof proto.abResult, 'function', 'abResult')
    assert.equal(typeof proto.listExperiments, 'function', 'listExperiments')

    // Coupon endpoints
    assert.equal(typeof proto.issueCoupon, 'function', 'issueCoupon')
    assert.equal(typeof proto.autoIssue, 'function', 'autoIssue')
    assert.equal(typeof proto.redeemCoupon, 'function', 'redeemCoupon')
    assert.equal(typeof proto.freqCapStatus, 'function', 'freqCapStatus')

    // Attribution & ROI
    assert.equal(typeof proto.attribute, 'function', 'attribute')
    assert.equal(typeof proto.recordTouch, 'function', 'recordTouch')
    assert.equal(typeof proto.calculateROI, 'function', 'calculateROI')

    // Channel & Health
    assert.equal(typeof proto.routeChannel, 'function', 'routeChannel')
    assert.equal(typeof proto.health, 'function', 'health')
  })

  it('providers should be class-constructible', () => {
    const providers = [
      { name: 'RFMCalculator', cls: RFMCalculator },
      { name: 'ABTestEngine', cls: ABTestEngine },
      { name: 'CouponIssuer', cls: CouponIssuer },
      { name: 'AttributionEngine', cls: AttributionEngine },
      { name: 'SegmentService', cls: SegmentService },
      { name: 'FrequencyCapService', cls: FrequencyCapService },
      { name: 'ROICalculator', cls: ROICalculator },
      { name: 'ChannelRouter', cls: ChannelRouter },
    ]

    // 创建共享 adapter 实例以供构造函数使用
    const rfmAdapter = new RFMAdapter()
    const memberAdapter = new MemberAdapter()
    const orderAdapter = new OrderAdapter()
    const experimentAdapter = new ExperimentAdapter()
    const couponAdapter = new CouponAdapter()
    const _rfmCalc = new RFMCalculator(rfmAdapter, memberAdapter, orderAdapter)

    for (const p of providers) {
      assert.ok(p.cls, `${p.name} class is defined`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctor = p.cls as any
      let instance: unknown
      switch (p.name) {
        case 'RFMCalculator':
          instance = new Ctor(rfmAdapter, memberAdapter, orderAdapter)
          break
        case 'ABTestEngine':
          instance = new Ctor(experimentAdapter)
          break
        case 'CouponIssuer':
          instance = new Ctor(couponAdapter, rfmAdapter)
          break
        case 'AttributionEngine':
          instance = new Ctor()
          break
        case 'SegmentService':
          instance = new Ctor(rfmAdapter, _rfmCalc)
          break
        case 'FrequencyCapService':
          instance = new Ctor(couponAdapter)
          break
        case 'ROICalculator':
          instance = new Ctor()
          break
        case 'ChannelRouter':
          instance = new Ctor()
          break
        default:
          instance = new Ctor()
      }
      assert.ok(instance, `${p.name} instance is constructible`)
    }
  })

  it('controller constructor accepts all providers', () => {
    const rfmAdapter = new RFMAdapter()
    const memberAdapter = new MemberAdapter()
    const orderAdapter = new OrderAdapter()
    const experimentAdapter = new ExperimentAdapter()
    const couponAdapter = new CouponAdapter()
    const rfmCalc = new RFMCalculator(rfmAdapter, memberAdapter, orderAdapter)
    const ab = new ABTestEngine(experimentAdapter)
    const coupon = new CouponIssuer(couponAdapter, rfmAdapter)
    const attr = new AttributionEngine()
    const segment = new SegmentService(rfmAdapter, rfmCalc)
    const freq = new FrequencyCapService(couponAdapter)
    const roi = new ROICalculator()
    const channel = new ChannelRouter()

    const ctrl = new MarketingController(rfmCalc, ab, coupon, attr, segment, freq, roi, channel)
    assert.ok(ctrl instanceof MarketingController)
  })

  it('controller providers are wired correctly', () => {
    const rfmAdapter = new RFMAdapter()
    const memberAdapter = new MemberAdapter()
    const orderAdapter = new OrderAdapter()
    const experimentAdapter = new ExperimentAdapter()
    const couponAdapter = new CouponAdapter()
    const rfmCalc = new RFMCalculator(rfmAdapter, memberAdapter, orderAdapter)
    const ab = new ABTestEngine(experimentAdapter)
    const coupon = new CouponIssuer(couponAdapter, rfmAdapter)
    const attr = new AttributionEngine()
    const segment = new SegmentService(rfmAdapter, rfmCalc)
    const freq = new FrequencyCapService(couponAdapter)
    const roi = new ROICalculator()
    const channel = new ChannelRouter()

    const ctrl = new MarketingController(rfmCalc, ab, coupon, attr, segment, freq, roi, channel)

    // Spot-check that each provider is accessible through controller methods
    assert.ok(ctrl['rfmCalculator'] === rfmCalc)
    assert.ok(ctrl['abTest'] === ab)
    assert.ok(ctrl['couponIssuer'] === coupon)
    assert.ok(ctrl['attribution'] === attr)
    assert.ok(ctrl['segmentService'] === segment)
    assert.ok(ctrl['freqCap'] === freq)
    assert.ok(ctrl['roiCalc'] === roi)
    assert.ok(ctrl['channelRouter'] === channel)
  })
})
