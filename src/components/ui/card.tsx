import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type CardVariant =
  | "default"
  | "subtle"
  | "muted"
  | "elevated"
  | "brand";

type CardPadding =
  | "none"
  | "sm"
  | "md"
  | "lg";

type CardProps<
  T extends ElementType = "div",
> = {
  as?: T;

  children: ReactNode;

  className?: string;

  variant?: CardVariant;

  padding?: CardPadding;

  interactive?: boolean;
} & Omit<
  ComponentPropsWithoutRef<T>,
  "as" | "children" | "className"
>;

const variantClasses: Record<
  CardVariant,
  string
> = {
  default:
    "border-border bg-white",

  subtle:
    "border-border bg-slate-50/70",

  muted:
    "border-border bg-slate-100/80",

  elevated:
    "border-slate-200 bg-white shadow-card",

  brand:
    "border-brand-blue/15 bg-brand-blue/[0.035]",
};

const paddingClasses: Record<
  CardPadding,
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

export function Card<
  T extends ElementType = "div",
>({
  as,
  children,
  className,
  variant = "default",
  padding = "md",
  interactive = false,
  ...props
}: CardProps<T>) {
  const Component =
    as ?? "div";

  return (
    <Component
      className={cn(
        "relative rounded-2xl border",
        "transition-all duration-200 ease-out",
        variantClasses[
          variant
        ],
        paddingClasses[
          padding
        ],

        interactive &&
          [
            "hover:-translate-y-1",
            "hover:border-brand-blue/20",
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