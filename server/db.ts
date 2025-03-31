import mongoose from 'mongoose';
import { User, Conversion } from './models';

// Use the MongoDB Atlas URL directly for now (will override any existing DATABASE_URL)
const DATABASE_URL = process.env.MONGO_URL;

console.log('Using MongoDB Atlas URL');

// Make sure we have a valid URL
if (!DATABASE_URL) {
  console.error('MongoDB URL is not set');
  throw new Error('MongoDB URL is not set');
}

// Connect to MongoDB
mongoose.connect(DATABASE_URL)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    throw error;
  });

// Export models for convenience
export const models = {
  User,
  Conversion
};
