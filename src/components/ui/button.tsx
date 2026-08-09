import {
  Button as ButtonPrimitive,
} from "@base-ui/react/button";
import {
  cva,
  type VariantProps,
} from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/button",
    "relative",
    "inline-flex",
    "shrink-0",
    "items-center",
    "justify-center",
    "whitespace-nowrap",
    "rounded-xl",
    "border",
    "border-transparent",
    "font-medium",
    "outline-none",
    "select-none",
    "transition-all",
    "duration-200",
    "ease-out",

    "focus-visible:ring-4",
    "focus-visible:ring-brand-blue/15",
    "focus-visible:outline-none",

    "disabled:pointer-events-none",
    "disabled:opacity-50",
    "disabled:shadow-none",
    "disabled:transform-none",

    "aria-invalid:border-danger",
    "aria-invalid:ring-danger/15",

    "[&_svg]:pointer-events-none",
    "[&_svg]:shrink-0",
    "[&_svg]:transition-transform",
    "[&_svg]:duration-200",

    "active:not-aria-[haspopup]:translate-y-px",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-brand-blue",
          "bg-brand-blue",
          "text-white",
          "shadow-button",

          "hover:-translate-y-0.5",
          "hover:border-brand-blue-dark",
          "hover:bg-brand-blue-dark",
          "hover:shadow-button-hover",

          "active:translate-y-0",
          "active:shadow-button",
        ],

        secondary: [
          "border-slate-200",
          "bg-white",
          "text-brand",
          "shadow-sm",

          "hover:-translate-y-0.5",
          "hover:border-slate-300",
          "hover:bg-slate-50",
          "hover:shadow-md",

          "active:translate-y-0",
        ],

        outline: [
          "border-slate-300",
          "bg-transparent",
          "text-brand",

          "hover:-translate-y-0.5",
          "hover:border-brand-blue/35",
          "hover:bg-brand-blue/[0.04]",
          "hover:text-brand-blue",
          "hover:shadow-sm",

          "active:translate-y-0",
        ],

        ghost: [
          "border-transparent",
          "bg-transparent",
          "text-brand",

          "hover:bg-slate-100",
          "hover:text-brand-blue",
        ],

        destructive: [
          "border-danger/10",
          "bg-danger-soft",
          "text-danger",

          "hover:-translate-y-0.5",
          "hover:border-danger/20",
          "hover:bg-danger/10",

          "focus-visible:ring-danger/15",

          "active:translate-y-0",
        ],

        link: [
          "h-auto",
          "rounded-none",
          "border-0",
          "bg-transparent",
          "p-0",
          "text-brand-blue",
          "shadow-none",

          "hover:text-brand-blue-dark",
          "hover:underline",
          "hover:underline-offset-4",
        ],
      },

      size: {
        xs: [
          "h-7",
          "gap-1.5",
          "rounded-lg",
          "px-2.5",
          "text-xs",

          "[&_svg:not([class*='size-'])]:size-3",
        ],

        sm: [
          "h-8",
          "gap-1.5",
          "rounded-lg",
          "px-3",
          "text-xs",

          "[&_svg:not([class*='size-'])]:size-3.5",
        ],

        default: [
          "h-10",
          "gap-2",
          "px-4",
          "text-sm",

          "[&_svg:not([class*='size-'])]:size-4",
        ],

        lg: [
          "h-12",
          "gap-2",
          "px-5",
          "text-sm",

          "[&_svg:not([class*='size-'])]:size-4",
        ],

        xl: [
          "h-14",
          "gap-2.5",
          "rounded-2xl",
          "px-6",
          "text-base",

          "[&_svg:not([class*='size-'])]:size-[18px]",
        ],

        icon: [
          "size-10",
          "p-0",

          "[&_svg:not([class*='size-'])]:size-4",
        ],

        "icon-xs": [
          "size-7",
          "rounded-lg",
          "p-0",

          "[&_svg:not([class*='size-'])]:size-3",
        ],

        "icon-sm": [
          "size-8",
          "rounded-lg",
          "p-0",

          "[&_svg:not([class*='size-'])]:size-3.5",
        ],

        "icon-lg": [
          "size-12",
          "p-0",

          "[&_svg:not([class*='size-'])]:size-5",
        ],
      },
    },

    defaultVariants: {
      variant:
        "default",

      size:
        "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props &
  VariantProps<
    typeof buttonVariants
  >) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({
          variant,
          size,
          className,
        }),
      )}
      {...props}
    />
  );
}

export {
  Button,
  buttonVariants,
};