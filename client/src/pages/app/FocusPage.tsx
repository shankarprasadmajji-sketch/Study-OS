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
} from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Topic } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { useMusic } from '../../context/MusicContext.js';
import { QuickNoteModal } from '../../components/notes/QuickNoteModal.js';

export const FocusPage: React.FC = () => {
  const { currentTrack, isPlaying: isMusicPlaying, togglePlay: toggleMusic, nextTrack, volume: musicVolume, setVolume: setMusicVolume } = useMusic();

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

  // Interval reference
  const intervalRef = useRef<any>(null);

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
  };

  const handleStart = () => {
    setIsRunning(true);
    setSessionCompletedNotice(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    if (pauseMusicOnTimerPause && isMusicPlaying) {
      toggleMusic();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(targetMinutes * 60);
    setSessionCompletedNotice(false);
  };

  const handleModeChange = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    setIsRunning(false);
    setSessionCompletedNotice(false);
    const mins = newMode === 'focus' ? 25 : 5;
    setTargetMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const setCustomMinutes = (mins: number) => {
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
            Pomodoro interval timer integrated with Study Music and Quick Notes.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsQuickNoteOpen(true)}
          leftIcon={<FileText className="w-3.5 h-3.5" />}
        >
          Quick Note
        </Button>
      </div>

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

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={isQuickNoteOpen}
        onClose={() => setIsQuickNoteOpen(false)}
        defaultTopicId={selectedTopicId}
      />
    </div>
  );
};
