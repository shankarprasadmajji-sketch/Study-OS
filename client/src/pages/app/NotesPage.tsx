import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Bookmark,
  Trash2,
  Save,
  Clock,
  Tag,
  BookOpen,
  Bold,
  Italic,
  Heading,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Edit3,
  Eye,
  Sparkles,
  Quote,
} from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { StudyNoteReader } from '../../components/notes/StudyNoteReader.js';

interface NoteItem {
  _id: string;
  title: string;
  content: string;
  subjectId?: string | null;
  subjectName?: string | null;
  subjectColor?: string | null;
  topicId?: string | null;
  topicTitle?: string | null;
  isPinned: boolean;
  color?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');

  // Mode: 'read' (rich, high-contrast, formatted study view) or 'edit' (input editor)
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read');

  // Edit State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editTopicId, setEditTopicId] = useState('');
  const [editPinned, setEditPinned] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const fetchNotesAndMeta = async () => {
    setLoading(true);
    try {
      const [notesRes, subjRes, topRes] = await Promise.all([
        apiRequest<{ success: boolean; notes: NoteItem[] }>('/notes'),
        apiRequest<{ success: boolean; subjects: any[] }>('/subjects'),
        apiRequest<{ success: boolean; topics: any[] }>('/topics'),
      ]);

      const noteList = notesRes.notes || [];
      setNotes(noteList);
      setSubjects(subjRes.subjects || []);
      setTopics(topRes.topics || []);

      if (noteList.length > 0 && !activeNote) {
        selectNote(noteList[0]);
      }
    } catch (err) {
      console.error('[Notes] Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotesAndMeta();
  }, []);

  const selectNote = (note: NoteItem) => {
    if (hasUnsavedChanges && activeNote && activeNote._id !== note._id) {
      if (!window.confirm('You have unsaved changes. Switch note anyway?')) {
        return;
      }
    }
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditSubjectId(note.subjectId || '');
    setEditTopicId(note.topicId || '');
    setEditPinned(note.isPinned);
    setEditTags(note.tags || []);
    setHasUnsavedChanges(false);
    setSaveStatus(null);
    // Open in formatted study reader mode if content exists, or editor if empty
    setViewMode(note.content?.trim() ? 'read' : 'edit');
  };

  const handleCreateNewNote = async () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Create a new note anyway?')) {
        return;
      }
    }

    try {
      const res = await apiRequest<{ success: boolean; note: NoteItem }>('/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Untitled Study Note',
          content: '',
          subjectId: selectedSubject !== 'all' ? selectedSubject : null,
          isPinned: false,
          tags: [],
        }),
      });

      const newNote = res.note;
      setNotes([newNote, ...notes]);
      setActiveNote(newNote);
      setEditTitle(newNote.title);
      setEditContent('');
      setEditSubjectId(newNote.subjectId || '');
      setEditTopicId('');
      setEditPinned(false);
      setEditTags([]);
      setHasUnsavedChanges(false);
      setViewMode('edit');
    } catch (err) {
      console.error('[Notes] Failed to create note:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNote) return;

    setIsSaving(true);
    try {
      const res = await apiRequest<{ success: boolean; note: NoteItem }>(
        `/notes/${activeNote._id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: editTitle.trim() || 'Untitled Note',
            content: editContent,
            subjectId: editSubjectId || null,
            topicId: editTopicId || null,
            isPinned: editPinned,
            tags: editTags,
          }),
        }
      );

      const updated = res.note;
      setActiveNote(updated);
      setNotes(notes.map((n) => (n._id === updated._id ? { ...n, ...updated } : n)));
      setHasUnsavedChanges(false);
      setSaveStatus('Note saved! Reading mode active');
      // Automatically switch to rich formatted study reader mode
      setViewMode('read');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  };

  // Instant update from reader (e.g. checking off study checklist items)
  const handleUpdateContentFromReader = async (newContent: string) => {
    if (!activeNote) return;
    setEditContent(newContent);
    try {
      const res = await apiRequest<{ success: boolean; note: NoteItem }>(
        `/notes/${activeNote._id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            content: newContent,
          }),
        }
      );
      const updated = res.note;
      setActiveNote(updated);
      setNotes(notes.map((n) => (n._id === updated._id ? { ...n, ...updated } : n)));
    } catch (err) {
      console.error('[Notes] Checklist update failed:', err);
    }
  };

  const handleTogglePin = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiRequest<{ success: boolean; note: NoteItem }>(`/notes/${noteId}/pin`, {
        method: 'PATCH',
      });
      const updated = res.note;
      setNotes(notes.map((n) => (n._id === updated._id ? { ...n, isPinned: updated.isPinned } : n)));
      if (activeNote?._id === noteId) {
        setEditPinned(updated.isPinned);
      }
    } catch (err) {
      console.error('[Notes] Pin toggle failed:', err);
    }
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      await apiRequest(`/notes/${noteToDelete}`, { method: 'DELETE' });
      const remaining = notes.filter((n) => n._id !== noteToDelete);
      setNotes(remaining);

      if (activeNote?._id === noteToDelete) {
        if (remaining.length > 0) {
          selectNote(remaining[0]);
        } else {
          setActiveNote(null);
        }
      }
      setIsDeleteModalOpen(false);
      setNoteToDelete(null);
    } catch (err) {
      console.error('[Notes] Delete failed:', err);
    }
  };

  // Text formatting tools for editor
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('note-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editContent.substring(start, end);
    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = editContent.substring(0, start) + replacement + editContent.substring(end);

    setEditContent(newContent);
    setHasUnsavedChanges(true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // Filter and sort notes list
  const filteredNotes = notes
    .filter((n) => {
      if (selectedSubject !== 'all' && n.subjectId !== selectedSubject) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        return (
          n.title.toLowerCase().includes(s) ||
          n.content.toLowerCase().includes(s) ||
          (n.tags && n.tags.some((t) => t.toLowerCase().includes(s)))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const availableTopics = editSubjectId
    ? topics.filter((t) => t.subjectId === editSubjectId)
    : topics;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-primary-600" />
            Student Notes & Notebooks
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize study summaries, derivations, formulas, and topic cheat sheets with live MongoDB sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
              <Sparkles className="w-3 h-3" /> {saveStatus}
            </span>
          )}
          {hasUnsavedChanges && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              ● Unsaved changes
            </span>
          )}
          <Button
            size="sm"
            onClick={handleCreateNewNote}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Note
          </Button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
        {/* Left Column: Note List & Filters (4 cols) */}
        <div className="lg:col-span-4 space-y-3 flex flex-col">
          <Card className="p-3.5 border-border space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notes & tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-1/2 px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none"
              >
                <option value="updated">Recently Updated</option>
                <option value="created">Recently Created</option>
                <option value="title">By Title (A-Z)</option>
              </select>
            </div>
          </Card>

          {/* Note Items Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[580px]">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading notes...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No matching notes found. Click "New Note" to create one.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = activeNote?._id === note._id;
                return (
                  <div
                    key={note._id}
                    onClick={() => selectNote(note)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                        : 'bg-card border-border hover:bg-muted/40 hover:border-indigo-400/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-xs font-bold line-clamp-1 flex-1 ${
                          isSelected ? 'text-indigo-100' : 'text-foreground'
                        }`}
                      >
                        {note.title || 'Untitled Note'}
                      </h4>

                      <button
                        onClick={(e) => handleTogglePin(note._id, e)}
                        className={`p-1 text-muted-foreground hover:text-amber-500 transition-colors ${
                          note.isPinned ? 'text-amber-500' : 'opacity-40 hover:opacity-100'
                        }`}
                        title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    <p
                      className={`text-[11px] line-clamp-2 mt-1 leading-relaxed ${
                        isSelected
                          ? 'text-indigo-200/90 font-medium'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {note.content ? note.content.replace(/[#*`_-]/g, '') : 'No content yet...'}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
                      <span className="truncate">
                        {note.subjectName ? (
                          <span className="font-semibold text-primary-600 dark:text-primary-400">
                            {note.subjectName}
                          </span>
                        ) : (
                          'General'
                        )}
                      </span>
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Note Reader & Editor (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          {activeNote ? (
            <div className="space-y-4">
              {/* Dual Mode Switcher Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-2xl p-2.5 px-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex items-center p-1 bg-muted/60 border border-border rounded-xl">
                    <button
                      onClick={() => setViewMode('read')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'read'
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Study Reader</span>
                    </button>

                    <button
                      onClick={() => setViewMode('edit')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'edit'
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Note</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    {viewMode === 'read'
                      ? 'Formatted vibrant study reading view'
                      : 'Markdown editor'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveNote}
                    isLoading={isSaving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Save Note
                  </Button>

                  <button
                    onClick={() => {
                      setNoteToDelete(activeNote._id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View Mode: Study Reader */}
              {viewMode === 'read' ? (
                <StudyNoteReader
                  title={editTitle}
                  content={editContent}
                  subjectName={
                    subjects.find((s) => s._id === editSubjectId)?.name ||
                    activeNote.subjectName
                  }
                  topicTitle={
                    topics.find((t) => t._id === editTopicId)?.title ||
                    activeNote.topicTitle
                  }
                  tags={editTags}
                  updatedAt={activeNote.updatedAt}
                  onEditClick={() => setViewMode('edit')}
                  onUpdateContent={handleUpdateContentFromReader}
                />
              ) : (
                /* View Mode: Edit Note */
                <Card className="p-5 border-border flex flex-col space-y-4">
                  {/* Note Title Input */}
                  <div className="border-b border-border pb-3">
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Note Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => {
                        setEditTitle(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Note Title..."
                      className="w-full text-lg sm:text-xl font-bold text-foreground bg-muted/30 border border-border rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-muted-foreground/60"
                    />
                  </div>

                  {/* Associations: Subject & Topic selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Subject Association
                      </label>
                      <select
                        value={editSubjectId}
                        onChange={(e) => {
                          setEditSubjectId(e.target.value);
                          setEditTopicId('');
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none"
                      >
                        <option value="">No Subject (General)</option>
                        {subjects.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Topic Association
                      </label>
                      <select
                        value={editTopicId}
                        onChange={(e) => {
                          setEditTopicId(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none"
                      >
                        <option value="">No Topic</option>
                        {availableTopics.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-1.5 bg-muted/50 border border-border rounded-xl">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card"
                      title="Bold (**text**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card"
                      title="Italic (*text*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('# ')}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card"
                      title="Heading 1 (# text)"
                    >
                      <Heading className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('- ')}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card"
                      title="Bullet List (- item)"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('1. ')}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card"
                      title="Numbered List (1. item)"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('- [ ] ')}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card"
                      title="Checklist Item (- [ ] task)"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('> ')}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card"
                      title="Quote / Callout (> formula)"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('```\n', '\n```')}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card"
                      title="Code Block"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Note Content Textarea with Crisp High Contrast Typography */}
                  <div className="flex-1 flex flex-col">
                    <textarea
                      id="note-textarea"
                      value={editContent}
                      onChange={(e) => {
                        setEditContent(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Type your study notes, formulas, proofs, or questions..."
                      className="w-full flex-1 min-h-[340px] p-4 bg-slate-900/80 border border-border rounded-xl text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans leading-relaxed resize-y"
                    />
                  </div>

                  {/* Footer Timestamps and Preview Button */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Last updated: {new Date(activeNote.updatedAt).toLocaleString()}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewMode('read')}
                      className="text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Formatted View</span>
                    </button>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card className="flex-1 flex items-center justify-center p-12 border-border">
              <EmptyState
                icon={<FileText className="w-8 h-8" />}
                title="No Note Selected"
                description="Select an existing study note from the left sidebar or click below to create a new one."
                actionLabel="Create Note"
                onAction={handleCreateNewNote}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Note"
        description="Are you sure you want to permanently delete this note?"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground">
            This action cannot be undone. This note will be permanently removed from MongoDB.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDelete}
            >
              Delete Note
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
