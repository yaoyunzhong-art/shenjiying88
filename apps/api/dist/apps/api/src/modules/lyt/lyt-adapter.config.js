"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLytHttpAdapterConfig = resolveLytHttpAdapterConfig;
const LYT_HTTP_ADAPTER_DEFAULTS = {
    sandbox: {
        baseUrl: 'https://sandbox.lyt.local',
        signingSecret: 'sandbox-lyt-secret',
        timeoutMs: 4000,
        maxRetries: 2
    },
    real: {
        baseUrl: 'https://api.lyt.local',
        signingSecret: 'real-lyt-secret',
        timeoutMs: 5000,
        maxRetries: 1
    }
};
function pickString(value, fallback) {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}
function pickNumber(value, fallback) {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
function resolveLytHttpAdapterConfig(mode, configService) {
    const defaults = LYT_HTTP_ADAPTER_DEFAULTS[mode];
    if (!configService) {
        return defaults;
    }
    const prefix = `lyt.adapters.${mode}`;
    return {
        baseUrl: pickString(configService.get(`${prefix}.baseUrl`), defaults.baseUrl),
        signingSecret: pickString(configService.get(`${prefix}.signingSecret`), defaults.signingSecret),
        timeoutMs: pickNumber(configService.get(`${prefix}.timeoutMs`), defaults.timeoutMs),
        maxRetries: pickNumber(configService.get(`${prefix}.maxRetries`), defaults.maxRetries)
    };
}
//# sourceMappingURL=lyt-adapter.config.js.map