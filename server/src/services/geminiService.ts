import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';

export interface GeminiStatus {
  configured: boolean;
  model: string;
  maskedKey: string | null;
  provider: 'gemini' | null;
  message: string;
}

export interface WorkspaceGenerationInput {
  educationLevel?: string;
  course?: string;
  courseDegree?: string;
  semester?: string;
  academicYear?: string;
  subjects?: Array<{
    name: string;
    code?: string;
    units?: Array<{
      unitTitle: string;
      topics?: Array<{
        title: string;
        description?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
        importance?: number;
        estimatedMinutes?: number;
      }>;
    }>;
  }>;
  syllabus?: string;
  syllabusText?: string;
  knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
  currentKnowledge?: 'beginner' | 'intermediate' | 'advanced';
  knowledgeSummary?: string;
  dailyHours?: number;
  targetDate?: string;
  examDate?: string;
  learningDepth?: 'briefly' | 'moderately' | 'deeply';
  learningPreferences?: string[];
  learningGoal?: string;
  preferredSessionMinutes?: number;
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  availableDays?: number[];
}

export interface GeneratedWorkspaceAIResponse {
  courseOverview: string;
  subjects: Array<{
    name: string;
    code: string;
    importance: number;
    color: string;
    description: string;
    units: Array<{
      unitTitle: string;
      topics: Array<{
        title: string;
        description: string;
        difficulty: 'easy' | 'medium' | 'hard';
        importance: number;
        estimatedMinutes: number;
        learningObjectives: string[];
        subtopics: string[];
        starterNote: {
          title: string;
          summary: string;
          content: string;
          tags: string[];
        };
      }>;
    }>;
  }>;
  weeklyScheduleRecommendation: {
    recommendedDailyMinutes: number;
    studyStrategy: string;
    focusAreas: string[];
  };
  studyPlanRoadmap: {
    title: string;
    description: string;
    milestones: Array<{
      weekNumber: number;
      goals: string[];
    }>;
  };
}

class GeminiService {
  private client: GoogleGenAI | null = null;
  private primaryModel: string;
  private fallbackModels: string[];

  constructor() {
    this.primaryModel = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
    this.fallbackModels = ['gemini-1.5-flash', 'gemini-2.0-flash'];
  }

  /**
   * Retrieves the current API key safely from environment
   */
  private getApiKey(): string | null {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (key && key.trim().length > 0) {
      return key.trim();
    }
    return null;
  }

  /**
   * Instantiates or returns the singleton GoogleGenAI client
   */
  private getClient(): GoogleGenAI {
    const key = this.getApiKey();
    if (!key) {
      throw new Error(
        'Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables.'
      );
    }
    if (!this.client) {
this.client = new GoogleGenAI({
  apiKey: key,
  apiVersion: 'v1beta'
});    }
    return this.client;
  }

  /**
   * Returns sanitized Gemini configuration status without exposing credentials
   */
  public getStatus(): GeminiStatus {
    const key = this.getApiKey();
    if (!key) {
      return {
        configured: false,
        model: this.primaryModel,
        maskedKey: null,
        provider: null,
        message: 'GEMINI_API_KEY is not set. Please provide it in Render environment variables.',
      };
    }

    const masked =
      key.length > 8
        ? `${key.slice(0, 4)}...${key.slice(-4)}`
        : '****';

    return {
      configured: true,
      model: this.primaryModel,
      maskedKey: masked,
      provider: 'gemini',
      message: `Google Gemini AI service initialized (model: ${this.primaryModel}).`,
    };
  }

