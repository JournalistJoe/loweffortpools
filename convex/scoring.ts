import { v } from "convex/values";
import { query } from "./_generated/server";

export const getLeaderboard = query({
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

    const games = await ctx.db
      .query("games")
      .withIndex("by_season_and_week", (q) =>
        q.eq("seasonYear", league.seasonYear),
      )
      .filter((q) => q.eq(q.field("status"), "final"))
      .collect();

    // Calculate scores for each participant
    const leaderboard = await Promise.all(
      participants.map(async (participant) => {
        const participantPicks = picks.filter(
          (p) => p.participantId === participant._id,
        );
        const teams = await Promise.all(
          participantPicks.map((pick) => ctx.db.get(pick.nflTeamId)),
        );

        let totalWins = 0;
        const teamRecords = await Promise.all(
          teams.map(async (team) => {
            if (!team) return { team: null, wins: 0, losses: 0, ties: 0 };

            let wins = 0;
            let losses = 0;
            let ties = 0;

            for (const game of games) {
              if (
                game.homeTeamId === team._id ||
                game.awayTeamId === team._id
              ) {
                if (game.tie) {
                  ties++;
                  totalWins += 0.5;
                } else if (game.winnerTeamId === team._id) {
                  wins++;
                  totalWins += 1;
                } else {
                  losses++;
                }
              }
            }

            return { team, wins, losses, ties };
          }),
        );

        return {
          participant,
          totalWins,
          teamRecords: teamRecords.filter((record) => record.team !== null),
        };
      }),
    );

    // Sort by total wins (descending)
    leaderboard.sort((a, b) => b.totalWins - a.totalWins);

    return leaderboard;
  },
});

export const getParticipantTeams = query({
  args: {
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.participantId);
    if (!participant) return null;

    const league = await ctx.db.get(participant.leagueId);
    if (!league) return null;

    const picks = await ctx.db
      .query("draftPicks")
      .withIndex("by_participant", (q) =>
        q.eq("participantId", args.participantId),
      )
      .collect();

    const teams = await Promise.all(
      picks.map(async (pick) => {
        const team = await ctx.db.get(pick.nflTeamId);
        if (!team) return null;

        // Get team's games
        const homeGames = await ctx.db
          .query("games")
          .withIndex("by_team_and_season", (q) =>
            q.eq("homeTeamId", team._id).eq("seasonYear", league.seasonYear),
          )
          .collect();

        const awayGames = await ctx.db
          .query("games")
          .withIndex("by_away_team_and_season", (q) =>
            q.eq("awayTeamId", team._id).eq("seasonYear", league.seasonYear),
          )
          .collect();

        // Enrich games with opponent team data
        const enrichedGames = await Promise.all(
          [...homeGames, ...awayGames].map(async (game) => {
            const isHome = game.homeTeamId === team._id;
            const opponentTeamId = isHome ? game.awayTeamId : game.homeTeamId;
            const opponentTeam = await ctx.db.get(opponentTeamId);
            return {
              ...game,
              isHome,
              opponentTeam,
            };
          }),
        );

        const allGames = enrichedGames.sort((a, b) => a.week - b.week);

        // Calculate record
        let wins = 0;
        let losses = 0;
        let ties = 0;

        for (const game of allGames) {
          if (game.status === "final") {
            if (game.tie) {
              ties++;
            } else if (game.winnerTeamId === team._id) {
              wins++;
            } else {
              losses++;
            }
          }
        }

        return {
          team,
          pick,
          wins,
          losses,
          ties,
          games: allGames,
        };
      }),
    );

    return {
      participant,
      teams: teams.filter((t) => t !== null),
    };
  },
});

