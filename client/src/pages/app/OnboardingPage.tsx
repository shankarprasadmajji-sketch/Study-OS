import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  Code,
  Trophy,
  Compass,
  FileText,
  Upload,
  Brain,
  Video,
  Layers,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Check,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Network,
  Zap,
  Target,
  Flame,
  Bookmark,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

export type QuestionStep =
  | 'education' // Q1
  | 'goal' // Q2
  | 'syllabus' // Q3
  | 'knowledge' // Q4
  | 'time' // Q5
  | 'target' // Q6
  | 'depth' // Q7
  | 'preferences' // Q8
  | 'review'; // Review & Generate

const STORAGE_DRAFT_KEY = 'studyos_onboarding_draft';

export const OnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Current Step
  const [currentStep, setCurrentStep] = useState<QuestionStep>('education');
  const [draftRestored, setDraftRestored] = useState<boolean>(false);

  // Form State: Question 1 — Education Details
  const [educationLevel, setEducationLevel] = useState<string>(user?.educationLevel || 'Undergraduate');
  const [courseDegree, setCourseDegree] = useState<string>(user?.courseDegree || '');
  const [academicYear, setAcademicYear] = useState<string>(user?.academicYear || 'Year 2');

  // Form State: Question 2 — Learning Goals
  const [learningGoal, setLearningGoal] = useState<string>('Learn programming and technical skills');
  const [customGoal, setCustomGoal] = useState<string>('');

  // Form State: Question 3 — Subjects & Syllabus
  const [subjectNames, setSubjectNames] = useState<string>('');
  const [syllabusMode, setSyllabusMode] = useState<'ai_suggest' | 'paste_text' | 'upload_file' | 'manual'>('ai_suggest');
  const [syllabusText, setSyllabusText] = useState<string>('');
  const [manualTopics, setManualTopics] = useState<string>('');

  // Form State: Question 4 — Current Knowledge Level
  const [knowledgeLevel, setKnowledgeLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [knowledgeSummary, setKnowledgeSummary] = useState<string>('');

  // Form State: Question 5 — Available Time & Windows
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [preferredSessionMinutes, setPreferredSessionMinutes] = useState<number>(45);
  const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // Mon-Sat
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

  // Form State: Question 6 — Completion Target & Exam Date
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultTargetStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [timeframePreset, setTimeframePreset] = useState<string>('1_month');
  const [targetDate, setTargetDate] = useState<string>(defaultTargetStr);
  const [hasExamDate, setHasExamDate] = useState<boolean>(false);
  const [examDate, setExamDate] = useState<string>('');

  // Form State: Question 7 — Learning Depth
  const [learningDepth, setLearningDepth] = useState<'briefly' | 'moderately' | 'deeply'>('moderately');

  // Form State: Question 8 — Learning Style Preferences
  const [learningPreferences, setLearningPreferences] = useState<string[]>([
    'videos',
    'notes',
    'flashcards',
    'examples',
    'quizzes',
  ]);

  // AI Proposal & Generation States
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [proposal, setProposal] = useState<any | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [isGeneratingWorkspace, setIsGeneratingWorkspace] = useState(false);
  const [generationStepText, setGenerationStepText] = useState('Analyzing learning goal...');

  // 1. Draft Persistence: Restore on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.educationLevel) setEducationLevel(parsed.educationLevel);
        if (parsed.courseDegree) setCourseDegree(parsed.courseDegree);
        if (parsed.academicYear) setAcademicYear(parsed.academicYear);
        if (parsed.learningGoal) setLearningGoal(parsed.learningGoal);
        if (parsed.customGoal) setCustomGoal(parsed.customGoal);
        if (parsed.subjectNames) setSubjectNames(parsed.subjectNames);
        if (parsed.syllabusMode) setSyllabusMode(parsed.syllabusMode);
        if (parsed.syllabusText) setSyllabusText(parsed.syllabusText);
        if (parsed.manualTopics) setManualTopics(parsed.manualTopics);
        if (parsed.knowledgeLevel) setKnowledgeLevel(parsed.knowledgeLevel);
        if (parsed.knowledgeSummary) setKnowledgeSummary(parsed.knowledgeSummary);
        if (parsed.dailyHours) setDailyHours(parsed.dailyHours);
        if (parsed.preferredSessionMinutes) setPreferredSessionMinutes(parsed.preferredSessionMinutes);
        if (Array.isArray(parsed.availableDays)) setAvailableDays(parsed.availableDays);
        if (parsed.preferredTimeOfDay) setPreferredTimeOfDay(parsed.preferredTimeOfDay);
        if (parsed.timeframePreset) setTimeframePreset(parsed.timeframePreset);
        if (parsed.targetDate) setTargetDate(parsed.targetDate);
        if (typeof parsed.hasExamDate === 'boolean') setHasExamDate(parsed.hasExamDate);
        if (parsed.examDate) setExamDate(parsed.examDate);
        if (parsed.learningDepth) setLearningDepth(parsed.learningDepth);
        if (Array.isArray(parsed.learningPreferences)) setLearningPreferences(parsed.learningPreferences);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        setDraftRestored(true);
      }
    } catch (e) {
      console.warn('Failed to restore draft from localStorage:', e);
    }
  }, []);

  // 2. Draft Persistence: Save on updates
  useEffect(() => {
    const draft = {
      educationLevel,
      courseDegree,
      academicYear,
      learningGoal,
      customGoal,
      subjectNames,
      syllabusMode,
      syllabusText,
      manualTopics,
      knowledgeLevel,
      knowledgeSummary,
      dailyHours,
      preferredSessionMinutes,
      availableDays,
      preferredTimeOfDay,
      timeframePreset,
      targetDate,
      hasExamDate,
      examDate,
      learningDepth,
      learningPreferences,
      currentStep,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      // quota or private browsing safeguard
    }
  }, [
    educationLevel,
    courseDegree,
    academicYear,
    learningGoal,
    customGoal,
    subjectNames,
    syllabusMode,
    syllabusText,
    manualTopics,
    knowledgeLevel,
    knowledgeSummary,
    dailyHours,
    preferredSessionMinutes,
    availableDays,
    preferredTimeOfDay,
    timeframePreset,
    targetDate,
    hasExamDate,
    examDate,
    learningDepth,
    learningPreferences,
    currentStep,
  ]);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_DRAFT_KEY);
    setCurrentStep('education');
    setEducationLevel('Undergraduate');
    setCourseDegree('');
    setAcademicYear('Year 2');
    setLearningGoal('Learn programming and technical skills');
    setCustomGoal('');
    setSubjectNames('');
    setSyllabusMode('ai_suggest');
    setSyllabusText('');
    setManualTopics('');
    setKnowledgeLevel('beginner');
    setKnowledgeSummary('');
    setDailyHours(3);
    setPreferredSessionMinutes(45);
    setAvailableDays([1, 2, 3, 4, 5, 6]);
    setPreferredTimeOfDay('morning');
    setTimeframePreset('1_month');
    setTargetDate(defaultTargetStr);
    setHasExamDate(false);
    setExamDate('');
    setLearningDepth('moderately');
    setLearningPreferences(['videos', 'notes', 'flashcards', 'examples', 'quizzes']);
    setProposal(null);
    setDraftRestored(false);
  };

  // Option Lists
  const educationOptions = [
    { id: 'School student', title: 'School Student', desc: 'Middle School / High School' },
    { id: 'Undergraduate', title: 'Undergraduate', desc: 'B.Tech, B.S., B.A., B.Com, B.Sc' },
    { id: 'Postgraduate', title: 'Postgraduate', desc: 'M.Tech, M.S., M.A., MBA, PhD' },
    { id: 'Self-learning', title: 'Self-Learning', desc: 'Independent learner / Professional' },
    { id: 'Other', title: 'Other', desc: 'Bootcamp / Diploma / Certificate' },
  ];

  const goalOptions = [
    {
      id: 'Prepare for college examinations',
      title: 'Prepare for College Examinations',
      desc: 'Semester exams, midterms, lab practicals & viva revision',
      icon: GraduationCap,
      preset: 'Data Structures & Algorithms Semester Exam',
    },
    {
      id: 'Learn a subject from the beginning',
      title: 'Learn a Subject from Beginning',
      desc: 'Build conceptual clarity from fundamentals to mastery',
      icon: BookOpen,
      preset: 'Complete Foundations of Calculus & Linear Algebra',
    },
    {
      id: 'Complete my entire course or semester syllabus',
      title: 'Complete Course / Semester Syllabus',
      desc: 'Systematically finish every syllabus unit before deadlines',
      icon: Layers,
      preset: 'Semester 4 Computer Science Full Syllabus',
    },
    {
      id: 'Prepare for competitive exams (GATE, GRE, JEE, etc.)',
      title: 'Prepare for Competitive Exams',
      desc: 'High-yield problem solving, mock test pacing & active recall',
      icon: Trophy,
      preset: 'GATE Computer Science Core Subjects',
    },
    {
      id: 'Learn programming and technical skills',
      title: 'Learn Programming & Tech Skills',
      desc: 'Python, Web Development, Full-Stack, Machine Learning',
      icon: Code,
      preset: 'Master Python & Backend Engineering from Zero',
    },
    {
      id: 'Prepare for technical interviews or placement',
      title: 'Prepare for Technical Interviews',
      desc: 'Data structures, system design, algorithm interview problems',
      icon: Brain,
      preset: 'Software Engineering Coding Interview Preparation',
    },
    {
      id: 'Master a specific skill or topic',
      title: 'Master a Specific Skill or Topic',
      desc: 'Deep-dive into a focused domain or research topic',
      icon: Compass,
      preset: 'Deep Learning & Neural Network Architectures',
    },
    {
      id: 'Custom goal',
      title: 'Custom Learning Goal',
      desc: 'Describe your own customized academic journey or target',
      icon: Sparkles,
      preset: '',
    },
  ];

  const preferenceOptions = [
    { id: 'videos', title: 'Video Lessons', desc: 'Curated high-yield video lectures and walkthroughs', icon: Video },
    { id: 'notes', title: 'Simple Explanations and Notes', desc: 'Clear definitions, formulas, derivations and structured notes', icon: FileText },
    { id: 'examples', title: 'Practical Examples and Code', desc: 'Real-world intuition, code snippets and worked problems', icon: Lightbulb },
    { id: 'flashcards', title: 'Flashcards and Active Recall', desc: 'Spaced repetition flashcards with confidence tracking', icon: Layers },
    { id: 'quizzes', title: 'Quizzes and Practice Tests', desc: 'Concept check MCQs with instant scoring and explanations', icon: HelpCircle },
    { id: 'flowcharts', title: 'Flowcharts and Visual Diagrams', desc: 'Visual architecture diagrams and mental roadmaps', icon: Network },
  ];

  const togglePreference = (id: string) => {
    if (learningPreferences.includes(id)) {
      if (learningPreferences.length > 1) {
        setLearningPreferences(learningPreferences.filter((p) => p !== id));
      }
    } else {
      setLearningPreferences([...learningPreferences, id]);
    }
  };

  const selectAllPreferences = () => {
    setLearningPreferences(['videos', 'notes', 'examples', 'flashcards', 'quizzes', 'flowcharts']);
  };

  // Day toggle helper
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const toggleDay = (dayIdx: number) => {
    if (availableDays.includes(dayIdx)) {
      if (availableDays.length > 1) {
        setAvailableDays(availableDays.filter((d) => d !== dayIdx));
      }
    } else {
      setAvailableDays([...availableDays, dayIdx].sort());
    }
  };

  // Timeframe presets
  const handleTimeframePreset = (preset: string) => {
    setTimeframePreset(preset);
    const now = new Date();
    let days = 30;
    if (preset === '1_week') days = 7;
    else if (preset === '2_weeks') days = 14;
    else if (preset === '1_month') days = 30;
    else if (preset === '2_months') days = 60;
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    setTargetDate(future.toISOString().split('T')[0]);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setSyllabusText(text);
      }
    };
    reader.readAsText(file);
  };

  // Fetch AI Curriculum Proposal when moving to review step
  const fetchCurriculumProposal = async () => {
    setIsLoadingProposal(true);
    setProposalError(null);

    const subjs = subjectNames
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const finalSyllabusText =
      syllabusMode === 'manual'
        ? manualTopics
        : syllabusMode !== 'ai_suggest'
        ? syllabusText
        : undefined;

    try {
      const res = await apiRequest<{ success: boolean; proposal: any }>('/ai/suggest-syllabus', {
        method: 'POST',
        body: JSON.stringify({
          learningGoal: customGoal ? `${learningGoal}: ${customGoal}` : learningGoal,
          customGoal,
          educationLevel,
          academicYear: courseDegree ? `${courseDegree} (${academicYear})` : academicYear,
          subjectNames: subjs,
          syllabusText: finalSyllabusText,
          knowledgeLevel,
          knowledgeSummary,
          dailyHours,
          daysOrWeeks: timeframePreset === 'custom' ? targetDate : timeframePreset.replace('_', ' '),
          targetDate,
          examDate: hasExamDate && examDate ? examDate : undefined,
          learningPreferences,
        }),
      });

      if (res.proposal) {
        setProposal(res.proposal);
      }
    } catch (err: any) {
      console.warn('Failed to fetch AI proposal, using default layout:', err);
      setProposalError(err.message || 'Unable to fetch AI proposal.');
    } finally {
      setIsLoadingProposal(false);
    }
  };

  // Execute Complete Workspace Generation
  const handleGenerateWorkspace = async () => {
    if (!proposal || !proposal.subjects) return;

    setIsGeneratingWorkspace(true);
    const steps = [
      'Analyzing your academic profile and learning depth...',
      'Deconstructing subjects into units and bite-sized learning topics...',
      'Synthesizing starter study notes with key concepts & practical examples...',
      'Scheduling non-overlapping timetable sessions for your preferred study window...',
      'Setting up interactive topic workspaces with flashcards & quizzes...',
      'Finalizing your personalized StudyOS workspace...',
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setGenerationStepText(steps[stepIdx]);
    }, 900);

    try {
      const activeGoal = customGoal ? `${learningGoal}: ${customGoal}` : learningGoal;

      const res = await apiRequest<{ success: boolean; workspace: any }>('/ai/generate-workspace', {
        method: 'POST',
        body: JSON.stringify({
          learningGoal: activeGoal,
          educationLevel,
          courseDegree,
          academicYear,
          dailyHours,
          preferredSessionMinutes,
          preferredTimeOfDay,
          availableDays,
          learningDepth,
          targetDate,
          examDate: hasExamDate && examDate ? examDate : undefined,
          learningPreferences,
          subjects: proposal.subjects,
        }),
      });

      clearInterval(interval);
      localStorage.removeItem(STORAGE_DRAFT_KEY);

      updateUser({
        educationLevel,
        courseDegree,
        academicYear,
        learningGoal: activeGoal,
        onboardingCompleted: true,
      });

      navigate('/app/dashboard');
    } catch (err: any) {
      clearInterval(interval);
      console.error('Workspace generation error:', err);
      // Fallback: safeguard user so they are never locked out
      localStorage.removeItem(STORAGE_DRAFT_KEY);
      updateUser({ onboardingCompleted: true });
      navigate('/app/dashboard');
    } finally {
      setIsGeneratingWorkspace(false);
    }
  };

  // 8-Question Stepper Navigation
  const questionSequence: QuestionStep[] = [
    'education', // Q1
    'goal', // Q2
    'syllabus', // Q3
    'knowledge', // Q4
    'time', // Q5
    'target', // Q6
    'depth', // Q7
    'preferences', // Q8
    'review', // Step 9
  ];

  const currentStepIndex = questionSequence.indexOf(currentStep);

  const goToNextStep = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < questionSequence.length) {
      const nextStep = questionSequence[nextIdx];
      if (nextStep === 'review') {
        fetchCurriculumProposal();
      }
      setCurrentStep(nextStep);
    }
  };

  const goToPrevStep = () => {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx >= 0) {
      setCurrentStep(questionSequence[prevIdx]);
    }
  };

  // Calculate real-time feasibility for the review screen
  const calculateFeasibility = () => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffDays = Math.max(1, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const activeDaysPerWeek = availableDays.length || 6;
    const effectiveDays = Math.max(1, Math.round((diffDays * activeDaysPerWeek) / 7));
    const totalAvailableHours = effectiveDays * dailyHours;

    const estimatedHours = proposal?.estimatedTotalHours || 15;
    const ratio = totalAvailableHours / estimatedHours;

    let status: 'feasible' | 'tight' | 'unrealistic' = 'feasible';
    let explanation = '';
    let suggestion = '';

    if (ratio >= 1.25) {
      status = 'feasible';
      explanation = `Excellent! You have ~${totalAvailableHours} available study hours for ~${estimatedHours} estimated curriculum hours. Your plan has comfortable margin for practice.`;
    } else if (ratio >= 0.85) {
      status = 'tight';
      explanation = `Your schedule is tight: ~${totalAvailableHours} available hours vs ~${estimatedHours} estimated curriculum hours. Regular attendance is recommended.`;
      suggestion = `Consider increasing daily study by 30-45 minutes to build revision buffers.`;
    } else {
      status = 'unrealistic';
      const neededDaily = (estimatedHours / effectiveDays).toFixed(1);
      explanation = `Demanding timeframe: ~${estimatedHours} hours of curriculum planned over ${effectiveDays} study days with only ~${totalAvailableHours} hours scheduled.`;
      suggestion = `To cover all topics comfortably, adjust your daily study to ~${neededDaily} hours/day or extend your target deadline by 1-2 weeks.`;
    }

    return { status, totalAvailableHours, estimatedHours, effectiveDays, explanation, suggestion };
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Main Header with Exact Prompts */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800/50 mb-3 shadow-xs">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-xs font-semibold text-primary-900 dark:text-primary-300">
              StudyOS AI Learning Assistant
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Let's build your personalized learning space.
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Tell us what you want to learn. StudyOS will organize your subjects, timetable, study plan and notes for you.
          </p>

          {/* Draft indicator */}
          {draftRestored && currentStep !== 'review' && (
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Draft restored from your last visit</span>
              <button
                type="button"
                onClick={clearDraft}
                className="text-primary-600 hover:underline font-medium ml-1 cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}

          {/* Conversational Progress Stepper (8 Questions) */}
          {currentStep !== 'review' && (
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {questionSequence.slice(0, 8).map((stepKey, idx) => (
                <button
                  key={stepKey}
                  type="button"
                  onClick={() => setCurrentStep(stepKey)}
                  title={`Go to Question ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-10 bg-primary-600'
                      : idx < currentStepIndex
                      ? 'w-4 bg-emerald-500 hover:bg-emerald-600'
                      : 'w-4 bg-muted-foreground/20 hover:bg-muted-foreground/40'
                  }`}
                />
              ))}
              <span className="text-xs font-mono font-semibold text-muted-foreground ml-2">
                Question {currentStepIndex + 1} of 8
              </span>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* QUESTION 1 — EDUCATION DETAILS */}
        {/* ============================================================== */}
        {currentStep === 'education' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Question 1
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">Education Details</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tell us about your current academic standing so the AI tailors its pedagogical tone.
              </p>
            </div>

            {/* What are you currently studying? */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-foreground">
                What are you currently studying?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {educationOptions.map((opt) => {
                  const isSelected = educationLevel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEducationLevel(opt.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-1 ring-primary-500'
                          : 'border-border bg-card hover:bg-muted/60'
                      }`}
                    >
                      <GraduationCap
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          isSelected ? 'text-primary-600' : 'text-muted-foreground'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{opt.title}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary-600" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Course, Degree or Stream */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Course, degree or stream
                </label>
                <input
                  type="text"
                  value={courseDegree}
                  onChange={(e) => setCourseDegree(e.target.value)}
                  placeholder="e.g. Computer Science, Mechanical Engineering, Commerce, Pre-Med"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Current year, grade or semester
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="e.g. Year 2, Semester 4, 10th Grade"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={goToNextStep} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================== */}
        {/* QUESTION 2 — LEARNING GOALS */}
        {/* ============================================================== */}
        {currentStep === 'goal' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Question 2
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">What would you like to achieve?</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Select your primary learning objective or type a custom goal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goalOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = learningGoal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setLearningGoal(opt.id);
                      if (opt.preset && !customGoal) {
                        setCustomGoal(opt.preset);
                      }
                    }}
                    className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-1 ring-primary-500'
                        : 'border-border bg-card hover:bg-muted/60'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-primary-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{opt.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Learning Goal Input */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Describe your exact goal or target (Optional or Custom)
              </label>
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="e.g. Master Python from zero in 30 days, or Score 90%+ in Semester 4 OS & DBMS"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={goToPrevStep} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={goToNextStep} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================== */}
        {/* QUESTION 3 — SUBJECTS AND SYLLABUS */}
        {/* ============================================================== */}
        {currentStep === 'syllabus' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Question 3
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">Subjects & Syllabus Topics</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your subjects and tell us how you want to load your syllabus.
              </p>
            </div>

            {/* Subject names input */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Enter your subjects (comma-separated or list)
              </label>
              <input
                type="text"
                value={subjectNames}
                onChange={(e) => setSubjectNames(e.target.value)}
                placeholder="e.g. Python Programming, Operating Systems, Database Systems"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Leave empty to let StudyOS automatically propose subjects based on your learning goal.
              </p>
            </div>

            {/* Multiple convenient ways for syllabus */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-foreground">
                How would you like to provide your syllabus?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSyllabusMode('ai_suggest')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    syllabusMode === 'ai_suggest'
                      ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-1 ring-primary-500'
                      : 'border-border bg-card hover:bg-muted/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-primary-600 mb-1" />
                  <span className="block text-xs font-bold text-foreground">Ask AI to Suggest</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Standard academic curricula
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSyllabusMode('paste_text')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    syllabusMode === 'paste_text'
                      ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-1 ring-primary-500'
                      : 'border-border bg-card hover:bg-muted/60'
                  }`}
                >
                  <FileText className="w-4 h-4 text-sky-600 mb-1" />
                  <span className="block text-xs font-bold text-foreground">Paste Syllabus Text</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Copy units & chapters
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSyllabusMode('upload_file')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    syllabusMode === 'upload_file'
                      ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-1 ring-primary-500'
                      : 'border-border bg-card hover:bg-muted/60'
                  }`}
                >
                  <Upload className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="block text-xs font-bold text-foreground">Upload Document</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    .txt, .md, notes file
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSyllabusMode('manual')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    syllabusMode === 'manual'
                      ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-1 ring-primary-500'
                      : 'border-border bg-card hover:bg-muted/60'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-amber-600 mb-1" />
                  <span className="block text-xs font-bold text-foreground">Enter Manually</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Type topics list
                  </span>
                </button>
              </div>
            </div>

            {/* Paste Text Area */}
            {syllabusMode === 'paste_text' && (
              <div className="pt-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Paste Your Syllabus Text
                </label>
                <textarea
                  rows={4}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder="Paste units, chapters, or syllabus text here. AI will extract and structure them."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
                />
              </div>
            )}

            {/* File Upload Area */}
            {syllabusMode === 'upload_file' && (
              <div className="pt-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Upload Syllabus Document
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:bg-muted/30 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <input
                    type="file"
                    accept=".txt,.md,.json,.pdf,.docx"
                    onChange={handleFileUpload}
                    className="text-xs text-muted-foreground"
                  />
                  {syllabusText && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-2">
                      ✓ Document content loaded ({syllabusText.length} characters)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Manual Topics Entry */}
            {syllabusMode === 'manual' && (
              <div className="pt-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Enter Topics Manually (one per line)
                </label>
                <textarea
                  rows={4}
                  value={manualTopics}
                  onChange={(e) => setManualTopics(e.target.value)}
                  placeholder="e.g.&#10;Introduction to Programming&#10;Control Flow & Loops&#10;Functions & Modules&#10;Object-Oriented Programming"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
                />
              </div>
            )}

            {/* Clear Pedagogical Disclaimer Required by Part 2 Q3 */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="font-semibold block">Academic Disclaimer</strong>
                <p className="text-[11px] leading-relaxed">
                  AI-suggested syllabus topics are generated based on standard academic curricula. Please review and adjust to match your university's exact syllabus.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={goToPrevStep} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={goToNextStep} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================== */}
        {/* QUESTION 4 — CURRENT KNOWLEDGE LEVEL */}
        {/* ============================================================== */}
        {currentStep === 'knowledge' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Question 4
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">Current Knowledge Level</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Help us calibrate where to begin and how rapidly to advance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'beginner',
                  title: 'Beginner',
                  desc: 'I am starting from scratch. Need intuitive metaphors and step-by-step guidance.',
                  icon: Brain,
                },
                {
                  id: 'intermediate',
                  title: 'Intermediate',
                  desc: 'I know the basics, need practice and depth. Ready for real-world problems.',
                  icon: Layers,
                },
                {
                  id: 'advanced',
                  title: 'Advanced',
                  desc: 'I want revision, problem-solving and exam readiness. Focus on high-yield edge cases.',
                  icon: Trophy,
                },
              ].map((opt) => {
                const isSelected = knowledgeLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setKnowledgeLevel(opt.id as any)}
                    className={`flex flex-col p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-1 ring-primary-500'
                        : 'border-border bg-card hover:bg-muted/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-foreground">{opt.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Specific topics you already know or struggle with (Optional)
              </label>
              <textarea
                rows={2}
                value={knowledgeSummary}
                onChange={(e) => setKnowledgeSummary(e.target.value)}
                placeholder="e.g. I am confident in arrays and loops, but struggle with recursion and dynamic programming."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={goToPrevStep} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={goToNextStep} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================== */}
        {/* QUESTION 5 — AVAILABLE TIME & SCHEDULE */}
        {/* ============================================================== */}
        {currentStep === 'time' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Question 5
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">Available Study Time</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tell us your schedule so StudyOS builds a balanced, non-overlapping timetable.
              </p>
            </div>

            {/* Daily Hours */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                How many hours can you study per day?
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setDailyHours(hrs)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      dailyHours === hrs
                        ? 'border-primary-600 bg-primary-600 text-white shadow-xs'
                        : 'border-border bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    {hrs} {hrs === 1 ? 'Hour' : hrs >= 6 ? '6+ Hours' : 'Hours'} / day
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Study Session Duration */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Preferred study session duration
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { mins: 30, label: '30 Minutes', desc: 'Pomodoro-style sprints' },
                  { mins: 45, label: '45 Minutes', desc: 'Standard deep focus' },
                  { mins: 60, label: '60 Minutes', desc: 'Extended lecture session' },
                ].map((s) => (
                  <button
                    key={s.mins}
                    type="button"
                    onClick={() => setPreferredSessionMinutes(s.mins)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      preferredSessionMinutes === s.mins
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-200 ring-1 ring-primary-500'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="block text-xs font-bold text-foreground">{s.label}</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Available Days */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-foreground">Available study days</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAvailableDays([0, 1, 2, 3, 4, 5, 6])}
                    className="text-[11px] text-primary-600 hover:underline font-medium cursor-pointer"
                  >
                    All Days
                  </button>
                  <span className="text-muted-foreground text-[11px]">•</span>
                  <button
                    type="button"
                    onClick={() => setAvailableDays([1, 2, 3, 4, 5])}
                    className="text-[11px] text-primary-600 hover:underline font-medium cursor-pointer"
                  >
                    Weekdays
                  </button>
                  <span className="text-muted-foreground text-[11px]">•</span>
                  <button
                    type="button"
                    onClick={() => setAvailableDays([0, 6])}
                    className="text-[11px] text-primary-600 hover:underline font-medium cursor-pointer"
                  >
                    Weekends
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {dayNames.map((dayName, idx) => {
                  const isSelected = availableDays.includes(idx);
                  return (
                    <button
                      key={dayName}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary-600 bg-primary-600 text-white shadow-xs'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {dayName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Study Time */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Preferred study time of day
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'morning', label: 'Morning', time: '6 AM – 12 PM', icon: Sun },
                  { id: 'afternoon', label: 'Afternoon', time: '12 PM – 5 PM', icon: Coffee },
                  { id: 'evening', label: 'Evening', time: '5 PM – 9 PM', icon: Sunset },
                  { id: 'night', label: 'Night', time: '9 PM – 12 AM', icon: Moon },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = preferredTimeOfDay === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPreferredTimeOfDay(t.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-1 ring-primary-500'
                          : 'border-border bg-card hover:bg-muted/60'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mb-1.5 ${
                          isSelected ? 'text-primary-600' : 'text-muted-foreground'
                        }`}
                      />
                      <span className="block text-xs font-bold text-foreground">{t.label}</span>
                      <span className="block text-[10px] text-muted-foreground">{t.time}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={goToPrevStep} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={goToNextStep} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================== */}
        {/* QUESTION 6 — COMPLETION TARGET & EXAM DATE */}
        {/* ============================================================== */}
        {currentStep === 'target' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Question 6
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">Completion Target</h2>
              <p className="text-xs text-muted-foreground mt-1">
                When would you like to finish this learning milestone?
              </p>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: '1_week', label: '1 Week', desc: 'Intensive revision' },
                { id: '2_weeks', label: '2 Weeks', desc: 'Crash course' },
                { id: '1_month', label: '1 Month', desc: 'Standard pace' },
                { id: '2_months', label: '2 Months', desc: 'Comprehensive' },
              ].map((p) => {
                const isSelected = timeframePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleTimeframePreset(p.id)}
                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-950 text-primary-900 dark:text-primary-200 ring-1 ring-primary-500'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="block text-xs font-bold text-foreground">{p.label}</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">{p.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Target and Exam Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={targetDate}
                  onChange={(e) => {
                    setTargetDate(e.target.value);
                    setTimeframePreset('custom');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    Do you have a specific exam date?
                  </label>
                  <input
                    type="checkbox"
                    id="hasExamDate"
                    checked={hasExamDate}
                    onChange={(e) => setHasExamDate(e.target.checked)}
                    className="rounded border-border text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </div>
                {hasExamDate ? (
                  <input
                    type="date"
                    min={todayStr}
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
                  />
                ) : (
                  <p className="text-[11px] text-muted-foreground py-2 leading-relaxed">
                    Check if you have an upcoming semester or entrance exam. StudyOS prioritizes high-yield units beforehand.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={goToPrevStep} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={goToNextStep} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================== */}
        {/* QUESTION 7 — LEARNING DEPTH (3 ATTRACTIVE CARDS) */}
        {/* ============================================================== */}
        {currentStep === 'depth' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Question 7
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">Learning Depth</h2>
              <p className="text-xs text-muted-foreground mt-1">
                How thoroughly do you want StudyOS to prepare your notes, flashcards, and timetable?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: BRIEFLY */}
              <button
                type="button"
                onClick={() => setLearningDepth('briefly')}
                className={`flex flex-col justify-between p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  learningDepth === 'briefly'
                    ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-2 ring-primary-500 shadow-md'
                    : 'border-border bg-card hover:bg-muted/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      BRIEFLY
                    </span>
                    {learningDepth === 'briefly' && <Check className="w-5 h-5 text-primary-600" />}
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1.5">Quick Overview & Key Notes</h3>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary-600 font-bold">•</span>
                      <span>High-yield formulas and definitions</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary-600 font-bold">•</span>
                      <span>Concise summary notes</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary-600 font-bold">•</span>
                      <span>Rapid exam recall</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 text-[10px] font-semibold text-primary-600 dark:text-primary-400">
                  Best for: Fast revision & last-minute exam prep
                </div>
              </button>

              {/* Card 2: MODERATELY */}
              <button
                type="button"
                onClick={() => setLearningDepth('moderately')}
                className={`flex flex-col justify-between p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  learningDepth === 'moderately'
                    ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-2 ring-primary-500 shadow-md'
                    : 'border-border bg-card hover:bg-muted/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      MODERATELY
                    </span>
                    {learningDepth === 'moderately' && <Check className="w-5 h-5 text-primary-600" />}
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1.5">Balanced & Structured</h3>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary-600 font-bold">•</span>
                      <span>Balanced concept explanations</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary-600 font-bold">•</span>
                      <span>Core practice problems & examples</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary-600 font-bold">•</span>
                      <span>Standard comprehensive notes</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 text-[10px] font-semibold text-primary-600 dark:text-primary-400">
                  Best for: Semester study & solid understanding
                </div>
              </button>

              {/* Card 3: DEEPLY */}
              <button
                type="button"
                onClick={() => setLearningDepth('deeply')}
                className={`flex flex-col justify-between p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  learningDepth === 'deeply'
                    ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-2 ring-primary-500 shadow-md'
                    : 'border-border bg-card hover:bg-muted/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      DEEPLY
                    </span>
                    {learningDepth === 'deeply' && <Check className="w-5 h-5 text-primary-600" />}
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1.5">Exhaustive Mastery</h3>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary-600 font-bold">•</span>
                      <span>In-depth theoretical derivations</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary-600 font-bold">•</span>
                      <span>Edge cases & advanced exercises</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary-600 font-bold">•</span>
                      <span>Exhaustive notes with code examples</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 text-[10px] font-semibold text-primary-600 dark:text-primary-400">
                  Best for: Mastery, competitive exams & interviews
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={goToPrevStep} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={goToNextStep} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================== */}
        {/* QUESTION 8 — LEARNING STYLE PREFERENCES */}
        {/* ============================================================== */}
        {currentStep === 'preferences' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  Question 8
                </span>
                <h2 className="text-xl font-bold text-foreground mt-1">Learning Style Preferences</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  How do you learn best? Choose one, several, or all formats.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={selectAllPreferences} className="text-xs">
                Select All
              </Button>
            </div>

            <div className="space-y-2.5">
              {preferenceOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = learningPreferences.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => togglePreference(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 ring-1 ring-primary-500'
                        : 'border-border bg-card hover:bg-muted/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-primary-600 text-white' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground block">{opt.title}</span>
                        <span className="text-[11px] text-muted-foreground block">{opt.desc}</span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isSelected
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-border bg-background'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={goToPrevStep} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                onClick={goToNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-primary-600 text-white"
              >
                Review Learning Summary
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================== */}
        {/* STEP 9 — REVIEW AND GENERATE SCREEN */}
        {/* ============================================================== */}
        {currentStep === 'review' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Loading indicator if proposal is being calculated */}
            {isLoadingProposal && (
              <Card className="p-8 text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                <h3 className="text-base font-bold text-foreground">
                  Analyzing Your Goal & Crafting Curriculum...
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Deconstructing your goal into units, chapters, and bite-sized learning objectives.
                </p>
              </Card>
            )}

            {!isLoadingProposal && proposal && (
              <>
                {/* Summary Banner with all 8 items */}
                <Card className="p-6 border-primary-500/30 bg-gradient-to-r from-card to-primary-50/20 dark:to-primary-950/20">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default" className="text-[10px]">
                          {educationLevel}
                        </Badge>
                        {courseDegree && (
                          <Badge variant="outline" className="text-[10px]">
                            {courseDegree}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary-600">
                          {learningDepth} Depth
                        </Badge>
                      </div>

                      <h2 className="text-xl font-bold text-foreground">
                        {customGoal ? customGoal : learningGoal}
                      </h2>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 text-xs text-muted-foreground">
                        <div>
                          • Daily: <strong>{dailyHours} hrs/day</strong> ({preferredSessionMinutes}m sessions)
                        </div>
                        <div>
                          • Preferred: <strong className="capitalize">{preferredTimeOfDay}</strong>
                        </div>
                        <div>
                          • Target: <strong>{targetDate}</strong>
                        </div>
                        <div>
                          • Level: <strong className="capitalize">{knowledgeLevel}</strong>
                        </div>
                        <div>
                          • Days: <strong>{availableDays.length} days/week</strong>
                        </div>
                        {hasExamDate && examDate && (
                          <div className="text-amber-600 font-semibold">
                            • Exam: <strong>{examDate}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep('education')}
                        className="text-xs w-full sm:w-auto"
                      >
                        Edit Answers
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleGenerateWorkspace}
                        disabled={isGeneratingWorkspace}
                        leftIcon={<Sparkles className="w-4 h-4" />}
                        className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm w-full sm:w-auto font-bold"
                      >
                        Generate My Study Workspace
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Workload Feasibility Assessment Required by Part 3 */}
                {(() => {
                  const feasibility = calculateFeasibility();
                  return (
                    <div className="p-4 rounded-xl border border-border bg-card flex items-start gap-3 shadow-xs">
                      <CheckCircle2
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          feasibility.status === 'feasible'
                            ? 'text-emerald-500'
                            : feasibility.status === 'tight'
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        }`}
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            Workload Feasibility Assessment
                          </span>
                          <Badge
                            variant={
                              feasibility.status === 'feasible'
                                ? 'success'
                                : feasibility.status === 'tight'
                                ? 'warning'
                                : 'danger'
                            }
                            className="capitalize text-[10px]"
                          >
                            {feasibility.status}
                          </Badge>
                          <span className="text-[11px] font-mono text-muted-foreground ml-auto">
                            {feasibility.totalAvailableHours} hrs available vs {feasibility.estimatedHours} hrs needed
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {feasibility.explanation}
                        </p>
                        {feasibility.suggestion && (
                          <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                            💡 Recommendation: {feasibility.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Proposed Subjects & Syllabus Breakdown */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Proposed Subjects & Syllabus Breakdown ({proposal.subjects?.length || 0})
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ~{proposal.estimatedTotalTopics} topics • {proposal.estimatedTotalHours} estimated hours
                    </span>
                  </div>

                  {proposal.subjects?.map((subj: any, sIdx: number) => (
                    <Card key={sIdx} className="p-5 border-border">
                      <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: subj.color || '#4f46e5' }}
                          />
                          <h4 className="text-sm font-bold text-foreground">{subj.name}</h4>
                          {subj.code && (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {subj.code}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {subj.units?.reduce((acc: number, u: any) => acc + (u.topics?.length || 0), 0)} topics
                        </span>
                      </div>

                      {/* Units */}
                      <div className="space-y-3">
                        {subj.units?.map((unit: any, uIdx: number) => (
                          <div key={uIdx} className="bg-muted/40 rounded-xl p-3 border border-border/50">
                            <span className="text-xs font-semibold text-foreground block mb-2">
                              {unit.unitTitle}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {unit.topics?.map((topic: any, tIdx: number) => (
                                <div
                                  key={tIdx}
                                  className="p-2 rounded-lg bg-card border border-border/60 flex items-center justify-between text-xs"
                                >
                                  <div className="min-w-0 pr-2">
                                    <span className="font-medium text-foreground block truncate">
                                      {topic.title}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block truncate">
                                      {topic.description}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      {topic.estimatedMinutes}m
                                    </span>
                                    <Badge
                                      variant={
                                        topic.difficulty === 'easy'
                                          ? 'success'
                                          : topic.difficulty === 'hard'
                                          ? 'danger'
                                          : 'warning'
                                      }
                                      className="text-[9px] uppercase px-1 py-0"
                                    >
                                      {topic.difficulty}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pedagogical Disclaimer */}
                <p className="text-[11px] text-muted-foreground italic text-center">
                  {proposal.disclaimer ||
                    'AI-suggested syllabus topics are generated based on standard academic curricula. Please review and adjust to match your university\'s exact syllabus.'}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('education')}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    Edit Answers
                  </Button>

                  <Button
                    size="lg"
                    onClick={handleGenerateWorkspace}
                    disabled={isGeneratingWorkspace}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md"
                  >
                    Generate My Study Workspace
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Full Screen AI Generation Modal Animation */}
      {isGeneratingWorkspace && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-primary-500/40">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 animate-spin" />
              <Sparkles className="w-8 h-8 text-primary-600 animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground">
                Building Your Academic Workspace
              </h3>
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-2 animate-pulse">
                {generationStepText}
              </p>
            </div>

            <div className="space-y-2 text-left bg-muted/50 p-3.5 rounded-xl border border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Enrolling subjects & syllabus topics</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Synthesizing starter study notes matching your learning depth</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Scheduling non-overlapping timetable sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Configuring dedicated topic learning workspaces</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
