/**
 * Minimal AppContext mock for node:test.
 * Provides useAppContext that reads from globalThis.__mockAppContext.
 */
const React = require('react');

// Create mock context
const AppContext = React.createContext(null);

function useAppContext() {
  const ctx = globalThis.__mockAppContext;
  if (ctx) return ctx;
  return {
    state: {
      session: {
        authenticated: false,
        memberTier: 'GUEST',
        paymentReady: false,
      },
      bootstrap: {
        deliveryMode: 'fallback',
        marketCode: 'cn-mainland',
        defaultLanguage: 'zh-CN',
        timezone: 'Asia/Shanghai',
        emailProvider: 'ALIYUN_DM',
        socialPlatforms: ['WECHAT'],
        primaryDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
        supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP'],
        domainSource: 'default',
        domainGovernance: {
          totalMissingPrimaryScopes: 0,
          totalActiveWithoutPrimaryDomains: 0,
          recommendedReadyScopes: 0,
          tenantMissingPrimaryScopes: 0,
          brandMissingPrimaryScopes: 0,
          storeMissingPrimaryScopes: 0,
          requiresAttention: false,
          lastEvaluatedAt: '1970-01-01T00:00:00.000Z',
          currentScopes: [],
        },
        domainGovernanceWorkspaceHref: '/saas/domains?marketCode=cn-mainland',
      },
      isOfflineMode: false,
      pushNotificationsEnabled: true,
      biometricEnabled: false,
    },
    dispatch: () => {},
    login: () => {},
    logout: () => {},
  };
}

function AppProvider({ children }) {
  return React.createElement(
    AppContext.Provider,
    { value: useAppContext() },
    children,
  );
}

function useBootstrap() {
  const { state } = useAppContext();
  return state.bootstrap;
}

function useSession() {
  const { state } = useAppContext();
  return state.session;
}

module.exports = {
  AppProvider,
  useAppContext,
  useBootstrap,
  useSession,
};
