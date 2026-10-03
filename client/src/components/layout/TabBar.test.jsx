import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TabBar from './TabBar';

describe('TabBar', () => {
  it('has the five app tabs in order', () => {
    render(<MemoryRouter><TabBar /></MemoryRouter>);

    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Today', 'Catalog', 'Favorites', 'Collection', 'Community']);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/', '/catalog', '/favorites', '/collection', '/community']);
  });
});
