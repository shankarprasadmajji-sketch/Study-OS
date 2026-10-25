import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { apiRequest } from '../../api/client.js';
import { StudyPlan, StudySession } from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const StudyPlanPage: React.FC = () => {
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate Plan Modal State
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    name: 'Spring Semester Exam Prep Plan',
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
      const res = await apiRequest<{ plan: StudyPlan | null; sessions?: StudySession[] }>('/study-plans');
      setActivePlan(res.plan);
      setSessions(res.sessions || []);

      // Also fetch all sessions to detect any missed ones
      const allSess = await apiRequest<{ sessions: StudySession[] }>('/study-sessions');
      const missed = (allSess.sessions || []).filter((s) => s.status === 'missed');
      setMissedSessions(missed);
      if (missed.length > 0 && !selectedMissedId) {
        setSelectedMissedId(missed[0]._id);
      }
    } catch (err) {
      console.error('Failed to load study plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  // Run preview before saving
  const handlePreviewPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await apiRequest('/study-plans/generate', {
        method: 'POST',
        body: JSON.stringify({
          ...planFormData,
          savePlan: false,
        }),
      });
      setPreviewData(res);
    } catch (err: any) {
      alert(err.message || 'Plan generation preview failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Confirm and persist generated plan
  const handleSavePlan = async () => {
    setIsGenerating(true);
    try {
      await apiRequest('/study-plans/generate', {
        method: 'POST',
        body: JSON.stringify({
          ...planFormData,
          savePlan: true,
        }),
      });
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Study Plan Engine</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deterministic scheduling algorithm, workload feasibility scoring, and missed-session recovery
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Generate New Plan
          </Button>
        </div>
      </div>

      {/* Active Plan Overview */}
      {loading ? (
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      ) : !activePlan ? (
        <EmptyState
          icon={<Sparkles className="w-7 h-7" />}
          title="No Active Study Plan Found"
          description="Click below to let the scheduling engine analyze your syllabus topics, available hours, and exam dates to produce an optimal study plan."
          actionLabel="Generate Practical Study Plan"
          onAction={() => {
            setPreviewData(null);
            setGenerateModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Main Plan Card */}
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
                    Algorithm v{activePlan.algorithmVersion || '1.0.0'}
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
                      : 'Tight schedule capacity'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                  {activePlan.feasibility?.score || 95}
                </div>
              </div>
            </div>

            {/* Explanations & Warnings */}
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              {activePlan.feasibility?.warnings && activePlan.feasibility.warnings.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    {activePlan.feasibility.warnings.map((w, idx) => (
                      <p key={idx}>{w}</p>
                    ))}
                  </div>
                </div>
              )}

              {activePlan.feasibility?.explanations && (
                <div className="p-3.5 rounded-xl bg-card border border-border text-xs text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <Info className="w-4 h-4 text-primary-600" />
                    Algorithm Execution Summary
                  </div>
                  {activePlan.feasibility.explanations.map((exp, idx) => (
                    <p key={idx}>• {exp}</p>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Scheduled Sessions List for this Plan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Generated Sessions Schedule</CardTitle>
                <CardDescription>
                  {sessions.length} study session(s) allocated for this plan
                </CardDescription>
              </div>
              <Badge variant="outline">{sessions.length} Sessions Total</Badge>
            </CardHeader>

            <div className="space-y-2">
              {sessions.slice(0, 15).map((sess) => (
                <div
                  key={sess._id}
                  className="p-3 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: sess.subjectColor || '#4f46e5' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {sess.topicTitle}
                        </span>
                        <Badge size="sm">{sess.subjectName}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(sess.scheduledStart), 'EEE, MMM d, yyyy • h:mm a')} (
                        {sess.plannedMinutes} mins)
                      </p>
                    </div>
                  </div>

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
              ))}

              {sessions.length > 15 && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  Showing first 15 of {sessions.length} sessions. View full breakdown in Timetable.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Generate Study Plan Wizard Modal */}
      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Deterministic Study Plan Generator"
        description="Configure planning horizon and inspect proposed allocations before committing"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {!previewData ? (
            <form onSubmit={handlePreviewPlan} className="space-y-4">
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
                    value={planFormData.startDate}
                    onChange={(e) => setPlanFormData({ ...planFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">End Date (Exam Horizon)</label>
                  <input
                    type="date"
                    required
                    value={planFormData.endDate}
                    onChange={(e) => setPlanFormData({ ...planFormData, endDate: e.target.value })}
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
                  <label className="block font-semibold text-foreground mb-1">Break Duration (mins)</label>
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

              <div className="p-3 rounded-xl bg-muted/60 border border-border text-[11px] text-muted-foreground leading-relaxed">
                The scheduling algorithm will prioritize your syllabus using:
                <br />
                <code className="text-primary-600 font-mono font-medium">
                  Priority = 0.40 × Urgency + 0.25 × Difficulty + 0.20 × Importance + 0.15 × Revision
                </code>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setGenerateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isGenerating}>
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
                    {previewData.feasibility?.status?.toUpperCase()} (Score: {previewData.feasibility?.score}/100)
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-card border">
                    <p className="text-muted-foreground">Topics Scheduled</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {previewData.feasibility?.scheduledTopics} / {previewData.feasibility?.totalTopics}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-card border">
                    <p className="text-muted-foreground">Study Hours</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {(previewData.metrics?.scheduledMinutes / 60).toFixed(1)} hrs
                    </p>
                  </div>
                  <div className="p-2 rounded bg-card border">
                    <p className="text-muted-foreground">Capacity Used</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {previewData.metrics?.utilizationPercent}%
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
                    <div key={i} className="p-2 rounded-lg border border-border bg-card flex justify-between">
                      <div>
                        <span className="font-semibold text-foreground">{sess.title}</span>
                        <span className="text-muted-foreground block text-[10px]">
                          {format(new Date(sess.scheduledStart), 'MMM d, h:mm a')} • {sess.plannedMinutes} mins
                        </span>
                      </div>
                      <Badge size="sm">{sess.subjectName}</Badge>
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
