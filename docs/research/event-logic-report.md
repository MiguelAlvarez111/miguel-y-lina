# Event logic verification

Date: 2026-09-13

## Scope

Implemented and reviewed `src/lib/event.ts` with tests in `tests/event.test.ts`:

- Bogotá-aware countdown states with zero-clamped expired values.
- Unicode-normalized guest context, removal of control/format characters, a 100-code-point limit, and syntactic invite IDs.
- Google Calendar URLs and deterministic ICS output with absolute UTC dates, TEXT escaping, CRLF, and 75-octet folding.
- HTTPS RSVP provider allowlisting for `tally.so`, `forms.gle`, and the `/forms` route on `docs.google.com`, rejecting userinfo and non-default ports.

## TDD evidence

- RED: `npm test -- tests/event.test.ts` failed because `../src/lib/event` did not exist (1 failed suite, exit 1).
- GREEN: `npm test -- tests/event.test.ts` passed 33 tests (1 file, exit 0).
- Full current unit suite: `npm test` passed 33 tests (1 file, exit 0).
- Isolated strict compile: `tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM --skipLibCheck src/lib/event.ts` exited 0.
- Targeted lint: `eslint src/lib/event.ts tests/event.test.ts` exited 0.

## Limitations and integration contract

- `guest` is returned as plain text data. The browser consumer must continue to assign it with `textContent`; it is not HTML and it is not authentication.
- `inviteId` checks syntax only and does not resolve guests, permissions, or attendance limits.
- Provider validation checks URL structure and allowlisted destinations only; it does not assert that a form exists or accepts submissions. No RSVP URL was invented.
- ICS `UID` and `DTSTAMP` are deterministic so identical event input produces identical downloads. `DTSTAMP` uses the event start instant rather than wall-clock generation time.
- Countdown day-state boundaries intentionally use `America/Bogota` as the event contract.
