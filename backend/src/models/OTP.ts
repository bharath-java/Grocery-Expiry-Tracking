import { Schema, model, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  type: 'register' | 'reset';
}

const OTPSchema = new Schema<IOTP>({
  email: { type: String, required: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  type: { type: String, enum: ['register', 'reset'], required: true }
});

// Auto-delete OTP documents when they expire (using MongoDB TTL index)
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model<IOTP>('OTP', OTPSchema);
