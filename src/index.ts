import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// carregar .env
dotenv.config();

// criar app
const app = express();
app.use(cors());
app.use(express.json());

// supabase client
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// middleware simples de auth
function checkApiKey(req: Request, res: Response, next: any) {
    const key = req.headers["x-api-key"];

    if (key !== process.env.API_KEY) {
        return res.status(401).json({ error: "unauthorized" });
    }

    next();
}

// rota base
app.get("/", (req: Request, res: Response) => {
    res.send("API ONLINE");
});

// TESTE: insere direto no banco
app.get("/test", async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from("players")
        .insert([
            {
                roblox_id: "1",
                username: "Teste",
                elo: 1000
            }
        ])
        .select();

    if (error) return res.status(500).json(error);

    res.json(data);
});

// endpoint real (criar/atualizar elo)
app.post("/set-elo", checkApiKey, async (req: Request, res: Response) => {
    const { roblox_id, username, elo } = req.body;

    const { data, error } = await supabase
        .from("players")
        .upsert([
            {
                roblox_id,
                username,
                elo
            }
        ])
        .select();

    if (error) return res.status(500).json(error);

    res.json(data);
});

// leaderboard
app.get("/leaderboard", async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("elo", { ascending: false })
        .limit(10);

    if (error) return res.status(500).json(error);

    res.json(data);
});

// start server
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
    console.log(`Server rodando na porta ${port}`);
});