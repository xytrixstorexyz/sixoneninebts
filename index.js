const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType } = require('discord.js');
const express = require('express');
const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');

// --- 1. WEB SERVER FOR 24/7 ONLINE ---
const app = express();
const port = 3000;
app.get('/', (req, res) => res.send('Bot is online 24/7!'));
app.listen(port, () => console.log(`Web server listening at http://localhost:${port}`));

// --- 2. DISCORD BOT CLIENT SETUP ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates // สำคัญมากสำหรับบอทเพลง
    ]
});

// --- 3. DISTUBE MUSIC ENGINE SETUP ---
const distube = new DisTube(client, {
    emitNewSongOnly: true,
    plugins: [new YouTubePlugin()]
});

const PREFIX = "six!"; // กำหนด Prefix หลัก

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    // ตั้งสถานะบอทให้แสดงคำสั่งช่วยเหลือ
    client.user.setActivity('SIX!help', { type: ActivityType.Listening });
});

// --- 4. TEXT COMMANDS HANDLING ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // ตรวจสอบ Prefix แบบไม่สนใจตัวพิมพ์เล็ก-ใหญ่ (Case-Insensitive)
    if (!message.content.toLowerCase().startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase(); // แปลงคำสั่งเป็นตัวพิมพ์เล็กทั้งหมด
    const voiceChannel = message.member.voice.channel;

    // 🎵 คำสั่งเปิดเพลง (SIX!p หรือ SIX!play)
    if (command === 'p' || command === 'play') {
        if (!voiceChannel) return message.reply('❌ คุณต้องเข้าห้องเสียงก่อนสั่งเปิดเพลงครับ!');
        
        const query = args.join(' ');
        if (!query) return message.reply('❌ กรุณาใส่ชื่อเพลงหรือลิงก์ YouTube เช่น `SIX!p เพลงที่ชอบ`');

        message.channel.send(`🔍 กำลังค้นหาเพลง: **${query}**...`);
        
        try {
            await distube.play(voiceChannel, query, {
                textChannel: message.channel,
                member: message.member
            });
        } catch (err) {
            console.error(err);
            message.channel.send('❌ เกิดข้อผิดพลาดในการดึงข้อมูลเพลง กรุณาลองใหมอีกครั้งครับ');
        }
    }

    // ⏭️ คำสั่งข้ามเพลง (SIX!skip)
    else if (command === 'skip') {
        const queue = distube.getQueue(message);
        if (!queue) return message.reply('❌ ตอนนี้ไม่มีเพลงในคิวครับ');
        try {
            await distube.skip(message);
            message.reply('⏭️ ข้ามเพลงปัจจุบันให้แล้วครับ!');
        } catch (e) {
            message.reply('❌ ไม่สามารถข้ามได้ (อาจเป็นเพลงสุดท้ายในคิว)');
        }
    }

    // 🔄 คำสั่งวนลูป (SIX!loop)
    else if (command === 'loop') {
        const queue = distube.getQueue(message);
        if (!queue) return message.reply('❌ ตอนนี้ไม่มีเพลงกำลังเล่นอยู่ครับ');
        
        // โหมดวนลูป: 0 = ปิด, 1 = วนเพลงเดิม, 2 = วนทั้งคิว
        let mode = distube.setRepeatMode(message);
        mode = mode === 1 ? '🔂 วนลูปเพลงปัจจุบัน' : mode === 2 ? '🔁 วนลูปทั้งคิวเพลง' : '➡️ ปิดการวนลูป';
        message.reply(`🔄 เปลี่ยนโหมดเป็น: **${mode}**`);
    }

    // ⏹️ คำสั่งหยุดและออกจากห้อง (SIX!stop / SIX!leave)
    else if (command === 'stop' || command === 'leave') {
        const queue = distube.getQueue(message);
        if (!queue) return message.reply('❌ ตอนนี้ไม่มีเพลงกำลังเล่นอยู่ครับ');
        distube.stop(message);
        message.reply('⏹️ หยุดเล่นเพลงและล้างคิวเรียบร้อยครับ!');
    }

    // ℹ️ คำสั่งช่วยเหลือ (SIX!help)
    else if (command === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#ff0055')
            .setTitle('🎵 SIX-ONE-NINE คำสั่งช่วยเหลือระบบเพลง')
            .setDescription('คุณสามารถพิมพ์คำสั่งเป็นตัวพิมพ์เล็กหรือใหญ่ก็ได้ (`SIX!P` หรือ `six!p`)')
            .addFields(
                { name: '▶️ `SIX!p [ชื่อเพลง/ลิงก์ YouTube]`', value: 'ค้นหาและเปิดเพลงในห้องเสียง' },
                { name: '⏭️ `SIX!skip`', value: 'ข้ามเพลงปัจจุบัน' },
                { name: '🔄 `SIX!loop`', value: 'เปลี่ยนโหมดวนลูป (ปิด -> วนเพลงเดิม -> วนทั้งคิว)' },
                { name: '⏹️ `SIX!stop`', value: 'หยุดเล่นเพลง ล้างคิว และเตะบอทออกจากห้อง' },
                { name: 'ℹ️ `SIX!help`', value: 'เรียกดูหน้าต่างช่วยเหลืออันนี้' }
            )
            .setFooter({ text: 'ระบบเพลงรัน 24/7 บน Render' })
            .setTimestamp();

        message.channel.send({ embeds: [helpEmbed] });
    }
});

