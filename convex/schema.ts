import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Extend the users table with additional fields
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerified: v.optional(v.number()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerified: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    image: v.optional(v.string()),
    isSuperuser: v.optional(v.boolean()), // Add superuser field
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  leagues: defineTable({
    name: v.string(),
    status: v.union(
      v.literal("setup"),
      v.literal("draft"),
      v.literal("live"),
      v.literal("completed"),
    ),
    adminUserId: v.id("users"),
    seasonYear: v.number(),
    joinCode: v.optional(v.string()),
    currentPickIndex: v.optional(v.number()),
    draftStartedAt: v.optional(v.number()),
    currentPickStartedAt: v.optional(v.number()),
    scheduledDraftDate: v.optional(v.number()),
  })
    .index("by_admin", ["adminUserId"])
    .index("by_join_code", ["joinCode"]),

  participants: defineTable({
    leagueId: v.id("leagues"),
    userId: v.id("users"),
    displayName: v.string(),
    draftPosition: v.number(),
  })
    .index("by_league", ["leagueId"])
    .index("by_user", ["userId"])
    .index("by_league_and_user", ["leagueId", "userId"])
    .index("by_league_and_position", ["leagueId", "draftPosition"]),

  nflTeams: defineTable({
    espnId: v.number(),
    abbrev: v.string(),
    name: v.string(),
    fullName: v.string(),
    seasonYear: v.number(),
    logoUrl: v.optional(v.string()),
  })
    .index("by_season", ["seasonYear"])
    .index("by_espn_id", ["espnId"]),

  draftPicks: defineTable({
    leagueId: v.id("leagues"),
    round: v.number(),
    pickNumber: v.number(),
    participantId: v.id("participants"),
    nflTeamId: v.id("nflTeams"),
    pickedAt: v.number(),
  })
    .index("by_league", ["leagueId"])
    .index("by_participant", ["participantId"])
    .index("by_pick_number", ["pickNumber"]),

  games: defineTable({
    week: v.number(),
    seasonYear: v.number(),
    homeTeamId: v.id("nflTeams"),
    awayTeamId: v.id("nflTeams"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("final"),
      v.literal("postponed"),
      v.literal("canceled"),
    ),
    winnerTeamId: v.optional(v.id("nflTeams")),
    tie: v.optional(v.boolean()),
    gameDate: v.number(),
    espnGameId: v.string(),
  })
    .index("by_season_and_week", ["seasonYear", "week"])
    .index("by_team_and_season", ["homeTeamId", "seasonYear"])
    .index("by_away_team_and_season", ["awayTeamId", "seasonYear"])
    .index("by_espn_id", ["espnGameId"]),

  activity: defineTable({
    leagueId: v.id("leagues"),
    type: v.union(
      v.literal("league_created"),
      v.literal("participant_added"),
      v.literal("draft_started"),
      v.literal("draft_pick"),
      v.literal("draft_completed"),
    ),
    message: v.string(),
    createdAt: v.number(),
    participantId: v.optional(v.id("participants")),
    nflTeamId: v.optional(v.id("nflTeams")),
  })
    .index("by_league", ["leagueId"])
    .index("by_league_and_created", ["leagueId", "createdAt"]),

  chatMessages: defineTable({
    leagueId: v.id("leagues"),
    userId: v.id("users"),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_league", ["leagueId"])
    .index("by_league_and_created", ["leagueId", "createdAt"]),

  syncRuns: defineTable({
    ranAt: v.number(),
    type: v.union(
      v.literal("nightly"),
      v.literal("weekly"),
      v.literal("manual"),
    ),
    summary: v.string(),
    week: v.optional(v.number()),
    success: v.boolean(),
    error: v.optional(v.string()),
  })
    .index("by_ran_at", ["ranAt"])
    .index("by_type", ["type"]),

  rateLimits: defineTable({
    key: v.string(), // userId for authenticated users, "anonymous:{joinCode}" for others
    attempts: v.number(),
    windowStart: v.number(),
    expiresAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_expires_at", ["expiresAt"]),

  spectators: defineTable({
    leagueId: v.id("leagues"),
    userId: v.id("users"),
    displayName: v.string(),
    createdAt: v.number(),
  })
    .index("by_league", ["leagueId"])
    .index("by_user", ["userId"])
    .index("by_league_and_user", ["leagueId", "userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
  // Override users table to include our additional fields
});
