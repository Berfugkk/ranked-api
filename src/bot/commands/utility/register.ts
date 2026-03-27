import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const commands = [
    new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Ver leaderboard")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

async function main() {
    await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: commands }
    );

    console.log("Comando registrado.");
}

main();