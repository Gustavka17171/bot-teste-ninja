const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    ChannelType, 
    PermissionFlagsBits 
} = require('discord.js');
const express = require('express');

// --- SERVIDOR PARA O RENDER NÃO DESLIGAR O BOT ---
const app = express();
app.get('/', (req, res) => res.send('Bot de Tickets Online!'));
app.listen(process.env.PORT || 3000, () => console.log('Porta HTTP pronta.'));

// --- CONFIGURAÇÃO DO BOT ---
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

// Pegamos o token das variáveis de ambiente do Render
const TOKEN = process.env.TOKEN;

client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

// --- COMANDO DE SETUP ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        // Verifica se quem usou o comando tem permissão de administrador
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const embed = new EmbedBuilder()
            .setTitle('Benefícios do Plano Free')
            .setColor('#5865F2')
            .setDescription(
                '• Hospedagem rápida e estável\n' +
                '• Suporte básico da equipe\n' +
                '• Sem necessidade de pagamento\n\n' +
                '**Memória RAM:** 1 GB\n' +
                '**Processador:** 1 vCPU\n' +
                '**Armazenamento:** 10 GB NVMe\n\n' +
                'Clique no botão abaixo para abrir seu ticket e garantir seu acesso!'
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('abrir_ticket')
                .setLabel('Abrir Ticket')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => null); // Apaga a mensagem !setup
    }
});

// --- SISTEMA DE INTERAÇÕES (BOTÕES) ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // Quando clica em "Abrir Ticket"
    if (interaction.customId === 'abrir_ticket') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('login_discord').setLabel('Discord').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('login_github').setLabel('GitHub').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('login_email').setLabel('Email').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ 
            content: 'Para continuar, informe por onde sua conta foi criada clicando em uma das opções:', 
            components: [row], 
            ephemeral: true 
        });
    }

    // Quando escolhe o método de login (Discord, Github ou Email)
    if (interaction.customId.startsWith('login_')) {
        const metodo = interaction.customId.replace('login_', '');
        
        // Cria o canal de ticket
        const canal = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const ticketEmbed = new EmbedBuilder()
            .setTitle('Ticket Plano Free - ShardCloud')
            .setColor('#FFFF00')
            .addFields(
                { name: '👤 Membro', value: `${interaction.user.tag}`, inline: true },
                { name: '📌 Tipo', value: metodo.toUpperCase(), inline: true },
                { name: '📅 Conta criada há', value: `${Math.floor((Date.now() - interaction.user.createdTimestamp) / (1000 * 60 * 60 * 24))} dias` }
            )
            .setFooter({ text: 'ShardCloud • Hoje' });

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Fechar').setStyle(ButtonStyle.Danger)
        );

        await canal.send({ content: `Olá <@${interaction.user.id}>, a equipa responderá em breve.`, embeds: [ticketEmbed], components: [closeRow] });
        
        await interaction.editReply({ content: `O seu ticket foi criado aqui: ${canal}`, components: [] });
    }

    // Quando clica em "Fechar"
    if (interaction.customId === 'fechar_ticket') {
        await interaction.reply('O ticket será fechado em 5 segundos...');
        setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
    }
});

client.login(TOKEN);
