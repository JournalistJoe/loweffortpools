import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface DraftCountdownProps {
  scheduledDraftDate: number;
  className?: string;
}

export function DraftCountdown({ scheduledDraftDate, className = "" }: DraftCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const timeDiff = scheduledDraftDate - now;

      if (timeDiff <= 0) {
        setIsExpired(true);
        setTimeRemaining("Draft time has passed");
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }

      setIsExpired(false);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [scheduledDraftDate]);

  if (isExpired) {
    return (
      <div className={`flex items-center gap-1 text-sm text-orange-600 ${className}`}>
        <Clock className="h-3 w-3" />
        <span>{timeRemaining}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-sm text-blue-600 ${className}`}>
      <Clock className="h-3 w-3" />
      <span>Draft in {timeRemaining}</span>
    </div>
  );
}