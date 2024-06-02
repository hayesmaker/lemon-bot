const {
  pick,
} = require('../lib/pick');

const {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');

const qLemonPackage = require('../node_modules/q-lemon/package.json');
const lemonApi = async () => {
  const api = await import('q-lemon/lib/lemon-api.js');
  return api.default;
};

const botPackage = require('../package.json');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('lemon')
    .setDescription('Use Lemon Bot to discover C64 or Amiga games')
    .addSubcommand(subcommand =>
      subcommand
        .setName('search')
        .setDescription('Search by game title or part of title')
        .addStringOption(option => option.setName('title')
          .setDescription('game title')
          .setRequired(true),
        )
        .addStringOption(option => option.setName('site')
          .setDescription('search lemon amiga or C64')
          .setRequired(false)
          .addChoices([
            { name: 'C64', value: '64' },
            { name: 'AMIGA', value: 'amiga' },
          ]),
        ),
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('pick')
        .setDescription('Pick a game by game id')
        .addStringOption(option => option.setName('game-id')
          .setDescription('game id')
          .setRequired(true),
        )
        .addStringOption(option => option.setName('site')
          .setDescription('search lemon amiga or C64')
          .setRequired(true)
          .addChoices([
            { name: 'C64', value: '64' },
            { name: 'AMIGA', value: 'amiga' },
          ]),
        ),
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('select')
        .setDescription('Search by game title or part of title - then select the game')
        .addStringOption(option => option.setName('title')
          .setDescription('game title')
          .setRequired(true),
        )
        .addStringOption(option => option.setName('site')
          .setDescription('search lemon amiga or C64')
          .setRequired(true)
          .addChoices([
            { name: 'C64', value: '64' },
            { name: 'AMIGA', value: 'amiga' },
          ]),
        ),
    ),

  async execute(interaction) {

    const api = await lemonApi();
    let embed;

    const footerTxt = `Lemon Bot v${botPackage.version} - powered by q-lemon v${qLemonPackage.version}`;
    const defaultDesc = 'Add Lemon-Bot to your own Discord server and have fun with your own C64 game searches!';
    const defaultImg = 'https://media.discordapp.net/attachments/752892347511079043/1066357652403277934/search-img.png';

    const site = interaction.options.getString('site') === 'amiga' ?
      'amiga' : 'c64';

    const lemonLogo = site === 'amiga' ?
      'https://www.lemonamiga.com/images/navigation/signs/logo.gif' :
      'https://www.lemon64.com/assets/themes/lemon64/logos/logo-2x.png';
    const iconLogo = site === 'amiga' ?
      'https://pbs.twimg.com/profile_images/1294210281770549249/442fDaTA_400x400.png' :
      'https://www.lemon64.com/assets/themes/lemon64/c64-flash-2x.png';

    console.log('Attempting to call lemon for site:', site);

    if (interaction.options.getSubcommand() === 'search') {
      const title = interaction.options.getString('title');
      const searchedGames = await api.searchGame(title, site);
      const fields = searchedGames.map((g) => {
        return {
          name: g.gameTitle,
          value: 'Game ID: ' + g.gameId.toString(),
          inline: false,
        };
      });

      if (searchedGames.length > 25) {
        const message = `Discord only allows 25 Search results to display. 
          Searching for ${title} returned ${searchedGames.length} results.
          Try to narrow the search.`;
        interaction.reply({
          content: message,
          components: [],
        });
      }


      const embedTitle = searchedGames.length ?
        `Search for ${title}` :
        `No Results found for ${title}`;
      const realSearchUrl = api.getSearchUrl(title, site);
      embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(embedTitle)
        .setURL(realSearchUrl)
        .setAuthor({
          name: 'Lemon Search',
          iconURL: iconLogo,
          url: 'https://www.npmjs.com/package/q-lemon',
        })
        .setDescription(defaultDesc)
        .setThumbnail(lemonLogo)
        .addFields(fields)
        .addFields({ name: 'Matched Results', value: fields && fields.length.toString(), inline: false })
        .setImage(defaultImg)
        .setTimestamp()
        .setFooter({
          text: footerTxt,
          iconURL: 'https://avatars.githubusercontent.com/u/6078720?s=200&v=4',
        });

    }
    else if (interaction.options.getSubcommand() === 'select') {
      const title = interaction.options.getString('title');
      const searchedGames = await api.searchGame(title, site);
      const fields = searchedGames.map((g) => {
        return {
          name: g.gameTitle,
          value: 'Game ID: ' + g.gameId.toString(),
          inline: false,
          gameId: g.gameId.toString(),
        };
      });

      if (fields.length === 0) {
        const embedTitle = `No Results found for ${title}`;
        await interaction.reply({
          content: embedTitle,
          components: [],
        });
        return;
      }

      const shortendFields = fields.slice(0, 24);

      // const realSearchUrl = api.getSearchUrl(title);

      const options = shortendFields.map((field) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(field.name)
          .setDescription(field.value)
          .setValue(`${field.gameId},${site}`);
      });

      const select = new StringSelectMenuBuilder()
        .setCustomId('select-game')
        .setPlaceholder('Please Select')
        .addOptions(options);

      const row = new ActionRowBuilder()
        .addComponents(select);

      let warning = '';
      if (fields.length > 25) {
        warning += ' (discord can only show the first 25 results)';
      }

      await interaction.reply({
        content: `${fields.length} results found for ${title} - please select a game from the list below: ${warning}`,
        components: [row],
      });

    }
    else if (interaction.options.getSubcommand() === 'pick') {
      const gameId = interaction.options.getString('game-id');
      embed = await pick(api, gameId, site);
    }

    // only searches and picks spawn embeds currently
    // selects need an alternative interaction.reply
    if (embed) {
      await interaction.reply({
        ephemeral: false,
        embeds: [embed],
        components: [],
      });
    }

  },
};