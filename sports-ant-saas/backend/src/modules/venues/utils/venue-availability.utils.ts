/**
 * 场地可用性工具函数
 * 提供场地可用性计算和验证功能
 */

import { Venue } from '../entities/venue.entity';

/**
 * 场地可用性状态
 */
export enum VenueAvailabilityStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
}

/**
 * 将Venue状态映射到可用性状态
 * @param venueStatus - 场地状态字符串
 * @returns 对应的可用性状态
 * @example
 * mapVenueStatusToAvailabilityStatus('active') // VenueAvailabilityStatus.AVAILABLE
 * mapVenueStatusToAvailabilityStatus('maintenance') // VenueAvailabilityStatus.MAINTENANCE
 */
function mapVenueStatusToAvailabilityStatus(venueStatus: string): VenueAvailabilityStatus {
  switch (venueStatus) {
    case 'active':
      return VenueAvailabilityStatus.AVAILABLE;
    case 'maintenance':
      return VenueAvailabilityStatus.MAINTENANCE;
    case 'closed':
      return VenueAvailabilityStatus.CLOSED;
    case 'inactive':
      return VenueAvailabilityStatus.CLOSED;
    default:
      return VenueAvailabilityStatus.CLOSED;
  }
}

/**
 * 场地可用性检查选项
 */
export interface VenueAvailabilityOptions {
  date: Date;
  startTime: string; // HH:mm格式
  endTime: string;   // HH:mm格式
  ignoreMaintenance?: boolean;
}

/**
 * 场地可用性结果
 */
export interface VenueAvailabilityResult {
  status: VenueAvailabilityStatus;
  isAvailable: boolean;
  reason?: string;
  nextAvailableTime?: Date;
}

/**
 * 检查场地是否可用
 * @param venue 场地信息
 * @param options 可用性检查选项
 * @returns 可用性结果
 */
export function checkVenueAvailability(
  venue: Venue,
  options: VenueAvailabilityOptions,
): VenueAvailabilityResult {
  // 检查场地状态
  if (venue.status !== 'active') {
    let reason = '场地未启用';
    if (venue.status === 'maintenance') {
      reason = '场地正在维护中';
    } else if (venue.status === 'closed') {
      reason = '场地已关闭';
    }
    
    return {
      status: mapVenueStatusToAvailabilityStatus(venue.status),
      isAvailable: false,
      reason,
    };
  }

  // 检查营业时间
  if (!isWithinBusinessHours(venue, options)) {
    return {
      status: VenueAvailabilityStatus.CLOSED,
      isAvailable: false,
      reason: '不在营业时间内',
    };
  }

  // 检查容量
  if (venue.capacity <= 0) {
    return {
      status: VenueAvailabilityStatus.CLOSED,
      isAvailable: false,
      reason: '场地容量为0',
    };
  }

  // 默认可用
  return {
    status: VenueAvailabilityStatus.AVAILABLE,
    isAvailable: true,
  };
}

/**
 * 检查时间是否在营业时间内
 * @param venue 场地信息
 * @param options 可用性检查选项
 * @returns 是否在营业时间内
 */
function isWithinBusinessHours(
  venue: Venue,
  options: VenueAvailabilityOptions,
): boolean {
  // 如果没有设置营业时间，默认全天营业
  if (!venue.openingHours) {
    return true;
  }

  // 简化：假设每天都有相同的营业时间
  // 在实际应用中，需要根据openingHours JSON解析具体日期的营业时间
  const startTime = parseTimeString(options.startTime);
  const endTime = parseTimeString(options.endTime);
  
  // 默认营业时间：09:00-21:00
  const defaultOpeningTime = parseTimeString('09:00');
  const defaultClosingTime = parseTimeString('21:00');

  // 检查开始时间是否在营业时间之后
  if (startTime < defaultOpeningTime) {
    return false;
  }

  // 检查结束时间是否在营业时间之前
  if (endTime > defaultClosingTime) {
    return false;
  }

  // 检查时间段是否有效
  if (endTime <= startTime) {
    return false;
  }

  return true;
}

