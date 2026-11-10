import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';

export const OnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2: Profile state (silently auto-detects browser timezone)
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Student',
    educationLevel: user?.educationLevel || 'Undergraduate',
    academicYear: user?.academicYear || 'Year 1',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    preferredSessionMinutes: user?.preferences?.preferredSessionMinutes || 50,
    breakMinutes: user?.preferences?.breakMinutes || 10,
    dailyTargetHours: user?.preferences?.dailyTargetHours || 4,
  });

  // Step 3: Availability state
  const [availability, setAvailability] = useState([
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', enabled: true },
    { dayOfWeek: 2, startTime: '09:00', endTime: '12:00', enabled: true },
    { dayOfWeek: 3, startTime: '09:00', endTime: '12:00', enabled: true },
    { dayOfWeek: 4, startTime: '14:00', endTime: '17:00', enabled: true },
    { dayOfWeek: 5, startTime: '09:00', endTime: '12:00', enabled: true },
    { dayOfWeek: 6, startTime: '10:00', endTime: '13:00', enabled: true },
    { dayOfWeek: 0, startTime: '14:00', endTime: '17:00', enabled: false },
  ]);

  const daysLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    const trimmedName = profileData.name.trim();
    try {
      // 1. Update academic profile (with auto-detected browser timezone)
      await apiRequest('/profile/onboarding', {
        method: 'PATCH',
        body: JSON.stringify({
          name: trimmedName,
          educationLevel: profileData.educationLevel,
          academicYear: profileData.academicYear,
          timezone: profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          preferences: {
            preferredSessionMinutes: profileData.preferredSessionMinutes,
            breakMinutes: profileData.breakMinutes,
            dailyTargetHours: profileData.dailyTargetHours,
            reminderNotifications: true,
          },
        }),
      });

      // 2. Save Availability
      await apiRequest('/availability', {
        method: 'PUT',
        body: JSON.stringify({ slots: availability }),
      });

      updateUser({
        name: trimmedName,
        educationLevel: profileData.educationLevel,
        academicYear: profileData.academicYear,
        onboardingCompleted: true,
      });

      navigate('/app/dashboard');
    } catch (err: any) {
      console.error('Failed to complete onboarding:', err);
      // Fallback redirect so user isn't stuck
      updateUser({ name: trimmedName, onboardingCompleted: true });
      navigate('/app/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-foreground">StudyOS Onboarding</span>
          </div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            Configure Your Academic Workspace
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Step {step} of 4: {step === 1 && 'Welcome to StudyOS'}
            {step === 2 && 'Academic Profile'}
            {step === 3 && 'Weekly Study Windows'}
            {step === 4 && 'Review & Finalize'}
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-200 ${
                  s === step
                    ? 'w-8 bg-primary-600'
                    : s < step
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-bold text-foreground">
                Welcome to StudyOS, {user?.name || 'Student'}!
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                StudyOS is designed specifically to solve the daily student question: “What should I study today?”
                In just a minute, we’ll configure your profile and study hours, and then you can add your courses in your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
                <BookOpen className="w-4 h-4 text-primary-600 mb-1.5" />
                <h4 className="text-xs font-semibold text-foreground">Dashboard Hub</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Manage your subjects, syllabus breakdown, and notes in your workspace.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
                <Clock className="w-4 h-4 text-emerald-600 mb-1.5" />
                <h4 className="text-xs font-semibold text-foreground">Available Hours</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Schedules sessions only when you are genuinely available to study.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
                <Calendar className="w-4 h-4 text-sky-600 mb-1.5" />
                <h4 className="text-xs font-semibold text-foreground">Exam Urgency</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Automatically prioritizes imminent exams without late-night cramming.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button size="lg" onClick={() => setStep(2)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Begin Setup
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Academic Profile */}
        {step === 2 && (
          <Card className="p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Your Academic Profile</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set up your academic details, education level, and preferred study paces.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-foreground">
                    Full Name
                  </label>
                  <span className={`text-[11px] font-mono ${
                    profileData.name.length > 50
                      ? 'text-rose-500 font-semibold'
                      : profileData.name.trim().length >= 3
                      ? 'text-emerald-600'
                      : 'text-muted-foreground'
                  }`}>
                    {profileData.name.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-card text-foreground focus:ring-2 focus:ring-primary-500 ${
                    profileData.name.length > 50 || (profileData.name.length > 0 && profileData.name.trim().length < 3)
                      ? 'border-rose-500'
                      : 'border-border'
                  }`}
                />
                {profileData.name.length > 50 && (
                  <p className="text-[11px] text-rose-500 mt-1">Username cannot exceed 50 characters</p>
                )}
                {profileData.name.length > 0 && profileData.name.trim().length < 3 && (
                  <p className="text-[11px] text-rose-500 mt-1">Username must be at least 3 characters</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Education Level
                </label>
                <select
                  value={profileData.educationLevel}
                  onChange={(e) => setProfileData({ ...profileData, educationLevel: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
                >
                  <option value="High School">High School</option>
                  <option value="Undergraduate">Undergraduate (College / University)</option>
                  <option value="Postgraduate">Postgraduate / Masters</option>
                  <option value="Doctorate">Doctorate / PhD</option>
                  <option value="Self-Taught">Self-Taught / Professional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Current Academic Year / Semester
                </label>
                <input
                  type="text"
                  value={profileData.academicYear}
                  placeholder="e.g. Year 2, Semester 1"
                  onChange={(e) => setProfileData({ ...profileData, academicYear: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Daily Study Goal (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={profileData.dailyTargetHours}
                  onChange={(e) =>
                    setProfileData({ ...profileData, dailyTargetHours: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-[10px] text-muted-foreground">Target daily study allocation</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Preferred Session Length (Minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={profileData.preferredSessionMinutes}
                  onChange={(e) =>
                    setProfileData({ ...profileData, preferredSessionMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-[10px] text-muted-foreground">Standard 50 mins recommended</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Break Interval (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={profileData.breakMinutes}
                  onChange={(e) =>
                    setProfileData({ ...profileData, breakMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-[10px] text-muted-foreground">Standard 10 mins recommended</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                size="sm"
                onClick={() => setStep(3)}
                disabled={profileData.name.trim().length < 3 || profileData.name.length > 50}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Availability
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Availability */}
        {step === 3 && (
          <Card className="p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Weekly Study Availability</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your typical study windows. StudyOS will schedule sessions strictly inside these blocks.
              </p>
            </div>

            <div className="space-y-3">
              {availability.map((slot, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    slot.enabled
                      ? 'bg-card border-border'
                      : 'bg-muted/40 border-border/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={slot.enabled}
                      onChange={(e) => {
                        const next = [...availability];
                        next[index].enabled = e.target.checked;
                        setAvailability(next);
                      }}
                      className="w-4 h-4 text-primary-600 rounded border-border"
                    />
                    <span className="text-xs font-semibold w-24">
                      {daysLabels[slot.dayOfWeek]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      disabled={!slot.enabled}
                      value={slot.startTime}
                      onChange={(e) => {
                        const next = [...availability];
                        next[index].startTime = e.target.value;
                        setAvailability(next);
                      }}
                      className="px-2 py-1 text-xs rounded-lg border border-border bg-card text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input
                      type="time"
                      disabled={!slot.enabled}
                      value={slot.endTime}
                      onChange={(e) => {
                        const next = [...availability];
                        next[index].endTime = e.target.value;
                        setAvailability(next);
                      }}
                      className="px-2 py-1 text-xs rounded-lg border border-border bg-card text-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button size="sm" onClick={() => setStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Review & Confirm
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Review & Finalize */}
        {step === 4 && (
          <Card className="p-8 space-y-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Everything Looks Ready!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Review your profile and study hours below. You can start adding your subjects and syllabus topics right from your dashboard.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border flex justify-between">
                <span className="text-muted-foreground">Student Name</span>
                <span className="font-semibold text-foreground">{profileData.name}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border flex justify-between">
                <span className="text-muted-foreground">Education & Cohort</span>
                <span className="font-semibold text-foreground">
                  {profileData.educationLevel} ({profileData.academicYear})
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border flex justify-between">
                <span className="text-muted-foreground">Active Study Days</span>
                <span className="font-semibold text-foreground">
                  {availability.filter((a) => a.enabled).length} days / week
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border flex justify-between">
                <span className="text-muted-foreground">Focus Session / Break</span>
                <span className="font-semibold text-foreground">
                  {profileData.preferredSessionMinutes}m session • {profileData.breakMinutes}m break
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border flex justify-between">
                <span className="text-muted-foreground">Daily Study Goal</span>
                <span className="font-semibold text-foreground">
                  {profileData.dailyTargetHours} hours / day
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                size="md"
                onClick={handleCompleteOnboarding}
                isLoading={isSubmitting}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Launch StudyOS Workspace
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
