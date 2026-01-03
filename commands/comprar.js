const { SlashCommandBuilder } = require("discord.js");
const carrinhos = require("../data/carrinhos.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("comprar")
    .setDescription("Finalizar compra"),
  async execute(i) {
    const c = carrinhos[i.user.id];
    if (!c || !c.length) return i.reply("🛒 Carrinho vazio.");

    let total = c.reduce((s, p) => s + p.preco, 0);
    delete carrinhos[i.user.id];

    i.reply(`✅ Compra finalizada!\n💰 Total: R$${total}`);
  }
};

