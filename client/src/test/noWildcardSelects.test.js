import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// SCE-141: Auf user_perfumes und profiles sollen einzelne Spalten gesperrt
// werden. Ein select('*') oder ein select() ohne Spaltenliste auf diesen
// Tabellen scheitert danach mit 42501. Dieser Test findet solche Stellen
// auch dort, wo kein Service-Test hinschaut (z. B. im Auth-Store).
const LOCKED_TABLES = ['user_perfumes', 'profiles'];
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(js|jsx)$/.test(name) && !/\.test\.(js|jsx)$/.test(name) ? [path] : [];
  });
}

describe('selects on column-locked tables', () => {
  it('never use a wildcard or an empty column list', () => {
    const offenders = [];
    for (const file of sourceFiles(SRC)) {
      const code = readFileSync(file, 'utf8');
      for (const table of LOCKED_TABLES) {
        const chain = new RegExp(`\\.from\\('${table}'\\)([\\s\\S]*?)(;|\\n\\s*\\n)`, 'g');
        for (const match of code.matchAll(chain)) {
          if (/\.select\(\s*\)|\.select\(\s*['"`]\s*\*/.test(match[1])) {
            offenders.push(`${file.replace(SRC, 'src')}: ${table}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
