import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const API_URL = process.env.API_URL || "https://ranked-api-3r6m.onrender.com";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.on("ready", () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "leaderboard") {
    try {
      // Add timeout with AbortController
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API_URL}/leaderboard`, {
        signal: controller.signal,
        headers: {
          "User-Agent": "ParkourTiers-Bot/1.0",
        },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`HTTP ERROR: ${res.status} ${res.statusText}`);
        return interaction.reply({
          content: "❌ Erro ao buscar leaderboard. Tente novamente mais tarde.",
          ephemeral: true,
        });
      }

      const data = await res.json();

      if (!data || !Array.isArray(data) || data.length === 0) {
        return interaction.reply("📋 Leaderboard vazio.");
      }

      const medals = ["🥇", "🥈", "🥉"];
      const text = data
        .map(
          (p: any, i: number) =>
            `${medals[i] || `**${i + 1}.**`} **${p.username}** — ${p.elo} ELO`
        )
        .join("\n");

      await interaction.reply(`🏆 **Leaderboard:**\n\n${text}`);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.error("FETCH TIMEOUT: Leaderboard request timed out");
        await interaction.reply({
          content: "⏱️ Timeout ao buscar leaderboard. A API pode estar offline.",
          ephemeral: true,
        });
      } else {
        console.error("FETCH ERROR:", err.message || err);
        await interaction.reply({
          content: "❌ Erro ao buscar leaderboard.",
          ephemeral: true,
        });
      }
    }
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error("Missing DISCORD_TOKEN in environment variables.");
}
client.login(token);