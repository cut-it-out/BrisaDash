// Balancing on the phone (Phase 5): with ?debug in the URL, numeric config values can be overridden,
// e.g. ?debug&twoBlockedChance=0.6&rowGapSeconds=1.2&cupLineMix.frappe=0.3
// Only numbers that already exist in the config are accepted. laneCount is fixed (the renderer reads it at startup).
const FIXED_KEYS = ['laneCount'];

// Mutates config; returns the overrides that were applied, as { key: value }
export function applyOverrides(config, params) {
  const applied = {};
  if (!params.has('debug')) return applied;
  for (const [key, raw] of params) {
    if (FIXED_KEYS.includes(key)) continue;
    const value = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(value)) continue;
    const [name, inner] = key.split('.');
    const target = inner === undefined ? config : config[name];
    const field = inner === undefined ? name : inner;
    if (typeof target !== 'object' || target === null || typeof target[field] !== 'number') continue;
    target[field] = value;
    applied[key] = value;
  }
  return applied;
}
