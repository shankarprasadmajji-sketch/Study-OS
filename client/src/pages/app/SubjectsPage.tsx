import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Calendar,
  MoreVertical,
  Trash2,
  Edit,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Subject } from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    examDate: '',
    importance: 3,
    color: '#4f46e5',
    description: '',
  });

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ subjects: Subject[] }>('/subjects');
      setSubjects(res.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      examDate: '',
      importance: 3,
      color: '#4f46e5',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Subject) => {
    setEditingSubject(s);
    setFormData({
      name: s.name,
      code: s.code || '',
      examDate: s.examDate ? new Date(s.examDate).toISOString().split('T')[0] : '',
      importance: s.importance || 3,
      color: s.color || '#4f46e5',
      description: s.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingSubject) {
        await apiRequest(`/subjects/${editingSubject._id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: formData.name,
            code: formData.code,
            examDate: formData.examDate || null,
            importance: Number(formData.importance),
            color: formData.color,
            description: formData.description,
          }),
        });
      } else {
        await apiRequest('/subjects', {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name,
            code: formData.code,
            examDate: formData.examDate || null,
            importance: Number(formData.importance),
            color: formData.color,
            description: formData.description,
          }),
        });
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      console.error('Failed to save subject:', err);
    }
  };

  const handleDelete = async (subjectId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will also remove its syllabus topics and sessions.`)) {
      return;
    }
    try {
      await apiRequest(`/subjects/${subjectId}`, { method: 'DELETE' });
      fetchSubjects();
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Subjects & Courses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your courses, examination dates, and syllabus topics
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add Subject
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses or codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title="No Subjects Found"
          description={searchQuery ? 'No course matches your search filter.' : 'You have not added any subjects yet.'}
          actionLabel="Add Course"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((subj) => (
            <Card key={subj._id} hover className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: subj.color || '#4f46e5' }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-snug">{subj.name}</h3>
                      {subj.code && <span className="text-[11px] font-mono text-muted-foreground">{subj.code}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(subj)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded"
                      title="Edit Course"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(subj._id, subj.name)}
                      className="p-1 text-muted-foreground hover:text-rose-600 rounded"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {subj.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {subj.description}
                  </p>
                )}

                {/* Exam date info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Calendar className="w-3.5 h-3.5 text-primary-500" />
                  <span>
                    Exam:{' '}
                    {subj.examDate
                      ? new Date(subj.examDate).toLocaleDateString()
                      : 'No exam date set'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Syllabus Completion</span>
                    <span className="font-semibold text-foreground">
                      {subj.completedTopics || 0}/{subj.totalTopics || 0} topics ({subj.completionPercent || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${subj.completionPercent || 0}%`,
                        backgroundColor: subj.color || '#4f46e5',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link to={`/app/subjects/${subj._id}`} className="mt-2">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>View Syllabus Topics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        description="Configure course details, importance, and examination schedule"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Subject Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Systems"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Course Code</label>
              <input
                type="text"
                placeholder="e.g. CS 340"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground uppercase focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Exam Date</label>
              <input
                type="date"
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Importance (1 - 5)</label>
              <select
                value={formData.importance}
                onChange={(e) => setFormData({ ...formData, importance: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500"
              >
                <option value="1">1 - Low Priority</option>
                <option value="2">2 - Standard</option>
                <option value="3">3 - Moderate</option>
                <option value="4">4 - High Importance</option>
                <option value="5">5 - Critical / Core Exam</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Color Tag</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-8 rounded-lg border border-border cursor-pointer bg-card"
                />
                <span className="font-mono text-muted-foreground">{formData.color}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Description / Notes</label>
            <textarea
              rows={3}
              placeholder="Key textbook chapters, professor expectations, or course topics..."
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
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
