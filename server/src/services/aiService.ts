import { config } from '../config/env.js';

export interface AIStatus {
  configured: boolean;
  provider: 'gemini' | 'openai' | null;
  message: string;
}

export interface StudentPlanInputs {
  studentProfile: {
    name: string;
    educationLevel?: string;
    academicYear?: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    code?: string;
    importance: number;
    examDate?: Date | null;
  }>;
  topics: Array<{
    id: string;
    subjectId: string;
    title: string;
    description?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    importance: number;
    estimatedMinutes: number;
    status: string;
    understandingLevel?: 'beginner' | 'intermediate' | 'advanced';
  }>;
  availableDays: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>;
  startDate: string;
  endDate: string;
  preferredSessionMinutes: number;
  breakMinutes: number;
}

export interface GeneratedPlanResult {
  feasibility: {
    status: 'feasible' | 'tight' | 'infeasible';
    score: number;
    warnings: string[];
    explanations: string[];
    scheduledTopics: number;
    totalTopics: number;
    unscheduledTopics: Array<{
      topicId: string;
      title: string;
      subjectName?: string;
      neededMinutes?: number;
      reason: string;
    }>;
  };
  breakdowns: Array<{
    topicId: string;
    subjectId: string;
    title: string;
    units: Array<{
      unitTitle: string;
      minutes: number;
      focus: string;
    }>;
  }>;
  sessions: Array<{
    topicId: string;
    subjectId: string;
    title: string;
    scheduledStart: string;
    scheduledEnd: string;
    plannedMinutes: number;
    sessionType: 'study' | 'revision';
    priorityExplanation: string;
  }>;
  learningRecommendations: string[];
}

