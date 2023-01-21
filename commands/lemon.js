const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Events
} = require('discord.js');

const packageJson = require('../package.json');

const lemonApi = async () => {
    const api = await import('q-lemon/lib/lemon-api.js');
    return api.default;
};

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
        ),

    async execute(interaction) {

        const api = await lemonApi();
        let embed;

        const footerTxt = 'Lemon-Bot is here to search for your games on Lemon64!\nSearch powered by q-lemon v'
                + packageJson.version;

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

            const realSearchUrl = api.getSearchUrl(title);
            embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Search Results for ' + title)
                .setURL(realSearchUrl)
                .setAuthor({
                    name: 'Lemon Search',
                    iconURL: 'https://www.lemon64.com/assets/themes/lemon64/c64-flash-2x.png',
                    url: 'https://www.npmjs.com/package/q-lemon',
                })
                .setDescription('Q-Lemon can power your own searches for games on Lemon64!')
                .setThumbnail('https://www.lemon64.com/assets/themes/lemon64/logos/logo-2x.png')
                .addFields(fields)
                .addFields({name: 'Matched Results', value: fields && fields.length.toString(), inline: false})
                .setImage('https://media.discordapp.net/attachments/752892347511079043/1066357652403277934/search-img.png')
                .setTimestamp()
                .setFooter({
                    text: footerTxt,
                    iconURL: 'https://avatars.githubusercontent.com/u/6078720?s=200&v=4'
                });

        } else if (interaction.options.getSubcommand() === 'pick') {
            const gameId = interaction.options.getString('game-id');
            const pickedGame = await api.getGameByGameId(gameId);
            console.log('Picked Game:', pickedGame);

            const realSearchUrl = pickedGame.gameHref; // api.getSearchUrl(title);
            const title = pickedGame.gameTitle;
            const fields = [
                {
                    name: 'Year',
                    value: pickedGame.metadata.year
                },
                {
                    name: 'Publisher',
                    value: pickedGame.metadata.publisher
                },
                {
                    name: 'Developer',
                    value: pickedGame.metadata.developer.join(', ')
                },
                {
                    name: 'Musician',
                    value: pickedGame.metadata.musician.join(', ')
                },
                {
                    name: 'Genre',
                    value: pickedGame.metadata.genres.join(', ')
                },
                {
                    name: 'Retail',
                    value: pickedGame.metadata.retail
                },
            ];

            let imageUrl = pickedGame.metadata.scans && pickedGame.metadata.scans.length ?
                pickedGame.metadata.scans[0] :
                'https://media.discordapp.net/attachments/752892347511079043/1066357652403277934/search-img.png';

            embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(title)
                .setURL(realSearchUrl)
                .setAuthor({
                    name: 'Lemon Pick',
                    iconURL: 'https://www.lemon64.com/assets/themes/lemon64/c64-flash-2x.png',
                    url: 'https://www.npmjs.com/package/q-lemon',
                })
                .setDescription(pickedGame.metadata.description)
                .setThumbnail('https://www.lemon64.com/assets/themes/lemon64/logos/logo-2x.png')
                .addFields(fields)
                // .addFields({name: 'Matched Results', value: fields && fields.length.toString(), inline: false})
                .setImage(imageUrl)
                .setTimestamp()
                .setFooter({
                    text: footerTxt,
                    iconURL: 'https://avatars.githubusercontent.com/u/6078720?s=200&v=4'
                });
        }

        await interaction.reply({
            ephemeral: false,
            embeds: [embed],
            components: []
        });
    },
};