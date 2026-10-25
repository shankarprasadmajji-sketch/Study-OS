import React, { useEffect, useState } from 'react';
import {
  ListTodo,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  BookOpen,
} from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Topic, Subject } from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const TopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    title: '',
    description: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    importance: 3,
    estimatedMinutes: 60,
    status: 'not_started' as 'not_started' | 'in_progress' | 'completed',
    prerequisiteTopicIds: [] as string[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topRes, subjRes] = await Promise.all([
        apiRequest<{ topics: Topic[] }>('/topics'),
        apiRequest<{ subjects: Subject[] }>('/subjects'),
      ]);
      setTopics(topRes.topics || []);
      setSubjects(subjRes.subjects || []);
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingTopic(null);
    setFormData({
      subjectId: subjects[0]?._id || '',
      title: '',
      description: '',
      difficulty: 'medium',
      importance: 3,
      estimatedMinutes: 60,
      status: 'not_started',
      prerequisiteTopicIds: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Topic) => {
    setEditingTopic(t);
    setFormData({
      subjectId: t.subjectId,
      title: t.title,
      description: t.description || '',
      difficulty: t.difficulty,
      importance: t.importance,
      estimatedMinutes: t.estimatedMinutes,
      status: t.status,
      prerequisiteTopicIds: (t.prerequisiteTopicIds || []).map((p: any) => p.toString()),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.subjectId) return;

    try {
      if (editingTopic) {
        await apiRequest(`/topics/${editingTopic._id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
      } else {
        await apiRequest('/topics', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save topic:', err);
    }
  };

  const handleToggleStatus = async (topicId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'completed'
        ? 'not_started'
        : currentStatus === 'not_started'
        ? 'in_progress'
        : 'completed';

    try {
      await apiRequest(`/topics/${topicId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (topicId: string, title: string) => {
    if (!window.confirm(`Delete topic "${title}"?`)) return;
    try {
      await apiRequest(`/topics/${topicId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete topic:', err);
    }
  };

  const filteredTopics = topics.filter((t) => {
    if (selectedSubject !== 'all' && t.subjectId !== selectedSubject) return false;
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
    if (selectedDifficulty !== 'all' && t.difficulty !== selectedDifficulty) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.subjectName && t.subjectName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const completedCount = topics.filter((t) => t.status === 'completed').length;
  const inProgressCount = topics.filter((t) => t.status === 'in_progress').length;
  const notStartedCount = topics.filter((t) => t.status === 'not_started').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Syllabus Topics Catalog</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            View, filter, and track topic mastery across your entire semester
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add Topic
        </Button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground">Not Started</span>
          <p className="text-xl font-bold text-foreground mt-0.5">{notStartedCount}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">In Progress</span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{inProgressCount}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Completed</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{completedCount}</p>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by topic title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground"
        >
          <option value="all">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Topics List Card */}
      <Card>
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredTopics.length === 0 ? (
          <EmptyState
            icon={<ListTodo className="w-6 h-6" />}
            title="No Topics Match"
            description="Adjust your search filters or add a new topic to your syllabus."
            actionLabel="Add Topic"
            onAction={openCreateModal}
          />
        ) : (
          <div className="divide-y divide-border">
            {filteredTopics.map((topic) => {
              const isCompleted = topic.status === 'completed';
              const isInProgress = topic.status === 'in_progress';

              return (
                <div
                  key={topic._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleStatus(topic._id, topic.status)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-border hover:border-primary-500'
                      }`}
                      title="Click to toggle status"
                    >
                      {isCompleted && <CheckCircle2 className="w-4 h-4 fill-current" />}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {topic.title}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium"
                          style={{
                            backgroundColor: `${topic.subjectColor || '#4f46e5'}15`,
                            color: topic.subjectColor || '#4f46e5',
                          }}
                        >
                          {topic.subjectName}
                        </span>
                        <Badge
                          size="sm"
                          variant={
                            topic.difficulty === 'hard'
                              ? 'danger'
                              : topic.difficulty === 'medium'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {topic.difficulty}
                        </Badge>
                      </div>

                      {topic.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                          {topic.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Est. {topic.estimatedMinutes} mins
                        </span>
                        <span>• Importance {topic.importance}/5</span>
                        {topic.examDate && (
                          <span>• Exam: {new Date(topic.examDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(topic)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(topic._id, topic.title)}
                      className="p-1.5 text-muted-foreground hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add / Edit Topic Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTopic ? 'Edit Syllabus Topic' : 'Add New Topic'}
        description="Configure topic estimates, priority, and course assignment"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Subject / Course *</label>
            <select
              required
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
            >
              <option value="" disabled>Select a course</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code || 'Course'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Topic Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Asymptotic Analysis & Master Theorem"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Estimated Minutes</label>
              <input
                type="number"
                min="10"
                max="720"
                value={formData.estimatedMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedMinutes: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Importance (1 - 5)</label>
              <select
                value={formData.importance}
                onChange={(e) =>
                  setFormData({ ...formData, importance: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
              >
                <option value="1">1 - Low</option>
                <option value="2">2 - Standard</option>
                <option value="3">3 - Moderate</option>
                <option value="4">4 - High Weight</option>
                <option value="5">5 - Critical Exam Chapter</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="Lecture notes, textbook references, sample problem IDs..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {editingTopic ? 'Save Changes' : 'Create Topic'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
