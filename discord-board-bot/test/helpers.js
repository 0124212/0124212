// Records calls and replays canned responses in order.
export function mockFetch(responses) {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url, ...init, json: init.body ? JSON.parse(init.body) : undefined });
    const r = responses.shift();
    if (!r) throw new Error(`unexpected fetch: ${init.method} ${url}`);
    return new Response(typeof r.body === 'string' ? r.body : JSON.stringify(r.body ?? {}), {
      status: r.status ?? 200,
    });
  };
  fn.calls = calls;
  return fn;
}

export function mockInteraction({ options = {}, roles = [], username = 'asher', channel = 'dev' } = {}) {
  const log = [];
  return {
    log,
    user: { username },
    channel: channel ? { name: channel } : null,
    member: { roles },
    options: {
      getString(name, required) {
        if (required && options[name] == null) throw new Error(`missing ${name}`);
        return options[name] ?? null;
      },
    },
    reply: async (x) => log.push(['reply', x]),
    deferReply: async (x) => log.push(['deferReply', x]),
    editReply: async (x) => log.push(['editReply', x]),
  };
}

export const planeConfig = {
  apiKey: 'plane_test_key',
  baseUrl: 'https://plane.test',
  webUrl: 'https://app.plane.test',
  workspaceSlug: 'omoi',
  projectId: 'proj-1',
};
