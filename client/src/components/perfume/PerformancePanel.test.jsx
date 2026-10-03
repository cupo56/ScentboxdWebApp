import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PerformancePanel from './PerformancePanel';

describe('PerformancePanel', () => {
  it('prefers community averages and falls back to codes', () => {
    render(
      <PerformancePanel
        perfume={{ longevity_code: 'long', sillage_code: 'light', avg_bottle_rating: 4.5, avg_value_rating: null }}
        summary={{ avg_longevity: 72, avg_sillage: null }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Performance' })).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();          // community longevity
    expect(screen.getByText('Light')).toBeInTheDocument();        // sillage from code
    expect(screen.getByText('4.5')).toBeInTheDocument();          // bottle
    expect(screen.getByText('—')).toBeInTheDocument();            // value missing
    const bars = document.querySelectorAll('.perf__fill');
    expect(bars[0].style.width).toBe('72%');
    expect(bars[1].style.width).toBe('30%');
    expect(bars[2].style.width).toBe('90%');
    expect(bars[3].style.width).toBe('0%');
  });
});
