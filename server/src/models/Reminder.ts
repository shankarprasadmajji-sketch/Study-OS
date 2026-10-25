import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IReminder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  remindAt: Date;
  channel: 'in_app' | 'email';
  status: 'pending' | 'sent' | 'dismissed';
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema = new Schema<IReminder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'StudySession',
      required: true,
    },
    remindAt: {
      type: Date,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email'],
      default: 'in_app',
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'dismissed'],
      default: 'pending',
    },
    sentAt: {
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

ReminderSchema.index({ userId: 1, remindAt: 1, status: 1 });

export const ReminderModel: Model<IReminder> =
  mongoose.models.Reminder || mongoose.model<IReminder>('Reminder', ReminderSchema);
