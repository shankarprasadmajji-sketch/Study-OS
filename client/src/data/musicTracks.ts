export interface MusicTrack {
  id: string;
  userId?: string;
  title: string;
  artist: string;
  category: string;
  categoryLabel: string;
  duration: number; // in seconds
  audioUrl: string;
  coverUrl?: string;
  synthType?: 'rain' | 'waves' | 'whitenoise' | 'pinknoise' | 'binaural';
  isCustom?: boolean;
}

export const CATEGORIES = [
  { id: 'all', label: 'All Tracks' },
  { id: 'custom', label: 'My Uploads' },
  { id: 'lofi', label: 'Lo-Fi Study Beats' },
  { id: 'piano', label: 'Calm Piano' },
  { id: 'ambient', label: 'Deep Focus Ambient' },
  { id: 'instrumental', label: 'Classical & Acoustic' },
  { id: 'nature', label: 'Rain & Forest Sounds' },
  { id: 'whitenoise', label: 'White & Pink Noise' },
] as const;

// All built-in/demo songs removed. Music library starts completely empty for every user.
export const STUDY_TRACKS: MusicTrack[] = [];
