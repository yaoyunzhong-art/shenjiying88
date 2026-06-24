"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidation = envValidation;
function envValidation(config) {
    const requiredKeys = ['JWT_SECRET'];
    for (const key of requiredKeys) {
        if (!config[key]) {
            throw new Error(`Missing required env: ${key}`);
        }
    }
    return config;
}
//# sourceMappingURL=env.validation.js.map