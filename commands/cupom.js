const { SlashCommandBuilder } = require("discord.js");
const cupons = require("../data/cupons.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cupom")
    .setDescription("Usar cupom")
    .addStringOption(o =>
      o.setName("codigo").setDescription("Código do cupom").setRequired(true)
    ),
  async execute(i) {
    const c = cupons.find(
      x => x.codigo === i.options.getString("codigo")
    );
    if (!c) return i.reply("❌ Cupom inválido.");
    i.reply(`🎟️ Cupom aplicado: ${c.codigo}`);
  }
};

