export const PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'];

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function toDescriptionHtml(description, footer) {
  const paras = (description || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`);
  if (footer) paras.push(`<p><em>${escapeHtml(footer)}</em></p>`);
  return paras.join('') || '<p></p>';
}

export class PlaneError extends Error {
  constructor(status, body) {
    super(`Plane API ${status}: ${body.slice(0, 300)}`);
    this.status = status;
  }
}

export function createPlaneClient({ apiKey, baseUrl, webUrl, workspaceSlug, projectId }, fetchImpl = fetch) {
  const projectPath = `/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectId)}`;
  let identifier; // project key like "OPENO", fetched once

  async function request(method, path, body) {
    const res = await fetchImpl(`${baseUrl}${projectPath}${path}`, {
      method,
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    if (!res.ok) throw new PlaneError(res.status, text);
    return text ? JSON.parse(text) : {};
  }

  async function projectIdentifier() {
    if (identifier === undefined) {
      try {
        identifier = (await request('GET', '/')).identifier || null;
      } catch {
        identifier = null; // non-fatal: we fall back to the raw sequence number
      }
    }
    return identifier;
  }

  return {
    async createIssue({ title, description, priority = 'none', footer }) {
      if (!PRIORITIES.includes(priority)) throw new Error(`bad priority: ${priority}`);
      const issue = await request('POST', '/issues/', {
        name: title,
        description_html: toDescriptionHtml(description, footer),
        priority,
      });
      const key = await projectIdentifier();
      return {
        id: issue.id,
        key: key ? `${key}-${issue.sequence_id}` : `#${issue.sequence_id}`,
        url: `${webUrl}/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`,
      };
    },
  };
}
