import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StarRating from './StarRating';

describe('StarRating', () => {
  it('renders 5 stars and marks the ones up to the rating as filled', () => {
    const { container } = render(<StarRating rating={3} />);

    const stars = container.querySelectorAll('.star-rating__star');
    expect(stars).toHaveLength(5);
    expect([...stars].map((s) => s.classList.contains('filled'))).toEqual([
      true, true, true, false, false,
    ]);
  });

  it('is not interactive by default: clicking a star does not call onChange', async () => {
    const onChange = vi.fn();
    const { container } = render(<StarRating rating={2} onChange={onChange} />);

    await userEvent.click(container.querySelectorAll('.star-rating__star')[4]);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange with the clicked star value when interactive', async () => {
    const onChange = vi.fn();
    render(<StarRating rating={2} interactive onChange={onChange} />);

    const fifthStar = screen.getAllByRole('button')[4];
    await userEvent.click(fifthStar);

    expect(onChange).toHaveBeenCalledWith(5);
  });
});
