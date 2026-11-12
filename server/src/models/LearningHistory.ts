import mongoose, { Document, Schema, Model } from 'mongoose';

export type LearningActivityType =
  | 'video_watched'
  | 'notes_saved'
  | 'flashcards_reviewed'
  | 'quiz_completed'
  | 'topic_completed'
  | 'chat_session';

export interface ILearningHistory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  activityType: LearningActivityType;
  durationMinutes: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const LearningHistorySchema = new Schema<ILearningHistory>(
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
    activityType: {
      type: String,
      enum: [
        'video_watched',
        'notes_saved',
        'flashcards_reviewed',
        'quiz_completed',
        'topic_completed',
        'chat_session',
      ],
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
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

LearningHistorySchema.index({ userId: 1, createdAt: -1 });
LearningHistorySchema.index({ userId: 1, topicId: 1, activityType: 1 });

export const LearningHistoryModel: Model<ILearningHistory> =
  mongoose.models.LearningHistory ||
  mongoose.model<ILearningHistory>('LearningHistory', LearningHistorySchema);

