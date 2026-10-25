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
} from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Topic } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';

export const FocusPage: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [targetMinutes, setTargetMinutes] = useState(25); // Default 25 min Pomodoro
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionCompletedNotice, setSessionCompletedNotice] = useState(false);

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

    // Beep / audio chime simulation using AudioContext
    if (soundEnabled && typeof window !== 'undefined' && window.AudioContext) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch {
        // AudioContext policy fallback
      }
    }

    // Auto mark topic completed or log time if topic selected
    if (selectedTopicId && mode === 'focus') {
      try {
        await apiRequest(`/topics/${selectedTopicId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
        });
      } catch (err) {
        console.error('Failed to update topic progress:', err);
      }
    }
  };

  const handleStart = () => {
    setSessionCompletedNotice(false);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(targetMinutes * 60);
    setSessionCompletedNotice(false);
  };

  const setPreset = (mins: number, presetMode: 'focus' | 'break') => {
    setIsRunning(false);
    setMode(presetMode);
    setTargetMinutes(mins);
    setSecondsLeft(mins * 60);
    setSessionCompletedNotice(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedTopic = topics.find((t) => t._id === selectedTopicId);
  const progressPercent = Math.round(((targetMinutes * 60 - secondsLeft) / (targetMinutes * 60)) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Distraction-Free Focus Mode</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Eliminate digital friction and immerse yourself in single-task study intervals
        </p>
      </div>

      {/* Focus Timer Card */}
      <Card className="p-8 sm:p-12 text-center relative overflow-hidden shadow-elevated">
        {/* Top Controls / Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex rounded-xl border border-border bg-muted/40 p-1 text-xs">
            <button
              onClick={() => setPreset(25, 'focus')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                mode === 'focus' && targetMinutes === 25
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => setPreset(50, 'focus')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                mode === 'focus' && targetMinutes === 50
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Deep Work (50m)
            </button>
            <button
              onClick={() => setPreset(5, 'break')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                mode === 'break' && targetMinutes === 5
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Short Break (5m)
            </button>
            <button
              onClick={() => setPreset(15, 'break')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                mode === 'break' && targetMinutes === 15
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Long Break (15m)
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground"
            title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-primary-600" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Selected Topic Picker */}
        <div className="max-w-md mx-auto mb-8 text-left">
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

        {/* Giant Timer Display */}
        <div className="my-8">
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

        {/* Completion Notification */}
        {sessionCompletedNotice && (
          <div className="mt-8 p-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">
              Interval Completed! Take a breather or proceed to your next topic.
            </span>
          </div>
        )}
      </Card>

      {/* Realistic Platform Note */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border text-[11px] text-muted-foreground flex items-start gap-2.5">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Note on Device Limitations:</strong> A standard web application runs inside browser sandboxes and cannot natively close third-party native apps (such as Instagram or YouTube) on your operating system. For system-level site blocking, we recommend combining StudyOS with dedicated platform screen-time utilities or browser extensions.
        </p>
      </div>
    </div>
  );
};
