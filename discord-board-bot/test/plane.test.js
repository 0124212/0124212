import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlaneClient, toDescriptionHtml } from '../src/plane.js';
import { mockFetch, planeConfig } from './helpers.js';

test('createIssue posts to Plane and returns key + link', async () => {
  const fetch = mockFetch([
    { status: 201, body: { id: 'iss-9', sequence_id: 21 } },
    { body: { identifier: 'OPENO' } },
  ]);
  const plane = createPlaneClient(planeConfig, fetch);
  const issue = await plane.createIssue({ title: 'Fix <nav>', description: 'a\nb\n\nc', priority: 'high', footer: 'via x' });

  assert.deepEqual(issue, {
    id: 'iss-9',
    key: 'OPENO-21',
    url: 'https://app.plane.test/omoi/projects/proj-1/issues/iss-9',
  });
  const [post, get] = fetch.calls;
  assert.equal(post.url, 'https://plane.test/api/v1/workspaces/omoi/projects/proj-1/issues/');
  assert.equal(post.method, 'POST');
  assert.equal(post.headers['X-API-Key'], 'plane_test_key');
  assert.deepEqual(post.json, {
    name: 'Fix <nav>',
    description_html: '<p>a<br>b</p><p>c</p><p><em>via x</em></p>',
    priority: 'high',
  });
  assert.equal(get.url, 'https://plane.test/api/v1/workspaces/omoi/projects/proj-1/');
});

test('project identifier is fetched once and cached', async () => {
  const fetch = mockFetch([
    { body: { id: 'a', sequence_id: 1 } },
    { body: { identifier: 'OPENO' } },
    { body: { id: 'b', sequence_id: 2 } },
  ]);
  const plane = createPlaneClient(planeConfig, fetch);
  await plane.createIssue({ title: 'one' });
  const second = await plane.createIssue({ title: 'two' });
  assert.equal(second.key, 'OPENO-2');
  assert.equal(fetch.calls.length, 3);
});

test('falls back to #seq when project lookup fails', async () => {
  const fetch = mockFetch([{ body: { id: 'a', sequence_id: 7 } }, { status: 403, body: 'nope' }]);
  const issue = await createPlaneClient(planeConfig, fetch).createIssue({ title: 't' });
  assert.equal(issue.key, '#7');
});

test('API errors surface with status', async () => {
  const fetch = mockFetch([{ status: 401, body: '{"error":"bad key"}' }]);
  await assert.rejects(createPlaneClient(planeConfig, fetch).createIssue({ title: 't' }), /Plane API 401/);
});

test('rejects unknown priority before calling the API', async () => {
  const fetch = mockFetch([]);
  await assert.rejects(createPlaneClient(planeConfig, fetch).createIssue({ title: 't', priority: 'meh' }), /bad priority/);
  assert.equal(fetch.calls.length, 0);
});

test('empty description still yields valid html', () => {
  assert.equal(toDescriptionHtml(''), '<p></p>');
});
