export interface DriveRootConfig {
  id: string;
  label: string;
  routePrefix: string;
  description?: string;
  driveId?: string;
}

interface DriveRootInput {
  id?: unknown;
  label?: unknown;
  slug?: unknown;
  description?: unknown;
  driveId?: unknown;
  sharedDriveId?: unknown;
}

const MAX_DRIVE_ROOTS = 50;

export function getDriveRoots(env: NodeJS.ProcessEnv = process.env): DriveRootConfig[] {
  const configured = env.KNOWLEDGE_PORTAL_DRIVE_ROOTS_JSON?.trim();

  if (configured) {
    return parseDriveRootsJson(configured);
  }

  const legacyFolderId = env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!legacyFolderId) {
    throw new Error(
      'No Google Drive root is configured. Set KNOWLEDGE_PORTAL_DRIVE_ROOTS_JSON or GOOGLE_DRIVE_FOLDER_ID.',
    );
  }

  return [
    {
      id: validateFolderId(legacyFolderId),
      label: 'Drive Evidence',
      routePrefix: '',
      description: 'Freigegebene Quelldokumente',
      driveId: optionalString(env.GOOGLE_SHARED_DRIVE_ID),
    },
  ];
}

export function parseDriveRootsJson(value: string): DriveRootConfig[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('KNOWLEDGE_PORTAL_DRIVE_ROOTS_JSON must be valid JSON.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('KNOWLEDGE_PORTAL_DRIVE_ROOTS_JSON must be a JSON array.');
  }
  if (parsed.length === 0) {
    throw new Error('KNOWLEDGE_PORTAL_DRIVE_ROOTS_JSON must contain at least one root.');
  }
  if (parsed.length > MAX_DRIVE_ROOTS) {
    throw new Error(
      `KNOWLEDGE_PORTAL_DRIVE_ROOTS_JSON exceeds the maximum of ${MAX_DRIVE_ROOTS} roots.`,
    );
  }

  const roots = parsed.map((item, index) => normalizeRoot(item, index));
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const root of roots) {
    if (ids.has(root.id)) {
      throw new Error(`Duplicate Google Drive root id: ${root.id}`);
    }
    if (slugs.has(root.routePrefix)) {
      throw new Error(`Duplicate Google Drive root slug: ${root.routePrefix}`);
    }
    ids.add(root.id);
    slugs.add(root.routePrefix);
  }

  return roots;
}

export function driveRootUrl(root: DriveRootConfig): string {
  return root.routePrefix ? `/drive/${root.routePrefix}` : '/drive';
}

export function findDriveRootByRoute(
  slug: string[],
  env: NodeJS.ProcessEnv = process.env,
): DriveRootConfig | undefined {
  if (slug.length !== 1) return undefined;
  return getDriveRoots(env).find((root) => root.routePrefix === slug[0]);
}

function normalizeRoot(value: unknown, index: number): DriveRootConfig {
  if (!value || typeof value !== 'object') {
    throw new Error(`Drive root at index ${index} must be an object.`);
  }

  const input = value as DriveRootInput;
  const id = validateFolderId(requiredString(input.id, `roots[${index}].id`));
  const label = requiredString(input.label, `roots[${index}].label`);
  const requestedSlug = optionalString(input.slug);
  const routePrefix = requestedSlug ? normalizeExplicitSlug(requestedSlug, index) : slugify(label);

  if (!routePrefix) {
    throw new Error(`Drive root at index ${index} does not produce a usable route slug.`);
  }

  const driveId = optionalString(input.driveId) ?? optionalString(input.sharedDriveId);

  return {
    id,
    label,
    routePrefix,
    description: optionalString(input.description),
    driveId: driveId ? validateFolderId(driveId) : undefined,
  };
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function validateFolderId(value: string): string {
  if (value === 'root') return value;
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`Invalid Google Drive folder/shared-drive id: ${value}`);
  }
  return value;
}

function normalizeExplicitSlug(value: string, index: number): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(normalized)) {
    throw new Error(
      `roots[${index}].slug must contain only lower-case letters, digits and single route-safe hyphens.`,
    );
  }
  return normalized;
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
