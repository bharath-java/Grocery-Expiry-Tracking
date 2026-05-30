import { Schema, model, Document } from 'mongoose';

export interface IAIChat extends Document {
  userId: Schema.Types.ObjectId;
  assistantName: string;
  message: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const AIChatSchema = new Schema<IAIChat>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assistantName: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  timestamp: { type: Date, default: Date.now }
});

export default model<IAIChat>('AIChat', AIChatSchema);
