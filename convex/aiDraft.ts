"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";
import type { AiDraftContext } from "./draftContext";

const MODEL = "claude-opus-5";

export type PickSuggestion = {
  teamId: Id<"nflTeams">;
  abbrev: string;
  fullName: string;
  rationale: string;
  alternatives: string[];
};

const SYSTEM_PROMPT = `You are advising one manager in an NFL pool draft.

Format: 8 managers each draft 4 NFL teams in a snake draft. Every regular season
win by one of a manager's teams is 1 point (ties are worth half or nothing
depending on league settings). The manager with the most total wins at the end
of the regular season wins. There are no trades, no waivers, and no playoffs.
The only thing that matters is expected regular season wins.

Recommend the single best available team for the manager on the clock. Weigh
projected wins for the upcoming season above all else: roster strength,
quarterback situation, coaching stability, schedule difficulty, and regression
or bounce-back from last year's record. Last season's record is provided as a
signal, not the answer. Consider draft position: if several picks happen before
this manager's next turn, prefer the team most likely to be gone by then.

You have web search. Before deciding, run a few targeted searches for this
season's projected win totals and any major news since last season (starting
quarterback injuries, trades, coaching changes) for the top candidates. Keep it
to a handful of searches; you do not need to research every team. Mention in
the rationale anything current that drove the choice.`;

const WEB_SEARCH_TOOL = {
  type: "web_search_20260209",
  name: "web_search",
  max_uses: 5,
} as const;

/** Server-side tools can pause a long turn; resume a bounded number of times. */
const MAX_CONTINUATIONS = 3;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    teamAbbrev: {
      type: "string",
      description: "Abbreviation of the recommended team, exactly as listed in the available teams",
    },
    rationale: {
      type: "string",
      description: "Two or three sentences a manager would find useful, in plain language",
    },
    alternatives: {
      type: "array",
      items: { type: "string" },
      maxItems: 3,
      description: "Up to three other available team abbreviations worth considering, best first",
    },
  },
  required: ["teamAbbrev", "rationale", "alternatives"],
  additionalProperties: false,
} as const;

function formatRecord(r: { wins: number; losses: number; ties: number } | null) {
  if (!r) return "no data";
  return r.ties ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;
}

function buildPrompt(c: AiDraftContext): string {
  const rosters = c.rosters
    .map((r) => `- ${r.displayName}${r.isMe ? " (on the clock)" : ""}: ${r.teams.length ? r.teams.join(", ") : "none yet"}`)
    .join("\n");
  const available = c.availableTeams
    .map((t) => `- ${t.abbrev} ${t.fullName} (last season ${formatRecord(t.lastSeason)})`)
    .join("\n");
  return `League: ${c.leagueName}, ${c.seasonYear} NFL season.
Pick ${c.pickNumber} of 32, round ${c.round}. ${c.me.displayName} is on the clock (draft slot ${c.me.draftPosition}).
${c.picksUntilMyNextTurn} other picks happen before this manager picks again.

Rosters so far:
${rosters}

Available teams:
${available}

Recommend one team from the available list.`;
}

/**
 * One advisory turn with web search, resuming if the server pauses the turn.
 * Structured output is requested first; if the API rejects that combination,
 * the same request is retried asking for JSON in plain text.
 */
async function askClaude(client: Anthropic, userPrompt: string): Promise<string> {
  const run = async (structured: boolean): Promise<string> => {
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: structured
          ? userPrompt
          : `${userPrompt}\n\nReply with only a JSON object: {"teamAbbrev": string, "rationale": string, "alternatives": string[]}.`,
      },
    ];
    const request = () =>
      client.messages.create({
        model: MODEL,
        max_tokens: 16000,
        tools: [WEB_SEARCH_TOOL],
        output_config: {
          effort: "medium",
          ...(structured ? { format: { type: "json_schema", schema: OUTPUT_SCHEMA } } : {}),
        },
        system: SYSTEM_PROMPT,
        messages,
      });

    let response = await request();
    for (let i = 0; i < MAX_CONTINUATIONS && response.stop_reason === "pause_turn"; i++) {
      messages.push({ role: "assistant", content: response.content });
      response = await request();
    }

    if (response.stop_reason === "refusal") {
      throw new Error("The AI declined to make a recommendation");
    }
    // The final answer is the last text block; earlier ones are search commentary.
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );
    return textBlocks[textBlocks.length - 1]?.text ?? "";
  };

  try {
    return await run(true);
  } catch (error) {
    if (error instanceof Anthropic.BadRequestError && /output_config|format/i.test(error.message)) {
      return await run(false);
    }
    throw error;
  }
}

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}

/** Superuser-only: ask Claude which available team to draft right now. */
export const suggestPick = action({
  args: { leagueId: v.id("leagues") },
  handler: async (ctx, args): Promise<PickSuggestion> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("AI picks are not configured (ANTHROPIC_API_KEY is missing)");
    }

    const context: AiDraftContext = await ctx.runQuery(internal.draftContext.getAiDraftContext, {
      leagueId: args.leagueId,
      userId,
    });
    if (context.availableTeams.length === 0) throw new Error("No teams left to pick");

    const client = new Anthropic();
    const text = await askClaude(client, buildPrompt(context));

    let parsed: { teamAbbrev: string; rationale: string; alternatives: string[] };
    try {
      parsed = JSON.parse(extractJsonObject(text));
    } catch {
      throw new Error("The AI returned an unreadable answer; try again");
    }

    const byAbbrev = new Map(context.availableTeams.map((t) => [t.abbrev.toUpperCase(), t]));
    const team = byAbbrev.get(parsed.teamAbbrev.trim().toUpperCase());
    if (!team) {
      throw new Error(`The AI suggested ${parsed.teamAbbrev}, which is not available; try again`);
    }

    return {
      teamId: team.id,
      abbrev: team.abbrev,
      fullName: team.fullName,
      rationale: parsed.rationale,
      alternatives: parsed.alternatives
        .map((a) => a.trim().toUpperCase())
        .filter((a) => byAbbrev.has(a) && a !== team.abbrev.toUpperCase())
        .slice(0, 3),
    };
  },
});
