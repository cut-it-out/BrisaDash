// Share score (GDD §9): Web Share API when available, otherwise copy the text and link.

export function shareText(score, metres, coffees) {
  const cups = coffees === 1 ? '1 coffee' : `${coffees} coffees`;
  return `I dashed ${metres} m and grabbed ${cups} at Brisa Café — score ${score}! ☕🌊 Can you beat me?`;
}

// Returns 'shared', 'cancelled', 'copied' or 'failed'. nav is injectable for tests.
export async function shareScore(text, url, nav = navigator) {
  if (nav.share) {
    try {
      await nav.share({ text, url });
      return 'shared';
    } catch (error) {
      if (error.name === 'AbortError') return 'cancelled'; // the player closed the share sheet
      // anything else (e.g. not allowed): fall back to copying
    }
  }
  try {
    await nav.clipboard.writeText(`${text} ${url}`);
    return 'copied';
  } catch {
    return 'failed'; // no clipboard, e.g. over plain http on a LAN
  }
}
