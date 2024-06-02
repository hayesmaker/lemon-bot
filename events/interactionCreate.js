const { Events } = require('discord.js');
// const {setTimeout: wait} = require("node:timers/promises");

const wait = require('node:timers/promises').setTimeout;

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
        // const message = await interaction.fetchReply();
        // console.log(message);

        await wait(2000);
        await interaction.editReply('Pong again!');
        return;
      }

      await command.execute(interaction);


    }
    catch (error) {
      console.error(`Error executing ${interaction.commandName}`);
      console.error(error);
    }
  },
};