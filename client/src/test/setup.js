import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// vite.config.js setzt `globals` nicht, deshalb registriert Testing Library
// sein automatisches Cleanup nicht selbst. Ohne das hier bleiben die Renders
// eines Tests im Dokument stehen und der nächste Test findet sie mit.
afterEach(cleanup);

// Neuere Node-Versionen liefern ein eigenes, unvollständiges `localStorage`,
// das jsdoms Storage überdeckt. Dann ersetzen wir es durch eine Map-Variante.
if (typeof globalThis.localStorage?.clear !== 'function') {
  const data = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (data.has(k) ? data.get(k) : null),
      setItem: (k, v) => { data.set(k, String(v)); },
      removeItem: (k) => { data.delete(k); },
      clear: () => data.clear(),
    },
  });
}
