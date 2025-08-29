import { v } from "convex/values";
import {
  mutation,
  action,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// NFL team data for 2025 season
const NFL_TEAMS_2025 = [
  { espnId: 1, abbrev: "ATL", name: "Falcons", fullName: "Atlanta Falcons", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png" },
  { espnId: 2, abbrev: "BUF", name: "Bills", fullName: "Buffalo Bills", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png" },
  { espnId: 3, abbrev: "CHI", name: "Bears", fullName: "Chicago Bears", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png" },
  { espnId: 4, abbrev: "CIN", name: "Bengals", fullName: "Cincinnati Bengals", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png" },
  { espnId: 5, abbrev: "CLE", name: "Browns", fullName: "Cleveland Browns", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png" },
  { espnId: 6, abbrev: "DAL", name: "Cowboys", fullName: "Dallas Cowboys", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png" },
  { espnId: 7, abbrev: "DEN", name: "Broncos", fullName: "Denver Broncos", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png" },
  { espnId: 8, abbrev: "DET", name: "Lions", fullName: "Detroit Lions", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png" },
  { espnId: 9, abbrev: "GB", name: "Packers", fullName: "Green Bay Packers", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png" },
  { espnId: 10, abbrev: "TEN", name: "Titans", fullName: "Tennessee Titans", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png" },
  { espnId: 11, abbrev: "IND", name: "Colts", fullName: "Indianapolis Colts", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png" },
  { espnId: 12, abbrev: "KC", name: "Chiefs", fullName: "Kansas City Chiefs", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png" },
  { espnId: 13, abbrev: "LV", name: "Raiders", fullName: "Las Vegas Raiders", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png" },
  { espnId: 14, abbrev: "LAR", name: "Rams", fullName: "Los Angeles Rams", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png" },
  { espnId: 15, abbrev: "MIA", name: "Dolphins", fullName: "Miami Dolphins", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png" },
  { espnId: 16, abbrev: "MIN", name: "Vikings", fullName: "Minnesota Vikings", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/min.png" },
  {
    espnId: 17,
    abbrev: "NE",
    name: "Patriots",
    fullName: "New England Patriots",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png"
  },
  { espnId: 18, abbrev: "NO", name: "Saints", fullName: "New Orleans Saints", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/no.png" },
  { espnId: 19, abbrev: "NYG", name: "Giants", fullName: "New York Giants", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png" },
  { espnId: 20, abbrev: "NYJ", name: "Jets", fullName: "New York Jets", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png" },
  {
    espnId: 21,
    abbrev: "PHI",
    name: "Eagles",
    fullName: "Philadelphia Eagles",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png"
  },
  {
    espnId: 22,
    abbrev: "ARI",
    name: "Cardinals",
    fullName: "Arizona Cardinals",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png"
  },
  {
    espnId: 23,
    abbrev: "PIT",
    name: "Steelers",
    fullName: "Pittsburgh Steelers",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png"
  },
  {
    espnId: 24,
    abbrev: "LAC",
    name: "Chargers",
    fullName: "Los Angeles Chargers",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png"
  },
  { espnId: 25, abbrev: "SF", name: "49ers", fullName: "San Francisco 49ers", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png" },
  { espnId: 26, abbrev: "SEA", name: "Seahawks", fullName: "Seattle Seahawks", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png" },
  {
    espnId: 27,
    abbrev: "TB",
    name: "Buccaneers",
    fullName: "Tampa Bay Buccaneers",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png"
  },
  {
    espnId: 28,
    abbrev: "WAS",
    name: "Commanders",
    fullName: "Washington Commanders",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png"
  },
  {
    espnId: 29,
    abbrev: "CAR",
    name: "Panthers",
    fullName: "Carolina Panthers",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png"
  },
  {
    espnId: 30,
    abbrev: "JAX",
    name: "Jaguars",
    fullName: "Jacksonville Jaguars",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png"
  },
  { espnId: 33, abbrev: "BAL", name: "Ravens", fullName: "Baltimore Ravens", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png" },
  { espnId: 34, abbrev: "HOU", name: "Texans", fullName: "Houston Texans", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png" },
];

export const importTeams = mutation({
  args: {
    seasonYear: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if user is a superuser
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");
    
    const user = await ctx.db.get(userId);
    if (!user?.isSuperuser) throw new Error("Must be a superuser to import NFL teams (affects all leagues)");

    // Clear existing teams for this season
    const existingTeams = await ctx.db
      .query("nflTeams")
      .withIndex("by_season", (q) => q.eq("seasonYear", args.seasonYear))
      .collect();

    for (const team of existingTeams) {
      await ctx.db.delete(team._id);
    }

    // Insert new teams
    const teamIds = [];
    for (const teamData of NFL_TEAMS_2025) {
      const teamId = await ctx.db.insert("nflTeams", {
        ...teamData,
        seasonYear: args.seasonYear,
      });
      teamIds.push(teamId);
    }

    return { imported: teamIds.length };
  },
});

export const syncGamesFromESPN = internalAction({
  args: {
    week: v.number(),
    seasonYear: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // ESPN API endpoint for NFL scoreboard
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${args.seasonYear}&seasontype=2&week=${args.week}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }

      const data = await response.json();

      await ctx.runMutation(internal.nflData.processESPNData, {
        data: JSON.stringify(data),
        week: args.week,
        seasonYear: args.seasonYear,
      });

      return { success: true, gamesProcessed: data.events?.length || 0 };
    } catch (error) {
      console.error("Error syncing from ESPN:", error);
      throw new Error(
        `Failed to sync games: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});

export const processESPNData = internalMutation({
  args: {
    data: v.string(),
    week: v.number(),
    seasonYear: v.number(),
  },
  handler: async (ctx, args) => {
    const espnData = JSON.parse(args.data);

    // Get all NFL teams for this season
    const nflTeams = await ctx.db
      .query("nflTeams")
      .withIndex("by_season", (q) => q.eq("seasonYear", args.seasonYear))
      .collect();

    const teamsByEspnId = new Map(nflTeams.map((team) => [team.espnId, team]));

    let processed = 0;

    for (const event of espnData.events || []) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const competitors = competition.competitors;
      if (!competitors || competitors.length !== 2) continue;

      const homeCompetitor = competitors.find(
        (c: any) => c.homeAway === "home",
      );
      const awayCompetitor = competitors.find(
        (c: any) => c.homeAway === "away",
      );

      if (!homeCompetitor || !awayCompetitor) continue;

      const homeTeam = teamsByEspnId.get(parseInt(homeCompetitor.team.id));
      const awayTeam = teamsByEspnId.get(parseInt(awayCompetitor.team.id));

      if (!homeTeam || !awayTeam) continue;

      // Determine game status and winner
      let status:
        | "scheduled"
        | "in_progress"
        | "final"
        | "postponed"
        | "canceled" = "scheduled";
      let winnerTeamId = undefined;
      let tie = false;

      if (competition.status.type.completed) {
        status = "final";
        const homeScore = parseInt(homeCompetitor.score);
        const awayScore = parseInt(awayCompetitor.score);

        if (homeScore === awayScore) {
          tie = true;
        } else if (homeScore > awayScore) {
          winnerTeamId = homeTeam._id;
        } else {
          winnerTeamId = awayTeam._id;
        }
      } else if (competition.status.type.name === "STATUS_IN_PROGRESS") {
        status = "in_progress";
      }

      // Check if game already exists
      const existingGame = await ctx.db
        .query("games")
        .withIndex("by_season_and_week", (q) =>
          q.eq("seasonYear", args.seasonYear).eq("week", args.week),
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("homeTeamId"), homeTeam._id),
            q.eq(q.field("awayTeamId"), awayTeam._id),
          ),
        )
        .first();

      const gameData = {
        week: args.week,
        seasonYear: args.seasonYear,
        homeTeamId: homeTeam._id,
        awayTeamId: awayTeam._id,
        status,
        winnerTeamId,
        tie,
        gameDate: new Date(event.date).getTime(),
        espnGameId: String(event.id),
      };

      if (existingGame) {
        await ctx.db.patch(existingGame._id, gameData);
      } else {
        await ctx.db.insert("games", gameData);
      }

      processed++;
    }

    return processed;
  },
});

export const updateTeamLogos = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if user is a superuser
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");
    
    const user = await ctx.db.get(userId);
    if (!user?.isSuperuser) throw new Error("Must be a superuser to update team logos");
    
    const teams = await ctx.db.query("nflTeams").collect();
    let updated = 0;
    
    for (const team of teams) {
      const logoUrl = `https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbrev.toLowerCase()}.png`;
      await ctx.db.patch(team._id, { logoUrl });
      updated++;
    }
    
    return { updated, message: `Updated ${updated} team logos` };
  },
});

export const manualResync = mutation({
  args: {
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if user is a superuser
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");
    
    const user = await ctx.db.get(userId);
    if (!user?.isSuperuser) throw new Error("Must be a superuser to manually resync game data (affects all leagues)");

    const seasonYear = 2025; // Current season

    try {
      await ctx.scheduler.runAfter(0, internal.nflData.syncGamesFromESPN, {
        week: args.week,
        seasonYear,
      });

      await ctx.db.insert("syncRuns", {
        ranAt: Date.now(),
        type: "manual",
        summary: `Manual resync triggered for week ${args.week}`,
        week: args.week,
        success: true,
      });

      return { success: true, week: args.week };
    } catch (error) {
      await ctx.db.insert("syncRuns", {
        ranAt: Date.now(),
        type: "manual",
        summary: `Manual resync failed for week ${args.week}`,
        week: args.week,
        success: false,
        error: String(error),
      });

      throw error;
    }
  },
});
