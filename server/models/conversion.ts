import mongoose, { Document, Schema } from 'mongoose';

// Conversion interface
export interface IConversion extends Document {
  userId: mongoose.Types.ObjectId;
  originalFilename: string;
  originalSize: number;
  convertedSize: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  xmlContent: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Conversion schema
const conversionSchema = new Schema<IConversion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    originalSize: {
      type: Number,
      required: true,
    },
    convertedSize: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    xmlContent: {
      type: String,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the model
const Conversion = mongoose.model<IConversion>('Conversion', conversionSchema);

export default Conversion;