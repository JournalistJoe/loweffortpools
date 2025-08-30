import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Bell, BellOff, MessageCircle, Trophy, User, Zap } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface NotificationSettingsProps {
  leagueId?: Id<"leagues">;
  showGlobalSettings?: boolean;
}

export function NotificationSettings({ leagueId, showGlobalSettings = false }: NotificationSettingsProps) {
  const [muteFor, setMuteFor] = useState<string>("0");

  const preferences = useQuery(api.pushNotifications.getNotificationPreferences, {
    leagueId: leagueId || undefined,
  });
  
  const updatePreferences = useMutation(api.pushNotifications.updateNotificationPreferences);
  const currentUser = useQuery(api.auth.loggedInUser);

  const handleToggle = async (setting: string, value: boolean) => {
    try {
      await updatePreferences({
        leagueId: leagueId || undefined,
        [setting]: value,
      });
      toast.success("Notification preferences updated");
    } catch (error) {
      toast.error("Failed to update preferences");
      console.error("Error updating preferences:", error);
    }
  };

  const handleMuteFor = async (hours: string) => {
    const hoursNum = parseInt(hours);
    const mutedUntil = hoursNum > 0 ? Date.now() + (hoursNum * 60 * 60 * 1000) : undefined;
    
    try {
      await updatePreferences({
        leagueId: leagueId || undefined,
        mutedUntil,
      });
      
      if (hoursNum > 0) {
        toast.success(`Notifications muted for ${hoursNum} hour${hoursNum !== 1 ? 's' : ''}`);
      } else {
        toast.success("Notifications unmuted");
      }
    } catch (error) {
      toast.error("Failed to update mute settings");
      console.error("Error updating mute settings:", error);
    }
  };


  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2" />
              <p>Loading notification settings...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isMuted = preferences.mutedUntil && preferences.mutedUntil > Date.now();
  const muteTimeRemaining = isMuted 
    ? Math.ceil((preferences.mutedUntil! - Date.now()) / (60 * 60 * 1000))
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
              {!showGlobalSettings && leagueId && (
                <Badge variant="secondary" className="text-xs">League Specific</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {showGlobalSettings 
                ? "Default notification preferences for all leagues"
                : "Customize notifications for this league"
              }
            </CardDescription>
          </div>
          {isMuted && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              <BellOff className="w-3 h-3 mr-1" />
              Muted ({muteTimeRemaining}h left)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mute Controls */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Temporary Mute</Label>
          <div className="flex items-center gap-3">
            <Select value={muteFor} onValueChange={setMuteFor}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Mute for..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Unmute</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="8">8 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => handleMuteFor(muteFor)}
              size="sm"
            >
              Apply
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Temporarily disable all notifications for this {showGlobalSettings ? 'account' : 'league'}
          </p>
        </div>

        <div className="border-t pt-6">
          <h4 className="text-sm font-medium mb-4">Notification Types</h4>
          <div className="space-y-4">
            {/* Important Only Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-orange-500" />
                <div>
                  <Label className="font-medium">Important Only</Label>
                  <p className="text-sm text-muted-foreground">
                    Only receive high-priority notifications (draft start, your turn)
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.enableImportantOnly}
                onCheckedChange={(checked) => handleToggle("enableImportantOnly", checked)}
                disabled={isMuted}
              />
            </div>

            {/* My Turn Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-blue-500" />
                <div>
                  <Label className="font-medium">My Turn</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when it's your turn to draft
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.enableMyTurn}
                onCheckedChange={(checked) => handleToggle("enableMyTurn", checked)}
                disabled={isMuted || preferences.enableImportantOnly}
              />
            </div>

            {/* Draft Picks Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <div>
                  <Label className="font-medium">Draft Picks</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications for all draft picks and draft events
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.enableDraftPicks}
                onCheckedChange={(checked) => handleToggle("enableDraftPicks", checked)}
                disabled={isMuted || preferences.enableImportantOnly}
              />
            </div>

            {/* Chat Messages Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <div>
                  <Label className="font-medium">Chat Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    New messages in league chat
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.enableChatMessages}
                onCheckedChange={(checked) => handleToggle("enableChatMessages", checked)}
                disabled={isMuted || preferences.enableImportantOnly}
              />
            </div>
          </div>
        </div>


        {/* Status Info */}
        <div className="border-t pt-6">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Notifications work even when the app is closed</p>
            <p>• High-priority notifications may override "Important Only" setting</p>
            <p>• You can customize settings for each league separately</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}