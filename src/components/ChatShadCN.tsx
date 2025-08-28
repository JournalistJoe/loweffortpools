import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { MessageCircle, ChevronDown, Send, Trash2, Crown } from "lucide-react";

interface ChatProps {
  leagueId: string;
}

export function ChatShadCN({ leagueId }: ChatProps) {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = useQuery(api.chat.getMessages, {
    leagueId: leagueId as any,
  });
  const sendMessage = useMutation(api.chat.sendMessage);
  const deleteMessage = useMutation(api.chat.deleteMessage);
  const currentUser = useQuery(api.auth.loggedInUser);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

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
    try {
      await deleteMessage({ messageId: messageId as any });
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

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!messages) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lastMessage = messages[messages.length - 1];

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">League Chat</CardTitle>
                {messages.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {messages.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && !isExpanded && (
                  <div className="text-sm text-muted-foreground truncate max-w-32">
                    <span className="font-medium">
                      {lastMessage?.displayName}:
                    </span>{" "}
                    {lastMessage?.message.slice(0, 20)}
                    {lastMessage?.message.length > 20 && "..."}
                  </div>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="mb-4" />

            <ScrollArea className="h-96 pr-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No messages yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Be the first to start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg._id} className="group flex items-start gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                          {msg.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {msg.displayName}
                          </span>
                          {msg.isAdmin && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Crown className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground break-words leading-relaxed">
                          {msg.message}
                        </p>
                      </div>

                      {(currentUser?._id === msg.userId ||
                        currentUser?._id === msg.user._id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteMessage(msg._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                maxLength={500}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!message.trim()}
                size="sm"
                className="gap-2 px-4"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </form>

            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
              <span>{message.length}/500 characters</span>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
