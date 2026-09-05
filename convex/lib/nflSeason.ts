/**
 * Source of truth for the active NFL regular season.
 * The frontend re-exports from here (src/lib/nflSeason.ts); do not duplicate.
 */

export const CURRENT_SEASON_YEAR = 2026;

/**
 * Wednesday, Sept 9, 2026 — Patriots at Seahawks kickoff (8:20 PM ET).
 * Month is 0-indexed. hour/minute are the default draft time shown in the UI.
 */
export const SEASON_KICKOFF = {
  year: 2026,
  month: 8,
  day: 9,
  hour: 20,
  minute: 0,
} as const;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_WEEK = 18;

export function getSeasonKickoffDate(): Date {
  return new Date(
    Date.UTC(SEASON_KICKOFF.year, SEASON_KICKOFF.month, SEASON_KICKOFF.day),
  );
}

function weeksSinceKickoff(now: Date): number {
  return Math.floor((now.getTime() - getSeasonKickoffDate().getTime()) / WEEK_MS);
}

export function getCurrentNFLWeek(now = new Date()): number {
  return Math.max(1, Math.min(MAX_WEEK, weeksSinceKickoff(now) + 1));
}

/** True once the calendar has moved past week 18 (start of week 19). */
export function isRegularSeasonComplete(now = new Date()): boolean {
  return weeksSinceKickoff(now) >= MAX_WEEK;
}
