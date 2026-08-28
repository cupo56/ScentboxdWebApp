import { describe, it, expect } from 'vitest';
import { isMaintenanceMode } from './maintenance';

// Ein Stand-in für window.location. Nur die zwei Felder, die die Funktion liest.
const at = (hostname, search = '') => ({ hostname, search });

describe('isMaintenanceMode', () => {
  it('locks the apex domain', () => {
    expect(isMaintenanceMode(at('scent-boxd.com'))).toBe(true);
  });

  it('locks the www subdomain', () => {
    expect(isMaintenanceMode(at('www.scent-boxd.com'))).toBe(true);
  });

  it('leaves the vercel.app developer alias open', () => {
    expect(isMaintenanceMode(at('scentboxd-webapp.vercel.app'))).toBe(false);
  });

  it('leaves preview deployments open', () => {
    const host = 'scentboxd-webapp-git-main-harunsefer-3348s-projects.vercel.app';
    expect(isMaintenanceMode(at(host))).toBe(false);
  });

  it('leaves localhost open', () => {
    expect(isMaintenanceMode(at('localhost'))).toBe(false);
  });

  it('leaves the waitlist subdomain open', () => {
    expect(isMaintenanceMode(at('waitlist.scent-boxd.com'))).toBe(false);
  });

  it('forces the screen on any host when ?maintenance is present', () => {
    expect(isMaintenanceMode(at('localhost', '?maintenance'))).toBe(true);
  });
});
