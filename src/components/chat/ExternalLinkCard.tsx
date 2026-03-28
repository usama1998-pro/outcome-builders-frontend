"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ExternalLink, Globe } from "lucide-react";

type ExternalLinkCardProps = {
  href: string;
  caption: ReactNode;
};

function hostnameFromHref(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

function faviconUrlForHost(host: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

/**
 * Card aligned with YouTubeLinkPreview: site favicon (web icon) + hostname + caption.
 */
export function ExternalLinkCard({ href, caption }: ExternalLinkCardProps) {
  const host = hostnameFromHref(href);
  const faviconSrc = faviconUrlForHost(host);
  const [faviconFailed, setFaviconFailed] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group my-3 flex max-w-lg flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-opacity hover:opacity-95"
      aria-label={`Open ${host} in a new tab`}
    >
      <span className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-3">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-border dark:bg-muted">
          {!faviconFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={faviconSrc}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setFaviconFailed(true)}
            />
          ) : (
            <Globe className="h-6 w-6 text-[#DB2B30]" strokeWidth={2} aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Web
          </span>
          <span className="block truncate text-xs text-muted-foreground">{host}</span>
        </span>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </span>
      <span className="px-3 py-2 text-left text-sm leading-snug text-foreground">
        <span className="line-clamp-3">{caption}</span>
      </span>
    </a>
  );
}
