import { dynamicLoader } from 'fumadocs-core/source';
import { getEnabledFederationBrain, type FederationBrain } from '@/lib/federation';
import { githubBrainSource } from '@/lib/github-brain-source';

const loaders = new Map<string, ReturnType<typeof dynamicLoader>>();

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

function getLoader(brain: FederationBrain) {
  const key = [
    brain.brainId,
    brain.repository,
    brain.defaultBranch,
    brain.rootPath,
    brain.projectMemoryRoot,
  ].join('|');

  let loader = loaders.get(key);
  if (loader) return loader;

  loader = dynamicLoader(githubBrainSource(brain), {
    baseUrl: `/brains/${brain.brainId}`,
  });
  loaders.set(key, loader);
  return loader;
}
