const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const produtos = require("../data/produtos.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Criar produto")
    .addStringOption(o => o.setName("nome").setRequired(true))
    .addIntegerOption(o => o.setName("preco").setRequired(true))
    .addIntegerOption(o => o.setName("estoque").setRequired(true)),
  async execute(i) {
    if (!i.member.permissions.has("Administrator"))
      return i.reply("❌ Sem permissão.");

    produtos.push({
      id: produtos.length + 1,
      nome: i.options.getString("nome"),
      preco: i.options.getInteger("preco"),
      estoque: i.options.getInteger("estoque")
    });

    fs.writeFileSync("./data/produtos.json", JSON.stringify(produtos, null, 2));
    i.reply("✅ Produto criado!");
  }
};

