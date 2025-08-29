import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
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
        const pickTimeLimit = league.draftPickTimeLimit || 180000; // Default to 3 minutes if not set
        timeRemaining = Math.max(0, pickTimeLimit - elapsed);
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

export const checkAndMakeAutoPick = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find all leagues in draft status
    const draftingLeagues = await ctx.db
      .query("leagues")
      .withIndex("by_status", (q) => q.eq("status", "draft"))
      .collect();

    const now = Date.now();

    for (const league of draftingLeagues) {
      if (
        league.currentPickIndex === undefined ||
        league.currentPickIndex >= 32 ||
        !league.currentPickStartedAt
      ) {
        continue; // Skip leagues that aren't actively drafting
      }

      const pickTimeLimit = league.draftPickTimeLimit || 180000; // Default to 3 minutes if not set
      const elapsed = now - league.currentPickStartedAt;
      if (elapsed < pickTimeLimit) {
        continue; // Pick hasn't expired yet
      }

      // Find current participant
      const currentDraftPosition = getParticipantForPick(league.currentPickIndex);
      const participants = await ctx.db
        .query("participants")
        .withIndex("by_league", (q) => q.eq("leagueId", league._id))
        .collect();
      
      const currentParticipant = participants.find(
        (p) => p.draftPosition === currentDraftPosition,
      );

      if (!currentParticipant) {
        continue; // No current participant found
      }

      // Get available teams
      const picks = await ctx.db
        .query("draftPicks")
        .withIndex("by_league", (q) => q.eq("leagueId", league._id))
        .collect();

      const nflTeams = await ctx.db
        .query("nflTeams")
        .withIndex("by_season", (q) => q.eq("seasonYear", league.seasonYear))
        .collect();

      const pickedTeamIds = new Set(picks.map((p) => p.nflTeamId));
      const availableTeams = nflTeams.filter(
        (team) => !pickedTeamIds.has(team._id),
      );

      if (availableTeams.length === 0) {
        continue; // No teams available
      }

      // Select random team
      const randomIndex = Math.floor(Math.random() * availableTeams.length);
      const selectedTeam = availableTeams[randomIndex];

      // Make the pick
      const round = Math.floor(league.currentPickIndex / 8) + 1;
      const pickNumber = league.currentPickIndex + 1;

      await ctx.db.insert("draftPicks", {
        leagueId: league._id,
        round,
        pickNumber,
        participantId: currentParticipant._id,
        nflTeamId: selectedTeam._id,
        pickedAt: now,
      });

      // Update league state
      const nextPickIndex = league.currentPickIndex + 1;
      const isDraftComplete = nextPickIndex >= 32;

      if (isDraftComplete) {
        await ctx.db.patch(league._id, {
          status: "live",
          currentPickIndex: undefined,
          currentPickStartedAt: undefined,
        });

        await ctx.db.insert("activity", {
          leagueId: league._id,
          type: "draft_completed",
          message: "Draft completed! League is now live.",
          createdAt: now,
        });
      } else {
        await ctx.db.patch(league._id, {
          currentPickIndex: nextPickIndex,
          currentPickStartedAt: now,
        });
      }

      // Log auto-pick activity
      await ctx.db.insert("activity", {
        leagueId: league._id,
        type: "draft_autopick",
        message: `Time expired! ${currentParticipant.displayName} was automatically assigned ${selectedTeam.fullName}`,
        createdAt: now,
        participantId: currentParticipant._id,
        nflTeamId: selectedTeam._id,
      });
    }

    return true;
  },
});
