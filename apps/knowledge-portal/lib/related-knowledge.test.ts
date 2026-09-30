import { describe, expect, it } from 'vitest';
import { containsPortalLink } from './related-knowledge';

describe('containsPortalLink', () => {
  it('detects direct and anchored links', () => {
    expect(containsPortalLink('[Target](/brains/coding/topic)', '/brains/coding/topic')).toBe(true);
    expect(
      containsPortalLink('[Target](/brains/coding/topic#section)', '/brains/coding/topic'),
    ).toBe(true);
  });

  it('ignores plain text mentions', () => {
    expect(
      containsPortalLink('See /brains/coding/topic for context.', '/brains/coding/topic'),
    ).toBe(false);
  });
});
