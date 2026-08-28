import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MaintenancePage from './MaintenancePage';

describe('MaintenancePage', () => {
  it('shows the headline', () => {
    render(<MaintenancePage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Wir bauen gerade an Scentboxd'
    );
  });

  it('links to the waitlist', () => {
    render(<MaintenancePage />);

    expect(screen.getByRole('link', { name: /warteliste/i })).toHaveAttribute(
      'href',
      'https://waitlist.scent-boxd.com'
    );
  });

  it('adds a noindex robots tag while mounted and removes it on unmount', () => {
    const { unmount } = render(<MaintenancePage />);

    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex'
    );

    unmount();

    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});
