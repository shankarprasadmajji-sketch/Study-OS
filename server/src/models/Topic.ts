import mongoose, { Document, Schema, Model } from 'mongoose';

export type TopicDifficulty = 'easy' | 'medium' | 'hard';
export type TopicStatus = 'not_started' | 'in_progress' | 'completed';

export interface ITopic extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  difficulty: TopicDifficulty;
  importance: number; // 1 to 5
  estimatedMinutes: number;
  status: TopicStatus;
  position: number;
  prerequisiteTopicIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
      maxlength: [180, 'Title cannot exceed 180 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [800, 'Description cannot exceed 800 characters'],
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    importance: {
      type: Number,
      default: 3,
      min: 1,
      max: 5,
    },
    estimatedMinutes: {
      type: Number,
      required: true,
      min: [10, 'Estimated minutes must be at least 10'],
      max: [720, 'Estimated minutes cannot exceed 12 hours (720 min)'],
      default: 60,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
      index: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    prerequisiteTopicIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
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

TopicSchema.index({ userId: 1, subjectId: 1, status: 1 });
TopicSchema.index({ userId: 1, position: 1 });

export const TopicModel: Model<ITopic> =
  mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);
