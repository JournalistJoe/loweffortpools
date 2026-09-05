import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Notify about league activity
export const notifyLeagueActivity = action({
  args: {
    leagueId: v.id("leagues"),
    activityType: v.union(
      v.literal("league_created"),
      v.literal("participant_added"),
      v.literal("spectator_joined"),
      v.literal("spectator_left"),
      v.literal("draft_started"),
      v.literal("draft_pick"),
      v.literal("draft_autopick"),
      v.literal("draft_completed"),
    ),
    message: v.string(),
    participantId: v.optional(v.id("participants")),
    nflTeamId: v.optional(v.id("nflTeams")),
    excludeUserId: v.optional(v.id("users")), // Don't notify the user who triggered the action
  },
  handler: async (ctx, args) => {
    // This runs from the scheduler with no signed-in user, so it must use the
    // internal query variants; the public ones return null/[] without auth.
    const league = await ctx.runQuery(api.leagues.getLeagueInternal, { leagueId: args.leagueId });
    if (!league) return;

    const participants = await ctx.runQuery(api.leagues.getParticipantsInternal, { leagueId: args.leagueId });
    const spectators = await ctx.runQuery(api.spectators.getSpectatorsInternal, { leagueId: args.leagueId });

    // Combine all users who should be notified
    const allUsers = [
      ...participants.map((p: any) => ({ userId: p.userId, isParticipant: true })),
      ...spectators.map((s: any) => ({ userId: s.userId, isParticipant: false })),
    ];

    // Remove duplicates and excluded user
    const uniqueUsers = allUsers.filter((user, index, self) => 
      self.findIndex(u => u.userId === user.userId) === index &&
      user.userId !== args.excludeUserId
    );

    // Work out whose turn it is once, so per-user gating can treat "your turn" specially.
    const currentTurnUserId =
      args.activityType === "draft_pick" || args.activityType === "draft_autopick"
        ? (await ctx.runQuery(api.draft.getDraftState, { leagueId: args.leagueId }))
            ?.currentParticipant?.userId ?? null
        : null;

    // Where a tap on the notification should land.
    const leagueUrl =
      league.status === "live" || league.status === "completed"
        ? `/league/${args.leagueId}/leaderboard`
        : `/league/${args.leagueId}/draft`;

    // Get NFL team info if available
    let nflTeam = null;
    if (args.nflTeamId) {
      try {
        nflTeam = await ctx.runQuery(api.nflData.getNflTeamById, {
          teamId: args.nflTeamId,
        });
      } catch (error) {
        console.error(`Failed to fetch NFL team data for teamId: ${args.nflTeamId}:`, error);
        nflTeam = null; // Will use fallback below
      }
      
      // Use fallback if team not found
      if (!nflTeam) {
        nflTeam = { logoUrl: "/icon-192x192.png" };
      }
    }

    // Send notifications to each user
    for (const user of uniqueUsers) {
      try {
        // Check user's notification preferences
        const preferences = await ctx.runQuery(api.pushNotifications.getUserNotificationPreferences, {
          userId: user.userId,
          leagueId: args.leagueId,
        });

        // Skip if preferences not found or user has notifications muted
        if (!preferences || (preferences.mutedUntil && Date.now() < preferences.mutedUntil)) {
          continue;
        }

        const isCurrentUserTurn = user.isParticipant && currentTurnUserId === user.userId;

        // "Your turn" has its own toggle and counts as important; other draft
        // picks follow the draft-picks toggle and are filtered by important-only.
        if (isCurrentUserTurn) {
          if (!preferences.enableMyTurn) continue;
        } else {
          const isImportant = ["draft_started", "draft_completed"].includes(args.activityType);
          if (preferences.enableImportantOnly && !isImportant) continue;
          if (
            !preferences.enableDraftPicks &&
            ["draft_pick", "draft_autopick", "draft_completed"].includes(args.activityType)
          ) {
            continue;
          }
        }

        // Create notification content
        let title = `${league.name}`;
        let body = args.message;
        let icon = "/icon-192x192.png";
        let actions: any[] = [];

        // Customize notification based on activity type
        switch (args.activityType) {
          case "draft_started":
            title = "🏈 Draft Started!";
            body = `${league.name} draft has begun`;
            actions = [
              { action: "view-draft", title: "View Draft", icon: "/icon-192x192.png" }
            ];
            break;

          case "draft_pick":
          case "draft_autopick":
            if (nflTeam) {
              title = "🏈 New Draft Pick";
              body = args.message;
              icon = nflTeam.logoUrl || "/icon-192x192.png";
            }
            actions = [
              { action: "view-draft", title: "View Draft", icon: "/icon-192x192.png" }
            ];
            break;

          case "draft_completed":
            title = "🏆 Draft Complete!";
            body = `${league.name} draft is finished`;
            actions = [
              { action: "view-league", title: "View Results", icon: "/icon-192x192.png" }
            ];
            break;

          case "participant_added":
            title = "👥 New Player";
            body = args.message;
            break;

          default:
            title = league.name;
            body = args.message;
        }

        if (isCurrentUserTurn) {
          title = "🔥 Your Turn!";
          body = `It's your turn to pick in ${league.name}`;
          actions = [
            { action: "make-pick", title: "Make Pick", icon: "/icon-192x192.png" }
          ];
        }

        // Send the push notification
        await ctx.runAction(api.pushNotifications.sendPushNotification, {
          userId: user.userId,
          title,
          body,
          icon,
          badge: "/icon-192x192.png",
          tag: `league-${args.leagueId}-${args.activityType}`,
          data: {
            type: "league_activity",
            leagueId: args.leagueId,
            activityType: args.activityType,
            url: leagueUrl,
          },
          actions,
        });

      } catch (error) {
        console.error(`Failed to send notification to user ${user.userId}:`, error);
      }
    }
  },
});