export const aiService = {
  /**
   * Get current AI provider configuration status
   */
  getAIStatus(): AIStatus {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey && geminiKey.trim().length > 0) {
      return {
        configured: true,
        provider: 'gemini',
        message: 'Google Gemini AI assistant is connected and ready.',
      };
    }

    if (openaiKey && openaiKey.trim().length > 0) {
      return {
        configured: true,
        provider: 'openai',
        message: 'OpenAI assistant is connected and ready.',
      };
    }

    return {
      configured: false,
      provider: null,
      message:
        'AI Assistant requires an API key. To enable live AI generation, add GEMINI_API_KEY in server/.env.',
    };
  },

  /**
   * Helper to execute AI LLM query with JSON output
   */
  async callAIJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemPrompt}\n\nStrict requirement: Output valid JSON only, without markdown fences or extraneous text.\n\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const json: any = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini API returned an empty response.');
      }

      return JSON.parse(rawText) as T;
    }

    if (openaiKey) {
      const url = 'https://api.openai.com/v1/chat/completions';
      const payload = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `${systemPrompt}\nOutput valid JSON only.` },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey.trim()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const json: any = await response.json();
      const rawText = json.choices?.[0]?.message?.content;
      return JSON.parse(rawText) as T;
    }

    throw new Error('AI_KEY_NOT_CONFIGURED');
  },

  /**
   * Helper to execute freeform AI chat completion
   */
  async callAIChat(systemPrompt: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`;

      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // Prepend system instructions to the first turn
      if (contents.length > 0 && contents[0].role === 'user') {
        contents[0].parts[0].text = `[SYSTEM INSTRUCTIONS: ${systemPrompt}]\n\n${contents[0].parts[0].text}`;
      } else {
        contents.unshift({
          role: 'user',
          parts: [{ text: `[SYSTEM INSTRUCTIONS: ${systemPrompt}] Please confirm you understand.` }],
        });
      }

      const payload = {
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini Chat error (${response.status}): ${errText}`);
      }

      const json: any = await response.json();
      return json.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    }

    if (openaiKey) {
      const url = 'https://api.openai.com/v1/chat/completions';
      const payload = {
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.4,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey.trim()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI Chat error (${response.status}): ${errText}`);
      }

      const json: any = await response.json();
      return json.choices?.[0]?.message?.content || 'No response generated.';
    }

    throw new Error('AI_KEY_NOT_CONFIGURED');
  },

  /**
   * 1. Generate Intelligent AI Study Plan
   */
  async generateAIStudyPlan(inputs: StudentPlanInputs): Promise<GeneratedPlanResult> {
    const status = this.getAIStatus();
    if (!status.configured) {
      throw new Error('AI_KEY_NOT_CONFIGURED');
    }

    const systemPrompt = `You are the StudyOS AI Academic Planning Director.
Your task is to analyze an authentic student's academic curriculum and generate a personalized study plan.
RULES:
1. Deconstruct large syllabus topics into smaller bite-sized learning units (25-50 mins each).
2. Prioritize topics using:
   - Exam deadline urgency (closer exam = highest priority)
   - Student's current understanding (beginner/low understanding = prioritize higher)
   - Topic difficulty (hard topics need earlier focus)
   - Academic importance (rated 1 to 5)
3. Allocate realistic daily study sessions and spaced revision sessions.
4. Never double-book or overlap sessions.
5. Respect the student's available study days and preferred session duration.
6. Provide an honest, realistic feasibility assessment:
   - status: "feasible" | "tight" | "infeasible"
   - score: 0 to 100
   - honest warnings if the syllabus cannot be completed within the horizon.
Output must be strictly valid JSON matching this schema:
{
  "feasibility": {
    "status": "feasible" | "tight" | "infeasible",
    "score": number,
    "warnings": string[],
    "explanations": string[],
    "scheduledTopics": number,
    "totalTopics": number,
    "unscheduledTopics": [{ "topicId": string, "title": string, "subjectName": string, "neededMinutes": number, "reason": string }]
  },
  "breakdowns": [{ "topicId": string, "subjectId": string, "title": string, "units": [{ "unitTitle": string, "minutes": number, "focus": string }] }],
  "sessions": [{ "topicId": string, "subjectId": string, "title": string, "scheduledStart": "YYYY-MM-DDTHH:mm:ssZ", "scheduledEnd": "YYYY-MM-DDTHH:mm:ssZ", "plannedMinutes": number, "sessionType": "study" | "revision", "priorityExplanation": string }],
  "learningRecommendations": string[]
}`;

    const userPrompt = `Student Data:
Profile: ${JSON.stringify(inputs.studentProfile)}
Subjects: ${JSON.stringify(inputs.subjects)}
Topics: ${JSON.stringify(inputs.topics)}
Available Schedule: ${JSON.stringify(inputs.availableDays)}
Planning Horizon: ${inputs.startDate} to ${inputs.endDate}
Preferred Session Minutes: ${inputs.preferredSessionMinutes} min
Break Duration: ${inputs.breakMinutes} min`;

    return this.callAIJson<GeneratedPlanResult>(systemPrompt, userPrompt);
  },

  /**
   * 2. Generate Comprehensive Topic Learning Materials
   */
  async generateTopicMaterials(params: {
    topicTitle: string;
    subjectName: string;
    difficulty: string;
    importance: number;
    understandingLevel: string;
    studentEducationLevel?: string;
  }) {
    const status = this.getAIStatus();
    if (!status.configured) {
      throw new Error('AI_KEY_NOT_CONFIGURED');
    }

    const systemPrompt = `You are a world-class academic tutor and pedagogical curriculum designer for StudyOS.
Create rich, high-yield learning materials for the following subject topic.
Format strictly in JSON with this exact structure:
{
  "aiNotes": {
    "summary": "Clear, direct conceptual summary in simple English (2-3 paragraphs)",
    "detailedExplanation": "Deep-dive breakdown explaining the topic step-by-step, including practical applications and intuition",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
    "definitions": [
      { "term": "Core Term 1", "definition": "Clear concise definition" },
      { "term": "Core Term 2", "definition": "Clear concise definition" }
    ],
    "formulas": ["Formula or essential rule 1", "Formula 2"],
    "practicalExamples": ["Concrete real-world example 1", "Concrete real-world example 2"]
  },
  "flashcards": [
    {
      "id": "fc_1",
      "question": "Question or prompt testing understanding",
      "answer": "Clear, complete answer",
      "category": "Core Concept" | "Formula" | "Definition" | "Application"
    }
  ],
  "flowchart": {
    "mermaidCode": "flowchart TD\\n  A[Start/Topic] --> B[Key Phase 1]\\n  B --> C[Decision/Process]\\n  C --> D[Outcome/Solution]",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Phase title",
        "description": "What happens here",
        "keyInsight": "Key takeaway"
      }
    ]
  },
  "quiz": [
    {
      "id": "q_1",
      "question": "Realistic multiple choice question testing conceptual mastery",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation of why the correct option is right and others are wrong",
      "conceptTested": "Name of concept tested"
    }
  ],
  "revision": {
    "quickSummary": "High-yield 2-minute revision bullet summary",
    "coreConcepts": ["Must-remember concept 1", "Must-remember concept 2"],
    "formulaCheatSheet": ["Quick reference formula/rule 1"],
    "commonMistakes": ["Common misconception or exam pitfall to avoid 1", "Pitfall 2"]
  }
}
Generate at least 6 flashcards, at least 5 quiz questions, and a valid Mermaid flowchart.
Use simple, accessible English.`;

    const userPrompt = `Subject: ${params.subjectName}
Topic: ${params.topicTitle}
Difficulty: ${params.difficulty}
Importance: ${params.importance}/5
Student's Current Understanding: ${params.understandingLevel}
Education Level: ${params.studentEducationLevel || 'Undergraduate'}`;

    return this.callAIJson<any>(systemPrompt, userPrompt);
  },

  /**
   * 3. AI Chat Tutor
   */
  async chatWithTutor(params: {
    topicTitle: string;
    subjectName: string;
    studentEducationLevel?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<string> {
    const status = this.getAIStatus();
    if (!status.configured) {
      throw new Error('AI_KEY_NOT_CONFIGURED');
    }

    const systemPrompt = `You are the StudyOS AI Chat Tutor for the subject "${params.subjectName}" and the specific topic "${params.topicTitle}".
Student Level: ${params.studentEducationLevel || 'Student'}.
Your role:
- Help the student master THIS specific topic.
- Explain concepts using simple English, intuitive metaphors, and clear examples.
- Break difficult ideas down into step-by-step reasoning.
- If asked for code, formulas, or summaries, format cleanly in Markdown.
- If the student asks something completely unrelated to academic learning, politely bring the focus back to ${params.topicTitle}.
- Be supportive, encouraging, and pedagogically rigorous.`;

    return this.callAIChat(systemPrompt, params.messages);
  },
};
