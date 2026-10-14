import { describe, expect, it } from 'vitest';
import {
  createLaneState,
  effectiveLane,
  isSliding,
  lanePosition,
  requestLaneMove,
  updateLanes,
} from '../src/game/lanes.js';

const SLIDE = 0.12;

describe('lanes', () => {
  it('starts in the middle lane, not sliding', () => {
    const s = createLaneState(3);
    expect(effectiveLane(s)).toBe(1);
    expect(isSliding(s)).toBe(false);
    expect(lanePosition(s)).toBe(1);
  });

  it('slides one lane over the slide time', () => {
    const s = createLaneState(3);
    expect(requestLaneMove(s, 1)).toBe(true);
    expect(isSliding(s)).toBe(true);
    updateLanes(s, SLIDE / 2, SLIDE);
    expect(lanePosition(s)).toBeGreaterThan(1);
    expect(lanePosition(s)).toBeLessThan(2);
    updateLanes(s, SLIDE / 2, SLIDE);
    expect(isSliding(s)).toBe(false);
    expect(lanePosition(s)).toBe(2);
  });

  it('counts the target lane as the lane during a slide', () => {
    const s = createLaneState(3);
    requestLaneMove(s, -1);
    updateLanes(s, SLIDE * 0.1, SLIDE);
    expect(effectiveLane(s)).toBe(0);
  });

  it('ignores a move past the edge', () => {
    const s = createLaneState(3);
    requestLaneMove(s, -1);
    updateLanes(s, SLIDE, SLIDE);
    expect(requestLaneMove(s, -1)).toBe(false);
    expect(effectiveLane(s)).toBe(0);
    expect(isSliding(s)).toBe(false);
  });

  it('queues one move made during a slide and runs it after', () => {
    const s = createLaneState(3);
    requestLaneMove(s, -1);
    expect(requestLaneMove(s, 1)).toBe(true);
    updateLanes(s, SLIDE, SLIDE);
    expect(effectiveLane(s)).toBe(1);
    expect(isSliding(s)).toBe(true);
    updateLanes(s, SLIDE, SLIDE);
    expect(lanePosition(s)).toBe(1);
  });

  it('queues only one move', () => {
    const s = createLaneState(3);
    requestLaneMove(s, -1);
    requestLaneMove(s, 1);
    expect(requestLaneMove(s, 1)).toBe(false);
  });

  it('does not queue a move that would leave the track', () => {
    const s = createLaneState(3);
    requestLaneMove(s, 1);
    expect(requestLaneMove(s, 1)).toBe(false);
    expect(requestLaneMove(s, -1)).toBe(true);
  });
});
