import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Wordmark from './Wordmark';

describe('Wordmark', () => {
  it('renders "scentboxd" with the accent on "boxd"', () => {
    render(<Wordmark />);

    const mark = screen.getByText((_, el) => el?.classList.contains('wordmark') && el.textContent === 'scentboxd');
    expect(mark).toBeInTheDocument();
    expect(mark.querySelector('.wordmark__accent')).toHaveTextContent('boxd');
  });

  it('accepts an extra class', () => {
    render(<Wordmark className="navbar__logo-text" />);

    expect(document.querySelector('.wordmark')).toHaveClass('navbar__logo-text');
  });
});
