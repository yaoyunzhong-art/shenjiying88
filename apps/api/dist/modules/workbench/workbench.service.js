"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbenchService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@m5/domain");
const types_1 = require("@m5/types");
const bootstrap_contract_1 = require("../bootstrap/bootstrap.contract");
const foundation_service_1 = require("../foundation/foundation.service");
const market_service_1 = require("../market/market.service");
const market_contract_1 = require("../market/market.contract");
const portal_service_1 = require("../portal/portal.service");
const workbench_contract_1 = require("./workbench.contract");
let WorkbenchService = class WorkbenchService {
    marketService;
    portalService;
    foundationService;
    constructor(marketService, portalService, foundationService) {
        this.marketService = marketService;
        this.portalService = portalService;
        this.foundationService = foundationService;
    }
    getRoleWorkbenches() {
        return [
            {
                role: domain_1.UserRole.SuperAdmin,
                channel: domain_1.ClientChannel.Pc,
                title: '总部总控台',
                description: '平台级租户、审计、安全和全局基础设施入口。',
                marketCodes: ['cn-mainland', 'us-default'],
                navItems: [
                    { key: 'tenants', label: '租户管理', href: '/workbench/super-admin', description: '租户开通、关停和能力授权' },
                    { key: 'audit', label: '审计中心', href: '/workbench/super-admin', description: '全局日志、风控与可疑行为' },
                    { key: 'markets', label: '国际化治理', href: '/workbench/super-admin', description: '市场默认值、网络区、邮箱与税务策略' }
                ]
            },
            {
                role: domain_1.UserRole.TenantAdmin,
                channel: domain_1.ClientChannel.Pc,
                title: '租户经营台',
                description: '品牌矩阵、门店网络、渠道编排和目标管理入口。',
                marketCodes: ['cn-mainland', 'us-default'],
                navItems: [
                    { key: 'brands', label: '品牌矩阵', href: '/workbench/tenant-admin', description: '品牌和门店结构管理' },
                    { key: 'channels', label: '渠道编排', href: '/workbench/tenant-admin', description: '官网、H5、小程序、App、Pad 能力开关' },
                    { key: 'tob', label: '租户 ToB 官网', href: '/workbench/tenant-admin', description: '租户营销官网、登录入口和域名策略' },
                    { key: 'regional', label: '国际化配置', href: '/workbench/tenant-admin', description: '国家、语言、时区、税务、网络和社媒覆盖策略' }
                ]
            },
            {
                role: domain_1.UserRole.BrandManager,
                channel: domain_1.ClientChannel.Pc,
                title: '品牌经营台',
                description: '品牌活动、会员分层、商品服务、品牌 ToB 官网与区域化投放。',
                marketCodes: ['cn-mainland', 'us-default'],
                navItems: [
                    { key: 'members', label: '会员运营', href: '/workbench/brand-manager', description: '等级、积分、SVIP 和券策略' },
                    { key: 'campaigns', label: '营销投放', href: '/workbench/brand-manager', description: '官网 / H5 / 小程序 / App 联动' },
                    { key: 'brandPortal', label: '品牌 ToB 官网', href: '/workbench/brand-manager', description: '品牌招商、加盟合作和品牌登录入口' },
                    { key: 'marketPolicy', label: '市场与本地化', href: '/workbench/brand-manager', description: '品牌级国家、语言、税务和社媒覆盖配置' }
                ]
            },
            {
                role: domain_1.UserRole.StoreManager,
                channel: domain_1.ClientChannel.Pc,
                title: '店长经营台',
                description: '门店日运营、预约排队、活动执行和日报。',
                marketCodes: ['cn-mainland', 'us-default'],
                navItems: [
                    { key: 'daily', label: '门店日报', href: '/workbench/store-manager', description: '营收、客流和异常预警' },
                    { key: 'service', label: '现场调度', href: '/workbench/store-manager', description: '排班、预约、排队和现场资源' }
                ]
            },
            {
                role: domain_1.UserRole.Guide,
                channel: domain_1.ClientChannel.Pad,
                title: '导购工作台',
                description: '客户接待、会员推荐、裂变推广与线索跟进。',
                marketCodes: ['cn-mainland', 'us-default'],
                navItems: [
                    { key: 'crm', label: '会员接待', href: '/workbench/guide', description: '画像、标签、推荐和回访' },
                    { key: 'promo', label: '推广转化', href: '/workbench/guide', description: '推广码、活动分享与线索转化' }
                ]
            },
            {
                role: domain_1.UserRole.Cashier,
                channel: domain_1.ClientChannel.Pad,
                title: '收银台',
                description: '收银、核销、储值、退款和弱网离线兜底。',
                marketCodes: ['cn-mainland', 'us-default'],
                navItems: [
                    { key: 'checkout', label: '收银核销', href: '/workbench/cashier', description: '订单、积分、券和盲盒支付' },
                    { key: 'offline', label: '离线模式', href: '/workbench/cashier', description: '弱网同步和离线容错' }
                ]
            }
        ];
    }
    getBootstrap(context) {
        const marketProfile = this.marketService.getMergedProfile(context);
        const portals = this.portalService.getBootstrap(context);
        const foundationDependency = this.foundationService.getDependencySummary('workbench');
        return {
            tenantContext: (0, workbench_contract_1.toTenantContextContract)(context),
            workbenches: this.getRoleWorkbenches().map(workbench_contract_1.toRoleWorkbenchContract),
            storePortals: [portals.storePortal],
            tenantPortal: portals.tenantPortal,
            brandPortal: portals.brandPortal,
            marketProfile: (0, market_contract_1.toMarketProfileContract)(marketProfile),
            regionalLoginPolicies: (0, bootstrap_contract_1.toRegionalLoginPolicyContract)(portals.tenantPortal.loginEntry.loginPath, portals.tenantPortal.loginEntry.ssoEnabled),
            supportedLocales: marketProfile.locale.supportedLanguages,
            supportedClients: [...types_1.foundationSupportedClients],
            ...(0, bootstrap_contract_1.toBootstrapFoundationMetadata)(foundationDependency)
        };
    }
};
exports.WorkbenchService = WorkbenchService;
exports.WorkbenchService = WorkbenchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [market_service_1.MarketService,
        portal_service_1.PortalService,
        foundation_service_1.FoundationService])
], WorkbenchService);
//# sourceMappingURL=workbench.service.js.map