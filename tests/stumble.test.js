import { describe, expect, it } from 'vitest';
import { createStumble, hitStumble, stumbleMeter, updateStumble } from '../src/game/stumble.js';

const WINDOW = 5;

describe('stumble', () => {
  it('first hit stumbles and fills the meter', () => {
    const s = createStumble();
    expect(hitStumble(s, WINDOW)).toBe('stumble');
    expect(s.mode).toBe('stumbling');
    expect(stumbleMeter(s, WINDOW)).toBe(1);
  });

  it('meter drains over the window, then the runner is steady again', () => {
    const s = createStumble();
    hitStumble(s, WINDOW);
    updateStumble(s, 2.5);
    expect(stumbleMeter(s, WINDOW)).toBeCloseTo(0.5);
    updateStumble(s, 2.5);
    expect(s.mode).toBe('steady');
    expect(stumbleMeter(s, WINDOW)).toBe(0);
  });

  it('second hit while stumbling ends the run', () => {
    const s = createStumble();
    hitStumble(s, WINDOW);
    updateStumble(s, 4.9);
    expect(hitStumble(s, WINDOW)).toBe('dead');
    expect(s.mode).toBe('dead');
  });

  it('a hit after the meter runs out is a fresh first hit', () => {
    const s = createStumble();
    hitStumble(s, WINDOW);
    updateStumble(s, 5.1);
    expect(hitStumble(s, WINDOW)).toBe('stumble');
  });
});
