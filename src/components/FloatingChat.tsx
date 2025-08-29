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
      {isOpen ? (
        <div className="bg-white shadow-lg border flex flex-col z-50
                        fixed inset-0 top-16 
                        md:fixed md:bottom-4 md:right-4 md:w-80 md:h-96 md:rounded-lg md:inset-auto md:top-auto md:left-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground md:rounded-t-lg">
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
        <div className="fixed bottom-20 right-4 md:bottom-4 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
      )}

    </>
  );
}
