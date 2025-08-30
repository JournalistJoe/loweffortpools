import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { ChevronUp, ChevronDown, Star, Settings } from "lucide-react";

interface DraftPreferenceManagerProps {
  leagueId: string;
}

export function DraftPreferenceManager({ leagueId }: DraftPreferenceManagerProps) {
  const [teams, setTeams] = useState<any[]>([]);
  const [enableAutoDraft, setEnableAutoDraft] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const league = useQuery(api.leagues.getLeague, { leagueId: leagueId as any });
  const currentUser = useQuery(api.users.getCurrentUser);
  const draftState = useQuery(api.draft.getDraftState, { leagueId: leagueId as any });
  const preferences = useQuery(api.draft.getDraftPreferences, { leagueId: leagueId as any });
  
  const setDraftPreferences = useMutation(api.draft.setDraftPreferences);

  // Initialize teams from available teams in draft state
  useEffect(() => {
    if (draftState?.availableTeams && teams.length === 0) {
      if (preferences?.rankedTeams) {
        // Use existing preferences order
        setTeams([...preferences.rankedTeams]);
        setEnableAutoDraft(preferences.enableAutoDraft);
      } else {
        // Initialize with available teams in alphabetical order
        const sortedTeams = [...draftState.availableTeams].sort((a, b) => 
          a.fullName.localeCompare(b.fullName)
        );
        setTeams(sortedTeams);
      }
    }
  }, [draftState, preferences, teams.length]);

  const moveTeam = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === teams.length - 1)) {
      return; // Can't move further
    }

    const newTeams = [...teams];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap teams
    [newTeams[index], newTeams[targetIndex]] = [newTeams[targetIndex], newTeams[index]];
    
    setTeams(newTeams);
    setHasUnsavedChanges(true);
  };

  const handleSavePreferences = async () => {
    if (!teams.length) {
      toast.error("Please rank all teams before saving");
      return;
    }

    try {
      await setDraftPreferences({
        leagueId: leagueId as any,
        rankings: teams.map(team => team._id),
        enableAutoDraft,
      });
      
      setHasUnsavedChanges(false);
      toast.success("Draft preferences saved successfully!");
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleAutoDraftChange = (checked: boolean) => {
    setEnableAutoDraft(checked);
    setHasUnsavedChanges(true);
  };

  if (!league || !draftState || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (league.status !== "setup") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Draft Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Draft preferences can only be set before the draft starts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Draft Preferences
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Rank teams in order of preference. If you're unavailable or time expires during the draft, 
            we'll automatically pick your highest ranked available team.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-draft"
                checked={enableAutoDraft}
                onCheckedChange={handleAutoDraftChange}
              />
              <Label htmlFor="auto-draft">
                Enable auto-draft when I'm unavailable
              </Label>
            </div>
            
            {hasUnsavedChanges && (
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">You have unsaved changes</p>
                <Button onClick={handleSavePreferences} size="sm">
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Rankings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use the up/down arrows to reorder teams. Your top choice should be at the top.
          </p>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading teams...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map((team, index) => (
                <div
                  key={team._id}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveTeam(index, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveTeam(index, 'down')}
                      disabled={index === teams.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="min-w-[2rem] justify-center">
                    {index + 1}
                  </Badge>
                  {index === 0 && <Star className="h-4 w-4 text-yellow-500" />}
                  {team.logoUrl && (
                    <img 
                      src={team.logoUrl} 
                      alt={`${team.name} logo`}
                      className="h-6 w-6 object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{team.fullName}</div>
                    <div className="text-sm text-muted-foreground">{team.abbrev}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button 
              onClick={handleSavePreferences}
              disabled={!hasUnsavedChanges || teams.length === 0}
              className="flex-1"
            >
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}