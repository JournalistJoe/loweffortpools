import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate a random 6-character join code
function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const getUserLeagues = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get leagues where user is admin
    const adminLeagues = await ctx.db
      .query("leagues")
      .withIndex("by_admin", (q) => q.eq("adminUserId", userId))
      .collect();

    // Get leagues where user is a participant
    const participantRecords = await ctx.db
      .query("participants")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const participantLeagues = await Promise.all(
      participantRecords.map(async (participant) => {
        const league = await ctx.db.get(participant.leagueId);
        return league ? { ...league, participant } : null;
      }),
    );

    // Combine and deduplicate leagues
    const allLeagues = new Map();

    adminLeagues.forEach((league) => {
      allLeagues.set(league._id, {
        ...league,
        isAdmin: true,
        isParticipant: false,
        participant: null,
      });
    });

    participantLeagues.forEach((league) => {
      if (league) {
        const existing = allLeagues.get(league._id);
        allLeagues.set(league._id, {
          ...league,
          isAdmin: existing?.isAdmin || league.adminUserId === userId,
          isParticipant: true,
          participant: league.participant,
        });
      }
    });

    return Array.from(allLeagues.values()).sort(
      (a, b) => b._creationTime - a._creationTime,
    );
  },
});

export const getLeague = query({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const league = await ctx.db.get(args.leagueId);
    if (!league) return null;

    const participant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    return {
      ...league,
      isAdmin: league.adminUserId === userId,
      isParticipant: !!participant,
      participant,
    };
  },
});

export const getLeagueByJoinCode = query({
  args: {
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const league = await ctx.db
      .query("leagues")
      .withIndex("by_join_code", (q) =>
        q.eq("joinCode", args.joinCode.toUpperCase()),
      )
      .first();

    if (!league) return null;

    // Get participant count
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", league._id))
      .collect();

    return {
      ...league,
      participantCount: participants.length,
      canJoin: participants.length < 8 && league.status === "setup",
    };
  },
});

export const createLeague = mutation({
  args: {
    name: v.string(),
    seasonYear: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Generate unique join code
    let joinCode: string;
    let attempts = 0;
    do {
      joinCode = generateJoinCode();
      const existing = await ctx.db
        .query("leagues")
        .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
        .first();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new Error("Failed to generate unique join code");
    }

    const leagueId = await ctx.db.insert("leagues", {
      name: args.name,
      status: "setup",
      adminUserId: userId,
      seasonYear: args.seasonYear,
      joinCode,
    });

    await ctx.db.insert("activity", {
      leagueId,
      type: "league_created",
      message: `League "${args.name}" created for ${args.seasonYear} season`,
      createdAt: Date.now(),
    });

    return leagueId;
  },
});

export const joinLeague = mutation({
  args: {
    joinCode: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    if (!args.displayName.trim()) {
      throw new Error("Display name is required");
    }

    const league = await ctx.db
      .query("leagues")
      .withIndex("by_join_code", (q) =>
        q.eq("joinCode", args.joinCode.toUpperCase()),
      )
      .first();

    if (!league) {
      throw new Error("Invalid join code");
    }

    if (league.status !== "setup") {
      throw new Error("Cannot join league - draft has already started");
    }

    // Check if user is already a participant
    const existingParticipant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", league._id).eq("userId", userId),
      )
      .first();

    if (existingParticipant) {
      throw new Error("You are already a participant in this league");
    }

    // Check if league is full
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", league._id))
      .collect();

    if (participants.length >= 8) {
      throw new Error("League is full");
    }

    // Find next available draft position
    const takenPositions = new Set(participants.map((p) => p.draftPosition));
    let draftPosition = 1;
    while (takenPositions.has(draftPosition) && draftPosition <= 8) {
      draftPosition++;
    }

    if (draftPosition > 8) {
      throw new Error("No available draft positions");
    }

    const participantId = await ctx.db.insert("participants", {
      leagueId: league._id,
      userId,
      displayName: args.displayName.trim(),
      draftPosition,
    });

    await ctx.db.insert("activity", {
      leagueId: league._id,
      type: "participant_added",
      message: `${args.displayName.trim()} joined the league (Draft Position ${draftPosition})`,
      createdAt: Date.now(),
      participantId,
    });

    return { leagueId: league._id, participantId };
  },
});

