import { describe, expect, it, vi } from 'vitest';
import { shareScore, shareText } from '../src/ui/share.js';

const URL = 'https://brisa-dash.pages.dev';

function fakeNav({ share, writeText } = {}) {
  return {
    share,
    clipboard: { writeText: writeText ?? vi.fn(async () => {}) },
  };
}

describe('shareText', () => {
  it('matches the GDD template', () => {
    expect(shareText(642, 412, 23)).toBe(
      'I dashed 412 m and grabbed 23 coffees at Brisa Café — score 642! ☕🌊 Can you beat me?',
    );
  });

  it('says "1 coffee", not "1 coffees"', () => {
    expect(shareText(20, 10, 1)).toContain('grabbed 1 coffee at');
  });
});

describe('shareScore', () => {
  it('uses the Web Share API when available', async () => {
    const nav = fakeNav({ share: vi.fn(async () => {}) });
    expect(await shareScore('hi', URL, nav)).toBe('shared');
    expect(nav.share).toHaveBeenCalledWith({ text: 'hi', url: URL });
    expect(nav.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('does nothing more when the player cancels the share sheet', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const nav = fakeNav({ share: vi.fn(async () => Promise.reject(abort)) });
    expect(await shareScore('hi', URL, nav)).toBe('cancelled');
    expect(nav.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('copies text and link when sharing fails for another reason', async () => {
    const denied = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    const nav = fakeNav({ share: vi.fn(async () => Promise.reject(denied)) });
    expect(await shareScore('hi', URL, nav)).toBe('copied');
    expect(nav.clipboard.writeText).toHaveBeenCalledWith(`hi ${URL}`);
  });

  it('copies text and link when there is no Web Share API', async () => {
    const nav = fakeNav();
    expect(await shareScore('hi', URL, nav)).toBe('copied');
    expect(nav.clipboard.writeText).toHaveBeenCalledWith(`hi ${URL}`);
  });

  it('reports failure when copying is not possible either', async () => {
    const nav = fakeNav({ writeText: vi.fn(async () => Promise.reject(new Error('no clipboard'))) });
    expect(await shareScore('hi', URL, nav)).toBe('failed');
  });
});
