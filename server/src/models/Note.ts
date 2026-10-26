import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INote extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  subjectId?: mongoose.Types.ObjectId | null;
  topicId?: mongoose.Types.ObjectId | null;
  sessionId?: mongoose.Types.ObjectId | null;
  isPinned: boolean;
  color?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: 'Untitled Note',
    },
    content: {
      type: String,
      default: '',
      maxlength: [20000, 'Note content cannot exceed 20,000 characters'],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
      index: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'StudySession',
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    color: {
      type: String,
      default: 'default',
    },
    tags: {
      type: [String],
      default: [],
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

NoteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });
NoteSchema.index({ userId: 1, subjectId: 1 });
NoteSchema.index({ userId: 1, topicId: 1 });

export const NoteModel: Model<INote> =
  mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
