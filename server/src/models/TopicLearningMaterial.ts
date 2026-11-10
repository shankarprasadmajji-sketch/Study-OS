import mongoose, { Document, Schema, Model } from 'mongoose';

export type UnderstandingLevel = 'beginner' | 'intermediate' | 'advanced';
export type FlashcardStatus = 'unreviewed' | 'know' | 'needs_revision';

export interface IVideoResource {
  videoId?: string;
  title: string;
  channel: string;
  url: string;
  embedUrl?: string;
  duration?: string;
  watched: boolean;
  watchedAt?: Date | null;
}

export interface IFlashcard {
  id: string;
  question: string;
  answer: string;
  category?: string;
  status: FlashcardStatus;
  lastReviewedAt?: Date | null;
  reviewCount: number;
}

export interface IFlowchartStep {
  stepNumber: number;
  title: string;
  description: string;
  keyInsight?: string;
}

export interface IQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  conceptTested: string;
}

export interface IAiNotes {
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  definitions: Array<{ term: string; definition: string }>;
  formulas: string[];
  practicalExamples: string[];
  savedAt?: Date | null;
}

export interface IRevisionSection {
  quickSummary: string;
  coreConcepts: string[];
  formulaCheatSheet: string[];
  commonMistakes: string[];
  nextRevisionDate?: Date | null;
}

export interface ITopicLearningMaterial extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  understandingLevel: UnderstandingLevel;
  aiNotes: IAiNotes;
  videos: IVideoResource[];
  flashcards: IFlashcard[];
  flowchart: {
    mermaidCode: string;
    steps: IFlowchartStep[];
  };
  quiz: IQuizQuestion[];
  revision: IRevisionSection;
  isGeneratedByAI: boolean;
  lastGeneratedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TopicLearningMaterialSchema = new Schema<ITopicLearningMaterial>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    understandingLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    aiNotes: {
      summary: { type: String, default: '' },
      detailedExplanation: { type: String, default: '' },
      keyPoints: [{ type: String }],
      definitions: [
        {
          term: String,
          definition: String,
        },
      ],
      formulas: [{ type: String }],
      practicalExamples: [{ type: String }],
      savedAt: { type: Date, default: null },
    },
    videos: [
      {
        videoId: String,
        title: { type: String, required: true },
        channel: { type: String, default: '' },
        url: { type: String, required: true },
        embedUrl: String,
        duration: String,
        watched: { type: Boolean, default: false },
        watchedAt: { type: Date, default: null },
      },
    ],
    flashcards: [
      {
        id: { type: String, required: true },
        question: { type: String, required: true },
        answer: { type: String, required: true },
        category: { type: String, default: 'Concept' },
        status: {
          type: String,
          enum: ['unreviewed', 'know', 'needs_revision'],
          default: 'unreviewed',
        },
        lastReviewedAt: { type: Date, default: null },
        reviewCount: { type: Number, default: 0 },
      },
    ],
    flowchart: {
      mermaidCode: { type: String, default: '' },
      steps: [
        {
          stepNumber: Number,
          title: String,
          description: String,
          keyInsight: String,
        },
      ],
    },
    quiz: [
      {
        id: { type: String, required: true },
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswerIndex: { type: Number, required: true },
        explanation: { type: String, default: '' },
        conceptTested: { type: String, default: '' },
      },
    ],
    revision: {
      quickSummary: { type: String, default: '' },
      coreConcepts: [{ type: String }],
      formulaCheatSheet: [{ type: String }],
      commonMistakes: [{ type: String }],
      nextRevisionDate: { type: Date, default: null },
    },
    isGeneratedByAI: {
      type: Boolean,
      default: false,
    },
    lastGeneratedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Each user has at most one learning material document per topic
TopicLearningMaterialSchema.index({ userId: 1, topicId: 1 }, { unique: true });

export const TopicLearningMaterialModel: Model<ITopicLearningMaterial> =
  mongoose.models.TopicLearningMaterial ||
  mongoose.model<ITopicLearningMaterial>('TopicLearningMaterial', TopicLearningMaterialSchema);
