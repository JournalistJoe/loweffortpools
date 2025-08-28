import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams } from "react-router-dom";
import { MobileNavigationShadCN as Navigation } from "../components/MobileNavigationShadCN";
import { ChatShadCN as Chat } from "../components/ChatShadCN";

export function ChatPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );

  if (!league) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!league.isParticipant && !league.isAdmin) {
    return (
      <div>
        <Navigation league={league} />
        <div className="max-w-2xl mx-auto text-center py-12 pb-20">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You must be a league participant or admin to access the chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation league={league} />
      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">League Chat</h1>
          <p className="text-gray-600 mt-2">
            Chat with other participants in {league.name || "Unnamed League"}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Chat leagueId={leagueId!} />
        </div>
      </div>
    </div>
  );
}
