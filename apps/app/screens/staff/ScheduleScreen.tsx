import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

interface ScheduleItem {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  shift: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'OFF';
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED';
}

const mockSchedule: ScheduleItem[] = [
  {
    id: 'schedule-001',
    staffId: 'staff-001',
    staffName: '李明',
    date: '2026-07-04',
    shift: 'MORNING',
    status: 'CONFIRMED',
  },
  {
    id: 'schedule-002',
    staffId: 'staff-002',
    staffName: '王芳',
    date: '2026-07-04',
    shift: 'AFTERNOON',
    status: 'SCHEDULED',
  },
  {
    id: 'schedule-003',
    staffId: 'staff-003',
    staffName: '张伟',
    date: '2026-07-04',
    shift: 'EVENING',
    status: 'SCHEDULED',
  },
  {
    id: 'schedule-004',
    staffId: 'staff-001',
    staffName: '李明',
    date: '2026-07-05',
    shift: 'MORNING',
    status: 'SCHEDULED',
  },
  {
    id: 'schedule-005',
    staffId: 'staff-002',
    staffName: '王芳',
    date: '2026-07-05',
    shift: 'OFF',
    status: 'CONFIRMED',
  },
];

const shiftLabels: Record<ScheduleItem['shift'], { label: string; time: string }> = {
  MORNING: { label: '早班', time: '07:00 - 15:00' },
  AFTERNOON: { label: '中班', time: '15:00 - 23:00' },
  EVENING: { label: '晚班', time: '23:00 - 07:00' },
  OFF: { label: '休息', time: '-' },
};

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

export function ScheduleScreen() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [schedule] = useState<ScheduleItem[]>(mockSchedule);

  const getWeekDates = () => {
    const today = new Date(currentWeek);
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getScheduleByDateAndShift = (date: Date, shift: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedule.find((item) => item.date === dateStr && item.shift === shift);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const handleSchedulePress = (item: ScheduleItem) => {
    Alert.alert(
      `${item.staffName} - ${shiftLabels[item.shift].label}`,
      `日期: ${item.date}\n时间: ${shiftLabels[item.shift].time}\n状态: ${
        item.status === 'SCHEDULED' ? '已排班' : item.status === 'CONFIRMED' ? '已确认' : '已完成'
      }`,
      [
        { text: '关闭' },
        { text: '修改', onPress: () => console.log('Modify schedule') },
      ]
    );
  };

  const renderShiftCell = (date: Date, shift: ScheduleItem['shift']) => {
    const item = getScheduleByDateAndShift(date, shift);
    if (!item) {
      return (
        <TouchableOpacity
          key={shift}
          style={[styles.shiftCell, styles.emptyCell]}
          onPress={() => Alert.alert('提示', '请选择员工和班次')}
        >
          <Text style={styles.emptyCellText}>+</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        key={shift}
        style={[
          styles.shiftCell,
          item.status === 'CONFIRMED' && styles.confirmedCell,
          item.status === 'COMPLETED' && styles.completedCell,
        ]}
        onPress={() => handleSchedulePress(item)}
      >
        <Text style={styles.shiftCellName}>{item.staffName}</Text>
        <Text style={styles.shiftCellShift}>{shiftLabels[item.shift].label}</Text>
      </TouchableOpacity>
    );
  };

  const renderDayColumn = (date: Date) => {
    const shifts: ScheduleItem['shift'][] = ['MORNING', 'AFTERNOON', 'EVENING', 'OFF'];
    return (
      <View key={date.toISOString()} style={styles.dayColumn}>
        <View style={[styles.dayHeader, isToday(date) && styles.todayHeader]}>
          <Text style={[styles.dayText, isToday(date) && styles.todayText]}>
            周{weekDays[date.getDay()]}
          </Text>
          <Text style={[styles.dateText, isToday(date) && styles.todayText]}>
            {formatDate(date)}
          </Text>
        </View>
        {shifts.map((shift) => renderShiftCell(date, shift))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevWeek}>
          <Text style={styles.navButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.weekTitle}>
          {weekDates[0]!.getMonth() + 1}月{weekDates[0]!.getDate()}日 -{' '}
          {weekDates[6]!.getMonth() + 1}月{weekDates[6]!.getDate()}日
        </Text>
        <TouchableOpacity onPress={handleNextWeek}>
          <Text style={styles.navButton}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.shiftLabels}>
        <View style={styles.shiftLabelRow}>
          <View style={[styles.shiftLabel, styles.morningLabel]}>
            <Text style={styles.shiftLabelText}>早班</Text>
          </View>
        </View>
        <View style={styles.shiftLabelRow}>
          <View style={[styles.shiftLabel, styles.afternoonLabel]}>
            <Text style={styles.shiftLabelText}>中班</Text>
          </View>
        </View>
        <View style={styles.shiftLabelRow}>
          <View style={[styles.shiftLabel, styles.eveningLabel]}>
            <Text style={styles.shiftLabelText}>晚班</Text>
          </View>
        </View>
        <View style={styles.shiftLabelRow}>
          <View style={[styles.shiftLabel, styles.offLabel]}>
            <Text style={styles.shiftLabelText}>休息</Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scheduleScroll}
      >
        {weekDates.map(renderDayColumn)}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.scheduledDot]} />
          <Text style={styles.legendText}>已排班</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.confirmedDot]} />
          <Text style={styles.legendText}>已确认</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.completedDot]} />
          <Text style={styles.legendText}>已完成</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: '300',
    paddingHorizontal: 16,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  shiftLabels: {
    position: 'absolute',
    left: 0,
    top: 70,
    zIndex: 10,
    paddingLeft: 8,
  },
  shiftLabelRow: {
    marginBottom: 4,
  },
  shiftLabel: {
    width: 50,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morningLabel: {
    backgroundColor: '#34C759',
  },
  afternoonLabel: {
    backgroundColor: '#007AFF',
  },
  eveningLabel: {
    backgroundColor: '#5856D6',
  },
  offLabel: {
    backgroundColor: '#999999',
  },
  shiftLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleScroll: {
    flex: 1,
    paddingTop: 70,
    paddingLeft: 60,
  },
  dayColumn: {
    marginRight: 8,
    width: 80,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 4,
  },
  todayHeader: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  todayText: {
    color: '#FFFFFF',
  },
  shiftCell: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyCell: {
    borderStyle: 'dashed',
    borderColor: '#CCCCCC',
  },
  emptyCellText: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  confirmedCell: {
    backgroundColor: '#34C75920',
    borderColor: '#34C759',
  },
  completedCell: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  shiftCellName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  shiftCellShift: {
    fontSize: 10,
    color: '#666666',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  scheduledDot: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  confirmedDot: {
    backgroundColor: '#34C759',
  },
  completedDot: {
    backgroundColor: '#007AFF',
  },
  legendText: {
    fontSize: 12,
    color: '#666666',
  },
});
