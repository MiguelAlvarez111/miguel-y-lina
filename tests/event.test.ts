import { describe, expect, test } from 'vitest';

import {
  calendarIcs,
  calendarUrl,
  countdown,
  guestContext,
  providerUrl,
  type CalendarEvent,
} from '../src/lib/event';

const event: CalendarEvent = {
  title: 'Miguel & Lina',
  start: '2026-09-19T19:00:00-05:00',
  end: '2026-09-19T22:00:00-05:00',
  location: 'Club de Comercio, Salón Ciudad de Cúcuta',
  description: 'Acompáñanos, por favor.\nCena y celebración.',
  url: 'https://example.com/invitacion',
};

describe('countdown', () => {
  test('returns the remaining whole units before the event instant', () => {
    expect(
      countdown(
        '2026-09-20T00:00:00Z',
        Date.parse('2026-09-19T00:00:00Z'),
      ),
    ).toEqual({
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      status: 'future',
    });
  });

  test('decomposes a future interval into days, hours, minutes, and seconds', () => {
    expect(
      countdown(
        '2026-09-20T02:03:04Z',
        Date.parse('2026-09-19T00:00:00Z'),
      ),
    ).toEqual({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
      status: 'future',
    });
  });

  test('returns today at the exact event instant', () => {
    const target = '2026-09-19T19:00:00-05:00';

    expect(countdown(target, Date.parse(target)).status).toBe('today');
  });

  test('returns today from the event instant through the Bogotá event day', () => {
    expect(
      countdown(
        '2026-09-19T19:00:00-05:00',
        Date.parse('2026-09-20T04:59:59Z'),
      ),
    ).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      status: 'today',
    });
  });

  test('returns past without negative units after the Bogotá event day', () => {
    expect(
      countdown(
        '2026-09-19T19:00:00-05:00',
        Date.parse('2026-09-20T05:00:00Z'),
      ),
    ).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      status: 'past',
    });
  });

  test.each([
    ['not-a-date', Date.parse('2026-09-19T00:00:00Z')],
    ['2026-09-20', Date.parse('2026-09-19T00:00:00Z')],
    ['2026-09-20T00:00:00Z', Number.NaN],
  ])('returns invalid for an invalid target or current time', (target, now) => {
    expect(countdown(target, now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      status: 'invalid',
    });
  });
});

describe('guestContext', () => {
  test('decodes and normalizes an accented guest name', () => {
    expect(guestContext('?guest=Familia%20A%CC%81lvarez').name).toBe(
      'Familia Álvarez',
    );
  });

  test('removes control and bidirectional formatting characters', () => {
    expect(guestContext('?guest=Ana%00%0ALu%C3%ADs%E2%80%AE').name).toBe(
      'AnaLuís',
    );
  });

  test('limits guest names to 100 Unicode code points without splitting emoji', () => {
    const name = `${'a'.repeat(99)}😀more`;

    expect(guestContext(`?guest=${encodeURIComponent(name)}`).name).toBe(
      `${'a'.repeat(99)}😀`,
    );
  });

  test('returns markup as inert text data for a textContent consumer', () => {
    const payload = '<img src=x onerror=alert(1)>';

    expect(guestContext(`?guest=${encodeURIComponent(payload)}`).name).toBe(
      payload,
    );
  });

  test('returns only invite codes that match the public syntactic contract', () => {
    expect(guestContext('?invite=abc_123-Z').inviteId).toBe('abc_123-Z');
    expect(guestContext('?invite=../../private').inviteId).toBeNull();
    expect(guestContext(`?invite=${'a'.repeat(65)}`).inviteId).toBeNull();
  });

  test('returns empty guest data when parameters are absent', () => {
    expect(guestContext('')).toEqual({ name: '', inviteId: null });
  });
});

describe('calendar exports', () => {
  test('builds a Google Calendar URL from the shared event fields', () => {
    const url = new URL(calendarUrl(event));

    expect(`${url.origin}${url.pathname}`).toBe(
      'https://calendar.google.com/calendar/render',
    );
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      action: 'TEMPLATE',
      text: 'Miguel & Lina',
      dates: '20260920T000000Z/20260920T030000Z',
      location: 'Club de Comercio, Salón Ciudad de Cúcuta',
    });
    expect(url.searchParams.get('details')).toContain(
      'Acompáñanos, por favor.\nCena y celebración.',
    );
    expect(url.searchParams.get('details')).toContain(event.url);
  });

  test('emits UTC dates, escaped text, and deterministic identity in an ICS', () => {
    const first = calendarIcs(event);
    const second = calendarIcs(event);

    expect(first).toContain('DTSTART:20260920T000000Z\r\n');
    expect(first).toContain('DTEND:20260920T030000Z\r\n');
    expect(first).toContain('LOCATION:Club de Comercio\\, Salón Ciudad de Cúcuta\r\n');
    expect(first).toContain(
      'DESCRIPTION:Acompáñanos\\, por favor.\\nCena y celebración.\r\n',
    );
    expect(first).toMatch(/UID:[^\r\n]+\r\n/);
    expect(first).toMatch(/DTSTAMP:\d{8}T\d{6}Z\r\n/);
    expect(second).toBe(first);
  });

  test('uses CRLF and folds every content line to at most 75 UTF-8 octets', () => {
    const description = `Celebración ${'á'.repeat(100)}, final`;
    const output = calendarIcs({
      ...event,
      description,
    });

    expect(output.replace(/\r\n/g, '')).not.toContain('\n');
    expect(output.replace(/\r\n /g, '')).toContain(
      `DESCRIPTION:${description.replace(',', '\\,')}`,
    );
    const lines = output.split('\r\n').filter(Boolean);
    expect(lines.some((line) => line.startsWith(' '))).toBe(true);
    for (const line of lines) {
      expect(new TextEncoder().encode(line).byteLength).toBeLessThanOrEqual(75);
    }
  });

  test('escapes backslashes and semicolons in ICS text values', () => {
    const output = calendarIcs({
      ...event,
      title: 'Miguel \\ Lina; boda',
    });

    expect(output).toContain('SUMMARY:Miguel \\\\ Lina\\; boda\r\n');
  });

  test.each([
    { ...event, start: '2026-09-19' },
    { ...event, start: '2026-02-30T19:00:00-05:00' },
    { ...event, end: 'invalid' },
    { ...event, end: event.start },
  ])('rejects invalid or non-increasing event dates', (invalidEvent) => {
    expect(() => calendarUrl(invalidEvent)).toThrow();
    expect(() => calendarIcs(invalidEvent)).toThrow();
  });
});

describe('providerUrl', () => {
  test.each([
    'https://tally.so/r/abc123',
    'https://forms.gle/abc123',
    'https://docs.google.com/forms/d/e/abc123/viewform',
  ])('accepts an approved HTTPS form URL: %s', (url) => {
    expect(providerUrl(url)).toBe(url);
  });

  test.each([
    'javascript:alert(1)',
    'http://tally.so/r/abc123',
    'https://user:pass@tally.so/r/abc123',
    'https://tally.so.evil.example/r/abc123',
    'https://docs.google.com/document/d/abc123',
    'https://forms.gle:8443/abc123',
    'not a URL',
    '',
  ])('rejects a non-approved form URL: %s', (url) => {
    expect(providerUrl(url)).toBeNull();
  });
});
