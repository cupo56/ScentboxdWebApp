import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrendingCarousel from './TrendingCarousel';

const items = [
  { rank: 1, id: 'a', name: 'Layton', brand_name: 'PdM', image_url: null },
  { rank: 2, id: 'b', name: 'Oud Wood', brand_name: 'Tom Ford', image_url: 'https://x/o.png' },
  { rank: 4, id: 'd', name: 'Sauvage', brand_name: 'Dior', image_url: null },
];

describe('TrendingCarousel', () => {
  it('renders a tile per perfume with rank badges', () => {
    render(<MemoryRouter><TrendingCarousel items={items} /></MemoryRouter>);

    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByRole('link', { name: /Layton/ })).toHaveAttribute('href', '/perfume/a');
    expect(screen.getByText('1')).toHaveClass('badge-rank-1');
    expect(screen.getByText('2')).toHaveClass('badge-rank-2');
    expect(screen.getByText('4')).toHaveClass('badge-rank');
    expect(screen.getByText('4')).not.toHaveClass('badge-rank-1');
  });

  it('renders nothing without items', () => {
    const { container } = render(<MemoryRouter><TrendingCarousel items={[]} /></MemoryRouter>);

    expect(container.firstChild).toBeNull();
  });
});
