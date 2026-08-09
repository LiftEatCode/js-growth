import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type GlassCardTone =
  | "dark"
  | "light";

type GlassCardPadding =
  | "none"
  | "sm"
  | "md"
  | "lg";

type GlassCardProps<
  T extends ElementType = "div",
> = {
  as?: T;

  children: ReactNode;

  className?: string;

  interactive?: boolean;

  tone?: GlassCardTone;

  padding?: GlassCardPadding;
} & Omit<
  ComponentPropsWithoutRef<T>,
  "as" | "children" | "className"
>;

const toneClasses: Record<
  GlassCardTone,
  string
> = {
  dark:
    [
      "border-white/10",
      "bg-white/[0.055]",
      "text-white",
      "shadow-card",
      "backdrop-blur-xl",
    ].join(" "),

  light:
    [
      "border-white/70",
      "bg-white/75",
      "text-foreground",
      "shadow-card",
      "backdrop-blur-xl",
    ].join(" "),
};

const paddingClasses: Record<
  GlassCardPadding,
  string
> = {
  none:
    "",

  sm:
    "p-4",

  md:
    "p-6",

  lg:
    "p-8",
};

export function GlassCard<
  T extends ElementType = "div",
>({
  as,
  children,
  className,
  interactive = false,
  tone = "dark",
  padding = "md",
  ...props
}: GlassCardProps<T>) {
  const Component =
    as ?? "div";

  return (
    <Component
      className={cn(
        "relative rounded-2xl border",
        "transition-all duration-200 ease-out",

        toneClasses[
          tone
        ],

        paddingClasses[
          padding
        ],

        interactive &&
          tone ===
            "dark" && [
            "hover:-translate-y-1",
            "hover:border-white/20",
            "hover:bg-white/[0.08]",
            "hover:shadow-soft",
          ],

        interactive &&
          tone ===
            "light" && [
            "hover:-translate-y-1",
            "hover:border-brand-blue/20",
            "hover:bg-white/90",
            "hover:shadow-card-hover",
          ],

        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}