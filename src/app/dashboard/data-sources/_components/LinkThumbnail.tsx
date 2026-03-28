"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileAudio, FileVideo, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function youtubeThumbFromUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be" || u.hostname.endsWith(".youtu.be")) {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/watch")) {
        const v = u.searchParams.get("v");
        return v ? `https://i.ytimg.com/vi/${v}/hqdefault.jpg` : null;
      }
      if (u.pathname.startsWith("/embed/")) {
        const id = u.pathname.split("/")[2];
        return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
      }
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/")[2];
        return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function isVimeoUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes("vimeo.com");
  } catch {
    return false;
  }
}

function faviconUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(u.origin)}`;
  } catch {
    return null;
  }
}

type LinkThumbnailProps = {
  url: string;
  className?: string;
};

/** Same footprint as link thumbnails — for uploaded MP4 rows (no URL preview). */
export function Mp4FilePreview({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="MP4 video file"
      title="MP4 video file"
      className={cn(
        "flex h-14 w-[96px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-muted/50",
        className,
      )}
    >
      <FileVideo className="h-7 w-7 text-[#DB2B30]" aria-hidden />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">MP4</span>
    </div>
  );
}

/** Same footprint as MP4 preview — for uploaded audio rows (no URL preview). */
export function AudioFilePreview({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Audio file"
      title="Audio file"
      className={cn(
        "flex h-14 w-[96px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-muted/50",
        className,
      )}
    >
      <FileAudio className="h-7 w-7 text-[#DB2B30]" aria-hidden />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Audio</span>
    </div>
  );
}

/**
 * Preview for external video or link URLs: YouTube (static thumb), Vimeo (oEmbed),
 * otherwise site favicon or link icon.
 */
export function LinkThumbnail({ url, className }: LinkThumbnailProps) {
  const yt = youtubeThumbFromUrl(url);
  const [vimeoThumb, setVimeoThumb] = useState<string | null>(null);
  const [vimeoSettled, setVimeoSettled] = useState(false);

  const vimeo = !yt && isVimeoUrl(url);

  useEffect(() => {
    if (yt || !isVimeoUrl(url)) {
      setVimeoThumb(null);
      setVimeoSettled(true);
      return;
    }
    setVimeoSettled(false);
    let cancelled = false;
    fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { thumbnail_url?: string }) => {
        if (!cancelled && j.thumbnail_url) setVimeoThumb(j.thumbnail_url);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setVimeoSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url, yt]);

  const fav = faviconUrl(url);
  const src = yt || vimeoThumb;

  const content = (() => {
    if (src) {
      return (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      );
    }
    if (vimeo && !vimeoSettled) {
      return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />;
    }
    if (fav) {
      return <img src={fav} alt="" className="h-8 w-8" loading="lazy" />;
    }
    return <ExternalLink className="h-5 w-5 text-muted-foreground" aria-hidden />;
  })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={url}
      className={cn(
        "flex h-14 w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/50",
        className,
      )}
    >
      {content}
    </a>
  );
}
