// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
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
    expect(css).not.toMatch(/Inter/);
    expect(css).not.toMatch(/#161826|#9184d9|#a78bfa|167, 139, 250/i);
  });
});
