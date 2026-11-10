import React, { useState, useEffect } from 'react';
import { User as UserIcon, BookOpen, Clock, CheckCircle2, AlertTriangle, Sparkles, GraduationCap } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../api/client.js';
import { User } from '../../types/index.js';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState('');
  const [educationLevel, setEducationLevel] = useState('Undergraduate');
  const [academicYear, setAcademicYear] = useState('Year 1');
  const [preferredSessionMinutes, setPreferredSessionMinutes] = useState(50);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [dailyTargetHours, setDailyTargetHours] = useState(4);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync state whenever modal opens or user data changes
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setEducationLevel(user.educationLevel || 'Undergraduate');
      setAcademicYear(user.academicYear || 'Year 1');
      setPreferredSessionMinutes(user.preferences?.preferredSessionMinutes || 50);
      setBreakMinutes(user.preferences?.breakMinutes || 10);
      setDailyTargetHours(user.preferences?.dailyTargetHours || 4);
      setError(null);
      setSuccess(false);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedName = name.trim();
    if (name.length > 50) {
      setError('Username cannot exceed 50 characters');
      return;
    }
    if (trimmedName.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest<{ success: boolean; user: User }>('/profile', {
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
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isNameValid = name.trim().length >= 3 && name.length <= 50;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      description="Update your personal details, education info, and study targets"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Success Alert */}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile changes saved successfully!</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Account Info Badge */}
        <div className="p-3 rounded-xl bg-muted/60 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-sm">
            {user?.name?.trim()?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground truncate">{user?.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 font-semibold">
                {user?.authProvider === 'google' ? 'Google Account' : 'StudyOS Account'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {/* Display Name / Username Field with 3-50 length constraint and counter */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-primary-600" />
              Full Name / Username
            </label>
            <span
              className={`text-[11px] font-mono ${
                name.length > 50
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
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

        {/* Education Level & Academic Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
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
            <label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary-600" />
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
        <div className="pt-2 border-t border-border space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Clock className="w-3.5 h-3.5 text-primary-600" />
            <span>Study Timer & Target Preferences</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Session (min)
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
                Break (min)
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={loading}
            disabled={!isNameValid || loading}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

