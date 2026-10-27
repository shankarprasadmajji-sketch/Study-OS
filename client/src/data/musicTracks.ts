export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: 'lofi' | 'instrumental' | 'piano' | 'ambient' | 'nature' | 'whitenoise' | 'custom';
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

// High-quality public domain and royalty-free study audio streams
export const STUDY_TRACKS: MusicTrack[] = [
  // Lo-fi Beats
  {
    id: 'lofi-1',
    title: 'Midnight Coffee & Homework',
    artist: 'ChillHop Scholar',
    category: 'lofi',
    categoryLabel: 'Lo-Fi Study Beats',
    duration: 184,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    synthType: 'binaural',
  },
  {
    id: 'lofi-2',
    title: 'Autumn Rain Study Session',
    artist: 'StudyOS Beats',
    category: 'lofi',
    categoryLabel: 'Lo-Fi Study Beats',
    duration: 162,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3',
    synthType: 'binaural',
  },
  {
    id: 'lofi-3',
    title: 'Library Reverie',
    artist: 'Tokyo Lo-fi Collective',
    category: 'lofi',
    categoryLabel: 'Lo-Fi Study Beats',
    duration: 198,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-chill-medium-version-20915.mp3',
    synthType: 'binaural',
  },

  // Calm Piano
  {
    id: 'piano-1',
    title: 'Nocturne for Problem Solvers',
    artist: 'Elena Rostova',
    category: 'piano',
    categoryLabel: 'Calm Piano',
    duration: 215,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c93a0273a9.mp3?filename=relaxing-piano-music-24891.mp3',
    synthType: 'binaural',
  },
  {
    id: 'piano-2',
    title: 'Flow State Keys',
    artist: 'Clara Schumann Ensemble',
    category: 'piano',
    categoryLabel: 'Calm Piano',
    duration: 178,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc8c495cb2.mp3?filename=gentle-piano-10700.mp3',
    synthType: 'binaural',
  },

  // Deep Focus Ambient
  {
    id: 'ambient-1',
    title: 'Deep Theta Waves (432Hz)',
    artist: 'Binaural Focus Lab',
    category: 'ambient',
    categoryLabel: 'Deep Focus Ambient',
    duration: 300,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_731464303b.mp3?filename=meditation-impromptu-01-3806.mp3',
    synthType: 'binaural',
  },
  {
    id: 'ambient-2',
    title: 'Atmospheric Thinking',
    artist: 'Ambient Mind',
    category: 'ambient',
    categoryLabel: 'Deep Focus Ambient',
    duration: 240,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3527e30ec.mp3?filename=ambient-piano-amp-strings-10711.mp3',
    synthType: 'binaural',
  },

  // Instrumental & Classical
  {
    id: 'inst-1',
    title: 'Acoustic Clarity',
    artist: 'Julian Ward',
    category: 'instrumental',
    categoryLabel: 'Classical & Acoustic',
    duration: 190,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=acoustic-guitar-ambient-116035.mp3',
    synthType: 'binaural',
  },

  // Rain & Nature Sounds
  {
    id: 'nature-1',
    title: 'Gentle Window Rainstorm',
    artist: 'Natural Ambience',
    category: 'nature',
    categoryLabel: 'Rain & Forest Sounds',
    duration: 360,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_8b0561e737.mp3?filename=rain-and-thunder-nature-sounds-7803.mp3',
    synthType: 'rain',
  },
  {
    id: 'nature-2',
    title: 'Ocean Waves for Deep Reading',
    artist: 'Coastline Audio',
    category: 'nature',
    categoryLabel: 'Rain & Forest Sounds',
    duration: 320,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_3d6411f17e.mp3?filename=waves-nature-sound-21784.mp3',
    synthType: 'waves',
  },

  // White & Pink Noise
  {
    id: 'noise-1',
    title: 'Pure White Noise Focus',
    artist: 'StudyOS Noise Lab',
    category: 'whitenoise',
    categoryLabel: 'White & Pink Noise',
    duration: 300,
    audioUrl: '', // Uses Web Audio synthesizer directly
    synthType: 'whitenoise',
  },
  {
    id: 'noise-2',
    title: 'Warm Pink Noise Relaxation',
    artist: 'StudyOS Noise Lab',
    category: 'whitenoise',
    categoryLabel: 'White & Pink Noise',
    duration: 300,
    audioUrl: '', // Uses Web Audio synthesizer directly
    synthType: 'pinknoise',
  },
];
