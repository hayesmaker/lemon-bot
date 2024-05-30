const {
  EmbedBuilder,
} = require('discord.js');
const qLemonPackage = require("q-lemon/package.json");
const botPackage = require("../package.json");


async function pick(api, gameId) {

  const footerTxt = `Lemon Bot v${botPackage.version} - powered by q-lemon v${qLemonPackage.version}`;
  // const defaultDesc = 'Add Lemon-Bot to your own Discord server and have fun with your own C64 game searches!'
  // const defaultImg = 'https://media.discordapp.net/attachments/752892347511079043/1066357652403277934/search-img.png';

  const pickedGame = await api.getGameByGameId(gameId);
  const google = 'http://www.google.com';

  if (!pickedGame) {
    return new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('No Game Found with Game ID ' + gameId)
      .setURL(google)
      .setAuthor({
        name: `Lemon Pick ${gameId}`,
        iconURL: 'https://www.lemon64.com/assets/themes/lemon64/c64-flash-2x.png',
        url: 'https://www.npmjs.com/package/q-lemon',
      })
      .setDescription(defaultDesc)
      .setThumbnail('https://www.lemon64.com/assets/themes/lemon64/logos/logo-2x.png')
      // .addFields({name: 'Matched Results', value: fields && fields.length.toString(), inline: false})
      .setImage(defaultImg)
      .setTimestamp()
      .setFooter({
        text: footerTxt,
        iconURL: 'https://avatars.githubusercontent.com/u/6078720?s=200&v=4'
      });
  }

  const realSearchUrl = pickedGame.gameHref; // api.getSearchUrl(title);
  const title = pickedGame.gameTitle;
  const dev = Array.isArray(pickedGame.metadata.developer) ?
    pickedGame.metadata.developer.join(', ') :
    pickedGame.metadata.developer;
  const musician = Array.isArray(pickedGame.metadata.musician) ?
    pickedGame.metadata.musician.join(', ') :
    pickedGame.metadata.musician;
  const genre = Array.isArray(pickedGame.metadata.genres) ?
    pickedGame.metadata.genres.join(', ') :
    pickedGame.metadata.genres;
  const retail = Array.isArray(pickedGame.metadata.retail) ?
    pickedGame.metadata.retail.join(', ') :
    pickedGame.metadata.retail;

  console.log('pickedGame.metadata.voterScore', pickedGame.metadata.votes);
  let voterScore = 'No votes yet';
  if (pickedGame.metadata.votes && pickedGame.metadata.votes.reviewCount) {
    voterScore = `${pickedGame.metadata.voterScore}/10 from ${pickedGame.metadata.votes.reviewCount} votes`;
  }

  const fields = [
    {
      name: 'Year',
      value: pickedGame.metadata.year,
      inline: false,
    },
    {
      name: 'Publisher',
      value: pickedGame.metadata.publisher,
      inline: true,
    },
    {
      name: 'Developer',
      value: dev,
      inline: true,
    },
    {
      name: 'Musician',
      value: musician,
      inline: true,
    },
    {
      name: 'Genre',
      value: genre,
      inline: true,
    },
    {
      name: 'Lemon Score',
      value: voterScore
    },
    {
      name: 'Retail',
      value: retail
    },
  ];

  let screenshotUrl = pickedGame.metadata.screenshots && pickedGame.metadata.screenshots.length ?
    pickedGame.metadata.screenshots[Math.floor(Math.random() * pickedGame.metadata.screenshots.length)] :
    'https://media.discordapp.net/attachments/752892347511079043/1066357652403277934/search-img.png';

  let imageUrl = pickedGame.metadata.scans && pickedGame.metadata.scans.length ?
    pickedGame.metadata.scans[0] : screenshotUrl;

  return new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(title)
    .setURL(realSearchUrl)
    .setAuthor({
      name: `Lemon Pick ${gameId}`,
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

module.exports = {
  pick,
}

