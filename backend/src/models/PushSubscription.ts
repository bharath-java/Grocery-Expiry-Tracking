import { Schema, model, Document, Types } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: Types.ObjectId;
  subscription: Record<string, any>;
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subscription: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
