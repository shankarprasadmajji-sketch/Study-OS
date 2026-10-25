import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Trash2,
  Edit,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Subject, Topic } from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const SubjectDetailPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Form state
  const [formData, setFormData] = useState({
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
      const res = await apiRequest<{ subject: Subject; topics: Topic[] }>(`/subjects/${subjectId}`);
      setSubject(res.subject);
      setTopics(res.topics || []);
    } catch (err) {
      console.error('Failed to load subject details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjectId) fetchData();
  }, [subjectId]);

  const openCreateModal = () => {
    setEditingTopic(null);
    setFormData({
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
    if (!formData.title.trim() || !subjectId) return;

    try {
      if (editingTopic) {
        await apiRequest(`/topics/${editingTopic._id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
      } else {
        await apiRequest('/topics', {
          method: 'POST',
          body: JSON.stringify({
            subjectId,
            ...formData,
          }),
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
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteTopic = async (topicId: string, title: string) => {
    if (!window.confirm(`Delete topic "${title}"?`)) return;
    try {
      await apiRequest(`/topics/${topicId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete topic:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Subject not found.</p>
        <Link to="/app/subjects" className="text-xs text-primary-600 hover:underline mt-2 inline-block">
          ← Back to subjects
        </Link>
      </div>
    );
  }

  const completedCount = topics.filter((t) => t.status === 'completed').length;
  const totalMinutes = topics.reduce((acc, t) => acc + (t.estimatedMinutes || 60), 0);
  const percent = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Navigation Back */}
      <Link
        to="/app/subjects"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Subjects</span>
      </Link>

      {/* Subject Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-4 h-12 rounded-full shrink-0 mt-0.5"
              style={{ backgroundColor: subject.color || '#4f46e5' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{subject.name}</h2>
                {subject.code && <Badge size="sm">{subject.code}</Badge>}
                <Badge variant="info" size="sm">Importance {subject.importance}/5</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                {subject.description || 'No description provided for this course.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-xs font-semibold text-foreground">
                {subject.examDate ? new Date(subject.examDate).toLocaleDateString() : 'No exam set'}
              </span>
              <p className="text-[11px] text-muted-foreground">Exam Date</p>
            </div>
            <Button onClick={openCreateModal} size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add Topic
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-border">
          <div>
            <span className="text-[11px] text-muted-foreground">Syllabus Progress</span>
            <p className="text-base font-bold text-foreground mt-0.5">
              {completedCount} / {topics.length} Topics ({percent}%)
            </p>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground">Total Study Estimate</span>
            <p className="text-base font-bold text-foreground mt-0.5">
              {(totalMinutes / 60).toFixed(1)} Hours ({totalMinutes} mins)
            </p>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground">Remaining Workload</span>
            <p className="text-base font-bold text-foreground mt-0.5">
              {topics.length - completedCount} Topics Pending
            </p>
          </div>
        </div>
      </Card>

      {/* Syllabus Topics Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Syllabus Breakdown</CardTitle>
            <CardDescription>Topics ordered by course sequence and prerequisites</CardDescription>
          </div>
          <Button onClick={openCreateModal} variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Topic
          </Button>
        </CardHeader>

        {topics.length === 0 ? (
          <EmptyState
            icon={<ListTodo className="w-6 h-6" />}
            title="No Topics in this Course"
            description="Break down this subject into individual chapters or lecture modules to enable schedule generation."
            actionLabel="Add Topic"
            onAction={openCreateModal}
          />
        ) : (
          <div className="space-y-3">
            {topics.map((topic, idx) => {
              const isCompleted = topic.status === 'completed';
              const isInProgress = topic.status === 'in_progress';

              return (
                <div
                  key={topic._id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                      : isInProgress
                      ? 'bg-amber-50/40 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
                      : 'bg-card border-border hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {idx + 1}. {topic.title}
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
                        <Badge
                          size="sm"
                          variant={
                            isCompleted
                              ? 'success'
                              : isInProgress
                              ? 'warning'
                              : 'outline'
                          }
                        >
                          {topic.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      {topic.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                          {topic.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Est. {topic.estimatedMinutes} mins
                        </span>
                        <span>• Importance {topic.importance}/5</span>
                        {topic.prerequisiteTopicIds && topic.prerequisiteTopicIds.length > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            • {topic.prerequisiteTopicIds.length} prerequisite(s)
                          </span>
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
                      onClick={() => handleDeleteTopic(topic._id, topic.title)}
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
        title={editingTopic ? 'Edit Syllabus Topic' : 'Add Topic to Syllabus'}
        description={`For course: ${subject.name}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Topic Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ford-Fulkerson Max Flow Algorithm"
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
                <option value="easy">Easy (Low Complexity)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="hard">Hard (Complex / Deep Proofs)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Estimated Minutes (10 - 720)
              </label>
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
                <option value="1">1 - Minor concept</option>
                <option value="2">2 - Background</option>
                <option value="3">3 - Standard exam topic</option>
                <option value="4">4 - High weight</option>
                <option value="5">5 - Critical / Core chapter</option>
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

          {/* Prerequisite Topics Selector */}
          {topics.length > 0 && (
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Prerequisite Topics (Must be studied before this topic)
              </label>
              <select
                multiple
                value={formData.prerequisiteTopicIds}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                  setFormData({ ...formData, prerequisiteTopicIds: selected });
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500 min-h-[70px]"
              >
                {topics
                  .filter((t) => !editingTopic || t._id !== editingTopic._id)
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} ({t.difficulty})
                    </option>
                  ))}
              </select>
              <span className="text-[10px] text-muted-foreground">
                Hold Ctrl (Cmd) to select multiple prerequisites.
              </span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-foreground mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="Key formula, chapter reference, or practice problems..."
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
              {editingTopic ? 'Save Changes' : 'Add Topic'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
