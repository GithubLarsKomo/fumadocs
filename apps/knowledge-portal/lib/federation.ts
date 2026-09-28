import { dirname } from 'node:path/posix';
import { encodeGitHubPath, encodeRepository, githubJson } from '@/lib/github-client';

interface FederationRegistry {
  brains?: unknown[];
}

interface GitHubContentsFile {
  type?: string;
  encoding?: string;
  content?: string;
}

export interface FederationBrain {
  brainId: string;
  label: string;
  scope?: string;
  repository: string;
  defaultBranch: string;
  projectMemoryRoot: string;
  rootPath: string;
}

let cache:
  | {
      key: string;
      expiresAt: number;
      value: FederationBrain[];
    }
  | undefined;

export async function getEnabledFederationBrains(): Promise<FederationBrain[]> {
  const repository = process.env.KNOWLEDGE_PORTAL_FEDERATION_REPOSITORY;
  const allowlist = parseAllowlist(process.env.KNOWLEDGE_PORTAL_BRAIN_ALLOWLIST);
  if (!repository || allowlist.size === 0) return [];

  const ref = process.env.KNOWLEDGE_PORTAL_FEDERATION_REF || 'main';
  const registryPath =
    process.env.KNOWLEDGE_PORTAL_FEDERATION_REGISTRY_PATH || 'docs/super-memory/registry.json';
  const key = [repository, ref, registryPath, [...allowlist].sort().join(',')].join('|');

  if (cache && cache.key === key && cache.expiresAt > Date.now()) return cache.value;

  const registry = await readRegistry(repository, ref, registryPath);
  const brains = (registry.brains ?? [])
    .filter(isRegistryBrain)
    .filter(
      (brain) =>
        allowlist.has(brain.brainId) &&
        brain.status === 'available' &&
        brain.repositoryAvailable !== false &&
        brain.memoryRootAvailable !== false,
    )
    .map((brain) => ({
      brainId: brain.brainId,
      label: brain.label,
      scope: brain.scope,
      repository: brain.repository,
      defaultBranch: brain.defaultBranch,
      projectMemoryRoot: brain.projectMemoryRoot,
      rootPath: normalizeRootPath(dirname(brain.projectMemoryRoot)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  cache = {
    key,
    expiresAt: Date.now() + 60_000,
    value: brains,
  };
  return brains;
}

export async function getEnabledFederationBrain(
  brainId: string,
): Promise<FederationBrain | undefined> {
  return (await getEnabledFederationBrains()).find((brain) => brain.brainId === brainId);
}

async function readRegistry(
  repository: string,
  ref: string,
  registryPath: string,
): Promise<FederationRegistry> {
  const file = await githubJson<GitHubContentsFile>(
    `/repos/${encodeRepository(repository)}/contents/${encodeGitHubPath(registryPath)}?ref=${encodeURIComponent(ref)}`,
  );

  if (file.type !== 'file' || file.encoding !== 'base64' || !file.content) {
    throw new Error('Federation registry response is not a base64 GitHub file.');
  }

  const decoded = Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8');
  const parsed: unknown = JSON.parse(decoded);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Federation registry JSON is not an object.');
  }

  return parsed as FederationRegistry;
}

function normalizeRootPath(value: string): string {
  return value === '.' ? '' : value.split('/').filter(Boolean).join('/');
}

function parseAllowlist(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function isRegistryBrain(value: unknown): value is {
  brainId: string;
  label: string;
  scope?: string;
  repository: string;
  defaultBranch: string;
  projectMemoryRoot: string;
  status: string;
  repositoryAvailable?: boolean;
  memoryRootAvailable?: boolean;
} {
  if (!value || typeof value !== 'object') return false;

  const brain = value as Record<string, unknown>;
  return (
    typeof brain.brainId === 'string' &&
    typeof brain.label === 'string' &&
    (brain.scope === undefined || typeof brain.scope === 'string') &&
    typeof brain.repository === 'string' &&
    typeof brain.defaultBranch === 'string' &&
    typeof brain.projectMemoryRoot === 'string' &&
    typeof brain.status === 'string' &&
    (brain.repositoryAvailable === undefined || typeof brain.repositoryAvailable === 'boolean') &&
    (brain.memoryRootAvailable === undefined || typeof brain.memoryRootAvailable === 'boolean')
  );
}
