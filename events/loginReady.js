import { Events, ActivityType } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  // Run when client is ready
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    client.user.setActivity('Eurodancer', { type: ActivityType.Listening });
  },
};
