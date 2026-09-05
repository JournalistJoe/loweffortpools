import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

interface SpinnerProps {
  size?: keyof typeof sizes;
  /** Use on colored buttons where the primary color would vanish. */
  onPrimary?: boolean;
  className?: string;
  label?: string;
}

export function Spinner({
  size = "lg",
  onPrimary = false,
  className,
  label = "Loading",
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "animate-spin rounded-full border-b-2",
        sizes[size],
        onPrimary ? "border-primary-foreground" : "border-primary",
        className,
      )}
    />
  );
}

/** Full-area centered spinner for page and section loading states. */
export function LoadingBlock({
  className,
  size = "lg",
}: {
  className?: string;
  size?: keyof typeof sizes;
}) {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      <Spinner size={size} />
    </div>
  );
}
