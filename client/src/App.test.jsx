import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}));
vi.mock('./config/maintenance', () => ({ isMaintenanceMode: () => true }));

import App from './App';

describe('App maintenance gate', () => {
  it('renders only the maintenance screen on a locked host without an admin session', () => {
    const { container } = render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Duftsammlung|fragrance collection/
    );
    // Kein Layout gemountet -> keine App-Navigation im Baum. Die Rechtslinks im
    // Footer der Maintenance-Seite sind selbst ein <nav> und zählen nicht.
    const navs = [...container.querySelectorAll('nav')];
    expect(navs.every((nav) => nav.closest('#maintenance-page'))).toBe(true);
  });
});
