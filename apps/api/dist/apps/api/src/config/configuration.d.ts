declare const _default: () => {
    app: {
        name: string;
        port: number;
    };
    lyt: {
        mode: string;
        defaultStoreId: string;
        adapters: {
            sandbox: {
                baseUrl: string;
                signingSecret: string;
                timeoutMs: number;
                maxRetries: number;
            };
            real: {
                baseUrl: string;
                signingSecret: string;
                timeoutMs: number;
                maxRetries: number;
            };
        };
    };
    postgres: {
        databaseUrl: string;
        host: string;
        port: number;
        database: string;
    };
};
export default _default;
//# sourceMappingURL=configuration.d.ts.map