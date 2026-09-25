// Registers only /board. POST upserts a single guild command, so it won't
// wipe other commands the same app (e.g. omoi) already has, unlike a bulk PUT.
import { loadConfig } from './config.js';
import { BOARD_COMMAND } from './command.js';

export async function registerBoard({ token, appId, guildId }, fetchImpl = fetch) {
  const res = await fetchImpl(`https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`, {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(BOARD_COMMAND),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Discord API ${res.status}: ${body}`);
  return JSON.parse(body);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { discord } = loadConfig(process.env, ['DISCORD_TOKEN', 'DISCORD_APP_ID', 'DISCORD_GUILD_ID']);
  const cmd = await registerBoard(discord);
  console.log(`registered /${cmd.name} (${cmd.id}) in guild ${discord.guildId}`);
}
