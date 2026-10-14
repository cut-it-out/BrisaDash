import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/game/config.js';
import { createSpawner, rowGap, spawnUntil } from '../src/game/spawner.js';
import { seededRng } from './rng.js';

function spawnMany(seed, speed, horizon) {
  const spawner = createSpawner(CONFIG);
  const obstacles = [];
  const coffees = [];
  spawnUntil(spawner, horizon, speed, seededRng(seed), CONFIG, obstacles, coffees);
  return { obstacles, coffees };
}

function rowsOf(obstacles) {
  const rows = new Map();
  for (const o of obstacles) rows.set(o.at, [...(rows.get(o.at) ?? []), o.lane]);
  return rows;
}

describe('spawner', () => {
  it('starts with empty track before the first row', () => {
    const { obstacles, coffees } = spawnMany(1, CONFIG.startSpeed, 1000);
    expect(Math.min(...obstacles.map((o) => o.at))).toBe(CONFIG.firstRowAt);
    expect(Math.min(...coffees.map((c) => c.at))).toBeGreaterThan(0);
  });

  it('every row leaves at least one lane free (fuzz, several seeds and speeds)', () => {
    for (const seed of [1, 2, 3, 42, 1234]) {
      for (const speed of [CONFIG.startSpeed, CONFIG.maxSpeed]) {
        const { obstacles } = spawnMany(seed, speed, 2000 * rowGap(speed, CONFIG));
        for (const lanes of rowsOf(obstacles).values()) {
          expect(lanes.length).toBeGreaterThanOrEqual(1);
          expect(lanes.length).toBeLessThan(CONFIG.laneCount);
          expect(new Set(lanes).size).toBe(lanes.length);
        }
      }
    }
  });

  it('no cup sits on an obstacle in its lane', () => {
    const { obstacles, coffees } = spawnMany(7, CONFIG.startSpeed, 20_000);
    const blocked = new Set(obstacles.map((o) => `${o.lane}:${o.at}`));
    const rowPositions = [...new Set(obstacles.map((o) => o.at))];
    expect(coffees.length).toBeGreaterThan(0);
    for (const c of coffees) {
      // the closest rows on each side are the only ones that could overlap
      const next = rowPositions.find((at) => at > c.at);
      const prev = rowPositions.findLast((at) => at < c.at) ?? -Infinity;
      for (const at of [prev, next]) {
        if (blocked.has(`${c.lane}:${at}`)) expect(Math.abs(at - c.at)).toBeGreaterThanOrEqual(CONFIG.coffeeMargin);
      }
    }
  });

  it('coffee lines are 3 to 5 cups', () => {
    const { coffees } = spawnMany(9, CONFIG.maxSpeed, 20_000);
    expect(coffees.length).toBeGreaterThan(0);
    // consecutive cups in one lane, coffeeSpacing apart, form a line
    let line = 1;
    const sorted = [...coffees].sort((a, b) => a.at - b.at);
    for (let i = 1; i <= sorted.length; i++) {
      const sameLine =
        i < sorted.length &&
        sorted[i].lane === sorted[i - 1].lane &&
        Math.abs(sorted[i].at - sorted[i - 1].at - CONFIG.coffeeSpacing) < 1e-9;
      if (sameLine) {
        line++;
      } else {
        expect(line).toBeGreaterThanOrEqual(CONFIG.coffeeLineMin);
        expect(line).toBeLessThanOrEqual(CONFIG.coffeeLineMax);
        line = 1;
      }
    }
  });

  it('each coffee line is one kind, and about frappeLineChance of lines are frappes', () => {
    const { coffees } = spawnMany(11, CONFIG.startSpeed, 200_000);
    const sorted = [...coffees].sort((a, b) => a.at - b.at);
    const lines = [[sorted[0]]];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const sameLine = sorted[i].lane === prev.lane && Math.abs(sorted[i].at - prev.at - CONFIG.coffeeSpacing) < 1e-9;
      if (sameLine) lines.at(-1).push(sorted[i]);
      else lines.push([sorted[i]]);
    }
    for (const line of lines) expect(new Set(line.map((c) => c.kind)).size).toBe(1);
    const frappeShare = lines.filter((line) => line[0].kind === 'frappe').length / lines.length;
    expect(lines.length).toBeGreaterThan(1000);
    expect(frappeShare).toBeGreaterThan(CONFIG.frappeLineChance - 0.04);
    expect(frappeShare).toBeLessThan(CONFIG.frappeLineChance + 0.04);
  });

  it('rows spread out as speed grows', () => {
    expect(rowGap(CONFIG.startSpeed, CONFIG)).toBeLessThan(rowGap(CONFIG.maxSpeed, CONFIG));
    expect(rowGap(1, CONFIG)).toBe(CONFIG.minRowGap);
  });
});
