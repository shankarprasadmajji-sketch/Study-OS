import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Music2,
  Timer,
  Headphones,
  Sparkles,
  Info,
  Upload,
  UploadCloud,
  Trash2,
  CheckCircle2,
  FileAudio,
  X,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext.js';
import { CATEGORIES } from '../../data/musicTracks.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';

export const MusicPage: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    playTrack,
    nextTrack,
    prevTrack,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isRepeat,
    toggleRepeat,
    isShuffle,
    toggleShuffle,
    currentTime,
    duration,
    seek,
    activeCategory,
    setActiveCategory,
    filteredTracks,
    customTracks,
    uploadTrack,
    deleteCustomTrack,
    isUploading,
    error,
  } = useMusic();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showUploadZone, setShowUploadZone] = useState(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProcessFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const audioFiles = files.filter(
      (f) =>
        f.type.startsWith('audio/') ||
        /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f.name)
    );

    if (audioFiles.length === 0) {
      setNotification({
        message: 'Please choose valid audio files (.mp3, .wav, .ogg, .m4a, .aac).',
        type: 'error',
      });
      return;
    }

    try {
      let lastUploaded = null;
      for (const file of audioFiles) {
        lastUploaded = await uploadTrack(file);
      }

      setNotification({
        message:
          audioFiles.length === 1
            ? `Successfully uploaded "${lastUploaded?.title}"! Playing now.`
            : `Successfully uploaded ${audioFiles.length} MP3 tracks to your library!`,
        type: 'success',
      });
      setShowUploadZone(false);
    } catch {
      setNotification({
        message: 'Could not process one or more audio files. Please try again.',
        type: 'error',
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleProcessFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleProcessFiles(e.dataTransfer.files);
  };

  return (
    <div
      className="space-y-6"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={handleDrop}
    >
      {/* Hidden file input for upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Headphones className="w-6 h-6 text-primary-600" />
            Study Music Station
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Focus-engineered audio streams: Lo-Fi beats, ambient textures, acoustic piano, and custom MP3 uploads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Upload className="w-4 h-4 text-primary-600" />}
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
            className="shadow-sm border-dashed hover:border-primary-500 hover:text-primary-600 transition-colors"
            title="Upload custom MP3 audio files to your library"
          >
            Upload MP3
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowUploadZone((prev) => !prev)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showUploadZone ? 'Hide Dropzone' : 'Drag & Drop'}
          </Button>

          <Link to="/app/focus">
            <Button
              size="sm"
              leftIcon={<Timer className="w-4 h-4" />}
              className="shadow-sm"
            >
              Launch Focus Timer
            </Button>
          </Link>
        </div>
      </div>

      {/* Upload/System Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <Info className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span className="truncate">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:opacity-75 transition-opacity"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && !notification && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Dropzone / Upload Area */}
      {(showUploadZone || isDragOver) && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 select-none ${
            isDragOver
              ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/50 ring-4 ring-primary-500/20 scale-[1.005]'
              : 'border-border/80 hover:border-primary-400 bg-card/60 hover:bg-muted/30'
          }`}
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/80 text-primary-600 flex items-center justify-center mx-auto shadow-sm">
              <UploadCloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Drag & drop your wished MP3 files here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Or click to browse from your device. Supported: <strong className="text-foreground">.mp3</strong>, <strong className="text-foreground">.wav</strong>, <strong className="text-foreground">.m4a</strong>, <strong className="text-foreground">.ogg</strong>
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Badge variant="default" size="sm">
                Stored Locally in Browser
              </Badge>
              <Badge variant="info" size="sm">
                Offline Playable
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Main Player Card */}
      {currentTrack && (
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-card via-card to-primary-50/30 dark:to-primary-950/20 border-border overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Visualizer Artwork */}
            <div className="md:col-span-4 flex flex-col items-center justify-center">
              <div
                className={`w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-br from-primary-500 to-indigo-600 shadow-xl flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                  isPlaying ? 'scale-105 shadow-primary-500/25 ring-4 ring-primary-500/20' : 'opacity-90'
                }`}
              >
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <div className={`flex items-end gap-1.5 h-16 ${isPlaying ? 'opacity-100' : 'opacity-40'}`}>
                    <span className={`w-1.5 bg-white rounded-full ${isPlaying ? 'animate-bounce' : 'h-4'}`} style={{ animationDuration: '0.6s' }} />
                    <span className={`w-1.5 bg-white rounded-full ${isPlaying ? 'animate-bounce' : 'h-8'}`} style={{ animationDuration: '0.9s' }} />
                    <span className={`w-1.5 bg-white rounded-full ${isPlaying ? 'animate-bounce' : 'h-14'}`} style={{ animationDuration: '0.7s' }} />
                    <span className={`w-1.5 bg-white rounded-full ${isPlaying ? 'animate-bounce' : 'h-10'}`} style={{ animationDuration: '0.8s' }} />
                    <span className={`w-1.5 bg-white rounded-full ${isPlaying ? 'animate-bounce' : 'h-6'}`} style={{ animationDuration: '1.1s' }} />
                  </div>
                </div>
                {currentTrack.isCustom ? (
                  <FileAudio className="w-12 h-12 text-white/40 absolute -bottom-2 -right-2" />
                ) : (
                  <Music2 className="w-12 h-12 text-white/40 absolute -bottom-2 -right-2" />
                )}
              </div>
            </div>

            {/* Playback Controls & Info */}
            <div className="md:col-span-8 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={currentTrack.isCustom ? 'success' : 'info'} size="sm">
                    {currentTrack.categoryLabel}
                  </Badge>
                  {currentTrack.isCustom && (
                    <Badge variant="default" size="sm">
                      Custom MP3
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>

              {/* Seek Bar */}
              <div className="space-y-1.5">
                <div
                  className="h-2 bg-muted rounded-full cursor-pointer relative overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percent = clickX / rect.width;
                    seek(percent * duration);
                  }}
                >
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Primary Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 rounded-xl transition-colors ${
                      isShuffle
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/60'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Toggle Shuffle"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={prevTrack}
                    className="p-2.5 rounded-xl text-foreground hover:bg-muted transition-colors"
                    title="Previous Track"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-primary-600/30"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>

                  <button
                    onClick={nextTrack}
                    className="p-2.5 rounded-xl text-foreground hover:bg-muted transition-colors"
                    title="Next Track"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  <button
                    onClick={toggleRepeat}
                    className={`p-2 rounded-xl transition-colors ${
                      isRepeat
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/60'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Toggle Repeat"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-2.5 bg-muted/50 px-3 py-2 rounded-xl border border-border">
                  <button
                    onClick={toggleMute}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-24 h-1.5 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <span className="text-[11px] font-mono text-muted-foreground w-7 text-right">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isCategorySelected = activeCategory === cat.id;
          const count = cat.id === 'custom' ? customTracks.length : undefined;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isCategorySelected
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border hover:bg-muted'
              }`}
            >
              <span>{cat.label}</span>
              {typeof count === 'number' && count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isCategorySelected
                      ? 'bg-white/20 text-white'
                      : 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty State for Custom Uploads */}
      {activeCategory === 'custom' && filteredTracks.length === 0 && (
        <Card className="p-8 sm:p-12 text-center border-dashed border-2 border-border/80 bg-card/40">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center mx-auto shadow-sm">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                No custom MP3 files uploaded yet
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Add your favorite study soundtracks, lo-fi beats, classical audio, or lecture recordings. They are saved directly in your browser and ready to play anytime.
              </p>
            </div>
            <Button
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
              className="shadow-sm"
            >
              Choose MP3 File
            </Button>
          </div>
        </Card>
      )}

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTracks.map((track) => {
          const isSelected = currentTrack?.id === track.id;
          const isTrackPlaying = isSelected && isPlaying;

          return (
            <div
              key={track.id}
              onClick={() => playTrack(track)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 group relative ${
                isSelected
                  ? 'bg-primary-50/70 dark:bg-primary-950/40 border-primary-300 dark:border-primary-800 shadow-sm'
                  : 'bg-card border-border hover:border-primary-200 dark:hover:border-primary-800/60 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                    isTrackPlaying
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isTrackPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {track.title}
                    </p>
                    {track.isCustom && (
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 shrink-0">
                        MP3
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {track.artist}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-muted-foreground">
                    {formatTime(track.duration)}
                  </span>
                  <span className="block text-[10px] text-primary-600 dark:text-primary-400 capitalize">
                    {track.isCustom ? 'My Upload' : track.category}
                  </span>
                </div>

                {track.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomTrack(track.id);
                      setNotification({
                        message: `Removed "${track.title}" from your library.`,
                        type: 'success',
                      });
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors opacity-80 group-hover:opacity-100"
                    title="Delete uploaded MP3"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Science & Study Tips Card */}
      <Card className="p-5 border-border bg-muted/40">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground text-sm">
              The Cognitive Science of Study Music & Custom Audio
            </p>
            <p>
              • <strong>Custom Audio Flexibility:</strong> Uploading your own favorite instrumental playlists, binaural beats, or white noise tracks allows you to tailor your sonic environment to your personalized focus groove.
            </p>
            <p>
              • <strong>Lo-Fi & Downtempo:</strong> Repetitive 60–90 BPM rhythms engage the brain's default mode network and dampen external auditory distractions without demanding cognitive focus.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
