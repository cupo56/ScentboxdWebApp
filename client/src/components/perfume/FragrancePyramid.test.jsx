import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../hooks/useNoteName', () => ({ useNoteName: () => (n) => ({ Mokka: 'Mocha' }[n] || n) }));

import FragrancePyramid from './FragrancePyramid';

describe('FragrancePyramid', () => {
  it('renders one glass row per tier with translated, comma-separated notes', () => {
    render(
      <FragrancePyramid notes={[
        { note_type: 'top', notes: { name: 'Mokka' } },
        { note_type: 'top', notes: { name: 'Bergamotte' } },
        { note_type: 'base', notes: { name: 'Moschus' } },
      ]} />
    );

    expect(screen.getByRole('heading', { name: 'Fragrance pyramid' })).toBeInTheDocument();
    expect(screen.getByText('Top')).toBeInTheDocument();
    expect(screen.getByText('Mocha, Bergamotte')).toBeInTheDocument();
    expect(screen.queryByText('Heart')).toBeNull();
    expect(screen.getByText('Moschus')).toBeInTheDocument();
  });

  it('renders nothing without notes', () => {
    const { container } = render(<FragrancePyramid notes={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
