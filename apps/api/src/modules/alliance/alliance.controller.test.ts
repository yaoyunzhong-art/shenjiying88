/**
 * AllianceController 单元测试 (D-controller spec 补全)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件 + 8 角色视角（👔 店长 🛒 前台 👥 HR 🔧 安监 🎮 导玩员 🎯 运行专员 🤝 团建 📢 营销）
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AllianceController } from './alliance.controller'

// ─── Mock Services ───────────────────────────────────────────────────────────

function createMockServices() {
  const partnerService = {
    register: vi.fn(),
    updatePartner: vi.fn(),
    getPartner: vi.fn(),
    listPartners: vi.fn(),
  }
  const gradingService = {
    getGradeCriteria: vi.fn(),
    calculateGrade: vi.fn(),
    assignGrade: vi.fn(),
    getGrade: vi.fn(),
    autoUpgrade: vi.fn(),
    autoDowngrade: vi.fn(),
  }
  const healthService = {
    calculateHealthScore: vi.fn(),
    getHealthFactors: vi.fn(),
    getHealthTrend: vi.fn(),
    setMetrics: vi.fn(),
  }
  const settlementService = {
    createSettlement: vi.fn(),
    approveSettlement: vi.fn(),
    executeSettlement: vi.fn(),
    querySettlement: vi.fn(),
    getSettlementHistory: vi.fn(),
  }
  const orderDetector = {
    scanUnlinkedOrders: vi.fn(),
    manualLink: vi.fn(),
    autoLinkByRule: vi.fn(),
  }
  const anomalyService = {
    detectUnusualPattern: vi.fn(),
    getAnomalyReport: vi.fn(),
    flagSuspiciousSettlement: vi.fn(),
  }
	return {
		partnerService,
		gradingService,
		healthService,
		settlementService,
		orderDetector,
		anomalyService,
	}
}

function createController(mocks: ReturnType<typeof createMockServices>) {
	return new AllianceController(
		mocks.partnerService as any,
		mocks.gradingService as any,
		mocks.healthService as any,
		mocks.settlementService as any,
		mocks.orderDetector as any,
		mocks.anomalyService as any,
	)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AllianceController', () => {
	let mocks: ReturnType<typeof createMockServices>
	let controller: AllianceController

	beforeEach(() => {
		mocks = createMockServices()
		controller = createController(mocks)
	})

	// ── Partner Registration ────────────────────────────────────

	describe('POST /alliance/partner/register', () => {
		it('【正向】👔 店长 注册新联盟伙伴成功', () => {
			mocks.partnerService.register.mockReturnValue({
				id: 'p-001',
				name: '测试商户',
				businessType: 'RETAIL',
				contact: '13800138000',
				address: '上海市',
				status: 'ACTIVE',
				currentGrade: null,
				healthScore: null,
				registeredAt: '2026-07-01T00:00:00Z',
				updatedAt: '2026-07-01T00:00:00Z',
			})
			const result = controller.registerPartner({
				name: '测试商户',
				businessType: 'RETAIL',
				contact: '13800138000',
				address: '上海市',
			})
			expect(result.success).toBe(true)
			expect(result.data!.id).toBe('p-001')
		})

		it('【边界】🛒 前台 注册重复名称商户应返回错误', () => {
			mocks.partnerService.register.mockImplementation(() => {
				throw new Error('Partner with name "测试商户" already exists')
			})
			const result = controller.registerPartner({
				name: '测试商户',
				businessType: 'RETAIL',
				contact: '13800138000',
				address: '上海市',
			})
			expect(result.success).toBe(false)
			expect(result.message).toContain('already exists')
		})
	})

	describe('PUT /alliance/partner/:partnerId', () => {
		it('【正向】👥 HR 更新伙伴信息成功', () => {
			mocks.partnerService.updatePartner.mockReturnValue({
				id: 'p-001',
				name: '更新后的商户',
				businessType: 'F&B',
				contact: '13900139000',
				address: '北京市',
				status: 'ACTIVE',
				currentGrade: 'B',
				healthScore: 75,
				registeredAt: '2026-06-01T00:00:00Z',
				updatedAt: '2026-07-01T00:00:00Z',
			})
			const result = controller.updatePartner('p-001', {
				name: '更新后的商户',
				businessType: 'F&B',
			})
			expect(result.success).toBe(true)
			expect(result.data!.name).toBe('更新后的商户')
		})

		it('【边界】🔧 安监 更新不存在的伙伴应返回错误', () => {
			mocks.partnerService.updatePartner.mockImplementation(() => {
				throw new Error('Partner p-999 not found')
			})
			const result = controller.updatePartner('p-999', { name: '不存在' })
			expect(result.success).toBe(false)
			expect(result.message).toContain('not found')
		})
	})

	describe('GET /alliance/partner/:partnerId', () => {
		it('【正向】🎮 导玩员 查询伙伴详情成功', () => {
			mocks.partnerService.getPartner.mockReturnValue({
				id: 'p-001',
				name: '联盟伙伴A',
				businessType: 'RETAIL',
				contact: '13800138000',
				address: '上海市',
				status: 'ACTIVE',
				currentGrade: 'A',
				healthScore: 85,
				registeredAt: '2026-06-01T00:00:00Z',
				updatedAt: '2026-07-01T00:00:00Z',
			})
			const result = controller.getPartner('p-001')
			expect(result.success).toBe(true)
			expect(result.data!.name).toBe('联盟伙伴A')
		})

		it('【边界】🎯 运行专员 查询不存在的伙伴应返回错误', () => {
			mocks.partnerService.getPartner.mockReturnValue(null)
			const result = controller.getPartner('p-999')
			expect(result.success).toBe(false)
			expect(result.message).toContain('not found')
		})
	})

	describe('GET /alliance/partner', () => {
		it('【正向】🤝 团建 列出所有伙伴成功', () => {
			mocks.partnerService.listPartners.mockReturnValue([
				{ id: 'p-001', name: '商户A', status: 'ACTIVE' },
				{ id: 'p-002', name: '商户B', status: 'ACTIVE' },
			])
			const result = controller.listPartners({})
			expect(result.success).toBe(true)
			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(2)
		})

		it('【边界】📢 营销 按业务类型过滤返回空列表', () => {
			mocks.partnerService.listPartners.mockReturnValue([])
			const result = controller.listPartners({ businessType: 'TECH' })
			expect(result.success).toBe(true)
			expect(result.data).toHaveLength(0)
			expect(result.total).toBe(0)
		})
	})

	// ── Grading ─────────────────────────────────────────────────

	describe('GET /alliance/grading/criteria', () => {
		it('【正向】👔 店长 获取分级标准成功', () => {
			mocks.gradingService.getGradeCriteria.mockReturnValue([
				{ grade: 'S', minScore: 90, maxScore: 100, label: '金牌伙伴' },
				{ grade: 'A', minScore: 75, maxScore: 89, label: '优质伙伴' },
			])
			const result = controller.getGradeCriteria()
			expect(result.success).toBe(true)
			expect(result.data).toHaveLength(2)
		})
	})

	describe('POST /alliance/grading/:partnerId/calculate', () => {
		it('【正向】🎯 运行专员 计算伙伴等级成功', () => {
			mocks.gradingService.calculateGrade.mockReturnValue('A')
			const result = controller.calculateGrade('p-001')
			expect(result.success).toBe(true)
			expect(result.data!.grade).toBe('A')
		})

		it('【边界】🔧 安监 不存在的伙伴等级计算返回 undefined 等级', () => {
			mocks.gradingService.calculateGrade.mockReturnValue(undefined)
			const result = controller.calculateGrade('p-999')
			expect(result.success).toBe(true)
			expect(result.data!.grade).toBeUndefined()
		})
	})

	describe('PUT /alliance/grading/:partnerId/assign', () => {
		it('【正向】👥 HR 手动指定等级成功', () => {
			mocks.gradingService.assignGrade.mockReturnValue(undefined)
			const result = controller.assignGrade('p-001', { grade: 'S' })
			expect(result.success).toBe(true)
			expect(result.message).toContain('S assigned to p-001')
		})
	})

	describe('POST /alliance/grading/:partnerId/auto-upgrade', () => {
		it('【正向】🎮 导玩员 自动升级触发成功', () => {
			mocks.gradingService.autoUpgrade.mockReturnValue(true)
			const result = controller.autoUpgrade('p-001')
			expect(result.success).toBe(true)
			expect(result.data!.upgraded).toBe(true)
			expect(result.message).toBe('Upgraded!')
		})

		it('【边界】📢 营销 条件不满足时未被升级', () => {
			mocks.gradingService.autoUpgrade.mockReturnValue(false)
			const result = controller.autoUpgrade('p-002')
			expect(result.success).toBe(true)
			expect(result.data!.upgraded).toBe(false)
			expect(result.message).toBe('No upgrade condition met')
		})
	})

	describe('POST /alliance/grading/:partnerId/auto-downgrade', () => {
		it('【正向】🔧 安监 自动降级检测返回未降级', () => {
			mocks.gradingService.autoDowngrade.mockReturnValue(false)
			const result = controller.autoDowngrade('p-001')
			expect(result.success).toBe(true)
			expect(result.data!.downgraded).toBe(false)
		})
	})

	// ── Health Score ────────────────────────────────────────────

	describe('POST /alliance/health/:partnerId/calculate', () => {
		it('【正向】🎯 运行专员 计算健康度成功', () => {
			mocks.healthService.calculateHealthScore.mockReturnValue(85)
			const result = controller.calculateHealth('p-001')
			expect(result.success).toBe(true)
			expect(result.data!.healthScore).toBe(85)
		})
	})

	describe('GET /alliance/health/:partnerId/factors', () => {
		it('【正向】👔 店长 获取健康度因子成功', () => {
			const factors = {
				revenueScore: 80,
				orderScore: 75,
				complaintScore: 90,
				activityScore: 85,
				overall: 82,
			}
			mocks.healthService.getHealthFactors.mockReturnValue(factors)
			const result = controller.getHealthFactors('p-001')
			expect(result.success).toBe(true)
			expect(result.data!.overall).toBe(82)
		})
	})

	describe('GET /alliance/health/:partnerId/trend', () => {
		it('【正向】🤝 团建 获取健康度趋势成功', () => {
			const trend = [
				{ date: '2026-06-01', score: 80 },
				{ date: '2026-06-15', score: 82 },
				{ date: '2026-07-01', score: 85 },
			]
			mocks.healthService.getHealthTrend.mockReturnValue(trend)
			const result = controller.getHealthTrend('p-001')
			expect(result.success).toBe(true)
			expect(result.data).toHaveLength(3)
		})
	})

	describe('POST /alliance/health/:partnerId/metrics', () => {
		it('【正向】🛒 前台 设置指标成功', () => {
			mocks.healthService.setMetrics.mockReturnValue(undefined)
			const result = controller.setMetrics('p-001', {
				revenue: 50000,
				orderCount: 100,
				complaintCount: 2,
				activeDays: 25,
			})
			expect(result.success).toBe(true)
			expect(result.message).toContain('Metrics updated')
		})
	})

	// ── Settlement ──────────────────────────────────────────────

	describe('POST /alliance/settlement/create', () => {
		it('【正向】🛒 前台 创建分账单成功', () => {
			mocks.settlementService.createSettlement.mockReturnValue({
				settlementId: 's-001',
				orderId: 'ord-001',
				type: 'ratio',
				totalAmount: 10000,
				participants: [
					{ partnerId: 'p-001', partnerName: '商户A', ratio: 0.6 },
					{ partnerId: 'p-002', partnerName: '商户B', ratio: 0.4 },
				],
				status: 'pending',
				createdAt: new Date(),
			})
			const result = controller.createSettlement({
				orderId: 'ord-001',
				type: 'ratio',
				totalAmount: 10000,
				participants: [
					{ partnerId: 'p-001', partnerName: '商户A', ratio: 0.6 },
					{ partnerId: 'p-002', partnerName: '商户B', ratio: 0.4 },
				],
			})
			expect(result.success).toBe(true)
			expect(result.data!.settlementId).toBe('s-001')
		})

		it('【边界】👥 HR 分账创建失败时返回错误', () => {
			mocks.settlementService.createSettlement.mockImplementation(() => {
				const err: any = new Error('Invalid participants')
				err.code = 'INVALID_PARAMS'
				throw err
			})
			const result = controller.createSettlement({
				orderId: 'ord-001',
				type: 'ratio',
				totalAmount: 10000,
				participants: [],
			})
			expect(result.success).toBe(false)
			expect(result.message).toContain('Invalid')
		})
	})

	describe('POST /alliance/settlement/:settlementId/approve', () => {
		it('【正向】👔 店长 审批分账成功', () => {
			mocks.settlementService.approveSettlement.mockReturnValue({
				settlementId: 's-001',
				status: 'approved',
				approvedAt: new Date(),
			})
			const result = controller.approveSettlement('s-001')
			expect(result.success).toBe(true)
			expect(result.data!.status).toBe('approved')
		})
	})

	describe('POST /alliance/settlement/:settlementId/execute', () => {
		it('【正向】🎯 运行专员 执行分账成功', () => {
			mocks.settlementService.executeSettlement.mockReturnValue({
				settlementId: 's-001',
				status: 'executed',
				executedAt: new Date(),
			})
			const result = controller.executeSettlement('s-001')
			expect(result.success).toBe(true)
			expect(result.data!.status).toBe('executed')
		})

		it('【边界】🔧 安监 分账执行失败时返回错误', () => {
			mocks.settlementService.executeSettlement.mockImplementation(() => {
				const err: any = new Error('Settlement not approved')
				err.code = 'NOT_APPROVED'
				throw err
			})
			const result = controller.executeSettlement('s-002')
			expect(result.success).toBe(false)
			expect(result.message).toContain('not approved')
		})
	})

	describe('GET /alliance/settlement/:settlementId', () => {
		it('【正向】🤝 团建 查询分账详情成功', () => {
			mocks.settlementService.querySettlement.mockReturnValue({
				settlementId: 's-001',
				orderId: 'ord-001',
				type: 'ratio',
				totalAmount: 10000,
				status: 'approved',
				createdAt: new Date(),
				participants: [],
			})
			const result = controller.querySettlement('s-001')
			expect(result.success).toBe(true)
			expect(result.data!.settlementId).toBe('s-001')
		})

		it('【边界】🎮 导玩员 查询不存在的分账单返回错误', () => {
			mocks.settlementService.querySettlement.mockReturnValue(null)
			const result = controller.querySettlement('s-999')
			expect(result.success).toBe(false)
			expect(result.message).toContain('not found')
		})
	})

	describe('GET /alliance/settlement/history/:partnerId', () => {
		it('【正向】📢 营销 查询分账历史成功', () => {
			mocks.settlementService.getSettlementHistory.mockReturnValue([
				{ settlementId: 's-001', totalAmount: 5000, status: 'executed' },
				{ settlementId: 's-002', totalAmount: 3000, status: 'executed' },
			])
			const result = controller.getSettlementHistory('p-001')
			expect(result.success).toBe(true)
			expect(result.total).toBe(2)
		})

		it('【边界】🛒 前台 无历史分账时返回空数组', () => {
			mocks.settlementService.getSettlementHistory.mockReturnValue([])
			const result = controller.getSettlementHistory('p-999')
			expect(result.success).toBe(true)
			expect(result.data).toHaveLength(0)
			expect(result.total).toBe(0)
		})
	})

	// ── Unlinked Orders ─────────────────────────────────────────

	describe('POST /alliance/order/scan-unlinked', () => {
		it('【正向】🔧 安监 扫描未关联订单成功', () => {
			// 模拟返回的扫描结果
			const orders = [
				{
					orderId: 'ord-001',
					amount: 5000,
					createdAt: new Date('2026-07-01'),
					linkStatus: 'unlinked' as const,
				},
			]
			mocks.orderDetector.scanUnlinkedOrders.mockReturnValue(orders)
			const result = controller.scanUnlinkedOrders({
				storeId: 'store-001',
				since: '2026-06-01T00:00:00Z',
			})
			expect(result.success).toBe(true)
			expect(result.data!.total).toBe(1)
			expect(result.data!.orders[0].orderId).toBe('ord-001')
		})

		it('【边界】🎮 导玩员 扫描无未关联订单返回空列表', () => {
			mocks.orderDetector.scanUnlinkedOrders.mockReturnValue([])
			const result = controller.scanUnlinkedOrders({
				storeId: 'store-001',
				since: '2026-06-01T00:00:00Z',
			})
			expect(result.success).toBe(true)
			expect(result.data!.total).toBe(0)
		})
	})

	describe('POST /alliance/order/:orderId/link', () => {
		it('【正向】📢 营销 手动关联订单成功', () => {
			mocks.orderDetector.manualLink.mockReturnValue({
				orderId: 'ord-001',
				linkedPartnerId: 'p-001',
				linkStatus: 'linked',
			})
			const result = controller.linkOrder('ord-001', { partnerId: 'p-001' })
			expect(result.success).toBe(true)
			expect(result.data!.linkStatus).toBe('linked')
		})

		it('【边界】🤝 团建 关联已关联订单返回错误', () => {
			mocks.orderDetector.manualLink.mockImplementation(() => {
				const err: any = new Error('Order already linked')
				err.code = 'ALREADY_LINKED'
				throw err
			})
			const result = controller.linkOrder('ord-001', { partnerId: 'p-001' })
			expect(result.success).toBe(false)
			expect(result.message).toContain('already linked')
		})
	})

	describe('POST /alliance/order/:orderId/auto-link', () => {
		it('【正向】🎯 运行专员 自动关联订单成功', () => {
			mocks.orderDetector.autoLinkByRule.mockReturnValue({
				linked: true,
				partnerId: 'p-002',
				reason: 'location_proximity',
			})
			const result = controller.autoLinkOrder('ord-001')
			expect(result.success).toBe(true)
			expect((result.data as Record<string, unknown>).partnerId).toBe('p-002')
		})
	})

	// ── Anomaly Detection ───────────────────────────────────────

	describe('POST /alliance/anomaly/detect/:partnerId', () => {
		it('【正向】🔧 安监 检测异常模式成功', () => {
			mocks.anomalyService.detectUnusualPattern.mockReturnValue([
				{ anomalyId: 'a-001', type: 'frequent_small', severity: 'warning', detail: '高频小额交易' },
			])
			const result = controller.detectAnomaly('p-001')
			expect(result.success).toBe(true)
			expect(result.data!.count).toBe(1)
		})

		it('【边界】👔 店长 未检测到异常时返回空列表', () => {
			mocks.anomalyService.detectUnusualPattern.mockReturnValue([])
			const result = controller.detectAnomaly('p-001')
			expect(result.success).toBe(true)
			expect(result.data!.count).toBe(0)
		})
	})

	describe('GET /alliance/anomaly/report/:partnerId', () => {
		it('【正向】🎯 运行专员 获取异常报告成功', () => {
			mocks.anomalyService.getAnomalyReport.mockReturnValue({
				partnerId: 'p-001',
				totalAnomalies: 3,
				warnings: 2,
				criticals: 1,
				records: [
					{ type: 'frequent_small', severity: 'warning', detail: '高频小额' },
					{ type: 'unusual_time', severity: 'critical', detail: '非营业时间交易' },
				],
			})
			const result = controller.getAnomalyReport('p-001')
			expect(result.success).toBe(true)
			expect(result.data!.totalAnomalies).toBe(3)
		})
	})

	describe('POST /alliance/settlement/:settlementId/flag-suspicious', () => {
		it('【正向】🔧 安监 标记可疑分账成功', () => {
			mocks.anomalyService.flagSuspiciousSettlement.mockReturnValue({
				settlementId: 's-001',
				flagged: true,
				reason: '异常定价模式',
			})
			const result = controller.flagSuspicious('s-001')
			expect(result.success).toBe(true)
			expect(result.data!.flagged).toBe(true)
		})
	})
})
