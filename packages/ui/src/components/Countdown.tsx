'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ==================== 类型定义 ====================

export type CountdownStatus = 'running' | 'paused' | 'finished';

export interface CountdownProps {
  /** 剩余秒数 */
  seconds: number;
  /** 倒计时结束回调 */
  onFinish?: () => void;
  /** 每秒回调（当前剩余秒数） */
  onTick?: (remaining: number) => void;
  /** 是否自动开始 (默认 true) */
  autoStart?: boolean;
  /** 自定义格式函数 (默认 mm:ss) */
  format?: (remaining: number) => string;
  /** 自定义类名 */
  className?: string;
  /** 文字颜色 */
  color?: string;
  /** 数字样式 */
  digitStyle?: React.CSSProperties;
  /** 加载态 */
  loading?: boolean;
  /** 测试 id */
  'data-testid'?: string;
}

// ==================== 默认格式 ====================

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function defaultFormat(remaining: number): string {
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${pad(m)}:${pad(s)}`;
}

// ==================== 组件 ====================

export const Countdown: React.FC<CountdownProps> = ({
  seconds,
  onFinish,
  onTick,
  autoStart = true,
  format = defaultFormat,
  className = '',
  color,
  digitStyle,
  loading = false,
  'data-testid': dataTestId,
}) => {
  const [remaining, setRemaining] = useState(seconds);
  const [status, setStatus] = useState<CountdownStatus>(
    autoStart ? 'running' : 'paused'
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setStatus('running');
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearTimer();
          setStatus('finished');
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setStatus('paused');
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setRemaining(seconds);
    setStatus(autoStart ? 'running' : 'paused');
    finishedRef.current = false;
  }, [seconds, autoStart, clearTimer]);

  // onTick 回调
  useEffect(() => {
    if (status === 'running' && onTick) {
      onTick(remaining);
    }
  }, [remaining, status, onTick]);

  // onFinish 回调（只在第一次到达0时触发）
  useEffect(() => {
    if (remaining === 0 && status === 'finished' && !finishedRef.current) {
      finishedRef.current = true;
      onFinish?.();
    }
  }, [remaining, status, onFinish]);

  // seconds prop 变化时重置
  useEffect(() => {
    reset();
  }, [seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // 清理
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  // ---------- 加载态 ----------
  if (loading) {
    const loadingStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 64,
      padding: '4px 8px',
      borderRadius: 4,
      background: '#f3f4f6',
      color: '#9ca3af',
      fontSize: 14,
      ...digitStyle,
    };
    return (
      <span
        className={`m5-countdown m5-countdown--loading ${className}`}
        style={loadingStyle}
        data-testid={dataTestId}
      >
        --:--
      </span>
    );
  }

  // ---------- 正常渲染 ----------
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontVariantNumeric: 'tabular-nums',
    color: color || (status === 'finished' ? '#dc2626' : '#111827'),
    ...digitStyle,
  };

  return (
    <span
      className={`m5-countdown m5-countdown--${status} ${className}`}
      style={containerStyle}
      data-status={status}
      data-testid={dataTestId}
    >
      {format(remaining)}
    </span>
  );
};

// ==================== Hook ====================

export function useCountdown(initialSeconds: number = 0) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [status, setStatus] = useState<CountdownStatus>('paused');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds?: number) => {
      clear();
      if (seconds !== undefined) setRemaining(seconds);
      setStatus('running');
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clear();
            setStatus('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clear]
  );

  const pause = useCallback(() => {
    clear();
    setStatus('paused');
  }, [clear]);

  const reset = useCallback(
    (seconds?: number) => {
      clear();
      setRemaining(seconds ?? initialSeconds);
      setStatus('paused');
    },
    [initialSeconds, clear]
  );

  useEffect(() => {
    return clear;
  }, [clear]);

  return { remaining, status, start, pause, reset };
}
