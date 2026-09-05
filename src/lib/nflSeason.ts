/**
 * Frontend helpers for the active NFL season.
 * Season constants live in convex/lib/nflSeason.ts (single source of truth).
 */
import { CURRENT_SEASON_YEAR, SEASON_KICKOFF } from "../../convex/lib/nflSeason";

export { CURRENT_SEASON_YEAR, SEASON_KICKOFF };

function toDatetimeLocalString(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** Kickoff at SEASON_KICKOFF.hour in the browser's local time zone. */
export function defaultDraftDatetimeLocal(): string {
  return toDatetimeLocalString(
    new Date(
      SEASON_KICKOFF.year,
      SEASON_KICKOFF.month,
      SEASON_KICKOFF.day,
      SEASON_KICKOFF.hour,
      SEASON_KICKOFF.minute,
    ),
  );
}

/** Kickoff at SEASON_KICKOFF.hour UTC, converted to the browser's local time. */
export function defaultDraftDatetimeUtcLocal(): string {
  return toDatetimeLocalString(
    new Date(
      Date.UTC(
        SEASON_KICKOFF.year,
        SEASON_KICKOFF.month,
        SEASON_KICKOFF.day,
        SEASON_KICKOFF.hour,
        SEASON_KICKOFF.minute,
      ),
    ),
  );
}

export function leagueEntryPath(leagueId: string, status?: string): string {
  if (status === "live" || status === "completed") {
    return `/league/${leagueId}/leaderboard`;
  }
  return `/league/${leagueId}/draft`;
}