/**
 * 解析时间字符串为分钟数
 * @param timeString - 时间字符串 (HH:mm格式)
 * @returns 从00:00开始的分钟数
 * @throws {Error} 当时间格式无效时
 * @example
 * parseTimeString('09:30') // 570 (9*60 + 30)
 * parseTimeString('14:45') // 885 (14*60 + 45)
 */
function parseTimeString(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // 验证时间格式
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time format: ${timeString}. Expected HH:mm format.`);
  }
  
  return hours * 60 + minutes;
}

/**
 * 计算场地的最早可用时间
 * @param venue 场地信息
 * @param currentTime 当前时间
 * @returns 最早可用时间
 */
export function calculateNextAvailableTime(
  venue: Venue,
  currentTime: Date = new Date(),
): Date | null {
  // 如果场地状态为active，立即可用
  if (venue.status === 'active') {
    return currentTime;
  }

  // 其他状态返回null
  return null;
}

/**
 * 验证场地容量是否足够
 * @param venue 场地信息
 * @param requiredCapacity 所需容量
 * @returns 容量是否足够
 */
export function validateVenueCapacity(
  venue: Venue,
  requiredCapacity: number,
): boolean {
  if (venue.status !== 'active') {
    return false;
  }

  if (venue.capacity <= 0) {
    return false;
  }

  return requiredCapacity <= venue.capacity;
}

/**
 * 获取场地的推荐时间段
 * @param venue 场地信息
 * @param durationMinutes 持续时间（分钟）
 * @param date 日期
 * @returns 推荐时间段列表
 */
export function getRecommendedTimeSlots(
  venue: Venue,
  durationMinutes: number,
  date: Date = new Date(),
): Array<{ startTime: string; endTime: string }> {
  const slots: Array<{ startTime: string; endTime: string }> = [];

  // 默认营业时间：09:00-21:00
  const openingTime = parseTimeString('09:00');
  const closingTime = parseTimeString('21:00');

  // 生成时间段
  let currentTime = openingTime;
  while (currentTime + durationMinutes <= closingTime) {
    const startTime = formatMinutesToTime(currentTime);
    const endTime = formatMinutesToTime(currentTime + durationMinutes);

    slots.push({ startTime, endTime });

    // 默认30分钟间隔
    currentTime += Math.max(durationMinutes, 30);
  }

  return slots;
}

/**
 * 将分钟数格式化为时间字符串
 * @param minutes - 从00:00开始的分钟数
 * @returns HH:mm格式的时间字符串
 * @throws {Error} 当分钟数无效时
 * @example
 * formatMinutesToTime(570) // '09:30'
 * formatMinutesToTime(885) // '14:45'
 */
function formatMinutesToTime(minutes: number): string {
  if (minutes < 0 || minutes >= 24 * 60) {
    throw new Error(`Invalid minutes: ${minutes}. Must be between 0 and ${24 * 60 - 1}.`);
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * 计算场地的使用率
 * @param venue 场地信息
 * @param bookedHours 已预订小时数
 * @param periodHours 统计周期小时数
 * @returns 使用率 (0-1)
 */
export function calculateVenueUtilization(
  venue: Venue,
  bookedHours: number,
  periodHours: number,
): number {
  if (periodHours <= 0) {
    return 0;
  }

  // 计算最大可用小时数
  let maxAvailableHours = periodHours;

  // 默认营业时间：09:00-21:00，每天12小时
  const dailyHours = 12; // 21:00 - 09:00 = 12小时
  const days = Math.ceil(periodHours / 24);
  maxAvailableHours = dailyHours * days;

  if (maxAvailableHours <= 0) {
    return 0;
  }

  return Math.min(bookedHours / maxAvailableHours, 1);
}