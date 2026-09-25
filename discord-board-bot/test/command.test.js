import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleBoard, BOARD_COMMAND } from '../src/command.js';
import { mockInteraction } from './helpers.js';

const quietLog = { error() {} };

function fakePlane(result) {
  const calls = [];
  return {
    calls,
    async createIssue(args) {
      calls.push(args);
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

test('/board creates an issue and replies with the link', async () => {
  const plane = fakePlane({ key: 'OPENO-21', url: 'https://x/i/1' });
  const i = mockInteraction({ options: { title: '  ship it ', priority: 'urgent' } });
  await handleBoard(i, { plane });

  assert.deepEqual(plane.calls, [
    { title: 'ship it', description: '', priority: 'urgent', footer: 'via Discord /board by @asher in #dev' },
  ]);
  assert.equal(i.log[0][0], 'deferReply');
  assert.deepEqual(i.log[1], ['editReply', 'created **OPENO-21**: [ship it](https://x/i/1)']);
});

test('priority defaults to none', async () => {
  const plane = fakePlane({ key: 'X-1', url: 'u' });
  await handleBoard(mockInteraction({ options: { title: 't' }, channel: null }), { plane });
  assert.equal(plane.calls[0].priority, 'none');
  assert.equal(plane.calls[0].footer, 'via Discord /board by @asher');
});

test('Plane failure is reported without throwing', async () => {
  const i = mockInteraction({ options: { title: 't' } });
  await handleBoard(i, { plane: fakePlane(new Error('boom')), log: quietLog });
  assert.deepEqual(i.log.at(-1), ['editReply', 'could not create the Plane issue, check the bot logs']);
});

test('role gate blocks users without an allowed role', async () => {
  const plane = fakePlane({});
  const i = mockInteraction({ options: { title: 't' }, roles: ['111'] });
  await handleBoard(i, { plane, allowedRoleIds: ['999'] });
  assert.equal(plane.calls.length, 0);
  assert.equal(i.log[0][0], 'reply');
  assert.equal(i.log[0][1].ephemeral, true);
});

test('role gate accepts cached GuildMember roles', async () => {
  const plane = fakePlane({ key: 'X-1', url: 'u' });
  const roles = { cache: new Map([['999', {}]]) };
  await handleBoard(mockInteraction({ options: { title: 't' }, roles }), { plane, allowedRoleIds: ['999'] });
  assert.equal(plane.calls.length, 1);
});

test('command definition is a valid chat-input command', () => {
  assert.equal(BOARD_COMMAND.name, 'board');
  assert.equal(BOARD_COMMAND.options.find((o) => o.name === 'title').required, true);
  assert.deepEqual(
    BOARD_COMMAND.options.find((o) => o.name === 'priority').choices.map((c) => c.value),
    ['urgent', 'high', 'medium', 'low', 'none'],
  );
});
