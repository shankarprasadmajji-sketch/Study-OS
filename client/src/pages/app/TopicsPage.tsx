import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListTodo,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Play,
  RotateCcw,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Topic, Subject } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const TopicsPage: React.FC = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'pending' | 'completed' | 'all'
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState<'priority' | 'deadline' | 'duration' | 'title'>('priority');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
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
        apiRequest<{ topics: any[] }>('/topics'),
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

  const openEditModal = (t: any) => {
    setEditingTopic(t);
    setFormData({
      subjectId: t.subjectId,
      title: t.title,
      description: t.description || '',
      difficulty: t.difficulty,
      importance: t.importance,
      estimatedMinutes: t.estimatedMinutes,
      status: t.status,
      prerequisiteTopicIds: t.prerequisiteTopicIds || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (topicId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete topic "${title}"?`)) return;
    try {
      await apiRequest(`/topics/${topicId}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleMarkCompleted = async (topicId: string) => {
    try {
      await apiRequest(`/topics/${topicId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ actualMinutes: 60 }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to mark topic completed');
    }
  };

  const handleReopenTopic = async (topicId: string) => {
    try {
      await apiRequest(`/topics/${topicId}/reopen`, {
        method: 'POST',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen topic');
    }
  };

  // Metrics Calculations
  const totalTopics = topics.length;
  const completedTopicsList = topics.filter((t) => t.status === 'completed');
  const pendingTopicsList = topics.filter((t) => t.status !== 'completed');

  const now = new Date();
  const overdueTopicsList = pendingTopicsList.filter((t) => {
    if (!t.examDate) return false;
    return new Date(t.examDate).getTime() < now.getTime();
  });

  const completionPercent =
    totalTopics > 0 ? Math.round((completedTopicsList.length / totalTopics) * 100) : 0;

  // Filter list by active tab and search
  let displayedTopics =
    activeTab === 'completed'
      ? completedTopicsList
      : activeTab === 'pending'
      ? pendingTopicsList
      : topics;

  if (selectedSubject !== 'all') {
    displayedTopics = displayedTopics.filter((t) => t.subjectId === selectedSubject);
  }
  if (selectedDifficulty !== 'all') {
    displayedTopics = displayedTopics.filter((t) => t.difficulty === selectedDifficulty);
  }
  if (search.trim()) {
    const s = search.toLowerCase();
    displayedTopics = displayedTopics.filter(
      (t) =>
        t.title.toLowerCase().includes(s) ||
        t.subjectName?.toLowerCase().includes(s) ||
        (t.description && t.description.toLowerCase().includes(s))
    );
  }

  // Sorting
  displayedTopics = [...displayedTopics].sort((a, b) => {
    if (sortBy === 'deadline') {
      if (a.examDate && b.examDate) return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
      if (a.examDate) return -1;
      if (b.examDate) return 1;
    }
    if (sortBy === 'duration') {
      return (b.estimatedMinutes || 60) - (a.estimatedMinutes || 60);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    // Default 'priority': importance * 10 - position
    const prioA = (a.importance || 3) * 10 - (a.position || 0);
    const prioB = (b.importance || 3) * 10 - (b.position || 0);
    return prioB - prioA;
  });

  // Group completed topics by subject when on 'completed' tab
  const groupedCompleted = new Map<string, any[]>();
  if (activeTab === 'completed') {
    displayedTopics.forEach((t) => {
      const key = t.subjectName || 'General Subject';
      const arr = groupedCompleted.get(key) || [];
      arr.push(t);
      groupedCompleted.set(key, arr);
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ListTodo className="w-6 h-6 text-primary-600" />
            Curriculum Topics & Coverage
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track finished modules, launch study sessions on pending topics, and manage exam deadlines.
          </p>
        </div>

        <Button
          size="sm"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          Add Topic
        </Button>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="p-3.5 border-border">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">Total Topics</span>
          <p className="text-2xl font-bold text-foreground mt-1">{totalTopics}</p>
          <span className="text-[10px] text-muted-foreground">In syllabus</span>
        </Card>

        <Card className="p-3.5 border-border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Completed</span>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mt-1">
            {completedTopicsList.length}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Milestones achieved</span>
        </Card>

        <Card className="p-3.5 border-border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase">Pending</span>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-200 mt-1">
            {pendingTopicsList.length}
          </p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">Awaiting study</span>
        </Card>

        <Card className="p-3.5 border-border bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900">
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 uppercase">Overdue</span>
          <p className="text-2xl font-bold text-rose-800 dark:text-rose-200 mt-1">
            {overdueTopicsList.length}
          </p>
          <span className="text-[10px] text-rose-600 dark:text-rose-400">Exam date passed</span>
        </Card>

        <Card className="p-3.5 border-border bg-primary-50/40 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900">
          <span className="text-[11px] font-semibold text-primary-700 dark:text-primary-300 uppercase">Progress</span>
          <p className="text-2xl font-bold text-primary-800 dark:text-primary-200 mt-1">
            {totalTopics > 0 ? `${completionPercent}%` : 'No topics'}
          </p>
          <span className="text-[10px] text-primary-600 dark:text-primary-400">Syllabus coverage</span>
        </Card>
      </div>

      {/* Segmented Tabs & Filters Bar */}
      <Card className="p-4 border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl self-start">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pending'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pending Topics ({pendingTopicsList.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'completed'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Completed Topics ({completedTopicsList.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Topics ({totalTopics})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none"
          >
            <option value="priority">Sort by Priority (Importance)</option>
            <option value="deadline">Sort by Exam Deadline</option>
            <option value="duration">Sort by Estimated Duration</option>
            <option value="title">Sort by Title (A-Z)</option>
          </select>
        </div>
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading curriculum topics...</div>
      ) : displayedTopics.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="w-8 h-8" />}
          title={
            activeTab === 'completed'
              ? 'No topics completed yet'
              : 'No pending topics found'
          }
          description="Add curriculum topics to build a complete academic study plan."
          actionLabel="Add New Topic"
          onAction={openCreateModal}
        />
      ) : activeTab === 'completed' ? (
        /* Grouped Completed View */
        <div className="space-y-6">
          {Array.from(groupedCompleted.entries()).map(([subjName, subjTopics]) => (
            <div key={subjName} className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: subjTopics[0]?.subjectColor || '#4f46e5' }}
                />
                {subjName} ({subjTopics.length} completed)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {subjTopics.map((topic) => (
                  <Card
                    key={topic._id}
                    className="p-4 border-border hover:border-emerald-300 dark:hover:border-emerald-800 transition-all bg-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                            {topic.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {topic.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>

                      <Badge variant="success" size="sm" className="shrink-0">
                        Completed
                      </Badge>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <span>Est: {topic.estimatedMinutes}m</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/app/notes`)}
                          className="p-1 text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1"
                          title="View topic notes"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Notes</span>
                        </button>

                        <button
                          onClick={() => handleReopenTopic(topic._id)}
                          className="px-2 py-1 text-[11px] font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg flex items-center gap-1"
                          title="Reopen topic to pending"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reopen</span>
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Pending / All Topics Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedTopics.map((topic) => {
            const isCompleted = topic.status === 'completed';
            const isOverdue =
              !isCompleted && topic.examDate && new Date(topic.examDate).getTime() < now.getTime();

            return (
              <Card
                key={topic._id}
                className={`p-4 border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-200 dark:border-emerald-900 bg-card'
                    : isOverdue
                    ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10'
                    : 'border-border hover:border-primary-300 dark:hover:border-primary-800 bg-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-white uppercase tracking-wider"
                      style={{ backgroundColor: topic.subjectColor || '#4f46e5' }}
                    >
                      {topic.subjectName || 'Subject'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isOverdue && (
                        <Badge variant="danger" size="sm" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Overdue</span>
                        </Badge>
                      )}
                      <Badge
                        variant={
                          topic.difficulty === 'hard'
                            ? 'danger'
                            : topic.difficulty === 'medium'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {topic.difficulty}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-foreground line-clamp-1 mb-1">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                    {topic.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {topic.estimatedMinutes}m
                    </span>
                    {topic.examDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Exam: {new Date(topic.examDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {!isCompleted ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkCompleted(topic._id)}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          className="flex-1 text-[11px]"
                        >
                          Mark Done
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => navigate('/app/focus')}
                          leftIcon={<Play className="w-3.5 h-3.5" />}
                          className="flex-1 text-[11px]"
                        >
                          Study Now
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReopenTopic(topic._id)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-500" />}
                        className="w-full text-[11px]"
                      >
                        Reopen Topic
                      </Button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(topic)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
                        title="Edit Topic"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(topic._id, topic.title)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                        title="Delete Topic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Topic Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTopic ? 'Edit Topic' : 'Add New Topic'}
        description="Configure topic title, duration, difficulty, and prerequisites"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Select Subject *
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              required
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Topic Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dynamic Programming: Knapsack"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Key concepts, algorithms, subtopics, or textbook chapters..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Estimated Minutes
              </label>
              <input
                type="number"
                min="10"
                max="720"
                value={formData.estimatedMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value, 10) || 60 })
                }
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
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
