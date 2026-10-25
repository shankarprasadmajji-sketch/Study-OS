import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  History,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { apiRequest } from '../../api/client.js';
import { ProgressSummary } from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

export const ProgressPage: React.FC = () => {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [subjectsProgress, setSubjectsProgress] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sumRes, subjRes, histRes] = await Promise.all([
          apiRequest<{ summary: ProgressSummary }>('/progress/summary'),
          apiRequest<{ subjects: any[] }>('/progress/subjects'),
          apiRequest<{ history: any[] }>('/progress/history'),
        ]);
        setSummary(sumRes.summary);
        setSubjectsProgress(subjRes.subjects || []);
        setHistory(histRes.history || []);
      } catch (err) {
        console.error('Failed to load progress analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-muted rounded-2xl" />
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
        <h2 className="text-xl font-bold tracking-tight text-foreground">Progress & Analytics</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real academic progress, syllabus mastery percentages, and study hours tracking
        </p>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover>
          <span className="text-xs font-medium text-muted-foreground">Overall Syllabus</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-foreground">
              {summary?.completionPercent || 0}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {summary?.completedTopics || 0} of {summary?.totalTopics || 0} topics completed
          </p>
        </Card>

        <Card hover>
          <span className="text-xs font-medium text-muted-foreground">Recorded Study Effort</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-emerald-600">
              {summary?.totalActualHours || 0}
            </span>
            <span className="text-xs text-muted-foreground">hours</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Against {summary?.totalPlannedHours || 0} planned hours
          </p>
        </Card>

        <Card hover>
          <span className="text-xs font-medium text-muted-foreground">Active Courses</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-foreground">
              {summary?.totalSubjects || 0}
            </span>
            <span className="text-xs text-muted-foreground">subjects</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {(summary?.totalTopics || 0)} syllabus units total
          </p>
        </Card>

        <Card hover>
          <span className="text-xs font-medium text-muted-foreground">Upcoming Deadlines</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-primary-600">
              {summary?.upcomingExams?.length || 0}
            </span>
            <span className="text-xs text-muted-foreground">exams</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Configured semester milestones
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daily Study Effort Trend</CardTitle>
              <CardDescription>Planned minutes vs. actual minutes logged per day</CardDescription>
            </div>
            <Badge variant="outline">7-Day History</Badge>
          </CardHeader>
          <div className="h-72 w-full pt-2">
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
                <Bar dataKey="plannedMinutes" name="Planned (mins)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actualMinutes" name="Studied (mins)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Syllabus Breakdown Donut */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Topic Status Distribution</CardTitle>
            <CardDescription>Overall breakdown of topic progression</CardDescription>
          </CardHeader>
          <div className="h-56 w-full flex items-center justify-center">
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
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border text-center text-xs">
            <div>
              <span className="text-emerald-600 font-bold block">{summary?.completedTopics || 0}</span>
              <span className="text-[10px] text-muted-foreground">Completed</span>
            </div>
            <div>
              <span className="text-amber-600 font-bold block">{summary?.inProgressTopics || 0}</span>
              <span className="text-[10px] text-muted-foreground">In Progress</span>
            </div>
            <div>
              <span className="text-muted-foreground font-bold block">{summary?.notStartedTopics || 0}</span>
              <span className="text-[10px] text-muted-foreground">Not Started</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Subject Detailed Progress Cards */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Course-by-Course Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectsProgress.map((subj) => (
            <Card key={subj.subjectId} className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: subj.color || '#4f46e5' }}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-foreground truncate">{subj.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{subj.code || 'Course'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-semibold text-foreground">
                    {subj.completedTopics}/{subj.totalTopics} ({subj.completionPercent}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${subj.completionPercent}%`,
                      backgroundColor: subj.color || '#4f46e5',
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                <span>Studied: {subj.actualHours} hrs</span>
                {subj.daysToExam !== null ? (
                  <span className="font-semibold text-primary-600">
                    Exam: {subj.daysToExam}d
                  </span>
                ) : (
                  <span>No exam</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Study Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Study Activity Log</CardTitle>
          <CardDescription>Verified completed study blocks</CardDescription>
        </CardHeader>

        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No completed study sessions logged yet. Complete sessions on your Timetable to view activity history.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {history.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">{item.topicTitle}</span>
                    <span className="text-[11px] text-muted-foreground block">
                      {item.subjectName} • {new Date(item.completedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  {item.minutesSpent} mins studied
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
