import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  verified: boolean;
  role: 'user' | 'admin';
  language?: string;
  theme?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  avatar: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  language: { type: String, default: 'en' },
  theme: { type: String, default: 'dark' },
  createdAt: { type: Date, default: Date.now }
});

export default model<IUser>('User', UserSchema);
