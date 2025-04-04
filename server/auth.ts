import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage, UserType } from "./storage";
import { z } from "zod";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { models } from "./db";

// Promisify scrypt function
const scryptAsync = promisify(scrypt);

// Hash password function
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare passwords function
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    console.log('Comparing passwords...');
    const [hashed, salt] = stored.split(".");
    console.log('Stored password format:', { hashedLength: hashed.length, saltLength: salt.length });
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log('Password comparison result:', result);
    return result;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "pdf-to-xml-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        console.log('Login attempt for email:', email);
        const user = await storage.getUserByEmail(email);
        if (!user) {
          console.log('User not found for email:', email);
          return done(null, false);
        }
        
        console.log('User found, verifying password');
        // Get the full user document from MongoDB to use its comparePassword method
        const mongoUser = await models.User.findById(user.id);
        if (!mongoUser) {
          console.log('MongoDB user not found');
          return done(null, false);
        }

        const isValid = await mongoUser.comparePassword(password);
        console.log('Password verification result:', isValid);
        if (!isValid) {
          return done(null, false);
        }
        
        return done(null, user);
      } catch (err) {
        console.error('Login error:', err);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('Registration attempt:', { email: req.body.email, username: req.body.username });
      // Validate registration data
      const registerSchema = z.object({
        email: z.string().email("Invalid email format"),
        username: z.string().min(3, "Username must be at least 3 characters"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      });

      const validatedData = registerSchema.parse(req.body);
      console.log('Registration data validated');

      // Check if user with email already exists
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        console.log('Email already exists:', validatedData.email);
        return res.status(400).json({ message: "Email already in use" });
      }

      // Check if user with username already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        console.log('Username already exists:', validatedData.username);
        return res.status(400).json({ message: "Username already taken" });
      }

      console.log('Creating new user...');
      // Create user with hashed password using the User model's method
      const user = await storage.createUser({
        ...validatedData,
        password: validatedData.password, // The storage layer will handle hashing
      });
      console.log('User created successfully:', { id: user.id, email: user.email });

      // Create response object without password
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      // Log user in
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userResponse);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: UserType | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        // Create clean response object without password
        const userResponse = {
          id: user.id,
          username: user.username,
          email: user.email
        };
        res.status(200).json(userResponse);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Create clean response object without password
    const user = req.user as UserType;
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    res.json(userResponse);
  });
}
