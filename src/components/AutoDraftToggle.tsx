import React, { useState } from 'react';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Bot, User, AlertTriangle } from "lucide-react";

interface AutoDraftToggleProps {
  leagueId: string;
  participant?: any;
  currentUser?: any;
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
        leagueId: leagueId as any,
        enabled,
        reason: enabled ? "user_request" : undefined,
      });
      
      const message = enabled 
        ? "Auto-draft enabled! You'll be automatically drafted when it's your turn."
        : "Auto-draft disabled. You'll need to make picks manually.";
      
      toast.success(message);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`transition-colors ${
      isCurrentParticipantTurn 
        ? "border-primary bg-primary/5" 
        : "border-gray-200"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isAutoDrafting ? (
              <Bot className="h-5 w-5 text-blue-600" />
            ) : (
              <User className="h-5 w-5 text-gray-600" />
            )}
            <div>
              <Label className="text-base font-medium">
                {isAutoDrafting ? "Auto-draft ON" : "Manual drafting"}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {isAutoDrafting 
                  ? "Your picks will be made automatically based on your preferences"
                  : "You'll make picks manually when it's your turn"
                }
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
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component to show auto-draft status for other participants in the draft board
export function ParticipantAutoDraftStatus({ participant }: { participant: any }) {
  if (!participant.isAutoDrafting) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
      <Bot className="h-3 w-3" />
      <span>Auto-drafting</span>
    </div>
  );
}