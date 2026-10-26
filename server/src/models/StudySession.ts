import mongoose, { Document, Schema, Model } from 'mongoose';

export type SessionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'missed'
  | 'cancelled'
  | 'rescheduled';

export type SessionType = 'study' | 'revision';

export interface IStudySession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  scheduledStart: Date;
  scheduledEnd: Date;
  plannedMinutes: number;
  actualMinutes: number;
  status: SessionStatus;
  sessionType: SessionType;
  completedAt?: Date | null;
  isOnTime?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyPlan',
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
    scheduledStart: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
    },
    plannedMinutes: {
      type: Number,
      required: true,
      min: 10,
    },
    actualMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'missed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
      index: true,
    },
    sessionType: {
      type: String,
      enum: ['study', 'revision'],
      default: 'study',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    isOnTime: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 1000,
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

StudySessionSchema.index({ userId: 1, scheduledStart: 1 });
StudySessionSchema.index({ userId: 1, status: 1 });
StudySessionSchema.index({ userId: 1, planId: 1, scheduledStart: 1 });

export const StudySessionModel: Model<IStudySession> =
  mongoose.models.StudySession || mongoose.model<IStudySession>('StudySession', StudySessionSchema);
