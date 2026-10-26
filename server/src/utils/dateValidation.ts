import {
  parseISO,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  format,
} from 'date-fns';
import { dataStore } from '../services/dataStore.js';
import { timeToMinutes } from '../services/scheduler.js';

export interface TimezoneDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dateString: string; // YYYY-MM-DD
  timeString: string; // HH:mm
}

/**
 * Returns formatted calendar parts for a given Date in a specific IANA time zone.
 * Falls back safely to UTC if the timezone string is invalid or unrecognised.
 */
export function getDateInTimezone(date: Date = new Date(), timezone: string = 'UTC'): TimezoneDateParts {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const map: Record<string, string> = {};
    parts.forEach((p) => {
      map[p.type] = p.value;
    });

    const year = parseInt(map.year, 10);
    const month = parseInt(map.month, 10);
    const day = parseInt(map.day, 10);
    const hour = parseInt(map.hour || '0', 10);
    const minute = parseInt(map.minute || '0', 10);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      year,
      month,
      day,
      hour,
      minute,
      dateString: `${year}-${pad(month)}-${pad(day)}`,
      timeString: `${pad(hour)}:${pad(minute)}`,
    };
  } catch {
    // Fallback to UTC
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      year,
      month,
      day,
      hour,
      minute,
      dateString: `${year}-${pad(month)}-${pad(day)}`,
      timeString: `${pad(hour)}:${pad(minute)}`,
    };
  }
}

/**
 * Normalizes any date input (string or Date) into a standard Date object.
 */
export function toDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  // If date-only string like "YYYY-MM-DD", parse as local calendar day
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  return new Date(input);
}

/**
 * Extracts "YYYY-MM-DD" from either a Date object or a date string.
 */
export function toDateOnlyString(input: string | Date, timezone: string = 'UTC'): string {
  if (typeof input === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      return getDateInTimezone(d, timezone).dateString;
    }
    return input.substring(0, 10);
  }
  return getDateInTimezone(input, timezone).dateString;
}

/**
 * Checks if a date-only field (like an Exam Date or Plan Start Date) is strictly before today.
 * Today is NOT considered in the past. Yesterday or earlier IS considered in the past.
 */
export function isDateOnlyInPast(input: string | Date, timezone: string = 'UTC'): boolean {
  const inputStr = toDateOnlyString(input, timezone);
  const now = new Date();
  const todayStr = getDateInTimezone(now, timezone).dateString;

  return inputStr < todayStr;
}

/**
 * Checks if an exact timestamp (scheduled start or reminder) is in the past.
 * Provides a 60-second grace tolerance to avoid race conditions during network latency.
 */
export function isDateTimeInPast(input: string | Date, graceSeconds: number = 60): boolean {
  const d = toDate(input);
  const nowMs = Date.now();
  const allowedFloorMs = nowMs - graceSeconds * 1000;
  return d.getTime() < allowedFloorMs;
}

/**
 * Checks if an end datetime is strictly later than a start datetime.
 */
export function isEndAfterStart(start: string | Date, end: string | Date): boolean {
  const s = toDate(start);
  const e = toDate(end);
  return e.getTime() > s.getTime();
}

/**
 * Verifies if the proposed session time overlaps with any existing scheduled/active session.
 * Missed and cancelled sessions do not block scheduling.
 */
export async function checkSessionOverlap(
  userId: string,
  start: Date,
  end: Date,
  excludeSessionId?: string
): Promise<{ overlaps: boolean; conflictingSession?: any }> {
  const allSessions = await dataStore.findStudySessions(userId);

  for (const sess of allSessions) {
    if (excludeSessionId && sess._id.toString() === excludeSessionId) {
      continue;
    }
    // Only scheduled, in_progress, and rescheduled sessions can overlap
    if (sess.status === 'cancelled' || sess.status === 'missed') {
      continue;
    }

    const sessStart = toDate(sess.scheduledStart);
    const sessEnd = toDate(sess.scheduledEnd);

    // Two intervals [start, end] and [sessStart, sessEnd] overlap if:
    // start < sessEnd AND end > sessStart
    if (isBefore(start, sessEnd) && isAfter(end, sessStart)) {
      return { overlaps: true, conflictingSession: sess };
    }
  }

  return { overlaps: false };
}

/**
 * Validates that a session falls within the user's enabled availability hours for that day of week.
 * If user has no availability slots configured at all, returns valid by default.
 */
export async function checkSessionAvailability(
  userId: string,
  start: Date,
  end: Date,
  timezone: string = 'UTC'
): Promise<{ inBounds: boolean; reason?: string }> {
  const availability = await dataStore.findAvailabilityByUserId(userId);

  // If user has not configured any availability, do not block
  if (!availability || availability.length === 0) {
    return { inBounds: true };
  }

  // Get day of week and times in user's timezone
  const startParts = getDateInTimezone(start, timezone);
  const endParts = getDateInTimezone(end, timezone);

  // JavaScript getUTCDay() or calculated day
  // To get accurate day-of-week in target timezone:
  const targetDate = new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day, 12, 0, 0));
  const dayOfWeek = targetDate.getUTCDay();

  // Find enabled availability slots for this day of week
  const daySlots = availability.filter((a) => a.enabled && a.dayOfWeek === dayOfWeek);

  if (daySlots.length === 0) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      inBounds: false,
      reason: `You have no study hours configured or enabled for ${days[dayOfWeek]}. Please adjust your availability in Settings.`,
    };
  }

  const sessionStartMin = startParts.hour * 60 + startParts.minute;
  const sessionEndMin = (endParts.dateString === startParts.dateString ? endParts.hour * 60 + endParts.minute : 24 * 60);

  // Check if session falls within at least one configured slot
  const fitsInSlot = daySlots.some((slot) => {
    const slotStartMin = timeToMinutes(slot.startTime);
    const slotEndMin = timeToMinutes(slot.endTime);
    return sessionStartMin >= slotStartMin && sessionEndMin <= slotEndMin;
  });

  if (!fitsInSlot) {
    const slotsSummary = daySlots.map((s) => `${s.startTime} - ${s.endTime}`).join(', ');
    return {
      inBounds: false,
      reason: `Session time (${startParts.timeString} – ${endParts.timeString}) is outside your configured study availability for this day (${slotsSummary}).`,
    };
  }

  return { inBounds: true };
}
