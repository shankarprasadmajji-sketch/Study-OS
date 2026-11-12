import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUserPreferences {
  preferredSessionMinutes: number;
  breakMinutes: number;
  dailyTargetHours: number;
  reminderNotifications: boolean;
  learningDepth?: 'briefly' | 'moderately' | 'deeply';
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  availableDays?: number[];
  learningStyles?: string[];
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatar?: string;
  authProvider?: 'local' | 'google';
  educationLevel?: string;
  courseDegree?: string;
  academicYear?: string;
  learningGoal?: string;
  timezone: string;
  onboardingCompleted: boolean;
  theme: 'light' | 'dark' | 'system';
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: false,
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    educationLevel: {
      type: String,
      default: 'Undergraduate',
      trim: true,
    },
    courseDegree: {
      type: String,
      default: '',
      trim: true,
    },
    academicYear: {
      type: String,
      default: 'Year 1',
      trim: true,
    },
    learningGoal: {
      type: String,
      default: '',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light',
    },
    preferences: {
      preferredSessionMinutes: {
        type: Number,
        default: 50,
        min: 15,
        max: 180,
      },
      breakMinutes: {
        type: Number,
        default: 10,
        min: 5,
        max: 60,
      },
      dailyTargetHours: {
        type: Number,
        default: 4,
        min: 1,
        max: 16,
      },
      reminderNotifications: {
        type: Boolean,
        default: true,
      },
      learningDepth: {
        type: String,
        enum: ['briefly', 'moderately', 'deeply'],
        default: 'moderately',
      },
      preferredTimeOfDay: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'night'],
        default: 'morning',
      },
      availableDays: {
        type: [Number],
        default: [1, 2, 3, 4, 5, 6],
      },
      learningStyles: {
        type: [String],
        default: ['videos', 'notes', 'flashcards', 'quizzes'],
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
