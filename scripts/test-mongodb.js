import mongoose from 'mongoose';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// MongoDB connection URL
const DATABASE_URL = 'mongodb+srv://Admin:UL0v86eYZcaywB78@cluster0.fnwso.mongodb.net/PdftoXML';

const scryptAsync = promisify(scrypt);

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password method
userSchema.statics.hashPassword = async function(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
};

// Create User model
const User = mongoose.model('User', userSchema);

// Conversion schema
const conversionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFilename: { type: String, required: true },
  originalSize: { type: Number, required: true },
  convertedSize: { type: Number, default: null },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  xmlContent: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create Conversion model
const Conversion = mongoose.model('Conversion', conversionSchema);

async function testMongoDB() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(DATABASE_URL);
    console.log('Connected to MongoDB Atlas successfully!');

    // Create a test user
    const testUsername = `testuser_${Math.floor(Math.random() * 10000)}`;
    const testEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
    const hashedPassword = await User.hashPassword('password123');

    console.log('Creating test user...');
    const user = new User({
      username: testUsername,
      email: testEmail,
      password: hashedPassword
    });
    
    await user.save();
    console.log('Test user created successfully!');
    console.log('User ID:', user._id);
    console.log('Username:', user.username);
    console.log('Email:', user.email);

    // Create a test conversion
    console.log('Creating test conversion...');
    const conversion = new Conversion({
      userId: user._id,
      originalFilename: 'test.pdf',
      originalSize: 12345,
      status: 'completed',
      xmlContent: '<xml>Test XML content</xml>',
      convertedSize: 5678,
      metadata: {
        pageCount: 5,
        processingTimeMs: 1234,
        structureAccuracy: 0.95,
        structures: {
          paragraphs: 10,
          tables: 2,
          lists: 3,
          images: 1
        }
      }
    });
    
    await conversion.save();
    console.log('Test conversion created successfully!');
    console.log('Conversion ID:', conversion._id);

    // Retrieve the test user and conversion
    console.log('Retrieving test user and conversion...');
    const retrievedUser = await User.findById(user._id);
    console.log('Retrieved user:', retrievedUser.username);

    const retrievedConversion = await Conversion.findById(conversion._id);
    console.log('Retrieved conversion status:', retrievedConversion.status);
    console.log('Retrieved conversion metadata:', retrievedConversion.metadata);

    console.log('All MongoDB tests passed successfully!');
  } catch (error) {
    console.error('MongoDB test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');
  }
}

testMongoDB();