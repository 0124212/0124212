import { Client, Events, GatewayIntentBits } from 'discord.js';
import { loadConfig } from './config.js';
import { createPlaneClient } from './plane.js';
import { BOARD_COMMAND, handleBoard } from './command.js';

const config = loadConfig();
const plane = createPlaneClient(config.plane);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => console.log(`ready as ${c.user.tag}`));

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== BOARD_COMMAND.name) return;
  try {
    await handleBoard(interaction, { plane, allowedRoleIds: config.discord.allowedRoleIds });
  } catch (err) {
    console.error('interaction failed:', err);
  }
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => client.destroy().finally(() => process.exit(0)));
}

client.login(config.discord.token);