export const updateLeague = mutation({
  args: {
    leagueId: v.id("leagues"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    if (league.adminUserId !== userId) {
      throw new Error("Only admin can update league");
    }

    await ctx.db.patch(args.leagueId, {
      name: args.name,
    });

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "league_created", // Reusing type
      message: `League renamed to "${args.name}"`,
      createdAt: Date.now(),
    });

    return true;
  },
});

export const regenerateJoinCode = mutation({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    if (league.adminUserId !== userId) {
      throw new Error("Only admin can regenerate join code");
    }

    // Generate new unique join code
    let joinCode: string;
    let attempts = 0;
    do {
      joinCode = generateJoinCode();
      const existing = await ctx.db
        .query("leagues")
        .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
        .first();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new Error("Failed to generate unique join code");
    }

    await ctx.db.patch(args.leagueId, {
      joinCode,
    });

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "league_created", // Reusing type
      message: "Join code regenerated",
      createdAt: Date.now(),
    });

    return joinCode;
  },
});

export const deleteLeague = mutation({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    if (league.adminUserId !== userId) {
      throw new Error("Only admin can delete league");
    }

    if (league.status !== "setup") {
      throw new Error("Can only delete leagues in setup status");
    }

    // Delete all related data
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const picks = await ctx.db
      .query("draftPicks")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const activities = await ctx.db
      .query("activity")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    // Delete all related records
    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }
    for (const pick of picks) {
      await ctx.db.delete(pick._id);
    }
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    // Delete the league
    await ctx.db.delete(args.leagueId);

    return true;
  },
});

export const addParticipant = mutation({
  args: {
    leagueId: v.id("leagues"),
    userId: v.id("users"),
    displayName: v.string(),
    draftPosition: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    if (league.adminUserId !== currentUserId) {
      throw new Error("Only admin can add participants");
    }

    if (league.status !== "setup") {
      throw new Error("Can only add participants during setup");
    }

    // Check if user is already a participant
    const existingParticipant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", args.userId),
      )
      .first();

    if (existingParticipant) {
      throw new Error("User is already a participant");
    }

    // Check if draft position is taken
    const positionTaken = await ctx.db
      .query("participants")
      .withIndex("by_league_and_position", (q) =>
        q.eq("leagueId", args.leagueId).eq("draftPosition", args.draftPosition),
      )
      .first();

    if (positionTaken) {
      throw new Error("Draft position already taken");
    }

    const participantId = await ctx.db.insert("participants", {
      leagueId: args.leagueId,
      userId: args.userId,
      displayName: args.displayName,
      draftPosition: args.draftPosition,
    });

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "participant_added",
      message: `${args.displayName} added to league (Draft Position ${args.draftPosition})`,
      createdAt: Date.now(),
      participantId,
    });

    return participantId;
  },
});

export const removeParticipant = mutation({
  args: {
    leagueId: v.id("leagues"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.leagueId !== args.leagueId) {
      throw new Error("Participant not found");
    }

    // Allow admin or the participant themselves to remove
    if (
      league.adminUserId !== currentUserId &&
      participant.userId !== currentUserId
    ) {
      throw new Error("Only admin or the participant can remove from league");
    }

    if (league.status !== "setup") {
      throw new Error("Can only remove participants during setup");
    }

    await ctx.db.delete(args.participantId);

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "participant_added", // Reusing type for simplicity
      message: `${participant.displayName} left the league`,
      createdAt: Date.now(),
    });

    return true;
  },
});

export const updateParticipantPosition = mutation({
  args: {
    leagueId: v.id("leagues"),
    participantId: v.id("participants"),
    newDraftPosition: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    if (league.adminUserId !== currentUserId) {
      throw new Error("Only admin can update participant positions");
    }

    if (league.status !== "setup") {
      throw new Error("Can only update positions during setup");
    }

    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.leagueId !== args.leagueId) {
      throw new Error("Participant not found");
    }

    if (args.newDraftPosition < 1 || args.newDraftPosition > 8) {
      throw new Error("Draft position must be between 1 and 8");
    }

    // Check if new position is taken by someone else
    const positionTaken = await ctx.db
      .query("participants")
      .withIndex("by_league_and_position", (q) =>
        q
          .eq("leagueId", args.leagueId)
          .eq("draftPosition", args.newDraftPosition),
      )
      .first();

    if (positionTaken && positionTaken._id !== args.participantId) {
      throw new Error("Draft position already taken");
    }

    const oldPosition = participant.draftPosition;
    await ctx.db.patch(args.participantId, {
      draftPosition: args.newDraftPosition,
    });

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "participant_added", // Reusing type for simplicity
      message: `${participant.displayName} moved from position ${oldPosition} to ${args.newDraftPosition}`,
      createdAt: Date.now(),
      participantId: args.participantId,
    });

    return true;
  },
});

