import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  InteractionType
} from "discord.js";
import fs from "fs";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const load = (file) =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};

const save = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

client.once("ready", async () => {
  console.log(`🤖 Online como ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("ativar")
      .setDescription("Ativar com key")
      .addStringOption(o =>
        o.setName("key").setDescription("Sua key").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("painel")
      .setDescription("Editar painel"),

    new SlashCommandBuilder()
      .setName("players")
      .setDescription("Definir players")
      .addIntegerOption(o =>
        o.setName("quantidade").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("status")
      .setDescription("Mostrar status")
  ];

  await client.application.commands.set(commands);
});

client.on("interactionCreate", async (i) => {
  try {
    const keys = load("keys.json");
    const painel = load("painel.json");

    // ===== ATIVAR =====
    if (i.commandName === "ativar") {
      const key = i.options.getString("key");
      if (!keys[key])
        return i.reply({ content: "❌ Key inválida.", ephemeral: true });

      painel[i.guild.id] ??= {};
      painel[i.guild.id].ativo = true;
      save("painel.json", painel);

      return i.reply("✅ Bot ativado!");
    }

    if (!painel[i.guild.id]?.ativo)
      return i.reply({ content: "❌ Bot não ativado.", ephemeral: true });

    // ===== PAINEL =====
    if (i.commandName === "painel") {
      const modal = new ModalBuilder()
        .setCustomId("editar_painel")
        .setTitle("Editar Painel");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("titulo")
            .setLabel("Título")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("descricao")
            .setLabel("Descrição")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("rodape")
            .setLabel("Rodapé")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        )
      );

      return i.showModal(modal);
    }

    // ===== MODAL =====
    if (i.type === InteractionType.ModalSubmit && i.customId === "editar_painel") {
      painel[i.guild.id] ??= {};

      painel[i.guild.id].titulo = i.fields.getTextInputValue("titulo");
      painel[i.guild.id].descricao = i.fields.getTextInputValue("descricao");
      painel[i.guild.id].rodape = i.fields.getTextInputValue("rodape");

      save("painel.json", painel);

      return i.reply({ content: "✅ Painel salvo!", ephemeral: true });
    }

    // ===== PLAYERS =====
    if (i.commandName === "players") {
      painel[i.guild.id] ??= {};
      painel[i.guild.id].players = i.options.getInteger("quantidade");

      save("painel.json", painel);
      return i.reply("✅ Players atualizados!");
    }

    // ===== STATUS =====
    if (i.commandName === "status") {
      await i.deferReply();

      const p = painel[i.guild.id] || {};

      const embed = new EmbedBuilder()
        .setTitle(p.titulo || "Status do Servidor")
        .setDescription(
          `${p.descricao || "Servidor Los Angeles Crimes"}\n\n**Players:** ${p.players ?? 0}`
        )
        .setFooter({ text: p.rodape || "" });

      return i.editReply({ embeds: [embed] });
    }
  } catch (err) {
    console.error(err);
    if (!i.replied)
      i.reply({ content: "❌ Erro interno.", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
