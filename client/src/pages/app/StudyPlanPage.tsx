import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Layers,
  ArrowRight,
  ListTodo,
  FileCheck,
  ShieldCheck,
  Info,
  BookOpen,
  Play,
  Flame,
  Award,
  Video,
  CreditCard,
  HelpCircle,
  GraduationCap,
  ExternalLink,
  Brain,
  TrendingUp,
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { apiRequest } from '../../api/client.js';
import {
  StudyPlan,
  StudySession,
  Topic,
  Subject,
  AIWorkspaceProgress,
  AIStatusInfo,
} from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { TopicLearningWorkspace } from '../../components/studyPlan/TopicLearningWorkspace.js';

export const StudyPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSubjectsCount, setUserSubjectsCount] = useState<number | null>(null);
  const [userTopicsCount, setUserTopicsCount] = useState<number | null>(null);

  // Active Learning Topic Workspace State (Modal)
  const [activeLearningTopicId, setActiveLearningTopicId] = useState<string | null>(null);

  // AI Assistant & Progress State
  const [aiStatus, setAiStatus] = useState<AIStatusInfo>({
    configured: false,
    provider: null,
    message: '',
  });
  const [learningProgress, setLearningProgress] = useState<AIWorkspaceProgress | null>(null);

  // Generate Plan Modal State
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [useAIPlanner, setUseAIPlanner] = useState(true);

  // AI Setup Modal
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const [planFormData, setPlanFormData] = useState({
    name: 'Personalized Academic Semester Plan',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    preferredSessionMinutes: 50,
    breakMinutes: 10,
  });

  // Preview State
  const [previewData, setPreviewData] = useState<any | null>(null);

  // Recovery Modal State
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [missedSessions, setMissedSessions] = useState<StudySession[]>([]);
  const [selectedMissedId, setSelectedMissedId] = useState('');
  const [recoveryProposal, setRecoveryProposal] = useState<any | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const [res, allSess, subjRes, topRes, statusRes, progRes] = await Promise.all([
        apiRequest<{ plan: StudyPlan | null; sessions?: StudySession[] }>('/study-plans'),
        apiRequest<{ sessions: StudySession[] }>('/study-sessions'),
        apiRequest<{ subjects: Subject[] }>('/subjects'),
        apiRequest<{ topics: Topic[] }>('/topics'),
        apiRequest<AIStatusInfo>('/ai/status').catch(() => ({
          configured: false,
          provider: null,
          message: 'AI Service status unavailable',
        })),
        apiRequest<{ progress: AIWorkspaceProgress }>('/ai/progress').catch(() => null),
      ]);

      setActivePlan(res.plan);
      setSessions(res.sessions || []);
      setSubjects(subjRes.subjects || []);
      setTopics(topRes.topics || []);
      setAiStatus(statusRes);
      if (progRes?.progress) {
        setLearningProgress(progRes.progress);
      }

      const missed = (allSess.sessions || []).filter((s) => s.status === 'missed');
      setMissedSessions(missed);
      if (missed.length > 0 && !selectedMissedId) {
        setSelectedMissedId(missed[0]._id);
      }

      setUserSubjectsCount(subjRes.subjects?.length || 0);
      setUserTopicsCount(topRes.topics?.length || 0);
    } catch (err) {
      console.error('Failed to load study plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  // Filter Today's Sessions
  const todaySessions = sessions.filter((s) => {
    try {
      return isSameDay(new Date(s.scheduledStart), today);
    } catch {
      return false;
    }
  });

  // Run preview before saving
  const handlePreviewPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError(null);

    if (planFormData.startDate < todayStr) {
      setPlanError('Plan start date cannot be in the past. Please select today or a future date.');
      return;
    }

    if (planFormData.endDate < planFormData.startDate) {
      setPlanError('End date must be on or after start date.');
      return;
    }

    setIsGenerating(true);
    try {
      if (useAIPlanner && aiStatus.configured) {
        const res = await apiRequest('/ai/plan/generate', {
          method: 'POST',
          body: JSON.stringify({
            ...planFormData,
            savePlan: false,
          }),
        });
        setPreviewData(res);
      } else {
        // Deterministic algorithmic scheduler
        const res = await apiRequest('/study-plans/generate', {
          method: 'POST',
          body: JSON.stringify({
            ...planFormData,
            savePlan: false,
          }),
        });
        setPreviewData(res);
      }
    } catch (err: any) {
      if (err.details?.configured === false || err.message?.includes('AI_KEY_NOT_CONFIGURED')) {
        setPlanError(
          'AI Assistant requires an API key in server/.env. You can switch to the Deterministic Scheduler or configure GEMINI_API_KEY.'
        );
      } else {
        setPlanError(err.message || 'Plan generation preview failed.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Confirm and persist generated plan
  const handleSavePlan = async () => {
    setIsGenerating(true);
    try {
      if (useAIPlanner && aiStatus.configured) {
        await apiRequest('/ai/plan/generate', {
          method: 'POST',
          body: JSON.stringify({
            ...planFormData,
            savePlan: true,
          }),
        });
      } else {
        await apiRequest('/study-plans/generate', {
          method: 'POST',
          body: JSON.stringify({
            ...planFormData,
            savePlan: true,
          }),
        });
      }
      setGenerateModalOpen(false);
      setPreviewData(null);
      fetchPlan();
    } catch (err: any) {
      alert(err.message || 'Failed to save generated plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview Missed Session Recovery
  const handlePreviewRecovery = async () => {
    if (!selectedMissedId || !activePlan) return;
    setIsRecovering(true);
    try {
      const res = await apiRequest(`/study-plans/${activePlan._id}/recover`, {
        method: 'POST',
        body: JSON.stringify({
          missedSessionId: selectedMissedId,
          applyChanges: false,
        }),
      });
      setRecoveryProposal(res.proposal);
    } catch (err: any) {
      alert(err.message || 'Recovery preview failed.');
    } finally {
      setIsRecovering(false);
    }
  };

  // Commit Missed Session Recovery
  const handleApplyRecovery = async () => {
    if (!selectedMissedId || !activePlan) return;
    setIsRecovering(true);
    try {
      await apiRequest(`/study-plans/${activePlan._id}/recover`, {
        method: 'POST',
        body: JSON.stringify({
          missedSessionId: selectedMissedId,
          applyChanges: true,
        }),
      });
      setRecoveryModalOpen(false);
      setRecoveryProposal(null);
      fetchPlan();
    } catch (err: any) {
      alert(err.message || 'Failed to apply recovery.');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ======================================================== */}
      {/* 1. AI LEARNING ASSISTANT HEADER & INTELLIGENCE CENTER    */}
      {/* ======================================================== */}
      <Card className="p-6 bg-gradient-to-r from-primary-900/10 via-card to-card border border-primary-200/50 dark:border-primary-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                <Brain className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                AI Learning Assistant & Curriculum Planner
              </h1>
              <Badge
                variant={aiStatus.configured ? 'success' : 'outline'}
                className="flex items-center gap-1.5"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    aiStatus.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>
                  {aiStatus.configured
                    ? `AI Assistant Active (${aiStatus.provider === 'gemini' ? 'Gemini' : 'OpenAI'})`
                    : 'AI Setup Guide Available'}
                </span>
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Deconstruct your actual subjects and syllabus topics into bite-sized learning units.
              Generates pedagogical video recommendations, active recall flashcards, visual
              flowcharts, and practice quizzes with dedicated AI Chat Tutor assistance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {!aiStatus.configured && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSetupModalOpen(true)}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
              >
                Configure AI Key
              </Button>
            )}

            {missedSessions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRecoveryProposal(null);
                  setRecoveryModalOpen(true);
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
              >
                Recover Missed ({missedSessions.length})
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => {
                setPreviewData(null);
                setGenerateModalOpen(true);
              }}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-sm"
            >
              Generate AI Study Plan
            </Button>
          </div>
        </div>

        {/* Quick Intelligence Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border">
          <div className="p-3 rounded-xl bg-card border border-border">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Enrolled Subjects
            </span>
            <span className="text-sm font-extrabold text-foreground mt-0.5 block">
              {subjects.length} Subjects
            </span>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Curriculum Topics
            </span>
            <span className="text-sm font-extrabold text-foreground mt-0.5 block">
              {topics.length} Syllabus Topics
            </span>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Flashcards Mastered
            </span>
            <span className="text-sm font-extrabold text-foreground mt-0.5 block">
              {learningProgress?.flashcardsMastered || 0} /{' '}
              {learningProgress?.flashcardsTotal || 0} Cards
            </span>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Avg Quiz Accuracy
            </span>
            <span className="text-sm font-extrabold text-foreground mt-0.5 block">
              {learningProgress?.averageQuizAccuracy !== null &&
              learningProgress?.averageQuizAccuracy !== undefined
                ? `${learningProgress.averageQuizAccuracy}%`
                : 'No quizzes taken yet'}
            </span>
          </div>
        </div>
      </Card>

      {/* ======================================================== */}
      {/* 3. TODAY'S LEARNING SECTION                              */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Today's Learning Schedule
            </h3>
          </div>
          <Badge size="sm" variant="outline">
            {todaySessions.length} Session(s) Scheduled Today
          </Badge>
        </div>

        {todaySessions.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-border bg-muted/20 text-center space-y-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold text-foreground">
              No study sessions scheduled for today!
            </p>
            <p className="text-[11px] text-muted-foreground">
              You are all caught up, or you can select any topic below to launch a learning workspace.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaySessions.map((sess) => (
              <Card
                key={sess._id}
                className="p-4 border border-border hover:border-primary-400 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge
                      size="sm"
                      style={{
                        backgroundColor: `${sess.subjectColor || '#4f46e5'}20`,
                        color: sess.subjectColor || '#4f46e5',
                      }}
                    >
                      {sess.subjectName || 'Subject'}
                    </Badge>
                    <Badge size="sm" variant={sess.sessionType === 'revision' ? 'warning' : 'outline'}>
                      {sess.sessionType === 'revision' ? 'Spaced Revision' : 'Deep Study'}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-foreground text-xs line-clamp-2">
                    {sess.topicTitle || 'Study Session'}
                  </h4>

                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {format(new Date(sess.scheduledStart), 'h:mm a')} • {sess.plannedMinutes} mins
                    </span>
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => setActiveLearningTopicId(sess.topicId)}
                  leftIcon={<Play className="w-3.5 h-3.5 text-primary-900 fill-primary-900" />}
                  variant="white"
                  className="w-full font-bold shadow-sm"
                >
                  Start Learning
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. MY STUDY PLAN (ACTIVE PLAN & TOPIC SESSIONS)          */}
      {/* ======================================================== */}
      {loading ? (
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      ) : !activePlan ? (
        userSubjectsCount === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-7 h-7" />}
            title="No subjects added yet"
            description="You must add at least one subject and syllabus topics before generating an optimized study plan."
            actionLabel="Add Subject"
            onAction={() => navigate('/app/subjects')}
          />
        ) : userTopicsCount === 0 ? (
          <EmptyState
            icon={<ListTodo className="w-7 h-7" />}
            title="No topics added yet"
            description="You must add syllabus topics to your subjects before the scheduling engine can generate a study plan."
            actionLabel="Add Syllabus Topics"
            onAction={() => navigate('/app/topics')}
          />
        ) : (
          <EmptyState
            icon={<Sparkles className="w-7 h-7" />}
            title="No Active Study Plan Found"
            description="Click below to let the AI Assistant analyze your syllabus topics, available hours, and exam dates to produce a realistic learning plan."
            actionLabel="Generate AI Study Plan"
            onAction={() => {
              setPreviewData(null);
              setGenerateModalOpen(true);
            }}
          />
        )
      ) : (
        <div className="space-y-6">
          {/* Main Active Plan Card */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-foreground">{activePlan.name}</h3>
                  <Badge
                    variant={
                      activePlan.feasibility?.status === 'feasible'
                        ? 'success'
                        : activePlan.feasibility?.status === 'tight'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {activePlan.feasibility?.status?.toUpperCase() || 'ACTIVE'}
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Algorithm: {activePlan.algorithmVersion || 'AI-2.0'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Horizon: {format(new Date(activePlan.startDate), 'MMM d, yyyy')} –{' '}
                  {format(new Date(activePlan.endDate), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Feasibility Score Gauge */}
              <div className="flex items-center gap-4 bg-muted/60 p-3 rounded-2xl border border-border">
                <div className="text-right">
                  <span className="text-xs font-semibold text-foreground block">
                    Feasibility Score
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {activePlan.feasibility?.status === 'feasible'
                      ? 'Workload fits comfortably'
                      : activePlan.feasibility?.status === 'tight'
                      ? 'Tight schedule capacity'
                      : 'Capacity shortfall detected'}
                  </span>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl text-white flex items-center justify-center font-extrabold text-base shadow-sm ${
                    (activePlan.feasibility?.score ?? 0) >= 80
                      ? 'bg-emerald-600'
                      : (activePlan.feasibility?.score ?? 0) >= 50
                      ? 'bg-amber-600'
                      : 'bg-rose-600'
                  }`}
                >
                  {activePlan.feasibility?.score ?? 0}
                </div>
              </div>
            </div>

            {/* Explanations & Warnings */}
            {activePlan.feasibility?.warnings && activePlan.feasibility.warnings.length > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Capacity & Workload Warning:</span>
                  {activePlan.feasibility.warnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Curriculum Learning Units & Sessions (Every Topic with Start Learning Button) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Study Plan — Scheduled Curriculum Topics</CardTitle>
                <CardDescription>
                  Click "Start Learning" on any topic to launch the interactive workspace with video
                  lectures, AI notes, flashcards, and practice quiz
                </CardDescription>
              </div>
              <Badge variant="outline">{sessions.length} Scheduled Sessions</Badge>
            </CardHeader>

            <div className="space-y-2.5">
              {sessions.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">
                  No sessions have been scheduled yet for this plan.
                </p>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess._id}
                    className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary-400 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: sess.subjectColor || '#4f46e5' }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">
                            {sess.topicTitle || (sess as any).title || 'Study Session'}
                          </span>
                          <Badge size="sm">
                            {sess.subjectName || (sess as any).subject?.name || 'General'}
                          </Badge>
                          <Badge
                            size="sm"
                            variant={sess.sessionType === 'revision' ? 'warning' : 'outline'}
                          >
                            {sess.sessionType === 'revision' ? 'Revision' : 'Study'}
                          </Badge>
                          <Badge
                            size="sm"
                            variant={
                              sess.status === 'completed'
                                ? 'success'
                                : sess.status === 'missed'
                                ? 'danger'
                                : 'outline'
                            }
                          >
                            {sess.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(new Date(sess.scheduledStart), 'EEE, MMM d • h:mm a')} (
                          {sess.plannedMinutes} mins)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        size="sm"
                        onClick={() => setActiveLearningTopicId(sess.topicId)}
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                        className="font-semibold text-xs"
                      >
                        Start Learning
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. REVISION SCHEDULE SECTION                             */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Spaced Revision Schedule & Weak Concepts
            </h3>
          </div>
          <Badge size="sm" variant="outline">
            {learningProgress?.topicsRequiringRevisionCount || 0} Topics Due for Revision
          </Badge>
        </div>

        {(!learningProgress || learningProgress.topicsRequiringRevision.length === 0) ? (
          <div className="p-6 rounded-2xl border border-dashed border-border bg-muted/20 text-center space-y-2">
            <Award className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold text-foreground">
              All concepts are currently in good standing!
            </p>
            <p className="text-[11px] text-muted-foreground">
              Topics will appear here when you tag flashcards as "Need Revision" or score below 70%
              on practice quizzes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {learningProgress.topicsRequiringRevision.map((rev) => (
              <Card
                key={rev.id}
                className="p-4 border border-amber-200 dark:border-amber-900/40 bg-card hover:border-amber-400 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <Badge size="sm" variant="warning" className="mb-2">
                    Needs Active Recall
                  </Badge>
                  <h4 className="font-bold text-foreground text-xs">{rev.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {rev.subjectName || 'Subject Topic'}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveLearningTopicId(rev.id)}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                  className="w-full text-xs"
                >
                  Start Revision
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. LEARNING PROGRESS SECTION                             */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Student Learning Progress & Mastery
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Curriculum Completed
            </span>
            <span className="text-xl font-extrabold text-foreground mt-1 block">
              {learningProgress?.completedTopics || 0} / {topics.length}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              {topics.length > 0
                ? `${Math.round(((learningProgress?.completedTopics || 0) / topics.length) * 100)}% complete`
                : '0% complete'}
            </span>
          </Card>

          <Card className="p-4 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Videos Watched
            </span>
            <span className="text-xl font-extrabold text-foreground mt-1 block">
              {learningProgress?.videosWatchedCount || 0} Lectures
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">Verified YouTube</span>
          </Card>

          <Card className="p-4 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Flashcard Mastery
            </span>
            <span className="text-xl font-extrabold text-foreground mt-1 block">
              {learningProgress?.flashcardMasteryPercent || 0}%
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              {learningProgress?.flashcardsMastered || 0} cards retained
            </span>
          </Card>

          <Card className="p-4 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Total Learning Time
            </span>
            <span className="text-xl font-extrabold text-foreground mt-1 block">
              {learningProgress?.totalLearningHours || 0} hrs
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">Focus Time Logged</span>
          </Card>
        </div>

        {/* Weak Concepts Identified */}
        {learningProgress?.weakConcepts && learningProgress.weakConcepts.length > 0 && (
          <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-foreground">Identified Weak Concepts:</span>
            {learningProgress.weakConcepts.map((wc, idx) => (
              <Badge key={idx} variant="outline" size="sm" className="border-amber-300 text-amber-800 dark:text-amber-200">
                {wc}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* DEDICATED TOPIC LEARNING WORKSPACE MODAL                 */}
      {/* ======================================================== */}
      {activeLearningTopicId && (
        <TopicLearningWorkspace
          topicId={activeLearningTopicId}
          onClose={() => {
            setActiveLearningTopicId(null);
            fetchPlan();
          }}
          onTopicStatusChanged={() => fetchPlan()}
        />
      )}

      {/* ======================================================== */}
      {/* GENERATE STUDY PLAN WIZARD MODAL                         */}
      {/* ======================================================== */}
      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate AI Academic Study Plan"
        description="Analyzes syllabus topics, difficulty, understanding ratings, and availability"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {!previewData ? (
            <form onSubmit={handlePreviewPlan} className="space-y-4">
              {planError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{planError}</span>
                </div>
              )}

              {/* Engine Switcher */}
              <div className="p-3 rounded-xl bg-muted/60 border border-border flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground block">Planning Engine</span>
                  <span className="text-[11px] text-muted-foreground">
                    {useAIPlanner ? 'Gemini AI Intelligent Decomposer' : 'Deterministic Scheduling Engine'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setUseAIPlanner(true)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      useAIPlanner
                        ? 'bg-primary-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    AI Planner
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseAIPlanner(false)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      !useAIPlanner
                        ? 'bg-primary-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Deterministic
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planFormData.name}
                  onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={planFormData.startDate}
                    onChange={(e) => {
                      setPlanFormData({ ...planFormData, startDate: e.target.value });
                      setPlanError(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    End Date (Exam Horizon)
                  </label>
                  <input
                    type="date"
                    required
                    min={planFormData.startDate || todayStr}
                    value={planFormData.endDate}
                    onChange={(e) => {
                      setPlanFormData({ ...planFormData, endDate: e.target.value });
                      setPlanError(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Preferred Session Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={planFormData.preferredSessionMinutes}
                    onChange={(e) =>
                      setPlanFormData({
                        ...planFormData,
                        preferredSessionMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Break Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={planFormData.breakMinutes}
                    onChange={(e) =>
                      setPlanFormData({ ...planFormData, breakMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setGenerateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isGenerating}
                  disabled={userSubjectsCount === 0 || userTopicsCount === 0}
                >
                  Preview Proposed Schedule
                </Button>
              </div>
            </form>
          ) : (
            /* Preview Screen Before Confirmation */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground">Feasibility Analysis Result</span>
                  <Badge
                    variant={
                      previewData.feasibility?.status === 'feasible'
                        ? 'success'
                        : previewData.feasibility?.status === 'tight'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {previewData.feasibility?.status?.toUpperCase()} (Score:{' '}
                    {previewData.feasibility?.score}/100)
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-card border">
                    <p className="text-muted-foreground">Topics Scheduled</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {previewData.feasibility?.scheduledTopics} /{' '}
                      {previewData.feasibility?.totalTopics}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-card border">
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-bold text-foreground mt-0.5 capitalize">
                      {previewData.feasibility?.status}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-card border">
                    <p className="text-muted-foreground">Sessions</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {previewData.proposedSessions?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proposed Sessions Preview */}
              <div>
                <span className="font-semibold text-foreground block mb-2">
                  Proposed Sessions ({previewData.proposedSessions?.length} sessions)
                </span>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {previewData.proposedSessions?.slice(0, 8).map((sess: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-border bg-card flex justify-between items-center"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{sess.title}</span>
                        <span className="text-muted-foreground block text-[10px]">
                          {format(new Date(sess.scheduledStart), 'MMM d, h:mm a')} •{' '}
                          {sess.plannedMinutes} mins
                        </span>
                      </div>
                      <Badge size="sm">{sess.subjectName || 'Study'}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setPreviewData(null)}>
                  ← Adjust Parameters
                </Button>
                <Button size="sm" onClick={handleSavePlan} isLoading={isGenerating}>
                  Save & Activate This Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* AI Key Setup Modal */}
      <Modal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title="AI Assistant Setup"
        description="Enable Google Gemini or OpenAI Live Assistant"
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            StudyOS connects directly to Google Gemini through the backend server.
          </p>

          <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
            <span className="font-bold text-foreground block">Configuration Steps:</span>
            <ol className="list-decimal pl-5 space-y-1.5 text-muted-foreground">
              <li>
                Open <code className="text-primary-600 font-mono">server/.env</code> in your editor.
              </li>
              <li>
                Add your Gemini API key:
                <code className="text-primary-600 font-mono block mt-1 p-2 bg-muted rounded">
                  GEMINI_API_KEY=AIzaSy...
                </code>
              </li>
              <li>Restart the server. All AI notes, flashcards, quizzes, and chat tutor will activate!</li>
            </ol>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setSetupModalOpen(false)}>
              Got It
            </Button>
          </div>
        </div>
      </Modal>

      {/* Missed-Session Recovery Modal */}
      <Modal
        isOpen={recoveryModalOpen}
        onClose={() => setRecoveryModalOpen(false)}
        title="Recover Missed Study Sessions"
        description="Reallocate missed work into future available windows without double-booking"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">
              Select Missed Study Session
            </label>
            <select
              value={selectedMissedId}
              onChange={(e) => {
                setSelectedMissedId(e.target.value);
                setRecoveryProposal(null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
            >
              {missedSessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.topicTitle} ({s.subjectName}) • Planned {s.plannedMinutes}m
                </option>
              ))}
            </select>
          </div>

          {!recoveryProposal ? (
            <div className="pt-2">
              <Button
                size="sm"
                className="w-full"
                onClick={handlePreviewRecovery}
                isLoading={isRecovering}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Find Reallocation Slots
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div
                className={`p-3 rounded-xl border text-xs ${
                  recoveryProposal.feasible
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200'
                }`}
              >
                <p className="font-semibold">
                  {recoveryProposal.feasible ? 'Recovery Feasible!' : 'Capacity Shortfall'}
                </p>
                <p className="text-[11px] mt-0.5">{recoveryProposal.explanation}</p>
              </div>

              {recoveryProposal.rescheduledSessions?.length > 0 && (
                <div>
                  <span className="font-semibold text-foreground block mb-2">
                    Proposed Future Study Slot(s)
                  </span>
                  {recoveryProposal.rescheduledSessions.map((res: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-border bg-card mb-2">
                      <p className="font-semibold text-foreground">{res.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(res.scheduledStart), 'EEEE, MMM d, yyyy • h:mm a')} (
                        {res.plannedMinutes} mins)
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setRecoveryProposal(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyRecovery}
                  isLoading={isRecovering}
                  disabled={!recoveryProposal.feasible}
                >
                  Confirm & Reschedule Workload
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StudyPlanPage;
