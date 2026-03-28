"use client";

import { BsFileEarmark } from "react-icons/bs";
import { PiMicrosoftWordLogo } from "react-icons/pi";
import { SiAdobeacrobatreader } from "react-icons/si";
import { TbFileTypeTxt } from "react-icons/tb";
import { cn } from "@/lib/utils";

export type DocumentKind = "pdf" | "word" | "text" | "other";

/** Map MIME / filename to a coarse kind for icons (matches allowed uploads). */
export function classifyDocumentKind(mime?: string | null, fileName?: string | null): DocumentKind {
  const m = (mime || "").toLowerCase();
  const ext = (fileName || "").split(".").pop()?.toLowerCase() ?? "";
  if (m.includes("pdf") || ext === "pdf") return "pdf";
  if (m.includes("wordprocessingml") || m === "application/msword" || ext === "doc" || ext === "docx") {
    return "word";
  }
  if (m.includes("text/plain") || ext === "txt") return "text";
  return "other";
}

type DocumentFileIconProps = {
  kind: DocumentKind;
  className?: string;
};

/**
 * Brand-style file icons: Adobe Acrobat Reader (PDF), Microsoft Word logo, TXT file type, generic file.
 */
export function DocumentFileIcon({ kind, className }: DocumentFileIconProps) {
  const base = "h-5 w-5 shrink-0";
  switch (kind) {
    case "pdf":
      return (
        <SiAdobeacrobatreader
          className={cn(base, "text-[#E31837]", className)}
          aria-hidden
          title="Adobe PDF"
        />
      );
    case "word":
      return (
        <PiMicrosoftWordLogo
          className={cn(base, "text-[#185ABD]", className)}
          aria-hidden
          title="Microsoft Word"
        />
      );
    case "text":
      return (
        <TbFileTypeTxt
          className={cn(base, "text-slate-600 dark:text-slate-400", className)}
          aria-hidden
          title="Plain text"
        />
      );
    default:
      return (
        <BsFileEarmark className={cn(base, "text-muted-foreground", className)} aria-hidden title="File" />
      );
  }
}
