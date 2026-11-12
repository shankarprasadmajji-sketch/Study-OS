import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  ListTodo,
  Calendar,
  Sparkles,
  ArrowRight,
  Play,
  BookOpen,
  Flame,
  FileText,
  Headphones,
  Timer,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { StudySession, Subject } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { QuickNoteModal } from '../../components/notes/QuickNoteModal.js';
import { TopicLearningWorkspace } from '../../components/studyPlan/TopicLearningWorkspace.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [streaks, setStreaks] = useState<any | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [activeLearningTopicId, setActiveLearningTopicId] = useState<string | null>(null);

  const [todayMetrics, setTodayMetrics] = useState({
    plannedMinutes: 0,
    completedMinutes: 0,
    totalSessionsToday: 0,
    completedSessionsToday: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [todayRes, subjRes, strkRes, topRes] = await Promise.all([
        apiRequest<{ sessions: StudySession[]; metrics: any }>('/study-sessions/today'),
        apiRequest<{ subjects: Subject[] }>('/subjects'),
        apiRequest<{ streaks: any }>('/progress/streaks'),
        apiRequest<{ topics: any[] }>('/topics'),
      ]);

      setTodaySessions(todayRes.sessions || []);
      setTodayMetrics(todayRes.metrics || {});
      setSubjects(subjRes.subjects || []);
      setStreaks(strkRes.streaks || null);
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

  if (loading && subjects.length === 0 && topics.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  // If user has zero subjects, show clean welcome state & one obvious next action
  if (subjects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <Card className="p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 block mb-1">
              Welcome to StudyOS, {user?.name || 'Student'}!
            </span>
            <h2 className="text-2xl font-bold text-foreground">No subjects added yet.</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
              Start by adding your subjects and the topics you want to learn.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/app/onboarding">
              <Button
                size="lg"
                className="bg-primary-600 hover:bg-primary-700 text-white shadow-md font-bold"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Build Workspace with AI Assistant
              </Button>
            </Link>
            <Link to="/app/subjects?action=new">
              <Button size="lg" variant="outline" leftIcon={<Plus className="w-4 h-4" />}>
                Add Your First Subject
              </Button>
            </Link>
          </div>

          <div className="space-y-3 text-left pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Student Journey
            </h3>
            <Link
              to="/app/subjects?action=new"
              className="p-3.5 rounded-xl border border-primary-500/40 bg-primary-50/20 dark:bg-primary-950/20 hover:border-primary-500 flex items-center justify-between transition-colors block"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Add Subjects</h4>
                  <p className="text-[11px] text-muted-foreground">Add course names and exam dates</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-primary-600" />
            </Link>

            <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Enter Syllabus Topics</h4>
                  <p className="text-[11px] text-muted-foreground">Add chapters and estimated study durations</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Generate AI Study Plan</h4>
                  <p className="text-[11px] text-muted-foreground">Build your personalized learning roadmap</p>
                </div>
              </div>
            </div>
          </div>
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

  // Next upcoming study session
  const nextSession =
    todaySessions.find((s) => s.status === 'scheduled') ||
    todaySessions.find((s) => s.status === 'in_progress') ||
    todaySessions[0];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner: Personalized Greeting + 3 Small Quick Actions */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-700 via-primary-800 to-indigo-900 text-white shadow-elevated flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-200">
            Welcome Back, {user?.name || 'Student'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
            Academic Command Center
          </h2>
          <p className="text-xs text-primary-100 mt-1 max-w-xl leading-relaxed">
            {todayMetrics.totalSessionsToday > 0
              ? `You have ${todayMetrics.totalSessionsToday} study task(s) scheduled for today (${plannedHours} hours planned).`
              : 'No sessions scheduled for today. Generate an AI study plan or review pending topics.'}
          </p>
        </div>

        {/* Three Small Quick Actions: Quick Note, Focus Mode, Study Music */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: Quick Note */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsQuickNoteOpen(true)}
            leftIcon={<FileText className="w-3.5 h-3.5 text-white" />}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm text-xs font-medium"
          >
            <span>Quick Note</span>
          </Button>

          {/* Action 2: Focus Mode */}
          <Link to="/app/focus">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Timer className="w-3.5 h-3.5 text-white" />}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm text-xs font-medium"
            >
              <span>Focus Mode</span>
            </Button>
          </Link>

          {/* Action 3: Study Music */}
          <Link to="/app/music">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Headphones className="w-3.5 h-3.5 text-white" />}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm text-xs font-medium"
            >
              <span>Study Music</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Next Upcoming Study Session & Start Learning Hero Card */}
      {nextSession && nextSession.status !== 'completed' ? (
        <Card className="p-5 border-2 border-primary-500/40 bg-gradient-to-r from-card via-card to-primary-50/20 dark:to-primary-950/20 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                style={{ backgroundColor: nextSession.subjectColor || '#4f46e5' }}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Next Upcoming Session
                  </span>
                  <Badge
                    size="sm"
                    style={{
                      backgroundColor: `${nextSession.subjectColor || '#4f46e5'}20`,
                      color: nextSession.subjectColor || '#4f46e5',
                    }}
                  >
                    {nextSession.subjectName}
                  </Badge>
                  <Badge size="sm" variant={nextSession.sessionType === 'revision' ? 'warning' : 'outline'}>
                    {nextSession.sessionType === 'revision' ? 'Spaced Revision' : 'Deep Study'}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-foreground truncate">
                  {nextSession.topicTitle}
                </h3>

                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-primary-500" />
                  <span>
                    {new Date(nextSession.scheduledStart).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(nextSession.scheduledEnd).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    ({nextSession.plannedMinutes} minutes planned)
                  </span>
                </p>
              </div>
            </div>

            {/* Start Learning Action Button */}
            <div className="shrink-0 self-end sm:self-center">
              <Button
                size="md"
                variant="white"
                onClick={() => setActiveLearningTopicId(nextSession.topicId)}
                leftIcon={<Play className="w-4 h-4 text-primary-900 fill-primary-900" />}
                className="font-bold shadow-md text-xs sm:text-sm px-5"
              >
                Start Learning
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">
                {todaySessions.length > 0
                  ? 'All tasks scheduled for today are complete!'
                  : 'No active session scheduled right now'}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Visit your AI Study Plan to schedule upcoming topics or start learning a pending topic.
              </p>
            </div>
          </div>

          <Link to="/app/study-plan">
            <Button size="sm" variant="outline" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
              Open Study Plan
            </Button>
          </Link>
        </Card>
      )}

      {/* 3. Essential Real-Data Statistics Row (No repeated or decorative metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Completed vs Pending Topics */}
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <ListTodo className="w-4 h-4 text-primary-600" />
              Syllabus Coverage
            </span>
            <Link to="/app/subjects" className="text-[11px] text-primary-600 hover:underline">
              Subjects →
            </Link>
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">
            {completedTopicsCount}{' '}
            <span className="text-xs font-semibold text-muted-foreground">/ {topics.length} done</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {pendingTopicsCount} pending topics • {topicCompletionRate}% complete
          </p>
        </Card>

        {/* Current Study Streak (Only when real data exists) */}
        <Card className="p-4 border-border bg-gradient-to-br from-card to-amber-50/20 dark:to-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              Study Streak
            </span>
            <Link to="/app/progress" className="text-[11px] text-primary-600 hover:underline">
              View Map →
            </Link>
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">
            {streaks?.currentStreak || 0}{' '}
            <span className="text-xs font-semibold text-muted-foreground">days</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {(streaks?.currentStreak || 0) > 0
              ? streaks?.isActiveToday
                ? '🔥 Active today! Keep it up!'
                : 'Pending today: complete a task to maintain streak'
              : 'Complete a study session today to ignite your streak'}
          </p>
        </Card>

        {/* Today's Tasks Progress */}
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-indigo-600" />
              Today's Tasks
            </span>
            <Link to="/app/timetable" className="text-[11px] text-primary-600 hover:underline">
              Timetable →
            </Link>
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">
            {todayMetrics.completedSessionsToday}{' '}
            <span className="text-xs font-semibold text-muted-foreground">
              / {todayMetrics.totalSessionsToday} done
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {todayMetrics.totalSessionsToday > 0
              ? `${completedHours}h completed of ${plannedHours}h planned`
              : 'No study tasks scheduled for today'}
          </p>
        </Card>
      </div>

      {/* 4. Today's Study Tasks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" />
            Today's Study Tasks ({todaySessions.length})
          </h3>
          <Link to="/app/timetable" className="text-xs text-primary-600 hover:underline">
            View Full Timetable →
          </Link>
        </div>

        {todaySessions.length === 0 ? (
          <Card className="p-8 text-center border-border">
            <EmptyState
              icon={<Calendar className="w-8 h-8" />}
              title="No study tasks scheduled for today"
              description="Use the AI Study Plan to generate a daily curriculum breakdown based on your syllabus."
              actionLabel="Go to AI Study Plan"
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
                      ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900'
                      : isMissed
                      ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900'
                      : 'bg-card border-border hover:border-primary-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
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
                          <Badge
                            variant={isCompleted ? 'success' : isMissed ? 'danger' : 'info'}
                            size="sm"
                          >
                            {session.status}
                          </Badge>
                          <Badge
                            size="sm"
                            variant={session.sessionType === 'revision' ? 'warning' : 'outline'}
                          >
                            {session.sessionType === 'revision' ? 'Revision' : 'Study'}
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
                      {!isCompleted && (
                        <Button
                          size="sm"
                          onClick={() => setActiveLearningTopicId(session.topicId)}
                          leftIcon={<Play className="w-3.5 h-3.5 text-primary-900 fill-primary-900" />}
                          variant="white"
                          className="font-bold text-xs"
                        >
                          Start Learning
                        </Button>
                      )}

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

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={isQuickNoteOpen}
        onClose={() => setIsQuickNoteOpen(false)}
        onNoteCreated={() => fetchData()}
      />

      {/* Topic Learning Workspace Modal when student clicks "Start Learning" */}
      {activeLearningTopicId && (
        <TopicLearningWorkspace
          topicId={activeLearningTopicId}
          onClose={() => {
            setActiveLearningTopicId(null);
            fetchData();
          }}
          onTopicStatusChanged={() => fetchData()}
        />
      )}
    </div>
  );
};

export default DashboardPage;
