import { Response } from 'express';
import { z } from 'zod';
import { isBefore } from 'date-fns';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';
import { aiService } from '../services/aiService.js';
import { videoService } from '../services/videoService.js';
import { isDateOnlyInPast, toDate } from '../utils/dateValidation.js';
import { enrichStudySessions } from '../utils/sessionEnricher.js';

export const aiController = {
  /**
   * Check AI configuration status
   */
  async getStatus(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const status = aiService.getAIStatus();
    res.status(200).json({
      success: true,
      ...status,
    });
  },

  /**
   * 1. Generate Intelligent AI Study Plan
   */
  async generateAIStudyPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { name, startDate, endDate, preferredSessionMinutes, breakMinutes, savePlan } = req.body;

    const user = await dataStore.findUserById(userId);
    const timezone = (req.headers['x-timezone'] as string) || user?.timezone || 'UTC';

    if (isDateOnlyInPast(startDate, timezone)) {
      res.status(400).json({
        success: false,
        error: 'Plan start date cannot be in the past. Please select today or a future date.',
      });
      return;
    }

    const sDate = toDate(startDate);
    const eDate = toDate(endDate);
    if (isBefore(eDate, sDate)) {
      res.status(400).json({
        success: false,
        error: 'End date must be on or after start date.',
      });
      return;
    }

    const subjects = await dataStore.findSubjectsByUserId(userId);
    if (subjects.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No subjects added yet. Please add at least one subject before generating an AI study plan.',
      });
      return;
    }

    const topics = await dataStore.findTopicsByUserId(userId);
    if (topics.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No topics added yet. Please add syllabus topics to your subjects before generating an AI study plan.',
      });
      return;
    }

    const availability = await dataStore.findAvailabilityByUserId(userId);

    // Check if AI is configured
    const aiStatus = aiService.getAIStatus();
    if (!aiStatus.configured) {
      res.status(400).json({
        success: false,
        configured: false,
        error: 'AI_KEY_NOT_CONFIGURED',
        message:
          'AI Assistant requires an API key. To enable live AI study plan generation, please add GEMINI_API_KEY in server/.env.',
      });
      return;
    }

    // Collect student understanding levels from learning materials
    const formattedTopics = await Promise.all(
      topics.map(async (t) => {
        const mat = await dataStore.findTopicLearningMaterial(userId, t._id.toString());
        return {
          id: t._id.toString(),
          subjectId: t.subjectId.toString(),
          title: t.title,
          description: t.description,
          difficulty: t.difficulty,
          importance: t.importance,
          estimatedMinutes: t.estimatedMinutes,
          status: t.status,
          understandingLevel: mat?.understandingLevel || 'intermediate',
        };
      })
    );

    try {
      const planResult = await aiService.generateAIStudyPlan({
        studentProfile: {
          name: user?.name || 'Student',
          educationLevel: user?.educationLevel,
          academicYear: user?.academicYear,
        },
        subjects: subjects.map((s) => ({
          id: s._id.toString(),
          name: s.name,
          code: s.code,
          importance: s.importance || 3,
          examDate: s.examDate,
        })),
        topics: formattedTopics,
        availableDays: availability.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          enabled: a.enabled,
        })),
        startDate: sDate.toISOString(),
        endDate: eDate.toISOString(),
        preferredSessionMinutes: preferredSessionMinutes || user?.preferences?.preferredSessionMinutes || 50,
        breakMinutes: breakMinutes || user?.preferences?.breakMinutes || 10,
      });

      if (savePlan) {
        // Save the plan into MongoDB
        const createdPlan = await dataStore.createStudyPlan({
          userId,
          name: name || 'AI Personalized Study Plan',
          startDate: sDate,
          endDate: eDate,
          status: 'active',
          algorithmVersion: 'AI-2.0-Gemini',
          feasibility: planResult.feasibility,
        });

        // Save generated sessions
        const sessionDocs = (planResult.sessions || []).map((s) => ({
          userId,
          planId: createdPlan._id.toString(),
          topicId: s.topicId,
          subjectId: s.subjectId,
          scheduledStart: new Date(s.scheduledStart),
          scheduledEnd: new Date(s.scheduledEnd),
          plannedMinutes: s.plannedMinutes || 50,
          actualMinutes: 0,
          status: 'scheduled',
          sessionType: s.sessionType || 'study',
          completedAt: null,
          notes: s.priorityExplanation || '',
        }));

        const savedSessions = await dataStore.insertStudySessions(sessionDocs);
        const enriched = await enrichStudySessions(savedSessions, userId);

        res.status(201).json({
          success: true,
          message: 'AI Personalized Study Plan successfully generated and activated.',
          plan: createdPlan,
          sessions: enriched,
          feasibility: planResult.feasibility,
          breakdowns: planResult.breakdowns,
          recommendations: planResult.learningRecommendations,
        });
        return;
      }

      // Preview only
      res.status(200).json({
        success: true,
        preview: true,
        feasibility: planResult.feasibility,
        proposedSessions: planResult.sessions,
        breakdowns: planResult.breakdowns,
        recommendations: planResult.learningRecommendations,
      });
    } catch (err: any) {
      console.error('[AIController] Study plan generation failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate AI study plan. Please verify backend AI configuration.',
      });
    }
  },

  /**
   * 2. Get or Initialize Topic Learning Workspace
   */
  async getTopicWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;

    const topic = await dataStore.findTopicByIdAndUser(topicId, userId);
    if (!topic) {
      res.status(404).json({ success: false, error: 'Topic not found.' });
      return;
    }

    const subject = await dataStore.findSubjectByIdAndUser(topic.subjectId.toString(), userId);
    if (!subject) {
      res.status(404).json({ success: false, error: 'Subject for topic not found.' });
      return;
    }

    let material = await dataStore.findTopicLearningMaterial(userId, topicId);

    if (!material) {
      // Initialize with videos and default structure
      const videos = await videoService.getTopicVideos(topic.title, subject.name);
      material = await dataStore.upsertTopicLearningMaterial(userId, topicId, subject._id.toString(), {
        understandingLevel: 'intermediate',
        aiNotes: {
          summary: '',
          detailedExplanation: '',
          keyPoints: [],
          definitions: [],
          formulas: [],
          practicalExamples: [],
        },
        videos,
        flashcards: [],
        flowchart: { mermaidCode: '', steps: [] },
        quiz: [],
        revision: { quickSummary: '', coreConcepts: [], formulaCheatSheet: [], commonMistakes: [] },
        isGeneratedByAI: false,
      });
    } else if (!material.videos || material.videos.length === 0) {
      const videos = await videoService.getTopicVideos(topic.title, subject.name);
      material = await dataStore.upsertTopicLearningMaterial(userId, topicId, subject._id.toString(), {
        videos,
      });
    }

    const quizAttempts = await dataStore.findQuizAttemptsByTopic(userId, topicId);

    res.status(200).json({
      success: true,
      topic,
      subject,
      material,
      quizAttempts,
      aiStatus: aiService.getAIStatus(),
    });
  },

  /**
   * 3. Generate AI Learning Materials (Notes, Flashcards, Flowchart, Quiz)
   */
  async generateTopicMaterials(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;

    const topic = await dataStore.findTopicByIdAndUser(topicId, userId);
    if (!topic) {
      res.status(404).json({ success: false, error: 'Topic not found.' });
      return;
    }

    const subject = await dataStore.findSubjectByIdAndUser(topic.subjectId.toString(), userId);
    if (!subject) {
      res.status(404).json({ success: false, error: 'Subject not found.' });
      return;
    }

    const user = await dataStore.findUserById(userId);
    const existingMaterial = await dataStore.findTopicLearningMaterial(userId, topicId);

    const aiStatus = aiService.getAIStatus();
    if (!aiStatus.configured) {
      res.status(400).json({
        success: false,
        configured: false,
        error: 'AI_KEY_NOT_CONFIGURED',
        message:
          'AI Assistant requires an API key. To generate AI notes, flashcards, flowcharts, and practice quizzes, please set GEMINI_API_KEY in server/.env.',
      });
      return;
    }

    try {
      const generated = await aiService.generateTopicMaterials({
        topicTitle: topic.title,
        subjectName: subject.name,
        difficulty: topic.difficulty || 'medium',
        importance: topic.importance || 3,
        understandingLevel: existingMaterial?.understandingLevel || 'intermediate',
        studentEducationLevel: user?.educationLevel || 'Undergraduate',
      });

      // Prepare flashcards with initial unreviewed status
      const flashcards = (generated.flashcards || []).map((f: any, idx: number) => ({
        id: f.id || `fc_${idx + 1}`,
        question: f.question,
        answer: f.answer,
        category: f.category || 'Core Concept',
        status: 'unreviewed',
        lastReviewedAt: null,
        reviewCount: 0,
      }));

      // Prepare quiz questions
      const quiz = (generated.quiz || []).map((q: any, idx: number) => ({
        id: q.id || `q_${idx + 1}`,
        question: q.question,
        options: q.options || [],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
        explanation: q.explanation || '',
        conceptTested: q.conceptTested || '',
      }));

      // Keep existing videos or fetch default videos
      const videos = await videoService.getTopicVideos(
        topic.title,
        subject.name,
        existingMaterial?.videos || []
      );

      const updatedMaterial = await dataStore.upsertTopicLearningMaterial(
        userId,
        topicId,
        subject._id.toString(),
        {
          aiNotes: {
            ...generated.aiNotes,
            savedAt: new Date(),
          },
          flashcards,
          flowchart: generated.flowchart || { mermaidCode: '', steps: [] },
          quiz,
          revision: generated.revision || {
            quickSummary: '',
            coreConcepts: [],
            formulaCheatSheet: [],
            commonMistakes: [],
          },
          videos,
          isGeneratedByAI: true,
          lastGeneratedAt: new Date(),
        }
      );

      // Record learning activity
      await dataStore.recordLearningActivity({
        userId,
        topicId,
        subjectId: subject._id,
        activityType: 'notes_saved',
        durationMinutes: 5,
        metadata: { title: topic.title },
      });

      res.status(200).json({
        success: true,
        message: 'AI learning materials successfully generated and saved.',
        material: updatedMaterial,
      });
    } catch (err: any) {
      console.error('[AIController] Material generation failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate learning materials via AI.',
      });
    }
  },

  /**
   * 4. AI Chat Tutor Endpoint
   */
  async chatWithTutor(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, error: 'Messages array is required.' });
      return;
    }

    const topic = await dataStore.findTopicByIdAndUser(topicId, userId);
    if (!topic) {
      res.status(404).json({ success: false, error: 'Topic not found.' });
      return;
    }

    const subject = await dataStore.findSubjectByIdAndUser(topic.subjectId.toString(), userId);
    if (!subject) {
      res.status(404).json({ success: false, error: 'Subject not found.' });
      return;
    }

    const aiStatus = aiService.getAIStatus();
    if (!aiStatus.configured) {
      res.status(400).json({
        success: false,
        configured: false,
        error: 'AI_KEY_NOT_CONFIGURED',
        message:
          'AI Assistant requires an API key. To chat with the AI tutor, please set GEMINI_API_KEY in server/.env.',
      });
      return;
    }

    const user = await dataStore.findUserById(userId);

    try {
      const reply = await aiService.chatWithTutor({
        topicTitle: topic.title,
        subjectName: subject.name,
        studentEducationLevel: user?.educationLevel,
        messages,
      });

      await dataStore.recordLearningActivity({
        userId,
        topicId,
        subjectId: subject._id,
        activityType: 'chat_session',
        durationMinutes: 2,
      });

      res.status(200).json({
        success: true,
        reply,
      });
    } catch (err: any) {
      console.error('[AIController] Chat tutor failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'AI Chat Tutor failed to respond.',
      });
    }
  },

  /**
   * 5. Save Custom / Edited Notes
   */
  async saveNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;
    const { summary, detailedExplanation, keyPoints, definitions, formulas, practicalExamples } = req.body;

    const topic = await dataStore.findTopicByIdAndUser(topicId, userId);
    if (!topic) {
      res.status(404).json({ success: false, error: 'Topic not found.' });
      return;
    }

    const updated = await dataStore.updateTopicNotes(userId, topicId, {
      summary,
      detailedExplanation,
      keyPoints,
      definitions,
      formulas,
      practicalExamples,
    });

    await dataStore.recordLearningActivity({
      userId,
      topicId,
      subjectId: topic.subjectId,
      activityType: 'notes_saved',
      durationMinutes: 5,
    });

    res.status(200).json({
      success: true,
      message: 'Notes successfully saved.',
      material: updated,
    });
  },

  /**
   * 6. Update Flashcard Review Status ("know" vs "needs_revision")
   */
  async reviewFlashcard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;
    const { flashcardId, status } = req.body;

    if (!flashcardId || !['unreviewed', 'know', 'needs_revision'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid flashcardId or status.' });
      return;
    }

    const topic = await dataStore.findTopicByIdAndUser(topicId, userId);
    if (!topic) {
      res.status(404).json({ success: false, error: 'Topic not found.' });
      return;
    }

    const updated = await dataStore.updateFlashcardStatus(userId, topicId, flashcardId, status);

    await dataStore.recordLearningActivity({
      userId,
      topicId,
      subjectId: topic.subjectId,
      activityType: 'flashcards_reviewed',
      durationMinutes: 1,
      metadata: { flashcardId, status },
    });

    res.status(200).json({
      success: true,
      material: updated,
    });
  },

  /**
   * 7. Toggle Video Watched
   */
  async toggleVideoWatched(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;
    const { videoUrl, watched } = req.body;

    if (!videoUrl) {
      res.status(400).json({ success: false, error: 'videoUrl is required.' });
      return;
    }

    const topic = await dataStore.findTopicByIdAndUser(topicId, userId);
    if (!topic) {
      res.status(404).json({ success: false, error: 'Topic not found.' });
      return;
    }

    const updated = await dataStore.toggleVideoWatched(userId, topicId, videoUrl, watched);

    if (watched) {
      await dataStore.recordLearningActivity({
        userId,
        topicId,
        subjectId: topic.subjectId,
        activityType: 'video_watched',
        durationMinutes: 15,
        metadata: { videoUrl },
      });
    }

    res.status(200).json({
      success: true,
      material: updated,
    });
  },

  /**
   * 8. Add Custom Video Link
   */
  async addCustomVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;
    const { url, title, channel } = req.body;

    if (!url) {
      res.status(400).json({ success: false, error: 'Video URL is required.' });
      return;
    }

    const parsed = videoService.parseYouTubeUrl(url);
    const videoDoc = {
      videoId: parsed?.videoId || 'custom',
      title: title || 'Custom Video Resource',
      channel: channel || 'External Resource',
      url,
      embedUrl: parsed?.embedUrl,
      duration: 'Student Added',
      watched: false,
      watchedAt: null,
    };

    const updated = await dataStore.addTopicVideo(userId, topicId, videoDoc);

    res.status(200).json({
      success: true,
      message: 'Video resource added successfully.',
      material: updated,
    });
  },

  /**
   * 9. Submit Quiz Attempt
   */
  async submitQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;
    const { answers, timeSpentSeconds } = req.body; // array of { questionId: string, selectedIndex: number }

    if (!Array.isArray(answers)) {
      res.status(400).json({ success: false, error: 'Answers array is required.' });
      return;
    }

    const topic = await dataStore.findTopicByIdAndUser(topicId, userId);
    if (!topic) {
      res.status(404).json({ success: false, error: 'Topic not found.' });
      return;
    }

    const material = await dataStore.findTopicLearningMaterial(userId, topicId);
    if (!material || !material.quiz || material.quiz.length === 0) {
      res.status(400).json({ success: false, error: 'No quiz questions available for this topic.' });
      return;
    }

    const questions: any[] = material.quiz;
    let score = 0;
    const weakConcepts: string[] = [];

    const gradedAnswers = answers.map((ans) => {
      const q = questions.find((item: any) => item.id === ans.questionId);
      if (!q) {
        return {
          questionId: ans.questionId,
          selectedIndex: ans.selectedIndex,
          isCorrect: false,
          conceptTested: '',
        };
      }

      const isCorrect = ans.selectedIndex === q.correctAnswerIndex;
      if (isCorrect) {
        score++;
      } else if (q.conceptTested) {
        weakConcepts.push(q.conceptTested);
      }

      return {
        questionId: ans.questionId,
        selectedIndex: ans.selectedIndex,
        isCorrect,
        conceptTested: q.conceptTested,
      };
    });

    const totalQuestions = questions.length;
    const accuracyPercent = Math.round((score / totalQuestions) * 100);

    const attempt = await dataStore.createQuizAttempt({
      userId,
      topicId,
      subjectId: topic.subjectId,
      score,
      totalQuestions,
      accuracyPercent,
      answers: gradedAnswers,
      weakConcepts,
      timeSpentSeconds: timeSpentSeconds || 0,
      completedAt: new Date(),
    });

    await dataStore.recordLearningActivity({
      userId,
      topicId,
      subjectId: topic.subjectId,
      activityType: 'quiz_completed',
      durationMinutes: Math.max(1, Math.round((timeSpentSeconds || 60) / 60)),
      metadata: { score, totalQuestions, accuracyPercent },
    });

    res.status(200).json({
      success: true,
      attempt,
      score,
      totalQuestions,
      accuracyPercent,
      weakConcepts,
    });
  },

  /**
   * 10. Update Student Understanding Level for Topic
   */
  async updateUnderstanding(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;
    const { understandingLevel } = req.body;

    if (!['beginner', 'intermediate', 'advanced'].includes(understandingLevel)) {
      res.status(400).json({ success: false, error: 'Invalid understanding level.' });
      return;
    }

    const updated = await dataStore.updateTopicUnderstanding(userId, topicId, understandingLevel);

    res.status(200).json({
      success: true,
      material: updated,
    });
  },

  /**
   * 11. Get AI Workspace & Learning Progress
   */
  async getProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const progress = await dataStore.getAIWorkspaceProgress(userId);

    res.status(200).json({
      success: true,
      progress,
    });
  },
};

