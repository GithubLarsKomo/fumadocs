const DEFAULT_GITHUB_API = 'https://api.github.com';

export async function githubJson<T>(path: string): Promise<T> {
  const response = await githubRequest(path);
  return response.json() as Promise<T>;
}

export async function githubRequest(path: string): Promise<Response> {
  const baseUrl = (process.env.KNOWLEDGE_PORTAL_GITHUB_API_URL || DEFAULT_GITHUB_API).replace(
    /\/$/,
    '',
  );
  const token = process.env.KNOWLEDGE_PORTAL_GITHUB_TOKEN;

  const response = await fetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
    headers: {
      accept: 'application/vnd.github+json',
      ...(token ? { authorization: `Bearer ${token}` } : null),
      'x-github-api-version': '2022-11-28',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if ((response.status === 403 || response.status === 404) && !token) {
      throw new Error(
        `GitHub request failed with HTTP ${response.status} for ${path}. KNOWLEDGE_PORTAL_GITHUB_TOKEN is not configured; private federation repositories require a read token.`,
      );
    }

    if ((response.status === 403 || response.status === 404) && token) {
      throw new Error(
        `GitHub request failed with HTTP ${response.status} for ${path}. Verify KNOWLEDGE_PORTAL_GITHUB_TOKEN has read access to the private repository.`,
      );
    }

    throw new Error(`GitHub request failed with HTTP ${response.status} for ${path}.`);
  }

  return response;
}

export function encodeRepository(repository: string): string {
  const parts = repository.split('/');
  if (parts.length !== 2 || parts.some((part) => part.length === 0)) {
    throw new Error(`Invalid GitHub repository name: ${repository}`);
  }

  return parts.map(encodeURIComponent).join('/');
}

export function encodeGitHubPath(path: string): string {
  return path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
}
