import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MusicTrack, STUDY_TRACKS } from '../data/musicTracks.js';
import { soundSynthesizer } from '../services/soundSynthesizer.js';
import {
  loadStoredCustomTracks,
  saveUploadedTrack,
  deleteStoredCustomTrack,
} from '../services/musicStorage.js';

interface MusicContextType {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isRepeat: boolean;
  isShuffle: boolean;
  currentTime: number;
  duration: number;
  activeCategory: string;
  error: string | null;
  filteredTracks: MusicTrack[];
  allTracks: MusicTrack[];
  customTracks: MusicTrack[];
  isUploading: boolean;
  playTrack: (track: MusicTrack) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  setActiveCategory: (cat: string) => void;
  uploadTrack: (file: File) => Promise<MusicTrack>;
  deleteCustomTrack: (id: string) => Promise<void>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customTracks, setCustomTracks] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(STUDY_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(STUDY_TRACKS[0]?.duration || 180);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load custom tracks from IndexedDB on startup
  useEffect(() => {
    loadStoredCustomTracks()
      .then((loaded) => {
        if (loaded && loaded.length > 0) {
          setCustomTracks(loaded);
        }
      })
      .catch((err) => {
        console.warn('[Study Music] Error restoring saved custom tracks:', err);
      });
  }, []);

  const allTracks = [...customTracks, ...STUDY_TRACKS];

  const filteredTracks =
    activeCategory === 'all'
      ? allTracks
      : activeCategory === 'custom'
      ? customTracks
      : STUDY_TRACKS.filter((t) => t.category === activeCategory);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNext();
      }
    };

    const handleError = () => {
      console.warn('[Study Music] Network or audio playback error. Switching to calm ambient synthesizer.');
      setError('Audio stream unavailable. Playing synthesized ambient sound.');
      if (currentTrack?.synthType === 'whitenoise') {
        soundSynthesizer.playWhiteNoise();
      } else if (currentTrack?.synthType === 'pinknoise') {
        soundSynthesizer.playPinkNoise();
      } else {
        soundSynthesizer.playBinauralFocus();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      soundSynthesizer.stop();
    };
  }, [isRepeat, filteredTracks, currentTrack]);

  // Handle play/pause
  const playTrack = (track: MusicTrack) => {
    setError(null);
    setCurrentTrack(track);
    soundSynthesizer.stop();

    const audio = audioRef.current;
    if (!audio) return;

    // Check if it's a pure synthesized sound (e.g. white or pink noise)
    if (track.category === 'whitenoise' || (!track.audioUrl && track.synthType)) {
      audio.pause();
      audio.src = '';
      if (track.synthType === 'pinknoise') {
        soundSynthesizer.playPinkNoise();
      } else {
        soundSynthesizer.playWhiteNoise();
      }
      setIsPlaying(true);
      setDuration(track.duration);
      return;
    }

    audio.src = track.audioUrl;
    audio.currentTime = 0;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.warn('[Study Music] Autoplay blocked or URL unavailable:', err?.message || err);
        // Fallback to binaural synthesizer
        soundSynthesizer.playBinauralFocus();
        setIsPlaying(true);
      });
  };

  const togglePlay = () => {
    if (!currentTrack) {
      if (allTracks.length > 0) playTrack(allTracks[0]);
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      soundSynthesizer.stop();
      setIsPlaying(false);
    } else {
      if (currentTrack.category === 'whitenoise' || (!currentTrack.audioUrl && currentTrack.synthType)) {
        if (currentTrack.synthType === 'pinknoise') {
          soundSynthesizer.playPinkNoise();
        } else {
          soundSynthesizer.playWhiteNoise();
        }
        setIsPlaying(true);
      } else {
        if (audioRef.current && audioRef.current.src) {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {
              soundSynthesizer.playBinauralFocus();
              setIsPlaying(true);
            });
        } else {
          playTrack(currentTrack);
        }
      }
    }
  };

  const handleNext = () => {
    const list = filteredTracks.length > 0 ? filteredTracks : allTracks;
    if (list.length === 0) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * list.length);
      playTrack(list[randomIndex]);
      return;
    }
    const currentIndex = list.findIndex((t) => t.id === currentTrack?.id);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % list.length : 0;
    playTrack(list[nextIndex]);
  };

  const handlePrev = () => {
    const list = filteredTracks.length > 0 ? filteredTracks : allTracks;
    if (list.length === 0) return;

    const currentIndex = list.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = currentIndex >= 0 ? (currentIndex - 1 + list.length) % list.length : 0;
    playTrack(list[prevIndex]);
  };

  const seek = (seconds: number) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const setVolume = (vol: number) => {
    const safeVol = Math.max(0, Math.min(1, vol));
    setVolumeState(safeVol);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : safeVol;
    }
    soundSynthesizer.setVolume(isMuted ? 0 : safeVol);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
    soundSynthesizer.setVolume(nextMuted ? 0 : volume);
  };

  const uploadTrack = async (file: File): Promise<MusicTrack> => {
    setIsUploading(true);
    setError(null);
    try {
      const newTrack = await saveUploadedTrack(file);
      setCustomTracks((prev) => [newTrack, ...prev.filter((t) => t.id !== newTrack.id)]);
      setActiveCategory('custom');
      playTrack(newTrack);
      return newTrack;
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to process and upload audio file.';
      setError(errorMsg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteCustomTrack = async (id: string): Promise<void> => {
    try {
      await deleteStoredCustomTrack(id);
      setCustomTracks((prev) => prev.filter((t) => t.id !== id));
      if (currentTrack?.id === id) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setIsPlaying(false);
        const fallback = STUDY_TRACKS[0];
        if (fallback) {
          setCurrentTrack(fallback);
        }
      }
    } catch (err) {
      console.error('[Study Music] Error deleting track:', err);
      setError('Could not delete track from storage.');
    }
  };

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        isMuted,
        isRepeat,
        isShuffle,
        currentTime,
        duration,
        activeCategory,
        error,
        filteredTracks,
        allTracks,
        customTracks,
        isUploading,
        playTrack,
        togglePlay,
        nextTrack: handleNext,
        prevTrack: handlePrev,
        seek,
        setVolume,
        toggleMute,
        toggleRepeat: () => setIsRepeat((prev) => !prev),
        toggleShuffle: () => setIsShuffle((prev) => !prev),
        setActiveCategory,
        uploadTrack,
        deleteCustomTrack,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within a MusicProvider');
  return context;
};
