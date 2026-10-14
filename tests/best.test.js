import { describe, expect, it } from 'vitest';
import { loadBest, recordScore } from '../src/ui/best.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => (data[key] = value),
  };
}

const throwing = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('QuotaExceededError');
  },
};

describe('loadBest', () => {
  it('is 0 when nothing is stored', () => {
    expect(loadBest(fakeStorage())).toBe(0);
  });

  it('reads a stored best', () => {
    expect(loadBest(fakeStorage({ 'brisa-dash-best': '642' }))).toBe(642);
  });

  it('ignores junk and negative values', () => {
    expect(loadBest(fakeStorage({ 'brisa-dash-best': 'abc' }))).toBe(0);
    expect(loadBest(fakeStorage({ 'brisa-dash-best': '-5' }))).toBe(0);
  });

  it('is 0 when storage throws or is missing', () => {
    expect(loadBest(throwing)).toBe(0);
    expect(loadBest(null)).toBe(0);
  });
});

describe('recordScore', () => {
  it('saves and returns a new best', () => {
    const storage = fakeStorage();
    expect(recordScore(700, 642, storage)).toBe(700);
    expect(storage.data['brisa-dash-best']).toBe('700');
  });

  it('keeps the old best when the score is not higher', () => {
    const storage = fakeStorage();
    expect(recordScore(642, 642, storage)).toBe(642);
    expect(recordScore(100, 642, storage)).toBe(642);
    expect(storage.data).toEqual({});
  });

  it('still returns the new best when saving throws', () => {
    expect(recordScore(700, 642, throwing)).toBe(700);
    expect(recordScore(700, 642, null)).toBe(700);
  });
});
