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
  TextInputStyle
} = require("discord.js");
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.TOKEN;
const BOT_KEY = process.env.BOT_KEY;

// ================== BANCO SIMPLES ==================
const dbFile = "./db.json";
const db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile)) : {};
const save = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

// ================== CONFIG PADRÃO ==================
function defaultConfig() {
  return {
    ativo: false,
    limite: 2,
    valor: "R$ 2,00",
    descricao: "Fila 1x1",
    rodape: "Boa sorte!",
    imagem: null,
    thumbnail: null,
    fila: [],
    confirmados: []
  };
}

// ================== READY ==================
client.once("ready", async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("ativar")
      .setDescription("Ativar bot com key")
      .addStringOption(o =>
        o.setName("key").setDescription("Key").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("configurar")
      .setDescription("Configurar fila")
      .addIntegerOption(o => o.setName("limite").setDescription("Qtd jogadores").setRequired(true))
      .addStringOption(o => o.setName("valor").setDescription("Valor").setRequired(true))
      .addStringOption(o => o.setName("descricao").setDescription("Descrição").setRequired(false))
      .addStringOption(o => o.setName("rodape").setDescription("Rodapé").setRequired(false))
      .addStringOption(o => o.setName("imagem").setDescription("URL imagem").setRequired(false))
      .addStringOption(o => o.setName("thumbnail").setDescription("URL thumbnail").setRequired(false)),

    new SlashCommandBuilder()
      .setName("painel")
      .setDescription("Criar painel da fila")
  ];

  await client.application.commands.set(commands);
});

// ================== INTERAÇÕES ==================
client.on("interactionCreate", async (i) => {
  const gid = i.guild.id;
  db[gid] ??= defaultConfig();

  // ---------- ATIVAR ----------
  if (i.isChatInputCommand() && i.commandName === "ativar") {
    if (i.options.getString("key") !== BOT_KEY)
      return i.reply({ content: "❌ Key inválida", ephemeral: true });

    db[gid].ativo = true;
    save();
    return i.reply("✅ Bot ativado neste servidor");
  }

  if (!db[gid].ativo)
    return i.reply({ content: "❌ Bot não ativado", ephemeral: true });

  // ---------- CONFIGURAR ----------
  if (i.isChatInputCommand() && i.commandName === "configurar") {
    if (!i.memberPermissions.has("Administrator"))
      return i.reply({ content: "❌ Sem permissão", ephemeral: true });

    db[gid].limite = i.options.getInteger("limite");
    db[gid].valor = i.options.getString("valor");
    db[gid].descricao = i.options.getString("descricao") ?? db[gid].descricao;
    db[gid].rodape = i.options.getString("rodape") ?? db[gid].rodape;
    db[gid].imagem = i.options.getString("imagem");
    db[gid].thumbnail = i.options.getString("thumbnail");

    save();
    return i.reply({ content: "✅ Configurado", ephemeral: true });
  }

  // ---------- PAINEL ----------
  if (i.isChatInputCommand() && i.commandName === "painel") {
    const embed = new EmbedBuilder()
      .setTitle("1x1 | Fila")
      .setDescription(db[gid].descricao)
      .addFields(
        { name: "Valor", value: db[gid].valor },
        { name: "Jogadores", value: "Nenhum" }
      )
      .setFooter({ text: db[gid].rodape });

    if (db[gid].imagem) embed.setImage(db[gid].imagem);
    if (db[gid].thumbnail) embed.setThumbnail(db[gid].thumbnail);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("entrar").setLabel("Entrar").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("sair").setLabel("Sair").setStyle(ButtonStyle.Danger)
    );

    return i.reply({ embeds: [embed], components: [row] });
  }

  // ---------- BOTÕES ----------
  if (i.isButton()) {
    const cfg = db[gid];

    if (i.customId === "entrar") {
      if (cfg.fila.includes(i.user.id))
        return i.reply({ content: "Já está na fila", ephemeral: true });

      cfg.fila.push(i.user.id);
      save();
      return i.reply({ content: "Entrou na fila", ephemeral: true });
    }

    if (i.customId === "sair") {
      cfg.fila = cfg.fila.filter(id => id !== i.user.id);
      save();
      return i.reply({ content: "Saiu da fila", ephemeral: true });
    }

    if (i.customId === "fechar") {
      if (!i.memberPermissions.has("Administrator")) return;
      return i.channel.delete();
    }

    if (i.customId === "enviar_sala") {
      const modal = new ModalBuilder()
        .setCustomId("modal_sala")
        .setTitle("Sala & Senha");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("dados")
            .setLabel("ID | SENHA")
            .setStyle(TextInputStyle.Paragraph)
        )
      );

      return i.showModal(modal);
    }
  }

  // ---------- MODAL ----------
  if (i.isModalSubmit() && i.customId === "modal_sala") {
    return i.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Sala do Match")
          .setDescription(i.fields.getTextInputValue("dados"))
      ]
    });
  }
});

client.login(TOKEN);
