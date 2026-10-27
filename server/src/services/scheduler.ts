import { addDays, parseISO, isBefore, isAfter, startOfDay, endOfDay, differenceInCalendarDays, format, isSameDay } from 'date-fns';

export interface SubjectInput {
  id: string;
  name: string;
  code?: string;
  examDate?: string | Date | null;
  importance: number; // 1 to 5
}

export interface TopicInput {
  id: string;
  subjectId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  importance: number; // 1 to 5
  estimatedMinutes: number;
  status: 'not_started' | 'in_progress' | 'completed';
  prerequisiteTopicIds?: string[];
  revisionCount?: number;
}

export interface AvailabilitySlot {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "12:00"
  enabled: boolean;
}

export interface ExistingSessionInput {
  id?: string;
  topicId: string;
  scheduledStart: string | Date;
  scheduledEnd: string | Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled' | 'rescheduled';
}

export interface StudyPlanInput {
  subjects: SubjectInput[];
  topics: TopicInput[];
  availability: AvailabilitySlot[];
  startDate: string | Date;
  endDate: string | Date;
  preferredSessionMinutes?: number;
  breakMinutes?: number;
  existingSessions?: ExistingSessionInput[];
  algorithmVersion?: string;
  referenceDate?: Date;
}

export interface ScheduledSessionProposal {
  topicId: string;
  subjectId: string;
  title: string;
  subjectName: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  plannedMinutes: number;
  sessionType: 'study' | 'revision';
  priorityScore: number;
  priorityExplanation: string;
}

export interface UnscheduledTopic {
  topicId: string;
  title: string;
  subjectName: string;
  neededMinutes: number;
  reason: string;
}

export interface StudyPlanResult {
  algorithmVersion: string;
  feasibility: {
    status: 'feasible' | 'tight' | 'infeasible';
    score: number; // 0 to 100
    totalTopics: number;
    scheduledTopics: number;
    unscheduledTopics: UnscheduledTopic[];
    warnings: string[];
    explanations: string[];
  };
  sessions: ScheduledSessionProposal[];
  metrics: {
    totalWorkloadMinutes: number;
    scheduledMinutes: number;
    totalAvailableMinutes: number;
    utilizationPercent: number;
  };
}

// Convert "HH:mm" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// Convert minutes from midnight to Date on given base date
export function minutesToDate(baseDate: Date, minutes: number): Date {
  const d = new Date(baseDate);
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  d.setHours(hrs, mins, 0, 0);
  return d;
}

// Circular prerequisite detection using DFS
export function detectCycles(topics: TopicInput[]): { hasCycle: boolean; cycleTopics: string[] } {
  const adj = new Map<string, string[]>();
  topics.forEach((t) => {
    adj.set(t.id, t.prerequisiteTopicIds || []);
  });

  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
  const cycleNodes: string[] = [];

  function dfs(node: string, path: string[]): boolean {
    visited.set(node, 1);
    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (adj.has(neighbor)) {
        if (visited.get(neighbor) === 1) {
          cycleNodes.push(...path, neighbor);
          return true;
        }
        if (!visited.get(neighbor) && dfs(neighbor, [...path, neighbor])) {
          return true;
        }
      }
    }
    visited.set(node, 2);
    return false;
  }

  for (const topic of topics) {
    if (!visited.get(topic.id)) {
      if (dfs(topic.id, [topic.id])) {
        return { hasCycle: true, cycleTopics: Array.from(new Set(cycleNodes)) };
      }
    }
  }

  return { hasCycle: false, cycleTopics: [] };
}

