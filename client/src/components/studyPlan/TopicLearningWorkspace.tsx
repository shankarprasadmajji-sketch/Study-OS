import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Video,
  FileText,
  CreditCard,
  GitBranch,
  HelpCircle,
  RotateCcw,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Send,
  AlertTriangle,
  Lightbulb,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
  Award,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import {
  Topic,
  Subject,
  TopicLearningMaterial,
  Flashcard,
  QuizQuestion,
  UnderstandingLevel,
  AIStatusInfo,
} from '../../types/index.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { Card } from '../ui/Card.js';
import { Modal } from '../ui/Modal.js';
import { FlowchartRenderer } from './FlowchartRenderer.js';

interface TopicLearningWorkspaceProps {
  topicId: string;
  onClose: () => void;
  onTopicStatusChanged?: () => void;
}

export const TopicLearningWorkspace: React.FC<TopicLearningWorkspaceProps> = ({
  topicId,
  onClose,
  onTopicStatusChanged,
}) => {
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [material, setMaterial] = useState<TopicLearningMaterial | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatusInfo>({
    configured: false,
    provider: null,
    message: '',
  });

  // Active Tab: 'video' | 'notes' | 'flashcards' | 'visuals' | 'quiz' | 'revision' | 'chat'
  const [activeTab, setActiveTab] = useState<
    'video' | 'notes' | 'flashcards' | 'visuals' | 'quiz' | 'revision' | 'chat'
  >('video');

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');

  // Video State
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [customVideoModalOpen, setCustomVideoModalOpen] = useState(false);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [customVideoTitle, setCustomVideoTitle] = useState('');

  // Flashcards State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Notes State
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);
  const [notesText, setNotesText] = useState({
    summary: '',
    detailedExplanation: '',
  });

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // Chat Tutor State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Load Workspace Data
  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{
        topic: Topic;
        subject: Subject;
        material: TopicLearningMaterial;
        aiStatus: AIStatusInfo;
      }>(`/ai/topic/${topicId}/workspace`);

      setTopic(res.topic);
      setSubject(res.subject);
      setMaterial(res.material);
      setAiStatus(res.aiStatus);

      setNotesText({
        summary: res.material.aiNotes?.summary || '',
        detailedExplanation: res.material.aiNotes?.detailedExplanation || '',
      });

      // Default welcome message in tutor
      if (chatMessages.length === 0) {
        setChatMessages([
          {
            role: 'assistant',
            content: `👋 Hello! I am your AI Study Tutor for **${res.topic.title}** (${res.subject.name}). Ask me any questions, request simpler explanations, or ask for real-world examples!`,
          },
        ]);
      }
    } catch (err: any) {
      console.error('Failed to load topic workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [topicId]);

  // Generate Materials via AI
  const handleGenerateMaterials = async () => {
    if (!aiStatus.configured) {
      setSetupMessage(
        aiStatus.message ||
          'To generate personalized AI notes, flashcards, concept flowcharts, and practice quizzes, please set GEMINI_API_KEY in server/.env.'
      );
      setSetupModalOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await apiRequest<{ material: TopicLearningMaterial }>(
        `/ai/topic/${topicId}/generate-materials`,
        { method: 'POST' }
      );
      setMaterial(res.material);
      setNotesText({
        summary: res.material.aiNotes?.summary || '',
        detailedExplanation: res.material.aiNotes?.detailedExplanation || '',
      });
      // Switch to notes tab to show generated output
      setActiveTab('notes');
    } catch (err: any) {
      if (err.details?.configured === false || err.message?.includes('AI_KEY_NOT_CONFIGURED')) {
        setSetupMessage(
          'AI Assistant requires an API key. To enable live AI generation, please add GEMINI_API_KEY in server/.env.'
        );
        setSetupModalOpen(true);
      } else {
        alert(err.message || 'Failed to generate AI materials.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Video Watched
  const handleToggleVideoWatched = async (videoUrl: string, currentWatched: boolean) => {
    try {
      const res = await apiRequest<{ material: TopicLearningMaterial }>(
        `/ai/topic/${topicId}/video/watched`,
        {
          method: 'POST',
          body: JSON.stringify({ videoUrl, watched: !currentWatched }),
        }
      );
      setMaterial(res.material);
    } catch (err: any) {
      console.error('Failed to update video watched status:', err);
    }
  };

  // Add Custom Video
  const handleAddCustomVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVideoUrl) return;

    try {
      const res = await apiRequest<{ material: TopicLearningMaterial }>(
        `/ai/topic/${topicId}/video/custom`,
        {
          method: 'POST',
          body: JSON.stringify({
            url: customVideoUrl,
            title: customVideoTitle || 'Student Resource Video',
          }),
        }
      );
      setMaterial(res.material);
      setCustomVideoUrl('');
      setCustomVideoTitle('');
      setCustomVideoModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add custom video.');
    }
  };

  // Save Notes
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setNotesSaveSuccess(false);
    try {
      const res = await apiRequest<{ material: TopicLearningMaterial }>(
        `/ai/topic/${topicId}/notes`,
        {
          method: 'PUT',
          body: JSON.stringify({
            summary: notesText.summary,
            detailedExplanation: notesText.detailedExplanation,
            keyPoints: material?.aiNotes?.keyPoints || [],
            definitions: material?.aiNotes?.definitions || [],
            formulas: material?.aiNotes?.formulas || [],
            practicalExamples: material?.aiNotes?.practicalExamples || [],
          }),
        }
      );
      setMaterial(res.material);
      setNotesSaveSuccess(true);
      setTimeout(() => setNotesSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Review Flashcard
  const handleReviewFlashcard = async (status: 'know' | 'needs_revision') => {
    const flashcards = material?.flashcards || [];
    if (flashcards.length === 0) return;

    const currentCard = flashcards[currentCardIndex];
    try {
      const res = await apiRequest<{ material: TopicLearningMaterial }>(
        `/ai/topic/${topicId}/flashcards/review`,
        {
          method: 'POST',
          body: JSON.stringify({
            flashcardId: currentCard.id,
            status,
          }),
        }
      );
      setMaterial(res.material);

      // Advance to next card
      if (currentCardIndex < flashcards.length - 1) {
        setIsCardFlipped(false);
        setCurrentCardIndex((prev) => prev + 1);
      }
    } catch (err: any) {
      console.error('Failed to review flashcard:', err);
    }
  };

  // Submit Practice Quiz
  const handleSubmitQuiz = async () => {
    const questions = material?.quiz || [];
    if (questions.length === 0) return;

    const answersPayload = questions.map((q) => ({
      questionId: q.id,
      selectedIndex: quizAnswers[q.id] ?? -1,
    }));

    setIsSubmittingQuiz(true);
    try {
      const res = await apiRequest<any>(`/ai/topic/${topicId}/quiz/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: answersPayload,
          timeSpentSeconds: 120,
        }),
      });
      setQuizResult(res);
      setQuizSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Update Topic Understanding
  const handleUpdateUnderstanding = async (level: UnderstandingLevel) => {
    try {
      const res = await apiRequest<{ material: TopicLearningMaterial }>(
        `/ai/topic/${topicId}/understanding`,
        {
          method: 'PUT',
          body: JSON.stringify({ understandingLevel: level }),
        }
      );
      setMaterial(res.material);
    } catch (err: any) {
      console.error('Failed to update understanding level:', err);
    }
  };

  // Toggle Topic Completed
  const handleToggleTopicCompleted = async () => {
    if (!topic) return;
    try {
      if (topic.status === 'completed') {
        await apiRequest(`/topics/${topicId}/reopen`, { method: 'POST' });
        setTopic({ ...topic, status: 'in_progress' });
      } else {
        await apiRequest(`/topics/${topicId}/complete`, {
          method: 'POST',
          body: JSON.stringify({ actualMinutes: topic.estimatedMinutes || 60 }),
        });
        setTopic({ ...topic, status: 'completed' });
      }
      if (onTopicStatusChanged) onTopicStatusChanged();
    } catch (err: any) {
      console.error('Failed to toggle topic status:', err);
    }
  };

  // Send Message to AI Chat Tutor
  const handleSendMessage = async (customPrompt?: string) => {
    const messageToSend = customPrompt || chatInput;
    if (!messageToSend.trim()) return;

    if (!aiStatus.configured) {
      setSetupMessage(
        'AI Assistant requires an API key. To chat with the AI tutor, please set GEMINI_API_KEY in server/.env.'
      );
      setSetupModalOpen(true);
      return;
    }

    const newMessages = [...chatMessages, { role: 'user' as const, content: messageToSend }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await apiRequest<{ reply: string }>(`/ai/topic/${topicId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ messages: newMessages }),
      });

      setChatMessages([...newMessages, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      setChatMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '⚠️ I encountered an error answering your question. Please ensure your backend AI key is configured.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-4xl p-12 bg-card rounded-2xl border border-border shadow-elevated text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin mx-auto" />
          <h3 className="text-base font-bold text-foreground">Preparing Learning Workspace...</h3>
          <p className="text-xs text-muted-foreground">
            Loading syllabus topics, verified educational videos, and learning materials
          </p>
        </div>
      </div>
    );
  }

  if (!topic || !subject || !material) {
    return null;
  }

  const flashcards = material.flashcards || [];
  const currentCard = flashcards[currentCardIndex];
  const masteredCount = flashcards.filter((f) => f.status === 'know').length;
  const videos = material.videos || [];
  const currentVideo = videos[activeVideoIndex] || videos[0];

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-elevated overflow-hidden flex flex-col max-h-[95vh] text-xs">
        {/* Workspace Top Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-10 rounded-full shrink-0"
              style={{ backgroundColor: subject.color || '#4f46e5' }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  style={{
                    backgroundColor: `${subject.color}20`,
                    color: subject.color || '#4f46e5',
                    borderColor: `${subject.color}40`,
                  }}
                >
                  {subject.name} {subject.code ? `• ${subject.code}` : ''}
                </Badge>
                <Badge
                  variant={
                    topic.difficulty === 'hard'
                      ? 'danger'
                      : topic.difficulty === 'medium'
                      ? 'warning'
                      : 'outline'
                  }
                >
                  {topic.difficulty}
                </Badge>
                {topic.status === 'completed' && <Badge variant="success">Completed</Badge>}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground mt-1 tracking-tight">
                {topic.title}
              </h2>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Understanding Level Dropdown */}
            <div className="flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-xl border border-border">
              <span className="text-[11px] text-muted-foreground font-medium">Confidence:</span>
              <select
                value={material.understandingLevel || 'intermediate'}
                onChange={(e) => handleUpdateUnderstanding(e.target.value as UnderstandingLevel)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="beginner">Beginner (Need Help)</option>
                <option value="intermediate">Intermediate (Fair)</option>
                <option value="advanced">Advanced (Mastered)</option>
              </select>
            </div>

            {/* AI Generate Button */}
            <Button
              size="sm"
              onClick={handleGenerateMaterials}
              isLoading={isGenerating}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold"
            >
              {material.isGeneratedByAI ? 'Regenerate with AI' : 'Generate with AI'}
            </Button>

            {/* Mark Done / In Progress Toggle */}
            <Button
              size="sm"
              variant={topic.status === 'completed' ? 'outline' : 'secondary'}
              onClick={handleToggleTopicCompleted}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            >
              {topic.status === 'completed' ? 'Reopen Topic' : 'Mark Done'}
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Close Workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 border-b border-border bg-card flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('video')}
            className={`py-3 px-3.5 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'video'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>A. Video Learning</span>
            {videos.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono">
                {videos.filter((v) => v.watched).length}/{videos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-3.5 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>B. AI Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`py-3 px-3.5 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'flashcards'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>C. Flashcards</span>
            {flashcards.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono">
                {masteredCount}/{flashcards.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('visuals')}
            className={`py-3 px-3.5 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'visuals'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>E. Visuals & Flowchart</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-3 px-3.5 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>F. Practice Quiz</span>
            {material.quiz && material.quiz.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono">
                {material.quiz.length}Q
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('revision')}
            className={`py-3 px-3.5 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'revision'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>D. Revision Section</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-3.5 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Chat Tutor</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB A: Video Learning */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Verified Educational Video Lectures
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Selected tutorials, university lectures, and conceptual deep-dives for {topic.title}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCustomVideoModalOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Custom Video
                </Button>
              </div>

              {videos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No video lectures curated yet. Click "Add Custom Video" to attach your favorite lecture.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Video Player */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border shadow-md">
                      {currentVideo?.embedUrl ? (
                        <iframe
                          src={currentVideo.embedUrl}
                          title={currentVideo.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 text-white">
                          <Video className="w-12 h-12 text-primary-400 opacity-60" />
                          <p className="text-xs max-w-sm">
                            Direct embed not available. Open the lecture directly on YouTube:
                          </p>
                          <a
                            href={currentVideo?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
                          >
                            <span>Open on YouTube</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Active Video Info & Watched Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border">
                      <div>
                        <h4 className="font-bold text-foreground text-xs sm:text-sm">
                          {currentVideo?.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {currentVideo?.channel} • {currentVideo?.duration}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={currentVideo?.watched ? 'secondary' : 'outline'}
                          onClick={() =>
                            handleToggleVideoWatched(currentVideo.url, !!currentVideo.watched)
                          }
                          leftIcon={
                            <CheckCircle2
                              className={`w-3.5 h-3.5 ${
                                currentVideo?.watched ? 'text-emerald-500' : 'text-muted-foreground'
                              }`}
                            />
                          }
                        >
                          {currentVideo?.watched ? 'Watched ✓' : 'Mark as Watched'}
                        </Button>

                        <a
                          href={currentVideo?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Video Playlist Sidebar */}
                  <div className="space-y-3">
                    <span className="font-bold text-foreground block text-xs uppercase tracking-wider">
                      Recommended Lectures ({videos.length})
                    </span>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {videos.map((vid, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveVideoIndex(idx)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            activeVideoIndex === idx
                              ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/20 shadow-sm'
                              : 'border-border bg-card hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-foreground line-clamp-2">
                              {vid.title}
                            </span>
                            {vid.watched && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground block mt-1">
                            {vid.channel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB B: AI Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">AI Comprehensive Notes</h3>
                  <p className="text-xs text-muted-foreground">
                    Pedagogical breakdown, definitions, formulas, and practical examples
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {notesSaveSuccess && (
                    <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Notes Saved
                    </span>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    isLoading={isSavingNotes}
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                  >
                    Save Notes
                  </Button>
                </div>
              </div>

              {!material.aiNotes?.summary && !notesText.summary ? (
                <div className="p-10 rounded-2xl border border-dashed border-border bg-muted/20 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold text-foreground">No AI notes generated yet</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Click "Generate with AI" in the header to create clear explanations, key formulas,
                    and practical examples tailored for this topic.
                  </p>
                  <Button size="sm" onClick={handleGenerateMaterials} isLoading={isGenerating}>
                    Generate AI Notes Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Conceptual Summary */}
                  <div className="p-4 rounded-xl bg-primary-50/30 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/40 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-primary-600" />
                      Core Conceptual Summary
                    </span>
                    <textarea
                      value={notesText.summary}
                      onChange={(e) => setNotesText({ ...notesText, summary: e.target.value })}
                      className="w-full p-2 rounded-lg bg-transparent border-0 text-foreground text-xs leading-relaxed resize-none focus:outline-none"
                      rows={3}
                    />
                  </div>

                  {/* Definitions & Terminology */}
                  {material.aiNotes?.definitions && material.aiNotes.definitions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Key Terminology & Definitions
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {material.aiNotes.definitions.map((def, idx) => (
                          <div key={idx} className="p-3 rounded-xl border border-border bg-card">
                            <span className="font-bold text-primary-600 dark:text-primary-400 block mb-0.5">
                              {def.term}
                            </span>
                            <span className="text-muted-foreground leading-relaxed">
                              {def.definition}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Formulas or Core Rules */}
                  {material.aiNotes?.formulas && material.aiNotes.formulas.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Formulas & Invariants
                      </h4>
                      <div className="space-y-2">
                        {material.aiNotes.formulas.map((f, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-muted/60 border border-border font-mono text-xs text-foreground flex items-center gap-2"
                          >
                            <span className="w-5 h-5 rounded bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-center font-bold">
                              fx
                            </span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Explanation */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Detailed Explanation & Step-by-Step Breakdown
                    </h4>
                    <textarea
                      value={notesText.detailedExplanation}
                      onChange={(e) =>
                        setNotesText({ ...notesText, detailedExplanation: e.target.value })
                      }
                      rows={8}
                      className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground text-xs leading-relaxed focus:outline-none"
                    />
                  </div>

                  {/* Practical Examples */}
                  {material.aiNotes?.practicalExamples &&
                    material.aiNotes.practicalExamples.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Practical & Real-World Examples
                        </h4>
                        <div className="space-y-2">
                          {material.aiNotes.practicalExamples.map((ex, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border border-border bg-card flex items-start gap-2.5"
                            >
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-foreground leading-relaxed">{ex}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* TAB C: Flashcards */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Spaced Active Recall Flashcards</h3>
                  <p className="text-xs text-muted-foreground">
                    Flip cards to test your memory. Tag "Know" or "Need Revision" to train spaced recall.
                  </p>
                </div>
                <Badge variant="outline">
                  Mastered: {masteredCount} / {flashcards.length}
                </Badge>
              </div>

              {flashcards.length === 0 ? (
                <div className="p-10 rounded-2xl border border-dashed border-border text-center space-y-3">
                  <CreditCard className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-bold text-foreground">No flashcards available</p>
                  <Button size="sm" onClick={handleGenerateMaterials} isLoading={isGenerating}>
                    Generate Flashcards with AI
                  </Button>
                </div>
              ) : (
                <div className="max-w-xl mx-auto space-y-4">
                  {/* Card Counter & Category */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Card {currentCardIndex + 1} of {flashcards.length}
                    </span>
                    <Badge size="sm">{currentCard?.category || 'Concept'}</Badge>
                    <span
                      className={`font-semibold capitalize ${
                        currentCard?.status === 'know'
                          ? 'text-emerald-600'
                          : currentCard?.status === 'needs_revision'
                          ? 'text-amber-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {currentCard?.status?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Interactive Flip Card */}
                  <div
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className="h-64 sm:h-72 w-full rounded-2xl border border-border bg-card p-6 flex flex-col justify-between cursor-pointer hover:border-primary-400 transition-all shadow-subtle select-none text-center"
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                      {isCardFlipped ? 'Answer (Click to flip)' : 'Question (Click to reveal answer)'}
                    </span>

                    <div className="flex-1 flex items-center justify-center p-4">
                      <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                        {isCardFlipped ? currentCard?.answer : currentCard?.question}
                      </p>
                    </div>

                    <span className="text-[11px] text-primary-600 font-semibold">
                      {isCardFlipped ? '↺ Flip back to question' : '↻ Click to flip card'}
                    </span>
                  </div>

                  {/* Flashcard Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => handleReviewFlashcard('needs_revision')}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                    >
                      ⟳ Need Revision
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleReviewFlashcard('know')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      ✓ I Know This!
                    </Button>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentCardIndex === 0}
                      onClick={() => {
                        setIsCardFlipped(false);
                        setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                      }}
                      leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    >
                      Previous
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentCardIndex === flashcards.length - 1}
                      onClick={() => {
                        setIsCardFlipped(false);
                        setCurrentCardIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
                      }}
                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      Next Card
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB E: Visuals & Flowcharts */}
          {activeTab === 'visuals' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground">Visual Flowcharts & Concept Maps</h3>
                <p className="text-xs text-muted-foreground">
                  Architectural diagrams, algorithmic processes, and conceptual relationships
                </p>
              </div>

              {!material.flowchart?.mermaidCode && (!material.flowchart?.steps || material.flowchart.steps.length === 0) ? (
                <div className="p-10 rounded-2xl border border-dashed border-border text-center space-y-3">
                  <GitBranch className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-bold text-foreground">No visual diagram generated yet</p>
                  <Button size="sm" onClick={handleGenerateMaterials} isLoading={isGenerating}>
                    Generate Diagram with AI
                  </Button>
                </div>
              ) : (
                <FlowchartRenderer flowchart={material.flowchart} />
              )}
            </div>
          )}

          {/* TAB F: Practice Quiz */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Topic Practice Quiz</h3>
                  <p className="text-xs text-muted-foreground">
                    Multiple-choice questions testing core concepts, calculations, and problem solving
                  </p>
                </div>

                {quizSubmitted && quizResult && (
                  <Badge variant={quizResult.accuracyPercent >= 70 ? 'success' : 'danger'}>
                    Score: {quizResult.score} / {quizResult.totalQuestions} ({quizResult.accuracyPercent}%)
                  </Badge>
                )}
              </div>

              {(!material.quiz || material.quiz.length === 0) ? (
                <div className="p-10 rounded-2xl border border-dashed border-border text-center space-y-3">
                  <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-bold text-foreground">No practice quiz generated yet</p>
                  <Button size="sm" onClick={handleGenerateMaterials} isLoading={isGenerating}>
                    Generate Quiz with AI
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {material.quiz.map((q, qIdx) => {
                    const selected = quizAnswers[q.id];
                    const isSubmitted = quizSubmitted;
                    const isCorrect = isSubmitted && selected === q.correctAnswerIndex;
                    const isWrong = isSubmitted && selected !== undefined && selected !== q.correctAnswerIndex;

                    return (
                      <Card
                        key={q.id || qIdx}
                        className={`p-4 border transition-all ${
                          isCorrect
                            ? 'border-emerald-300 bg-emerald-50/20 dark:border-emerald-900/60'
                            : isWrong
                            ? 'border-rose-300 bg-rose-50/20 dark:border-rose-900/60'
                            : 'border-border bg-card'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <span className="font-bold text-foreground text-xs sm:text-sm">
                            {qIdx + 1}. {q.question}
                          </span>
                          {q.conceptTested && (
                            <Badge size="sm" variant="outline">
                              {q.conceptTested}
                            </Badge>
                          )}
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = selected === optIdx;
                            const isAnswerKey = isSubmitted && optIdx === q.correctAnswerIndex;

                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isAnswerKey
                                    ? 'border-emerald-500 bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold'
                                    : isChosen && isWrong
                                    ? 'border-rose-500 bg-rose-100/50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-semibold'
                                    : isChosen
                                    ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/40 text-foreground font-semibold'
                                    : 'border-border bg-card text-foreground hover:bg-muted/40'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${q.id}`}
                                  checked={isChosen}
                                  disabled={isSubmitted}
                                  onChange={() =>
                                    setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })
                                  }
                                  className="accent-primary-600"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>

                        {/* Explanation after submission */}
                        {isSubmitted && q.explanation && (
                          <div className="mt-3 p-3 rounded-xl bg-muted/60 border border-border text-xs space-y-1">
                            <span className="font-semibold text-foreground block">
                              Explanation:
                            </span>
                            <p className="text-muted-foreground leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </Card>
                    );
                  })}

                  <div className="flex justify-end gap-3 pt-2">
                    {quizSubmitted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                          setQuizResult(null);
                        }}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Retake Quiz
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleSubmitQuiz}
                        isLoading={isSubmittingQuiz}
                        disabled={Object.keys(quizAnswers).length === 0}
                      >
                        Submit Quiz for Grading
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB D: Revision Section */}
          {activeTab === 'revision' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground">Rapid Spaced Revision Pack</h3>
                <p className="text-xs text-muted-foreground">
                  2-minute high-yield summary, formula cheat sheet, and common exam pitfalls to avoid
                </p>
              </div>

              {!material.revision?.quickSummary ? (
                <div className="p-10 rounded-2xl border border-dashed border-border text-center space-y-3">
                  <RotateCcw className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-bold text-foreground">No revision pack generated yet</p>
                  <Button size="sm" onClick={handleGenerateMaterials} isLoading={isGenerating}>
                    Generate Revision Pack with AI
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* High Yield Summary */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                      ⚡ 2-Minute High-Yield Summary
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {material.revision.quickSummary}
                    </p>
                  </div>

                  {/* Common Pitfalls & Mistakes */}
                  {material.revision.commonMistakes && material.revision.commonMistakes.length > 0 && (
                    <div className="p-4 rounded-xl bg-rose-50/30 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                      <span className="font-bold text-rose-800 dark:text-rose-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Common Exam Pitfalls & Misconceptions to Avoid
                      </span>
                      <ul className="space-y-1.5 pl-5 list-disc text-xs text-foreground">
                        {material.revision.commonMistakes.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Core Concepts Checklist */}
                  {material.revision.coreConcepts && material.revision.coreConcepts.length > 0 && (
                    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                      <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                        Must-Remember Core Concepts
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {material.revision.coreConcepts.map((c, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs text-foreground flex items-center gap-2"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB CHAT: AI Chat Tutor */}
          {activeTab === 'chat' && (
            <div className="space-y-4 flex flex-col h-[520px]">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary-600" />
                  AI Study Tutor — {topic.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ask questions, request simpler explanations, get analogies, or ask for step-by-step examples
                </p>
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => handleSendMessage('Explain this concept in simple English like I am 12.')}
                  className="px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted text-[11px] text-foreground font-medium shrink-0"
                >
                  💡 Explain simply
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('Give me an intuitive real-world analogy for this topic.')}
                  className="px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted text-[11px] text-foreground font-medium shrink-0"
                >
                  🌍 Real-world analogy
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('Walk me through a step-by-step solved example.')}
                  className="px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted text-[11px] text-foreground font-medium shrink-0"
                >
                  📐 Step-by-step example
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('What are the most common exam questions on this topic?')}
                  className="px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted text-[11px] text-foreground font-medium shrink-0"
                >
                  🎯 Exam questions
                </button>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white rounded-br-none'
                          : 'bg-card border border-border text-foreground rounded-bl-none shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                    <div className="w-3 h-3 rounded-full bg-primary-600 animate-ping" />
                    <span>AI Tutor is formulating explanation...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask a question about ${topic.title}...`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs focus:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!chatInput.trim() || isChatLoading}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Custom Video Modal */}
      <Modal
        isOpen={customVideoModalOpen}
        onClose={() => setCustomVideoModalOpen(false)}
        title="Add Custom Video Lecture"
        description="Paste any YouTube video or educational link to attach it to this topic"
      >
        <form onSubmit={handleAddCustomVideo} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">
              YouTube Video URL or Search Link
            </label>
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={customVideoUrl}
              onChange={(e) => setCustomVideoUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">
              Lecture Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. MIT 6.004 Lecture 12"
              value={customVideoTitle}
              onChange={(e) => setCustomVideoTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCustomVideoModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Video Link
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI Setup Notification Modal */}
      <Modal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title="AI Assistant Configuration Required"
        description="Enable live AI learning generation"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              API Key Setup Notice
            </p>
            <p className="leading-relaxed">{setupMessage}</p>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-2 text-muted-foreground">
            <p className="font-bold text-foreground">How to configure:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Open the <code className="text-primary-600 font-mono">server/.env</code> file.
              </li>
              <li>
                Add your Gemini API key:
                <br />
                <code className="text-primary-600 font-mono block mt-1 p-1 bg-card rounded">
                  GEMINI_API_KEY=your_gemini_api_key_here
                </code>
              </li>
              <li>Restart the server. All AI notes, flashcards, quizzes, and chat tutor will activate immediately.</li>
            </ol>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setSetupModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

