require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

// --- 1. ตั้งค่า Express และ Discord Client ---
const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// --- 2. ระบบ Web Server (หน้าเว็บ & API) ---

// API Status ของคุณ
app.get('/api/status', (req, res) => {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);

    res.json({
        uptime: `${h}h ${m}m ${s}s`,
        avatar: client.user ? client.user.displayAvatarURL({ dynamic: true, size: 256 }) : null
    });
});

// หน้า Landing Page (เว็บแนะนำบอท PUBG)
app.get('/', (req, res) => {
    // กำหนดค่าเริ่มต้นเผื่อบอทยังล็อกอินไม่เสร็จ
    let botName = 'SIX ONE NINE';
    let botAvatar = 'https://i.imgur.com/w3duR07.png';

    // ดึงข้อมูลจากตัวบอทโดยตรง (ถ้าบอทพร้อมทำงานแล้ว)
    if (client.isReady() && client.user) {
        botName = client.user.username;
        botAvatar = client.user.displayAvatarURL({ dynamic: true, size: 256, extension: 'png' });
    }

    res.send(`
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${botName} - PUBG & Gaming Community</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Kanit', sans-serif; }
        .neon-glow { box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between">
    <header class="container mx-auto px-6 py-16 text-center">
        <div class="relative inline-block mb-6">
            <img src="${botAvatar}" alt="${botName} Avatar" class="w-32 h-32 rounded-full mx-auto border-4 border-blue-500 neon-glow transition-transform duration-300 hover:scale-105">
            <span class="absolute bottom-2 right-2 bg-green-500 w-5 h-5 rounded-full border-2 border-slate-950 animate-pulse"></span>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold tracking-wide text-white mb-3">
            ยินดีต้อนรับสู่ <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">${botName}</span>
        </h1>
        <p class="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
            ยกระดับเซิร์ฟเวอร์ของคุณด้วยระบบจัดการคอมมูนิตี้เกม และ PUBG แบบครบวงจรที่เกมเมอร์ตัวจริงต้องมี!
        </p>
    </header>

    <main class="container mx-auto px-6 py-8 flex-grow">
        <div class="text-center mb-12">
            <h2 class="text-2xl md:text-3xl font-bold text-white mb-2">ทำไมต้องใช้ดิสของเรา?</h2>
            <div class="h-1 w-20 bg-blue-500 mx-auto rounded"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div class="bg-slate-900/60 border border-slate-800 p-6 rounded-xl hover:border-blue-500/50 transition-all duration-300 backdrop-blur-sm">
                <div class="text-blue-400 text-3xl mb-4">🎯</div>
                <h3 class="text-xl font-semibold mb-2 text-white">PUBG Community Center</h3>
                <p class="text-slate-400 text-sm leading-relaxed">ค้นหาปาร์ตี้ หาเพื่อนร่วมทีมสายนัดโดดร่ม พร้อมระบบเช็กสถิติผู้เล่น และอัปเดตข่าวสารจากเกม PUBG ก่อนใครในที่เดียว</p>
            </div>
            <div class="bg-slate-900/60 border border-slate-800 p-6 rounded-xl hover:border-blue-500/50 transition-all duration-300 backdrop-blur-sm">
                <div class="text-blue-400 text-3xl mb-4">🎮</div>
                <h3 class="text-xl font-semibold mb-2 text-white">คอมมูนิตี้ที่ดี</h3>
                <p class="text-slate-400 text-sm leading-relaxed">สังคมในดิสเป็นกันเองสุดๆและแอดมินดูแลดีมาก</p>
            </div>
            <div class="bg-slate-900/60 border border-slate-800 p-6 rounded-xl hover:border-blue-500/50 transition-all duration-300 backdrop-blur-sm">
                <div class="text-blue-400 text-3xl mb-4">⚡</div>
                <h3 class="text-xl font-semibold mb-2 text-white">ระบบบอทที่ดี</h3>
                <p class="text-slate-400 text-sm leading-relaxed">มีระบบแจ้งเตือนคนเข้า-ออกเซิร์ฟเวอร์แบบอัตโนมัติ และระบบกันเรื้อนต่างๆนาๆ</p>
            </div>
        </div>
    </main>

    <footer class="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs md:text-sm text-slate-500">
        <p>© 2026 ${botName}. All rights reserved.</p>
        <p class="mt-1 text-slate-400">Powered by <span class="text-blue-400 font-semibold">KANKUNGz</span></p>
    </footer>
</body>
</html>
    `);
});

// เริ่มรัน server เว็บ
app.listen(PORT, () => console.log(`🌐 Web Server is running on port ${PORT}`));


// --- 3. ระบบบอท Discord (Welcome Config & Commands) ---
const CONFIG_FILE = path.join(__dirname, 'welcome_config.json');

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

client.once('ready', async () => {
    console.log(`✅ บอทดิสคอร์ดออนไลน์แล้วในชื่อ: ${client.user.tag}`);
    
    const command = new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('ตั้งค่าระบบต้อนรับและแจ้งเตือนคนออก (Admin Only)')
        .addChannelOption(option => option.setName('channel').setDescription('ห้องต้อนรับ').setRequired(true))
        .addChannelOption(option => option.setName('leave_channel').setDescription('ห้องแจ้งเตือนคนออก').setRequired(true))
        .addStringOption(option => option.setName('message').setDescription('ข้อความ ({user}, {server})').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    await client.application.commands.set([command]);
    console.log(`✅ อัปเดต Slash Command เรียบร้อยแล้ว`);
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
        return interaction.reply({ content: '✅ ตั้งค่าห้องต้อนรับสำเร็จ!', ephemeral: true });
    }
});

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

// ล็อกอินบอทด้วย Token จาก Environment Variables (ไฟล์ .env)
client.login(process.env.TOKEN);