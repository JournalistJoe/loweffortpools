/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as draft from "../draft.js";
import type * as email from "../email.js";
import type * as http from "../http.js";
import type * as leagues from "../leagues.js";
import type * as nflData from "../nflData.js";
import type * as router from "../router.js";
import type * as scoring from "../scoring.js";
import type * as spectators from "../spectators.js";
import type * as testLeague from "../testLeague.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chat: typeof chat;
  constants: typeof constants;
  crons: typeof crons;
  draft: typeof draft;
  email: typeof email;
  http: typeof http;
  leagues: typeof leagues;
  nflData: typeof nflData;
  router: typeof router;
  scoring: typeof scoring;
  spectators: typeof spectators;
  testLeague: typeof testLeague;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
