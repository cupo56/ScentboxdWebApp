// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('./index.css', import.meta.url)), 'utf8');

// Das `:root`-Block-Ende ist die erste schließende Klammer nach `:root {`.
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));

const token = (name) => {
  const match = root.match(new RegExp(`${name}:\\s*([^;]+);`));
  return match ? match[1].trim() : undefined;
};

describe('design tokens', () => {
  it.each([
    ['--bg', '#130A10'],
    ['--accent', '#C20A66'],
    ['--accent-soft', '#E75A9C'],
    ['--champagne', '#F7E7CE'],
    ['--text', '#F2EEF0'],
    ['--text-body', '#A9A2A6'],
    ['--text-muted', '#94A3B8'],
    ['--gold', '#FFD700'],
    ['--silver', '#C0C0C0'],
    ['--bronze', '#CD7F32'],
    ['--success', '#4ADE80'],
    ['--danger', '#FF6B6B'],
    ['--warning', '#F59E0B'],
  ])('defines %s as %s', (name, value) => {
    expect(token(name)).toBe(value);
  });

  it.each([
    '--surface', '--surface-2', '--surface-solid', '--glass',
    '--accent-tint', '--accent-line', '--hairline', '--hairline-strong',
    '--glow', '--glow-card', '--inset-highlight', '--gradient-text',
    '--font', '--font-display',
  ])('defines %s', (name) => {
    expect(token(name)).toBeDefined();
  });

  it('keeps the legacy aliases that untouched component CSS relies on', () => {
    for (const alias of [
      '--bg-primary', '--bg-secondary', '--bg-card', '--bg-card-hover', '--bg-elevated',
      '--text-primary', '--text-secondary', '--text-dim', '--accent-text', '--accent-bright',
      '--accent-hover', '--accent-dim', '--border', '--border-hover', '--section',
      '--radius-xl', '--shadow-card', '--shadow-elevated',
    ]) {
      expect(token(alias), alias).toBeDefined();
    }
  });

  it('uses the display font for headings', () => {
    expect(token('--font-display')).toMatch(/Fraunces/);
    expect(token('--font')).toMatch(/Manrope/);
  });

  it('drops the old palette and Inter', () => {
    expect(css).not.toMatch(/\bInter\b/);
    expect(css).not.toMatch(/#161826|#9184d9|#a78bfa|167, 139, 250/i);
  });
});

describe('custom properties used by component CSS', () => {
  it('are all defined somewhere in src', () => {
    const srcDir = fileURLToPath(new URL('.', import.meta.url));
    const files = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(css|jsx|js)$/.test(entry.name) && !entry.name.includes('.test.')) files.push(full);
      }
    };
    walk(srcDir);

    const defined = new Set();
    const used = new Map();
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const [, name] of text.matchAll(/(--[a-z0-9-]+)\s*:/gi)) defined.add(name);
      for (const [, name] of text.matchAll(/var\((--[a-z0-9-]+)/gi)) {
        if (!used.has(name)) used.set(name, relative(srcDir, file));
      }
    }

    const missing = [...used].filter(([name]) => !defined.has(name)).map(([name, file]) => `${name} (first used in ${file})`);
    expect(missing).toEqual([]);
  });
});
