/**
 * 排班管理页 — Staff Scheduling Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🛒前台主管
 * 类型: D-角色操作界面
 * 功能: 门店排班查看、排班表编辑、排班冲突检测
 */
'use client';

import React, { useState, useCallback } from 'react';
import {
  PageShell,
  StaffShiftSchedulePanel,
  type ShiftSlot,
} from '@m5/ui';

// ============================================================
// Mock 数据
// ============================================================

function generateMockShifts(): ShiftSlot[] {
  const days: ShiftSlot[] = [];
  const staff = [
    { staffId: 's1', staffName: '张三', role: '收银员', startTime: '08:00', endTime: '16:00' },
    { staffId: 's2', staffName: '李四', role: '导购员', startTime: '12:00', endTime: '20:00' },
    { staffId: 's3', staffName: '王五', role: '收银员', startTime: '08:00', endTime: '16:00' },
    { staffId: 's4', staffName: '赵六', role: '导购员', startTime: '16:00', endTime: '00:00' },
  ];
  const shiftLabels = ['早班', '中班', '晚班'];

  // 生成接下来 7 天的排班
  for (let i = 0; i < 7; i++) {
    const d = new Date(2026, 5, 29 + i); // 从 2026-06-29 开始
    const dateStr = d.toISOString().slice(0, 10);
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];

    // 每天分配 2-3 名员工，轮换排班
    const count = (i % 3) + 2; // 2,3,4 循环
    const assignments = staff.slice(0, count).map((s, idx) => ({
      staffId: s.staffId,
      staffName: s.staffName,
      role: s.role,
      shiftLabel: `${shiftLabels[idx % 3]} ${i % 2 === 0 ? s.startTime : '14:00'}-${i % 2 === 0 ? s.endTime : '22:00'}`,
      startTime: i % 2 === 0 ? s.startTime : '14:00',
      endTime: i % 2 === 0 ? s.endTime : '22:00',
    }));

    days.push({ date: dateStr, dayLabel: `周${weekday}`, assignments });
  }
  return days;
}

const MOCK_SHIFTS = generateMockShifts();

const MOCK_AVAILABLE_STAFF = [
  { id: 's1', name: '张三', role: '收银员' },
  { id: 's2', name: '李四', role: '导购员' },
  { id: 's3', name: '王五', role: '收银员' },
  { id: 's4', name: '赵六', role: '导购员' },
  { id: 's5', name: '孙七', role: '收银员' },
  { id: 's6', name: '周八', role: '导购员' },
];

// ============================================================
// 排班管理页面
// ============================================================

export default function SchedulingPage() {
  const [shifts, setShifts] = useState<ShiftSlot[]>(MOCK_SHIFTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleAddShift = useCallback(
    async (date: string, staffId: string, shiftLabel: string) => {
      setLoading(true);
      setError(undefined);
      try {
        // 模拟异步添加
        await new Promise((resolve) => setTimeout(resolve, 500));

        const staff = MOCK_AVAILABLE_STAFF.find((s) => s.id === staffId);
        if (!staff) {
          throw new Error(`未找到员工: ${staffId}`);
        }

        // 解析班次时间
        const timeMatch = shiftLabel.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        const startTime = (timeMatch ? timeMatch[1] : '08:00') as string;
        const endTime = (timeMatch ? timeMatch[2] : '16:00') as string;

        // 冲突检测
        const targetDay = shifts.find((s) => s.date === date);
        if (targetDay) {
          const conflict = targetDay.assignments.find(
            (a) =>
              a.staffId === staffId &&
              a.startTime === startTime &&
              a.endTime === endTime
          );
          if (conflict) {
            throw new Error(`${staff.name} 在 ${date} ${shiftLabel} 已有排班`);
          }
        }

        setShifts((prev) =>
          prev.map((slot) =>
            slot.date === date
              ? {
                  ...slot,
                  assignments: [
                    ...slot.assignments,
                    {
                      staffId: staff.id,
                      staffName: staff.name,
                      role: staff.role,
                      shiftLabel: `${shiftLabel} ${startTime}-${endTime}`,
                      startTime,
                      endTime,
                    },
                  ],
                }
              : slot
          )
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '添加排班失败');
      } finally {
        setLoading(false);
      }
    },
    [shifts]
  );

  const handleRemoveShift = useCallback(
    async (date: string, staffId: string) => {
      setLoading(true);
      setError(undefined);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setShifts((prev) =>
          prev.map((slot) =>
            slot.date === date
              ? {
                  ...slot,
                  assignments: slot.assignments.filter(
                    (a) => a.staffId !== staffId
                  ),
                }
              : slot
          )
        );
      } catch {
        setError('移除排班失败');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <PageShell
      title="排班管理"
      description="门店员工排班查看与编辑，支持早中晚班配置"
    >
      <StaffShiftSchedulePanel
        shifts={shifts}
        availableStaff={MOCK_AVAILABLE_STAFF}
        onAddShift={handleAddShift}
        onRemoveShift={handleRemoveShift}
        loading={loading}
        error={error}
        data-testid="scheduling-panel"
      />
    </PageShell>
  );
}
