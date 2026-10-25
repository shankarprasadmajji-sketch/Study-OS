import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { StudySession, ProgressSummary, Subject } from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todayMetrics, setTodayMetrics] = useState({
    plannedMinutes: 0,
    completedMinutes: 0,
    totalSessionsToday: 0,
    completedSessionsToday: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, todayRes, subjRes] = await Promise.all([
        apiRequest<{ summary: ProgressSummary }>('/progress/summary'),
        apiRequest<{ sessions: StudySession[]; metrics: any }>('/study-sessions/today'),
        apiRequest<{ subjects: Subject[] }>('/subjects'),
      ]);

      setSummary(sumRes.summary);
      setTodaySessions(todayRes.sessions || []);
      setTodayMetrics(todayRes.metrics || {});
      setSubjects(subjRes.subjects || []);
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

  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-700 to-indigo-800 text-white shadow-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-200">
            Welcome Back, {user?.name}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
            Today's Academic Mission
          </h2>
          <p className="text-xs text-primary-100 mt-1 max-w-xl leading-relaxed">
            {todaySessions.length > 0
              ? `You have ${todaySessions.length} session(s) scheduled today (${plannedHours} hours). Complete them consistently to keep your plan on track.`
              : 'No study sessions scheduled for today. Generate a study plan or review upcoming deadlines.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/app/focus">
            <button className="px-4 py-2 rounded-xl bg-white text-primary-800 hover:bg-primary-50 text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Focus Timer
            </button>
          </Link>
          <Link to="/app/study-plan">
            <button className="px-4 py-2 rounded-xl bg-primary-600/60 hover:bg-primary-600 border border-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Plan Engine
            </button>
          </Link>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Today's Planned</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground">{plannedHours}</span>
            <span className="text-xs text-muted-foreground ml-1">hrs</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {todayMetrics.completedMinutes} mins completed ({todayMetrics.completedSessionsToday}/{todayMetrics.totalSessionsToday} sessions)
          </p>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Topics</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground">
              {(summary?.notStartedTopics || 0) + (summary?.inProgressTopics || 0)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">topics</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Across {summary?.totalSubjects || 0} active courses
          </p>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Syllabus Complete</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-600">
              {summary?.completionPercent || 0}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${summary?.completionPercent || 0}%` }}
            />
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Next Exam</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {summary?.upcomingExams && summary.upcomingExams.length > 0 ? (
              <>
                <span className="text-2xl font-bold text-foreground">
                  {summary.upcomingExams[0].daysLeft}
                </span>
                <span className="text-xs text-muted-foreground ml-1">days</span>
                <p className="text-[11px] text-rose-600 font-medium truncate mt-1">
                  {summary.upcomingExams[0].name}
                </p>
              </>
            ) : (
              <>
                <span className="text-base font-semibold text-muted-foreground">No Exam Set</span>
                <p className="text-[11px] text-muted-foreground mt-1">Add exam date in Subjects</p>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Main Grid: Today's Study Sessions & Weekly Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Study Sheet */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Daily Study Sheet</CardTitle>
                <CardDescription>Scheduled study sessions for your active plan</CardDescription>
              </div>
              <Link to="/app/timetable" className="text-xs font-medium text-primary-600 hover:underline">
                View Timetable →
              </Link>
            </CardHeader>

            {todaySessions.length === 0 ? (
              <EmptyState
                icon={<Clock className="w-6 h-6" />}
                title="No Sessions Scheduled Today"
                description="Your study schedule is clear for today, or you haven't generated a plan for this week."
                actionLabel="Generate Plan"
                onAction={() => window.location.assign('/app/study-plan')}
              />
            ) : (
              <div className="space-y-3">
                {todaySessions.map((sess) => {
                  const isCompleted = sess.status === 'completed';
                  const isMissed = sess.status === 'missed';

                  return (
                    <div
                      key={sess._id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCompleted
                          ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                          : isMissed
                          ? 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800'
                          : 'bg-card border-border hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-1.5 h-10 rounded-full shrink-0 mt-0.5"
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
                            {sess.topicDifficulty && (
                              <Badge
                                size="sm"
                                variant={
                                  sess.topicDifficulty === 'hard'
                                    ? 'danger'
                                    : sess.topicDifficulty === 'medium'
                                    ? 'warning'
                                    : 'default'
                                }
                              >
                                {sess.topicDifficulty}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Planned: {sess.plannedMinutes} mins
                            {sess.actualMinutes > 0 && ` • Logged: ${sess.actualMinutes} mins`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCompleted ? (
                          <Badge variant="success">Completed</Badge>
                        ) : isMissed ? (
                          <Badge variant="danger">Missed</Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteSession(sess._id)}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            >
                              Done
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Weekly Activity Trend Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Weekly Planned vs. Completed Time</CardTitle>
                <CardDescription>Daily study effort (in minutes) over the last 7 days</CardDescription>
              </div>
              <Badge variant="outline">Past 7 Days</Badge>
            </CardHeader>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="plannedMinutes" name="Planned Minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualMinutes" name="Actual Studied" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right Column: Upcoming Exams & Subject Progress */}
        <div className="space-y-4">
          {/* Upcoming Examinations Countdown */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Examinations</CardTitle>
              <CardDescription>Subject exam deadlines</CardDescription>
            </CardHeader>

            {summary?.upcomingExams && summary.upcomingExams.length > 0 ? (
              <div className="space-y-3">
                {summary.upcomingExams.map((ex) => (
                  <div
                    key={ex.subjectId}
                    className="p-3 rounded-xl border border-border bg-card flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: ex.color || '#4f46e5' }}
                      />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{ex.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ex.code || 'Course Exam'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold ${
                          ex.daysLeft <= 3 ? 'text-rose-600' : ex.daysLeft <= 7 ? 'text-amber-600' : 'text-primary-600'
                        }`}
                      >
                        {ex.daysLeft < 0 ? 'Passed' : ex.daysLeft === 0 ? 'Today' : `${ex.daysLeft} days`}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ex.examDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No exam deadlines configured yet. Edit subjects to set dates.
              </div>
            )}
          </Card>

          {/* Subject Syllabus Progress breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Syllabus Completion</CardTitle>
                <CardDescription>Course-by-course status</CardDescription>
              </div>
              <Link to="/app/subjects" className="text-xs text-primary-600 hover:underline">
                Manage →
              </Link>
            </CardHeader>

            <div className="space-y-3">
              {subjects.slice(0, 4).map((s) => (
                <div key={s._id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-muted-foreground font-mono">
                      {s.completedTopics || 0}/{s.totalTopics || 0} ({s.completionPercent || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${s.completionPercent || 0}%`,
                        backgroundColor: s.color || '#4f46e5',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
