"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const contract_assertions_1 = require("../../testing/contract-assertions");
const bootstrap_fixtures_1 = require("../../testing/bootstrap-fixtures");
const market_service_1 = require("./market.service");
(0, node_test_1.default)('contract: market bootstrap shape', () => {
    const foundationService = {
        getDependencySummary: () => (0, bootstrap_fixtures_1.createContractTestFoundationDependencySummary)()
    };
    const service = new market_service_1.MarketService(foundationService);
    const bootstrap = service.getBootstrap();
    (0, contract_assertions_1.assertExactKeys)(bootstrap, [
        'defaultDomesticMarketCode',
        'defaultInternationalMarketCode',
        'supportedMarkets',
        'foundationDependencies',
        'foundationContracts'
    ]);
    strict_1.default.equal(typeof bootstrap.defaultDomesticMarketCode, 'string');
    strict_1.default.equal(typeof bootstrap.defaultInternationalMarketCode, 'string');
    strict_1.default.equal(Array.isArray(bootstrap.supportedMarkets), true);
    strict_1.default.equal(Array.isArray(bootstrap.foundationDependencies), true);
    strict_1.default.equal(Array.isArray(bootstrap.foundationContracts), true);
    strict_1.default.deepEqual(bootstrap.foundationDependencies, ['identity-access', 'configuration-governance']);
    strict_1.default.deepEqual(bootstrap.foundationContracts, ['contract-a']);
    strict_1.default.equal(bootstrap.supportedMarkets.length, 2);
    strict_1.default.deepEqual(bootstrap.supportedMarkets.map((market) => market.marketCode), ['cn-mainland', 'us-default']);
    for (const market of bootstrap.supportedMarkets) {
        (0, contract_assertions_1.assertExactKeys)(market, [
            'marketCode',
            'marketName',
            'countryCode',
            'locale',
            'timezone',
            'currency',
            'tax',
            'network',
            'email',
            'social'
        ]);
        (0, contract_assertions_1.assertExactKeys)(market.tax, ['taxMode', 'taxRate', 'taxLabel']);
        (0, contract_assertions_1.assertExactKeys)(market.network, ['networkRegion', 'apiBaseUrl', 'cdnBaseUrl', 'callbackBaseUrl']);
        (0, contract_assertions_1.assertExactKeys)(market.email, ['provider', 'fromName', 'fromAddress', 'replyTo']);
    }
});
//# sourceMappingURL=market-bootstrap.contract.test.js.map