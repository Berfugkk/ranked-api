import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { supabase } from "./utils/supabase";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

// --- Security Middleware ---

// Helmet: sets various HTTP security headers
app.use(helmet());

// CORS: restrict to known origins
const allowedOrigins = [
  "https://ranked-api-3r6m.onrender.com",
  "http://localhost:3000",
  // Add your Vercel site domain here when ready, e.g.:
  // "https://your-site.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Roblox HttpService, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

app.use(express.json({ limit: "10kb" }));

// --- API Key Middleware ---

function checkApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-api-key"];

  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }

  next();
}

// --- Input Validation Helpers ---

function isValidRobloxId(id: string): boolean {
  return /^\d{1,20}$/.test(id);
}

function isValidUsername(name: string): boolean {
  return typeof name === "string" && name.length >= 1 && name.length <= 50 && /^[a-zA-Z0-9_]+$/.test(name);
}

function isValidElo(elo: number): boolean {
  return Number.isFinite(elo) && elo >= 0 && elo <= 10000;
}

// --- Routes ---

// Health check
app.get("/", (_req, res) => {
  res.json({ status: "online" });
});

// Leaderboard (public, read-only)
app.get("/leaderboard", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("roblox_id, username, elo")
      .order("elo", { ascending: false })
      .limit(10);

    if (error) {
      console.error("SUPABASE ERROR:", error.message);
      return res.status(500).json({ error: "Failed to fetch leaderboard." });
    }

    res.json(data);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Set ELO (requires API key)
app.post("/set-elo", checkApiKey, async (req, res) => {
  try {
    const { roblox_id, username, elo } = req.body;

    // Validate required fields
    if (!roblox_id || !username || elo === undefined) {
      return res.status(400).json({ error: "Missing required fields: roblox_id, username, elo" });
    }

    const robloxIdStr = String(roblox_id);
    const usernameStr = String(username);
    const eloNum = Number(elo);

    // Validate input formats
    if (!isValidRobloxId(robloxIdStr)) {
      return res.status(400).json({ error: "Invalid roblox_id format." });
    }

    if (!isValidUsername(usernameStr)) {
      return res.status(400).json({ error: "Invalid username format. Only alphanumeric and underscore, 1-50 chars." });
    }

    if (!isValidElo(eloNum)) {
      return res.status(400).json({ error: "Invalid elo value. Must be a number between 0 and 10000." });
    }

    const { data, error } = await supabase
      .from("players")
      .upsert(
        [
          {
            roblox_id: robloxIdStr,
            username: usernameStr,
            elo: eloNum,
          },
        ],
        { onConflict: "roblox_id" }
      )
      .select();

    if (error) {
      console.error("SUPABASE ERROR:", error.message);
      return res.status(500).json({ error: "Failed to update player data." });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Global Error Handler ---
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("UNHANDLED ERROR:", err.message);
  res.status(500).json({ error: "Internal server error." });
});

// --- Start Server ---
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});