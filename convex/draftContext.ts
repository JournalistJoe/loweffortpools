import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

const PARTICIPANTS = 8;
const TOTAL_PICKS = 32;

// Snake order: odd rounds 1..8, even rounds 8..1 (mirrors draft.ts).
function draftPositionForPick(pickIndex: number): number {
  const round = Math.floor(pickIndex / PARTICIPANTS) + 1;
  const positionInRound = pickIndex % PARTICIPANTS;
  return round % 2 === 1 ? positionInRound + 1 : PARTICIPANTS - positionInRound;
}

export type TeamRecord = { wins: number; losses: number; ties: number };

export type AiDraftContext = {
  leagueName: string;
  seasonYear: number;
  pickNumber: number;
  round: number;
  picksUntilMyNextTurn: number;
  me: { displayName: string; draftPosition: number };
  myRoster: string[];
  /** 1-based overall pick numbers still owned by this manager, including the current one. */
  myRemainingPickNumbers: number[];
  /** Managers who pick between now and this manager's next turn, in order. */
  pickersBeforeMyNextTurn: string[];
  rosters: Array<{ displayName: string; isMe: boolean; teams: string[] }>;
  availableTeams: Array<{
    id: Id<"nflTeams">;
    abbrev: string;
    fullName: string;
    lastSeason: TeamRecord | null;
  }>;
};

/**
 * Everything the AI needs to recommend a pick for the signed-in superuser.
 * Throws when the user is not a superuser, the draft is not active, or it is
 * not a turn they are allowed to pick for.
 */
export const getAiDraftContext = internalQuery({
  args: { leagueId: v.id("leagues"), userId: v.id("users") },
  handler: async (ctx, args): Promise<AiDraftContext> => {
    const user = await ctx.db.get(args.userId);
    if (!user?.isSuperuser) throw new Error("AI picks are a superuser-only feature");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");
    if (league.status !== "draft" || league.currentPickIndex === undefined) {
      throw new Error("Draft is not active");
    }
    if (league.currentPickIndex >= TOTAL_PICKS) throw new Error("Draft is complete");

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const currentPosition = draftPositionForPick(league.currentPickIndex);
    const current = participants.find((p) => p.draftPosition === currentPosition);
    if (!current) throw new Error("No participant for the current pick");

    const isMine = current.userId === args.userId;
    const isMyManagedTeam = current.isAdminManaged && league.adminUserId === args.userId;
    if (!isMine && !isMyManagedTeam) throw new Error("It's not your turn to pick");

    const picks = await ctx.db
      .query("draftPicks")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const teamsThisSeason = await ctx.db
      .query("nflTeams")
      .withIndex("by_season", (q) => q.eq("seasonYear", league.seasonYear))
      .collect();
    const teamById = new Map(teamsThisSeason.map((t) => [t._id, t]));

    // Prior-season records, joined through espnId since teams are stored per season.
    const lastYear = league.seasonYear - 1;
    const teamsLastSeason = await ctx.db
      .query("nflTeams")
      .withIndex("by_season", (q) => q.eq("seasonYear", lastYear))
      .collect();
    const gamesLastSeason = await ctx.db
      .query("games")
      .withIndex("by_season_and_week", (q) => q.eq("seasonYear", lastYear))
      .filter((q) => q.eq(q.field("status"), "final"))
      .collect();
    const recordByLastSeasonId = new Map<Id<"nflTeams">, TeamRecord>();
    for (const t of teamsLastSeason) recordByLastSeasonId.set(t._id, { wins: 0, losses: 0, ties: 0 });
    for (const g of gamesLastSeason) {
      for (const side of [g.homeTeamId, g.awayTeamId]) {
        const rec = recordByLastSeasonId.get(side);
        if (!rec) continue;
        if (g.tie) rec.ties++;
        else if (g.winnerTeamId === side) rec.wins++;
        else rec.losses++;
      }
    }
    const recordByEspnId = new Map<number, TeamRecord>();
    for (const t of teamsLastSeason) {
      const rec = recordByLastSeasonId.get(t._id);
      if (rec && rec.wins + rec.losses + rec.ties > 0) recordByEspnId.set(t.espnId, rec);
    }

    const pickedIds = new Set(picks.map((p) => p.nflTeamId));
    const availableTeams = teamsThisSeason
      .filter((t) => !pickedIds.has(t._id))
      .map((t) => ({
        id: t._id,
        abbrev: t.abbrev,
        fullName: t.fullName,
        lastSeason: recordByEspnId.get(t.espnId) ?? null,
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const rosters = participants
      .slice()
      .sort((a, b) => a.draftPosition - b.draftPosition)
      .map((p) => ({
        displayName: p.displayName,
        isMe: p._id === current._id,
        teams: picks
          .filter((pk) => pk.participantId === p._id)
          .sort((a, b) => a.pickNumber - b.pickNumber)
          .map((pk) => teamById.get(pk.nflTeamId)?.abbrev ?? "?"),
      }));

    // Snake order bookkeeping: who picks before this manager is up again, and
    // which overall pick numbers this manager still owns.
    const byPosition = new Map(participants.map((p) => [p.draftPosition, p.displayName]));
    const pickersBeforeMyNextTurn: string[] = [];
    const myRemainingPickNumbers: number[] = [league.currentPickIndex + 1];
    let reachedNextTurn = false;
    for (let i = league.currentPickIndex + 1; i < TOTAL_PICKS; i++) {
      const pos = draftPositionForPick(i);
      if (pos === current.draftPosition) {
        myRemainingPickNumbers.push(i + 1);
        reachedNextTurn = true;
      } else if (!reachedNextTurn) {
        pickersBeforeMyNextTurn.push(byPosition.get(pos) ?? `slot ${pos}`);
      }
    }
    const picksUntilMyNextTurn = pickersBeforeMyNextTurn.length;
    const myRoster = rosters.find((r) => r.isMe)?.teams ?? [];

    return {
      leagueName: league.name,
      seasonYear: league.seasonYear,
      pickNumber: league.currentPickIndex + 1,
      round: Math.floor(league.currentPickIndex / PARTICIPANTS) + 1,
      picksUntilMyNextTurn,
      me: { displayName: current.displayName, draftPosition: current.draftPosition },
      myRoster,
      myRemainingPickNumbers,
      pickersBeforeMyNextTurn,
      rosters,
      availableTeams,
    };
  },
});

export type { Doc };
