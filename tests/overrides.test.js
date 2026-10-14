import { describe, expect, it } from 'vitest';
import { applyOverrides } from '../src/game/overrides.js';

function sampleConfig() {
  return { laneCount: 3, rowGapSeconds: 1.5, twoBlockedChance: 0.4, cupLineMix: { coffee: 0.4, frappe: 0.2 } };
}

describe('applyOverrides', () => {
  it('does nothing without ?debug', () => {
    const config = sampleConfig();
    expect(applyOverrides(config, new URLSearchParams('rowGapSeconds=1'))).toEqual({});
    expect(config.rowGapSeconds).toBe(1.5);
  });

  it('overrides existing numbers and reports them', () => {
    const config = sampleConfig();
    const applied = applyOverrides(config, new URLSearchParams('debug&rowGapSeconds=1.2&twoBlockedChance=0.6'));
    expect(applied).toEqual({ rowGapSeconds: 1.2, twoBlockedChance: 0.6 });
    expect(config.rowGapSeconds).toBe(1.2);
    expect(config.twoBlockedChance).toBe(0.6);
  });

  it('overrides one level into an object with a dotted key', () => {
    const config = sampleConfig();
    applyOverrides(config, new URLSearchParams('debug&cupLineMix.frappe=0.3'));
    expect(config.cupLineMix).toEqual({ coffee: 0.4, frappe: 0.3 });
  });

  it('ignores unknown keys, non-numbers, blanks and the fixed lane count', () => {
    const config = sampleConfig();
    const applied = applyOverrides(
      config,
      new URLSearchParams('debug&nope=1&rowGapSeconds=fast&twoBlockedChance=&laneCount=5&cupLineMix=2&cupLineMix.nope=1'),
    );
    expect(applied).toEqual({});
    expect(config).toEqual(sampleConfig());
  });
});
