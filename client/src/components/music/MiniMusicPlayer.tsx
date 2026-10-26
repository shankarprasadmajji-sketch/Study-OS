import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext.js';

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'studyos_floating_music_pos';
const EXPANDED_KEY = 'studyos_floating_music_expanded';

export const MiniMusicPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    currentTime,
    duration,
  } = useMusic();

  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(EXPANDED_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const widgetRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const clampPosition = useCallback(
    (x: number, y: number): Position => {
      const width = widgetRef.current?.offsetWidth || 380;
      const height = widgetRef.current?.offsetHeight || 120;
      const padding = 12;

      const minX = padding;
      const maxX = Math.max(padding, window.innerWidth - width - padding);
      const minY = padding;
      const maxY = Math.max(padding, window.innerHeight - height - padding);

      return {
        x: Math.min(Math.max(x, minX), maxX),
        y: Math.min(Math.max(y, minY), maxY),
      };
    },
    []
  );

  const getDefaultPosition = useCallback((): Position => {
    const width = widgetRef.current?.offsetWidth || 380;
    const height = widgetRef.current?.offsetHeight || 120;
    return {
      x: Math.max(12, window.innerWidth - width - 20),
      y: Math.max(12, window.innerHeight - height - 20),
    };
  }, []);

  // Initialize position on mount (restore saved or place at bottom-right)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition(clampPosition(parsed.x, parsed.y));
          return;
        }
      }
    } catch {
      // ignore JSON parse error
    }
    setPosition(getDefaultPosition());
  }, [clampPosition, getDefaultPosition]);

  // Keep inside screen bounds when browser window is resized
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => (prev ? clampPosition(prev.x, prev.y) : getDefaultPosition()));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition, getDefaultPosition]);

  // Save expanded preference
  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(EXPANDED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Reset to default bottom-right position
  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    const def = getDefaultPosition();
    setPosition(def);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
    } catch {
      // ignore
    }
  };

  // Pointer drag events for cross-device support (mouse, touch, trackpad)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    // Do not initiate drag if user interacted with clickable controls
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, [role="slider"], .no-drag')) {
      return;
    }

    const currentX = position?.x ?? (widgetRef.current?.offsetLeft || 20);
    const currentY = position?.y ?? (widgetRef.current?.offsetTop || 20);

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: currentX,
      origY: currentY,
    };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    const nextPos = clampPosition(
      dragStartRef.current.origX + deltaX,
      dragStartRef.current.origY + deltaY
    );
    setPosition(nextPos);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (position) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      } catch {
        // ignore
      }
    }
  };

  // Click on progress bar to seek
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = clickX / rect.width;
    seek(percent * duration);
  };

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Inline dynamic styles for position
  const inlineStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'none',
        zIndex: 50,
      }
    : {
        position: 'fixed',
        right: '16px',
        bottom: '16px',
        zIndex: 50,
      };

  return (
    <>
      {/* Equalizer animation keyframes */}
      <style>{`
        @keyframes studyos-eq-1 { 0%, 100% { height: 3px; } 50% { height: 13px; } }
        @keyframes studyos-eq-2 { 0%, 100% { height: 13px; } 50% { height: 4px; } }
        @keyframes studyos-eq-3 { 0%, 100% { height: 6px; } 50% { height: 14px; } }
        .studyos-eq-bar-1 { animation: studyos-eq-1 0.7s ease-in-out infinite; }
        .studyos-eq-bar-2 { animation: studyos-eq-2 0.55s ease-in-out infinite; }
        .studyos-eq-bar-3 { animation: studyos-eq-3 0.85s ease-in-out infinite; }
      `}</style>

      <div
        ref={widgetRef}
        style={inlineStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-[360px] sm:w-[380px] max-w-[calc(100vw-24px)] select-none touch-none transition-shadow ${
          isDragging
            ? 'cursor-grabbing shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] ring-2 ring-primary-500/60 scale-[1.01]'
            : 'cursor-grab hover:shadow-2xl'
        }`}
        role="region"
        aria-label="Floating Study Music Player"
      >
        <div className="bg-card/95 dark:bg-card/95 backdrop-blur-xl border border-border/80 shadow-xl rounded-2xl p-3 text-foreground relative overflow-hidden group">
          {/* Top Progress bar line (Clickable to scrub track) */}
          <div
            onClick={handleProgressClick}
            className="no-drag absolute top-0 left-0 right-0 h-1.5 bg-muted/80 hover:h-2 transition-all cursor-pointer group/bar"
            title="Click to seek time"
          >
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 relative transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-sm opacity-0 group-hover/bar:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Dedicated Drag Handle */}
            <div
              className="p-1 text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
              title="Drag to float anywhere on the screen"
            >
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Track Info with Equalizer */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden ${
                  isPlaying
                    ? 'bg-primary-600 text-white'
                    : 'bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400'
                }`}
              >
                {isPlaying ? (
                  <div className="flex items-end gap-[2px] h-3.5" aria-hidden="true">
                    <span className="w-1 bg-white rounded-full studyos-eq-bar-1" />
                    <span className="w-1 bg-white rounded-full studyos-eq-bar-2" />
                    <span className="w-1 bg-white rounded-full studyos-eq-bar-3" />
                  </div>
                ) : (
                  <Music2 className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {currentTrack.title}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {currentTrack.artist} •{' '}
                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                    {currentTrack.categoryLabel}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Controls */}
            <div className="no-drag flex items-center gap-1 shrink-0">
              {/* Prev Track (when expanded) */}
              {isExpanded && (
                <button
                  onClick={prevTrack}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Previous Track"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                )}
              </button>

              {/* Next Track */}
              <button
                onClick={nextTrack}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Reset / Snap back button */}
              <button
                onClick={handleResetPosition}
                className="p-1 text-muted-foreground/60 hover:text-foreground transition-colors"
                title="Reset position to bottom-right"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* External station link */}
              <Link
                to="/app/music"
                className="p-1 text-muted-foreground/80 hover:text-foreground transition-colors"
                title="Open Full Music Station"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {/* Expand / Minimize Toggle */}
              <button
                onClick={toggleExpanded}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title={isExpanded ? 'Collapse controls' : 'Expand controls'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Volume & Timestamp Row */}
          {isExpanded && (
            <div className="no-drag mt-2 pt-2 border-t border-border/60 flex items-center justify-between gap-3 text-[11px]">
              <span className="text-muted-foreground font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary-600"
                  title={`Volume: ${Math.round(volume * 100)}%`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
