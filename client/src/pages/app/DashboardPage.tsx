import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  ListTodo,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Play,
  RotateCcw,
  BookOpen,
  Flame,
  Target,
  FileText,
  Headphones,
  History,
  Timer,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { StudySession, ProgressSummary, Subject } from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { QuickNoteModal } from '../../components/notes/QuickNoteModal.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [streaks, setStreaks] = useState<any | null>(null);
  const [accuracy, setAccuracy] = useState<any | null>(null);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);

  const [todayMetrics, setTodayMetrics] = useState({
    plannedMinutes: 0,
    completedMinutes: 0,
    totalSessionsToday: 0,
    completedSessionsToday: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, todayRes, subjRes, strkRes, accRes, histRes, topRes] = await Promise.all([
        apiRequest<{ summary: ProgressSummary }>('/progress/summary'),
        apiRequest<{ sessions: StudySession[]; metrics: any }>('/study-sessions/today'),
        apiRequest<{ subjects: Subject[] }>('/subjects'),
        apiRequest<{ streaks: any }>('/progress/streaks'),
        apiRequest<{ accuracy: any }>('/progress/accuracy?range=week'),
        apiRequest<{ history: any[] }>('/history'),
        apiRequest<{ topics: any[] }>('/topics'),
      ]);

      setSummary(sumRes.summary);
      setTodaySessions(todayRes.sessions || []);
      setTodayMetrics(todayRes.metrics || {});
      setSubjects(subjRes.subjects || []);
      setStreaks(strkRes.streaks || null);
      setAccuracy(accRes.accuracy || null);
      setRecentHistory((histRes.history || []).slice(0, 4));
      setTopics(topRes.topics || []);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await apiRequest(`/study-sessions/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  const handleMarkMissed = async (sessionId: string) => {
    try {
      await apiRequest(`/study-sessions/${sessionId}/miss`, {
        method: 'POST',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to mark session missed:', err);
    }
  };

  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-muted rounded-2xl lg:col-span-2" />
          <div className="h-80 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  // If user has zero subjects, show setup checklist
  if (subjects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Card className="p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Welcome to Your StudyOS Workspace</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
              Let’s get your semester organized. Follow this quick checklist to unlock your deterministic study schedule.
            </p>
          </div>

          <div className="space-y-3 text-left">
            <Link
              to="/app/subjects"
              className="p-4 rounded-xl border border-border bg-card hover:border-primary-400 flex items-center justify-between transition-colors block"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Add Your First Subject</h4>
                  <p className="text-[11px] text-muted-foreground">Add courses, exam dates, and course codes</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-primary-600" />
            </Link>

            <Link
              to="/app/topics"
              className="p-4 rounded-xl border border-border bg-card hover:border-primary-400 flex items-center justify-between transition-colors block"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Break Down Syllabus Topics</h4>
                  <p className="text-[11px] text-muted-foreground">Estimate minutes, difficulty, and prerequisites</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            <Link
              to="/app/study-plan"
              className="p-4 rounded-xl border border-border bg-card hover:border-primary-400 flex items-center justify-between transition-colors block"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Generate Study Plan</h4>
                  <p className="text-[11px] text-muted-foreground">Let the scheduler build your daily study sheet</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>

          <Link to="/app/subjects" className="inline-block pt-2">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Add Subjects Now
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const plannedHours = (todayMetrics.plannedMinutes / 60).toFixed(1);
  const completedHours = (todayMetrics.completedMinutes / 60).toFixed(1);

  const completedTopicsCount = topics.filter((t) => t.status === 'completed').length;
  const pendingTopicsCount = topics.filter((t) => t.status !== 'completed').length;
  const topicCompletionRate =
    topics.length > 0 ? Math.round((completedTopicsCount / topics.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-700 via-primary-800 to-indigo-900 text-white shadow-elevated flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-200">
            Welcome Back, {user?.name}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
            Academic Command Center
          </h2>
          <p className="text-xs text-primary-100 mt-1 max-w-xl leading-relaxed">
            {todayMetrics.totalSessionsToday > 0
              ? `You have ${todayMetrics.totalSessionsToday} study session(s) scheduled today (${plannedHours} hours planned).`
              : 'No sessions scheduled for today. Generate a study plan or review pending topics.'}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsQuickNoteOpen(true)}
            leftIcon={<FileText className="w-3.5 h-3.5" />}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            Quick Note
          </Button>

          <Link to="/app/music">
            <Button
              size="sm"
              leftIcon={<Headphones className="w-3.5 h-3.5" />}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              Study Music
            </Button>
          </Link>

          <Link to="/app/focus">
            <Button
              size="sm"
              leftIcon={<Play className="w-3.5 h-3.5" />}
              className="bg-white text-primary-800 hover:bg-white/90 shadow-sm"
            >
              Start Focus Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Row: Streaks, Accuracy, Topics, Today's Hours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Study Streak KPI */}
        <Card className="p-4 border-border bg-gradient-to-br from-card to-amber-50/30 dark:to-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              Study Streak
            </span>
            <Link to="/app/progress" className="text-[11px] text-primary-600 hover:underline">
              View Map
            </Link>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">
            {streaks?.currentStreak || 0} <span className="text-xs font-semibold text-muted-foreground">days</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            Best: {streaks?.longestStreak || 0} days • {streaks?.isActiveToday ? '🔥 Active today' : 'Pending today'}
          </p>
        </Card>

        {/* Study Accuracy KPI */}
        <Card className="p-4 border-border bg-gradient-to-br from-card to-primary-50/30 dark:to-primary-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Target className="w-4 h-4 text-primary-600" />
              Completion Accuracy
            </span>
            <Link to="/app/progress" className="text-[11px] text-primary-600 hover:underline">
              Details
            </Link>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">
            {accuracy?.accuracyPercent !== null ? `${accuracy?.accuracyPercent}%` : 'N/A'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {accuracy?.onTimeCompletedCount || 0} on-time • {accuracy?.lateCompletedCount || 0} late
          </p>
        </Card>

        {/* Completed vs Pending Topics KPI */}
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <ListTodo className="w-4 h-4 text-emerald-600" />
              Syllabus Topics
            </span>
            <Link to="/app/topics" className="text-[11px] text-primary-600 hover:underline">
              Manage
            </Link>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">
            {completedTopicsCount}{' '}
            <span className="text-xs font-semibold text-muted-foreground">/ {topics.length} done</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {pendingTopicsCount} pending • {topicCompletionRate}% coverage
          </p>
        </Card>

        {/* Today's Focus Progress */}
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-indigo-600" />
              Today's Focus
            </span>
            <Link to="/app/timetable" className="text-[11px] text-primary-600 hover:underline">
              Timetable
            </Link>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">
            {completedHours}h <span className="text-xs font-semibold text-muted-foreground">/ {plannedHours}h</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {todayMetrics.completedSessionsToday} of {todayMetrics.totalSessionsToday} sessions done
          </p>
        </Card>
      </div>

      {/* Main Split: Today's Schedule (8 cols) & Sidebar Cards (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Study Schedule (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600" />
              Today's Scheduled Sessions
            </h3>
            <Link to="/app/timetable" className="text-xs text-primary-600 hover:underline">
              Open Full Timetable →
            </Link>
          </div>

          {todaySessions.length === 0 ? (
            <Card className="p-8 text-center border-border">
              <EmptyState
                icon={<Calendar className="w-8 h-8" />}
                title="No study sessions scheduled for today"
                description="Generate a new plan or visit your study schedule to map upcoming topics."
                actionLabel="Generate Plan"
                actionPath="/app/study-plan"
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((session: any) => {
                const isCompleted = session.status === 'completed';
                const isMissed = session.status === 'missed';

                return (
                  <Card
                    key={session._id}
                    className={`p-4 border transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900'
                        : isMissed
                        ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900'
                        : 'bg-card border-border hover:border-primary-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ backgroundColor: session.subjectColor || '#4f46e5' }}
                        >
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold text-white uppercase tracking-wider"
                              style={{ backgroundColor: session.subjectColor || '#4f46e5' }}
                            >
                              {session.subjectName}
                            </span>
                            <Badge variant={isCompleted ? 'success' : isMissed ? 'danger' : 'info'} size="sm">
                              {session.status}
                            </Badge>
                          </div>

                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {session.topicTitle}
                          </h4>

                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {new Date(session.scheduledStart).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {new Date(session.scheduledEnd).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            ({session.plannedMinutes} min)
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {!isCompleted && !isMissed && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkMissed(session._id)}
                              className="text-xs"
                            >
                              Missed
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCompleteSession(session._id)}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              className="text-xs"
                            >
                              Complete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Widgets (4 cols): Quick Note, Recent History, Upcoming Exams */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Note Creation Card */}
          <Card className="p-4 border-border bg-gradient-to-br from-card to-primary-50/20 dark:to-primary-950/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-primary-600" />
                Quick Study Note
              </h3>
              <Link to="/app/notes" className="text-[11px] text-primary-600 hover:underline">
                All Notes →
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Record a formula, proof, or key concept without leaving your dashboard.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsQuickNoteOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="w-full text-xs"
            >
              Write Quick Note
            </Button>
          </Card>

          {/* Recent Completed Task History */}
          <Card className="p-4 border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <History className="w-3.5 h-3.5 text-emerald-600" />
                Recent History
              </h3>
              <Link to="/app/history" className="text-[11px] text-primary-600 hover:underline">
                View Log →
              </Link>
            </div>

            {recentHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No tasks completed yet. Complete a session to start your history.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentHistory.map((item) => (
                  <div
                    key={item.sessionId}
                    onClick={() => navigate('/app/history')}
                    className="p-2.5 rounded-xl border border-border/70 hover:bg-muted/40 transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate max-w-[170px]">
                        {item.topicTitle}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {item.actualMinutes}m
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                      <span className="truncate">{item.subjectName}</span>
                      <span className={item.isOnTime ? 'text-emerald-600' : 'text-amber-600'}>
                        {item.isOnTime ? 'On Time' : 'Late'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Exams Countdown */}
          {summary?.upcomingExams && summary.upcomingExams.length > 0 && (
            <Card className="p-4 border-border">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider mb-3">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Upcoming Examinations
              </h3>
              <div className="space-y-2">
                {summary.upcomingExams.slice(0, 3).map((exam) => (
                  <div
                    key={exam.subjectId}
                    className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{exam.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(exam.examDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        exam.daysLeft <= 3
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                      }`}
                    >
                      {exam.daysLeft <= 0 ? 'Today' : `${exam.daysLeft}d left`}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={isQuickNoteOpen}
        onClose={() => setIsQuickNoteOpen(false)}
        onNoteCreated={() => fetchData()}
      />
    </div>
  );
};
