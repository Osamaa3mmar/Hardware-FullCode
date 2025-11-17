import express from "express";
import cors from "cors";
import convertRoutes from "./routes/convert.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // Vite default port and common React port
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", convertRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Image to G-code Converter API",
    version: "1.0.0",
    endpoints: {
      convert: "POST /api/convert - Upload image and get G-code",
      health: "GET /api/health - Check API status",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/convert`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});
