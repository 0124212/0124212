import { PRIORITIES } from './plane.js';

// Raw JSON so register.js doesn't need discord.js.
export const BOARD_COMMAND = {
  name: 'board',
  description: 'Create an issue on the Plane board',
  type: 1,
  options: [
    { type: 3, name: 'title', description: 'Issue title', required: true, max_length: 255 },
    { type: 3, name: 'description', description: 'Details (optional)', required: false, max_length: 4000 },
    {
      type: 3,
      name: 'priority',
      description: 'Priority (default: none)',
      required: false,
      choices: PRIORITIES.map((p) => ({ name: p, value: p })),
    },
  ],
};

function hasAllowedRole(interaction, allowedRoleIds) {
  if (!allowedRoleIds.length) return true;
  const roles = interaction.member?.roles;
  // Cached GuildMember has roles.cache; uncached API member has a plain id array.
  const ids = roles?.cache ? [...roles.cache.keys()] : Array.isArray(roles) ? roles : [];
  return ids.some((id) => allowedRoleIds.includes(id));
}

export async function handleBoard(interaction, { plane, allowedRoleIds = [], log = console }) {
  if (!hasAllowedRole(interaction, allowedRoleIds)) {
    await interaction.reply({ content: "you don't have a role that can use /board", ephemeral: true });
    return;
  }

  const title = interaction.options.getString('title', true).trim();
  const description = interaction.options.getString('description') ?? '';
  const priority = interaction.options.getString('priority') ?? 'none';
  const where = interaction.channel?.name ? ` in #${interaction.channel.name}` : '';
  const footer = `via Discord /board by @${interaction.user.username}${where}`;

  // Plane can take longer than Discord's 3s reply window.
  await interaction.deferReply();
  try {
    const issue = await plane.createIssue({ title, description, priority, footer });
    await interaction.editReply(`created **${issue.key}**: [${title}](${issue.url})`);
  } catch (err) {
    log.error('plane createIssue failed:', err);
    await interaction.editReply('could not create the Plane issue, check the bot logs');
  }
}
