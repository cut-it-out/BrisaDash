import { describe, expect, it } from 'vitest';
import * as THREE from 'three';

// Phase 0: proves the test runner works and three resolves outside a browser.
// Pure-logic tests for src/game/ start in Phase 1.
describe('toolchain', () => {
  it('imports three', () => {
    expect(Number(THREE.REVISION)).toBeGreaterThan(0);
  });
});
