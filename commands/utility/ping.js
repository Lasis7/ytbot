import { SlashCommandBuilder } from 'discord.js';
import client from '../../bot.js';

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong! + delay'),
  async execute(interaction) {
    await interaction.reply(`Pong! Delay is ${client.ws.ping}ms`);
  },
};
