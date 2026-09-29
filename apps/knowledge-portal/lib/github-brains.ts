import { dynamicLoader } from 'fumadocs-core/source';
import { getEnabledFederationBrain, type FederationBrain } from '@/lib/federation';
import { githubBrainSource } from '@/lib/github-brain-source';

type GitHubBrainLoader = ReturnType<typeof createLoader>;

const loaders = new Map<string, GitHubBrainLoader>();

export async function getGitHubBrainSource(brainId: string) {
  const brain = await getEnabledFederationBrain(brainId);
  if (!brain) return undefined;

  return getLoader(brain).get();
}

export async function getRequiredGitHubBrainSource(brainId: string) {
  const source = await getGitHubBrainSource(brainId);
  if (!source) throw new Error(`GitHub Brain ${brainId} is not enabled.`);
  return source;
}

function getLoader(brain: FederationBrain): GitHubBrainLoader {
  const key = [
    brain.brainId,
    brain.repository,
    brain.defaultBranch,
    brain.rootPath,
    brain.projectMemoryRoot,
  ].join('|');

  let loader = loaders.get(key);
  if (loader) return loader;

  loader = createLoader(brain);
  loaders.set(key, loader);
  return loader;
}

function createLoader(brain: FederationBrain) {
  return dynamicLoader(githubBrainSource(brain), {
    baseUrl: `/brains/${brain.brainId}`,
  });
}
