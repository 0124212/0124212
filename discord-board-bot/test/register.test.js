import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerBoard } from '../src/register.js';
import { loadConfig } from '../src/config.js';
import { mockFetch } from './helpers.js';

test('registers /board as a single guild command (POST, not bulk PUT)', async () => {
  const fetch = mockFetch([{ status: 201, body: { id: 'c1', name: 'board' } }]);
  const cmd = await registerBoard({ token: 'tok', appId: 'app', guildId: 'g' }, fetch);
  assert.equal(cmd.id, 'c1');
  const [call] = fetch.calls;
  assert.equal(call.method, 'POST');
  assert.equal(call.url, 'https://discord.com/api/v10/applications/app/guilds/g/commands');
  assert.equal(call.headers.Authorization, 'Bot tok');
  assert.equal(call.json.name, 'board');
});

test('loadConfig lists every missing var', () => {
  assert.throws(() => loadConfig({ DISCORD_TOKEN: 'x' }), /missing env: DISCORD_APP_ID, DISCORD_GUILD_ID, PLANE_API_KEY/);
});

test('loadConfig parses roles and trims urls', () => {
  const c = loadConfig({
    DISCORD_TOKEN: 't', DISCORD_APP_ID: 'a', DISCORD_GUILD_ID: 'g',
    PLANE_API_KEY: 'k', PLANE_WORKSPACE_SLUG: 'w', PLANE_PROJECT_ID: 'p',
    PLANE_BASE_URL: 'https://plane.example.com/', BOARD_ALLOWED_ROLE_IDS: '1, 2,,',
  });
  assert.deepEqual(c.discord.allowedRoleIds, ['1', '2']);
  assert.equal(c.plane.baseUrl, 'https://plane.example.com');
  assert.equal(c.plane.webUrl, 'https://plane.example.com');
});
