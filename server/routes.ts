import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertConversionSchema, updateConversionSchema } from "@shared/schema";
import multer from "multer";
import { convertPdfToXml } from "./converter";

// Middleware to check authentication status
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!') as any);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Conversion routes
  app.post(
    "/api/conversions",
    isAuthenticated,
    upload.single('file'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const file = req.file;
        const userId = req.user!.id;

        // Create conversion record
        const conversion = await storage.createConversion({
          userId,
          originalFilename: file.originalname,
          originalSize: file.size,
          status: "processing",
        });

        // Process PDF conversion asynchronously
        try {
          const { xml, metadata } = await convertPdfToXml(file.buffer);
          
          // Update conversion with results
          const updatedConversion = await storage.updateConversion(conversion.id, {
            status: "completed",
            xmlContent: xml,
            convertedSize: Buffer.from(xml).length,
            metadata: metadata,
          });

          res.status(200).json(updatedConversion);
        } catch (error) {
          // Update conversion with error status
          await storage.updateConversion(conversion.id, {
            status: "failed",
            metadata: { error: (error as Error).message },
          });

          res.status(500).json({ 
            message: "Conversion failed", 
            error: (error as Error).message 
          });
        }
      } catch (error) {
        res.status(500).json({ 
          message: "Server error", 
          error: (error as Error).message 
        });
      }
    }
  );

  // Get user conversions
  app.get("/api/conversions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const conversions = await storage.getUserConversions(userId);
      res.status(200).json(conversions);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch conversions", 
        error: (error as Error).message 
      });
    }
  });

  // Get specific conversion
  app.get("/api/conversions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid conversion ID" });
      }

      const conversion = await storage.getConversion(id);
      if (!conversion) {
        return res.status(404).json({ message: "Conversion not found" });
      }

      // Check if the conversion belongs to the user
      if (conversion.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this conversion" });
      }

      res.status(200).json(conversion);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch conversion", 
        error: (error as Error).message 
      });
    }
  });

  // Delete conversion
  app.delete("/api/conversions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid conversion ID" });
      }

      const conversion = await storage.getConversion(id);
      if (!conversion) {
        return res.status(404).json({ message: "Conversion not found" });
      }

      // Check if the conversion belongs to the user
      if (conversion.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this conversion" });
      }

      const deleted = await storage.deleteConversion(id);
      if (deleted) {
        res.status(200).json({ message: "Conversion deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete conversion" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to delete conversion", 
        error: (error as Error).message 
      });
    }
  });

  // Download XML content
  app.get("/api/conversions/:id/download", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid conversion ID" });
      }

      const conversion = await storage.getConversion(id);
      if (!conversion) {
        return res.status(404).json({ message: "Conversion not found" });
      }

      // Check if the conversion belongs to the user
      if (conversion.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this conversion" });
      }

      // Check if conversion is completed and has XML content
      if (conversion.status !== "completed" || !conversion.xmlContent) {
        return res.status(400).json({ message: "XML content not available" });
      }

      // Set headers for XML file download
      const filename = conversion.originalFilename.replace(/\.pdf$/i, '.xml');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/xml');
      
      // Send XML content
      res.send(conversion.xmlContent);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to download conversion", 
        error: (error as Error).message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
