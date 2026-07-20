export {};

declare global {
  interface GlobalThis {
    __mockNavigation?: {
      navigate?: (route: string, params?: Record<string, unknown>) => void;
      goBack?: () => void;
    };
    __mockAppContext?: unknown;
    __mockRoute?: Record<string, unknown>;
    __mockOrderFetchEnabled?: boolean;
    __mockOrderListFetchEnabled?: boolean;
  }
}
