import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Send, Trash2, Crown, Activity, Users, Trophy, Clock, LogOut } from "lucide-react";

interface FloatingChatContentProps {
  leagueId: string;
}

export function FloatingChatContent({ leagueId }: FloatingChatContentProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const feedItems = useQuery(api.chat.getCombinedFeed, {
    leagueId: leagueId as any,
  });
  const sendMessage = useMutation(api.chat.sendMessage);
  const deleteMessage = useMutation(api.chat.deleteMessage);
  const currentUser = useQuery(api.auth.loggedInUser);

  // Auto-scroll to bottom when new feed items arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [feedItems]);

  // Focus input when mounted
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage({
        leagueId: leagueId as any,
        message: message.trim(),
      });
      setMessage("");
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      await deleteMessage({ messageId: messageId as any });
      toast.success("Message deleted");
    } catch (error) {
      toast.error(String(error));
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "league_created":
        return <Trophy className="h-4 w-4" />;
      case "participant_added":
        return <Users className="h-4 w-4" />;
      case "draft_started":
        return <Clock className="h-4 w-4" />;
      case "draft_pick":
        return <Trophy className="h-4 w-4" />;
      case "draft_completed":
        return <Trophy className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (!feedItems) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Combined Feed Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {feedItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground font-medium">
                No activity yet
              </p>
              <p className="text-xs text-muted-foreground">
                Be the first to start the conversation!
              </p>
            </div>
          ) : (
            feedItems.map((item) => {
              if (item.itemType === "activity") {
                // Render activity item
                return (
                  <div key={item._id} className="flex items-start gap-3 py-2">
                    <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-muted">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              } else {
                // Render chat message
                return (
                  <div key={item._id} className="group">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {item.displayName?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {item.displayName}
                          </span>
                          {item.isAdmin && (
                            <Crown className="h-3 w-3 text-amber-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTime(item.timestamp)}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed break-words">
                          {item.message}
                        </p>
                      </div>

                      {/* Delete button for message author or admins */}
                      {currentUser?._id === item.userId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={() => handleDeleteMessage(item._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              }
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-3">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 text-sm"
            maxLength={500}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!message.trim()}
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
