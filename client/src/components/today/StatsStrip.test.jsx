import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatsStrip from './StatsStrip';

describe('StatsStrip', () => {
  it('shows the three counts with links', () => {
    render(<MemoryRouter><StatsStrip owned={12} wantToTry={5} reviews={8} profilePath="/profile/me" /></MemoryRouter>);

    expect(screen.getByRole('link', { name: /12\s*Collection/ })).toHaveAttribute('href', '/collection');
    expect(screen.getByRole('link', { name: /5\s*Want to try/ })).toHaveAttribute('href', '/profile/me?tab=want_to_try');
    expect(screen.getByRole('link', { name: /8\s*Reviews/ })).toHaveAttribute('href', '/profile/me?tab=reviews');
  });

  it('shows placeholders while loading', () => {
    render(<MemoryRouter><StatsStrip owned={0} wantToTry={0} reviews={0} profilePath="/profile/me" loading /></MemoryRouter>);

    expect(screen.getAllByText('–')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Collection loading' })).toBeInTheDocument();
  });
});
