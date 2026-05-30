import { Schema, model, Document, Types } from 'mongoose';

export interface IArchive extends Document {
  userId: Types.ObjectId;
  groceryId: Types.ObjectId;
  archivedAt: Date;
}

const ArchiveSchema = new Schema<IArchive>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  groceryId: { type: Schema.Types.ObjectId, ref: 'Grocery', required: true },
  archivedAt: { type: Date, default: Date.now }
});

export default model<IArchive>('Archive', ArchiveSchema);
