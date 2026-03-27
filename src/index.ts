import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// middleware API KEY
function checkApiKey(req: Request, res: Response, next: any) {
  const key = req.headers["x-api-key"];

  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }

  next();
}

// rota base
app.get("/", (req, res) => {
  res.send("API ONLINE");
});

// leaderboard
app.get("/leaderboard", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("elo", { ascending: false })
      .limit(10);

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return res.status(500).json({ error });
    }

    res.json(data);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "internal error" });
  }
});

// set elo
app.post("/set-elo", checkApiKey, async (req, res) => {
  try {
    const { roblox_id, username, elo } = req.body;

    if (!roblox_id || !username || elo === undefined) {
      return res.status(400).json({ error: "missing fields" });
    }

    const { data, error } = await supabase
      .from("players")
      .upsert([
        {
          roblox_id: String(roblox_id),
          username: String(username),
          elo: Number(elo),
        },
      ])
      .select();

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return res.status(500).json({ error });
    }

    res.json(data);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "internal error" });
  }
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Server rodando na porta ${port}`);
});