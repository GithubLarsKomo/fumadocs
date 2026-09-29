import { describe, expect, it } from 'vitest';
import {
  driveRootUrl,
  findDriveRootByRoute,
  getDriveRoots,
  parseDriveRootsJson,
} from './drive-config';

describe('Drive root configuration', () => {
  it('parses multiple explicit allowlisted roots with stable route prefixes', () => {
    const roots = parseDriveRootsJson(
      JSON.stringify([
        { id: 'folder-a', label: 'Skillz Projects' },
        {
          id: 'folder-b',
          label: 'Research & Evidence',
          slug: 'research',
          description: 'Curated research assets',
          sharedDriveId: 'shared-1',
        },
      ]),
    );

    expect(roots).toEqual([
      {
        id: 'folder-a',
        label: 'Skillz Projects',
        routePrefix: 'skillz-projects',
        description: undefined,
        driveId: undefined,
      },
      {
        id: 'folder-b',
        label: 'Research & Evidence',
        routePrefix: 'research',
        description: 'Curated research assets',
        driveId: 'shared-1',
      },
    ]);
    expect(driveRootUrl(roots[0])).toBe('/drive/skillz-projects');
  });

  it('resolves a configured multi-root landing route before document lookup', () => {
    const env = {
      NODE_ENV: 'test',
      KNOWLEDGE_PORTAL_DRIVE_ROOTS_JSON: JSON.stringify([
        { id: 'folder-a', label: 'ChatGPT' },
        { id: 'folder-b', label: 'Skillz Projects' },
      ]),
    };

    expect(findDriveRootByRoute(['chatgpt'], env)?.label).toBe('ChatGPT');
    expect(findDriveRootByRoute(['skillz-projects'], env)?.id).toBe('folder-b');
    expect(findDriveRootByRoute(['chatgpt', 'document'], env)).toBeUndefined();
    expect(findDriveRootByRoute(['unknown'], env)).toBeUndefined();
  });

  it('keeps legacy single-root configuration backward compatible', () => {
    const roots = getDriveRoots({
      NODE_ENV: 'test',
      GOOGLE_DRIVE_FOLDER_ID: 'legacy-folder',
      GOOGLE_SHARED_DRIVE_ID: 'legacy-drive',
    });

    expect(roots).toEqual([
      {
        id: 'legacy-folder',
        label: 'Drive Evidence',
        routePrefix: '',
        description: 'Freigegebene Quelldokumente',
        driveId: 'legacy-drive',
      },
    ]);
    expect(driveRootUrl(roots[0])).toBe('/drive');
  });

  it('fails closed on duplicate routes, invalid JSON and missing configuration', () => {
    expect(() =>
      parseDriveRootsJson(
        JSON.stringify([
          { id: 'a', label: 'Same' },
          { id: 'b', label: 'Same' },
        ]),
      ),
    ).toThrow('Duplicate Google Drive root slug');

    expect(() => parseDriveRootsJson('{not-json')).toThrow('must be valid JSON');
    expect(() => getDriveRoots({ NODE_ENV: 'test' })).toThrow('No Google Drive root');
  });
});
