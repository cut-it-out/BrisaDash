import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { creditsMarkdown } from '../scripts/credits-markdown.mjs';
import credits from '../src/credits.json';

const PUBLIC_DIR = join(import.meta.dirname, '..', 'public');

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

const credited = credits.assets.flatMap((asset) => asset.files);

describe('credits', () => {
  it('CREDITS.md matches src/credits.json (run `npm run credits` after editing the JSON)', () => {
    const onDisk = readFileSync(join(import.meta.dirname, '..', 'CREDITS.md'), 'utf8').replace(/\r\n/g, '\n');
    expect(onDisk).toBe(creditsMarkdown(credits));
  });

  it('every model and texture in public/models is credited', () => {
    const shipped = filesUnder(join(PUBLIC_DIR, 'models')).map((f) => relative(PUBLIC_DIR, f).replace(/\\/g, '/'));
    expect(shipped.length).toBeGreaterThan(0);
    for (const file of shipped) expect(credited).toContain(file);
  });

  it('every credited file exists', () => {
    for (const file of credited) expect(existsSync(join(PUBLIC_DIR, file)), file).toBe(true);
  });

  it('every asset is CC0', () => {
    for (const asset of credits.assets) expect(asset.license).toBe('CC0 1.0');
  });
});
