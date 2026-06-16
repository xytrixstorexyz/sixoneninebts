const { Client, GatewayIntentBits, PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

// --- CONFIG ---
const CONFIG_FILE = path.join(__dirname, 'welcome_config.json');
const PORT = process.env.PORT || 3000;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

let welcomeData = {};

if (fs.existsSync(CONFIG_FILE)) {
    try {
        welcomeData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (err) {
        console.error('❌ อ่านไฟล์คอนฟิกไม่ได้:', err);
    }
}

function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(welcomeData, null, 4), 'utf8');
}

// --- EXPRESS (24/7) ---
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT);

// --- COMMANDS & EVENTS ---
client.once('ready', async () => {
    console.log(`✅ บอททำงานแล้ว: ${client.user.tag}`);
    
    const command = new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('ตั้งค่าระบบต้อนรับและแจ้งเตือนคนออก (Admin Only)')
        .addChannelOption(option => option.setName('channel').setDescription('ห้องต้อนรับ').setRequired(true))
        .addChannelOption(option => option.setName('leave_channel').setDescription('ห้องแจ้งเตือนคนออก').setRequired(true))
        .addStringOption(option => option.setName('message').setDescription('ข้อความ ({user}, {server})').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    await client.application.commands.set([command]);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'setup-welcome') {
        const channel = interaction.options.getChannel('channel');
        const leaveChannel = interaction.options.getChannel('leave_channel');
        const message = interaction.options.getString('message');
        
        welcomeData[interaction.guild.id] = {
            channelId: channel.id,
            leaveChannelId: leaveChannel.id,
            message: message
        };
        saveConfig();

        return interaction.reply({ content: '✅ ตั้งค่าสำเร็จ!', ephemeral: true });
    }
});

// ต้อนรับ
client.on('guildMemberAdd', async member => {
    const config = welcomeData[member.guild.id];
    if (!config || !config.channelId) return;

    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel) return;

    const welcomeMessage = config.message
        .replace(/{user}/g, `<@${member.id}>`)
        .replace(/{server}/g, `**${member.guild.name}**`);

    const embed = new EmbedBuilder()
        .setColor('#00E5FF')
        .setTitle('👋 ยินดีต้อนรับสมาชิกใหม่!')
        .setDescription(welcomeMessage)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    await channel.send({ embeds: [embed] });
});

// แจ้งเตือนคนออก
client.on('guildMemberRemove', async member => {
    const config = welcomeData[member.guild.id];
    if (!config || !config.leaveChannelId) return;

    const channel = member.guild.channels.cache.get(config.leaveChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor('#FF4444')
        .setTitle('😢 สมาชิกออกจากเซิร์ฟเวอร์')
        .setDescription(`**${member.user.tag}** ได้ออกจากเซิร์ฟเวอร์ไปแล้ว`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    await channel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);