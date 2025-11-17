import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { vectorizeImage } from "../utils/vectorize.js";
import { svgToPoints } from "../utils/svgToPoints.js";
import { pointsToGcode, optimizeGcode } from "../utils/pointsToGcode.js";

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "uploads";
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "upload-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    const allowedTypes = /jpeg|jpg|png|gif|bmp|tiff|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

/**
 * POST /api/convert
 * Accepts an image file and converts it to G-code for pen plotter
 */
router.post("/convert", upload.single("image"), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    console.log("Processing file:", req.file.filename);

    // Parse options from request body
    const options = {
      imageSize: parseInt(req.body.imageSize) || 300,
      detailLevel: parseInt(req.body.detailLevel) || 2,
      feedRate: parseInt(req.body.feedRate) || 3000,
      penUp: parseFloat(req.body.penUp) || 5,
      penDown: parseFloat(req.body.penDown) || -2,
      tolerance: parseFloat(req.body.tolerance) || 0.5,
      removeNoise: req.body.removeNoise !== 'false',
      minPathLength: parseFloat(req.body.minPathLength) || 2
    };

    console.log("Options:", options);

    // Read the uploaded file
    const imageBuffer = await fs.readFile(req.file.path);

    // Step 1: Vectorize the image (bitmap -> SVG)
    console.log("Vectorizing image...");
    const { svg, processedImage } = await vectorizeImage(imageBuffer, {
      imageSize: options.imageSize,
      detailLevel: options.detailLevel,
    });

    // Step 2: Convert SVG paths to coordinate arrays
    console.log("Converting SVG to points...");
    const paths = svgToPoints(svg, options.tolerance);

    if (paths.length === 0) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        error: "No paths found in image. Try an image with more contrast.",
      });
    }

    // Filter out noise if enabled
    let filteredPaths = paths;
    if (options.removeNoise && options.minPathLength > 0) {
      filteredPaths = paths.filter(path => {
        if (path.length < 2) return false;
        
        // Calculate total path length
        let totalLength = 0;
        for (let i = 1; i < path.length; i++) {
          const dx = path[i].x - path[i-1].x;
          const dy = path[i].y - path[i-1].y;
          totalLength += Math.sqrt(dx * dx + dy * dy);
        }
        
        return totalLength >= options.minPathLength;
      });
      
      console.log(`Filtered ${paths.length - filteredPaths.length} noise paths`);
    }

    console.log(`Found ${filteredPaths.length} paths`);

    // Step 3: Convert coordinate arrays to G-code
    console.log("Generating G-code...");
    const { gcode, stats } = pointsToGcode(filteredPaths, {
      feedRate: options.feedRate,
      penUp: options.penUp,
      penDown: options.penDown,
    });

    // Clean up uploaded file
    await fs.unlink(req.file.path).catch(console.error);

    // Return G-code with metadata
    res.json({
      gcode: gcode,
      processedImage: processedImage,
      stats: stats,
      options: options,
    });
  } catch (error) {
    console.error("Error processing image:", error);

    // Clean up uploaded file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res.status(500).json({
      error: "Failed to process image",
      details: error.message,
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Image to G-code converter API is running",
  });
});

export default router;
