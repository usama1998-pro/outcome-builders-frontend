"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AppWindow, ExternalLink } from "lucide-react";

type DashboardLinkCardProps = {
  href: string;
  caption: ReactNode;
};

/**
 * In-app paths like `/dashboard/...` open in the same app with a card matching YouTube / external cards.
 */
export function DashboardLinkCard({ href, caption }: DashboardLinkCardProps) {
  return (
    <Link
      href={href}
      className="group my-3 flex max-w-lg flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-opacity hover:opacity-95"
      aria-label="Open in app"
    >
      <span className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#DB2B30]/10 text-[#DB2B30]">
          <AppWindow className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            In app
          </span>
          <span className="block truncate font-mono text-xs text-muted-foreground">{href}</span>
        </span>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </span>
      <span className="px-3 py-2 text-left text-sm leading-snug text-foreground">
        <span className="line-clamp-3">{caption}</span>
      </span>
    </Link>
  );
}
