require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const PREFIX = "!";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const produtosPath = "./data/produtos.json";
const cuponsPath = "./data/cupons.json";
const carrinhosPath = "./data/carrinhos.json";

client.once("ready", () => {
  console.log(`🤖 Bot ligado como ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const produtos = JSON.parse(fs.readFileSync(produtosPath));
  const cupons = JSON.parse(fs.readFileSync(cuponsPath));
  const carrinhos = JSON.parse(fs.readFileSync(carrinhosPath));

  // !loja
  if (cmd === "loja") {
    let txt = "🛒 **LOJA VIP**\n\n";
    produtos.forEach(p => {
      txt += `🆔 ${p.id} | **${p.nome}** — R$${p.preco}\n`;
    });
    return message.reply(txt);
  }

  // !carrinho ID
  if (cmd === "carrinho") {
    const id = parseInt(args[0]);
    if (!id) return message.reply("❌ Use: `!carrinho ID`");

    const produto = produtos.find(p => p.id === id);
    if (!produto) return message.reply("❌ Produto não existe");

    if (!carrinhos[message.author.id]) {
      carrinhos[message.author.id] = { itens: [], cupom: null };
    }

    carrinhos[message.author.id].itens.push(produto);
    fs.writeFileSync(carrinhosPath, JSON.stringify(carrinhos, null, 2));

    return message.reply(`✅ **${produto.nome}** adicionado ao carrinho`);
  }

  // !vercarrinho
  if (cmd === "vercarrinho") {
    const cart = carrinhos[message.author.id];
    if (!cart || cart.itens.length === 0)
      return message.reply("🛒 Carrinho vazio");

    let total = 0;
    let txt = "🛍️ **SEU CARRINHO**\n\n";
    cart.itens.forEach(p => {
      total += p.preco;
      txt += `• ${p.nome} — R$${p.preco}\n`;
    });

    txt += `\n💰 Total: R$${total}`;
    return message.reply(txt);
  }

  // !cupom CODIGO
  if (cmd === "cupom") {
    const codigo = args[0];
    if (!codigo) return message.reply("❌ Use: `!cupom CODIGO`");

    const cupom = cupons.find(c => c.codigo === codigo);
    if (!cupom) return message.reply("❌ Cupom inválido");

    if (!carrinhos[message.author.id])
      return message.reply("❌ Carrinho vazio");

    carrinhos[message.author.id].cupom = cupom;
    fs.writeFileSync(carrinhosPath, JSON.stringify(carrinhos, null, 2));

    return message.reply(`🏷️ Cupom **${codigo}** aplicado`);
  }

  // !comprar
  if (cmd === "comprar") {
    const cart = carrinhos[message.author.id];
    if (!cart || cart.itens.length === 0)
      return message.reply("🛒 Carrinho vazio");

    let total = 0;
    cart.itens.forEach(p => total += p.preco);

    if (cart.cupom) {
      total -= (total * cart.cupom.valor) / 100;
    }

    delete carrinhos[message.author.id];
    fs.writeFileSync(carrinhosPath, JSON.stringify(carrinhos, null, 2));

    return message.reply(
      `💸 **COMPRA FINALIZADA**\nTotal a pagar: **R$${total.toFixed(2)}**\n\n📲 PIX: **SUA_CHAVE_PIX_AQUI**`
    );
  }
});

client.login(process.env.TOKEN);
