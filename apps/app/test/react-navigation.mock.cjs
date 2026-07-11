/**
 * Minimal @react-navigation/native mock for node:test + react-test-renderer.
 * Avoids useDocumentTitle "document is not defined" error and
 * provides a working useNavigation for unit tests.
 */
const React = require('react');

// Simple mock context
const NavigationContext = React.createContext(null);

// The mock navigation object tests can configure via globalThis
const defaultMockNavigation = {
  navigate: (route, params) => {},
  goBack: () => {},
  reset: (state) => {},
  dispatch: (action) => {},
  addListener: (event, callback) => () => {},
  isFocused: () => true,
};

function useNavigation() {
  return globalThis.__mockNavigation || defaultMockNavigation;
}

function useRoute() {
  return { params: {}, key: 'mock', name: 'Mock' };
}

function NavigationContainer({ children }) {
  return React.createElement(
    React.Fragment,
    null,
    children,
  );
}

module.exports = {
  NavigationContainer,
  useNavigation,
  useRoute,
  useFocusEffect: (effect) => {
    React.useEffect(effect, []);
  },
  useIsFocused: () => true,
  useNavigationState: (selector) => selector({ routes: [], index: 0 }),
  useTheme: () => ({ colors: { primary: '#000', background: '#fff', card: '#fff', text: '#000', border: '#ccc' }, dark: false }),
  DefaultTheme: { colors: { primary: '#000', background: '#fff', card: '#fff', text: '#000', border: '#ccc' }, dark: false },
  DarkTheme: { colors: { primary: '#fff', background: '#000', card: '#000', text: '#fff', border: '#333' }, dark: true },
  NavigationContext,
  NavigationHelpersContext: React.createContext(null),
  NavigationContainerRefContext: React.createContext(null),
  NavigationRouteContext: React.createContext(null),
  CurrentRenderContext: React.createContext(undefined),
  ThemeProvider: ({ children }) => children,
  Link: ({ children, to, action, ...rest }) => React.createElement('a', { href: to }, children),
  LinkingContext: React.createContext({ options: {} }),
  ServerContainer: React.Fragment,
  BaseNavigationContainer: ({ children }) => React.createElement(React.Fragment, null, children),
};
