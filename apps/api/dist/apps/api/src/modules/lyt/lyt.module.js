"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LytModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const foundation_module_1 = require("../foundation/foundation.module");
const loyalty_module_1 = require("../loyalty/loyalty.module");
const member_module_1 = require("../member/member.module");
const transactions_module_1 = require("../transactions/transactions.module");
const campaign_module_1 = require("../campaign/campaign.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const mock_lyt_adapter_1 = require("./adapters/mock-lyt.adapter");
const real_lyt_adapter_1 = require("./adapters/real-lyt.adapter");
const sandbox_lyt_adapter_1 = require("./adapters/sandbox-lyt.adapter");
const lyt_adapter_registry_1 = require("./lyt-adapter.registry");
const lyt_connection_manager_1 = require("./lyt-connection.manager");
const lyt_controller_1 = require("./lyt.controller");
const lyt_governance_query_service_1 = require("./lyt-governance-query.service");
const lyt_service_1 = require("./lyt.service");
let LytModule = class LytModule {
};
exports.LytModule = LytModule;
exports.LytModule = LytModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            foundation_module_1.FoundationModule,
            loyalty_module_1.LoyaltyModule,
            member_module_1.MemberModule,
            transactions_module_1.TransactionsModule,
            campaign_module_1.CampaignModule,
            prisma_module_1.PrismaModule
        ],
        controllers: [lyt_controller_1.LytController],
        providers: [
            mock_lyt_adapter_1.MockLytAdapter,
            sandbox_lyt_adapter_1.SandboxLytAdapter,
            real_lyt_adapter_1.RealLytAdapter,
            lyt_adapter_registry_1.LytAdapterRegistry,
            lyt_connection_manager_1.LytConnectionManager,
            lyt_governance_query_service_1.LytGovernanceQueryService,
            lyt_service_1.LytService
        ],
        exports: [
            mock_lyt_adapter_1.MockLytAdapter,
            sandbox_lyt_adapter_1.SandboxLytAdapter,
            real_lyt_adapter_1.RealLytAdapter,
            lyt_adapter_registry_1.LytAdapterRegistry,
            lyt_connection_manager_1.LytConnectionManager,
            lyt_governance_query_service_1.LytGovernanceQueryService,
            lyt_service_1.LytService
        ]
    })
], LytModule);
//# sourceMappingURL=lyt.module.js.map