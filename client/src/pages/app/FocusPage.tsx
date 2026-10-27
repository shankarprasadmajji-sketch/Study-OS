import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  Info,
  BookOpen,
  Music2,
  FileText,
  SkipForward,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Topic } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { useMusic } from '../../context/MusicContext.js';
import { QuickNoteModal } from '../../components/notes/QuickNoteModal.js';
import {
  checkExtensionStatus,
  startExtensionFocus,
  pauseExtensionFocus,
  resumeExtensionFocus,
  endExtensionFocus,
  getExtensionBlocklist,
  updateExtensionBlocklist,
  updateExtensionSettings,
  ExtensionStatus,
  BlocklistItem,
  ExtensionSettings,
  DEFAULT_BLOCKLIST,
  DEFAULT_SETTINGS,
} from '../../services/focusExtension.js';
import { ExtensionSetupModal } from '../../components/focus/ExtensionSetupModal.js';
import { BlocklistModal } from '../../components/focus/BlocklistModal.js';
import { EarlyEndModal } from '../../components/focus/EarlyEndModal.js';

export const FocusPage: React.FC = () => {
  const { currentTrack, isPlaying: isMusicPlaying, togglePlay: toggleMusic, nextTrack } = useMusic();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [targetMinutes, setTargetMinutes] = useState(25); // Default 25 min Pomodoro
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionCompletedNotice, setSessionCompletedNotice] = useState(false);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [pauseMusicOnTimerPause, setPauseMusicOnTimerPause] = useState(false);

  // Distraction Blocker Extension States
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({
    isAvailable: false,
    isFocusActive: false,
    isPaused: false,
    blockedCount: 0,
    activeRuleCount: 0,
    topicTitle: '',
    settings: DEFAULT_SETTINGS,
  });
  const [blocklist, setBlocklist] = useState<BlocklistItem[]>(DEFAULT_BLOCKLIST);
  const [extensionSettings, setExtensionSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isBlocklistModalOpen, setIsBlocklistModalOpen] = useState(false);
  const [isEarlyEndModalOpen, setIsEarlyEndModalOpen] = useState(false);
  const [blockingWarning, setBlockingWarning] = useState<string | null>(null);

  // Interval reference
  const intervalRef = useRef<any>(null);

  // Check extension availability and sync state
  const syncWithExtension = async () => {
    try {
      const status = await checkExtensionStatus();
      setExtensionStatus(status);
      if (status.isAvailable) {
        const data = await getExtensionBlocklist();
        setBlocklist(data.blocklist);
        setExtensionSettings(data.settings);

        // Anti-bypass state restoration: if extension was already in an active session
        if (status.isFocusActive && !isRunning) {
          setMode('focus');
          if (!status.isPaused) {
            setIsRunning(true);
          }
        }
      }
    } catch (err) {
      console.warn('[Focus Mode] Extension probe:', err);
    }
  };

  useEffect(() => {
    syncWithExtension();

    // Re-check when extension reports ready via custom DOM event
    const handleExtReady = () => syncWithExtension();
    window.addEventListener('studyos-extension-ready', handleExtReady);
    return () => window.removeEventListener('studyos-extension-ready', handleExtReady);
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await apiRequest<{ topics: Topic[] }>('/topics');
        const pending = (res.topics || []).filter((t) => t.status !== 'completed');
        setTopics(pending);
        if (pending.length > 0) {
          setSelectedTopicId(pending[0]._id);
        }
      } catch (err) {
        console.error('Failed to load topics for focus mode:', err);
      }
    };
    fetchTopics();
  }, []);

  // Timer countdown logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const selectedTopic = topics.find((t) => t._id === selectedTopicId);
  const currentTopicTitle = selectedTopic ? selectedTopic.title : 'Study Focus Sprint';

  const handleTimerComplete = async () => {
    setSessionCompletedNotice(true);

    // Beep audio chime simulation using AudioContext
    if (soundEnabled && typeof window !== 'undefined' && window.AudioContext) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch {
        // Fallback gracefully
      }
    }

    // Record study session duration in backend
    if (mode === 'focus' && selectedTopicId) {
      try {
        await apiRequest('/study-sessions', {
          method: 'POST',
          body: JSON.stringify({
            topicId: selectedTopicId,
            plannedMinutes: targetMinutes,
            actualMinutes: targetMinutes,
            status: 'completed',
            sessionType: 'study',
          }),
        }).catch(() => {});
      } catch {
        // Ignore
      }
    }

    // Follow configured session completion policy for website unblocking
    if (extensionStatus.isAvailable && extensionStatus.isFocusActive) {
      if (extensionSettings.completeBehavior === 'auto_release') {
        try {
          await endExtensionFocus('timer_completed');
          setExtensionStatus((prev) => ({
            ...prev,
            isFocusActive: false,
            isPaused: false,
            blockedCount: 0,
          }));
        } catch (err) {
          console.warn('[Focus Mode] Could not auto-release extension rules:', err);
        }
      }
    }
  };

  const handleStart = async () => {
    setSessionCompletedNotice(false);
    setBlockingWarning(null);

    // If starting a Focus session, activate extension blocking
    if (mode === 'focus') {
      try {
        const status = await checkExtensionStatus();
        setExtensionStatus(status);

        if (status.isAvailable) {
          if (status.isPaused) {
            // Resume previously paused session
            await resumeExtensionFocus();
            setExtensionStatus((prev) => ({ ...prev, isPaused: false }));
          } else {
            // Start brand new session
            const result = await startExtensionFocus({
              durationMinutes: targetMinutes,
              topicTitle: currentTopicTitle,
            });
            if (result.success) {
              setExtensionStatus((prev) => ({
                ...prev,
                isFocusActive: true,
                isPaused: false,
                blockedCount: result.blockedCount,
              }));
            }
          }
        } else {
          setBlockingWarning(
            'Extension not detected. Timer started, but website blocking is inactive. Click "Setup Extension" to enable.'
          );
        }
      } catch {
        setBlockingWarning('Unable to reach distraction blocker extension.');
      }
    }

    setIsRunning(true);
  };

  const handlePause = async () => {
    setIsRunning(false);
    if (pauseMusicOnTimerPause && isMusicPlaying) {
      toggleMusic();
    }

    // Relay pause command to extension (follows user's pause anti-bypass policy)
    if (extensionStatus.isAvailable && extensionStatus.isFocusActive) {
      try {
        await pauseExtensionFocus();
        setExtensionStatus((prev) => ({
          ...prev,
          isPaused: true,
        }));
      } catch (err) {
        console.warn('[Focus Mode] Could not pause extension session:', err);
      }
    }
  };

  const handleReset = () => {
    // Anti-Bypass: Require explicit confirmation before ending an active focus session early
    if (extensionStatus.isAvailable && extensionStatus.isFocusActive && isRunning) {
      setIsEarlyEndModalOpen(true);
      return;
    }
    executeEndSession();
  };

  const executeEndSession = async () => {
    setIsRunning(false);
    setSecondsLeft(targetMinutes * 60);
    setSessionCompletedNotice(false);
    setIsEarlyEndModalOpen(false);

    // End focus session in extension and unblock websites
    if (extensionStatus.isAvailable && extensionStatus.isFocusActive) {
      try {
        await endExtensionFocus('user_early_end');
        setExtensionStatus((prev) => ({
          ...prev,
          isFocusActive: false,
          isPaused: false,
          blockedCount: 0,
        }));
      } catch (err) {
        console.warn('[Focus Mode] Could not release extension blocking:', err);
      }
    }
  };

  const handleModeChange = (newMode: 'focus' | 'break') => {
    if (extensionStatus.isAvailable && extensionStatus.isFocusActive) {
      endExtensionFocus('mode_change').catch(() => {});
      setExtensionStatus((prev) => ({
        ...prev,
        isFocusActive: false,
        isPaused: false,
        blockedCount: 0,
      }));
    }

    setMode(newMode);
    setIsRunning(false);
    setSessionCompletedNotice(false);
    const mins = newMode === 'focus' ? 25 : 5;
    setTargetMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const setCustomMinutes = (mins: number) => {
    if (extensionStatus.isAvailable && extensionStatus.isFocusActive) {
      endExtensionFocus('preset_change').catch(() => {});
      setExtensionStatus((prev) => ({
        ...prev,
        isFocusActive: false,
        isPaused: false,
        blockedCount: 0,
      }));
    }
    setTargetMinutes(mins);
    setSecondsLeft(mins * 60);
    setIsRunning(false);
    setSessionCompletedNotice(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((targetMinutes * 60 - secondsLeft) / (targetMinutes * 60)) * 100;
  const enabledWebsitesCount = blocklist.filter((b) => b.enabled).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-center sm:text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center sm:justify-start gap-2.5">
            <Timer className="w-6 h-6 text-primary-600" />
            Distraction-Free Focus Mode
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pomodoro interval timer integrated with real website blocking, Study Music, and Quick Notes.
          </p>
        </div>

        <div className="flex items-center justify-center sm:justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsQuickNoteOpen(true)}
            leftIcon={<FileText className="w-3.5 h-3.5" />}
          >
            Quick Note
          </Button>
        </div>
      </div>

      {/* Real Website Distraction Blocker Extension Status Banner */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
              extensionStatus.isAvailable
                ? extensionStatus.isFocusActive
                  ? 'bg-emerald-500 text-white shadow-md ring-4 ring-emerald-500/20'
                  : 'bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
            }`}
          >
            {extensionStatus.isAvailable ? (
              extensionStatus.isFocusActive ? (
                <ShieldCheck className="w-5 h-5 animate-pulse" />
              ) : (
                <Shield className="w-5 h-5" />
              )
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground text-sm">
                {extensionStatus.isAvailable
                  ? extensionStatus.isFocusActive
                    ? extensionStatus.isPaused
                      ? extensionSettings.pauseBehavior === 'keep_blocking'
                        ? 'Distraction Blocking Active (Timer Paused • Anti-Bypass Enforced)'
                        : 'Distraction Blocking Paused'
                      : `Distraction Blocking Active (${extensionStatus.blockedCount} websites blocked)`
                    : `Distraction Blocker Ready (${enabledWebsitesCount} websites configured)`
                  : 'Distraction Blocker Companion Disconnected'}
              </span>

              <Badge
                variant={
                  extensionStatus.isAvailable
                    ? extensionStatus.isFocusActive
                      ? 'success'
                      : 'info'
                    : 'warning'
                }
                size="sm"
              >
                {extensionStatus.isAvailable
                  ? extensionStatus.isFocusActive
                    ? 'Blocking Active'
                    : 'Companion Ready'
                  : 'Extension Offline'}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              {extensionStatus.isAvailable
                ? extensionStatus.isFocusActive
                  ? 'Distracting websites (YouTube, Reddit, Netflix, etc.) redirected to StudyOS blocked screen in all tabs.'
                  : 'Websites will be automatically blocked as soon as you start a focus sprint.'
                : 'Install the StudyOS Chrome Manifest V3 companion to block websites on your device.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsBlocklistModalOpen(true)}
            leftIcon={<Sliders className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Blocklist & Policy
          </Button>

          {!extensionStatus.isAvailable && (
            <Button
              size="sm"
              onClick={() => setIsSetupModalOpen(true)}
              leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
              className="text-xs shadow-sm"
            >
              Setup Blocker
            </Button>
          )}
        </div>
      </div>

      {blockingWarning && (
        <div className="p-3.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{blockingWarning}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSetupModalOpen(true)}
            className="text-xs font-semibold text-amber-800 dark:text-amber-200 underline"
          >
            Setup Guide
          </Button>
        </div>
      )}

      {/* Main Timer Display Card */}
      <Card className="p-6 sm:p-10 text-center border-border shadow-elevated bg-card relative overflow-hidden">
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="inline-flex p-1 bg-muted rounded-xl">
            <button
              onClick={() => handleModeChange('focus')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'focus'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Study Focus
            </button>
            <button
              onClick={() => handleModeChange('break')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'break'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Short Break
            </button>
          </div>
        </div>

        {/* Duration Quick Presets */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {(mode === 'focus' ? [15, 25, 45, 60] : [5, 10, 15]).map((mins) => (
            <button
              key={mins}
              onClick={() => setCustomMinutes(mins)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                targetMinutes === mins
                  ? 'bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Selected Topic Picker */}
        <div className="max-w-md mx-auto mb-6 text-left">
          <label className="block text-xs font-semibold text-foreground mb-1">
            Focusing on Syllabus Topic:
          </label>
          {topics.length > 0 ? (
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
            >
              {topics.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} ({t.difficulty} • Est. {t.estimatedMinutes}m)
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              All syllabus topics marked completed or none available.
            </p>
          )}
        </div>

        {/* Integrated Study Music Bar */}
        {currentTrack && (
          <div className="max-w-md mx-auto mb-6 p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center shrink-0">
                <Music2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{currentTrack.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{currentTrack.categoryLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={toggleMusic}
                className="w-7 h-7 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center"
                title={isMusicPlaying ? 'Pause Music' : 'Play Study Music'}
              >
                {isMusicPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>
              <button
                onClick={nextTrack}
                className="p-1 text-muted-foreground hover:text-foreground"
                title="Next Music Track"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Giant Timer Display */}
        <div className="my-6">
          <div className="font-mono text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-foreground select-none">
            {formatTime(secondsLeft)}
          </div>
          <Badge
            size="md"
            variant={mode === 'focus' ? 'info' : 'success'}
            className="mt-3 text-xs uppercase tracking-wider"
          >
            {mode === 'focus' ? 'Active Focus Period' : 'Relax & Recharge Break'}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="max-w-md mx-auto w-full bg-muted rounded-full h-2 mb-8 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              mode === 'focus' ? 'bg-primary-600' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          {!isRunning ? (
            <Button
              size="lg"
              onClick={handleStart}
              leftIcon={<Play className="w-5 h-5 fill-current" />}
              className="px-8 shadow-md"
            >
              Start Focus Session
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              onClick={handlePause}
              leftIcon={<Pause className="w-5 h-5" />}
              className="px-8"
            >
              Pause
            </Button>
          )}

          <Button
            size="lg"
            variant="ghost"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-4 h-4 text-muted-foreground" />}
          >
            Reset
          </Button>
        </div>

        {/* Preferences Toggle: Pause music with timer */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={pauseMusicOnTimerPause}
              onChange={(e) => setPauseMusicOnTimerPause(e.target.checked)}
              className="rounded border-border text-primary-600"
            />
            <span>Pause music when timer is paused</span>
          </label>

          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="flex items-center gap-1 hover:text-foreground"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Chime on' : 'Chime off'}</span>
          </button>
        </div>

        {/* Completion Notification */}
        {sessionCompletedNotice && (
          <div className="mt-8 p-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">
              Interval Completed! Recorded in your study history.
            </span>
          </div>
        )}
      </Card>

      {/* Extension Setup Guide Modal */}
      <ExtensionSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onStatusChange={(status) => setExtensionStatus(status)}
      />

      {/* Blocklist & Anti-Bypass Settings Modal */}
      <BlocklistModal
        isOpen={isBlocklistModalOpen}
        onClose={() => setIsBlocklistModalOpen(false)}
        blocklist={blocklist}
        settings={extensionSettings}
        isFocusActive={extensionStatus.isFocusActive}
        onSaveBlocklist={async (updated) => {
          setBlocklist(updated);
          if (extensionStatus.isAvailable) {
            await updateExtensionBlocklist(updated);
          }
        }}
        onSaveSettings={async (updated) => {
          setExtensionSettings(updated);
          if (extensionStatus.isAvailable) {
            await updateExtensionSettings(updated);
          }
        }}
      />

      {/* Anti-Bypass Early End Confirmation Dialog */}
      <EarlyEndModal
        isOpen={isEarlyEndModalOpen}
        minutesRemaining={Math.max(1, Math.ceil(secondsLeft / 60))}
        onCancel={() => setIsEarlyEndModalOpen(false)}
        onConfirmEnd={executeEndSession}
      />

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={isQuickNoteOpen}
        onClose={() => setIsQuickNoteOpen(false)}
        defaultTopicId={selectedTopicId}
      />
    </div>
  );
};
