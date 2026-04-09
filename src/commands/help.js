import { EmbedBuilder } from 'discord.js';

export async function help(interaction) {
  const embeds = [
    new EmbedBuilder()
      .setAuthor({ name: 'Lotus \u2500 Warframe Tracker' })
      .setDescription(
        'A live-updating Warframe tracker and info bot.\n' +
        'Channels update automatically. Slash commands are private \u2500 only you see the results.'
      )
      .setColor(0x4A90D9),

    new EmbedBuilder()
      .setTitle('Slash Commands')
      .setDescription(
        '**`/price <item>`** \u2500 Market prices (48h + 90d stats)\n' +
        '**`/where <item>`** \u2500 Drop locations and sources\n' +
        '**`/relic <name>`** \u2500 Relic contents and drop chances\n' +
        '**`/warframe <name>`** \u2500 Stats, abilities, augments, farm locations\n' +
        '**`/weapon <name>`** \u2500 Stats, damage, incarnon, components\n' +
        '**`/mod <name>`** \u2500 Stats per rank, drop sources, mod card\n' +
        '**`/riven <weapon>`** \u2500 Live riven auctions with stat/price filters\n' +
        '**`/ducats [item]`** \u2500 Ducat values (or top 20 if no item)\n' +
        '**`/vaulted [category]`** \u2500 All vaulted Prime items\n' +
        '**`/help`** \u2500 This message'
      )
      .setColor(0x4A90D9),

    new EmbedBuilder()
      .setTitle('Live Trackers')
      .setDescription(
        'These channels update automatically every 60 seconds:\n\n' +
        '**Missions** \u2500 Fissures, Void Storms, Sortie, Archon Hunt\n' +
        '**Traders** \u2500 Baro Ki\'Teer, Varzia, Darvo\'s Deal\n' +
        '**World** \u2500 World Cycles, Invasions, Alerts, Events\n' +
        '**Endgame** \u2500 Nightwave, Steel Path, Deep Archimedea, The Circuit\n' +
        '**Other** \u2500 Global Boosters, Fomorian/Razorback, 1999 Calendar, News'
      )
      .setColor(0x4A90D9),

    new EmbedBuilder()
      .setTitle('Tips')
      .setDescription(
        '\u2022 All commands have **autocomplete** \u2500 start typing and pick from suggestions\n' +
        '\u2022 Search for a **set** (e.g. `/price Frost Prime Set`) to see individual part breakdowns\n' +
        '\u2022 `/riven` supports optional filters: positive stat, negative stat, max price, max rolls\n' +
        '\u2022 Tracker data comes from DE\'s official API, prices from warframe.market'
      )
      .setColor(0x4A90D9),
  ];

  await interaction.reply({ embeds, ephemeral: true });
}
