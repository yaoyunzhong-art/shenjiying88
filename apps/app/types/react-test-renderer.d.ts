declare module 'react-test-renderer' {
  import type { ReactElement, ComponentType } from 'react';

  export interface ReactTestInstance {
    props: any;
    root: ReactTestInstance;
    findAllByType(type: unknown): ReactTestInstance[];
    findByType(type: unknown): ReactTestInstance;
  }

  export interface ReactTestRenderer {
    root: ReactTestInstance;
    update(element: ReactElement): void;
    unmount(): void;
  }

  export function create(element: ReactElement): ReactTestRenderer;
  export function act<T>(callback: () => T | Promise<T>): Promise<void>;
  export type ReactTestRendererJSON = unknown;
  export type ReactTestRendererTree = unknown;
  export type TestRendererOptions = Record<string, unknown>;
  export type ReactTestRendererType = string | ComponentType<unknown>;
}
