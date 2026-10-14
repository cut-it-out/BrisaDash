// npm run credits: writes CREDITS.md from src/credits.json
import { readFileSync, writeFileSync } from 'node:fs';
import { creditsMarkdown } from './credits-markdown.mjs';

const credits = JSON.parse(readFileSync(new URL('../src/credits.json', import.meta.url), 'utf8'));
writeFileSync(new URL('../CREDITS.md', import.meta.url), creditsMarkdown(credits));
console.log(`CREDITS.md written (${credits.assets.length} packs)`);
