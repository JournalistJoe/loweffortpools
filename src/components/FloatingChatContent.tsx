import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Send, Trash2, Crown } from "lucide-react";

interface FloatingChatContentProps {
  leagueId: string;
}

export function FloatingChatContent({ leagueId }: FloatingChatContentProps) {
  const [message, setMessage] = useState("");
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!messages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground font-medium">
                No messages yet
              </p>
              <p className="text-xs text-muted-foreground">
                Be the first to start the conversation!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="group">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {msg.displayName?.slice(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {msg.displayName}
                      </span>
                      {msg.isAdmin && (
                        <Crown className="h-3 w-3 text-amber-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg._creationTime)}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed break-words">
                      {msg.message}
                    </p>
                  </div>

                  {/* Delete button for message author or admins */}
                  {currentUser?._id === msg.userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => handleDeleteMessage(msg._id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
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
