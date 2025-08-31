import { v } from "convex/values";
import { query, mutation, internalMutation, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

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
        scheduledAutopickId: undefined, // Clear any scheduled auto-pick
      });

      await ctx.db.insert("activity", {
        leagueId: args.leagueId,
        type: "draft_completed",
        message: "Draft completed! League is now live.",
        createdAt: Date.now(),
      });

      // Send push notifications for draft completion
      await ctx.scheduler.runAfter(0, api.notificationActions.notifyLeagueActivity, {
        leagueId: args.leagueId,
        activityType: "draft_completed",
        message: "Draft completed! League is now live.",
        excludeUserId: userId,
      });
    } else {
      // Cancel existing scheduled auto-pick before advancing
      if (league.scheduledAutopickId) {
        try {
          await ctx.scheduler.cancel(league.scheduledAutopickId);
        } catch (error) {
          // Function may have already executed or been cancelled, ignore error
        }
      }

      // Update league state for next pick
      await ctx.db.patch(args.leagueId, {
        currentPickIndex: nextPickIndex,
        currentPickStartedAt: Date.now(),
      });

      // Get updated league state and schedule next auto-pick
      const updatedLeague = await ctx.db.get(args.leagueId);
      if (updatedLeague) {
        await scheduleAutoPick(ctx, updatedLeague);
      }
    }

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "draft_pick",
      message: `${participant.displayName} selected ${nflTeam.fullName}`,
      createdAt: Date.now(),
      participantId: participant._id,
      nflTeamId: args.nflTeamId,
    });

    // Send push notifications for draft pick
    await ctx.scheduler.runAfter(0, api.notificationActions.notifyLeagueActivity, {
      leagueId: args.leagueId,
      activityType: "draft_pick",
      message: `${participant.displayName} selected ${nflTeam.fullName}`,
      participantId: participant._id,
      nflTeamId: args.nflTeamId,
      excludeUserId: userId,
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

// Helper query to get preferences by league and participant (ensures consistency)
export const getPreferencesByLeagueAndParticipant = query({
  args: {
    leagueId: v.id("leagues"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("draftPreferences")
      .withIndex("by_league_and_participant", (q) =>
        q.eq("leagueId", args.leagueId).eq("participantId", args.participantId),
      )
      .unique();

    return preferences;
  },
});


export const setDraftPreferences = mutation({
  args: {
    leagueId: v.id("leagues"),
    rankings: v.array(v.id("nflTeams")),
    enableAutoDraft: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    // Find the participant for this user and league
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    if (!participant) {
      throw new Error("You are not a participant in this league");
    }

    // Validate that draft hasn't started yet or is still in setup
    if (league.status !== "setup") {
      throw new Error("Draft preferences can only be set before the draft starts");
    }

    // Validate that all rankings are valid NFL teams for this season
    const nflTeams = await ctx.db
      .query("nflTeams")
      .withIndex("by_season", (q) => q.eq("seasonYear", league.seasonYear))
      .collect();

    const validTeamIds = new Set(nflTeams.map(team => team._id));
    const invalidTeams = args.rankings.filter(teamId => !validTeamIds.has(teamId));
    
    if (invalidTeams.length > 0) {
      throw new Error("Invalid NFL team IDs in rankings");
    }

    // Ensure all 32 teams are included and no duplicates
    if (args.rankings.length !== 32 || new Set(args.rankings).size !== 32) {
      throw new Error("Rankings must include all 32 NFL teams exactly once");
    }

    const now = Date.now();

    // Check for existing preferences
    const existingPreferences = await ctx.db
      .query("draftPreferences")
      .withIndex("by_league_and_participant", (q) =>
        q.eq("leagueId", args.leagueId).eq("participantId", participant._id)
      )
      .unique();

    if (existingPreferences) {
      // Update existing preferences
      await ctx.db.patch(existingPreferences._id, {
        rankings: args.rankings,
        enableAutoDraft: args.enableAutoDraft,
        updatedAt: now,
      });
    } else {
      // Create new preferences
      await ctx.db.insert("draftPreferences", {
        participantId: participant._id,
        leagueId: args.leagueId,
        rankings: args.rankings,
        enableAutoDraft: args.enableAutoDraft,
        updatedAt: now,
      });
    }

    // Log activity
    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "draft_preferences_set",
      message: `${participant.displayName} set their draft preferences`,
      createdAt: now,
      participantId: participant._id,
    });

    return true;
  },
});

export const getDraftPreferences = query({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const participant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    if (!participant) return null;

    // Get preferences directly to avoid circular reference
    const preferences = await ctx.db
      .query("draftPreferences")
      .withIndex("by_league_and_participant", (q) =>
        q.eq("leagueId", args.leagueId).eq("participantId", participant._id),
      )
      .unique();

    if (!preferences) return null;

    // Enrich with team data
    const rankedTeams = await Promise.all(
      preferences.rankings.map(async (teamId: Doc<"nflTeams">['_id']) => {
        const team = await ctx.db.get(teamId);
        return team;
      })
    );

    return {
      ...preferences,
      rankedTeams: rankedTeams.filter(Boolean), // Remove any null teams
    };
  },
});

