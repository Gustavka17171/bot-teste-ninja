const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= SLASH COMMANDS =================
const commands = [
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Mostrar status do servidor'),

  new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Editar painel do embed')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// ================= READY =================
client.once('ready', async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log('✅ Slash commands registrados');
});

// ================= INTERACTIONS =================
client.on('interactionCreate', async interaction => {

  // /STATUS
  if (interaction.isChatInputCommand() && interaction.commandName === 'status') {

    const embed = new EmbedBuilder()
      .setTitle('Los Angeles Crimes Online')
      .setDescription('Servidor online')
      .setFooter({ text: 'Status automático' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // /PAINEL → MODAL
  if (interaction.isChatInputCommand() && interaction.commandName === 'painel') {

    const modal = new ModalBuilder()
      .setCustomId('painelModal')
      .setTitle('Editar Painel');

    const titulo = new TextInputBuilder()
      .setCustomId('titulo')
      .setLabel('Título')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const descricao = new TextInputBuilder()
      .setCustomId('descricao')
      .setLabel('Descrição')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const rodape = new TextInputBuilder()
      .setCustomId('rodape')
      .setLabel('Rodapé')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titulo),
      new ActionRowBuilder().addComponents(descricao),
      new ActionRowBuilder().addComponents(rodape)
    );

    return interaction.showModal(modal);
  }

  // MODAL SUBMIT
  if (interaction.isModalSubmit() && interaction.customId === 'painelModal') {

    const titulo = interaction.fields.getTextInputValue('titulo');
    const descricao = interaction.fields.getTextInputValue('descricao');
    const rodape = interaction.fields.getTextInputValue('rodape') || ' ';

    const embed = new EmbedBuilder()
      .setTitle(titulo)
      .setDescription(descricao)
      .setFooter({ text: rodape })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
});

// ================= LOGIN =================
client.login(TOKEN);
