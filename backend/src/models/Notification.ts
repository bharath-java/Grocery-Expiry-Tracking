import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  groceryId?: Types.ObjectId;
  title: string;
  message: string;
  type: 'expiry' | 'system' | 'info';
  status: 'read' | 'unread';
  sentAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  groceryId: { type: Schema.Types.ObjectId, ref: 'Grocery' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['expiry', 'system', 'info'], default: 'info' },
  status: { type: String, enum: ['read', 'unread'], default: 'unread' },
  sentAt: { type: Date, default: Date.now }
});

export default model<INotification>('Notification', NotificationSchema);
