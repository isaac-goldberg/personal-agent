import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config({ quiet: "true" });

const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ] });
client.login(process.env.DISCORD_BOT_TOKEN);

client.on("clientReady", () => {
    console.log(client.user.username, "online");
});

export default client;