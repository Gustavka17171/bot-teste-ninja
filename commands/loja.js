const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const produtos = require("../data/produtos.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loja")
    .setDescription("Ver produtos"),
  async execute(i) {
    const e = new EmbedBuilder().setTitle("🛒 Loja").setColor("Green");
    produtos.forEach(p =>
      e.addFields({ name: p.nome, value: `R$${p.preco} | Estoque: ${p.estoque}` })
    );
    i.reply({ embeds: [e] });
  }
};

