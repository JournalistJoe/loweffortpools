import { DatabaseReader } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export type TeamRecord = { wins: number; losses: number; ties: number };

/** Sort key for "best team" fallbacks: wins first, then win percentage. */
export function recordScore(r: TeamRecord | null | undefined): number {
  if (!r) return -1;
  const games = r.wins + r.losses + r.ties;
  return games === 0 ? -1 : r.wins + (r.wins + r.ties / 2) / games;
}

/**
 * Final-game records for every team in `seasonYear`, keyed by ESPN team id so
 * they can be joined to a different season's team documents.
 */
export async function getSeasonRecordsByEspnId(
  db: DatabaseReader,
  seasonYear: number,
): Promise<Map<number, TeamRecord>> {
  const teams = await db
    .query("nflTeams")
    .withIndex("by_season", (q) => q.eq("seasonYear", seasonYear))
    .collect();
  const games = await db
    .query("games")
    .withIndex("by_season_and_week", (q) => q.eq("seasonYear", seasonYear))
    .filter((q) => q.eq(q.field("status"), "final"))
    .collect();

  const byTeamId = new Map<Id<"nflTeams">, TeamRecord>();
  for (const t of teams) byTeamId.set(t._id, { wins: 0, losses: 0, ties: 0 });
  for (const g of games) {
    for (const side of [g.homeTeamId, g.awayTeamId]) {
      const rec = byTeamId.get(side);
      if (!rec) continue;
      if (g.tie) rec.ties++;
      else if (g.winnerTeamId === side) rec.wins++;
      else rec.losses++;
    }
  }

  const byEspnId = new Map<number, TeamRecord>();
  for (const t of teams) {
    const rec = byTeamId.get(t._id);
    if (rec && rec.wins + rec.losses + rec.ties > 0) byEspnId.set(t.espnId, rec);
  }
  return byEspnId;
}
