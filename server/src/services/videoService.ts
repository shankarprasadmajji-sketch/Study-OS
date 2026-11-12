import { IVideoResource } from '../models/TopicLearningMaterial.js';

export const videoService = {
  /**
   * Search or curate educational YouTube video resources for a specific topic
   */
  async getTopicVideos(
    topicTitle: string,
    subjectName: string,
    existingVideos: IVideoResource[] = []
  ): Promise<IVideoResource[]> {
    // If student already has custom videos or saved videos for this topic, retain them
    if (existingVideos && existingVideos.length > 0) {
      return existingVideos;
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    const query = `${subjectName} ${topicTitle} lecture tutorial`;

    if (apiKey) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=4&q=${encodeURIComponent(
          query
        )}&type=video&videoEmbeddable=true&key=${apiKey}`;

        const res = await fetch(url);
        if (res.ok) {
          const data: any = await res.json();
          if (data.items && data.items.length > 0) {
            return data.items.map((item: any) => ({
              videoId: item.id?.videoId,
              title: item.snippet?.title || `${topicTitle} Video Lecture`,
              channel: item.snippet?.channelTitle || 'YouTube Educator',
              url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
              embedUrl: `https://www.youtube.com/embed/${item.id?.videoId}`,
              duration: 'Video Lecture',
              watched: false,
              watchedAt: null,
            }));
          }
        }
      } catch (err) {
        console.warn('[VideoService] YouTube API fetch failed, falling back to verified embed search:', err);
      }
    }

    // Default verified search embed format supported natively by YouTube iframe API:
    // https://www.youtube.com/embed?listType=search&list=QUERY
    const embedQuery = `${subjectName} ${topicTitle} full tutorial`;
    const safeSearchQuery = encodeURIComponent(`${subjectName} ${topicTitle} tutorial`);

    return [
      {
        videoId: 'search-primary',
        title: `${topicTitle} — Comprehensive Video Lecture & Walkthrough`,
        channel: 'Top Verified Educators (YouTube)',
        url: `https://www.youtube.com/results?search_query=${safeSearchQuery}`,
        embedUrl: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(embedQuery)}`,
        duration: 'Comprehensive',
        watched: false,
        watchedAt: null,
      },
      {
        videoId: 'search-khan',
        title: `${topicTitle} — Core Concepts & Solved Problems`,
        channel: 'Khan Academy & Academic Lectures',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${subjectName} ${topicTitle} khan academy`)}`,
        embedUrl: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(`${topicTitle} khan academy`)}`,
        duration: 'Conceptual Deep-Dive',
        watched: false,
        watchedAt: null,
      },
      {
        videoId: 'search-crashcourse',
        title: `${topicTitle} — Fast Revision & Key Points`,
        channel: 'CrashCourse / Rapid Revision',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topicTitle} crash course summary`)}`,
        embedUrl: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(`${topicTitle} quick revision`)}`,
        duration: 'Quick Summary',
        watched: false,
        watchedAt: null,
      },
    ];
  },

  /**
   * Helper to parse user-entered YouTube URL into a validated embed URL
   */
  parseYouTubeUrl(rawUrl: string): { videoId: string; embedUrl: string } | null {
    if (!rawUrl || typeof rawUrl !== 'string') return null;

    const trimmed = rawUrl.trim();
    // Match watch?v=ID or youtu.be/ID or embed/ID
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = trimmed.match(regExp);

    if (match && match[1]) {
      const videoId = match[1];
      return {
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
    return null;
  },
};

