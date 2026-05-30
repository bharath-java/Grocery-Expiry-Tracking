import { Schema, model, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IAIConversation extends Document {
  userId: Schema.Types.ObjectId;
  assistant: 'alex' | 'maya' | 'buddy' | 'sam';
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const AIConversationSchema = new Schema<IAIConversation>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assistant: { type: String, enum: ['alex', 'maya', 'buddy', 'sam'], required: true },
  messages: [MessageSchema]
}, {
  timestamps: true
});

export default model<IAIConversation>('AIConversation', AIConversationSchema);
