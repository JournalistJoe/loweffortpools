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
    draftPickTimeLimit: v.optional(v.number()), // Time limit in milliseconds, defaults to 180000 (3 minutes)
    scheduledAutopickId: v.optional(v.id("_scheduled_functions")), // ID of scheduled function for auto-pick cancellation
  })
    .index("by_admin", ["adminUserId"])
    .index("by_join_code", ["joinCode"])
    .index("by_status", ["status"]),

  participants: defineTable({
    leagueId: v.id("leagues"),
    userId: v.id("users"),
    displayName: v.string(),
    draftPosition: v.number(),
    isAutoDrafting: v.optional(v.boolean()),
    autoDraftReason: v.optional(v.string()),
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

  draftPreferences: defineTable({
    participantId: v.id("participants"),
    leagueId: v.id("leagues"),
    rankings: v.array(v.id("nflTeams")),
    enableAutoDraft: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_participant", ["participantId"])
    .index("by_league_and_participant", ["leagueId", "participantId"]),

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
      v.literal("spectator_joined"),
      v.literal("spectator_left"),
      v.literal("draft_started"),
      v.literal("draft_pick"),
      v.literal("draft_autopick"),
      v.literal("draft_preference_autopick"),
      v.literal("draft_completed"),
      v.literal("draft_preferences_set"),
      v.literal("participant_autodraft_enabled"),
      v.literal("participant_autodraft_disabled"),
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

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dhKey: v.string(), // Public key for encryption
    authKey: v.string(),   // Authentication secret
    createdAt: v.number(),
    updatedAt: v.number(),
    userAgent: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"])
    .index("by_user_and_active", ["userId", "isActive"])
    .index("by_user_and_endpoint", ["userId", "endpoint"]),

  notificationPreferences: defineTable({
    userId: v.id("users"),
    leagueId: v.optional(v.id("leagues")), // null for global preferences
    enableChatMessages: v.boolean(),
    enableDraftPicks: v.boolean(),
    enableMyTurn: v.boolean(),
    enableImportantOnly: v.boolean(),
    mutedUntil: v.optional(v.number()), // Unix timestamp when mute expires
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_league", ["leagueId"])
    .index("by_user_and_league", ["userId", "leagueId"]),

  // Push notification delivery tracking
  notificationDeliveries: defineTable({
    userId: v.id("users"),
    subscriptionId: v.id("pushSubscriptions"),
    title: v.string(),
    body: v.string(),
    type: v.string(), // "test", "chat_message", "draft_pick", etc.
    status: v.union(v.literal("sent"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
    leagueId: v.optional(v.id("leagues")),
    sentAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_league", ["leagueId"])
    .index("by_user_and_sent_at", ["userId", "sentAt"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
  // Override users table to include our additional fields
});
