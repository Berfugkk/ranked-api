import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.on("ready", () => {
    console.log(`Bot logado como ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "leaderboard") {
        try {
  const res = await fetch("https://ranked-api-3r6m.onrender.com/leaderboard");

  if (!res.ok) {
    console.log("HTTP ERROR:", res.status);
    return interaction.reply("Erro ao buscar leaderboard.");
  }

  const data = await res.json();

  if (!data || data.length === 0) {
    return interaction.reply("Leaderboard vazio.");
  }

  const text = data
    .map((p: any, i: number) => `${i + 1}. ${p.username} - ${p.elo}`)
    .join("\n");

  await interaction.reply(`🏆 Leaderboard:\n${text}`);
} catch (err) {
  console.error("FETCH ERROR:", err);
  await interaction.reply("Erro ao buscar leaderboard.");
}
    }
});

client.login(process.env.DISCORD_TOKEN);