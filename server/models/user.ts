import mongoose, { Document, Schema } from 'mongoose';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// User interface
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method for password comparison
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const user = this;
  const [hashed, salt] = user.password.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(candidatePassword, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
};

// Add static methods to the interface
export interface UserModel extends mongoose.Model<IUser> {
  hashPassword(password: string): Promise<string>;
}

// Static method to hash password
userSchema.statics.hashPassword = async function(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
};

// Create and export the model
const User = mongoose.model<IUser, UserModel>('User', userSchema);

export default User;