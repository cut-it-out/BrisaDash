import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/game/config.js';
import { createRun, runMeter, runScore, updateRun } from '../src/game/run.js';
import { pickupValue, score } from '../src/game/score.js';
import { rowGap, zigzagGap } from '../src/game/spawner.js';
import { baseSpeed } from '../src/game/speed.js';
import { seededRng } from './rng.js';

// A run with hand-placed obstacles and cups, and nothing spawned on its own
function emptyRun() {
  const run = createRun(CONFIG, seededRng(1));
  run.spawner.nextRowAt = Infinity;
  return run;
}

function runFor(run, seconds, step = 1 / 60) {
  const events = [];
  for (let t = 0; t < seconds && !run.over; t += step) events.push(...updateRun(run, step));
  return events;
}

describe('score', () => {
  it('is whole metres plus a bonus per coffee', () => {
    expect(score(412.9, 230, CONFIG)).toBe(412 + 230);
  });

  it('a frappe is worth more than a coffee mug', () => {
    expect(pickupValue('coffee', CONFIG)).toBe(CONFIG.pointsPerCoffee);
    expect(pickupValue('takeaway', CONFIG)).toBe(CONFIG.pointsPerCoffee);
    expect(pickupValue('frappe', CONFIG)).toBe(CONFIG.pointsPerFrappe);
    expect(CONFIG.pointsPerFrappe).toBeGreaterThan(CONFIG.pointsPerCoffee);
  });
});

describe('run', () => {
  it('moves forward and spawns rows ahead', () => {
    const run = createRun(CONFIG, seededRng(3));
    runFor(run, 1);
    expect(run.distance).toBeGreaterThan(CONFIG.startSpeed * 0.99);
    expect(run.obstacles.length).toBeGreaterThan(0);
  });

  it('first hit stumbles and knocks the obstacle aside so it cannot hit twice', () => {
    const run = emptyRun();
    const obstacle = { lane: 1, at: 5, knocked: false };
    run.obstacles.push(obstacle);
    const events = runFor(run, 2);
    expect(events.filter((e) => e.type === 'stumble')).toHaveLength(1);
    expect(obstacle.knocked).toBe(true);
    expect(run.over).toBe(false);
    expect(runMeter(run)).toBeGreaterThan(0);
  });

  it('a second hit while stumbling ends the run', () => {
    const run = emptyRun();
    run.obstacles.push({ lane: 1, at: 5, knocked: false });
    run.obstacles.push({ lane: 1, at: 15, knocked: false });
    const events = runFor(run, 4);
    expect(events.map((e) => e.type)).toEqual(['stumble', 'gameOver']);
    expect(run.over).toBe(true);
  });

  it('stops moving once the run is over', () => {
    const run = emptyRun();
    run.over = true;
    updateRun(run, 1);
    expect(run.distance).toBe(0);
  });

  it('collects coffee in the runner lane and scores it', () => {
    const run = emptyRun();
    run.coffees.push({ lane: 1, at: 5, kind: 'coffee', collected: false });
    run.coffees.push({ lane: 0, at: 6, kind: 'coffee', collected: false });
    const events = runFor(run, 1.5);
    expect(events.filter((e) => e.type === 'coffee')).toHaveLength(1);
    expect(run.coffeeCount).toBe(1);
    expect(runScore(run)).toBe(Math.floor(run.distance) + CONFIG.pointsPerCoffee);
  });

  it('spaces rows by the unslowed speed while stumbling', () => {
    const run = createRun(CONFIG, seededRng(5));
    run.stumble.mode = 'stumbling';
    run.stumble.timeLeft = CONFIG.stumbleSeconds;
    run.elapsed = 40; // late enough that the slowed and unslowed gaps differ
    run.spawner.nextRowAt = 0;
    runFor(run, 0.1);
    const rows = [...new Set(run.obstacles.map((o) => o.at))].sort((a, b) => a - b);
    const gaps = rows.slice(1).map((at, i) => at - rows[i]);
    expect(gaps.length).toBeGreaterThan(1);
    const unslowed = baseSpeed(run.elapsed, CONFIG);
    // a gap is either a normal row gap or the short gap inside a zigzag pair, both at the unslowed speed
    const expected = [rowGap(unslowed, CONFIG), zigzagGap(unslowed, CONFIG)];
    for (const gap of gaps) expect(Math.min(...expected.map((e) => Math.abs(gap - e)))).toBeLessThan(0.05);
  });

  it('scores a frappe at its higher value and counts it as a coffee', () => {
    const run = emptyRun();
    run.coffees.push({ lane: 1, at: 5, kind: 'frappe', collected: false });
    const events = runFor(run, 1.5);
    expect(events.filter((e) => e.type === 'coffee')).toEqual([
      { type: 'coffee', lane: 1, kind: 'frappe', points: CONFIG.pointsPerFrappe },
    ]);
    expect(run.coffeeCount).toBe(1);
    expect(runScore(run)).toBe(Math.floor(run.distance) + CONFIG.pointsPerFrappe);
  });

  it('slows to the stumble speed after a hit', () => {
    const run = emptyRun();
    run.obstacles.push({ lane: 1, at: 2, knocked: false });
    runFor(run, 0.5);
    expect(run.speed).toBeLessThan(CONFIG.startSpeed * 0.8);
  });
});
