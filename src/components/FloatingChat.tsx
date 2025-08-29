import { useState, useEffect } from "react";
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

  // Handle escape key to close chat
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

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
                        fixed top-16 bottom-0 left-0 right-0 
                        md:top-auto md:bottom-4 md:right-4 md:left-auto md:w-80 md:h-96 md:rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground md:rounded-t-lg relative">
              {/* Mobile close indicator */}
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary-foreground/30 rounded-full md:hidden"></div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">League Chat</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-10 w-10 p-0 text-primary-foreground hover:bg-primary-foreground/20 border border-primary-foreground/20 hover:border-primary-foreground/40 md:h-6 md:w-6 md:border-0 shrink-0 z-10"
              >
                <X className="h-6 w-6 md:h-4 md:w-4 stroke-2" />
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
