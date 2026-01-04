const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const express = require('express');

// --- MINI SERVIDOR PARA O RENDER ---
const app = express();
app.get('/', (req, res) => res.send('Bot Online!'));
app.listen(process.env.PORT || 3000);

// --- CONFIGURAÇÃO DO BOT ---
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

const DISCORD_TOKEN = process.env.TOKEN;

client.once('ready', () => {
    console.log(`✅ Logado como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'abrir_ticket') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('login_discord').setLabel('Discord').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('login_github').setLabel('GitHub').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('login_email').setLabel('Email').setStyle(ButtonStyle.Secondary)
            );

            await interaction.reply({ 
                content: 'Para continuar, informe por onde sua conta foi criada:', 
                components: [row], 
                ephemeral: true 
            });
        }

        if (interaction.customId.startsWith('login_')) {
            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ],
            });

            const embed = new EmbedBuilder()
                .setTitle('Ticket Plano Free')
                .setDescription(`Membro: ${interaction.user.tag}\nMétodo: ${interaction.customId.replace('login_', '')}`)
                .setColor('#2b2d31');

            await canal.send({ content: `<@${interaction.user.id}>`, embeds: [embed] });
            await interaction.editReply({ content: `Ticket aberto em ${canal}`, components: [] });
        }
    }
});

client.login(DISCORD_TOKEN);
