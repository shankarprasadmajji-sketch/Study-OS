import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  GraduationCap,
  Calendar,
  Clock,
  Settings,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  CalendarDays,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { EditProfileModal } from '../../components/profile/EditProfileModal.js';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state for quick inline editing
  const [name, setName] = useState(user?.name || '');
  const [educationLevel, setEducationLevel] = useState(user?.educationLevel || 'Undergraduate');
  const [academicYear, setAcademicYear] = useState(user?.academicYear || 'Year 1');
  const [dailyTargetHours, setDailyTargetHours] = useState(user?.preferences?.dailyTargetHours || 4);
  const [preferredSessionMinutes, setPreferredSessionMinutes] = useState(
    user?.preferences?.preferredSessionMinutes || 50
  );
  const [breakMinutes, setBreakMinutes] = useState(user?.preferences?.breakMinutes || 10);

  // Keep synced if user object changes
  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEducationLevel(user.educationLevel || 'Undergraduate');
      setAcademicYear(user.academicYear || 'Year 1');
      setDailyTargetHours(user.preferences?.dailyTargetHours || 4);
      setPreferredSessionMinutes(user.preferences?.preferredSessionMinutes || 50);
      setBreakMinutes(user.preferences?.breakMinutes || 10);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    if (name.length > 50) {
      setErrorMsg('Username cannot exceed 50 characters');
      return;
    }
    if (trimmedName.length < 3) {
      setErrorMsg('Username must be at least 3 characters');
      return;
    }

    setSaving(true);

    try {
      const res = await apiRequest<{ success: boolean; user: any }>('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: trimmedName,
          educationLevel,
          academicYear,
          preferences: {
            preferredSessionMinutes: Number(preferredSessionMinutes),
            breakMinutes: Number(breakMinutes),
            dailyTargetHours: Number(dailyTargetHours),
          },
        }),
      });

      if (res.user) {
        updateUser(res.user);
      }
      setSuccessMsg('Profile updated successfully and saved to MongoDB!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isNameValid = name.trim().length >= 3 && name.length <= 50;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">User Profile & Account</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            View and manage your student profile, academic credentials, and study preferences
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/app/settings">
            <Button size="sm" variant="outline" leftIcon={<Settings className="w-3.5 h-3.5" />}>
              All Settings
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-500" />}
            className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Success & Error alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Identity Card (4 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="p-6 text-center border-border shadow-subtle">
            {/* Circular Avatar */}
            <div className="relative inline-block mx-auto mb-4">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User'}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-500/20 shadow-md mx-auto"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-600 text-white flex items-center justify-center font-extrabold text-2xl uppercase shadow-md mx-auto">
                  {user?.name?.trim()?.charAt(0) || 'U'}
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center text-white"
                title="Active Account"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-foreground tracking-tight">{user?.name || 'Student'}</h3>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{user?.email}</span>
            </p>

            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              <Badge variant="info" size="sm">
                {user?.educationLevel || 'Undergraduate'}
              </Badge>
              <Badge variant="default" size="sm">
                {user?.academicYear || 'Year 1'}
              </Badge>
              {user?.authProvider === 'google' && (
                <Badge variant="success" size="sm">
                  Google Connected
                </Badge>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-border grid grid-cols-2 gap-3 text-left">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
                  Daily Target
                </span>
                <span className="text-sm font-bold text-foreground">
                  {user?.preferences?.dailyTargetHours || 4} hrs/day
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
                  Focus Session
                </span>
                <span className="text-sm font-bold text-foreground">
                  {user?.preferences?.preferredSessionMinutes || 50} mins
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Member Since</span>
              <span className="font-mono text-foreground">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
              </span>
            </div>

            <div className="mt-5">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setIsEditModalOpen(true)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Quick Edit in Modal
              </Button>
            </div>
          </Card>

          {/* Quick Shortcuts */}
          <Card className="p-5 space-y-2 border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Quick Navigation
            </h4>
            <Link
              to="/app/subjects"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted text-xs text-foreground font-medium transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-primary-600" />
                <span>My Subjects & Syllabus</span>
              </div>
              <span className="text-[11px] text-muted-foreground">&rarr;</span>
            </Link>
            <Link
              to="/app/timetable"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted text-xs text-foreground font-medium transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-primary-600" />
                <span>Timetable & Schedule</span>
              </div>
              <span className="text-[11px] text-muted-foreground">&rarr;</span>
            </Link>
            <Link
              to="/app/settings"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted text-xs text-foreground font-medium transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-primary-600" />
                <span>Availability & Passwords</span>
              </div>
              <span className="text-[11px] text-muted-foreground">&rarr;</span>
            </Link>
          </Card>
        </div>

        {/* Right Column: Profile Edit Form (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="p-6 border-border shadow-subtle">
            <CardHeader className="p-0 pb-5 mb-5 border-b border-border">
              <CardTitle className="text-base font-bold">Edit Profile Information</CardTitle>
              <CardDescription>
                Update your student name, academic standing, and study session defaults. Changes persist to your account.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Username Field with Counter */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-primary-600" />
                    Student Name / Username
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      name.length > 50
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : name.trim().length >= 3
                        ? 'text-muted-foreground'
                        : 'text-amber-600 dark:text-amber-400 font-medium'
                    }`}
                  >
                    {name.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  required
                  placeholder="e.g. Alex Rivera"
                  className={`w-full px-3 py-2 bg-card border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                    !isNameValid && name.length > 0 ? 'border-amber-400 focus:ring-amber-500' : 'border-border'
                  }`}
                />
                {name.trim().length > 0 && name.trim().length < 3 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    Username must be at least 3 characters.
                  </p>
                )}
                {name.length >= 50 && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                    Username cannot exceed 50 characters.
                  </p>
                )}
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary-600" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl text-xs sm:text-sm text-muted-foreground cursor-not-allowed"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Email is linked to your authentication account.
                </span>
              </div>

              {/* Education Level & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-primary-600" />
                    Education Level
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="High School">High School</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Doctorate">Doctorate</option>
                    <option value="Self-Taught / Professional">Self-Taught / Professional</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary-600" />
                    Academic Year / Semester
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. Year 2, Semester 1"
                    className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Study Preferences Section */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock className="w-3.5 h-3.5 text-primary-600" />
                  <span>Study Timer & Daily Goal Defaults</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Session (mins)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="180"
                      value={preferredSessionMinutes}
                      onChange={(e) => setPreferredSessionMinutes(parseInt(e.target.value) || 25)}
                      className="w-full px-2.5 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Break (mins)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 5)}
                      className="w-full px-2.5 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Daily Goal (hrs)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="16"
                      value={dailyTargetHours}
                      onChange={(e) => setDailyTargetHours(parseInt(e.target.value) || 4)}
                      className="w-full px-2.5 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-border flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  isLoading={saving}
                  disabled={!isNameValid || saving}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setSuccessMsg('Profile updated successfully!');
          setTimeout(() => setSuccessMsg(null), 3000);
        }}
      />
    </div>
  );
};

export default ProfilePage;
