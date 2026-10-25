import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITopicProgress extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  status: 'not_started' | 'in_progress' | 'completed';
  actualMinutes: number;
  completedAt?: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TopicProgressSchema = new Schema<ITopicProgress>(
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
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    actualMinutes: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
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

TopicProgressSchema.index({ userId: 1, topicId: 1 });

export const TopicProgressModel: Model<ITopicProgress> =
  mongoose.models.TopicProgress ||
  mongoose.model<ITopicProgress>('TopicProgress', TopicProgressSchema);
