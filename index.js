const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();
const port = 3000;

// ส่วนของการทำให้บอทออนไลน์ 24/7 (Web Server)
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(port, () => console.log(`Web server listening at http://localhost:${port}`));

// ส่วนของบอท Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// ใส่ Token ผ่าน Environment Variable แทนการพิมพ์ตรงๆ
client.login(process.env.DISCORD_TOKEN);