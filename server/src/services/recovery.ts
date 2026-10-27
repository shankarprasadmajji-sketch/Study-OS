import { addDays, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import {
  AvailabilitySlot,
  SubjectInput,
  TopicInput,
  timeToMinutes,
  minutesToDate,
  calculateTopicPriority,
} from './scheduler.js';

export interface RecoverySessionInput {
  id: string;
  planId: string;
  topicId: string;
  subjectId: string;
  scheduledStart: string | Date;
  scheduledEnd: string | Date;
  plannedMinutes: number;
  actualMinutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled' | 'rescheduled';
}

export interface RecoveryInput {
  missedSessionId: string;
  allSessions: RecoverySessionInput[];
  subjects: SubjectInput[];
  topics: TopicInput[];
  availability: AvailabilitySlot[];
  horizonEndDate: string | Date;
  preferredSessionMinutes?: number;
  breakMinutes?: number;
}

export interface RecoveryProposal {
  missedSessionId: string;
  originalTopicTitle: string;
  originalSubjectName: string;
  rescheduledSessions: Array<{
    topicId: string;
    subjectId: string;
    title: string;
    subjectName: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    plannedMinutes: number;
  }>;
  explanation: string;
  feasible: boolean;
  warnings: string[];
}

export function recoverMissedSession(input: RecoveryInput): RecoveryProposal {
  const missedSession = input.allSessions.find((s) => s.id === input.missedSessionId);
  if (!missedSession) {
    throw new Error(`Session with ID ${input.missedSessionId} not found.`);
  }

  const topic = input.topics.find((t) => t.id === missedSession.topicId);
  const subject = input.subjects.find((s) => s.id === missedSession.subjectId);
  const topicTitle = topic?.title || 'Unknown Topic';
  const subjectName = subject?.name || 'Unknown Subject';

  // Workload to recover
  const minutesToRecover = missedSession.plannedMinutes;
  const preferredSession = input.preferredSessionMinutes || 50;
  const breakMinutes = input.breakMinutes || 10;
  const warnings: string[] = [];

  const now = new Date();
  const horizonEnd = typeof input.horizonEndDate === 'string' ? parseISO(input.horizonEndDate) : new Date(input.horizonEndDate);

  // Future occupied slots (completed or already scheduled future sessions)
  const existingFutureSessions = input.allSessions.filter((s) => {
    if (s.id === input.missedSessionId) return false;
    if (s.status === 'cancelled' || s.status === 'missed') return false;
    const start = typeof s.scheduledStart === 'string' ? parseISO(s.scheduledStart) : new Date(s.scheduledStart);
    return isAfter(start, now);
  });

  // Generate future availability windows starting from tomorrow morning (or next available window)
  interface AvailWindow {
    date: Date;
    startMin: number;
    endMin: number;
  }

  const windows: AvailWindow[] = [];
  let curDay = startOfDay(addDays(now, 1));
  const endDay = endOfDay(horizonEnd);

  while (!isAfter(curDay, endDay)) {
    const dayOfWeek = curDay.getDay();
    const dayCfgs = input.availability.filter((a) => a.enabled && a.dayOfWeek === dayOfWeek);

    for (const cfg of dayCfgs) {
      const sMin = timeToMinutes(cfg.startTime);
      const eMin = timeToMinutes(cfg.endTime);
      if (eMin > sMin) {
        windows.push({ date: new Date(curDay), startMin: sMin, endMin: eMin });
      }
    }
    curDay = addDays(curDay, 1);
  }

  let recoveredMinutes = 0;
  const proposedSessions: RecoveryProposal['rescheduledSessions'] = [];

  for (const win of windows) {
    if (recoveredMinutes >= minutesToRecover) break;

    let pointer = win.startMin;
    while (pointer + 15 <= win.endMin && recoveredMinutes < minutesToRecover) {
      const availableSlice = win.endMin - pointer;
      if (availableSlice < 15) break;

      const remainingNeeded = minutesToRecover - recoveredMinutes;
      let duration: number;
      if (remainingNeeded <= preferredSession + 15 && remainingNeeded <= availableSlice) {
        duration = Math.max(15, remainingNeeded);
      } else if (remainingNeeded <= preferredSession) {
        duration = Math.min(Math.max(15, remainingNeeded), availableSlice);
      } else {
        duration = Math.min(preferredSession, availableSlice);
      }

      if (duration > availableSlice) duration = availableSlice;
      if (duration < 15) break;

      const slotStart = minutesToDate(win.date, pointer);
      const slotEnd = minutesToDate(win.date, pointer + duration);

      // Check collision with existing future sessions
      const collides = existingFutureSessions.some((ex) => {
        const exStart = typeof ex.scheduledStart === 'string' ? parseISO(ex.scheduledStart) : new Date(ex.scheduledStart);
        const exEnd = typeof ex.scheduledEnd === 'string' ? parseISO(ex.scheduledEnd) : new Date(ex.scheduledEnd);
        return isBefore(slotStart, exEnd) && isAfter(slotEnd, exStart);
      });

      if (!collides) {
        // Check if subject has an exam date that this slot exceeds
        if (subject?.examDate) {
          const exDate = typeof subject.examDate === 'string' ? parseISO(subject.examDate) : subject.examDate;
          if (isAfter(slotStart, exDate)) {
            warnings.push(
              `Proposed rescheduled slot on ${win.date.toDateString()} is after the scheduled exam date for ${subjectName}.`
            );
          }
        }

        proposedSessions.push({
          topicId: missedSession.topicId,
          subjectId: missedSession.subjectId,
          title: topicTitle,
          subjectName,
          scheduledStart: slotStart,
          scheduledEnd: slotEnd,
          plannedMinutes: duration,
        });

        recoveredMinutes += duration;
        pointer += duration + breakMinutes;
      } else {
        pointer += 30; // Step forward past occupied slot
      }
    }
  }

  const isFeasible = recoveredMinutes >= minutesToRecover;

  let explanation = '';
  if (isFeasible) {
    explanation = `Successfully found future study slot(s) to recover ${minutesToRecover} minutes of "${topicTitle}" without conflicting with already scheduled sessions.`;
  } else {
    explanation = `Only ${recoveredMinutes} of ${minutesToRecover} minutes could be reallocated within the current schedule horizon. Consider extending daily study availability.`;
    warnings.push('Schedule capacity is constrained. Some missed work remains unallocated.');
  }

  return {
    missedSessionId: input.missedSessionId,
    originalTopicTitle: topicTitle,
    originalSubjectName: subjectName,
    rescheduledSessions: proposedSessions,
    explanation,
    feasible: isFeasible,
    warnings,
  };
}
