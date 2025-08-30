import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
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
    // Get league details
    const league = await ctx.runQuery(api.leagues.getLeague, { leagueId: args.leagueId });
    if (!league) return;

    // Get all participants and spectators in the league
    const participants = await ctx.runQuery(api.leagues.getParticipants, { leagueId: args.leagueId });
    const spectators = await ctx.runQuery(api.spectators.getSpectators, { leagueId: args.leagueId });

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

    // Determine notification priority and settings
    const isHighPriority = ["draft_started", "draft_pick", "draft_autopick"].includes(args.activityType);
    const isMyTurn = args.activityType === "draft_started" || args.activityType === "draft_pick";

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

        // Check if this type of notification is enabled
        if (preferences.enableImportantOnly && !isHighPriority) {
          continue;
        }

        if (!preferences.enableDraftPicks && 
            ["draft_pick", "draft_autopick", "draft_completed"].includes(args.activityType)) {
          continue;
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

        // Check if it's the user's turn (for participants only)
        let isCurrentUserTurn = false;
        if (user.isParticipant && args.activityType === "draft_pick" && league.status === "draft") {
          const draftState = await ctx.runQuery(api.draft.getDraftState, {
            leagueId: args.leagueId,
          });
          isCurrentUserTurn = draftState?.currentParticipant?.userId === user.userId;
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
            url: `/leagues/${args.leagueId}`,
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
    // Get league details
    const league = await ctx.runQuery(api.leagues.getLeague, { leagueId: args.leagueId });
    if (!league) return;

    // Get all participants and spectators except the sender
    const participants = await ctx.runQuery(api.leagues.getParticipants, { leagueId: args.leagueId });
    const spectators = await ctx.runQuery(api.spectators.getSpectators, { leagueId: args.leagueId });

    const allUsers = [
      ...participants.map((p: any) => p.userId),
      ...spectators.map((s: any) => s.userId),
    ].filter((userId, index, self) => 
      self.indexOf(userId) === index && userId !== args.senderUserId
    );

    // Send notifications to each user
    for (const userId of allUsers) {
      try {
        // Check user's notification preferences
        const preferences = await ctx.runQuery(api.pushNotifications.getUserNotificationPreferences, {
          userId: userId,
          leagueId: args.leagueId,
        });

        // Default to allowing notifications if no preferences found
        if (!preferences) {
          preferences = { enableChatMessages: true };
        }

        // Skip if chat notifications are disabled
        if (!preferences.enableChatMessages) continue;

        // Skip if user has notifications muted
        if (preferences.mutedUntil && Date.now() < preferences.mutedUntil) {
          continue;
        }

        // Skip if user only wants important notifications
        if (preferences.enableImportantOnly) continue;

        // Truncate long messages
        const truncatedMessage = args.message.length > 100 
          ? args.message.substring(0, 97) + "..."
          : args.message;

        // Send the push notification
        await ctx.runAction(api.pushNotifications.sendPushNotification, {
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
            url: `/leagues/${args.leagueId}`,
          },
          actions: [
            { action: "reply", title: "Reply", icon: "/icon-192x192.png" },
            { action: "view-chat", title: "View Chat", icon: "/icon-192x192.png" }
          ],
        });

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