"use client";

import type { ReactNode } from "react";
import { Play } from "lucide-react";

type YouTubeLinkPreviewProps = {
  href: string;
  videoId: string;
  /** Already processed for search highlight */
  caption: ReactNode;
};

/**
 * Inline-safe preview: thumbnail + play affordance (phrasing-only inside `<a>` for valid HTML).
 */
export function YouTubeLinkPreview({ href, videoId, caption }: YouTubeLinkPreviewProps) {
  const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group my-3 block max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-opacity hover:opacity-95"
      aria-label="Open YouTube video in a new tab"
    >
      <span className="relative block aspect-video w-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget;
            if (!el.src.includes("mqdefault")) {
              el.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }
          }}
        />
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35"
          aria-hidden
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DB2B30] text-white shadow-lg ring-2 ring-white/30">
            <Play className="h-7 w-7 pl-0.5 text-white" strokeWidth={2} aria-hidden />
          </span>
        </span>
      </span>
      <span className="flex flex-col gap-0.5 border-t border-border px-3 py-2 text-left text-sm">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
          YouTube
        </span>
        <span className="line-clamp-2 text-foreground">{caption}</span>
      </span>
    </a>
  );
}
