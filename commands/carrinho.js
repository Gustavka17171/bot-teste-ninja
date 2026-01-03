const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const carrinhos = require("../data/carrinhos.json");
const produtos = require("../data/produtos.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("carrinho")
    .setDescription("Adicionar produto")
    .addIntegerOption(o =>
      o.setName("id").setDescription("ID do produto").setRequired(true)
    ),
  async execute(i) {
    const id = i.options.getInteger("id");
    const p = produtos.find(x => x.id === id);
    if (!p) return i.reply("❌ Produto não existe.");

    carrinhos[i.user.id] ??= [];
    carrinhos[i.user.id].push(p);

    fs.writeFileSync("./data/carrinhos.json", JSON.stringify(carrinhos, null, 2));
    i.reply(`✅ ${p.nome} adicionado ao carrinho`);
  }
};

