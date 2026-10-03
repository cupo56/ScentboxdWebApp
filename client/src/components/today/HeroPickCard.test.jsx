import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroPickCard from './HeroPickCard';

const perfume = { id: 'p1', name: 'Layton', image_url: 'https://x/l.png', concentration: 'EDP', brands: { name: 'Parfums de Marly' } };

describe('HeroPickCard', () => {
  it('renders the perfume with tag and why text and links to its page', () => {
    render(<MemoryRouter><HeroPickCard perfume={perfume} tag="Trending #1" why="Warm and sweet." /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Layton' })).toBeInTheDocument();
    expect(screen.getByText('Parfums de Marly · EDP')).toBeInTheDocument();
    expect(screen.getByText('Trending #1')).toBeInTheDocument();
    expect(screen.getByText('Warm and sweet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Layton/ })).toHaveAttribute('href', '/perfume/p1');
    expect(screen.getByRole('img', { name: 'Layton' })).toHaveAttribute('src', 'https://x/l.png');
  });

  it('renders a skeleton while there is no perfume', () => {
    const { container } = render(<MemoryRouter><HeroPickCard perfume={null} /></MemoryRouter>);

    expect(container.querySelector('.hero-pick--skeleton')).toBeInTheDocument();
    expect(container.querySelector('.hero-pick__image .skeleton')).toBeInTheDocument();
  });
});
