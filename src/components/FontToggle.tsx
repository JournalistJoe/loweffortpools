import { Type, AlignLeft } from "lucide-react";
import { Button } from "./ui/button";
import { useFont } from "../contexts/FontContext";

export function FontToggle() {
  const { font, toggleFont } = useFont();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFont}
      className="h-9 w-9"
      aria-label={`Switch to ${font === "custom" ? "Eli Mode" : "LowEffort Mode"}`}
    >
      {font === "custom" ? (
        <Type className="h-4 w-4" />
      ) : (
        <AlignLeft className="h-4 w-4" />
      )}
    </Button>
  );
}