export const toggleAutoDraft = mutation({
  args: {
    leagueId: v.id("leagues"),
    enabled: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    const participant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    if (!participant) {
      throw new Error("You are not a participant in this league");
    }

    // Update participant auto-draft status
    await ctx.db.patch(participant._id, {
      isAutoDrafting: args.enabled,
      autoDraftReason: args.enabled ? (args.reason || "user_request") : undefined,
    });

    // If enabling auto-draft and it's currently this participant's turn, reschedule immediately
    if (args.enabled && league.status === "draft" && league.currentPickIndex !== undefined) {
      const currentDraftPosition = getParticipantForPick(league.currentPickIndex);
      if (participant.draftPosition === currentDraftPosition) {
        // It's this participant's turn - reschedule to pick immediately
        await scheduleAutoPick(ctx, league);
      }
    }

    const now = Date.now();
    const activityType = args.enabled ? "participant_autodraft_enabled" : "participant_autodraft_disabled";
    const message = args.enabled 
      ? `${participant.displayName} enabled auto-draft${args.reason ? ` (${args.reason})` : ""}`
      : `${participant.displayName} disabled auto-draft`;

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: activityType,
      message,
      createdAt: now,
      participantId: participant._id,
    });

    return true;
  },
});

export const scheduledAutoPick = internalMutation({
  args: {
    leagueId: v.id("leagues"),
    expectedPickIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const league = await ctx.db.get(args.leagueId);
    if (!league) return; // League not found, nothing to do

    // Verify league is still in draft status
    if (league.status !== "draft") return;

    // Verify we're still on the expected pick (prevent race conditions)
    if (league.currentPickIndex !== args.expectedPickIndex) return;

    // Verify this pick hasn't been completed
    if (league.currentPickIndex === undefined || league.currentPickIndex >= 32) return;

    // Find current participant
    const currentDraftPosition = getParticipantForPick(league.currentPickIndex);
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", league._id))
      .collect();
    
    const currentParticipant = participants.find(
      (p) => p.draftPosition === currentDraftPosition,
    );

    if (!currentParticipant) return; // No current participant found

    // Clear the scheduled autopick ID since we're about to execute it
    await ctx.db.patch(league._id, {
      scheduledAutopickId: undefined,
    });

    // Determine reason based on participant's auto-draft status
    const reason = currentParticipant.isAutoDrafting ? "auto_enabled" : "timeout";

    // Execute the auto-pick
    await makeAutoPick(ctx, league, currentParticipant, reason);
  },
});

export const scheduleNextAutoPick = internalMutation({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const league = await ctx.db.get(args.leagueId);
    if (!league) return;
    
    await scheduleAutoPick(ctx, league);
  },
});

// Helper function to schedule an auto-pick for the current turn
async function scheduleAutoPick(ctx: MutationCtx, league: Doc<"leagues">) {
  // Cancel existing scheduled auto-pick if there is one
  if (league.scheduledAutopickId) {
    try {
      await ctx.scheduler.cancel(league.scheduledAutopickId);
    } catch (error) {
      // Function may have already executed or been cancelled, ignore error
    }
  }

  // Don't schedule if draft is complete or no active pick
  if (league.currentPickIndex === undefined || league.currentPickIndex >= 32) {
    await ctx.db.patch(league._id, {
      scheduledAutopickId: undefined,
    });
    return;
  }

  // Find current participant to check if they have auto-draft enabled
  if (league.currentPickIndex === undefined) {
    return; // No current pick to schedule
  }
  
  const currentDraftPosition = getParticipantForPick(league.currentPickIndex);
  const participants = await ctx.db
    .query("participants")
    .withIndex("by_league", (q) => q.eq("leagueId", league._id))
    .collect();
  
  const currentParticipant = participants.find(
    (p) => p.draftPosition === currentDraftPosition,
  );

  // Determine delay based on auto-draft status
  let delay;
  if (currentParticipant?.isAutoDrafting) {
    // If auto-draft is enabled, pick almost immediately (small delay for UI update)
    delay = 100; // 100ms delay for UI to update
  } else {
    // Normal timer duration
    delay = league.draftPickTimeLimit || 180000; // Default to 3 minutes
  }

  // Schedule auto-pick with appropriate delay
  const scheduledId = await ctx.scheduler.runAfter(
    delay,
    internal.draft.scheduledAutoPick,
    { 
      leagueId: league._id,
      expectedPickIndex: league.currentPickIndex,
    }
  );

  // Store the scheduled function ID for later cancellation
  await ctx.db.patch(league._id, {
    scheduledAutopickId: scheduledId,
  });
}

