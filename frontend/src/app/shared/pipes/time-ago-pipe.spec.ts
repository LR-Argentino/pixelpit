import { formatTimeAgo } from './time-ago-pipe';

const NOW = Date.parse('2026-10-20T12:00:00Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;

describe('formatTimeAgo', () => {
  it.each([
    [30_000, 'gerade eben'],
    [20 * MIN, 'vor 20 Min.'],
    [2 * 60 * MIN, 'vor 2 Std.'],
    [24 * 60 * MIN, 'vor 1 Tag'],
    [3 * 24 * 60 * MIN, 'vor 3 Tagen'],
    [60 * 24 * 60 * MIN, 'vor 2 Monaten'],
  ])('sollte %i ms als „%s“ anzeigen', (elapsed, expected) => {
    // Intl setzt je nach Einheit ein geschütztes Leerzeichen (U+00A0), optisch identisch
    expect(formatTimeAgo(ago(elapsed), NOW, 'de').replace(/ /g, ' ')).toBe(expected);
  });

  it('sollte „gerade eben“ anzeigen, wenn der Zeitpunkt in der Zukunft liegt', () => {
    expect(formatTimeAgo(ago(-5 * MIN), NOW, 'de')).toBe('gerade eben');
  });
});
