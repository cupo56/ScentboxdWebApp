import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaintenancePage from './MaintenancePage';

const WAITLIST_URL = 'https://waitlist.scent-boxd.com';

describe('MaintenancePage', () => {
  it('uses the language stored by the waitlist', () => {
    localStorage.setItem('scentboxd-language', 'de');
    render(<MaintenancePage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Deine Duftsammlung. Endlich an einem Ort.'
    );
    expect(document.documentElement.lang).toBe('de');
  });

  it('switches between German and English and remembers the choice', async () => {
    const user = userEvent.setup();
    localStorage.setItem('scentboxd-language', 'de');
    render(<MaintenancePage />);

    await user.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Your fragrance collection. Finally in one place.'
    );
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('scentboxd-language')).toBe('en');
  });

  it('sends visitors to the waitlist instead of showing a signup form or counter', () => {
    localStorage.setItem('scentboxd-language', 'de');
    const { container } = render(<MaintenancePage />);

    const links = screen.getAllByRole('link', { name: 'Zur Warteliste' });
    expect(links).toHaveLength(2);
    links.forEach((link) => expect(link).toHaveAttribute('href', WAITLIST_URL));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(container.querySelector('.counter-head, #waitlist-form')).toBeNull();
  });

  it('links the legal pages of the waitlist', () => {
    localStorage.setItem('scentboxd-language', 'de');
    render(<MaintenancePage />);

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'Impressum' })).toHaveAttribute(
      'href',
      `${WAITLIST_URL}/impressum`
    );
    expect(within(footer).getByRole('link', { name: 'Datenschutz' })).toHaveAttribute(
      'href',
      `${WAITLIST_URL}/datenschutz`
    );
    // App-Datenschutz und Nutzungsbedingungen sind bis zum App-Start Entwürfe.
    expect(within(footer).queryByRole('link', { name: /App-Datenschutz|Nutzungsbedingungen/ })).toBeNull();
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
