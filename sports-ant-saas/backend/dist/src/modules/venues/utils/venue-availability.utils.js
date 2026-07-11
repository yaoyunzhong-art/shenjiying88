"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenueAvailabilityStatus = void 0;
exports.checkVenueAvailability = checkVenueAvailability;
exports.calculateNextAvailableTime = calculateNextAvailableTime;
exports.validateVenueCapacity = validateVenueCapacity;
exports.getRecommendedTimeSlots = getRecommendedTimeSlots;
exports.calculateVenueUtilization = calculateVenueUtilization;
var VenueAvailabilityStatus;
(function (VenueAvailabilityStatus) {
    VenueAvailabilityStatus["AVAILABLE"] = "available";
    VenueAvailabilityStatus["BOOKED"] = "booked";
    VenueAvailabilityStatus["MAINTENANCE"] = "maintenance";
    VenueAvailabilityStatus["CLOSED"] = "closed";
})(VenueAvailabilityStatus || (exports.VenueAvailabilityStatus = VenueAvailabilityStatus = {}));
function mapVenueStatusToAvailabilityStatus(venueStatus) {
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
function checkVenueAvailability(venue, options) {
    if (venue.status !== 'active') {
        let reason = '场地未启用';
        if (venue.status === 'maintenance') {
            reason = '场地正在维护中';
        }
        else if (venue.status === 'closed') {
            reason = '场地已关闭';
        }
        return {
            status: mapVenueStatusToAvailabilityStatus(venue.status),
            isAvailable: false,
            reason,
        };
    }
    if (!isWithinBusinessHours(venue, options)) {
        return {
            status: VenueAvailabilityStatus.CLOSED,
            isAvailable: false,
            reason: '不在营业时间内',
        };
    }
    if (venue.capacity <= 0) {
        return {
            status: VenueAvailabilityStatus.CLOSED,
            isAvailable: false,
            reason: '场地容量为0',
        };
    }
    return {
        status: VenueAvailabilityStatus.AVAILABLE,
        isAvailable: true,
    };
}
function isWithinBusinessHours(venue, options) {
    if (!venue.openingHours) {
        return true;
    }
    const startTime = parseTimeString(options.startTime);
    const endTime = parseTimeString(options.endTime);
    const defaultOpeningTime = parseTimeString('09:00');
    const defaultClosingTime = parseTimeString('21:00');
    if (startTime < defaultOpeningTime) {
        return false;
    }
    if (endTime > defaultClosingTime) {
        return false;
    }
    if (endTime <= startTime) {
        return false;
    }
    return true;
}
function parseTimeString(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error(`Invalid time format: ${timeString}. Expected HH:mm format.`);
    }
    return hours * 60 + minutes;
}
function calculateNextAvailableTime(venue, currentTime = new Date()) {
    if (venue.status === 'active') {
        return currentTime;
    }
    return null;
}
function validateVenueCapacity(venue, requiredCapacity) {
    if (venue.status !== 'active') {
        return false;
    }
    if (venue.capacity <= 0) {
        return false;
    }
    return requiredCapacity <= venue.capacity;
}
function getRecommendedTimeSlots(venue, durationMinutes, date = new Date()) {
    const slots = [];
    const openingTime = parseTimeString('09:00');
    const closingTime = parseTimeString('21:00');
    let currentTime = openingTime;
    while (currentTime + durationMinutes <= closingTime) {
        const startTime = formatMinutesToTime(currentTime);
        const endTime = formatMinutesToTime(currentTime + durationMinutes);
        slots.push({ startTime, endTime });
        currentTime += Math.max(durationMinutes, 30);
    }
    return slots;
}
function formatMinutesToTime(minutes) {
    if (minutes < 0 || minutes >= 24 * 60) {
        throw new Error(`Invalid minutes: ${minutes}. Must be between 0 and ${24 * 60 - 1}.`);
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
function calculateVenueUtilization(venue, bookedHours, periodHours) {
    if (periodHours <= 0) {
        return 0;
    }
    let maxAvailableHours = periodHours;
    const dailyHours = 12;
    const days = Math.ceil(periodHours / 24);
    maxAvailableHours = dailyHours * days;
    if (maxAvailableHours <= 0) {
        return 0;
    }
    return Math.min(bookedHours / maxAvailableHours, 1);
}
//# sourceMappingURL=venue-availability.utils.js.map