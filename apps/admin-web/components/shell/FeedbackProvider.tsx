'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import { useToast, ToastContainer } from '@m5/ui';

interface FeedbackCtx {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const Ctx = createContext<FeedbackCtx>({
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

export function useCrudFeedback() { return useContext(Ctx); }

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { toasts, success, error, warning, info, dismiss } = useToast();
  return (
    <Ctx.Provider value={{ success: (m) => success(m), error: (m) => error(m), warning: (m) => warning(m), info: (m) => info(m) }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} position="top-right" />
    </Ctx.Provider>
  );
}
