import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  Clock,
  Calendar,
  Filter,
  Search,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

interface HistoryItem {
  sessionId: string;
  topicId?: string;
  topicTitle: string;
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  subjectColor: string;
  completedAt: string;
  scheduledStart: string;
  scheduledEnd: string;
  plannedMinutes: number;
  actualMinutes: number;
  sessionType: 'study' | 'revision';
  isOnTime: boolean;
  status: string;
  notes?: string;
}

interface HistorySummary {
  totalTasks: number;
  totalActualMinutes: number;
  totalPlannedMinutes: number;
  totalActualHours: number;
  onTimeCount: number;
  lateCount: number;
  onTimeRate: number;
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
}

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all'); // 'all', 'today', 'week', 'month'
  const [taskType, setTaskType] = useState<string>('all'); // 'all', 'study', 'revision'

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedSubject !== 'all') queryParams.append('subjectId', selectedSubject);
      if (taskType !== 'all') queryParams.append('type', taskType);
      if (search.trim()) queryParams.append('search', search.trim());

      const now = new Date();
      if (dateRange === 'today') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        queryParams.append('startDate', start.toISOString());
      } else if (dateRange === 'week') {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        queryParams.append('startDate', start.toISOString());
      } else if (dateRange === 'month') {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        queryParams.append('startDate', start.toISOString());
      }

      const [histRes, sumRes, subjRes] = await Promise.all([
        apiRequest<{ success: boolean; history: HistoryItem[] }>(`/history?${queryParams.toString()}`),
        apiRequest<{ success: boolean; summary: HistorySummary }>('/history/summary'),
        apiRequest<{ success: boolean; subjects: any[] }>('/subjects'),
      ]);

      setHistory(histRes.history || []);
      setSummary(sumRes.summary || null);
      setSubjects(subjRes.subjects || []);
    } catch (err) {
      console.error('[History] Failed to fetch completion history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, [selectedSubject, dateRange, taskType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistoryData();
  };

  const openDetail = (item: HistoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <History className="w-6 h-6 text-primary-600" />
            Completed Task History
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Verified chronological log of your completed academic sessions, study milestones, and time investments.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchHistoryData}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Refresh Log
        </Button>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-border">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Total Completed</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{summary.totalTasks}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {summary.completedToday} today • {summary.completedThisWeek} this week
            </p>
          </Card>

          <Card className="p-4 border-border">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Clock className="w-4 h-4 text-primary-600" />
              <span>Actual Study Time</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{summary.totalActualHours}h</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {summary.totalActualMinutes} total minutes logged
            </p>
          </Card>

          <Card className="p-4 border-border">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>On-Time Rate</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{summary.onTimeRate}%</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {summary.onTimeCount} on-time • {summary.lateCount} post-schedule
            </p>
          </Card>

          <Card className="p-4 border-border">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Monthly Volume</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{summary.completedThisMonth}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Completed in the last 30 days</p>
          </Card>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <Card className="p-4 border-border">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by topic title, subject, or session notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>

            {/* Task Type Filter */}
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="study">Study</option>
              <option value="revision">Revision</option>
            </select>

            <Button type="submit" size="sm">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* History Items List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading completed task history from database...
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8" />}
          title="No completed study tasks yet"
          description="Tasks and sessions you complete in Focus Mode or mark finished in your Timetable will automatically record here."
          actionLabel="Go to Timetable"
          actionPath="/app/timetable"
        />
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.sessionId}
              onClick={() => openDetail(item)}
              className="p-4 rounded-2xl bg-card border border-border hover:border-primary-300 dark:hover:border-primary-800 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs"
                  style={{ backgroundColor: item.subjectColor }}
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-white uppercase tracking-wider"
                      style={{ backgroundColor: item.subjectColor }}
                    >
                      {item.subjectCode || item.subjectName}
                    </span>
                    <Badge variant={item.sessionType === 'revision' ? 'warning' : 'info'} size="sm">
                      {item.sessionType}
                    </Badge>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        item.isOnTime
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}
                    >
                      {item.isOnTime ? 'On Time' : 'Completed Late'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {item.topicTitle}
                  </h3>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    Completed on {new Date(item.completedAt).toLocaleDateString()} at{' '}
                    {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Time & Duration right side */}
              <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-border text-right shrink-0">
                <span className="text-sm font-bold text-foreground">
                  {item.actualMinutes} min
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Planned: {item.plannedMinutes} min
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Completed Task Details"
          description="Detailed execution log and study record"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">
                  {selectedItem.topicTitle}
                </span>
                <Badge variant={selectedItem.isOnTime ? 'success' : 'warning'} size="sm">
                  {selectedItem.isOnTime ? 'Completed On Time' : 'Completed Late'}
                </Badge>
              </div>

              <p className="text-muted-foreground">
                Subject: <strong className="text-foreground">{selectedItem.subjectName}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground block text-[11px]">Scheduled Start</span>
                <span className="font-semibold text-foreground">
                  {new Date(selectedItem.scheduledStart).toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground block text-[11px]">Completed At</span>
                <span className="font-semibold text-foreground">
                  {new Date(selectedItem.completedAt).toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground block text-[11px]">Planned Duration</span>
                <span className="font-semibold text-foreground">{selectedItem.plannedMinutes} minutes</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground block text-[11px]">Actual Duration</span>
                <span className="font-semibold text-foreground">{selectedItem.actualMinutes} minutes</span>
              </div>
            </div>

            {selectedItem.notes && (
              <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                <span className="font-semibold text-foreground block mb-1">Session Notes</span>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedItem.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
