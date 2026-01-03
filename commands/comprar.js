if (comando === "comprar") {
  const carrinhos = JSON.parse(fs.readFileSync(carrinhosPath));
  const carrinho = carrinhos[message.author.id];

  if (!carrinho || carrinho.length === 0) {
    return message.reply("🛒 Seu carrinho está vazio");
  }

  let total = 0;
  carrinho.forEach(p => total += p.preco);

  delete carrinhos[message.author.id];
  fs.writeFileSync(carrinhosPath, JSON.stringify(carrinhos, null, 2));

  message.reply(`💸 Compra finalizada!\nTotal: **R$${total}**`);
}
