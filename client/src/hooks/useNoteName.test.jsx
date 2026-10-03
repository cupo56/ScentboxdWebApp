import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../services/noteService', () => ({ getNoteDisplayNames: vi.fn() }));

import { getNoteDisplayNames } from '../services/noteService';
import useNoteNamesStore from '../store/noteNamesStore';
import { useNoteName } from './useNoteName';

function Probe({ name }) {
  const noteName = useNoteName();
  return <p>{noteName(name)}</p>;
}

beforeEach(() => {
  vi.clearAllMocks();
  useNoteNamesStore.setState({ names: {}, _loading: null });
});

describe('useNoteName', () => {
  it('returns the input until the map is loaded, then the English name', async () => {
    getNoteDisplayNames.mockResolvedValue({ Mokka: 'Mocha' });
    render(<Probe name="Mokka" />);

    expect(screen.getByText('Mokka')).toBeInTheDocument();
    expect(await screen.findByText('Mocha')).toBeInTheDocument();
  });

  it('passes unknown names through and loads the map only once', async () => {
    getNoteDisplayNames.mockResolvedValue({ Mokka: 'Mocha' });
    render(<><Probe name="Vanille" /><Probe name="Mokka" /></>);

    expect(await screen.findByText('Mocha')).toBeInTheDocument();
    expect(screen.getByText('Vanille')).toBeInTheDocument();
    expect(getNoteDisplayNames).toHaveBeenCalledTimes(1);
  });
});
