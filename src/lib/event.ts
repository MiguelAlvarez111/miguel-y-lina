export type CountdownStatus = 'future' | 'today' | 'past' | 'invalid';

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  status: CountdownStatus;
}

export interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
  url: string;
}

const EMPTY_COUNTDOWN = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
} as const;

const ABSOLUTE_DATE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/;
const INVITE_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const UNSAFE_NAME_CONTROLS = /[\p{Cc}\p{Cf}]/gu;
const BOGOTA_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1] ?? 0;
}

function parseAbsoluteDate(value: string): number | null {
  const match = ABSOLUTE_DATE.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '0'] =
    match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function zeroCountdown(status: Exclude<CountdownStatus, 'future'>): Countdown {
  return { ...EMPTY_COUNTDOWN, status };
}

function bogotaCalendarDate(timestamp: number): string {
  return BOGOTA_DATE.format(new Date(timestamp));
}

export function countdown(target: string, now: number): Countdown {
  const targetTime = parseAbsoluteDate(target);
  if (targetTime === null || !Number.isFinite(now)) return zeroCountdown('invalid');

  const remaining = targetTime - now;
  if (remaining <= 0) {
    return zeroCountdown(
      bogotaCalendarDate(now) === bogotaCalendarDate(targetTime) ? 'today' : 'past',
    );
  }

  const totalSeconds = Math.floor(remaining / 1_000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    status: 'future',
  };
}

export function guestContext(search: string): {
  name: string;
  inviteId: string | null;
} {
  const params = new URLSearchParams(search);
  const rawName = params.get('guest') ?? '';
  const name = Array.from(
    rawName.normalize('NFC').replace(UNSAFE_NAME_CONTROLS, '').trim(),
  )
    .slice(0, 100)
    .join('');
  const invite = params.get('invite');

  return {
    name,
    inviteId: invite !== null && INVITE_ID.test(invite) ? invite : null,
  };
}

function calendarTimes(event: CalendarEvent): { start: number; end: number } {
  const start = parseAbsoluteDate(event.start);
  const end = parseAbsoluteDate(event.end);
  if (start === null || end === null || end <= start) {
    throw new RangeError('Calendar event dates must be valid absolute dates with end after start');
  }
  return { start, end };
}

function utcCalendarDate(timestamp: number): string {
  return new Date(timestamp).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function calendarUrl(event: CalendarEvent): string {
  const { start, end } = calendarTimes(event);
  const details = event.url
    ? `${event.description}${event.description ? '\n\n' : ''}${event.url}`
    : event.description;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${utcCalendarDate(start)}/${utcCalendarDate(end)}`,
    details,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function foldIcsLine(line: string): string[] {
  const folded: string[] = [];
  let chunk = '';
  let limit = 75;

  for (const character of line) {
    const candidate = chunk + character;
    if (new TextEncoder().encode(candidate).byteLength > limit) {
      folded.push(folded.length === 0 ? chunk : ` ${chunk}`);
      chunk = character;
      limit = 74;
    } else {
      chunk = candidate;
    }
  }

  folded.push(folded.length === 0 ? chunk : ` ${chunk}`);
  return folded;
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function calendarIcs(event: CalendarEvent): string {
  const { start, end } = calendarTimes(event);
  const identity = [
    event.title,
    event.start,
    event.end,
    event.location,
    event.description,
    event.url,
  ].join('\u001f');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Miguel y Lina//Wedding Invitation//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${utcCalendarDate(start)}-${stableHash(identity)}@miguel-y-lina.wedding`,
    `DTSTAMP:${utcCalendarDate(start)}`,
    `DTSTART:${utcCalendarDate(start)}`,
    `DTEND:${utcCalendarDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `URL:${escapeIcsText(event.url)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.flatMap(foldIcsLine).join('\r\n')}\r\n`;
}

export function providerUrl(value: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (
    parsed.protocol !== 'https:' ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.port !== ''
  ) {
    return null;
  }

  const approved =
    parsed.hostname === 'tally.so' ||
    parsed.hostname === 'forms.gle' ||
    (parsed.hostname === 'docs.google.com' &&
      (parsed.pathname === '/forms' || parsed.pathname.startsWith('/forms/')));

  return approved ? parsed.href : null;
}
