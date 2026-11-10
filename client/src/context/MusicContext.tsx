import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MusicTrack, STUDY_TRACKS, CATEGORIES } from '../data/musicTracks.js';
import { useAuth } from './AuthContext.js';
import { soundSynthesizer } from '../services/soundSynthesizer.js';
import {
  loadStoredCustomTracks,
  saveUploadedTrack,
  deleteStoredCustomTrack,
  updateStoredTrackCategory,
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
  uploadTrack: (file: File, categoryId?: string) => Promise<MusicTrack>;
  updateCategory: (id: string, categoryId: string) => Promise<void>;
  deleteCustomTrack: (id: string) => Promise<void>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id || user?.email || '';

  const [customTracks, setCustomTracks] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Restore user-specific uploaded tracks when logged-in user changes
  useEffect(() => {
    if (!userId) {
      setCustomTracks([]);
      setCurrentTrack(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      soundSynthesizer.stop();
      return;
    }

    loadStoredCustomTracks(userId)
      .then((loaded) => {
        if (loaded && loaded.length > 0) {
          setCustomTracks(loaded);
          setCurrentTrack(loaded[0]);
          setDuration(loaded[0].duration || 0);
          setIsPlaying(false);
        } else {
          setCustomTracks([]);
          setCurrentTrack(null);
          setDuration(0);
          setIsPlaying(false);
        }
      })
      .catch((err) => {
        console.warn('[Study Music] Error restoring saved custom tracks:', err);
      });
  }, [userId]);

  // All tracks come strictly from user uploads (all demo/fake songs removed)
  const allTracks = [...customTracks, ...STUDY_TRACKS];

  const filteredTracks =
    activeCategory === 'all' || activeCategory === 'custom'
      ? customTracks
      : customTracks.filter((t) => t.category === activeCategory);

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
      if (!currentTrack) return;
      console.warn('[Study Music] Audio stream unavailable for selected file.');
      setError('Audio file unavailable or unsupported format.');
      setIsPlaying(false);
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

  // Handle play
  const playTrack = (track: MusicTrack) => {
    setError(null);
    setCurrentTrack(track);
    soundSynthesizer.stop();

    const audio = audioRef.current;
    if (!audio) return;

    if (!track.audioUrl) {
      setError('No audio source found for this track.');
      setIsPlaying(false);
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
        console.warn('[Study Music] Playback blocked or file invalid:', err?.message || err);
        setError('Unable to play audio. Please click play or re-upload the file.');
        setIsPlaying(false);
      });
  };

  const togglePlay = () => {
    if (!currentTrack) {
      if (allTracks.length > 0) {
        playTrack(allTracks[0]);
      }
      return; // Do nothing if library is empty — never play fake songs or sample audio
    }

    if (isPlaying) {
      audioRef.current?.pause();
      soundSynthesizer.stop();
      setIsPlaying(false);
    } else {
      if (audioRef.current && audioRef.current.src) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            setError('Could not resume playback.');
            setIsPlaying(false);
          });
      } else {
        playTrack(currentTrack);
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

  const uploadTrack = async (file: File, categoryId?: string): Promise<MusicTrack> => {
    setIsUploading(true);
    setError(null);
    try {
      const chosenCategory = categoryId || (activeCategory !== 'all' ? activeCategory : 'custom');
      const newTrack = await saveUploadedTrack(file, userId || 'anonymous', chosenCategory);
      setCustomTracks((prev) => [newTrack, ...prev.filter((t) => t.id !== newTrack.id)]);
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

  const updateCategory = async (id: string, categoryId: string): Promise<void> => {
    const catObj = CATEGORIES.find((c) => c.id === categoryId);
    const categoryLabel = catObj ? catObj.label : 'My Uploads';

    setCustomTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category: categoryId, categoryLabel } : t))
    );
    if (currentTrack?.id === id) {
      setCurrentTrack((prev) => (prev ? { ...prev, category: categoryId, categoryLabel } : null));
    }
    await updateStoredTrackCategory(id, categoryId, categoryLabel);
  };

  const deleteCustomTrack = async (id: string): Promise<void> => {
    try {
      await deleteStoredCustomTrack(id);
      const remaining = customTracks.filter((t) => t.id !== id);
      setCustomTracks(remaining);
      if (currentTrack?.id === id) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setIsPlaying(false);
        if (remaining.length > 0) {
          setCurrentTrack(remaining[0]);
          setDuration(remaining[0].duration || 0);
        } else {
          setCurrentTrack(null);
          setDuration(0);
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
        updateCategory,
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
