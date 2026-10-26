import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  History,
  BookOpen,
  Flame,
  Target,
  Info,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { apiRequest } from '../../api/client.js';
import { ProgressSummary } from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';

interface AccuracyData {
  formula: string;
  totalPlannedSessionsDue: number;
  correctlyCompletedTasks: number;
  accuracyPercent: number | null;
  onTimeCompletedCount: number;
  lateCompletedCount: number;
  missedSessionsCount: number;
  onTimeCompletionRate: number;
  plannedMinutes: number;
  actualMinutes: number;
  plannedHours: number;
  actualHours: number;
  subjectBreakdown: Array<{
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    totalDue: number;
    completed: number;
    accuracyPercent: number | null;
  }>;
}

interface StreaksData {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  lastActiveDate: string | null;
  timezone: string;
  motivatingMessage: string;
  recentDays: Array<{
    date: string;
    dayLabel: string;
    isCompleted: boolean;
    minutes: number;
    count: number;
  }>;
}

export const ProgressPage: React.FC = () => {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [subjectsProgress, setSubjectsProgress] = useState<any[]>([]);
  const [accuracy, setAccuracy] = useState<AccuracyData | null>(null);
  const [streaks, setStreaks] = useState<StreaksData | null>(null);
  const [accuracyRange, setAccuracyRange] = useState<string>('all');
  const [showFormulaTooltip, setShowFormulaTooltip] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [sumRes, subjRes, accRes, strkRes] = await Promise.all([
        apiRequest<{ summary: ProgressSummary }>('/progress/summary'),
        apiRequest<{ subjects: any[] }>('/progress/subjects'),
        apiRequest<{ accuracy: AccuracyData }>(`/progress/accuracy?range=${accuracyRange}`),
        apiRequest<{ streaks: StreaksData }>('/progress/streaks'),
      ]);
      setSummary(sumRes.summary);
      setSubjectsProgress(subjRes.subjects || []);
      setAccuracy(accRes.accuracy || null);
      setStreaks(strkRes.streaks || null);
    } catch (err) {
      console.error('Failed to load progress analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [accuracyRange]);

  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-muted rounded-2xl" />
          <div className="h-72 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  // Data for syllabus status donut chart
  const statusPieData = [
    { name: 'Completed', value: summary?.completedTopics || 0, color: '#10b981' },
    { name: 'In Progress', value: summary?.inProgressTopics || 0, color: '#f59e0b' },
    { name: 'Not Started', value: summary?.notStartedTopics || 0, color: '#94a3b8' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-primary-600" />
          Academic Progress, Accuracy & Streaks
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Measurable execution data: track consecutive study streaks, task completion accuracy, and syllabus mastery.
        </p>
      </div>

      {/* Hero Cards: Study Streak & Study Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Streak Card (6 cols) */}
        {streaks && (
          <Card className="lg:col-span-6 p-6 border-border bg-gradient-to-br from-card via-card to-amber-50/40 dark:to-amber-950/20 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
                  Study Streak
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                    {streaks.currentStreak}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    days streak
                  </span>
                </div>
                <p className="text-xs text-foreground font-medium mt-1">
                  {streaks.motivatingMessage}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-muted-foreground block">Longest Streak</span>
                <span className="text-lg font-bold text-foreground">
                  🏆 {streaks.longestStreak} days
                </span>
                <span
                  className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    streaks.isActiveToday
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {streaks.isActiveToday ? 'Active Today' : 'Pending Today'}
                </span>
              </div>
            </div>

            {/* 14-day Heatmap Strip */}
            <div className="mt-5 pt-4 border-t border-border">
              <span className="text-[11px] font-medium text-muted-foreground block mb-2">
                Past 14 Days Activity Heatmap ({streaks.timezone})
              </span>
              <div className="grid grid-cols-14 gap-1 sm:gap-1.5">
                {streaks.recentDays.map((day) => (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-1"
                    title={`${day.date} (${day.dayLabel}): ${
                      day.isCompleted
                        ? `${day.count} sessions completed (${day.minutes}m)`
                        : 'No activity logged'
                    }`}
                  >
                    <div
                      className={`w-full aspect-square rounded-md transition-all ${
                        day.isCompleted
                          ? 'bg-emerald-500 shadow-sm'
                          : 'bg-muted border border-border/80'
                      }`}
                    />
                    <span className="text-[9px] text-muted-foreground hidden sm:block">
                      {day.dayLabel.charAt(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Study Accuracy Card (6 cols) */}
        {accuracy && (
          <Card className="lg:col-span-6 p-6 border-border bg-gradient-to-br from-card via-card to-primary-50/40 dark:to-primary-950/20 relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-primary-600" />
                  Study Completion Accuracy
                </span>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                    {accuracy.accuracyPercent !== null ? `${accuracy.accuracyPercent}%` : 'N/A'}
                  </span>
                  {accuracy.accuracyPercent === null && (
                    <span className="text-xs text-muted-foreground font-medium">
                      (Not enough due tasks)
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  {accuracy.correctlyCompletedTasks} of {accuracy.totalPlannedSessionsDue} due tasks completed as planned.
                </p>
              </div>

              {/* Filter & Info */}
              <div className="flex flex-col items-end gap-2">
                <select
                  value={accuracyRange}
                  onChange={(e) => setAccuracyRange(e.target.value)}
                  className="px-2.5 py-1 bg-muted/60 border border-border rounded-lg text-xs text-foreground focus:outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
                </select>

                <button
                  onClick={() => setShowFormulaTooltip((prev) => !prev)}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>How is this calculated?</span>
                </button>
              </div>
            </div>

            {/* Formula Explainer Banner */}
            {showFormulaTooltip && (
              <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 rounded-xl text-xs text-foreground space-y-1">
                <p className="font-semibold text-primary-900 dark:text-primary-200">
                  Transparent Accuracy Metric:
                </p>
                <code className="block bg-card px-2 py-1 rounded text-[11px] font-mono border border-border">
                  Accuracy (%) = (Correctly Completed Due Tasks ÷ Total Planned Tasks Due) × 100
                </code>
                <p className="text-[11px] text-muted-foreground pt-1">
                  • Tasks not yet due are excluded from the denominator.
                  • Cancelled sessions do not count against you.
                  • Completed on-time ({accuracy.onTimeCompletedCount}) and completed late ({accuracy.lateCompletedCount}) are tracked independently.
                </p>
              </div>
            )}

            {/* Breakdown Sub-metrics */}
            <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-border text-center">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">On-Time</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {accuracy.onTimeCompletedCount}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Late</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {accuracy.lateCompletedCount}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Missed</span>
                <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                  {accuracy.missedSessionsCount}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Weekly Planned vs Actual Trend Chart */}
      <Card className="p-6 border-border">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base">7-Day Study Effort: Planned vs. Actual Hours</CardTitle>
          <CardDescription className="text-xs">
            Review actual focus time logged against planned timetable allocations
          </CardDescription>
        </CardHeader>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary?.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${Math.round(val / 60)}h`}
              />
              <Tooltip
                formatter={(val: any) => [`${Math.round(Number(val))} min (${(Number(val) / 60).toFixed(1)}h)`, '']}
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="plannedMinutes" name="Planned Minutes" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actualMinutes" name="Actual Completed Minutes" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Grid: Subject Breakdown & Syllabus Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Subject Progress Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-600" />
            Subject-Wise Syllabus Coverage
          </h2>

          <div className="space-y-3">
            {subjectsProgress.map((subj) => (
              <Card key={subj.subjectId} className="p-4 border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subj.color || '#4f46e5' }}
                    />
                    <h3 className="text-xs font-bold text-foreground">
                      {subj.name} {subj.code && <span className="text-muted-foreground font-normal">({subj.code})</span>}
                    </h3>
                  </div>

                  <span className="text-xs font-bold text-foreground">
                    {subj.completionPercent}%
                  </span>
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${subj.completionPercent}%`,
                      backgroundColor: subj.color || '#4f46e5',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {subj.completedTopics} of {subj.totalTopics} topics completed
                  </span>
                  <span>
                    Actual Time: <strong className="text-foreground">{subj.actualHours}h</strong> / Planned: {subj.plannedHours}h
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Syllabus Status Donut Chart (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Overall Topic Status
          </h2>

          <Card className="p-6 border-border flex flex-col items-center justify-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              {statusPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">
                    {item.name}: <strong className="text-foreground">{item.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
