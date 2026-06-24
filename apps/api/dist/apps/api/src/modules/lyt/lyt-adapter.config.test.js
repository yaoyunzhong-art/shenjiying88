"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const config_1 = require("@nestjs/config");
const lyt_adapter_config_1 = require("./lyt-adapter.config");
(0, node_test_1.default)('resolveLytHttpAdapterConfig returns sandbox defaults without config service', () => {
    strict_1.default.deepEqual((0, lyt_adapter_config_1.resolveLytHttpAdapterConfig)('sandbox'), {
        baseUrl: 'https://sandbox.lyt.local',
        signingSecret: 'sandbox-lyt-secret',
        timeoutMs: 4000,
        maxRetries: 2
    });
});
(0, node_test_1.default)('resolveLytHttpAdapterConfig returns real defaults without config service', () => {
    strict_1.default.deepEqual((0, lyt_adapter_config_1.resolveLytHttpAdapterConfig)('real'), {
        baseUrl: 'https://api.lyt.local',
        signingSecret: 'real-lyt-secret',
        timeoutMs: 5000,
        maxRetries: 1
    });
});
(0, node_test_1.default)('resolveLytHttpAdapterConfig uses nested ConfigService overrides', () => {
    const config = new config_1.ConfigService({
        lyt: {
            adapters: {
                real: {
                    baseUrl: 'https://lyt-prod.example.com',
                    signingSecret: 'prod-secret',
                    timeoutMs: 9000,
                    maxRetries: 4
                }
            }
        }
    });
    strict_1.default.deepEqual((0, lyt_adapter_config_1.resolveLytHttpAdapterConfig)('real', config), {
        baseUrl: 'https://lyt-prod.example.com',
        signingSecret: 'prod-secret',
        timeoutMs: 9000,
        maxRetries: 4
    });
});
(0, node_test_1.default)('resolveLytHttpAdapterConfig falls back when overrides are blank or invalid', () => {
    const config = new config_1.ConfigService({
        lyt: {
            adapters: {
                sandbox: {
                    baseUrl: '   ',
                    signingSecret: '',
                    timeoutMs: 'NaN',
                    maxRetries: -1
                }
            }
        }
    });
    strict_1.default.deepEqual((0, lyt_adapter_config_1.resolveLytHttpAdapterConfig)('sandbox', config), {
        baseUrl: 'https://sandbox.lyt.local',
        signingSecret: 'sandbox-lyt-secret',
        timeoutMs: 4000,
        maxRetries: 2
    });
});
//# sourceMappingURL=lyt-adapter.config.test.js.map