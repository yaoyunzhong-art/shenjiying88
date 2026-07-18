import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import {
  NativeAppSession,
  NativeAppBootstrapSnapshot,
  createNativeAppFallbackSnapshot,
  createGuestNativeSession,
  loadNativeAppBootstrapSnapshot,
} from '../market-bootstrap';

interface AppState {
  session: NativeAppSession;
  bootstrap: NativeAppBootstrapSnapshot;
  isOfflineMode: boolean;
  pushNotificationsEnabled: boolean;
  biometricEnabled: boolean;
}

type AppAction =
  | { type: 'SET_SESSION'; payload: NativeAppSession }
  | { type: 'SET_BOOTSTRAP'; payload: NativeAppBootstrapSnapshot }
  | { type: 'SET_OFFLINE_MODE'; payload: boolean }
  | { type: 'SET_PUSH_NOTIFICATIONS'; payload: boolean }
  | { type: 'SET_BIOMETRIC'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  session: createGuestNativeSession(),
  bootstrap: createNativeAppFallbackSnapshot(),
  isOfflineMode: false,
  pushNotificationsEnabled: true,
  biometricEnabled: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_BOOTSTRAP':
      return { ...state, bootstrap: action.payload };
    case 'SET_OFFLINE_MODE':
      return { ...state, isOfflineMode: action.payload };
    case 'SET_PUSH_NOTIFICATIONS':
      return { ...state, pushNotificationsEnabled: action.payload };
    case 'SET_BIOMETRIC':
      return { ...state, biometricEnabled: action.payload };
    case 'LOGOUT':
      return {
        ...state,
        session: createGuestNativeSession(),
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (session: NativeAppSession) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    let cancelled = false;

    loadNativeAppBootstrapSnapshot().then((snapshot) => {
      if (!cancelled) {
        dispatch({ type: 'SET_BOOTSTRAP', payload: snapshot });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (session: NativeAppSession) => {
    dispatch({ type: 'SET_SESSION', payload: session });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export function useSession(): NativeAppSession {
  const { state } = useAppContext();
  return state.session;
}

export function useBootstrap(): NativeAppBootstrapSnapshot {
  const { state } = useAppContext();
  return state.bootstrap;
}
