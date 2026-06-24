"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    app: {
        name: process.env.APP_NAME ?? 'M5',
        port: Number(process.env.API_PORT ?? 3001)
    },
    lyt: {
        mode: process.env.LYT_MODE ?? 'mock',
        defaultStoreId: process.env.LYT_DEFAULT_STORE_ID ?? 'store-demo-001'
    },
    postgres: {
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: Number(process.env.POSTGRES_PORT ?? 5432),
        database: process.env.POSTGRES_DB ?? 'm5_core'
    }
});
//# sourceMappingURL=configuration.js.map