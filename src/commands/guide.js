import { EmbedBuilder } from 'discord.js';

export function buildGuideEmbeds() {
  return [
    new EmbedBuilder()
      .setAuthor({ name: 'Lotus \u2500 Warframe Tracker' })
      .setTitle('Welcome, Tenno')
      .setDescription(
        'This bot provides **live-updating trackers** and **slash commands** ' +
        'to help you stay on top of everything in Warframe.\n\n' +
        'Tracker channels update automatically every 60 seconds. ' +
        'Slash commands are **private** \u2500 only you see the results.'
      )
      .setColor(0x4A90D9),

    new EmbedBuilder()
      .setTitle('Slash Commands')
      .setDescription(
        '**Item Lookup**\n' +
        '`/price <item>` \u2500 Market prices with 48h and 90d stats\n' +
        '`/where <item>` \u2500 Drop locations and sources\n' +
        '`/relic <name>` \u2500 Relic contents grouped by rarity\n' +
        '`/ducats [item]` \u2500 Ducat value of a Prime part (or top 20)\n\n' +
        '**Info Cards**\n' +
        '`/warframe <name>` \u2500 Stats, abilities, augments, how to farm\n' +
        '`/weapon <name>` \u2500 Stats, damage, incarnon, components\n' +
        '`/mod <name>` \u2500 Stats per rank, drop sources, mod card image\n\n' +
        '**Trading**\n' +
        '`/riven <weapon>` \u2500 Live riven auctions with stat and price filters\n' +
        '`/vaulted [category]` \u2500 Browse all vaulted Prime items\n\n' +
        '**Other**\n' +
        '`/help` \u2500 Quick command reference'
      )
      .setColor(0x4A90D9),

    new EmbedBuilder()
      .setTitle('Live Tracker Channels')
      .setDescription(
        '**Missions**\n' +
        'Void Fissures \u2022 Void Storms \u2022 Sortie \u2022 Archon Hunt\n\n' +
        '**Traders**\n' +
        'Baro Ki\'Teer \u2022 Varzia (Prime Resurgence) \u2022 Darvo\'s Deal\n\n' +
        '**World State**\n' +
        'World Cycles \u2022 Invasions \u2022 Alerts \u2022 Events \u2022 News\n\n' +
        '**Endgame**\n' +
        'Nightwave \u2022 Steel Path \u2022 Deep Archimedea \u2022 The Circuit\n\n' +
        '**Other**\n' +
        'Global Boosters \u2022 Fomorian/Razorback Progress \u2022 1999 Calendar'
      )
      .setColor(0x4A90D9),

    new EmbedBuilder()
      .setTitle('Tips')
      .setDescription(
        '\u2022 All commands have **autocomplete** \u2500 start typing and pick from suggestions\n' +
        '\u2022 Search for a **set** (e.g. `/price Frost Prime Set`) to see part breakdowns\n' +
        '\u2022 `/riven` supports filters: positive stat, negative stat, max price, max rolls, sort\n' +
        '\u2022 Tracker data comes from DE\'s official API\n' +
        '\u2022 Prices from warframe.market \u2022 Items from warframestat.us'
      )
      .setColor(0x4A90D9),
  ];
}
