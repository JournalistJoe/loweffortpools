import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { JOIN_CODE_LENGTH } from "./constants";
import { api, internal } from "./_generated/api";

// Constants
const MAX_PARTICIPANTS = 8;

// Generate a random join code
function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Rate limiting helper function
async function checkRateLimit(ctx: any, userId: string, operation: string = "autoJoinLeague") {
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  const MAX_ATTEMPTS = 5;
  const now = Date.now();
  
  const key = `${operation}:${userId}`;
  
  // Clean up expired entries
  const expiredEntries = await ctx.db
    .query("rateLimits")
    .withIndex("by_expires_at", (q: any) => q.lt("expiresAt", now))
    .collect();
  
  for (const entry of expiredEntries) {
    await ctx.db.delete(entry._id);
  }
  
  // Get current rate limit entry
  const rateLimitEntry = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .first();
  
  if (!rateLimitEntry) {
    // First attempt - create new entry
    await ctx.db.insert("rateLimits", {
      key,
      attempts: 1,
      windowStart: now,
      expiresAt: now + RATE_LIMIT_WINDOW,
    });
    return;
  }
  
  const windowAge = now - rateLimitEntry.windowStart;
  
  if (windowAge >= RATE_LIMIT_WINDOW) {
    // Reset window
    await ctx.db.patch(rateLimitEntry._id, {
      attempts: 1,
      windowStart: now,
      expiresAt: now + RATE_LIMIT_WINDOW,
    });
    return;
  }
  
  // Check if limit exceeded
  if (rateLimitEntry.attempts >= MAX_ATTEMPTS) {
    throw new Error("Too many attempts, try again later");
  }
  
  // Increment attempts
  await ctx.db.patch(rateLimitEntry._id, {
    attempts: rateLimitEntry.attempts + 1,
  });
}

// Shared helper for joining a participant to a league
async function joinParticipant(
  ctx: any,
  args: {
    leagueId: any,
    userId: string,
    displayName: string,
    activityMessageSuffix?: string,
    returnExistingParticipant?: boolean
  }
): Promise<{ participantId: any, draftPosition: number, wasExisting?: boolean }> {
  // Check if user is already a participant
  const existingParticipant = await ctx.db
    .query("participants")
    .withIndex("by_league_and_user", (q: any) =>
      q.eq("leagueId", args.leagueId).eq("userId", args.userId),
    )
    .first();

  if (existingParticipant) {
    if (args.returnExistingParticipant) {
      return { 
        participantId: existingParticipant._id,
        draftPosition: existingParticipant.draftPosition,
        wasExisting: true
      };
    }
    throw new Error("You are already a participant in this league");
  }

  // Check if league is full
  const participants = await ctx.db
    .query("participants")
    .withIndex("by_league", (q: any) => q.eq("leagueId", args.leagueId))
    .collect();

  if (participants.length >= MAX_PARTICIPANTS) {
    throw new Error("League is full");
  }

  // Find next available draft position
  const takenPositions = new Set(participants.map((p: any) => p.draftPosition));
  let draftPosition = 1;
  while (takenPositions.has(draftPosition) && draftPosition <= MAX_PARTICIPANTS) {
    draftPosition++;
  }

  if (draftPosition > MAX_PARTICIPANTS) {
    throw new Error("No available draft positions");
  }

  // Insert participant
  const participantId = await ctx.db.insert("participants", {
    leagueId: args.leagueId,
    userId: args.userId,
    displayName: args.displayName,
    draftPosition,
  });

  // Create activity log
  const messageSuffix = args.activityMessageSuffix || "";
  await ctx.db.insert("activity", {
    leagueId: args.leagueId,
    type: "participant_added",
    message: `${args.displayName} joined the league${messageSuffix} (Draft Position ${draftPosition})`,
    createdAt: Date.now(),
    participantId,
  });

  return { participantId, draftPosition };
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

    // Get leagues where user is a spectator
    const spectatorRecords = await ctx.db
      .query("spectators")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const spectatorLeagues = await Promise.all(
      spectatorRecords.map(async (spectator) => {
        const league = await ctx.db.get(spectator.leagueId);
        return league ? { ...league, spectator } : null;
      }),
    );

    // Combine and deduplicate leagues
    const allLeagues = new Map();

    adminLeagues.forEach((league) => {
      allLeagues.set(league._id, {
        ...league,
        isAdmin: true,
        isParticipant: false,
        isSpectator: false,
        participant: null,
        spectator: null,
      });
    });

    participantLeagues.forEach((league) => {
      if (league) {
        const existing = allLeagues.get(league._id);
        allLeagues.set(league._id, {
          ...league,
          isAdmin: existing?.isAdmin || league.adminUserId === userId,
          isParticipant: true,
          isSpectator: existing?.isSpectator || false,
          participant: league.participant,
          spectator: existing?.spectator || null,
        });
      }
    });

    spectatorLeagues.forEach((league) => {
      if (league) {
        const existing = allLeagues.get(league._id);
        allLeagues.set(league._id, {
          ...league,
          isAdmin: existing?.isAdmin || league.adminUserId === userId,
          isParticipant: existing?.isParticipant || false,
          isSpectator: true,
          participant: existing?.participant || null,
          spectator: league.spectator,
        });
      }
    });

    return Array.from(allLeagues.values()).sort(
      (a, b) => b._creationTime - a._creationTime,
    );
  },
});