export const reorderParticipants = mutation({
  args: {
    leagueId: v.id("leagues"),
    participantOrders: v.array(
      v.object({
        participantId: v.id("participants"),
        draftPosition: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    if (league.adminUserId !== currentUserId) {
      throw new Error("Only admin can reorder participants");
    }

    if (league.status !== "setup") {
      throw new Error("Can only reorder participants during setup");
    }

    // Validate all participants belong to this league
    for (const order of args.participantOrders) {
      const participant = await ctx.db.get(order.participantId);
      if (!participant || participant.leagueId !== args.leagueId) {
        throw new Error("Invalid participant");
      }
    }

    // Validate positions are 1-8 and unique
    const positions = args.participantOrders.map((o) => o.draftPosition);
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== positions.length) {
      throw new Error("Duplicate draft positions");
    }

    for (const position of positions) {
      if (position < 1 || position > 8) {
        throw new Error("Draft positions must be between 1 and 8");
      }
    }

    // Update all positions
    for (const order of args.participantOrders) {
      await ctx.db.patch(order.participantId, {
        draftPosition: order.draftPosition,
      });
    }

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "participant_added", // Reusing type for simplicity
      message: "Participant draft order updated",
      createdAt: Date.now(),
    });

    return true;
  },
});

export const getParticipants = query({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    return participants.sort((a, b) => a.draftPosition - b.draftPosition);
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const users = await ctx.db.query("users").collect();
    return users.map((user) => ({
      _id: user._id,
      name: user.name || user.email || "Anonymous",
      email: user.email,
    }));
  },
});

export const startDraft = mutation({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    if (league.adminUserId !== userId) {
      throw new Error("Only admin can start draft");
    }

    if (league.status !== "setup") {
      throw new Error("League must be in setup status to start draft");
    }

    // Check that we have exactly 8 participants
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    if (participants.length !== 8) {
      throw new Error("Must have exactly 8 participants to start draft");
    }

    const now = Date.now();
    await ctx.db.patch(args.leagueId, {
      status: "draft",
      currentPickIndex: 0,
      draftStartedAt: now,
      currentPickStartedAt: now,
    });

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "draft_started",
      message: "Draft has started!",
      createdAt: now,
    });

    return true;
  },
});

export const resetDraft = mutation({
  args: { leagueId: v.id("leagues") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");
    const league = await ctx.db.get(args.leagueId);
    if (!league || league.adminUserId !== userId)
      throw new Error("Only admin can reset");
    const picks = await ctx.db
      .query("draftPicks")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();
    for (const pick of picks) await ctx.db.delete(pick._id);
    await ctx.db.patch(args.leagueId, {
      status: "setup",
      currentPickIndex: undefined,
      draftStartedAt: undefined,
      currentPickStartedAt: undefined,
    });
    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "league_created",
      message: "Draft reset by admin",
      createdAt: Date.now(),
    });
    return true;
  },
});

// Migration function to add names to existing leagues
export const migrateLeagueNames = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const leagues = await ctx.db.query("leagues").collect();
    let updated = 0;

    for (const league of leagues) {
      if (!league.name) {
        await ctx.db.patch(league._id, {
          name: `NFL Pool ${league.seasonYear}`,
        });
        updated++;
      }
    }

    return { updated };
  },
});

// Migration function to add join codes to existing leagues
export const migrateJoinCodes = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const leagues = await ctx.db.query("leagues").collect();
    let updated = 0;

    for (const league of leagues) {
      if (!league.joinCode) {
        let joinCode: string;
        let attempts = 0;
        do {
          joinCode = generateJoinCode();
          const existing = await ctx.db
            .query("leagues")
            .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
            .first();
          if (!existing) break;
          attempts++;
        } while (attempts < 10);

        if (attempts < 10) {
          await ctx.db.patch(league._id, {
            joinCode,
          });
          updated++;
        }
      }
    }

    return { updated };
  },
});
