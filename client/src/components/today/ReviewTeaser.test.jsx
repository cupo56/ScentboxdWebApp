import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReviewTeaser from './ReviewTeaser';

const review = { id: 'r1', rating: 4, text: 'Nice', profiles: { username: 'mara' }, perfumes: { id: 'p1', name: 'Layton' } };

describe('ReviewTeaser', () => {
  it('links the user and the perfume and shows rating and text', () => {
    render(<MemoryRouter><ReviewTeaser review={review} /></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'mara' })).toHaveAttribute('href', '/profile/mara');
    expect(screen.getByRole('link', { name: 'Layton' })).toHaveAttribute('href', '/perfume/p1');
    expect(screen.getByText('★ 4.0')).toBeInTheDocument();
    expect(screen.getByText('Nice')).toBeInTheDocument();
  });

  it('falls back to Anonymous without a profile', () => {
    render(<MemoryRouter><ReviewTeaser review={{ ...review, profiles: null }} /></MemoryRouter>);

    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });
});
