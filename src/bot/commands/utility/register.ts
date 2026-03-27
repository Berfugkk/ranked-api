import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  throw new Error("Missing DISCORD_TOKEN or CLIENT_ID in environment variables.");
}

const commands = [
  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Ver o leaderboard de ELO"),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

async function main() {
  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationCommands(clientId!), { body: commands });
    console.log("Commands registered successfully.");
  } catch (err) {
    console.error("Failed to register commands:", err);
    process.exit(1);
  }
}

main();