export const getLeagueSchedule = query({
  args: {
    leagueId: v.id("leagues"),
    week: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const league = await ctx.db.get(args.leagueId);
    if (!league) return null;

    // Get all participants and their picks
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const picks = await ctx.db
      .query("draftPicks")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    // Get all team IDs that were drafted
    const draftedTeamIds = picks.map((pick) => pick.nflTeamId);

    // Get games for the specified week (or current week if not specified)
    const currentWeek = args.week || getCurrentNFLWeek();
    const weekGames = await ctx.db
      .query("games")
      .withIndex("by_season_and_week", (q) =>
        q.eq("seasonYear", league.seasonYear).eq("week", currentWeek),
      )
      .collect();

    // Filter games to only include drafted teams
    const relevantGames = weekGames.filter(
      (game) =>
        draftedTeamIds.includes(game.homeTeamId) ||
        draftedTeamIds.includes(game.awayTeamId),
    );

    // Enrich games with team and participant data
    const enrichedGames = await Promise.all(
      relevantGames.map(async (game) => {
        const homeTeam = await ctx.db.get(game.homeTeamId);
        const awayTeam = await ctx.db.get(game.awayTeamId);

        // Find which participants own these teams
        const homeTeamPick = picks.find(
          (pick) => pick.nflTeamId === game.homeTeamId,
        );
        const awayTeamPick = picks.find(
          (pick) => pick.nflTeamId === game.awayTeamId,
        );

        const homeParticipant = homeTeamPick
          ? participants.find((p) => p._id === homeTeamPick.participantId)
          : null;
        const awayParticipant = awayTeamPick
          ? participants.find((p) => p._id === awayTeamPick.participantId)
          : null;

        return {
          ...game,
          homeTeam,
          awayTeam,
          homeParticipant,
          awayParticipant,
          isParticipantMatchup: !!(homeParticipant && awayParticipant),
        };
      }),
    );

    // Sort games by date
    enrichedGames.sort((a, b) => a.gameDate - b.gameDate);

    return {
      league,
      week: currentWeek,
      games: enrichedGames,
      participantMatchups: enrichedGames.filter(
        (game) => game.isParticipantMatchup,
      ),
    };
  },
});

export const getUpcomingGames = query({
  args: {
    leagueId: v.id("leagues"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const league = await ctx.db.get(args.leagueId);
    if (!league) return null;

    const limit = args.limit || 10;

    // Get all participants and their picks
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const picks = await ctx.db
      .query("draftPicks")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    // Get all team IDs that were drafted
    const draftedTeamIds = picks.map((pick) => pick.nflTeamId);

    // Get upcoming games (scheduled or in_progress)
    const upcomingGames = await ctx.db
      .query("games")
      .withIndex("by_season_and_week", (q) =>
        q.eq("seasonYear", league.seasonYear),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "scheduled"),
          q.eq(q.field("status"), "in_progress"),
        ),
      )
      .collect();

    // Filter games to only include drafted teams and sort by date
    const relevantGames = upcomingGames
      .filter(
        (game) =>
          draftedTeamIds.includes(game.homeTeamId) ||
          draftedTeamIds.includes(game.awayTeamId),
      )
      .sort((a, b) => a.gameDate - b.gameDate)
      .slice(0, limit);

    // Enrich games with team and participant data
    const enrichedGames = await Promise.all(
      relevantGames.map(async (game) => {
        const homeTeam = await ctx.db.get(game.homeTeamId);
        const awayTeam = await ctx.db.get(game.awayTeamId);

        // Find which participants own these teams
        const homeTeamPick = picks.find(
          (pick) => pick.nflTeamId === game.homeTeamId,
        );
        const awayTeamPick = picks.find(
          (pick) => pick.nflTeamId === game.awayTeamId,
        );

        const homeParticipant = homeTeamPick
          ? participants.find((p) => p._id === homeTeamPick.participantId)
          : null;
        const awayParticipant = awayTeamPick
          ? participants.find((p) => p._id === awayTeamPick.participantId)
          : null;

        return {
          ...game,
          homeTeam,
          awayTeam,
          homeParticipant,
          awayParticipant,
          isParticipantMatchup: !!(homeParticipant && awayParticipant),
        };
      }),
    );

    return {
      league,
      games: enrichedGames,
    };
  },
});

// Helper function to get current NFL week (simplified)
function getCurrentNFLWeek(): number {
  // This is a simplified version - in a real app you'd want more sophisticated logic
  // to determine the current NFL week based on the actual season schedule
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
  const weeksSinceStart = Math.floor(
    (now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  return Math.max(1, Math.min(18, weeksSinceStart + 1));
}
