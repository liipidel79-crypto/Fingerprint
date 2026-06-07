/**
 * Express.js Server Configuration
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { testConnection } from "./models/database.js";
import { initializeTables } from "./models/init.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? allowedOrigins : "*",
    credentials: true,
  },
});

// Initialize database connection
async function initializeDatabase() {
  try {
    const connected = await testConnection();
    if (connected) {
      console.log("✅ Database connected successfully");
      await initializeTables();
    } else {
      console.error("❌ Failed to connect to database");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    process.exit(1);
  }
}

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  // Add your render.com frontend URL here (e.g., "https://your-frontend.onrender.com")
  // "https://your-frontend.onrender.com",
];

app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? allowedOrigins : "*",
    credentials: true,
  }),
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import adminRoutes from "./routes/adminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import hardwareRoutes from "./routes/hardwareRoutes.js";
import { scanFingerprint } from "./controllers/hardwareController.js";

app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/hardware", hardwareRoutes);
app.post("/api/scan", scanFingerprint);
app.get("/test",async(req,res)=>{
  res.send({msg:"sucesss"})
})
// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, async () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  await initializeDatabase();
});

export default app;
export { io };
