import { Schema, model, Document, Types } from 'mongoose';

export interface IGrocery extends Document {
  userId: Types.ObjectId;
  itemName: string;
  image: string;
  brand?: string;
  category: 'Dairy & Eggs' | 'Fruits & Vegetables' | 'Bakery' | 'Meat & Fish' | 'Pantry' | 'Beverages' | 'Snacks' | 'Others';
  quantity: string;
  purchaseDate: Date;
  expiryDate: Date;
  notes?: string;
  status: 'Expired' | 'Expiring Soon' | 'Fresh';
  archived: boolean;
  createdAt: Date;
}

const GrocerySchema = new Schema<IGrocery>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  itemName: { type: String, required: true, trim: true },
  image: { type: String, default: '' },
  brand: { type: String, default: '' },
  category: { 
    type: String, 
    required: true,
    enum: ['Dairy & Eggs', 'Fruits & Vegetables', 'Bakery', 'Meat & Fish', 'Pantry', 'Beverages', 'Snacks', 'Others']
  },
  quantity: { type: String, required: true },
  purchaseDate: { type: Date, required: true, default: Date.now },
  expiryDate: { type: Date, required: true },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['Expired', 'Expiring Soon', 'Fresh'], default: 'Fresh' },
  archived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default model<IGrocery>('Grocery', GrocerySchema);
