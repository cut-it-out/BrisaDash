// Device-local best score (GDD §6). localStorage can be missing or throw (private browsing,
// blocked site data), so every access is wrapped and the game plays the same without it.
const KEY = 'brisa-dash-best';

function deviceStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadBest(storage = deviceStorage()) {
  try {
    const best = Number(storage?.getItem(KEY));
    return Number.isFinite(best) && best > 0 ? Math.floor(best) : 0;
  } catch {
    return 0;
  }
}

// Returns the best score after this run; it still counts for this visit if saving fails
export function recordScore(score, best, storage = deviceStorage()) {
  if (score <= best) return best;
  try {
    storage?.setItem(KEY, String(score));
  } catch {
    // not saved, e.g. storage full or blocked
  }
  return score;
}
