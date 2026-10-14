import { describe, expect, it } from 'vitest';
import { touchesRunner } from '../src/game/collision.js';

const DEPTH = 0.8;

describe('collision', () => {
  it('hits when in the same lane and closer than the depth', () => {
    expect(touchesRunner({ lane: 1, at: 10.5 }, 1, 9.9, 10, DEPTH)).toBe(true);
  });

  it('misses in a different lane', () => {
    expect(touchesRunner({ lane: 0, at: 10 }, 1, 9.9, 10, DEPTH)).toBe(false);
  });

  it('misses when still too far ahead', () => {
    expect(touchesRunner({ lane: 1, at: 10.8 }, 1, 9.9, 10, DEPTH)).toBe(false);
  });

  it('misses once it is far enough behind', () => {
    expect(touchesRunner({ lane: 1, at: 9 }, 1, 9.9, 10, DEPTH)).toBe(false);
  });

  it('catches an obstacle skipped over by one long frame', () => {
    expect(touchesRunner({ lane: 1, at: 11 }, 1, 9, 13, DEPTH)).toBe(true);
  });
});
