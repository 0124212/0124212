const REQUIRED = [
  'DISCORD_TOKEN',
  'DISCORD_APP_ID',
  'DISCORD_GUILD_ID',
  'PLANE_API_KEY',
  'PLANE_WORKSPACE_SLUG',
  'PLANE_PROJECT_ID',
];

export function loadConfig(env = process.env, required = REQUIRED) {
  const missing = required.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`missing env: ${missing.join(', ')}`);
  }
  const baseUrl = (env.PLANE_BASE_URL || 'https://api.plane.so').replace(/\/+$/, '');
  return {
    discord: {
      token: env.DISCORD_TOKEN,
      appId: env.DISCORD_APP_ID,
      guildId: env.DISCORD_GUILD_ID,
      allowedRoleIds: (env.BOARD_ALLOWED_ROLE_IDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    },
    plane: {
      apiKey: env.PLANE_API_KEY,
      baseUrl,
      webUrl: (env.PLANE_WEB_URL || baseUrl).replace(/\/+$/, ''),
      workspaceSlug: env.PLANE_WORKSPACE_SLUG,
      projectId: env.PLANE_PROJECT_ID,
    },
  };
}
