const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const fila = [];
const LIMITE = 2;

client.once("ready", async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("painel")
      .setDescription("Criar painel da fila")
  ];

  await client.application.commands.set(commands);
});

// ================= INTERAÇÕES =================
client.on("interactionCreate", async (i) => {
  try {

    // ===== SLASH /painel =====
    if (i.isChatInputCommand()) {
      if (i.commandName === "painel") {

        await i.deferReply(); // ← EVITA TIMEOUT

        const embed = new EmbedBuilder()
          .setTitle("1x1 | Fila")
          .setDescription("Clique para entrar na fila")
          .addFields({
            name: "Jogadores",
            value: fila.length
              ? fila.map(id => `<@${id}>`).join("\n")
              : "Nenhum jogador"
          })
          .setFooter({ text: "Sistema de fila" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("entrar")
            .setLabel("Entrar")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("sair")
            .setLabel("Sair")
            .setStyle(ButtonStyle.Danger)
        );

        return i.editReply({ embeds: [embed], components: [row] });
      }
    }

    // ===== BOTÕES =====
    if (i.isButton()) {

      // ENTRAR
      if (i.customId === "entrar") {
        if (fila.includes(i.user.id))
          return i.reply({ content: "❌ Você já está na fila.", ephemeral: true });

        fila.push(i.user.id);
        await i.reply({ content: "✅ Entrou na fila!", ephemeral: true });

        // MATCH
        if (fila.length === LIMITE) {
          const jogadores = [...fila];
          fila.length = 0;

          const canal = await i.guild.channels.create({
            name: "match-1x1",
            type: ChannelType.GuildText,
            permissionOverwrites: [
              {
                id: i.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
              },
              ...jogadores.map(id => ({
                id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
              }))
            ]
          });

          const embedMatch = new EmbedBuilder()
            .setTitle("Confirmação de Match")
            .setDescription(jogadores.map(id => `<@${id}>`).join("\n"))
            .setFooter({ text: "Aguarde o admin" });

          const adminRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("enviar_sala")
              .setLabel("Enviar Sala")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("fechar")
              .setLabel("Fechar Canal")
              .setStyle(ButtonStyle.Danger)
          );

          canal.send({ embeds: [embedMatch], components: [adminRow] });
        }
      }

      // SAIR
      if (i.customId === "sair") {
        const index = fila.indexOf(i.user.id);
        if (index !== -1) fila.splice(index, 1);
        return i.reply({ content: "🚪 Saiu da fila.", ephemeral: true });
      }

      // FECHAR CANAL
      if (i.customId === "fechar") {
        if (!i.memberPermissions.has("Administrator"))
          return i.reply({ content: "Sem permissão", ephemeral: true });

        return i.channel.delete();
      }

      // MODAL SALA
      if (i.customId === "enviar_sala") {
        const modal = new ModalBuilder()
          .setCustomId("modal_sala")
          .setTitle("Enviar Sala");

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("dados")
              .setLabel("ID | Senha")
              .setStyle(TextInputStyle.Paragraph)
          )
        );

        return i.showModal(modal);
      }
    }

    // ===== MODAL SUBMIT =====
    if (i.type === InteractionType.ModalSubmit) {
      if (i.customId === "modal_sala") {
        const dados = i.fields.getTextInputValue("dados");

        return i.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Sala do Match")
              .setDescription(dados)
          ]
        });
      }
    }

  } catch (err) {
    console.error(err);
    if (!i.replied)
      i.reply({ content: "❌ Erro interno.", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
