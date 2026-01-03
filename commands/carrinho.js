const fs = require("fs");
const carrinhosPath = "./data/carrinhos.json";

if (comando === "carrinho") {
  const id = parseInt(args[0]);
  if (!id) return message.reply("❌ Use: `!carrinho ID`");

  const carrinhos = JSON.parse(fs.readFileSync(carrinhosPath));
  const produto = produtos.find(p => p.id === id);

  if (!produto) return message.reply("❌ Produto não encontrado");

  if (!carrinhos[message.author.id]) {
    carrinhos[message.author.id] = [];
  }

  carrinhos[message.author.id].push(produto);

  fs.writeFileSync(carrinhosPath, JSON.stringify(carrinhos, null, 2));
  message.reply(`✅ **${produto.nome}** adicionado ao carrinho`);
}
