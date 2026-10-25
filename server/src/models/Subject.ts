import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  code?: string;
  examDate?: Date | null;
  importance: number; // 1 (low) to 5 (critical)
  color: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [120, 'Subject name cannot exceed 120 characters'],
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Subject code cannot exceed 20 characters'],
    },
    examDate: {
      type: Date,
      default: null,
    },
    importance: {
      type: Number,
      default: 3,
      min: [1, 'Importance must be at least 1'],
      max: [5, 'Importance cannot exceed 5'],
    },
    color: {
      type: String,
      default: '#4f46e5',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
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

SubjectSchema.index({ userId: 1, name: 1 });
SubjectSchema.index({ userId: 1, examDate: 1 });

export const SubjectModel: Model<ISubject> =
  mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
