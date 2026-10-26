import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  CalendarDays,
  Plus,
  AlertCircle,
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  addMinutes,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO,
} from 'date-fns';
import { apiRequest } from '../../api/client.js';
import { StudySession, Subject, Topic } from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const TimetablePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Create Session Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [createFormData, setCreateFormData] = useState({
    subjectId: '',
    topicId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: format(addMinutes(new Date(), 60), 'HH:mm'),
    endTime: format(addMinutes(new Date(), 110), 'HH:mm'),
    notes: '',
  });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ sessions: StudySession[] }>('/study-sessions');
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Failed to load study sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await apiRequest<{ subjects: Subject[] }>('/subjects');
      setSubjects(res.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchSubjects();
  }, []);

  const handlePrev = () => {
    setCurrentDate((prev) => (viewMode === 'day' ? subDays(prev, 1) : subDays(prev, 7)));
  };

  const handleNext = () => {
    setCurrentDate((prev) => (viewMode === 'day' ? addDays(prev, 1) : addDays(prev, 7)));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
  };

  const handleComplete = async (sessionId: string) => {
    try {
      await apiRequest(`/study-sessions/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      fetchSessions();
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
  };

  const handleMarkMissed = async (sessionId: string) => {
    try {
      await apiRequest(`/study-sessions/${sessionId}/miss`, { method: 'POST' });
      fetchSessions();
    } catch (err) {
      console.error('Failed to mark missed:', err);
    }
  };

  const openRescheduleModal = (sess: StudySession) => {
    setSelectedSession(sess);
    setRescheduleError(null);
    const start = new Date(sess.scheduledStart);
    const end = new Date(sess.scheduledEnd);
    setRescheduleDate(format(start, 'yyyy-MM-dd'));
    setRescheduleStart(format(start, 'HH:mm'));
    setRescheduleEnd(format(end, 'HH:mm'));
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRescheduleError(null);
    if (!selectedSession || !rescheduleDate || !rescheduleStart || !rescheduleEnd) return;

    const startDateTime = new Date(`${rescheduleDate}T${rescheduleStart}:00`);
    const endDateTime = new Date(`${rescheduleDate}T${rescheduleEnd}:00`);

    if (startDateTime.getTime() < Date.now() - 30000) {
      setRescheduleError('Rescheduled session start time cannot be in the past. Please select a future date and time.');
      return;
    }

    if (endDateTime.getTime() <= startDateTime.getTime()) {
      setRescheduleError('Session end time must be later than the start time.');
      return;
    }

    try {
      await apiRequest(`/study-sessions/${selectedSession._id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          scheduledStart: startDateTime.toISOString(),
          scheduledEnd: endDateTime.toISOString(),
        }),
      });

      setRescheduleModalOpen(false);
      fetchSessions();
    } catch (err: any) {
      setRescheduleError(err.message || 'Failed to reschedule session.');
      console.error('Failed to reschedule session:', err);
    }
  };

  const openCreateModal = () => {
    setCreateError(null);
    fetchSubjects();
    const now = new Date();
    const start = addMinutes(now, 30);
    const end = addMinutes(start, 50);

    setCreateFormData({
      subjectId: subjects.length > 0 ? subjects[0]._id : '',
      topicId: '',
      date: format(now, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
      notes: '',
    });

    if (subjects.length > 0) {
      loadTopicsForSubject(subjects[0]._id);
    } else {
      setAvailableTopics([]);
    }

    setCreateModalOpen(true);
  };

  const loadTopicsForSubject = async (subjectId: string) => {
    if (!subjectId) {
      setAvailableTopics([]);
      return;
    }
    try {
      const res = await apiRequest<{ subject: Subject; topics: Topic[] }>(`/subjects/${subjectId}`);
      setAvailableTopics(res.topics || []);
    } catch {
      setAvailableTopics([]);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setCreateFormData((prev) => ({ ...prev, subjectId, topicId: '' }));
    loadTopicsForSubject(subjectId);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createFormData.subjectId || !createFormData.date || !createFormData.startTime || !createFormData.endTime) {
      setCreateError('Please fill in all required fields.');
      return;
    }

    const startDateTime = new Date(`${createFormData.date}T${createFormData.startTime}:00`);
    const endDateTime = new Date(`${createFormData.date}T${createFormData.endTime}:00`);

    if (startDateTime.getTime() < Date.now() - 30000) {
      setCreateError('Session start time cannot be in the past. Please select a future date and time.');
      return;
    }

    if (endDateTime.getTime() <= startDateTime.getTime()) {
      setCreateError('Session end time must be later than the start time.');
      return;
    }

    try {
      await apiRequest('/study-sessions', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: createFormData.subjectId,
          topicId: createFormData.topicId || undefined,
          scheduledStart: startDateTime.toISOString(),
          scheduledEnd: endDateTime.toISOString(),
          notes: createFormData.notes || undefined,
        }),
      });

      setCreateModalOpen(false);
      fetchSessions();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to schedule study session.');
      console.error('Failed to schedule session:', err);
    }
  };

  // Filter sessions for currently active day
  const daySessions = sessions.filter((s) =>
    isSameDay(new Date(s.scheduledStart), currentDate)
  );

  const plannedMinutesToday = daySessions.reduce((acc, s) => acc + (s.plannedMinutes || 0), 0);
  const completedMinutesToday = daySessions
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + (s.actualMinutes || s.plannedMinutes || 0), 0);

  // Generate 7 days for week view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Timetable & Schedule</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your structured daily timetable generated from your syllabus and study plan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border bg-card p-0.5 text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week View
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleJumpToToday}>
            Today
          </Button>

          <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Schedule Session
          </Button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <Card className="p-3.5 flex items-center justify-between">
        <button
          onClick={handlePrev}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-sm font-bold text-foreground">
            {viewMode === 'day'
              ? format(currentDate, 'EEEE, MMMM d, yyyy')
              : `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`}
          </span>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {viewMode === 'day' && isSameDay(currentDate, new Date()) && '(Today)'}
          </p>
        </div>

        <button
          onClick={handleNext}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </Card>

      {/* Day View: Daily Study Sheet */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {/* Daily Study Summary Card */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-card">
              <span className="text-[11px] text-muted-foreground">Total Planned</span>
              <p className="text-lg font-bold text-foreground mt-0.5">
                {(plannedMinutesToday / 60).toFixed(1)} hrs ({plannedMinutesToday} mins)
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Completed</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {(completedMinutesToday / 60).toFixed(1)} hrs ({completedMinutesToday} mins)
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-card">
              <span className="text-[11px] text-muted-foreground">Pending Sessions</span>
              <p className="text-lg font-bold text-foreground mt-0.5">
                {daySessions.filter((s) => s.status !== 'completed').length} / {daySessions.length}
              </p>
            </div>
          </div>

          {/* Session Cards for the Day */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Study Sheet: {format(currentDate, 'MMMM d')}</CardTitle>
              <CardDescription>
                Chronologically ordered study blocks generated for your available windows
              </CardDescription>
            </CardHeader>

            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : daySessions.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="w-6 h-6" />}
                title="No Study Sessions for this Day"
                description="You have no sessions scheduled on this date. Check another day or generate a new study plan."
                actionLabel="Go to Study Plan"
                onAction={() => window.location.assign('/app/study-plan')}
              />
            ) : (
              <div className="space-y-3">
                {daySessions.map((sess) => {
                  const isCompleted = sess.status === 'completed';
                  const isMissed = sess.status === 'missed';
                  const startStr = format(new Date(sess.scheduledStart), 'hh:mm a');
                  const endStr = format(new Date(sess.scheduledEnd), 'hh:mm a');

                  return (
                    <div
                      key={sess._id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                          : isMissed
                          ? 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800'
                          : 'bg-card border-border hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-1.5 h-12 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: sess.subjectColor || '#4f46e5' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {sess.topicTitle}
                            </span>
                            <Badge size="sm">{sess.subjectName}</Badge>
                            {sess.status === 'completed' && <Badge size="sm" variant="success">Completed</Badge>}
                            {sess.status === 'missed' && <Badge size="sm" variant="danger">Missed</Badge>}
                            {sess.status === 'rescheduled' && <Badge size="sm" variant="warning">Rescheduled</Badge>}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                            <span className="font-mono text-foreground font-medium">
                              {startStr} – {endStr}
                            </span>
                            <span>• {sess.plannedMinutes} mins</span>
                            {sess.actualMinutes > 0 && <span>• Actual: {sess.actualMinutes} mins</span>}
                          </div>

                          {sess.notes && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic">
                              {sess.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isCompleted && !isMissed && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleComplete(sess._id)}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            >
                              Mark Done
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkMissed(sess._id)}
                              className="text-muted-foreground hover:text-rose-600"
                            >
                              Missed
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openRescheduleModal(sess)}
                          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />}
                        >
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Week View: 7-Day Grid */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day, idx) => {
            const isToday = isSameDay(day, new Date());
            const daySess = sessions.filter((s) => isSameDay(new Date(s.scheduledStart), day));

            return (
              <Card
                key={idx}
                className={`p-3 min-h-[300px] flex flex-col justify-between ${
                  isToday ? 'border-primary-500 ring-1 ring-primary-500/30' : ''
                }`}
              >
                <div>
                  <div className="border-b border-border pb-2 mb-2 text-center">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                      {format(day, 'EEE')}
                    </span>
                    <span
                      className={`text-sm font-bold block ${
                        isToday ? 'text-primary-600 font-extrabold' : 'text-foreground'
                      }`}
                    >
                      {format(day, 'MMM d')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {daySess.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground block text-center py-6">
                        No sessions
                      </span>
                    ) : (
                      daySess.map((s) => (
                        <div
                          key={s._id}
                          onClick={() => {
                            setCurrentDate(day);
                            setViewMode('day');
                          }}
                          className={`p-2 rounded-lg border text-[11px] cursor-pointer hover:shadow-subtle transition-all ${
                            s.status === 'completed'
                              ? 'bg-emerald-50/50 border-emerald-200 line-through opacity-75'
                              : s.status === 'missed'
                              ? 'bg-rose-50/50 border-rose-200'
                              : 'bg-card border-border hover:border-primary-400'
                          }`}
                        >
                          <div className="font-semibold text-foreground line-clamp-1">{s.topicTitle}</div>
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                            <span>{format(new Date(s.scheduledStart), 'h:mm a')}</span>
                            <span>{s.plannedMinutes}m</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 text-center border-t border-border mt-2">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {daySess.filter((s) => s.status === 'completed').length}/{daySess.length} done
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reschedule Session Modal */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="Reschedule Study Session"
        description={selectedSession?.topicTitle}
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
          {rescheduleError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{rescheduleError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-foreground mb-1">New Date</label>
            <input
              type="date"
              required
              min={todayStr}
              value={rescheduleDate}
              onChange={(e) => {
                setRescheduleDate(e.target.value);
                setRescheduleError(null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Start Time</label>
              <input
                type="time"
                required
                value={rescheduleStart}
                onChange={(e) => {
                  setRescheduleStart(e.target.value);
                  setRescheduleError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">End Time</label>
              <input
                type="time"
                required
                value={rescheduleEnd}
                onChange={(e) => {
                  setRescheduleEnd(e.target.value);
                  setRescheduleError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule New Study Session Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule Study Session"
        description="Add a structured study block to your daily academic timetable"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{createError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-foreground mb-1">Subject / Course *</label>
            <select
              required
              value={createFormData.subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
            >
              <option value="" disabled>Select a subject...</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Syllabus Topic (Optional)</label>
            <select
              value={createFormData.topicId}
              onChange={(e) => setCreateFormData({ ...createFormData, topicId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
            >
              <option value="">General study session</option>
              {availableTopics.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} ({t.difficulty})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Date *</label>
            <input
              type="date"
              required
              min={todayStr}
              value={createFormData.date}
              onChange={(e) => {
                setCreateFormData({ ...createFormData, date: e.target.value });
                setCreateError(null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={createFormData.startTime}
                onChange={(e) => {
                  setCreateFormData({ ...createFormData, startTime: e.target.value });
                  setCreateError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">End Time *</label>
              <input
                type="time"
                required
                value={createFormData.endTime}
                onChange={(e) => {
                  setCreateFormData({ ...createFormData, endTime: e.target.value });
                  setCreateError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Notes / Goals (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Complete chapter exercises 4.1 to 4.5"
              value={createFormData.notes}
              onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Schedule Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
