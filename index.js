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
if (interaction.isModalSubmit() && interaction.customId === 'painelModal') {
  try {
    const titulo = interaction.fields.getTextInputValue('titulo').trim();
    const descricao = interaction.fields.getTextInputValue('descricao').trim();
    const rodape = interaction.fields.getTextInputValue('rodape')?.trim() || ' ';
    let cor = interaction.fields.getTextInputValue('cor').trim();

    // NORMALIZAR COR
    if (!cor.startsWith('#')) cor = `#${cor}`;

    const hexRegex = /^#([0-9A-Fa-f]{6})$/;

    // SE A COR FOR INVÁLIDA → USAR PADRÃO (NÃO QUEBRA)
    if (!hexRegex.test(cor)) {
      cor = '#00ff00';
    }

    const embed = new EmbedBuilder()
      .setTitle(titulo || 'Status do Servidor')
      .setDescription(descricao || ' ')
      .setColor(cor)
      .setFooter({ text: rodape })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });

  } catch (err) {
    console.error('ERRO NO MODAL:', err);

    if (!interaction.replied) {
      return interaction.reply({
        content: '❌ Erro ao criar o painel. Verifique os dados.',
        ephemeral: true
      });
    }
  }
}

});

client.login(process.env.TOKEN);