// Priority calculation
// priority = 0.40 * urgency + 0.25 * difficulty + 0.20 * importance + 0.15 * revisionNeed
export function calculateTopicPriority(
  topic: TopicInput,
  subject: SubjectInput | undefined,
  currentDate: Date
): { score: number; explanation: string } {
  let urgency = 0.4; // Default if no exam date
  let urgencyText = 'standard urgency (no exam set)';

  if (subject?.examDate) {
    const examDate = typeof subject.examDate === 'string' ? parseISO(subject.examDate) : subject.examDate;
    const daysUntilExam = differenceInCalendarDays(examDate, currentDate);

    if (daysUntilExam <= 0) {
      urgency = 1.0;
      urgencyText = 'critical (exam is today or imminent)';
    } else if (daysUntilExam <= 3) {
      urgency = 0.95;
      urgencyText = `high (${daysUntilExam} days to exam)`;
    } else if (daysUntilExam <= 7) {
      urgency = 0.8;
      urgencyText = `elevated (${daysUntilExam} days to exam)`;
    } else if (daysUntilExam <= 14) {
      urgency = 0.65;
      urgencyText = `moderate (${daysUntilExam} days to exam)`;
    } else if (daysUntilExam <= 30) {
      urgency = 0.45;
      urgencyText = `approaching (${daysUntilExam} days to exam)`;
    } else {
      urgency = 0.25;
      urgencyText = `future horizon (${daysUntilExam} days away)`;
    }
  }

  // Difficulty normalized: easy=0.33, medium=0.66, hard=1.0
  const difficultyMap: Record<string, number> = { easy: 0.33, medium: 0.66, hard: 1.0 };
  const difficultyScore = difficultyMap[topic.difficulty] || 0.66;

  // Importance normalized 1-5 -> 0.2 to 1.0
  const subjectImportance = subject ? subject.importance : 3;
  const combinedImportance = Math.max(topic.importance, subjectImportance);
  const importanceScore = Math.min(1.0, Math.max(0.2, combinedImportance / 5));

  // Revision need: 0.0 for initial study, up to 1.0 if flagged or repeated
  const revisionNeed = topic.revisionCount ? Math.min(1.0, topic.revisionCount * 0.3) : 0.0;

  const score =
    0.4 * urgency +
    0.25 * difficultyScore +
    0.2 * importanceScore +
    0.15 * revisionNeed;

  const explanation = `Score: ${(score * 100).toFixed(1)}/100 [Urgency: ${(urgency * 100).toFixed(0)}% (${urgencyText}), Difficulty: ${topic.difficulty}, Importance: ${combinedImportance}/5]`;

  return { score: Number(score.toFixed(4)), explanation };
}

