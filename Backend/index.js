import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import initControllers from "./src/init/controllers.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  },
});

const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize controllers
initControllers(app);

// Basic route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
