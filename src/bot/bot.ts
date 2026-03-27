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
            const res = await fetch("http://localhost:3000/leaderboard");
            const data = await res.json();

            if (!data.length) {
                return interaction.reply("Leaderboard vazio.");
            }

            let text = "🏆 Leaderboard:\n\n";

            data.forEach((p: any, i: number) => {
                text += `${i + 1}. ${p.username} — ${p.elo}\n`;
            });

            await interaction.reply(text);
        } catch (err) {
            console.error(err);
            await interaction.reply("Erro ao buscar leaderboard.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);