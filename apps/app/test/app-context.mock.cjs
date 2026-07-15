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
      session: { id: 'test-session', role: 'shop_manager' },
      bootstrap: {},
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