  /**
   * Safe execution wrapper that tries the primary model and falls back if unavailable
   */
  private async executeWithFallback<T>(
    operation: (modelName: string) => Promise<T>
  ): Promise<T> {
    const candidateModels = [
      this.primaryModel,
      ...this.fallbackModels.filter((m) => m !== this.primaryModel),
    ];

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        return await operation(model);
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '').toLowerCase();
        // If error indicates model not found or unsupported, attempt fallback
        if (
          msg.includes('not found') ||
          msg.includes('404') ||
          msg.includes('unsupported model') ||
          msg.includes('is not available')
        ) {
          console.warn(`[GeminiService] Model '${model}' unavailable. Attempting fallback...`);
          continue;
        }
        // Otherwise, rethrow auth or server errors immediately
        throw err;
      }
    }

    throw lastError || new Error('Failed to generate content with Gemini models.');
  }

  /**
   * Generates structured JSON output using official @google/genai SDK
   */
  public async generateJson<T>(systemInstruction: string, prompt: string): Promise<T> {
    const ai = this.getClient();

    return this.executeWithFallback<T>(async (modelName) => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error('Gemini API returned an empty response.');
      }

      try {
        return JSON.parse(text) as T;
      } catch (parseErr: any) {
        // Attempt cleaning markdown fences if model inadvertently wrapped output
        const cleaned = text
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        return JSON.parse(cleaned) as T;
      }
    });
  }

  /**
   * Generates a complete study workspace with subjects, units, topics, subtopics,
   * timetable recommendations, AI study plan, and depth-tuned starter notes.
   */
  public async generateStudyWorkspace(
    input: WorkspaceGenerationInput
  ): Promise<GeneratedWorkspaceAIResponse> {
    const depth = input.learningDepth || 'moderately';
    const education = input.educationLevel || 'Undergraduate';
    const course = input.courseDegree || input.course || 'General Curriculum';
    const year = input.academicYear || input.semester || 'Semester 1';
    const dailyHours = input.dailyHours || 3;
    const knowledge = input.knowledgeLevel || input.currentKnowledge || 'beginner';
    const preferences = (input.learningPreferences || []).join(', ') || 'notes, examples, flashcards, quizzes';

    const systemInstruction = `You are the Lead Academic AI Architect of StudyOS.
Your goal is to construct a rigorous, personalized academic workspace for a student.
You must return a valid, strictly compliant JSON object containing:
1. "courseOverview": A 2-sentence summary of the curriculum and pacing strategy.
2. "subjects": An array of subjects (minimum 1, maximum 4). Each subject must have:
   - "name": string
   - "code": string (short code like CS201, PY101)
   - "importance": integer from 1 to 5
   - "color": hex color code (e.g. "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6")
   - "description": string overview
   - "units": array of units (2-4 units per subject), each with:
     - "unitTitle": string (e.g. "Unit 1: Fundamentals")
     - "topics": array of topics (2-4 topics per unit), each with:
       - "title": string
       - "description": string
       - "difficulty": "easy" | "medium" | "hard"
       - "importance": integer 1 to 5
       - "estimatedMinutes": number (30 to 60)
       - "learningObjectives": array of 2-3 specific outcome strings
       - "subtopics": array of 2-4 subtopic strings
       - "starterNote": An object with:
         - "title": string matching topic title
         - "summary": 1-2 sentence core insight
         - "content": A structured Markdown study note formatted according to the student's learning depth (${depth}):
           * "briefly": High-yield formulas, key definitions, bulleted summaries.
           * "moderately": Balanced conceptual explanation, key intuition, practical examples, formulas, common pitfalls.
           * "deeply": In-depth theoretical derivations, foundational theorems, edge cases, step-by-step code or mathematical analysis, advanced review problems.
         - "tags": array of 2-4 keyword tags
3. "weeklyScheduleRecommendation": An object with:
   - "recommendedDailyMinutes": integer (dailyHours * 60)
   - "studyStrategy": string detailing active recall, pomodoro breaks, and revision cadence
   - "focusAreas": array of high-priority concepts for early mastery
4. "studyPlanRoadmap": An object with:
   - "title": string
   - "description": string
   - "milestones": array of 2 to 4 weekly milestone objects with "weekNumber" and "goals" (array of strings)

Adhere strictly to standard academic curricula for ${course} (${education}, ${year}).`;

    const userPrompt = `Student Profile & Workspace Requirements:
- Education Level: ${education}
- Course / Degree: ${course}
- Year / Semester: ${year}
- Daily Study Time: ${dailyHours} hours/day
- Target Completion Date: ${input.targetDate || 'Flexible'}
- Exam Date: ${input.examDate || 'None specified'}
- Knowledge Level: ${knowledge}
- Specific Knowledge Context: ${input.knowledgeSummary || 'None provided'}
- Learning Depth: ${depth.toUpperCase()}
- Preferred Formats: ${preferences}
- Explicit Subjects: ${
      Array.isArray(input.subjects) && input.subjects.length > 0
        ? input.subjects.map((s) => s.name).join(', ')
        : 'Suggest the standard core subjects for this course'
    }
- Custom Syllabus or Raw Input: ${input.syllabus || input.syllabusText || 'None provided'}`;

    return this.generateJson<GeneratedWorkspaceAIResponse>(systemInstruction, userPrompt);
  }
}

export const geminiService = new GeminiService();
