import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ExploreRedirect from './ExploreRedirect';

function Probe() {
  const { pathname, search } = useLocation();
  return <p>{pathname + search}</p>;
}

const renderAt = (entry) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/explore" element={<ExploreRedirect />} />
        <Route path="/catalog" element={<Probe />} />
      </Routes>
    </MemoryRouter>
  );

describe('ExploreRedirect', () => {
  it('sends /explore to /catalog', () => {
    renderAt('/explore');
    expect(screen.getByText('/catalog')).toBeInTheDocument();
  });

  it('keeps the query string', () => {
    renderAt('/explore?q=oud&sort=name');
    expect(screen.getByText('/catalog?q=oud&sort=name')).toBeInTheDocument();
  });
});
