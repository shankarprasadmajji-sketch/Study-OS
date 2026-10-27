import mongoose, { Document, Schema, Model } from 'mongoose';

export type StudyPlanStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface IFeasibilityInfo {
  status: 'feasible' | 'tight' | 'infeasible';
  score: number; // 0 to 100
  totalTopics: number;
  scheduledTopics: number;
  unscheduledTopics: Array<{
    topicId: string;
    title: string;
    subjectName?: string;
    neededMinutes?: number;
    reason: string;
  }>;
  warnings: string[];
  explanations: string[];
}

export interface IStudyPlan extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  status: StudyPlanStatus;
  algorithmVersion: string;
  feasibility: IFeasibilityInfo;
  createdAt: Date;
  updatedAt: Date;
}

const FeasibilitySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['feasible', 'tight', 'infeasible'],
      default: 'feasible',
    },
    score: {
      type: Number,
      default: 100,
    },
    totalTopics: {
      type: Number,
      default: 0,
    },
    scheduledTopics: {
      type: Number,
      default: 0,
    },
    unscheduledTopics: [
      {
        topicId: String,
        title: String,
        subjectName: String,
        neededMinutes: Number,
        reason: String,
      },
    ],
    warnings: [String],
    explanations: [String],
  },
  { _id: false }
);

const StudyPlanSchema = new Schema<IStudyPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: 'My Academic Semester Plan',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'archived'],
      default: 'draft',
      index: true,
    },
    algorithmVersion: {
      type: String,
      default: '1.0.0',
    },
    feasibility: {
      type: FeasibilitySchema,
      default: () => ({
        status: 'feasible',
        score: 100,
        totalTopics: 0,
        scheduledTopics: 0,
        unscheduledTopics: [],
        warnings: [],
        explanations: [],
      }),
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

StudyPlanSchema.index({ userId: 1, status: 1 });

export const StudyPlanModel: Model<IStudyPlan> =
  mongoose.models.StudyPlan || mongoose.model<IStudyPlan>('StudyPlan', StudyPlanSchema);
