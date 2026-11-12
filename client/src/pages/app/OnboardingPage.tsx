import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

type QuestionStep =
  | 'goal'
  | 'education'
  | 'syllabus'
  | 'knowledge'
  | 'time'
  | 'preferences'
  | 'review';

export const OnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Current Question Step
  const [currentStep, setCurrentStep] = useState<QuestionStep>('goal');

  // Form State
  const [learningGoal, setLearningGoal] = useState<string>('Programming and technical skills');
  const [customGoal, setCustomGoal] = useState<string>('');
  const [educationLevel, setEducationLevel] = useState<string>(user?.educationLevel || 'Undergraduate');
  const [academicYear, setAcademicYear] = useState<string>(user?.academicYear || 'Year 2');
  const [subjectNames, setSubjectNames] = useState<string>('');
  const [syllabusMode, setSyllabusMode] = useState<'ai_suggest' | 'paste_text' | 'upload_file'>('ai_suggest');
  const [syllabusText, setSyllabusText] = useState<string>('');
  const [knowledgeLevel, setKnowledgeLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [knowledgeSummary, setKnowledgeSummary] = useState<string>('');
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [timeframePreset, setTimeframePreset] = useState<string>('30_days');

  // Minimum date for target completion and exam date (today or future)
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultTargetStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [targetDate, setTargetDate] = useState<string>(defaultTargetStr);
  const [hasExamDate, setHasExamDate] = useState<boolean>(false);
  const [examDate, setExamDate] = useState<string>('');

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

  // Preset options
  const goalOptions = [
    {
      id: 'Programming and technical skills',
      title: 'Programming & Technical Skills',
      desc: 'Python, Web Development, Data Science, Algorithms',
      icon: Code,
      preset: 'Learn Python from zero in 30 days',
    },
    {
      id: 'College subjects',
      title: 'College Subjects',
      desc: 'Computer Architecture, DBMS, Calculus, Discrete Math',
      icon: GraduationCap,
      preset: 'Operating Systems & Data Structures',
    },
    {
      id: 'School subjects',
      title: 'School Subjects',
      desc: 'Physics, Chemistry, Mathematics, Biology',
      icon: BookOpen,
      preset: '10th / 12th Grade Science & Mathematics',
    },
    {
      id: 'Competitive exam preparation',
      title: 'Competitive Exam Preparation',
      desc: 'JEE, GATE, GRE, SAT, Quantitative & Reasoning',
      icon: Trophy,
      preset: 'Aptitude & Logical Reasoning Masterclass',
    },
    {
      id: 'General skills',
      title: 'General Skills & Productivity',
      desc: 'Problem Solving, Financial Literacy, AI Engineering',
      icon: Compass,
      preset: 'Practical Problem Solving & Applied AI',
    },
    {
      id: 'Custom learning goal',
      title: 'Custom Learning Goal',
      desc: 'Describe any specific topic or deadline you want to conquer',
      icon: Sparkles,
      preset: '',
    },
  ];

  const educationOptions = [
    { id: 'School', title: 'School', desc: 'Middle / High School', sublabel: 'Grade' },
    { id: 'Undergraduate', title: 'Undergraduate', desc: 'Bachelor Degree', sublabel: 'Year / Semester' },
    { id: 'Postgraduate', title: 'Postgraduate', desc: 'Master / PhD Degree', sublabel: 'Year' },
    { id: 'Self-learning', title: 'Self-Learning', desc: 'Independent learner / Professional', sublabel: '' },
    { id: 'Other', title: 'Other', desc: 'Certificate / Bootcamp', sublabel: '' },
  ];

  const preferenceOptions = [
    { id: 'videos', title: 'Video Lessons', desc: 'Curated educational video lectures & walkthroughs', icon: Video },
    { id: 'notes', title: 'Simple Explanations & Notes', desc: 'Key points, definitions, formulas & summaries', icon: FileText },
    { id: 'flashcards', title: 'Flashcards', desc: 'Active recall Q&A flip cards with confidence ratings', icon: Layers },
    { id: 'examples', title: 'Practical Examples', desc: 'Real-world intuition, code & step-by-step solutions', icon: Lightbulb },
    { id: 'quizzes', title: 'Quizzes & Tests', desc: 'Conceptual MCQs with instant scoring & explanations', icon: HelpCircle },
  ];

  // Helper to toggle multi-select preferences
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
    setLearningPreferences(['videos', 'notes', 'flashcards', 'examples', 'quizzes']);
  };

  // Preset timeframes
  const handleTimeframePreset = (preset: string) => {
    setTimeframePreset(preset);
    const now = new Date();
    let days = 30;
    if (preset === '14_days') days = 14;
    if (preset === '30_days') days = 30;
    if (preset === '60_days') days = 60;
    if (preset === '90_days') days = 90;
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    setTargetDate(future.toISOString().split('T')[0]);
  };

  // Handle file upload for syllabus
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

    try {
      const res = await apiRequest<{ success: boolean; proposal: any }>('/ai/suggest-syllabus', {
        method: 'POST',
        body: JSON.stringify({
          learningGoal,
          customGoal,
          educationLevel,
          academicYear,
          subjectNames: subjs,
          syllabusText: syllabusMode !== 'ai_suggest' ? syllabusText : undefined,
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
      'Analyzing learning goal & pedagogical structure...',
      'Deconstructing subjects into units & bite-sized learning topics...',
      'Calculating priorities, difficulty ratings, and exam urgency...',
      'Scheduling non-overlapping timetable and daily study sessions...',
      'Creating dedicated student notes, flashcards, and quizzes...',
      'Finalizing your personalized StudyOS workspace...',
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setGenerationStepText(steps[stepIdx]);
    }, 900);

    try {
      const res = await apiRequest<{ success: boolean; workspace: any }>('/ai/generate-workspace', {
        method: 'POST',
        body: JSON.stringify({
          learningGoal: customGoal ? `${learningGoal}: ${customGoal}` : learningGoal,
          educationLevel,
          academicYear,
          dailyHours,
          targetDate,
          examDate: hasExamDate && examDate ? examDate : undefined,
          learningPreferences,
          subjects: proposal.subjects,
        }),
      });

      clearInterval(interval);
      updateUser({
        educationLevel,
        academicYear,
        onboardingCompleted: true,
      });

      navigate('/app/dashboard');
    } catch (err: any) {
      clearInterval(interval);
      console.error('Workspace generation error:', err);
      // Fallback: mark onboarding completed and navigate so user is never locked out
      updateUser({ onboardingCompleted: true });
      navigate('/app/dashboard');
    } finally {
      setIsGeneratingWorkspace(false);
    }
  };

  // Stepper helper
  const questionSequence: QuestionStep[] = [
    'goal',
    'education',
    'syllabus',
    'knowledge',
    'time',
    'preferences',
    'review',
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

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Main Header with Required Prompts */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800/50 mb-3 shadow-xs">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-xs font-semibold text-primary-900 dark:text-primary-300">
              StudyOS AI Learning Assistant
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            What would you like to learn today?
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Tell us your learning goal. StudyOS will build a personalized learning experience for you.
          </p>

          {/* Conversational Progress Stepper */}
          {currentStep !== 'review' && (
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {questionSequence.slice(0, 6).map((stepKey, idx) => (
                <div
                  key={stepKey}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? 'w-10 bg-primary-600'
                      : idx < currentStepIndex
                      ? 'w-4 bg-emerald-500'
                      : 'w-4 bg-muted-foreground/20'
                  }`}
                />
              ))}
              <span className="text-[11px] font-mono text-muted-foreground ml-2">
                Question {currentStepIndex + 1} of 6
              </span>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* QUESTION 1 — LEARNING GOAL */}
        {/* ============================================================== */}
        {currentStep === 'goal' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Question 1
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">What do you want to learn?</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Select your focus area, or type your exact topic below.
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
                Describe your exact goal (or customize below)
              </label>
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="e.g. Learn Python from zero in 30 days, or Class 12 Board Exam Physics"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                You can specify any custom topic, skill, exam, or timeframe.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={goToNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================== */}
        {/* QUESTION 2 — EDUCATION LEVEL */}
        {/* ============================================================== */}
        {currentStep === 'education' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Question 2
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">What is your current education level?</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Helps the AI match the depth and pedagogical tone to your academic background.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {educationOptions.map((opt) => {
                const isSelected = educationLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEducationLevel(opt.id)}
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
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{opt.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Academic Year/Grade when relevant */}
            {['School', 'Undergraduate', 'Postgraduate'].includes(educationLevel) && (
              <div className="pt-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Current Grade, Year or Semester
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="e.g. Year 2, Semester 4, or 10th Grade"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
                />
              </div>
            )}

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
              <h2 className="text-xl font-bold text-foreground mt-1">Subjects & Syllabus Details</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tell us which subjects you want to cover, or let StudyOS design the complete syllabus.
              </p>
            </div>

            {/* Subject names input */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Which subjects do you want to study? (Optional, comma-separated)
              </label>
              <input
                type="text"
                value={subjectNames}
                onChange={(e) => setSubjectNames(e.target.value)}
                placeholder="e.g. Python Programming, Data Structures, Algorithms"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Leave empty to let AI automatically suggest subjects based on your learning goal.
              </p>
            </div>

            {/* Syllabus Source Options */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-foreground">
                Do you have a syllabus document?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                  <span className="block text-xs font-bold text-foreground">Let AI Create Syllabus</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Recommended for self-learning
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
                    Copy units and chapters
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
                    .txt, .md, or notes file
                  </span>
                </button>
              </div>
            </div>

            {/* Paste Text Area */}
            {syllabusMode === 'paste_text' && (
              <div className="pt-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Paste Your Syllabus Content
                </label>
                <textarea
                  rows={4}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder="Paste units, chapters, or topic lists here. AI will extract and structure them."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all shadow-xs"
                />
              </div>
            )}

            {/* File Upload Area */}
            {syllabusMode === 'upload_file' && (
              <div className="pt-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Upload Syllabus File
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:bg-muted/30 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <input
                    type="file"
                    accept=".txt,.md,.json"
                    onChange={handleFileUpload}
                    className="text-xs text-muted-foreground"
                  />
                  {syllabusText && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-2">
                      ✓ File content loaded ({syllabusText.length} characters)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pedagogical disclaimer alert */}
            <div className="p-3 rounded-xl bg-muted/60 border border-border/80 flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                StudyOS constructs custom learning pathways based on pedagogical principles. It never invents an official university syllabus and represents it as authentic.
              </span>
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
        {/* QUESTION 4 — CURRENT KNOWLEDGE */}
        {/* ============================================================== */}
        {currentStep === 'knowledge' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Question 4
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">What is your current knowledge level?</h2>
              <p className="text-xs text-muted-foreground mt-1">
                We pace earlier sessions based on your starting confidence.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'beginner',
                  title: 'Beginner',
                  desc: 'Starting from scratch. Need clear foundations & intuitive metaphors.',
                  icon: Brain,
                },
                {
                  id: 'intermediate',
                  title: 'Intermediate',
                  desc: 'Know the basics. Ready for deeper problem solving & real applications.',
                  icon: Layers,
                },
                {
                  id: 'advanced',
                  title: 'Advanced',
                  desc: 'Strong background. Focus on high-yield revision & exam questions.',
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
                Explain what you already know (Optional)
              </label>
              <textarea
                rows={2}
                value={knowledgeSummary}
                onChange={(e) => setKnowledgeSummary(e.target.value)}
                placeholder="e.g. I know basic programming in C++, or I have completed calculus differential equations."
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
        {/* QUESTION 5 — TIME AVAILABILITY */}
        {/* ============================================================== */}
        {currentStep === 'time' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Question 5
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">Time Availability & Deadlines</h2>
              <p className="text-xs text-muted-foreground mt-1">
                We schedule sessions realistically without burning you out.
              </p>
            </div>

            {/* Daily Hours */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                How many hours can you study daily?
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
                    {hrs} {hrs === 1 ? 'Hour' : 'Hours'} / day
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe Presets */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-foreground mb-2">
                How many days or weeks do you have?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: '14_days', label: '14 Days (Sprint)' },
                  { id: '30_days', label: '30 Days (1 Month)' },
                  { id: '60_days', label: '60 Days (2 Months)' },
                  { id: '90_days', label: '90 Days (Semester)' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleTimeframePreset(preset.id)}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      timeframePreset === preset.id
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-950 text-primary-900 dark:text-primary-200 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Completion Date */}
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
                    Do you have an exam date?
                  </label>
                  <input
                    type="checkbox"
                    id="hasExam"
                    checked={hasExamDate}
                    onChange={(e) => setHasExamDate(e.target.checked)}
                    className="rounded border-border text-primary-600 focus:ring-primary-500"
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
                  <p className="text-[11px] text-muted-foreground py-2">
                    Check if you have an upcoming test or semester exam to prioritize high-yield topics.
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
        {/* QUESTION 6 — LEARNING PREFERENCE */}
        {/* ============================================================== */}
        {currentStep === 'preferences' && (
          <Card className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  Question 6
                </span>
                <h2 className="text-xl font-bold text-foreground mt-1">How do you prefer learning?</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Select your favorite study formats (select all that apply).
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
        {/* SUMMARY & WORKSPACE CONFIRMATION */}
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
                {/* Summary Banner */}
                <Card className="p-6 border-primary-500/30 bg-gradient-to-r from-card to-primary-50/20 dark:to-primary-950/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default" className="text-[10px]">
                          {educationLevel}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          • {dailyHours} hrs/day • Target: {targetDate}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-foreground">
                        {customGoal ? customGoal : learningGoal}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Starting level: <strong className="capitalize">{knowledgeLevel}</strong> • Formats: {learningPreferences.join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep('goal')}
                        className="text-xs"
                      >
                        Edit My Answers
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleGenerateWorkspace}
                        disabled={isGeneratingWorkspace}
                        leftIcon={<Sparkles className="w-4 h-4" />}
                        className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                      >
                        Generate My Study Plan
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Feasibility Alert */}
                {proposal.feasibilityAssessment && (
                  <div className="p-4 rounded-xl border border-border bg-card flex items-start gap-3 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">Workload Feasibility</span>
                        <Badge
                          variant={
                            proposal.feasibilityAssessment.status === 'feasible'
                              ? 'success'
                              : proposal.feasibilityAssessment.status === 'tight'
                              ? 'warning'
                              : 'danger'
                          }
                          className="capitalize text-[10px]"
                        >
                          {proposal.feasibilityAssessment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {proposal.feasibilityAssessment.explanation}
                      </p>
                    </div>
                  </div>
                )}

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

                {/* Disclaimer */}
                <p className="text-[11px] text-muted-foreground italic text-center">
                  {proposal.disclaimer}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('goal')}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    Edit My Answers
                  </Button>

                  <Button
                    size="lg"
                    onClick={handleGenerateWorkspace}
                    disabled={isGeneratingWorkspace}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md"
                  >
                    Generate My Study Plan
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
