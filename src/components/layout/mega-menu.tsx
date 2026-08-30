"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  ChevronDown,
  CircleDollarSign,
  FileSearch,
  Globe2,
  Info,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Newspaper,
  Sparkles,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface MegaMenuItem {
  name: string;
  description: string;
  href: string;
}

interface MegaMenuGroup {
  name: string;
  items: readonly MegaMenuItem[];
}

interface MegaMenuProps {
  navigation: readonly MegaMenuGroup[];
}

const iconMap: Record<
  string,
  ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>
> = {
  "All Services": LayoutGrid,
  "Website Development": Globe2,
  "Local SEO": MapPin,
  "AI Automation": Bot,
  Projects: BriefcaseBusiness,
  "Tha Shop Case Study": Wrench,
  Blog: Newspaper,
  Investment: CircleDollarSign,
  "Website Growth Audit": FileSearch,
  About: Info,
  Contact: MessageCircle,
};

function getItemIcon(
  itemName: string,
) {
  return iconMap[itemName] ?? Sparkles;
}

function shouldUseWideLayout(
  group: MegaMenuGroup,
) {
  return group.items.length >= 3;
}

export function MegaMenu({
  navigation,
}: MegaMenuProps) {
  const [openMenu, setOpenMenu] =
    useState<string | null>(null);

  const closeTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(
        closeTimer.current,
      );

      closeTimer.current = null;
    }
  }

  function open(
    groupName: string,
  ) {
    cancelClose();
    setOpenMenu(groupName);
  }

  function scheduleClose() {
    cancelClose();

    closeTimer.current =
      setTimeout(() => {
        setOpenMenu(null);
      }, 120);
  }

  function closeImmediately() {
    cancelClose();
    setOpenMenu(null);
  }

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );

      cancelClose();
    };
  }, []);

  return (
    <>
      {openMenu ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={
            closeImmediately
          }
          className="fixed inset-x-0 bottom-0 top-16 z-30 hidden cursor-default bg-slate-950/10 backdrop-blur-[1px] lg:block"
        />
      ) : null}

      <nav
        aria-label="Primary navigation"
        className="relative z-50 hidden flex-1 items-center justify-center gap-1 lg:flex"
      >
        {navigation.map(
          (group) => {
            const isOpen =
              openMenu ===
              group.name;

            const wide =
              shouldUseWideLayout(
                group,
              );

            return (
              <div
                key={
                  group.name
                }
                className="relative"
                onMouseEnter={() =>
                  open(
                    group.name,
                  )
                }
                onMouseLeave={
                  scheduleClose
                }
                onFocus={() =>
                  open(
                    group.name,
                  )
                }
                onBlur={(
                  event,
                ) => {
                  const next =
                    event.relatedTarget;

                  if (
                    next instanceof
                      Node &&
                    event.currentTarget.contains(
                      next,
                    )
                  ) {
                    return;
                  }

                  scheduleClose();
                }}
              >
                <button
                  type="button"
                  aria-expanded={
                    isOpen
                  }
                  aria-haspopup="true"
                  onClick={() =>
                    setOpenMenu(
                      isOpen
                        ? null
                        : group.name,
                    )
                  }
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30",
                    isOpen
                      ? "bg-slate-100 text-brand"
                      : "text-muted hover:bg-slate-50 hover:text-brand",
                  )}
                >
                  {
                    group.name
                  }

                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      isOpen &&
                        "rotate-180",
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "absolute left-1/2 top-full -translate-x-1/2 pt-3 transition duration-150",
                    isOpen
                      ? "visible translate-y-0 opacity-100"
                      : "invisible -translate-y-1 opacity-0",
                    wide
                      ? "w-[590px]"
                      : "w-[340px]",
                  )}
                >
                  <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-950/[0.02]">
                    <div className="px-5 pb-3 pt-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
                        {
                          group.name
                        }
                      </p>
                    </div>

                    <div
                      className={cn(
                        "grid gap-1 px-3 pb-3",
                        wide &&
                          "grid-cols-2",
                      )}
                    >
                      {group.items.map(
                        (
                          item,
                        ) => {
                          const Icon =
                            getItemIcon(
                              item.name,
                            );

                          return (
                            <Link
                              key={
                                item.href
                              }
                              href={
                                item.href
                              }
                              onClick={
                                closeImmediately
                              }
                              className="group/item rounded-xl p-3 transition duration-150 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue transition group-hover/item:border-brand-blue/20 group-hover/item:bg-brand-blue/10">
                                  <Icon
                                    aria-hidden="true"
                                    className="size-[18px]"
                                  />
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-brand transition group-hover/item:text-brand-blue">
                                      {
                                        item.name
                                      }
                                    </p>

                                    <ArrowRight
                                      aria-hidden="true"
                                      className="size-3.5 -translate-x-1 text-slate-300 opacity-0 transition group-hover/item:translate-x-0 group-hover/item:text-brand-blue group-hover/item:opacity-100"
                                    />
                                  </div>

                                  <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {
                                      item.description
                                    }
                                  </p>
                                </div>
                              </div>
                            </Link>
                          );
                        },
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Sparkles
                          aria-hidden="true"
                          className="size-3.5 text-brand-blue"
                        />

                        Strategy.
                        Technology.
                        Growth.
                      </div>

                      {group.name ===
                      "Services" ? (
                        <Link
                          href="/services"
                          onClick={
                            closeImmediately
                          }
                          className="group/footer flex items-center gap-1.5 text-xs font-semibold text-brand-blue transition hover:text-brand"
                        >
                          View all
                          services

                          <ArrowRight
                            aria-hidden="true"
                            className="size-3.5 transition-transform group-hover/footer:translate-x-0.5"
                          />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          },
        )}
      </nav>
    </>
  );
}