export function generateStudyPlan(input: StudyPlanInput): StudyPlanResult {
  const algorithmVersion = input.algorithmVersion || '1.0.0';
  const preferredSession = input.preferredSessionMinutes || 50;
  const breakMinutes = input.breakMinutes || 10;
  const warnings: string[] = [];
  const explanations: string[] = [];

  const startDate = typeof input.startDate === 'string' ? parseISO(input.startDate) : new Date(input.startDate);
  const endDate = typeof input.endDate === 'string' ? parseISO(input.endDate) : new Date(input.endDate);

  if (isAfter(startDate, endDate)) {
    throw new Error('Start date must be before or equal to end date.');
  }

  // Map subjects for fast lookup
  const subjectMap = new Map<string, SubjectInput>();
  input.subjects.forEach((s) => subjectMap.set(s.id, s));

  // Filter topics: exclude completed topics
  const pendingTopics = input.topics.filter((t) => t.status !== 'completed');
  const totalTopics = pendingTopics.length;

  if (totalTopics === 0) {
    return {
      algorithmVersion,
      feasibility: {
        status: 'feasible',
        score: 100,
        totalTopics: 0,
        scheduledTopics: 0,
        unscheduledTopics: [],
        warnings: ['All syllabus topics are already marked as completed. No study sessions required.'],
        explanations: ['Great job! You have completed all registered topics in your syllabus.'],
      },
      sessions: [],
      metrics: {
        totalWorkloadMinutes: 0,
        scheduledMinutes: 0,
        totalAvailableMinutes: 0,
        utilizationPercent: 0,
      },
    };
  }

  // Check circular prerequisites
  const cycleCheck = detectCycles(pendingTopics);
  if (cycleCheck.hasCycle) {
    warnings.push(
      `Circular prerequisite relationship detected among topics. Cycle resolution applied.`
    );
  }

  // Generate day-by-day availability slots between startDate and endDate
  interface AvailableWindow {
    date: Date;
    startMin: number;
    endMin: number;
    duration: number;
  }

  const now = input.referenceDate ? new Date(input.referenceDate) : new Date();
  const todayCalendar = startOfDay(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const windows: AvailableWindow[] = [];
  let curDay = startOfDay(startDate);
  const endDay = endOfDay(endDate);

  while (!isAfter(curDay, endDay)) {
    // Only schedule on today or future days. Never schedule on days strictly before today.
    if (!isBefore(curDay, todayCalendar)) {
      const isToday = isSameDay(curDay, now);
      const dayOfWeek = curDay.getDay(); // 0 = Sun, ..., 6 = Sat
      const dayConfigs = input.availability.filter((a) => a.enabled && a.dayOfWeek === dayOfWeek);

      for (const cfg of dayConfigs) {
        let sMin = timeToMinutes(cfg.startTime);
        const eMin = timeToMinutes(cfg.endTime);

        // If scheduling on today, start time cannot be in the past
        if (isToday && sMin < nowMinutes) {
          sMin = nowMinutes;
        }

        if (eMin > sMin && (eMin - sMin) >= 15) {
          windows.push({
            date: new Date(curDay),
            startMin: sMin,
            endMin: eMin,
            duration: eMin - sMin,
          });
        }
      }
    }

    curDay = addDays(curDay, 1);
  }

  // Exclude times already occupied by preserved existing sessions
  const occupiedRanges = (input.existingSessions || [])
    .filter((s) => s.status === 'completed' || s.status === 'in_progress')
    .map((s) => ({
      start: typeof s.scheduledStart === 'string' ? parseISO(s.scheduledStart) : new Date(s.scheduledStart),
      end: typeof s.scheduledEnd === 'string' ? parseISO(s.scheduledEnd) : new Date(s.scheduledEnd),
    }));

  const totalAvailableMinutes = windows.reduce((acc, w) => acc + w.duration, 0);
  const totalWorkloadMinutes = pendingTopics.reduce((acc, t) => acc + (t.estimatedMinutes || 60), 0);

  if (totalAvailableMinutes === 0) {
    return {
      algorithmVersion,
      feasibility: {
        status: 'infeasible',
        score: 0,
        totalTopics,
        scheduledTopics: 0,
        unscheduledTopics: pendingTopics.map((t) => ({
          topicId: t.id,
          title: t.title,
          subjectName: subjectMap.get(t.subjectId)?.name || 'Unknown Subject',
          neededMinutes: t.estimatedMinutes || 60,
          reason: 'No enabled study availability windows found in the selected date range.',
        })),
        warnings: ['No study availability configured for the active days.'],
        explanations: ['Please configure available study hours in your Settings or Onboarding.'],
      },
      sessions: [],
      metrics: {
        totalWorkloadMinutes,
        scheduledMinutes: 0,
        totalAvailableMinutes: 0,
        utilizationPercent: 0,
      },
    };
  }

  // Track remaining minutes per topic
  const remainingMinutesMap = new Map<string, number>();
  pendingTopics.forEach((t) => remainingMinutesMap.set(t.id, t.estimatedMinutes || 60));

  // Track completed/scheduled topic IDs for prerequisite verification
  const satisfiedPrereqs = new Set<string>();
  // Already completed topics in syllabus are automatically satisfied
  input.topics.filter((t) => t.status === 'completed').forEach((t) => satisfiedPrereqs.add(t.id));

  const scheduledSessions: ScheduledSessionProposal[] = [];
  const scheduledTopicIds = new Set<string>();

  // Iterate chronologically through available windows
  for (const win of windows) {
    let currentWindowPointer = win.startMin;

    while (currentWindowPointer + 15 <= win.endMin) { // Minimum practical session 15 mins
      const currentSlotDate = minutesToDate(win.date, currentWindowPointer);

      // Check if slot overlaps with an existing occupied session
      const slotEndDate = minutesToDate(win.date, currentWindowPointer + preferredSession);
      const isOccupied = occupiedRanges.some(
        (occ) => isBefore(currentSlotDate, occ.end) && isAfter(slotEndDate, occ.start)
      );

      if (isOccupied) {
        currentWindowPointer += 30;
        continue;
      }

      // Filter eligible candidate topics:
      // 1. Has remaining minutes > 0
      // 2. All prerequisites are in satisfiedPrereqs (or have no prereqs)
      // 3. Exam date is not already passed relative to this slot
      const candidateTopics = pendingTopics.filter((t) => {
        const remaining = remainingMinutesMap.get(t.id) || 0;
        if (remaining <= 0) return false;

        // Prerequisite check
        const prereqs = t.prerequisiteTopicIds || [];
        const prereqsMet = prereqs.every((pId) => satisfiedPrereqs.has(pId));
        if (!prereqsMet) return false;

        // Exam date check: don't schedule a topic after the exam has already happened
        const subject = subjectMap.get(t.subjectId);
        if (subject?.examDate) {
          const examDate = typeof subject.examDate === 'string' ? parseISO(subject.examDate) : subject.examDate;
          if (isAfter(startOfDay(currentSlotDate), endOfDay(examDate))) {
            return false;
          }
        }

        return true;
      });

      if (candidateTopics.length === 0) {
        // No topics ready at this window (either prerequisites waiting or all completed)
        break;
      }

      // Sort candidate topics by Priority Formula (with deterministic tie-breaking by title/id)
      const scoredCandidates = candidateTopics.map((t) => {
        const subject = subjectMap.get(t.subjectId);
        const { score, explanation } = calculateTopicPriority(t, subject, currentSlotDate);
        return { topic: t, subject, score, explanation };
      });

      scoredCandidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // Deterministic tie-breaking: earlier exam date first, then name alphabetical
        if (a.subject?.examDate && b.subject?.examDate) {
          const aDate = new Date(a.subject.examDate).getTime();
          const bDate = new Date(b.subject.examDate).getTime();
          if (aDate !== bDate) return aDate - bDate;
        }
        return a.topic.title.localeCompare(b.topic.title);
      });

      const availableWindowSlice = win.endMin - currentWindowPointer;
      if (availableWindowSlice < 15) {
        break; // Window slice too small for any practical study session
      }

      const selected = scoredCandidates[0];
      const remainingForTopic = remainingMinutesMap.get(selected.topic.id) || 60;

      // Determine session chunk:
      // If remaining time is within 15 minutes of preferredSession and fits in the available window,
      // combine it into one clean session (e.g., 60m instead of 50m + 10m).
      let chunkMinutes: number;
      if (remainingForTopic <= preferredSession + 15 && remainingForTopic <= availableWindowSlice) {
        chunkMinutes = Math.max(15, remainingForTopic);
      } else if (remainingForTopic <= preferredSession) {
        chunkMinutes = Math.min(Math.max(15, remainingForTopic), availableWindowSlice);
      } else {
        chunkMinutes = Math.min(preferredSession, availableWindowSlice);
      }

      if (chunkMinutes > availableWindowSlice) {
        chunkMinutes = availableWindowSlice;
      }

      if (chunkMinutes < 15) {
        break;
      }

      const sessionStart = minutesToDate(win.date, currentWindowPointer);
      const sessionEnd = minutesToDate(win.date, currentWindowPointer + chunkMinutes);

      if (isBefore(sessionStart, now)) {
        currentWindowPointer += 15;
        continue;
      }

      scheduledSessions.push({
        topicId: selected.topic.id,
        subjectId: selected.topic.subjectId,
        title: selected.topic.title,
        subjectName: selected.subject?.name || 'General Subject',
        scheduledStart: sessionStart,
        scheduledEnd: sessionEnd,
        plannedMinutes: chunkMinutes,
        sessionType: 'study',
        priorityScore: selected.score,
        priorityExplanation: selected.explanation,
      });

      const updatedRemaining = Math.max(0, remainingForTopic - chunkMinutes);
      remainingMinutesMap.set(selected.topic.id, updatedRemaining);

      if (updatedRemaining <= 0) {
        satisfiedPrereqs.add(selected.topic.id);
        scheduledTopicIds.add(selected.topic.id);
      }

      // Advance window pointer + break
      currentWindowPointer += chunkMinutes + breakMinutes;
    }
  }

  // Identify unscheduled topics and why
  const unscheduledTopics: UnscheduledTopic[] = [];
  pendingTopics.forEach((t) => {
    const remaining = remainingMinutesMap.get(t.id) || 0;
    if (remaining > 0) {
      let reason = 'Insufficient available study hours in schedule horizon.';
      const prereqs = t.prerequisiteTopicIds || [];
      const prereqsMet = prereqs.every((pId) => satisfiedPrereqs.has(pId));
      if (!prereqsMet) {
        reason = 'Blocked by prerequisites that could not be fully completed.';
      } else {
        const subject = subjectMap.get(t.subjectId);
        if (subject?.examDate) {
          const examDate = typeof subject.examDate === 'string' ? parseISO(subject.examDate) : subject.examDate;
          if (isAfter(new Date(), examDate)) {
            reason = `Examination date (${format(examDate, 'MMM d, yyyy')}) has already passed.`;
          } else {
            reason = `Insufficient study hours available before the exam date (${format(examDate, 'MMM d, yyyy')}).`;
          }
        }
      }

      unscheduledTopics.push({
        topicId: t.id,
        title: t.title,
        subjectName: subjectMap.get(t.subjectId)?.name || 'Unknown',
        neededMinutes: remaining,
        reason,
      });
    }
  });

  const scheduledMinutes = scheduledSessions.reduce((acc, s) => acc + s.plannedMinutes, 0);
  const scheduledCount = totalTopics - unscheduledTopics.length;
  const coveragePercent = totalTopics > 0 ? (scheduledCount / totalTopics) * 100 : 100;
  const utilizationPercent = totalAvailableMinutes > 0 ? Math.min(100, (scheduledMinutes / totalAvailableMinutes) * 100) : 0;

  let feasibilityStatus: 'feasible' | 'tight' | 'infeasible' = 'feasible';
  let feasibilityScore = Math.round(coveragePercent);

  if (unscheduledTopics.length > 0) {
    const hasExamDeadlines = unscheduledTopics.some((u) => {
      const subj = subjectMap.get(pendingTopics.find((t) => t.id === u.topicId)?.subjectId || '');
      return !!subj?.examDate;
    });

    if (coveragePercent >= 70) {
      feasibilityStatus = 'tight';
      warnings.push(
        `${unscheduledTopics.length} topic(s) could not fit completely into the planned timeline. Consider increasing daily study hours or extending your planning horizon.`
      );
    } else {
      feasibilityStatus = 'infeasible';
      if (hasExamDeadlines) {
        warnings.push(
          `Critical capacity shortfall: ${unscheduledTopics.length} out of ${totalTopics} topic(s) cannot fit before their exam deadlines.`
        );
      } else {
        warnings.push(
          `Capacity shortfall: ${unscheduledTopics.length} out of ${totalTopics} topic(s) cannot fit within the available study hours.`
        );
      }
    }
  }

  explanations.push(
    `Scheduled ${scheduledCount} of ${totalTopics} pending topics across ${scheduledSessions.length} dedicated study blocks.`
  );
  explanations.push(
    `Allocated ${scheduledMinutes} minutes (${(scheduledMinutes / 60).toFixed(1)} hrs) from a total capacity of ${totalAvailableMinutes} minutes.`
  );

  return {
    algorithmVersion,
    feasibility: {
      status: feasibilityStatus,
      score: feasibilityScore,
      totalTopics,
      scheduledTopics: scheduledCount,
      unscheduledTopics,
      warnings,
      explanations,
    },
    sessions: scheduledSessions,
    metrics: {
      totalWorkloadMinutes,
      scheduledMinutes,
      totalAvailableMinutes,
      utilizationPercent: Number(utilizationPercent.toFixed(1)),
    },
  };
}
