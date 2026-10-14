// Builds CREDITS.md from src/credits.json, the same data the in-game credits screen reads (GDD §8)
export function creditsMarkdown(credits) {
  const lines = [
    '# Credits',
    '',
    '<!-- Generated from src/credits.json by `npm run credits`. Edit the JSON, not this file. -->',
    '',
    'Every third-party asset used in Brisa Dash. All are CC0 (public domain); credit is given anyway.',
    '',
  ];
  for (const asset of credits.assets) {
    lines.push(
      `## ${asset.pack} ${asset.version} by ${asset.creator}`,
      '',
      `- Source: ${asset.url}`,
      `- License: ${asset.license} (${asset.licenseUrl})`,
      '- Files used (under `public/`):',
      ...asset.files.map((file) => `  - \`${file}\``),
      '',
    );
  }
  lines.push(
    '## Code libraries',
    '',
    '- three.js (https://threejs.org), MIT License',
    '',
    'Everything else (track, parasols, loungers, sea) is built in code. Brisa Café is a fictional café made up for this prototype.',
    '',
  );
  return lines.join('\n');
}
