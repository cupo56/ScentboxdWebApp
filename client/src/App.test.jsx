import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./lib/supabaseClient', () => ({ supabase: {} }));
vi.mock('./config/maintenance', () => ({ isMaintenanceMode: () => true }));

import App from './App';

describe('App maintenance gate', () => {
  it('renders only the maintenance screen on a locked host', () => {
    const { container } = render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Wir bauen gerade an Scentboxd'
    );
    // Kein Layout gemountet -> keine Navigation im Baum.
    expect(container.querySelector('nav')).toBeNull();
  });
});
