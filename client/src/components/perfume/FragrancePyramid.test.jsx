import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../services/noteService', () => ({
  getNoteDisplayNames: () => Promise.resolve({ Mokka: 'Mocha', Blätterteig: 'Puff Pastry' }),
}));

import FragrancePyramid from './FragrancePyramid';

describe('FragrancePyramid', () => {
  it('shows the English note names', async () => {
    render(
      <FragrancePyramid
        notes={[
          { note_type: 'top', notes: { name: 'Mokka' } },
          { note_type: 'base', notes: { name: 'Blätterteig' } },
          { note_type: 'base', notes: { name: 'Vanille' } },
        ]}
      />
    );

    expect(await screen.findByText('Mocha')).toBeInTheDocument();
    expect(screen.getByText('Puff Pastry')).toBeInTheDocument();
    // Ohne Übersetzung bleibt der Name aus der DB stehen.
    expect(screen.getByText('Vanille')).toBeInTheDocument();
    expect(screen.queryByText('Mokka')).toBeNull();
  });
});
