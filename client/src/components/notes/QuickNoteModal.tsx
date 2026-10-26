import React, { useState, useEffect } from 'react';
import { FileText, Save, Tag, Bookmark } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteCreated?: (note: any) => void;
  defaultSubjectId?: string;
  defaultTopicId?: string;
}

export const QuickNoteModal: React.FC<QuickNoteModalProps> = ({
  isOpen,
  onClose,
  onNoteCreated,
  defaultSubjectId,
  defaultTopicId,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId || '');
  const [topicId, setTopicId] = useState(defaultTopicId || '');
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setSubjectId(defaultSubjectId || '');
      setTopicId(defaultTopicId || '');
      setIsPinned(false);
      setTags([]);
      setError(null);

      // Load subjects and topics for selection
      apiRequest<{ subjects: any[] }>('/subjects')
        .then((res) => setSubjects(res.subjects || []))
        .catch(() => {});

      apiRequest<{ topics: any[] }>('/topics')
        .then((res) => setTopics(res.topics || []))
        .catch(() => {});
    }
  }, [isOpen, defaultSubjectId, defaultTopicId]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^#/, '');
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Note title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await apiRequest<{ success: boolean; note: any }>('/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content,
          subjectId: subjectId || null,
          topicId: topicId || null,
          isPinned,
          tags,
        }),
      });

      if (onNoteCreated) onNoteCreated(res.note);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const filteredTopics = subjectId
    ? topics.filter((t) => t.subjectId === subjectId)
    : topics;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Study Note"
      description="Capture a thought, proof, formula, or reminder instantly"
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Note Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Master Theorem Case 2 Summary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Associate Subject (Optional)
            </label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId('');
              }}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              <option value="">No Subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Associate Topic (Optional)
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              <option value="">No Topic</option>
              {filteredTopics.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Note Content
          </label>
          <textarea
            rows={5}
            placeholder="Write your study notes, formulas, or key observations here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono leading-relaxed resize-y"
          />
        </div>

        {/* Tags & Pin Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 rounded-md text-[10px] flex items-center gap-1 border border-primary-200 dark:border-primary-800"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add tags (press Enter or comma)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground self-start sm:self-center">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-border text-primary-600 focus:ring-primary-500"
            />
            <Bookmark className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-500 fill-amber-500' : ''}`} />
            <span>Pin note to top</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={saving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Note
          </Button>
        </div>
      </form>
    </Modal>
  );
};
