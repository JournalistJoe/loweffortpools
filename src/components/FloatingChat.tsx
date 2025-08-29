import { useState } from "react";
import { useParams } from "react-router-dom";
import { FloatingChatContent } from "./FloatingChatContent";
import { Button } from "./ui/button";
import { MessageCircle, X } from "lucide-react";

interface FloatingChatProps {
  league: {
    _id: string;
    isParticipant: boolean;
    isAdmin: boolean;
  };
}

export function FloatingChat({ league }: FloatingChatProps) {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for participants and admins
  if (!league.isParticipant && !league.isAdmin) {
    return null;
  }

  // Don't show if we don't have a leagueId
  if (!leagueId) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Container */}
      <div className="fixed bottom-20 right-4 md:bottom-4 z-50">
        {isOpen ? (
          <div className="bg-white rounded-lg shadow-lg border w-80 h-96 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">League Chat</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary/80"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <FloatingChatContent leagueId={leagueId} />
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
