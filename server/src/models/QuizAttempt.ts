import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IQuizAttemptAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  conceptTested?: string;
}

export interface IQuizAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  score: number;
  totalQuestions: number;
  accuracyPercent: number;
  answers: IQuizAttemptAnswer[];
  weakConcepts: string[];
  timeSpentSeconds: number;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
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
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    accuracyPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    answers: [
      {
        questionId: { type: String, required: true },
        selectedIndex: { type: Number, required: true },
        isCorrect: { type: Boolean, required: true },
        conceptTested: { type: String, default: '' },
      },
    ],
    weakConcepts: [{ type: String }],
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
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

QuizAttemptSchema.index({ userId: 1, topicId: 1, completedAt: -1 });
QuizAttemptSchema.index({ userId: 1, completedAt: -1 });

export const QuizAttemptModel: Model<IQuizAttempt> =
  mongoose.models.QuizAttempt ||
  mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