// Helper function to make an auto-pick for a participant
async function makeAutoPick(
  ctx: MutationCtx,
  league: Doc<"leagues">,
  currentParticipant: Doc<"participants">,
  reason: "timeout" | "auto_enabled"
) {
  const now = Date.now();
  
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
    return null; // No teams available
  }

  // Try to get participant's draft preferences
  let selectedTeam;
  let usedPreferences = false;
  
  const preferences = await ctx.db
    .query("draftPreferences")
    .withIndex("by_league_and_participant", (q) =>
      q.eq("leagueId", league._id).eq("participantId", currentParticipant._id)
    )
    .unique();

  if (preferences && preferences.rankings.length > 0) {
    // Find the highest ranked available team
    for (const teamId of preferences.rankings) {
      const team = availableTeams.find((t) => t._id === teamId);
      if (team) {
        selectedTeam = team;
        usedPreferences = true;
        break;
      }
    }
  }

  // Fallback to random selection if no preferences or no preferred teams available
  if (!selectedTeam) {
    const randomIndex = Math.floor(Math.random() * availableTeams.length);
    selectedTeam = availableTeams[randomIndex];
  }

  // Make the pick
  if (league.currentPickIndex === undefined) {
    return null; // No current pick index
  }
  
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
      scheduledAutopickId: undefined, // Clear any scheduled auto-pick
    });

    await ctx.db.insert("activity", {
      leagueId: league._id,
      type: "draft_completed",
      message: "Draft completed! League is now live.",
      createdAt: now,
    });

    // Send push notifications for draft completion
    await ctx.scheduler.runAfter(0, api.notificationActions.notifyLeagueActivity, {
      leagueId: league._id,
      activityType: "draft_completed",
      message: "Draft completed! League is now live.",
    });
  } else {
    // Update league state for next pick
    await ctx.db.patch(league._id, {
      currentPickIndex: nextPickIndex,
      currentPickStartedAt: now,
    });

    // Get updated league state and schedule next auto-pick
    const updatedLeague = await ctx.db.get(league._id);
    if (updatedLeague) {
      await scheduleAutoPick(ctx, updatedLeague);
    }
  }

  // Log auto-pick activity with appropriate message based on reason and preferences
  let activityType: "draft_autopick" | "draft_preference_autopick";
  let message: string;

  if (reason === "auto_enabled") {
    activityType = usedPreferences ? "draft_preference_autopick" : "draft_autopick";
    message = usedPreferences
      ? `${currentParticipant.displayName} was auto-drafted ${selectedTeam.fullName} from their preferences`
      : `${currentParticipant.displayName} was randomly assigned ${selectedTeam.fullName} (auto-draft enabled)`;
  } else {
    activityType = usedPreferences ? "draft_preference_autopick" : "draft_autopick";
    message = usedPreferences
      ? `Time expired! ${currentParticipant.displayName} was auto-drafted ${selectedTeam.fullName} from their preferences`
      : `Time expired! ${currentParticipant.displayName} was randomly assigned ${selectedTeam.fullName}`;
  }

  await ctx.db.insert("activity", {
    leagueId: league._id,
    type: activityType,
    message,
    createdAt: now,
    participantId: currentParticipant._id,
    nflTeamId: selectedTeam._id,
  });

  // Send push notifications for autopick
  await ctx.scheduler.runAfter(0, api.notificationActions.notifyLeagueActivity, {
    leagueId: league._id,
    activityType: "draft_autopick", // Use generic autopick type for notifications
    message,
    participantId: currentParticipant._id,
    nflTeamId: selectedTeam._id,
  });

  return selectedTeam;
}

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

      // Check if participant has auto-draft enabled
      if (currentParticipant.isAutoDrafting) {
        await makeAutoPick(ctx, league, currentParticipant, "auto_enabled");
        continue;
      }

      // Check for timeout
      const pickTimeLimit = league.draftPickTimeLimit || 180000; // Default to 3 minutes if not set
      const elapsed = now - league.currentPickStartedAt;
      if (elapsed < pickTimeLimit) {
        continue; // Pick hasn't expired yet
      }

      await makeAutoPick(ctx, league, currentParticipant, "timeout");
    }

    return true;
  },
});