// Notify about new chat message
export const notifyChatMessage = action({
  args: {
    leagueId: v.id("leagues"),
    messageId: v.id("chatMessages"),
    senderUserId: v.id("users"),
    message: v.string(),
    senderDisplayName: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🚀 Starting notifyChatMessage for league ${args.leagueId}, sender ${args.senderUserId}`);
    
    // Get league details (using internal query for background actions)
    const league = await ctx.runQuery(api.leagues.getLeagueInternal, { leagueId: args.leagueId });
    if (!league) {
      console.log(`❌ League ${args.leagueId} not found, exiting early`);
      return;
    }
    
    console.log(`✅ League found: ${league.name}`);

    // Get all participants and spectators except the sender (using internal queries for background actions)
    const participants = await ctx.runQuery(api.leagues.getParticipantsInternal, { leagueId: args.leagueId });
    const spectators = await ctx.runQuery(api.spectators.getSpectatorsInternal, { leagueId: args.leagueId });

    console.log(`👥 Found ${participants.length} participants and ${spectators.length} spectators`);

    const allUsers = [
      ...participants.map((p: any) => p.userId),
      ...spectators.map((s: any) => s.userId),
    ].filter((userId, index, self) => 
      self.indexOf(userId) === index && userId !== args.senderUserId
    );
    
    console.log(`📋 Processing notifications for ${allUsers.length} users (excluding sender)`);
    
    if (allUsers.length === 0) {
      console.log(`🔔 No users to notify, exiting early`);
      return;
    }

    // Send notifications to each user
    for (const userId of allUsers) {
      try {
        console.log(`Processing chat notification for user ${userId} in league ${args.leagueId}`);
        
        // Check user's notification preferences
        const preferences = await ctx.runQuery(api.pushNotifications.getUserNotificationPreferences, {
          userId: userId,
          leagueId: args.leagueId,
        });

        console.log(`User ${userId} preferences:`, preferences);
        
        if (preferences.isUsingGlobalDefaults) {
          console.log(`User ${userId} is using global defaults for league ${args.leagueId}`);
        }

        // Skip if chat notifications are disabled
        if (!preferences.enableChatMessages) {
          console.log(`Skipping user ${userId}: chat notifications disabled`);
          continue;
        }

        // Skip if user has notifications muted
        if (preferences.mutedUntil && Date.now() < preferences.mutedUntil) {
          console.log(`Skipping user ${userId}: notifications muted until ${new Date(preferences.mutedUntil).toISOString()}`);
          continue;
        }

        // Skip if user only wants important notifications
        if (preferences.enableImportantOnly) {
          console.log(`Skipping user ${userId}: important only mode enabled`);
          continue;
        }

        // Truncate long messages
        const truncatedMessage = args.message.length > 100 
          ? args.message.substring(0, 97) + "..."
          : args.message;

        console.log(`Sending push notification to user ${userId}`);
        
        // Send the push notification
        const result = await ctx.runAction(api.pushNotifications.sendPushNotification, {
          userId,
          title: `💬 ${args.senderDisplayName}`,
          body: truncatedMessage,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: `chat-${args.leagueId}`,
          data: {
            type: "chat_message",
            leagueId: args.leagueId,
            messageId: args.messageId,
            url:
              league.status === "live" || league.status === "completed"
                ? `/league/${args.leagueId}/leaderboard`
                : `/league/${args.leagueId}/draft`,
          },
          actions: [
            { action: "reply", title: "Reply", icon: "/icon-192x192.png" },
            { action: "view-chat", title: "View Chat", icon: "/icon-192x192.png" }
          ],
        });
        
        console.log(`Push notification result for user ${userId}:`, result);

      } catch (error) {
        console.error(`Failed to send chat notification to user ${userId}:`, error);
      }
    }
  },
});

// Test notification (for development/debugging)
export const sendTestNotification = action({
  args: {
    userId: v.id("users"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    console.log(`Sending test notification to user ${args.userId}`);
    
    const result = await ctx.runAction(api.pushNotifications.sendPushNotification, {
      userId: args.userId,
      title: args.title || "🧪 Test Notification",
      body: args.body || "This is a test notification from LowEffort.bet!",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "test",
      data: {
        type: "test",
        timestamp: Date.now(),
        url: "/",
      },
      actions: [
        { action: "dismiss", title: "Dismiss", icon: "/icon-192x192.png" }
      ],
    });
    
    console.log(`Test notification result:`, result);
    return result;
  },
});