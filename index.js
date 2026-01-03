const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const KEY = process.env.KEY;

// 🔐 CONFIG KEY
if (!KEY) {
  console.log("❌ Key não definida");
  process.exit();
}

// ⚙️ CONFIG PADRÃO (EDITÁVEL PELO SLASH)
let config = {
  limite: 2,
  valor: "R$ 2,00",
  descricao: "Fila de competição 1x1",
  rodape: "Boa sorte!",
  imagem: null,
  thumbnail: null
};

// 🧠 FILA
let fila = [];
let painelMsg;
const CANAL_FILA = "COLE_AQUI_ID_DO_CANAL";

// 🔹 EMBED FILA
function embedFila() {
  const embed = new EmbedBuilder()
    .setTitle("1x1 | Fila")
    .setDescription(config.descricao)
    .addFields(
      { name: "Valor", value: config.valor },
      {
        name: "Jogadores",
        value: fila.length
          ? fila.map(j => `<@${j.id}> | ${j.modo}`).join("\n")
          : "Nenhum jogador"
      }
    )
    .setFooter({ text: config.rodape })
    .setColor("Green");

  if (config.imagem) embed.setImage(config.imagem);
  if (config.thumbnail) embed.setThumbnail(config.thumbnail);

  return embed;
}

// 🔹 BOTÕES FILA
const botoesFila = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("normal").setLabel("Gel Normal").setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId("infinito").setLabel("Gel Infinito").setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId("sair").setLabel("Sair da fila").setStyle(ButtonStyle.Danger)
);

// 🚀 READY
client.once("ready", async () => {
  console.log(`✅ ${client.user.tag} online`);

  const canal = await client.channels.fetch(CANAL_FILA);
  painelMsg = await canal.send({ embeds: [embedFila()], components: [botoesFila] });

  // SLASH
  const commands = [
    new SlashCommandBuilder()
      .setName("configurar")
      .setDescription("Configurar fila")
      .addIntegerOption(o => o.setName("limite").setDescription("Qtd jogadores").setRequired(true))
      .addStringOption(o => o.setName("valor").setDescription("Valor").setRequired(true))
      .addStringOption(o => o.setName("descricao").setDescription("Descrição").setRequired(false))
      .addStringOption(o => o.setName("rodape").setDescription("Rodapé").setRequired(false))
      .addStringOption(o => o.setName("imagem").setDescription("URL imagem").setRequired(false))
      .addStringOption(o => o.setName("thumbnail").setDescription("URL thumbnail").setRequired(false))
  ];

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

// 🔘 INTERAÇÕES
client.on("interactionCreate", async i => {

  // SLASH CONFIG
  if (i.isChatInputCommand()) {
    if (!i.memberPermissions.has("Administrator"))
      return i.reply({ content: "❌ Sem permissão", ephemeral: true });

    config.limite = i.options.getInteger("limite");
    config.valor = i.options.getString("valor");
    config.descricao = i.options.getString("descricao") ?? config.descricao;
    config.rodape = i.options.getString("rodape") ?? config.rodape;
    config.imagem = i.options.getString("imagem");
    config.thumbnail = i.options.getString("thumbnail");

    await painelMsg.edit({ embeds: [embedFila()] });
    return i.reply({ content: "✅ Configurado", ephemeral: true });
  }

  if (!i.isButton()) return;

  // SAIR
  if (i.customId === "sair") {
    fila = fila.filter(j => j.id !== i.user.id);
    await painelMsg.edit({ embeds: [embedFila()] });
    return i.reply({ content: "Saiu da fila", ephemeral: true });
  }

  // ENTRAR
  if (["normal", "infinito"].includes(i.customId)) {
    if (fila.find(j => j.id === i.user.id))
      return i.reply({ content: "Já está na fila", ephemeral: true });

    fila.push({ id: i.user.id, modo: i.customId === "normal" ? "Gel Normal" : "Gel Infinito" });
    await painelMsg.edit({ embeds: [embedFila()] });
    i.reply({ content: "Entrou na fila", ephemeral: true });

    if (fila.length === config.limite) {
      const jogadores = [...fila];
      fila = [];
      await painelMsg.edit({ embeds: [embedFila()] });

      const canal = await i.guild.channels.create({
        name: "match-1x1",
        permissionOverwrites: [
          { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          ...jogadores.map(j => ({
            id: j.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }))
        ]
      });

      const adminButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("senha").setLabel("Enviar ID/Senha").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("fechar").setLabel("Fechar Canal").setStyle(ButtonStyle.Danger)
      );

      canal.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Match Criado")
            .setDescription(jogadores.map(j => `<@${j.id}>`).join("\n"))
            .setColor("Orange")
        ],
        components: [adminButtons]
      });
    }
  }

  // ADMIN
  if (i.customId === "fechar") {
    if (!i.memberPermissions.has("Administrator")) return;
    return i.channel.delete();
  }

  if (i.customId === "senha") {
    const modal = new ModalBuilder()
      .setCustomId("modal_senha")
      .setTitle("ID e Senha");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("dados").setLabel("ID | SENHA").setStyle(TextInputStyle.Paragraph)
      )
    );

    return i.showModal(modal);
  }

  if (i.isModalSubmit() && i.customId === "modal_senha") {
    const dados = i.fields.getTextInputValue("dados");
    return i.channel.send({
      embeds: [new EmbedBuilder().setTitle("Sala").setDescription(dados).setColor("Green")]
    });
  }
});

client.login(TOKEN);