// --- 5. MUSIC UI DESIGN (เมื่อเริ่มเล่นเพลง) ---
distube.on('playSong', (queue, song) => {
    const playEmbed = new EmbedBuilder()
        .setColor('#00ff77')
        .setTitle(`🎶 กำลังเล่น: ${song.name}`)
        .setURL(song.url)
        .addFields(
            { name: '🕒 ความยาว', value: `${song.formattedDuration}`, inline: true },
            { name: '👤 ขอโดย', value: `${song.user}`, inline: true },
            { name: '🔊 ระดับเสียง', value: `${queue.volume}%`, inline: true }
        )
        .setImage(song.thumbnail)
        .setTimestamp();

    // สร้างปุ่มกดคุมเพลง (UI Interaction)
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_pause_resume').setLabel('⏸️ พัก/เล่นต่อ').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_skip').setLabel('⏭️ ข้ามเพลง').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_vol_down').setLabel('🔉 ลดเสียง').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_vol_up').setLabel('🔊 เพิ่มเสียง').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_stop').setLabel('⏹️ หยุดเพลง').setStyle(ButtonStyle.Danger)
    );

    queue.textChannel.send({ embeds: [playEmbed], components: [row] });
});

// --- 6. BUTTON INTERACTION HANDLING (ระบบกดปุ่มใต้เพลง) ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '❌ ตอนนี้ไม่มีเพลงในคิวแล้วครับ', ephemeral: true });

    // ตรวจสอบว่าคนกดอยู่ในห้องเสียงเดียวกับบอทไหม
    if (interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
        return interaction.reply({ content: '❌ คุณต้องเข้าห้องเสียงเดียวกับบอทก่อนควบคุมปุ่มครับ!', ephemeral: true });
    }

    await interaction.deferUpdate(); // ยืนยันการรับอินเตอร์แอคชันป้องกันปุ่มค้าง

    switch (interaction.customId) {
        case 'btn_pause_resume':
            if (queue.paused) {
                queue.resume();
                interaction.followUp({ content: '▶️ เล่นเพลงต่อแล้วครับ!', ephemeral: true });
            } else {
                queue.pause();
                interaction.followUp({ content: '⏸️ พักเพลงชั่วคราวแล้วครับ!', ephemeral: true });
            }
            break;
            
        case 'btn_skip':
            try {
                await distube.skip(interaction.guildId);
                interaction.followUp({ content: '⏭️ ข้ามเพลงให้แล้วครับ!', ephemeral: true });
            } catch {
                interaction.followUp({ content: '❌ ไม่สามารถข้ามได้ (ไม่มีเพลงถัดไป)', ephemeral: true });
            }
            break;

        case 'btn_vol_down':
            let volDown = queue.volume - 10;
            if (volDown < 0) volDown = 0;
            distube.setVolume(interaction.guildId, volDown);
            interaction.followUp({ content: `🔉 ปรับระดับเสียงลงเหลือ ${volDown}%`, ephemeral: true });
            break;

        case 'btn_vol_up':
            let volUp = queue.volume + 10;
            if (volUp > 100) volUp = 100;
            distube.setVolume(interaction.guildId, volUp);
            interaction.followUp({ content: `🔊 ปรับระดับเสียงขึ้นเป็น ${volUp}%`, ephemeral: true });
            break;

        case 'btn_stop':
            distube.stop(interaction.guildId);
            interaction.followUp({ content: '⏹️ หยุดเล่นและออกจากห้องแล้วครับ!', ephemeral: true });
            break;
    }
});

client.login(process.env.DISCORD_TOKEN);