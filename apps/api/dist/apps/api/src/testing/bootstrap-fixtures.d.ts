export declare function createContractTestFoundationDependencySummary(): {
    dependsOn: string[];
    handoffContracts: string[];
};
export declare function createE2EFoundationDependencySummary(): {
    dependsOn: string[];
    handoffContracts: string[];
};
export declare function createMarketProfileFixture(): {
    marketCode: string;
    marketName: string;
    countryCode: string;
    locale: {
        defaultLanguage: string;
        supportedLanguages: string[];
    };
    timezone: {
        timezone: string;
    };
    currency: {
        currencyCode: string;
        symbol: string;
    };
    tax: {
        taxMode: string;
        taxRate: number;
        taxLabel: string;
    };
    network: {
        networkRegion: string;
        apiBaseUrl: string;
        cdnBaseUrl: string;
        callbackBaseUrl: string;
    };
    email: {
        provider: string;
        fromName: string;
        fromAddress: string;
        replyTo: string;
    };
    social: {
        primaryPlatforms: string[];
        supportPlatforms: string[];
    };
};
export declare function createRegionalOverridesFixture(): ({
    scopeType: string;
    scopeCode: string;
    inheritanceMode: string;
    marketCode: string;
    email: {
        fromName: string;
    };
    social?: undefined;
    timezone?: undefined;
} | {
    scopeType: string;
    scopeCode: string;
    inheritanceMode: string;
    marketCode: string;
    social: {
        primaryPlatforms: string[];
    };
    email?: undefined;
    timezone?: undefined;
} | {
    scopeType: string;
    scopeCode: string;
    inheritanceMode: string;
    marketCode: string;
    timezone: {
        timezone: string;
    };
    email?: undefined;
    social?: undefined;
})[];
export declare function createTenantPortalFixture(): {
    audience: string;
    scopeType: string;
    scopeCode: string;
    tenantCode: string;
    brandCode: undefined;
    marketCode: string;
    channel: string;
    name: string;
    primaryDomain: string;
    supportedLanguages: string[];
    heroTitle: string;
    heroSubtitle: string;
    solutionTags: never[];
    loginEntry: {
        label: string;
        loginPath: string;
        ssoEnabled: boolean;
    };
};
export declare function createBrandPortalFixture(): {
    audience: string;
    scopeType: string;
    scopeCode: string;
    tenantCode: string;
    brandCode: string;
    marketCode: string;
    channel: string;
    name: string;
    primaryDomain: string;
    supportedLanguages: string[];
    heroTitle: string;
    heroSubtitle: string;
    solutionTags: never[];
    loginEntry: {
        label: string;
        loginPath: string;
        ssoEnabled: boolean;
    };
};
export declare function createStorePortalFixture(): {
    audience: string;
    scopeType: string;
    scopeCode: string;
    tenantCode: string;
    brandCode: string;
    storeCode: string;
    storeName: string;
    marketCode: string;
    channel: string;
    name: string;
    primaryDomain: string;
    supportedLanguages: string[];
    supportedSurfaces: string[];
};
export declare function createMinimalTenantContextFixture(): {
    tenantId: string;
};
export declare function createResolvedTenantContextFixture(): {
    tenantId: string;
    brandId: string;
    storeId: string;
    marketCode: string;
};
export declare function createSupportedClientsFixture(): ("PC" | "PAD" | "H5" | "MINIAPP" | "APP")[];
//# sourceMappingURL=bootstrap-fixtures.d.ts.map