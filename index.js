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
    let txt = "🛒 **LOJA**