// Internal query for accessing league data without auth (used by background actions)
export const getLeagueInternal = query({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const league = await ctx.db.get(args.leagueId);
    return league;
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

    const spectator = await ctx.db
      .query("spectators")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    return {
      ...league,
      isAdmin: league.adminUserId === userId,
      isParticipant: !!participant,
      isSpectator: !!spectator,
      participant,
      spectator,
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
      canJoin: participants.length < MAX_PARTICIPANTS && league.status === "setup",
    };
  },
});

export const createLeague = mutation({
  args: {
    name: v.string(),
    seasonYear: v.number(),
    scheduledDraftDate: v.optional(v.number()),
    teamName: v.optional(v.string()),
    draftPickTimeLimit: v.optional(v.number()),
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

    // Validate scheduledDraftDate if provided
    if (args.scheduledDraftDate !== undefined) {
      if (!Number.isFinite(args.scheduledDraftDate)) {
        throw new Error("Invalid scheduled draft date");
      }
      if (args.scheduledDraftDate < Date.now()) {
        throw new Error("Scheduled draft date must be in the future");
      }
    }

    // Validate draftPickTimeLimit if provided
    if (args.draftPickTimeLimit !== undefined) {
      if (!Number.isFinite(args.draftPickTimeLimit) || args.draftPickTimeLimit < 30000 || args.draftPickTimeLimit > 600000) {
        throw new Error("Draft pick time limit must be between 30 seconds and 10 minutes");
      }
    }

    const leagueId = await ctx.db.insert("leagues", {
      name: args.name,
      status: "setup",
      adminUserId: userId,
      seasonYear: args.seasonYear,
      joinCode,
      scheduledDraftDate: args.scheduledDraftDate,
      draftPickTimeLimit: args.draftPickTimeLimit || 180000, // Default to 3 minutes
    });

    // Get the user info to create display name
    const user = await ctx.db.get(userId);

    // Build display name with proper normalization and limits
    const candidates = [args.teamName, user?.name, user?.email, "Admin"];
    const firstNonEmpty = candidates.find(
      (val) => typeof val === "string" && val.trim().length > 0
    ) as string;
    const normalizedName = firstNonEmpty
      .trim()
      .replace(/\s+/g, " ") // Collapse multiple whitespace to single space
      .normalize("NFKC");   // Unicode normalize to reduce confusables

    // Safely truncate to 50 code points
    const MAX_DISPLAY_NAME_LENGTH = 50;
    const codepoints = Array.from(normalizedName);
    const truncatedName = codepoints.slice(0, MAX_DISPLAY_NAME_LENGTH).join("");

    // Final safety check to ensure non-empty
    const displayName = truncatedName || "Admin";

    // Auto-add the league creator as a participant with draft position 1
    await ctx.db.insert("participants", {
      leagueId,
      userId,
      displayName: displayName,
      draftPosition: 1,
    });

    await ctx.db.insert("activity", {
      leagueId,
      type: "league_created",
      message: `League "${args.name}" created for ${args.seasonYear} season`,
      createdAt: Date.now(),
    });

    await ctx.db.insert("activity", {
      leagueId,
      type: "participant_added",
      message: `${displayName} joined the league (Draft Position 1)`,
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

    // Use helper to join participant
    const { participantId } = await joinParticipant(ctx, {
      leagueId: league._id,
      userId,
      displayName: args.displayName.trim(),
    });

    return { leagueId: league._id, participantId };
  },
});

export const adminJoinOwnLeague = mutation({
  args: {
    leagueId: v.id("leagues"),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    if (!args.displayName.trim()) {
      throw new Error("Display name is required");
    }

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    // Verify user is the admin of this league
    if (league.adminUserId !== userId) {
      throw new Error("Only the league admin can use this feature");
    }

    if (league.status !== "setup") {
      throw new Error("Cannot join league - draft has already started");
    }

    // Use helper to join participant
    const { participantId, draftPosition } = await joinParticipant(ctx, {
      leagueId: args.leagueId,
      userId,
      displayName: args.displayName.trim(),
      activityMessageSuffix: " as admin",
    });

    return { participantId, draftPosition };
  },
});

export const updateLeague = mutation({
  args: {
    leagueId: v.id("leagues"),
    name: v.string(),
    scheduledDraftDate: v.optional(v.number()),
    draftPickTimeLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    if (league.adminUserId !== userId) {
      throw new Error("Only admin can update league");
    }

    // Validate scheduledDraftDate if provided
    if (args.scheduledDraftDate !== undefined) {
      if (!Number.isFinite(args.scheduledDraftDate)) {
        throw new Error("Invalid scheduled draft date");
      }
      if (args.scheduledDraftDate < Date.now()) {
        throw new Error("Scheduled draft date must be in the future");
      }
    }

    // Validate draftPickTimeLimit if provided
    if (args.draftPickTimeLimit !== undefined) {
      if (!Number.isFinite(args.draftPickTimeLimit) || args.draftPickTimeLimit < 30000 || args.draftPickTimeLimit > 600000) {
        throw new Error("Draft pick time limit must be between 30 seconds and 10 minutes");
      }
    }

    await ctx.db.patch(args.leagueId, {
      name: args.name,
      scheduledDraftDate: args.scheduledDraftDate,
      draftPickTimeLimit: args.draftPickTimeLimit,
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

export const updateParticipantDisplayName = mutation({
  args: {
    leagueId: v.id("leagues"),
    participantId: v.id("participants"),
    newDisplayName: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Must be logged in");

    if (!args.newDisplayName.trim()) {
      throw new Error("Display name cannot be empty");
    }

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.leagueId !== args.leagueId) {
      throw new Error("Participant not found");
    }

    // Allow admin or the participant themselves to update display name
    if (
      league.adminUserId !== currentUserId &&
      participant.userId !== currentUserId
    ) {
      throw new Error("Only admin or the participant can update display name");
    }

    if (league.status !== "setup") {
      throw new Error("Can only update display name during setup");
    }

    const oldDisplayName = participant.displayName;
    await ctx.db.patch(args.participantId, {
      displayName: args.newDisplayName.trim(),
    });

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "participant_added", // Reusing type for simplicity
      message: `${oldDisplayName} changed team name to ${args.newDisplayName.trim()}`,
      createdAt: Date.now(),
      participantId: args.participantId,
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

    if (args.newDraftPosition < 1 || args.newDraftPosition > MAX_PARTICIPANTS) {
      throw new Error(`Draft position must be between 1 and ${MAX_PARTICIPANTS}`);
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

    // Validate positions are 1-MAX_PARTICIPANTS and unique
    const positions = args.participantOrders.map((o) => o.draftPosition);
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== positions.length) {
      throw new Error("Duplicate draft positions");
    }

    for (const position of positions) {
      if (position < 1 || position > MAX_PARTICIPANTS) {
        throw new Error(`Draft positions must be between 1 and ${MAX_PARTICIPANTS}`);
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

export const randomizeParticipantOrder = mutation({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Must be logged in");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    if (league.adminUserId !== currentUserId) {
      throw new Error("Only admin can randomize participant order");
    }

    if (league.status !== "setup") {
      throw new Error("Can only randomize order during setup");
    }

    // Get all participants for this league
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    if (participants.length === 0) {
      throw new Error("No participants to randomize");
    }

    // Create array of positions and shuffle them
    const positions = Array.from({ length: participants.length }, (_, i) => i + 1);
    
    // Fisher-Yates shuffle algorithm
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Update all participants with new randomized positions
    for (let i = 0; i < participants.length; i++) {
      await ctx.db.patch(participants[i]._id, {
        draftPosition: positions[i],
      });
    }

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "participant_added", // Reusing type for simplicity
      message: "Draft order has been randomized",
      createdAt: Date.now(),
    });

    return true;
  },
});

// Internal query for accessing participants without auth (used by background actions)
export const getParticipantsInternal = query({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    return participants.sort((a, b) => a.draftPosition - b.draftPosition);
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

    // Check that we have exactly the required number of participants
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    if (participants.length !== MAX_PARTICIPANTS) {
      throw new Error(`Must have exactly ${MAX_PARTICIPANTS} participants to start draft`);
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

    // Send push notifications for draft start
    await ctx.scheduler.runAfter(0, api.notificationActions.notifyLeagueActivity, {
      leagueId: args.leagueId,
      activityType: "draft_started",
      message: "Draft has started!",
      excludeUserId: userId,
    });

    // Schedule first auto-pick
    await ctx.scheduler.runAfter(0, internal.draft.scheduleNextAutoPick, {
      leagueId: args.leagueId,
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
      scheduledAutopickId: undefined,
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

// Auto-join league with default team name after authentication
export const autoJoinLeague = mutation({
  args: {
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Apply rate limiting
    await checkRateLimit(ctx, userId);

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

    // Get current participants count to generate display name
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q: any) => q.eq("leagueId", league._id))
      .collect();

    // Generate default team name using team number
    const teamNumber = participants.length + 1;
    const defaultDisplayName = `Team ${teamNumber}`;

    // Use helper to join participant (handles existing participant case)
    const { participantId, wasExisting } = await joinParticipant(ctx, {
      leagueId: league._id,
      userId,
      displayName: defaultDisplayName,
      returnExistingParticipant: true,
    });

    if (wasExisting) {
      return { 
        success: true, 
        alreadyJoined: true, 
        leagueId: league._id, 
        participantId 
      };
    }

    return { 
      success: true, 
      alreadyJoined: false, 
      leagueId: league._id, 
      participantId,
      displayName: defaultDisplayName 
    };
  },
});
