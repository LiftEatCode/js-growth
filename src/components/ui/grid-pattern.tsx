import { cn } from "@/lib/utils";

type GridPatternProps = {
  className?: string;
};

export function GridPattern({ className }: GridPatternProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0",
        "bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)]",
        "bg-[size:48px_48px]",
        "[mask-image:linear-gradient(to_bottom,black,transparent_85%)]",
        className,
      )}
    />
  );
}