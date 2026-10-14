import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/game/config.js';
import { baseSpeed, stumbleSpeedFactor } from '../src/game/speed.js';

describe('speed', () => {
  it('starts at the start speed and ramps up', () => {
    expect(baseSpeed(0, CONFIG)).toBe(CONFIG.startSpeed);
    expect(baseSpeed(10, CONFIG)).toBeCloseTo(CONFIG.startSpeed + CONFIG.acceleration * 10);
  });

  it('never passes the cap', () => {
    expect(baseSpeed(10_000, CONFIG)).toBe(CONFIG.maxSpeed);
  });

  it('drops to the stumble factor on a hit and recovers as the meter drains', () => {
    expect(stumbleSpeedFactor(1, CONFIG)).toBeCloseTo(CONFIG.stumbleSpeedFactor);
    expect(stumbleSpeedFactor(0.5, CONFIG)).toBeCloseTo((1 + CONFIG.stumbleSpeedFactor) / 2);
    expect(stumbleSpeedFactor(0, CONFIG)).toBe(1);
  });
});
