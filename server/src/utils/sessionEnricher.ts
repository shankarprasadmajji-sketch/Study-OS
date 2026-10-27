import { dataStore } from '../services/dataStore.js';

export async function enrichStudySessions(sessions: any[], userId: string): Promise<any[]> {
  if (!sessions || sessions.length === 0) return [];

  const subjects = await dataStore.findSubjectsByUserId(userId);
  const topics = await dataStore.findTopicsByUserId(userId);

  const subjectMap = new Map<string, any>();
  subjects.forEach((s) => subjectMap.set(s._id ? s._id.toString() : s.id, s));

  const topicMap = new Map<string, any>();
  topics.forEach((t) => topicMap.set(t._id ? t._id.toString() : t.id, t));

  return sessions.map((sess) => {
    const raw = typeof sess.toJSON === 'function' ? sess.toJSON() : { ...sess };
    const subjId = raw.subjectId ? raw.subjectId.toString() : '';
    const topId = raw.topicId ? raw.topicId.toString() : '';
    const subj = subjectMap.get(subjId);
    const top = topicMap.get(topId);

    return {
      ...raw,
      subjectName: subj?.name || raw.subjectName || 'General Subject',
      subjectColor: subj?.color || raw.subjectColor || '#4f46e5',
      topicTitle: top?.title || raw.topicTitle || raw.title || 'Study Session',
      topicDifficulty: top?.difficulty || raw.topicDifficulty || 'medium',
    };
  });
}
