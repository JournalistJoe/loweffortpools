import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const joinAsSpectator = mutation({
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

    if (league.status !== "setup" && league.status !== "draft" && league.status !== "live") {
      throw new Error("Cannot join league as spectator");
    }

    // Check if user is already a spectator
    const existingSpectator = await ctx.db
      .query("spectators")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", league._id).eq("userId", userId),
      )
      .first();

    if (existingSpectator) {
      throw new Error("You are already a spectator in this league");
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

    // Insert spectator
    const spectatorId = await ctx.db.insert("spectators", {
      leagueId: league._id,
      userId,
      displayName: args.displayName.trim(),
      createdAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activity", {
      leagueId: league._id,
      type: "spectator_joined",
      message: `${args.displayName.trim()} joined as spectator`,
      createdAt: Date.now(),
    });

    return { leagueId: league._id, spectatorId };
  },
});

export const leaveAsSpectator = mutation({
  args: {
    leagueId: v.id("leagues"),
    targetUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const actingUserId = await getAuthUserId(ctx);
    if (!actingUserId) throw new Error("Must be logged in");

    // Determine target user ID (self-removal if not specified)
    const targetUserId = args.targetUserId || actingUserId;

    // If trying to remove someone else, check admin privileges
    if (targetUserId !== actingUserId) {
      const league = await ctx.db.get(args.leagueId);
      if (!league) throw new Error("League not found");
      
      if (league.adminUserId !== actingUserId) {
        throw new Error("Only admins can remove other spectators");
      }
    }

    // Find the spectator record
    const spectator = await ctx.db
      .query("spectators")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", targetUserId),
      )
      .first();

    if (!spectator) {
      throw new Error("Spectator not found in this league");
    }

    await ctx.db.delete(spectator._id);

    // Create activity log with clear message
    const message = targetUserId === actingUserId 
      ? `${spectator.displayName} left as spectator`
      : `${spectator.displayName} was removed as spectator by admin`;

    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "spectator_left",
      message,
      createdAt: Date.now(),
    });

    return true;
  },
});

export const removeSpectator = mutation({
  args: {
    leagueId: v.id("leagues"),
    spectatorId: v.id("spectators"),
  },
  handler: async (ctx, args) => {
    const actingUserId = await getAuthUserId(ctx);
    if (!actingUserId) throw new Error("Must be logged in");

    // Verify league exists and user is admin
    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");
    
    if (league.adminUserId !== actingUserId) {
      throw new Error("Only league admins can remove spectators");
    }

    // Verify spectator exists and belongs to this league
    const spectator = await ctx.db.get(args.spectatorId);
    if (!spectator) throw new Error("Spectator not found");
    
    if (spectator.leagueId !== args.leagueId) {
      throw new Error("Spectator does not belong to this league");
    }

    // Delete the spectator
    await ctx.db.delete(args.spectatorId);

    // Create activity log
    await ctx.db.insert("activity", {
      leagueId: args.leagueId,
      type: "spectator_left",
      message: `${spectator.displayName} was removed as spectator by admin`,
      createdAt: Date.now(),
    });

    return true;
  },
});

export const getSpectators = query({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const spectators = await ctx.db
      .query("spectators")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    return spectators.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const getLeagueUsers = query({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Get participants
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    // Get spectators
    const spectators = await ctx.db
      .query("spectators")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    return {
      participants: participants.sort((a, b) => a.draftPosition - b.draftPosition),
      spectators: spectators.sort((a, b) => a.createdAt - b.createdAt),
    };
  },
});

export const isUserSpectator = query({
  args: {
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const spectator = await ctx.db
      .query("spectators")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    return !!spectator;
  },
});