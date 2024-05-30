const {
    pick
} = require('../lib/pick');

const {
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Events
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
        .setDescription('Query Lemon 64 for a C64 Game!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Search by game title or part of title')
                .addStringOption(option => option.setName('title')
                    .setDescription('game title')
                    .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pick')
                .setDescription('Pick a game by game id')
                .addStringOption(option => option.setName('game-id')
                    .setDescription('game id')
                    .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('select')
                .setDescription('Search by game title or part of title - then select the game')
                .addStringOption(option => option.setName('title')
                    .setDescription('game title')
                    .setRequired(true)
                )
        ),

    async execute(interaction) {

        const api = await lemonApi();
        let embed;

        const footerTxt = `Lemon Bot v${botPackage.version} - powered by q-lemon v${qLemonPackage.version}`;
        const defaultDesc = 'Add Lemon-Bot to your own Discord server and have fun with your own C64 game searches!'
        const defaultImg = 'https://media.discordapp.net/attachments/752892347511079043/1066357652403277934/search-img.png';

        if (interaction.options.getSubcommand() === 'search') {
            const title = interaction.options.getString('title');
            const searchedGames = await api.searchGame(title);
            const fields = searchedGames.map((g) => {
                return {
                    name: g.gameTitle,
                    value: 'Game ID: ' + g.gameId.toString(),
                    inline: false
                }
            });
            const embedTitle = searchedGames.length ?
                `Search for ${title}` :
                `No Results found for ${title}`;
            const realSearchUrl = api.getSearchUrl(title);
            embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(embedTitle)
                .setURL(realSearchUrl)
                .setAuthor({
                    name: 'Lemon Search',
                    iconURL: 'https://www.lemon64.com/assets/themes/lemon64/c64-flash-2x.png',
                    url: 'https://www.npmjs.com/package/q-lemon',
                })
                .setDescription(defaultDesc)
                .setThumbnail('https://www.lemon64.com/assets/themes/lemon64/logos/logo-2x.png')
                .addFields(fields)
                .addFields({name: 'Matched Results', value: fields && fields.length.toString(), inline: false})
                .setImage(defaultImg)
                .setTimestamp()
                .setFooter({
                    text: footerTxt,
                    iconURL: 'https://avatars.githubusercontent.com/u/6078720?s=200&v=4'
                });

        } else if (interaction.options.getSubcommand() === 'select' ) {
            const title = interaction.options.getString('title');
            const searchedGames = await api.searchGame(title);
            const fields = searchedGames.map((g) => {
                return {
                    name: g.gameTitle,
                    value: 'Game ID: ' + g.gameId.toString(),
                    inline: false,
                    gameId: g.gameId.toString(),
                }
            });

            if (fields.length === 0) {
                const embedTitle = `No Results found for ${title}`;
                await interaction.reply({
                    content: embedTitle,
                    components: []
                });
                return;
            }

            let shortendFields = fields.slice(0, 24);

            const realSearchUrl = api.getSearchUrl(title);

            const options = shortendFields.map((field) => {
                return new StringSelectMenuOptionBuilder()
                  .setLabel(field.name)
                  .setDescription(field.value)
                  .setValue(field.gameId)
            });

            const select = new StringSelectMenuBuilder()
              .setCustomId('select-game')
              .setPlaceholder('Please Select')
              .addOptions(options);

            const row = new ActionRowBuilder()
              .addComponents(select);

            let warning = '';
            if (fields.length > 25) {
                warning += ' (discord can only show the first 25 - use `lemon search` for more results)'
            }

            await interaction.reply({
                content: `${fields.length} results found for ${title} - please select a game from the list below: ${warning}`,
                components: [row],
            });

        } else if (interaction.options.getSubcommand() === 'pick') {
            const gameId = interaction.options.getString('game-id');
            embed = await pick(api, gameId);
        }

        // only searches and picks spawn embeds currently
        // selects need an alternative interaction.reply
        if (embed) {
            await interaction.reply({
                ephemeral: false,
                embeds: [embed],
                components: []
            });
        }

    },
};