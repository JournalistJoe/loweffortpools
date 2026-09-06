import React, { useState } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";

// Minimal user type for current user context
interface User {
  _id: Id<"users">;
}
import { toast } from "sonner";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Bot, User, AlertTriangle } from "lucide-react";
import { errorMessage } from "@/utils/errors";

interface AutoDraftToggleProps {
  leagueId: Id<"leagues">;
  participant?: Doc<"participants">;
  currentUser?: User;
  isCurrentParticipantTurn?: boolean;
}

export function AutoDraftToggle({ 
  leagueId, 
  participant, 
  currentUser,
  isCurrentParticipantTurn = false 
}: AutoDraftToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const toggleAutoDraft = useMutation(api.draft.toggleAutoDraft);
  const preferences = useQuery(api.draft.getDraftPreferences, { leagueId });
  const hasRankings = (preferences?.rankings.length ?? 0) > 0;

  // Only show if user is a participant and it's either their turn or they want to prepare for future turns
  const isUserParticipant = participant && currentUser && participant.userId === currentUser._id;
  
  if (!isUserParticipant) {
    return null;
  }

  const isAutoDrafting = participant.isAutoDrafting;

  const handleToggle = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      await toggleAutoDraft({
        leagueId,
        enabled,
        reason: enabled ? "user_request" : undefined,
      });
      
      const message = enabled
        ? "Drafting for you automatically. Your top available team is picked the moment your turn starts."
        : "Waiting for you each turn. If the timer runs out, we pick from your rankings.";
      
      toast.success(message);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`transition-colors ${
      isCurrentParticipantTurn 
        ? "border-primary bg-primary/5" 
        : "border-border"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isAutoDrafting ? (
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label className="text-base font-medium">
                {isAutoDrafting ? "Drafting for you automatically" : "Waiting for you each turn"}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {isAutoDrafting
                  ? hasRankings
                    ? "Your top available ranked team is picked the moment your turn starts."
                    : "A random team is picked the moment your turn starts. Add rankings on My Team to control it."
                  : hasRankings
                    ? "You have the full timer to pick. If it runs out, we pick from your rankings."
                    : "You have the full timer to pick. If it runs out, we pick a random team."}
              </p>
              {isCurrentParticipantTurn && (
                <div className="flex items-center gap-1 mt-2 text-sm text-primary">
                  <AlertTriangle className="h-3 w-3" />
                  <span>It's your turn to pick!</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={isAutoDrafting}
              onCheckedChange={(enabled) => void handleToggle(enabled)}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component to show auto-draft status for other participants in the draft board
export function ParticipantAutoDraftStatus({ participant }: { participant: Doc<"participants"> }) {
  if (!participant.isAutoDrafting) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-xs text-blue-600 mt-1 dark:text-blue-400">
      <Bot className="h-3 w-3" />
      <span>Auto-drafting</span>
    </div>
  );
}