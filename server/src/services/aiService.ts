import { config } from '../config/env.js';

export interface AIStatus {
  configured: boolean;
  provider: 'gemini' | 'openai' | null;
  message: string;
}

export interface SuggestSyllabusInputs {
  learningGoal: string;
  customGoal?: string;
  educationLevel: string;
  academicYear?: string;
  subjectNames?: string[];
  syllabusText?: string;
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  knowledgeSummary?: string;
  dailyHours: number;
  daysOrWeeks?: string;
  targetDate?: string;
  examDate?: string;
  learningPreferences?: string[];
}

export interface ProposedTopic {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  importance: number;
  estimatedMinutes: number;
  learningObjectives?: string[];
}

export interface ProposedUnit {
  unitTitle: string;
  topics: ProposedTopic[];
}

export interface ProposedSubject {
  name: string;
  code?: string;
  importance: number;
  color: string;
  description?: string;
  examDate?: string | null;
  units: ProposedUnit[];
}

export interface SyllabusProposalResult {
  disclaimer: string;
  subjects: ProposedSubject[];
  estimatedTotalTopics: number;
  estimatedTotalHours: number;
  feasibilityAssessment: {
    status: 'feasible' | 'tight' | 'infeasible';
    score: number;
    explanation: string;
  };
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
   * 0. AI Onboarding Assistant: Propose Curriculum & Syllabus Breakdown
   */
  async suggestSyllabus(inputs: SuggestSyllabusInputs): Promise<SyllabusProposalResult> {
    const status = this.getAIStatus();
    if (status.configured) {
      try {
        const systemPrompt = `You are the StudyOS AI Academic Curriculum Architect.
A student needs a realistic, high-yield study curriculum designed for their learning goal.
RULES:
1. If the student provided syllabus text, extract subjects, units, chapters, and topics directly from that text.
2. If no syllabus was provided, propose a sound, realistic curriculum suited to their goal and knowledge level.
3. Structure each subject into 2 to 4 logical Units.
4. Each Unit must contain 2 to 4 actionable topics with estimatedMinutes (30 to 60 mins each), difficulty ("easy" | "medium" | "hard"), importance (1 to 5), and 2-3 learningObjectives.
5. Provide a clear disclaimer: "AI-suggested curriculum proposal for study planning. Please review, adjust, or confirm before generating your workspace."
6. Provide a realistic feasibility assessment:
   - status: "feasible" | "tight" | "infeasible"
   - score: 0 to 100
   - explanation: Clear assessment of whether the workload fits their daily hours and deadline.
Output strictly valid JSON with this schema:
{
  "disclaimer": "AI-suggested curriculum proposal for study planning. Please review, adjust, or confirm before generating your workspace.",
  "subjects": [
    {
      "name": "Subject Name",
      "code": "SUBJ",
      "importance": 5,
      "color": "#6366f1",
      "description": "Overview of subject",
      "units": [
        {
          "unitTitle": "Unit 1: Fundamentals",
          "topics": [
            {
              "title": "Topic Title",
              "description": "What the student will learn",
              "difficulty": "easy",
              "importance": 4,
              "estimatedMinutes": 45,
              "learningObjectives": ["Objective 1", "Objective 2"]
            }
          ]
        }
      ]
    }
  ],
  "estimatedTotalTopics": 12,
  "estimatedTotalHours": 10,
  "feasibilityAssessment": {
    "status": "feasible",
    "score": 95,
    "explanation": "Workload fits comfortably within your daily study allocation."
  }
}`;

        const userPrompt = `Student Onboarding Inputs:
Learning Goal: ${inputs.learningGoal}
Custom Goal / Notes: ${inputs.customGoal || 'None'}
Education Level: ${inputs.educationLevel} (${inputs.academicYear || 'General'})
Student Specified Subjects: ${inputs.subjectNames?.join(', ') || 'Not specified - propose suitable subjects'}
Syllabus Content: ${inputs.syllabusText || 'None provided - propose curriculum'}
Current Knowledge: ${inputs.knowledgeLevel} (${inputs.knowledgeSummary || 'Starting at this level'})
Daily Study Time: ${inputs.dailyHours} hours/day
Timeframe / Deadline: ${inputs.daysOrWeeks || inputs.targetDate || '30 days'}
Exam Date: ${inputs.examDate || 'None'}
Learning Preferences: ${inputs.learningPreferences?.join(', ') || 'All formats'}`;

        const result = await this.callAIJson<SyllabusProposalResult>(systemPrompt, userPrompt);
        if (result && Array.isArray(result.subjects) && result.subjects.length > 0) {
          result.disclaimer =
            'AI-suggested curriculum proposal for study planning. Please review, adjust, or confirm before generating your workspace.';
          return result;
        }
      } catch (err) {
        console.warn('[AIService] Live AI suggestSyllabus call failed, utilizing intelligent fallback curriculum generator:', err);
      }
    }

    // Intelligent Fallback Curriculum Generator
    return this.generateFallbackCurriculum(inputs);
  },

