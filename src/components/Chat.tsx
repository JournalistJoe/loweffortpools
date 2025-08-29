import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface ChatProps {
  leagueId: string;
}

export function Chat({ leagueId }: ChatProps) {
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
    if (!confirm("Are you sure you want to delete this message?")) return;

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
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Chat Header */}
      <div
        className="p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">League Chat</h3>
            {messages.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {messages.length}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {messages.length > 0 && !isExpanded && (
              <div className="text-xs text-gray-500">
                {messages[messages.length - 1]?.displayName}:{" "}
                {messages[messages.length - 1]?.message.slice(0, 30)}
                {messages[messages.length - 1]?.message.length > 30 && "..."}
              </div>
            )}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      {isExpanded && (
        <div className="p-4">
          <div className="max-h-96 overflow-y-auto mb-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">💬</div>
                <p className="text-gray-600 text-sm">No messages yet</p>
                <p className="text-gray-500 text-xs">
                  Be the first to start the conversation!
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg._id} className="group">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {msg.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {msg.displayName}
                        </span>
                        {msg.isAdmin && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            Admin
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 break-words">
                        {msg.message}
                      </p>
                    </div>
                    {(currentUser?._id === msg.userId ||
                      currentUser?._id === msg.user._id) && (
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1"
                        title="Delete message"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Send
            </button>
          </form>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {message.length}/500
          </div>
        </div>
      )}
    </div>
  );
}
