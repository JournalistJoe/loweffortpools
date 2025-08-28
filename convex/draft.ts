import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Snake draft order calculation
function getParticipantForPick(pickIndex: number): number {
  const round = Math.floor(pickIndex / 8) + 1;
  const positionInRound = pickIndex % 8;

  if (round % 2 === 1) {
    // Odd rounds: 1, 2, 3, 4, 5, 6, 7, 8
    return positionInRound + 1;
  } else {
    // Even rounds: 8, 7, 6, 5, 4, 3, 2, 1
    return 8 - positionInRound;
  }
}

export const getDraftState = query({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const league = await ctx.db.get(args.leagueId);
    if (!league) return null;

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const picks = await ctx.db
      .query("draftPicks")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const nflTeams = await ctx.db
      .query("nflTeams")
      .withIndex("by_season", (q) => q.eq("seasonYear", league.seasonYear))
      .collect();

    // Get picked team IDs
    const pickedTeamIds = new Set(picks.map((p) => p.nflTeamId));
    const availableTeams = nflTeams.filter(
      (team) => !pickedTeamIds.has(team._id),
    );

    let currentParticipant = null;
    let timeRemaining = null;

    if (
      league.status === "draft" &&
      league.currentPickIndex !== undefined &&
      league.currentPickIndex < 32
    ) {
      const currentDraftPosition = getParticipantForPick(
        league.currentPickIndex,
      );
      currentParticipant = participants.find(
        (p) => p.draftPosition === currentDraftPosition,
      );

      if (league.currentPickStartedAt) {
        const elapsed = Date.now() - league.currentPickStartedAt;
        timeRemaining = Math.max(0, 180000 - elapsed); // 3 minutes = 180000ms
      }
    }

    // Enrich picks with team and participant data
    const enrichedPicks = await Promise.all(
      picks.map(async (pick) => {
        const team = await ctx.db.get(pick.nflTeamId);
        const participant = await ctx.db.get(pick.participantId);
        return {
          ...pick,
          team,
          participant,
        };
      }),
    );

    return {
      league,
      participants: participants.sort(
        (a, b) => a.draftPosition - b.draftPosition,
      ),
      picks: enrichedPicks.sort((a, b) => a.pickNumber - b.pickNumber),
      availableTeams: availableTeams.sort((a, b) =>
        a.fullName.localeCompare(b.fullName),
      ),
      currentParticipant,
      timeRemaining,
      isDraftComplete: picks.length === 32,
    };
  },
});

export const makePick = mutation({
  args: {
    leagueId: v.id("leagues"),
    nflTeamId: v.id("nflTeams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    if (league.status !== "draft") {
      throw new Error("Draft is not active");
    }

    if (
      league.currentPickIndex === undefined ||
      league.currentPickIndex >= 32
    ) {
      throw new Error("Draft is complete");
    }

    // Check if it's the user's turn
    const currentDraftPosition = getParticipantForPick(league.currentPickIndex);
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    if (!participant || participant.draftPosition !== currentDraftPosition) {
      throw new Error("It's not your turn to pick");
    }

    // Check if team is available
    const existingPick = await ctx.db
      .query("draftPicks")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .filter((q) => q.eq(q.field("nflTeamId"), args.nflTeamId))
      .first();

    if (existingPick) {
      throw new Error("Team already picked");
    }

    const nflTeam = await ctx.db.get(args.nflTeamId);
    if (!nflTeam) throw new Error("NFL team not found");

    // Make the pick
    const round = Math.floor(league.currentPickIndex / 8) + 1;
    const pickNumber = league.currentPickIndex + 1;

    await ctx.db.insert("draftPicks", {
      leagueId: args.leagueId,
      round,
      pickNumber,
      participantId: participant._id,
      nflTeamId: args.nflTeamId,
      pickedAt: Date.now(),
    });

    // Update league state
    const nextPickIndex = league.currentPickIndex + 1;
    const isDraftComplete = nextPickIndex >= 32;

    if (isDraftComplete) {
      await ctx.db.patch(args.leagueId, {
        status: "live",
        currentPickIndex: undefined,
        currentPickStartedAt: undefined,
      });

      await ctx.db.insert("activity", {
        leagueId: args.leagueId,
        type: "draft_completed",
        message: "Draft completed! League is now live.",
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.leagueId, {
        currentPickIndex: nextPickIndex,
        currentPickStartedAt: Date.now(),
      });
    }

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "draft_pick",
      message: `${participant.displayName} selected ${nflTeam.fullName}`,
      createdAt: Date.now(),
      participantId: participant._id,
      nflTeamId: args.nflTeamId,
    });

    return true;
  },
});

export const getActivity = query({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activity")
      .withIndex("by_league_and_created", (q) =>
        q.eq("leagueId", args.leagueId),
      )
      .order("desc")
      .take(50);

    return activities;
  },
});
