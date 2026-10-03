import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Aurora from './Aurora';

describe('Aurora', () => {
  it('renders two decorative blobs that are hidden from assistive tech', () => {
    const { container } = render(<Aurora />);

    const layer = container.querySelector('.aurora');
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer.querySelectorAll('.aurora__blob')).toHaveLength(2);
    expect(layer.querySelector('.aurora__blob--magenta')).toBeInTheDocument();
    expect(layer.querySelector('.aurora__blob--gold')).toBeInTheDocument();
  });
});
