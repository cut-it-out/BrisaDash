import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/game/config.js';
import { createSpawner, pickKind, rowGap, spawnUntil, zigzagGap } from '../src/game/spawner.js';
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

  it('each coffee line is one kind, and the kinds follow cupLineMix', () => {
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
    expect(lines.length).toBeGreaterThan(1000);
    for (const [kind, share] of Object.entries(CONFIG.cupLineMix)) {
      const actual = lines.filter((line) => line[0].kind === kind).length / lines.length;
      expect(actual, kind).toBeGreaterThan(share - 0.04);
      expect(actual, kind).toBeLessThan(share + 0.04);
    }
  });

  it('every obstacle has a look from obstacleMix, in about those shares', () => {
    const { obstacles } = spawnMany(17, CONFIG.startSpeed, 100_000);
    const total = Object.values(CONFIG.obstacleMix).reduce((sum, share) => sum + share, 0);
    expect(obstacles.length).toBeGreaterThan(5000);
    for (const o of obstacles) expect(Object.keys(CONFIG.obstacleMix)).toContain(o.kind);
    for (const [kind, share] of Object.entries(CONFIG.obstacleMix)) {
      const actual = obstacles.filter((o) => o.kind === kind).length / obstacles.length;
      expect(actual, kind).toBeGreaterThan(share / total - 0.03);
      expect(actual, kind).toBeLessThan(share / total + 0.03);
    }
  });

  it('treats cup shares as relative, so they need not add up to 1', () => {
    const rng = seededRng(13);
    const picks = Array.from({ length: 10_000 }, () => pickKind(rng, { coffee: 1, frappe: 1 }));
    const frappeShare = picks.filter((k) => k === 'frappe').length / picks.length;
    expect(frappeShare).toBeGreaterThan(0.46);
    expect(frappeShare).toBeLessThan(0.54);
  });

  it('zigzag pairs: two two-lane rows, zigzagGap apart, whose free lanes are neighbours', () => {
    for (const speed of [CONFIG.startSpeed, CONFIG.maxSpeed]) {
      const { obstacles } = spawnMany(21, speed, 3000 * rowGap(speed, CONFIG));
      const rows = [...rowsOf(obstacles)].sort((a, b) => a[0] - b[0]);
      const freeLane = (lanes) => [0, 1, 2].find((lane) => !lanes.includes(lane));
      let pairs = 0;
      for (let i = 1; i < rows.length; i++) {
        const [prevAt, prevLanes] = rows[i - 1];
        const [at, lanes] = rows[i];
        const gap = at - prevAt;
        if (Math.abs(gap - zigzagGap(speed, CONFIG)) > 1e-9) {
          expect(gap).toBeCloseTo(rowGap(speed, CONFIG), 9); // every other gap is a normal row gap
          continue;
        }
        pairs++;
        expect(prevLanes.length).toBe(2);
        expect(lanes.length).toBe(2);
        expect(Math.abs(freeLane(lanes) - freeLane(prevLanes))).toBe(1);
      }
      const share = pairs / (rows.length - pairs);
      expect(share).toBeGreaterThan(CONFIG.zigzagChance - 0.04);
      expect(share).toBeLessThan(CONFIG.zigzagChance + 0.04);
    }
  });

  it('a zigzag pair leaves time to swipe between its rows', () => {
    // hit window on each row is ±hitDepth; at least 0.5 s of free running between them at any speed
    for (const speed of [CONFIG.startSpeed, 15, 25, CONFIG.maxSpeed]) {
      expect((zigzagGap(speed, CONFIG) - 2 * CONFIG.hitDepth) / speed).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('rows spread out as speed grows', () => {
    expect(rowGap(CONFIG.startSpeed, CONFIG)).toBeLessThan(rowGap(CONFIG.maxSpeed, CONFIG));
    expect(rowGap(1, CONFIG)).toBe(CONFIG.minRowGap);
  });
});
