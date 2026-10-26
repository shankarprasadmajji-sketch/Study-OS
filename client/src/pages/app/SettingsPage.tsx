import React, { useState, useEffect } from 'react';
import {
  User,
  Clock,
  Database,
  Moon,
  Sun,
  Bell,
  Save,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { apiRequest } from '../../api/client.js';
import { AvailabilitySlot } from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, dbStatus, refreshDbStatus, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Profile fields
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    educationLevel: user?.educationLevel || 'Undergraduate',
    academicYear: user?.academicYear || 'Year 1',
    timezone: user?.timezone || 'UTC',
    preferredSessionMinutes: user?.preferences?.preferredSessionMinutes || 50,
    breakMinutes: user?.preferences?.breakMinutes || 10,
    dailyTargetHours: user?.preferences?.dailyTargetHours || 4,
    reminderNotifications: user?.preferences?.reminderNotifications !== false,
  });

  // Availability state
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availSuccess, setAvailSuccess] = useState(false);

  const daysLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchAvail = async () => {
      try {
        const res = await apiRequest<{ availability: AvailabilitySlot[] }>('/availability');
        if (res.availability && res.availability.length > 0) {
          setAvailability(res.availability);
        } else {
          // Default week slots
          setAvailability([
            { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', enabled: true },
            { dayOfWeek: 2, startTime: '09:00', endTime: '12:00', enabled: true },
            { dayOfWeek: 3, startTime: '09:00', endTime: '12:00', enabled: true },
            { dayOfWeek: 4, startTime: '14:00', endTime: '17:00', enabled: true },
            { dayOfWeek: 5, startTime: '09:00', endTime: '12:00', enabled: true },
            { dayOfWeek: 6, startTime: '10:00', endTime: '13:00', enabled: true },
            { dayOfWeek: 0, startTime: '14:00', endTime: '17:00', enabled: false },
          ]);
        }
      } catch (err) {
        console.error('Failed to load availability:', err);
      }
    };
    fetchAvail();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      const res = await apiRequest<{ user: any }>('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profileForm.name,
          educationLevel: profileForm.educationLevel,
          academicYear: profileForm.academicYear,
          timezone: profileForm.timezone,
          preferences: {
            preferredSessionMinutes: profileForm.preferredSessionMinutes,
            breakMinutes: profileForm.breakMinutes,
            dailyTargetHours: profileForm.dailyTargetHours,
            reminderNotifications: profileForm.reminderNotifications,
          },
        }),
      });

      updateUser(res.user);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    setAvailSuccess(false);
    try {
      await apiRequest('/availability', {
        method: 'PUT',
        body: JSON.stringify({ slots: availability }),
      });
      setAvailSuccess(true);
      setTimeout(() => setAvailSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save study availability.');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleAddSlot = (dayIdx: number) => {
    setAvailability((prev) => [
      ...prev,
      { dayOfWeek: dayIdx, startTime: '14:00', endTime: '17:00', enabled: true },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Settings & Preferences</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your academic details, study availability slots, theme, and database settings
        </p>
      </div>

      {/* Profile & Academic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Profile & Timer Defaults</CardTitle>
          <CardDescription>Update your personal information and default study preferences</CardDescription>
        </CardHeader>

        {profileSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile and preferences updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1">Display Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Education Level</label>
              <select
                value={profileForm.educationLevel}
                onChange={(e) => setProfileForm({ ...profileForm, educationLevel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
              >
                <option value="High School">High School</option>
                <option value="Undergraduate">Undergraduate (College / University)</option>
                <option value="Postgraduate">Postgraduate / Masters</option>
                <option value="Doctorate">Doctorate / PhD</option>
                <option value="Self-Taught">Self-Taught / Professional</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Academic Year</label>
              <input
                type="text"
                value={profileForm.academicYear}
                placeholder="e.g. Year 2 (Sophomore)"
                onChange={(e) => setProfileForm({ ...profileForm, academicYear: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Timezone</label>
              <input
                type="text"
                value={profileForm.timezone}
                onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Preferred Focus Session (Minutes)
              </label>
              <input
                type="number"
                min="15"
                max="180"
                value={profileForm.preferredSessionMinutes}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    preferredSessionMinutes: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Break Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={profileForm.breakMinutes}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, breakMinutes: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="reminderNotify"
              checked={profileForm.reminderNotifications}
              onChange={(e) =>
                setProfileForm({ ...profileForm, reminderNotifications: e.target.checked })
              }
              className="w-4 h-4 text-primary-600 rounded border-border"
            />
            <label htmlFor="reminderNotify" className="text-xs text-foreground cursor-pointer">
              Enable in-app study session notifications and reminders
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" isLoading={savingProfile} leftIcon={<Save className="w-3.5 h-3.5" />}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Weekly Study Availability Windows */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Weekly Study Windows</CardTitle>
            <CardDescription>
              Define your regular study slots. StudyOS algorithms strictly schedule inside these intervals.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={handleSaveAvailability}
            isLoading={savingAvailability}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Availability
          </Button>
        </CardHeader>

        {availSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Weekly study schedule saved!</span>
          </div>
        )}

        <div className="space-y-3">
          {availability.map((slot, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                slot.enabled ? 'bg-card border-border' : 'bg-muted/40 border-border/40 opacity-60'
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
                <span className="font-semibold w-24">{daysLabels[slot.dayOfWeek]}</span>
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
                  className="px-2 py-1 rounded-lg border border-border bg-card text-foreground"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="time"
                  disabled={!slot.enabled}
                  value={slot.endTime}
                  onChange={(e) => {
                    const next = [...availability];
                    next[index].endTime = e.target.value;
                    setAvailability(next);
                  }}
                  className="px-2 py-1 rounded-lg border border-border bg-card text-foreground"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveSlot(index)}
                  className="p-1 text-muted-foreground hover:text-rose-600"
                  title="Remove slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Theme Preference Card */}
      <Card>
        <CardHeader>
          <CardTitle>Interface Appearance</CardTitle>
          <CardDescription>Select your preferred color theme</CardDescription>
        </CardHeader>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 p-4 rounded-xl border text-center transition-all ${
              theme === 'light'
                ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/20 text-primary-700 font-bold'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            <Sun className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <span className="text-xs">Light Theme</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 p-4 rounded-xl border text-center transition-all ${
              theme === 'dark'
                ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/20 text-primary-700 font-bold'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            <Moon className="w-5 h-5 mx-auto mb-1 text-indigo-400" />
            <span className="text-xs">Dark Theme</span>
          </button>
        </div>
      </Card>

      {/* Database Integration Architecture */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Database Architecture</CardTitle>
            <CardDescription>MongoDB and Mongoose backend connection status</CardDescription>
          </div>
          <Badge
            variant={
              dbStatus?.isConnected
                ? 'success'
                : dbStatus?.isConfigured
                ? 'danger'
                : 'warning'
            }
          >
            {dbStatus?.isConnected
              ? 'MongoDB Connected'
              : dbStatus?.state === 'connecting'
              ? 'MongoDB Connecting...'
              : dbStatus?.isConfigured
              ? 'MongoDB Disconnected'
              : 'Demo Mode Active'}
          </Badge>
        </CardHeader>

        <div className="p-4 rounded-xl bg-muted/60 border border-border text-xs space-y-2">
          <p className="font-semibold text-foreground">
            Connection State: <span className="font-mono">{dbStatus?.state || 'unconfigured'}</span>
            {dbStatus?.host && <span> · Host: <span className="font-mono">{dbStatus.host}</span></span>}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {dbStatus?.isConnected
              ? `Connected to database "${dbStatus.databaseName}" on host "${dbStatus.host}". Mongoose ODM models are persisting all changes directly to MongoDB.`
              : dbStatus?.isConfigured
              ? `A MongoDB URI is configured in server/.env, but the server is not currently connected to the cluster. Error: ${dbStatus?.errorMessage || 'Connection unavailable'}. StudyOS backend is actively attempting automatic reconnection.`
              : 'Notice: MONGODB_URI is not set in server/.env. StudyOS has safely booted in Demo Mode with an in-memory repository so you can test all features. Once you add MONGODB_URI, all database models connect automatically.'}
          </p>
        </div>
      </Card>

      {/* Sign Out Card */}
      <Card className="border-rose-200 dark:border-rose-950">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-foreground">Account Session</h4>
            <p className="text-[11px] text-muted-foreground">Sign out of your StudyOS workspace on this device</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                logout();
              }
            }}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
};
