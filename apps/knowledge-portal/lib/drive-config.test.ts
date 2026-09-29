import { describe, expect, it } from 'vitest';
import { driveRootUrl, getDriveRoots, parseDriveRootsJson } from './drive-config';

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

  it('keeps legacy single-root configuration backward compatible', () => {
    const roots = getDriveRoots({
      GOOGLE_DRIVE_FOLDER_ID: 'legacy-folder',
      GOOGLE_SHARED_DRIVE_ID: 'legacy-drive',
    } as NodeJS.ProcessEnv);

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
    expect(() => getDriveRoots({} as NodeJS.ProcessEnv)).toThrow('No Google Drive root');
  });
});
