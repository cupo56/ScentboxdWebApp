import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import InstagramBanner, { DISMISS_KEY } from './InstagramBanner';

describe('InstagramBanner', () => {
  beforeEach(() => localStorage.clear());

  it('links to the Instagram profile in a new tab', () => {
    render(<InstagramBanner />);
    const link = screen.getByRole('link', { name: /instagram/i });
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/scentboxd/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('hides itself and remembers the dismissal', () => {
    const { unmount } = render(<InstagramBanner closeLabel="Close" />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('link', { name: /instagram/i })).not.toBeInTheDocument();
    expect(localStorage.getItem(DISMISS_KEY)).toBe('1');

    unmount();
    render(<InstagramBanner />);
    expect(screen.queryByRole('link', { name: /instagram/i })).not.toBeInTheDocument();
  });

  it('renders translated copy', () => {
    render(<InstagramBanner label="Neu:" message="Wir sind jetzt auf Instagram!" cta="Folge @scentboxd" />);
    expect(screen.getByText(/Wir sind jetzt auf Instagram!/)).toBeInTheDocument();
    expect(screen.getByText(/Folge @scentboxd/)).toBeInTheDocument();
  });
});
