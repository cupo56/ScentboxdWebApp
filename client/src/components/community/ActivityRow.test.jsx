import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ActivityRow from './ActivityRow';

const review = {
  id: 'r1',
  rating: 4,
  created_at: '2026-09-30T10:00:00Z',
  profiles: { username: 'mara', avatar_url: null },
  perfumes: { id: 'p1', name: 'Layton', brands: { name: 'Parfums de Marly' } },
};

describe('ActivityRow', () => {
  it('links the user to their profile and the perfume to its page', () => {
    render(<MemoryRouter><ActivityRow review={review} /></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'mara' })).toHaveAttribute('href', '/profile/mara');
    expect(screen.getByRole('link', { name: 'Layton' })).toHaveAttribute('href', '/perfume/p1');
    expect(screen.getByText('★ 4')).toBeInTheDocument();
  });

  it('falls back when the profile is missing', () => {
    render(<MemoryRouter><ActivityRow review={{ ...review, profiles: null }} /></MemoryRouter>);

    expect(screen.getByText('Someone')).toBeInTheDocument();
  });
});
