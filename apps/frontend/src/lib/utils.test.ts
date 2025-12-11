import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names and removes falsy values', () => {
    const shouldIncludeC = false;
    const result = cn('a', undefined, 'b', shouldIncludeC && 'c', ['d']);
    expect(result).toBe('a b d');
  });
});
