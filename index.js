const lemonApi = async () => {
  const api = await import('q-lemon/lib/lemon-api.js');
  return api.default;
};

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { pick } = require('./lib/pick');

require('dotenv').config();

const TOKEN = process.env.CLIENT_TOKEN;
// const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
  else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  }
  else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(TOKEN);

client.on(Events.InteractionCreate, async interaction => {

  if (interaction.customId !== 'select-game') return;
  // todo investigate retreiving site from other interaction data
  const gameId = interaction.values[0].split(',')[0];
  const site = interaction.values[0].split(',')[1];
  const api = await lemonApi();
  const embed = await pick(api, gameId, site);
  if (embed) {
    await interaction.reply({
      ephemeral: false,
      embeds: [embed],
      components: [],
    });
    await interaction.message.edit({ components: [] });
  }


});