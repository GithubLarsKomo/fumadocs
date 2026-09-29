import { dirname, join, normalize } from 'node:path/posix';

interface BrainMarkdownSourceContext {
  repository: string;
  revision: string;
  projectRoot: string;
}

interface RewriteBrainMarkdownLinksOptions {
  brainId: string;
  currentPath: string;
  source?: BrainMarkdownSourceContext;
}

export function rewriteBrainMarkdownLinks(
  markdown: string,
  options: RewriteBrainMarkdownLinksOptions,
): string {
  const inline = markdown.replace(
    /(!?\[[^\]]*\]\()([^)]*)(\))/g,
    (match, prefix: string, destination: string, suffix: string) => {
      const rewritten = rewriteDestination(destination, options, prefix.startsWith('!['));
      return rewritten === destination ? match : `${prefix}${rewritten}${suffix}`;
    },
  );

  return inline.replace(
    /^(\s*\[[^\]]+\]:\s*)(\S+)(.*)$/gm,
    (match, prefix: string, destination: string, suffix: string) => {
      const rewritten = rewriteTarget(destination, options, isImagePath(destination));
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

function rewriteDestination(
  destination: string,
  options: RewriteBrainMarkdownLinksOptions,
  isImage: boolean,
): string {
  const leading = destination.match(/^\s*/)?.[0] ?? '';
  const trailing = destination.match(/\s*$/)?.[0] ?? '';
  const trimmed = destination.slice(leading.length, destination.length - trailing.length);

  if (!trimmed) return destination;

  if (trimmed.startsWith('<')) {
    const end = trimmed.indexOf('>');
    if (end === -1) return destination;

    const target = trimmed.slice(1, end);
    const rewritten = rewriteTarget(target, options, isImage);
    if (rewritten === target) return destination;

    return `${leading}<${rewritten}>${trimmed.slice(end + 1)}${trailing}`;
  }

  const separator = trimmed.search(/\s/);
  const target = separator === -1 ? trimmed : trimmed.slice(0, separator);
  const rest = separator === -1 ? '' : trimmed.slice(separator);
  const rewritten = rewriteTarget(target, options, isImage);

  if (rewritten === target) return destination;
  return `${leading}${rewritten}${rest}${trailing}`;
}

function rewriteTarget(
  target: string,
  options: RewriteBrainMarkdownLinksOptions,
  isImage: boolean,
): string {
  if (!isRelativeTarget(target)) return target;

  const splitAt = firstSuffixIndex(target);
  const rawPath = splitAt === -1 ? target : target.slice(0, splitAt);
  const suffix = splitAt === -1 ? '' : target.slice(splitAt);
  if (!rawPath) return target;

  const decodedPath = safeDecodeURIComponent(rawPath);
  const projectedPath = normalize(join(dirname(options.currentPath), decodedPath));
  const insideProjectedRoot = projectedPath !== '..' && !projectedPath.startsWith('../');

  if (insideProjectedRoot && isMarkdownPath(decodedPath)) {
    const slugs = brainSlugsFor(projectedPath);
    const base = `/brains/${encodeURIComponent(options.brainId)}`;
    const route = slugs.length > 0 ? `${base}/${slugs.map(encodeURIComponent).join('/')}` : base;

    return `${route}${suffix}`;
  }

  const sourceUrl = sourceUrlFor(decodedPath, options, isImage);
  return sourceUrl ? `${sourceUrl}${suffix}` : target;
}

function sourceUrlFor(
  decodedPath: string,
  options: RewriteBrainMarkdownLinksOptions,
  isImage: boolean,
): string | undefined {
  if (!options.source) return undefined;

  const repositoryPath = normalize(
    join(options.source.projectRoot, dirname(options.currentPath), decodedPath),
  );

  if (
    !repositoryPath ||
    repositoryPath === '..' ||
    repositoryPath.startsWith('../') ||
    repositoryPath.startsWith('/')
  ) {
    return undefined;
  }

  const repository = encodePath(options.source.repository);
  const revision = encodeURIComponent(options.source.revision);
  const path = encodePath(repositoryPath);

  if (isImage || isImagePath(repositoryPath)) {
    return `https://raw.githubusercontent.com/${repository}/${revision}/${path}`;
  }

  return `https://github.com/${repository}/blob/${revision}/${path}`;
}

function isRelativeTarget(target: string): boolean {
  if (!target || target.startsWith('#') || target.startsWith('/') || target.startsWith('//')) {
    return false;
  }

  return !/^[a-z][a-z\d+.-]*:/i.test(target);
}

function isMarkdownPath(value: string): boolean {
  return /\.(?:md|mdx)$/i.test(value);
}

function isImagePath(value: string): boolean {
  const splitAt = firstSuffixIndex(value);
  const path = splitAt === -1 ? value : value.slice(0, splitAt);
  return /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(path);
}

function encodePath(value: string): string {
  return value
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
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
