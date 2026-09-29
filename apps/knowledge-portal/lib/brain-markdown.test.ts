import { describe, expect, it } from 'vitest';
import { brainSlugsFor, prepareBrainMarkdown, rewriteBrainMarkdownLinks } from './brain-markdown';

describe('rewriteBrainMarkdownLinks', () => {
  it('rewrites root-relative Markdown files into Brain routes', () => {
    const input = [
      '- [Workflow](WORKFLOW.md)',
      '- [Inventory](REPOSITORY-INVENTORY.md)',
      '- [Knowledge](knowledge/INDEX.md)',
    ].join('\n');

    expect(
      rewriteBrainMarkdownLinks(input, {
        brainId: 'coding',
        currentPath: 'INDEX.md',
      }),
    ).toBe(
      [
        '- [Workflow](/brains/coding/workflow)',
        '- [Inventory](/brains/coding/repository-inventory)',
        '- [Knowledge](/brains/coding/knowledge)',
      ].join('\n'),
    );
  });

  it('resolves parent paths and preserves anchors and query strings', () => {
    const input = '[Topics](../TOPICS.md?view=all#architecture)';

    expect(
      rewriteBrainMarkdownLinks(input, {
        brainId: 'coding',
        currentPath: 'knowledge/example.md',
      }),
    ).toBe('[Topics](/brains/coding/topics?view=all#architecture)');
  });

  it('leaves external, absolute, anchor-only and out-of-root links unchanged', () => {
    const input = [
      '[GitHub](https://github.com/example/repo)',
      '[Drive](/drive)',
      '[Section](#mission)',
      '[Mail](mailto:test@example.com)',
      '[Outside](../README.md)',
    ].join('\n');

    expect(
      rewriteBrainMarkdownLinks(input, {
        brainId: 'coding',
        currentPath: 'INDEX.md',
      }),
    ).toBe(input);
  });

  it('rewrites Markdown reference definitions', () => {
    const input = ['[Workflow][workflow]', '', '[workflow]: WORKFLOW.md "Workflow"'].join('\n');

    expect(
      rewriteBrainMarkdownLinks(input, {
        brainId: 'coding',
        currentPath: 'INDEX.md',
      }),
    ).toBe(
      ['[Workflow][workflow]', '', '[workflow]: /brains/coding/workflow "Workflow"'].join('\n'),
    );
  });

  it('uses the same index routing rules as the Brain source', () => {
    expect(brainSlugsFor('INDEX.md')).toEqual([]);
    expect(brainSlugsFor('knowledge/INDEX.md')).toEqual(['knowledge']);
    expect(brainSlugsFor('knowledge/EL-read-only-external-source-adapters.md')).toEqual([
      'knowledge',
      'el-read-only-external-source-adapters',
    ]);
  });
});


describe('prepareBrainMarkdown', () => {
  it('promotes the leading H1 into the portal document header', () => {
    expect(prepareBrainMarkdown('# Coding Brain — Index\n\n**Brain type:** collection brain')).toEqual({
      title: 'Coding Brain — Index',
      body: '**Brain type:** collection brain',
    });
  });

  it('preserves Markdown when the first content is not an H1', () => {
    const input = '**Status:** active\n\n## Mission';
    expect(prepareBrainMarkdown(input)).toEqual({ body: input });
  });
});
