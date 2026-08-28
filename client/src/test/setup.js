import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// vite.config.js setzt `globals` nicht, deshalb registriert Testing Library
// sein automatisches Cleanup nicht selbst. Ohne das hier bleiben die Renders
// eines Tests im Dokument stehen und der nächste Test findet sie mit.
afterEach(cleanup);
