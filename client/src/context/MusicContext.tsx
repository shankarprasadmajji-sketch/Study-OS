import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MusicTrack, STUDY_TRACKS } from '../data/musicTracks.js';
import { soundSynthesizer } from '../services/soundSynthesizer.js';

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
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredTracks =
    activeCategory === 'all'
      ? STUDY_TRACKS
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
      console.warn('[Study Music] Network stream error. Switching to calm ambient synthesizer.');
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
  }, [isRepeat]);

  // Handle play/pause
  const playTrack = (track: MusicTrack) => {
    setError(null);
    setCurrentTrack(track);
    soundSynthesizer.stop();

    const audio = audioRef.current;
    if (!audio) return;

    // Check if it's a pure synthesized sound (e.g. white or pink noise)
    if (track.category === 'whitenoise' || !track.audioUrl) {
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
        console.warn('[Study Music] Autoplay blocked or URL unavailable:', err.message);
        // Fallback to binaural synthesizer
        soundSynthesizer.playBinauralFocus();
        setIsPlaying(true);
      });
  };

  const togglePlay = () => {
    if (!currentTrack) {
      if (STUDY_TRACKS.length > 0) playTrack(STUDY_TRACKS[0]);
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      soundSynthesizer.stop();
      setIsPlaying(false);
    } else {
      if (currentTrack.category === 'whitenoise' || !currentTrack.audioUrl) {
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
    const list = filteredTracks.length > 0 ? filteredTracks : STUDY_TRACKS;
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * list.length);
      playTrack(list[randomIndex]);
      return;
    }
    const currentIndex = list.findIndex((t) => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % list.length;
    playTrack(list[nextIndex]);
  };

  const handlePrev = () => {
    const list = filteredTracks.length > 0 ? filteredTracks : STUDY_TRACKS;
    const currentIndex = list.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
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
        allTracks: STUDY_TRACKS,
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
