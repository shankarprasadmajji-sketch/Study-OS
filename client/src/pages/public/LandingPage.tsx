import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Sparkles,
  BookOpen,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Timer,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  Layers,
  ChevronRight,
  Play,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { useAuth } from '../../context/AuthContext.js';
import { DatabaseBadge } from '../../components/layout/DatabaseBadge.js';

export const LandingPage: React.FC = () => {
  const { user, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoClick = async () => {
    setIsDemoLoading(true);
    try {
      await loginAsDemo();
      navigate('/app/dashboard');
    } catch (err) {
      console.error('Demo login failed:', err);
      navigate('/login');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const faqs = [
    {
      q: 'How is StudyOS different from a generic calendar or to-do list?',
      a: 'Unlike static to-do lists, StudyOS operates on your actual syllabus structure. It combines your real weekly available study slots, subject exam dates, estimated topic durations, and topic prerequisites to generate an executable daily study schedule. If you fall behind or miss a day, the Recovery Engine reallocates unfinished work into valid future windows without double-booking.',
    },
    {
      q: 'What scheduling algorithm does StudyOS use?',
      a: 'StudyOS uses a transparent, deterministic multi-factor priority algorithm: Priority = 0.40 × Urgency (days until exam) + 0.25 × Difficulty + 0.20 × Importance + 0.15 × Revision Need. It resolves topic dependencies chronologically and validates total workload against your available study hours.',
    },
    {
      q: 'What happens if I miss a scheduled study session?',
      a: 'Missing a study session is normal. In StudyOS, you simply mark the session as missed or click "Recover Missed Sessions". The engine recalculates your remaining workload, identifies open study windows before your exam, and presents a proposed reallocation for your confirmation.',
    },
    {
      q: 'Does StudyOS require MongoDB to run?',
      a: 'StudyOS has complete native MongoDB and Mongoose integration. For local testing and previews without a database URL, StudyOS runs smoothly in interactive Demo Mode. Once you add your MONGODB_URI to server/.env, all records persist directly into MongoDB.',
    },
    {
      q: 'Is StudyOS suitable for high school, college, and university courses?',
      a: 'Yes. Whether you are balancing multi-variable calculus, organic chemistry, or computer science courses, StudyOS adapts to your course syllabus, lecture modules, and exam deadlines.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary-500/20">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground block">
                StudyOS
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                Smart Academic OS
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#sample-schedule" className="hover:text-foreground transition-colors">
              Sample Schedule
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <DatabaseBadge />
            {user ? (
              <Link to="/app/dashboard">
                <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-block">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 text-xs font-semibold mb-6 border border-primary-200/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deterministic Academic Planning Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight max-w-4xl mx-auto leading-tight md:leading-[1.15]">
            Stop Planning to Study.{' '}
            <span className="text-primary-600 dark:text-primary-400">
              Start Making Progress.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Turn your syllabus, available time, and exam dates into a practical daily study plan
            with StudyOS. “Your syllabus. Your schedule. Your progress.”
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link to="/app/dashboard">
                <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Open My Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Build My Study Plan
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDemoClick}
                  isLoading={isDemoLoading}
                  leftIcon={<Play className="w-4 h-4 text-primary-500 fill-primary-500" />}
                >
                  Explore Live Demo
                </Button>
              </>
            )}
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            <span>Free for students • No credit card required • MongoDB backed</span>
          </div>

          {/* Real Interactive UI Component Preview */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-border bg-card shadow-elevated p-4 sm:p-6 text-left relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs font-medium text-muted-foreground ml-2">
                  Sample Dashboard Live Component Preview
                </span>
              </div>
              <Badge variant="info">Spring Semester Exam Horizon</Badge>
            </div>

            {/* Metric Preview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60">
                <p className="text-[11px] font-medium text-muted-foreground">Today's Planned</p>
                <p className="text-xl font-bold text-foreground mt-0.5">3.5 hrs</p>
                <span className="text-[10px] text-primary-600 font-medium">3 sessions scheduled</span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60">
                <p className="text-[11px] font-medium text-muted-foreground">Topics Completed</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">14 / 24</p>
                <span className="text-[10px] text-emerald-600 font-medium">58% syllabus finished</span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60">
                <p className="text-[11px] font-medium text-muted-foreground">Next Exam Date</p>
                <p className="text-xl font-bold text-foreground mt-0.5">12 Days</p>
                <span className="text-[10px] text-amber-600 font-medium">Algorithms (CS 301)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60">
                <p className="text-[11px] font-medium text-muted-foreground">Plan Feasibility</p>
                <p className="text-xl font-bold text-primary-600 mt-0.5">96 / 100</p>
                <span className="text-[10px] text-primary-600 font-medium">Feasible & Balanced</span>
              </div>
            </div>

            {/* Timetable Schedule Slice Preview */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Today's Scheduled Study Sessions
              </div>

              <div className="p-3 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary-300 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-12 rounded-full bg-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">
                        Dynamic Programming: 0/1 Knapsack & Memoization
                      </span>
                      <Badge variant="info" size="sm">CS 301</Badge>
                      <Badge variant="warning" size="sm">Hard</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Urgency Score: 92/100 • 60 mins • Prerequisite for Graph Flow
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    09:00 - 10:00 AM
                  </span>
                  <Badge variant="success" size="sm">Ready to Study</Badge>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary-300 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-12 rounded-full bg-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">
                        Raft Consensus Protocol & Leader Elections
                      </span>
                      <Badge variant="info" size="sm">CS 340</Badge>
                      <Badge variant="default" size="sm">Medium</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Urgency Score: 85/100 • 50 mins • Exam in 18 days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    03:00 - 03:50 PM
                  </span>
                  <Badge variant="default" size="sm">Scheduled</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Common Student Planning Problems */}
      <section className="py-16 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Why Traditional Study Planning Fails
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Most students don't struggle with motivation; they struggle with schedule fragility and syllabus ambiguity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground mb-1">
                Deciding What to Study Every Morning
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Decision fatigue wastes valuable mental energy before studying even begins. Students flip through textbooks trying to judge what is urgent.
              </p>
            </Card>

            <Card>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground mb-1">
                The “One Missed Day” Collapse
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Missing a single day causes rigid calendar schedules to collapse. Without automated recovery, backlogs compound into end-of-semester cramming.
              </p>
            </Card>

            <Card>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground mb-1">
                Unordered Topics & Prerequisite Traps
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tackling advanced concepts before mastering underlying foundations leads to frustration and slow progress. Topics must be sequenced properly.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 2: How StudyOS Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="info">Simple 3-Step Workflow</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-3">
              How StudyOS Builds Your Schedule
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A clear, practical bridge between your academic syllabus and your real calendar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-sm">
                1
              </div>
              <h3 className="font-semibold text-base text-foreground mb-2">Input Syllabus & Exam Dates</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Add your subjects, examination dates, and syllabus topics with estimated study durations, difficulty, and prerequisites.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-sm">
                2
              </div>
              <h3 className="font-semibold text-base text-foreground mb-2">Configure Weekly Study Windows</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Specify your real availability windows for each day of the week, preferred session durations, and break intervals.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-sm">
                3
              </div>
              <h3 className="font-semibold text-base text-foreground mb-2">Execute Daily Study Sheets</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Follow your structured daily study sheet. If an unexpected event happens, trigger one-click recovery to reallocate missed work smoothly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Main Features Grid */}
      <section id="features" className="py-20 bg-muted/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="info">Feature Matrix</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-3">
              Engineered for Real Academic Workloads
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every tool you need to organize your college semester in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card hover>
              <Sparkles className="w-6 h-6 text-primary-600 mb-3" />
              <h3 className="font-semibold text-sm text-foreground mb-1">Deterministic Scheduling Engine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Prioritizes topics based on upcoming exam dates, difficulty levels, and syllabus prerequisites without arbitrary randomness.
              </p>
            </Card>

            <Card hover>
              <RefreshCw className="w-6 h-6 text-emerald-600 mb-3" />
              <h3 className="font-semibold text-sm text-foreground mb-1">Missed-Session Recovery</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Missed a session? Don't panic. The engine detects uncompleted work and reallocates it into valid future availability windows.
              </p>
            </Card>

            <Card hover>
              <BookOpen className="w-6 h-6 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-sm text-foreground mb-1">Syllabus Breakdown & Hierarchy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Decompose hefty courses into manageable topics, tag difficulty, assign prerequisites, and monitor granular completion metrics.
              </p>
            </Card>

            <Card hover>
              <Calendar className="w-6 h-6 text-sky-600 mb-3" />
              <h3 className="font-semibold text-sm text-foreground mb-1">Daily & Weekly Timetable</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Interactive schedule with date navigation, jump-to-today, and one-click session completion tracking.
              </p>
            </Card>

            <Card hover>
              <Timer className="w-6 h-6 text-amber-600 mb-3" />
              <h3 className="font-semibold text-sm text-foreground mb-1">Distraction-Free Focus Mode</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dedicated study timer with Pomodoro and custom intervals tied directly to the topic you are working on.
              </p>
            </Card>

            <Card hover>
              <BarChart3 className="w-6 h-6 text-purple-600 mb-3" />
              <h3 className="font-semibold text-sm text-foreground mb-1">Progress Analytics & Countdowns</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visual completion percentages, planned vs. actual study hours, and exam countdowns across all registered subjects.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 8: FAQ Accordion */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Clear answers on how StudyOS helps you stay organized.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-card overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-primary-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/50 bg-muted/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9: Final Call to Action */}
      <section className="py-16 bg-primary-600 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Take Control of Your Semester Today
          </h2>
          <p className="mt-4 text-sm sm:text-base text-primary-100 max-w-xl mx-auto">
            Build your academic schedule based on your actual syllabus and realistic study hours.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup">
              <button className="px-6 py-2.5 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-primary-50 transition-colors shadow-lg active:scale-95">
                Build My Study Plan Now
              </button>
            </Link>
            <Button
              variant="outline"
              className="text-white border-white/40 hover:bg-white/10"
              onClick={handleDemoClick}
              isLoading={isDemoLoading}
            >
              Explore Demo Mode
            </Button>
          </div>
        </div>
      </section>

      {/* Section 10: Footer */}
      <footer className="bg-card border-t border-border py-12 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-semibold text-foreground text-sm">StudyOS</span>
            <span className="text-muted-foreground">— Your syllabus. Your schedule. Your progress.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-foreground">Log In</Link>
            <Link to="/signup" className="hover:text-foreground">Sign Up</Link>
            <span>MongoDB ODM Native</span>
            <span>© {new Date().getFullYear()} StudyOS. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
