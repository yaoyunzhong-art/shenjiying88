"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidation = envValidation;
const requiredStringKeys = [
    'JWT_SECRET',
    'DATABASE_URL',
    'REDIS_HOST',
    'LYT_MODE'
];
const requiredNumberKeys = ['API_PORT', 'REDIS_PORT'];
function envValidation(config) {
    for (const key of requiredStringKeys) {
        const value = config[key];
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`Missing required env: ${key}`);
        }
    }
    validateDatabaseUrl(config.DATABASE_URL);
    for (const key of requiredNumberKeys) {
        const value = config[key];
        const parsed = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            throw new Error(`Invalid numeric env: ${key}`);
        }
    }
    return config;
}
function validateDatabaseUrl(value) {
    if (typeof value !== 'string') {
        throw new Error('Missing required env: DATABASE_URL');
    }
    try {
        const url = new URL(value);
        const supportedProtocols = new Set(['postgres:', 'postgresql:']);
        if (!supportedProtocols.has(url.protocol)) {
            throw new Error(`Unsupported DATABASE_URL protocol: ${url.protocol}`);
        }
    }
    catch (error) {
        throw new Error(error instanceof Error && error.message.startsWith('Unsupported DATABASE_URL protocol:')
            ? error.message
            : 'Invalid DATABASE_URL');
    }
}
//# sourceMappingURL=env.validation.js.map