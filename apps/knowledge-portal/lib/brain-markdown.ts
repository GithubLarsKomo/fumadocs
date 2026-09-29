import { dirname, join, normalize } from 'node:path/posix';

interface RewriteBrainMarkdownLinksOptions {
  brainId: string;
  currentPath: string;
}

export function rewriteBrainMarkdownLinks(
  markdown: string,
  { brainId, currentPath }: RewriteBrainMarkdownLinksOptions,
): string {
  const inline = markdown.replace(
    /(\[[^\]]*\]\()([^)]*)(\))/g,
    (match, prefix: string, destination: string, suffix: string) => {
      const rewritten = rewriteDestination(destination, brainId, currentPath);
      return rewritten === destination ? match : `${prefix}${rewritten}${suffix}`;
    },
  );

  return inline.replace(
    /^(\s*\[[^\]]+\]:\s*)(\S+)(.*)$/gm,
    (match, prefix: string, destination: string, suffix: string) => {
      const rewritten = rewriteTarget(destination, brainId, currentPath);
      return rewritten === destination ? match : `${prefix}${rewritten}${suffix}`;
    },
  );
}

export function brainSlugsFor(relativePath: string): string[] {
  const parts = relativePath.split('/').filter(Boolean);
  const file = parts.pop();
  if (!file) return [];

  const stem = file.replace(/\.(?:md|mdx)$/i, '');
  if (/^index$/i.test(stem)) return parts.map(slugifyBrainSegment);

  return [...parts, stem].map(slugifyBrainSegment);
}

export function slugifyBrainSegment(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function rewriteDestination(destination: string, brainId: string, currentPath: string): string {
  const leading = destination.match(/^\s*/)?.[0] ?? '';
  const trailing = destination.match(/\s*$/)?.[0] ?? '';
  const trimmed = destination.slice(leading.length, destination.length - trailing.length);

  if (!trimmed) return destination;

  if (trimmed.startsWith('<')) {
    const end = trimmed.indexOf('>');
    if (end === -1) return destination;

    const target = trimmed.slice(1, end);
    const rewritten = rewriteTarget(target, brainId, currentPath);
    if (rewritten === target) return destination;

    return `${leading}<${rewritten}>${trimmed.slice(end + 1)}${trailing}`;
  }

  const separator = trimmed.search(/\s/);
  const target = separator === -1 ? trimmed : trimmed.slice(0, separator);
  const rest = separator === -1 ? '' : trimmed.slice(separator);
  const rewritten = rewriteTarget(target, brainId, currentPath);

  if (rewritten === target) return destination;
  return `${leading}${rewritten}${rest}${trailing}`;
}

function rewriteTarget(target: string, brainId: string, currentPath: string): string {
  if (!isRelativeMarkdownTarget(target)) return target;

  const splitAt = firstSuffixIndex(target);
  const rawPath = splitAt === -1 ? target : target.slice(0, splitAt);
  const suffix = splitAt === -1 ? '' : target.slice(splitAt);
  const decodedPath = safeDecodeURIComponent(rawPath);
  const resolved = normalize(join(dirname(currentPath), decodedPath));

  if (resolved === '..' || resolved.startsWith('../')) return target;

  const slugs = brainSlugsFor(resolved);
  const base = `/brains/${encodeURIComponent(brainId)}`;
  const route = slugs.length > 0 ? `${base}/${slugs.map(encodeURIComponent).join('/')}` : base;

  return `${route}${suffix}`;
}

function isRelativeMarkdownTarget(target: string): boolean {
  if (!target || target.startsWith('#') || target.startsWith('/') || target.startsWith('//')) {
    return false;
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(target)) return false;

  const splitAt = firstSuffixIndex(target);
  const path = splitAt === -1 ? target : target.slice(0, splitAt);
  return /\.(?:md|mdx)$/i.test(path);
}

function firstSuffixIndex(value: string): number {
  const query = value.indexOf('?');
  const hash = value.indexOf('#');

  if (query === -1) return hash;
  if (hash === -1) return query;
  return Math.min(query, hash);
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export interface BrainMarkdownPresentation {
  title?: string;
  body: string;
}

export function prepareBrainMarkdown(markdown: string): BrainMarkdownPresentation {
  const lines = markdown.split(/\r?\n/);
  const firstContent = lines.findIndex((line) => line.trim().length > 0);

  if (firstContent === -1) return { body: markdown };

  const heading = /^#\s+(.+?)\s*$/.exec(lines[firstContent]);
  if (!heading) return { body: markdown };

  const title = cleanHeadingText(heading[1]);
  lines.splice(firstContent, 1);

  while (lines[firstContent]?.trim() === '') lines.splice(firstContent, 1);

  return {
    title: title || undefined,
    body: lines.join('\n'),
  };
}

function cleanHeadingText(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .trim();
}