  /**
   * Helper: Generate structured curriculum when AI key is unavailable or for instant templates
   */
  generateFallbackCurriculum(inputs: SuggestSyllabusInputs): SyllabusProposalResult {
    const goalText = `${inputs.learningGoal} ${inputs.customGoal || ''} ${inputs.subjectNames?.join(' ') || ''}`.toLowerCase();
    const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    let subjects: ProposedSubject[] = [];

    // Case 1: Custom syllabus text provided by student
    if (inputs.syllabusText && inputs.syllabusText.trim().length > 20) {
      const rawLines = inputs.syllabusText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const parsedSubjectName =
        inputs.subjectNames?.[0] ||
        (inputs.customGoal ? inputs.customGoal.trim() : 'Academic Curriculum');

      let currentUnitTitle = 'Unit 1: Core Syllabus';
      let currentTopics: ProposedTopic[] = [];
      const units: ProposedUnit[] = [];

      rawLines.forEach((line) => {
        const clean = line.replace(/^[•\-*\d.]+\s*/, '').trim();
        if (/^(unit|chapter|module|section|part)\b/i.test(line)) {
          if (currentTopics.length > 0) {
            units.push({ unitTitle: currentUnitTitle, topics: currentTopics });
            currentTopics = [];
          }
          currentUnitTitle = clean;
        } else if (clean.length > 3) {
          currentTopics.push({
            title: clean.slice(0, 80),
            description: `Curriculum topic from student syllabus: ${clean}`,
            difficulty: inputs.knowledgeLevel === 'beginner' ? 'easy' : 'medium',
            importance: 4,
            estimatedMinutes: 45,
            learningObjectives: [`Master conceptual foundations of ${clean}`, `Solve practical exercise on ${clean}`],
          });
        }
      });

      if (currentTopics.length > 0) {
        units.push({ unitTitle: currentUnitTitle, topics: currentTopics });
      }

      subjects.push({
        name: parsedSubjectName,
        code: parsedSubjectName.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'SYLL',
        importance: 5,
        color: colors[0],
        description: 'Syllabus extracted directly from student document and structured into learning units.',
        examDate: inputs.examDate || null,
        units: units.length > 0 ? units : [
          {
            unitTitle: 'Unit 1: Foundational Topics',
            topics: [
              {
                title: 'Introduction & Scope',
                description: 'Foundational framework and learning scope',
                difficulty: 'easy',
                importance: 4,
                estimatedMinutes: 45,
              },
            ],
          },
        ],
      });
    }
    // Case 2: Programming / Technical Skills / Python
    else if (goalText.includes('python') || goalText.includes('program') || goalText.includes('code') || goalText.includes('develop')) {
      const isPython = goalText.includes('python');
      const subjName = isPython ? 'Python Programming' : 'Modern Software Development';

      subjects = [
        {
          name: subjName,
          code: isPython ? 'PY101' : 'CS101',
          importance: 5,
          color: colors[0],
          description: isPython
            ? 'From zero to proficient Python developer with problem solving and syntax mastery.'
            : 'Software programming foundations, clean syntax, and practical problem solving.',
          examDate: inputs.examDate || null,
          units: [
            {
              unitTitle: 'Unit 1: Language Syntax & Flow Control',
              topics: [
                {
                  title: 'Variables, Expressions & Data Types',
                  description: 'Integers, floats, strings, booleans, and variable assignment mechanics',
                  difficulty: 'easy',
                  importance: 5,
                  estimatedMinutes: 45,
                  learningObjectives: ['Understand memory storage and type inference', 'Perform type conversions safely'],
                },
                {
                  title: 'Conditional Statements & Branching',
                  description: 'If-elif-else logic, logical operators, and flow control',
                  difficulty: 'easy',
                  importance: 4,
                  estimatedMinutes: 45,
                  learningObjectives: ['Construct multi-branch decision trees', 'Avoid redundant Boolean checks'],
                },
                {
                  title: 'Loops & Iterations',
                  description: 'For and while loops, ranges, break, continue, and loop patterns',
                  difficulty: 'medium',
                  importance: 5,
                  estimatedMinutes: 50,
                  learningObjectives: ['Write clean iterations over sequences', 'Implement accumulation patterns'],
                },
              ],
            },
            {
              unitTitle: 'Unit 2: Data Structures & Collections',
              topics: [
                {
                  title: 'Lists, Tuples & Slicing',
                  description: 'Indexed sequences, immutability, slicing syntax, and list comprehensions',
                  difficulty: 'medium',
                  importance: 5,
                  estimatedMinutes: 50,
                  learningObjectives: ['Master slice notation [start:stop:step]', 'Leverage fast list comprehensions'],
                },
                {
                  title: 'Dictionaries & Sets',
                  description: 'Key-value associative mapping, hash tables, set operations, and uniqueness',
                  difficulty: 'medium',
                  importance: 5,
                  estimatedMinutes: 50,
                  learningObjectives: ['Perform O(1) dictionary lookups', 'Implement frequency counting algorithms'],
                },
              ],
            },
            {
              unitTitle: 'Unit 3: Functions, Modules & Real-World Projects',
              topics: [
                {
                  title: 'Modular Functions & Scope',
                  description: 'Parameters, default arguments, return values, and variable scope',
                  difficulty: 'medium',
                  importance: 4,
                  estimatedMinutes: 45,
                  learningObjectives: ['Write reusable, testable functions', 'Understand local vs global scope'],
                },
                {
                  title: 'Object-Oriented Programming (OOP)',
                  description: 'Classes, instances, attributes, methods, and inheritance',
                  difficulty: 'hard',
                  importance: 5,
                  estimatedMinutes: 60,
                  learningObjectives: ['Design modular domain models', 'Encapsulate state and behavior'],
                },
              ],
            },
          ],
        },
      ];
    }
    // Case 3: Competitive Exam / Aptitude
    else if (goalText.includes('competitive') || goalText.includes('exam') || goalText.includes('jee') || goalText.includes('gate') || goalText.includes('gre')) {
      subjects = [
        {
          name: 'Quantitative Aptitude & Problem Solving',
          code: 'QUANT',
          importance: 5,
          color: colors[0],
          description: 'High-speed mathematical methods, arithmetic, algebra, and geometry.',
          examDate: inputs.examDate || null,
          units: [
            {
              unitTitle: 'Unit 1: Number Systems & Arithmetic',
              topics: [
                {
                  title: 'Percentages, Ratios & Proportions',
                  description: 'Foundational calculations, conversion shortcuts, and word problems',
                  difficulty: 'easy',
                  importance: 5,
                  estimatedMinutes: 45,
                  learningObjectives: ['Calculate percentage changes rapidly', 'Solve multi-variable ratio distributions'],
                },
                {
                  title: 'Time, Speed, Distance & Work',
                  description: 'Relative speed, trains, pipes, cisterns, and rate equations',
                  difficulty: 'medium',
                  importance: 5,
                  estimatedMinutes: 50,
                  learningObjectives: ['Formulate rate equations', 'Apply unit-rate method for work completion'],
                },
              ],
            },
            {
              unitTitle: 'Unit 2: Algebra & Higher Maths',
              topics: [
                {
                  title: 'Quadratic Equations & Progressions',
                  description: 'Roots of equations, AP, GP, and algebraic factorizations',
                  difficulty: 'hard',
                  importance: 5,
                  estimatedMinutes: 60,
                  learningObjectives: ['Identify roots by discriminant analysis', 'Calculate nth term and series sums'],
                },
              ],
            },
          ],
        },
        {
          name: 'Logical Reasoning & Data Interpretation',
          code: 'LOGIC',
          importance: 4,
          color: colors[1],
          description: 'Syllogisms, seating arrangements, coding-decoding, and charts.',
          examDate: inputs.examDate || null,
          units: [
            {
              unitTitle: 'Unit 1: Analytical Reasoning',
              topics: [
                {
                  title: 'Linear & Circular Seating Arrangements',
                  description: 'Step-by-step constraint satisfaction and grid diagrams',
                  difficulty: 'medium',
                  importance: 5,
                  estimatedMinutes: 45,
                  learningObjectives: ['Eliminate inconsistent possibilities', 'Draft definitive arrangement grids'],
                },
                {
                  title: 'Syllogisms & Venn Logic',
                  description: 'Deductive reasoning and Venn diagram test rules',
                  difficulty: 'medium',
                  importance: 4,
                  estimatedMinutes: 45,
                  learningObjectives: ['Verify valid conclusions from premise statements', 'Avoid common deductive fallacies'],
                },
              ],
            },
          ],
        },
      ];
    }
    // Case 4: Default Academic Subjects (College or School)
    else {
      const userSubjs = inputs.subjectNames && inputs.subjectNames.length > 0
        ? inputs.subjectNames
        : ['Computer Architecture', 'Data Structures & Algorithms'];

      subjects = userSubjs.map((name, i) => ({
        name,
        code: name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || `SUB${i + 1}`,
        importance: 4,
        color: colors[i % colors.length],
        description: `Academic syllabus for ${name}`,
        examDate: inputs.examDate || null,
        units: [
          {
            unitTitle: 'Unit 1: Core Fundamentals & Principles',
            topics: [
              {
                title: `${name} — Foundational Concepts`,
                description: `Essential principles, definitions, and scope of ${name}`,
                difficulty: 'easy',
                importance: 4,
                estimatedMinutes: 45,
                learningObjectives: [`Understand basic definitions and terminology`, `Identify core theorems and frameworks`],
              },
              {
                title: `${name} — Methodologies & Operations`,
                description: `Operating procedures, key equations, and standard models`,
                difficulty: 'medium',
                importance: 5,
                estimatedMinutes: 50,
                learningObjectives: [`Analyze standard algorithmic/logical steps`, `Apply core formulas to sample problems`],
              },
            ],
          },
          {
            unitTitle: 'Unit 2: Advanced Topics & Exam Applications',
            topics: [
              {
                title: `${name} — High-Yield Exam Problems`,
                description: `Complex case studies, proofs, and comprehensive problem sets`,
                difficulty: 'hard',
                importance: 5,
                estimatedMinutes: 60,
                learningObjectives: [`Synthesize multiple subtopics into solutions`, `Master time-constrained problem resolution`],
              },
            ],
          },
        ],
      }));
    }

    // Calculate metrics
    let totalTopics = 0;
    let totalMinutes = 0;
    subjects.forEach((s) => {
      s.units.forEach((u) => {
        totalTopics += u.topics.length;
        u.topics.forEach((t) => {
          totalMinutes += t.estimatedMinutes;
        });
      });
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const dailyStudyMinutes = (inputs.dailyHours || 3) * 60;
    const daysRequired = Math.ceil(totalMinutes / (dailyStudyMinutes * 0.8));

    return {
      disclaimer:
        'AI-suggested curriculum proposal for study planning. Please review, adjust, or confirm before generating your workspace.',
      subjects,
      estimatedTotalTopics: totalTopics,
      estimatedTotalHours: totalHours,
      feasibilityAssessment: {
        status: daysRequired <= 30 ? 'feasible' : 'tight',
        score: daysRequired <= 30 ? 95 : 75,
        explanation: `Curriculum spans ${totalTopics} bite-sized topics (~${totalHours} study hours). At ${inputs.dailyHours || 3} hours/day, you will complete the full syllabus in approximately ${daysRequired} study days with built-in revision.`,
      },
    };
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

