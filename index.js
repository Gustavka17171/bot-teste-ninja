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

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// SLASH COMMAND
const commands = [
  new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Abrir painel de edição do embed')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );
});

// INTERACTIONS
client.on('interactionCreate', async interaction => {

  // ABRIR MODAL
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'painel') {

      const modal = new ModalBuilder()
        .setCustomId('painelModal')
        .setTitle('Editar Painel');

      const titulo = new TextInputBuilder()
        .setCustomId('titulo')
        .setLabel('Título do Embed')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const cor = new TextInputBuilder()
        .setCustomId('cor')
        .setLabel('Cor HEX (ex: #00ff00)')
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
        new ActionRowBuilder().addComponents(cor),
        new ActionRowBuilder().addComponents(descricao),
        new ActionRowBuilder().addComponents(rodape)
      );

      await interaction.showModal(modal);
    }
  }

  // RECEBER MODAL
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'painelModal') {

      const titulo = interaction.fields.getTextInputValue('titulo');
      const cor = interaction.fields.getTextInputValue('cor');
      const descricao = interaction.fields.getTextInputValue('descricao');
      const rodape = interaction.fields.getTextInputValue('rodape');

      const embed = new EmbedBuilder()
        .setTitle(titulo)
        .setDescription(descricao)
        .setColor(cor)
        .setFooter({ text: rodape || ' ' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed]
      });
    }
  }
});

client.login(process.env.TOKEN);
