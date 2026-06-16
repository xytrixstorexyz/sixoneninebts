const { Client, GatewayIntentBits, PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

// --- CONSTANTS & CONFIG PATH ---
const CONFIG_FILE = path.join(__dirname, 'welcome_config.json');
const PORT = process.env.PORT || 3000;

// --- INITIALIZE BOT CLIENT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// --- DATABASE FUNCTIONS (AUTO-SAVE) ---
let welcomeData = {};

// โหลดข้อมูลเก่าถ้ามีไฟล์อยู่
if (fs.existsSync(CONFIG_FILE)) {
    try {
        welcomeData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        console.log('💾 โหลดข้อมูลการตั้งค่าต้อนรับเรียบร้อยแล้ว');
    } catch (err) {
        console.error('❌ เกิดข้อผิดพลาดในการอ่านไฟล์คอนฟิก:', err);
    }
}

// ฟังก์ชันเซฟข้อมูลอัตโนมัติ
function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(welcomeData, null, 4), 'utf8');
    console.log('📝 บันทึกข้อมูลลงคอนฟิกอัตโนมัติเรียบร้อย!');
}

// --- EXPRESS SERVER (สำหรับ Online 24/7) ---
const app = express();
app.get('/', (req, res) => {
    res.send('🤖 บอทกำลังออนไลน์อยู่จ้า! (24/7 Uptime Ready)');
});
app.listen(PORT, () => {
    console.log(`🌐 Web Server เปิดใช้งานแล้วที่พอร์ต ${PORT}`);
});

// --- BOT EVENTS ---
client.once('ready', async () => {
    console.log(`✅ ออนบอทสำเร็จ: ${client.user.tag}`);
    
    // ลงทะเบียน Slash Command ระบบจะล็อกให้เห็น/ใช้ได้เฉพาะคนมีสิทธิ์ Administrator นำหน้าก่อนเลย
    const welcomeCommand = new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('ตั้งค่าระบบต้อนรับสมาชิกใหม่ (เฉพาะยศใหญ่เท่านั้น)')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('เลือกห้องที่จะให้บอทส่งข้อความต้อนรับ')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('ข้อความ (ใช้ {user} แทนชื่อคนเข้าใหม่ และ {server} แทนชื่อเซิร์ฟเวอร์)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator); // ล็อกสิทธิ์ระดับ Discord API

    try {
        await client.application.commands.set([welcomeCommand]);
        console.log('🚀 ลงทะเบียน Slash Commands เรียบร้อยแล้ว!');
    } catch (error) {
        console.error('❌ ไม่สามารถลงทะเบียนคำสั่งได้:', error);
    }
});

// ระบบจัดการคำสั่ง /setup-welcome
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'setup-welcome') {
        // Double Check: ตรวจสอบอีกชั้นเพื่อความชัวร์ว่าผู้ใช้มีสิทธิ์ Administrator หรือไม่
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ 
                content: '❌ **ปฏิเสธการเข้าถึง:** คำสั่งนี้สงวนไว้สำหรับผู้ดูแลระบบ (ยศใหญ่) เท่านั้น!', 
                ephemeral: true 
            });
        }

        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');
        const guildId = interaction.guild.id;

        // บันทึกข้อมูลลงตัวแปร
        welcomeData[guildId] = {
            channelId: channel.id,
            message: message
        };

        // เซฟลงไฟล์อัตโนมัติ
        saveConfig();

        return interaction.reply({
            content: `✅ **ตั้งค่าระบบต้อนรับสำเร็จ!**\n📺 **ห้อง:** <#${channel.id}>\n💬 **ข้อความ:** ${message}`,
            ephemeral: true // ข้อความนี้จะเห็นเฉพาะคนที่กดคำสั่งเท่านั้น
        });
    }
});

// ระบบต้อนรับเมื่อคนเข้าดิสคอร์ด
client.on('guildMemberAdd', async member => {
    const guildId = member.guild.id;
    const config = welcomeData[guildId];

    // ถ้ายังไม่ได้ตั้งค่า หรือห้องนั้นไม่มีอยู่จริง ให้ข้ามไป
    if (!config || !config.channelId) return;

    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel) return;

    // แปลงโค้ดข้อความ {user} และ {server} เป็นข้อมูลจริง
    let welcomeMessage = config.message
        .replace(/{user}/g, `<@${member.id}>`)
        .replace(/{server}/g, `**${member.guild.name}**`);

    try {
        // ส่งข้อความต้อนรับแบบสวยงาม (Embed) หรือจะส่งเป็นข้อความธรรมดาก็ได้
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#00E5FF') // สีฟ้าสไตล์นีออน ไซเบอร์พังก์
            .setTitle('👋 ยินดีต้อนรับสมาชิกใหม่!')
            .setDescription(welcomeMessage)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `${member.guild.name} Welcome System`, iconURL: member.guild.iconURL() });

        await channel.send({ content: `<@${member.id}>`, embeds: [welcomeEmbed] });
    } catch (err) {
        console.error('❌ ไม่สามารถส่งข้อความต้อนรับได้:', err);
    }
});

// ใส่ TOKEN บอทของคุณที่นี่ (แนะนำให้ใช้ process.env.TOKEN เพื่อความปลอดภัย)
const TOKEN = process.env.TOKEN;
client.login(TOKEN);