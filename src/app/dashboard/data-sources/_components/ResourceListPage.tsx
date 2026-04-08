"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import RequireAuth from "@/src/components/auth/requireAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Braces,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  FileAudio,
  FileText,
  FileVideo,
  Film,
  Globe,
  Link2,
  Loader2,
  MoreVertical,
  Music2,
  Plus,
  StickyNote,
  Table2,
  Youtube,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getResourceType, ResourceTypeId } from "./resourceTypes";
import { DataContextSlug, getDataContext } from "./dataContextConfig";
import AddResourceDialog from "./AddResourceDialog";
import { DocumentFileIcon, type DocumentKind, classifyDocumentKind } from "./DocumentFileIcon";
import { LinkThumbnail, Mp4FilePreview } from "./LinkThumbnail";
import {
  deleteBusinessContextMediaSourcesBulk,
  deleteBusinessContextMediaSource,
  deleteBusinessContextNote,
  deleteBusinessContextNotesBulk,
  listBusinessContextMediaSources,
  listBusinessContextNotes,
  trainBusinessContextMediaSource,
  trainBusinessContextNote,
  updateBusinessContextMediaSourceTitle,
  updateBusinessContextNoteTitle,
  type BusinessContextMediaListItem,
  type BusinessContextNoteListItem,
} from "@/src/api/businessContext";

type ResourceListPageProps = {
  contextSlug: DataContextSlug;
  resourceTypeId: ResourceTypeId;
};

function formatUpdated(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatFileSizeDisplay(bytes: number | null | undefined): string {
  if (bytes == null || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Wall-clock length for audio (and similar) from stored seconds. */
function formatDurationSeconds(sec: number | null | undefined): string {
  if (sec == null || sec < 0 || !Number.isFinite(sec)) return "—";
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rs = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(rs).padStart(2, "0")}`;
  return `${m}:${String(rs).padStart(2, "0")}`;
}

/** Human-readable document type for Files (PDF, Word, plain text) from MIME or filename. */
function documentTypeLabel(mime?: string | null, fileName?: string | null): string {
  const m = (mime || "").toLowerCase();
  if (m.includes("pdf")) return "PDF";
  if (m.includes("wordprocessingml") || m === "application/msword") return "Word";
  if (m.includes("text/plain")) return "Plain text";

  const ext = (fileName || "").split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "PDF";
  if (ext === "doc" || ext === "docx") return "Word";
  if (ext === "txt") return "Plain text";

  if (mime) {
    const parts = mime.split("/");
    if (parts.length === 2) {
      const sub = parts[1].replace("vnd.openxmlformats-officedocument.", "");
      return sub.length > 28 ? `${sub.slice(0, 25)}…` : sub;
    }
  }
  if (ext) return ext.toUpperCase();
  return "File";
}

function safeUrl(href: string | undefined): URL | null {
  if (!href?.trim()) return null;
  try {
    return new URL(href.trim());
  } catch {
    return null;
  }
}

function isYoutubeHost(host: string): boolean {
  return host === "youtu.be" || host.endsWith(".youtube.com") || host === "youtube.com";
}

function isVimeoHost(host: string): boolean {
  return host.includes("vimeo.com");
}

function isSoundCloudHost(host: string): boolean {
  return host.includes("soundcloud.com");
}

type FormatCell =
  | { variant: "lucide"; label: string; Icon: LucideIcon }
  | { variant: "document"; label: string; kind: DocumentKind };

function mediaFormatCell(
  resourceTypeId: ResourceTypeId,
  m: BusinessContextMediaListItem,
): FormatCell {
  const url = m.source_url?.trim();
  const u = url ? safeUrl(url) : null;
  const host = u?.hostname.toLowerCase() ?? "";
  const fn = (m.file_name || "").toLowerCase();
  const mime = (m.file_type || "").toLowerCase();
  const ext = fn.includes(".") ? (fn.split(".").pop() ?? "") : "";

  if (resourceTypeId === "links") {
    if (u && isYoutubeHost(host)) return { variant: "lucide", label: "YouTube", Icon: Youtube };
    if (u && isVimeoHost(host)) return { variant: "lucide", label: "Vimeo", Icon: Film };
    if (url) return { variant: "lucide", label: "Web link", Icon: Globe };
    return { variant: "lucide", label: "Link", Icon: Link2 };
  }

  if (resourceTypeId === "video") {
    if (url) {
      if (isYoutubeHost(host)) return { variant: "lucide", label: "YouTube", Icon: Youtube };
      if (isVimeoHost(host)) return { variant: "lucide", label: "Vimeo", Icon: Film };
      return { variant: "lucide", label: "Video URL", Icon: Link2 };
    }
    if (fn.endsWith(".mp4") || mime.includes("mp4")) return { variant: "lucide", label: "MP4", Icon: FileVideo };
    return { variant: "lucide", label: "Video file", Icon: FileVideo };
  }

  if (resourceTypeId === "audio") {
    if (url) {
      if (isSoundCloudHost(host)) return { variant: "lucide", label: "SoundCloud", Icon: Music2 };
      return { variant: "lucide", label: "Audio URL", Icon: Link2 };
    }
    const audioLabels: Record<string, string> = {
      mp3: "MP3",
      wav: "WAV",
      m4a: "M4A",
      aac: "AAC",
      ogg: "OGG",
      flac: "FLAC",
      webm: "WebM",
    };
    if (ext && audioLabels[ext]) return { variant: "lucide", label: audioLabels[ext], Icon: FileAudio };
    if (mime.startsWith("audio/")) {
      const sub = mime.replace(/^audio\//, "").split(";")[0];
      const short = sub.length > 12 ? `${sub.slice(0, 10)}…` : sub;
      return { variant: "lucide", label: short.toUpperCase() || "Audio", Icon: FileAudio };
    }
    return { variant: "lucide", label: "Audio file", Icon: FileAudio };
  }

  if (resourceTypeId === "structured") {
    if (url) return { variant: "lucide", label: "URL", Icon: Link2 };
    if (fn.endsWith(".json") || mime.includes("json")) return { variant: "lucide", label: "JSON", Icon: Braces };
    if (fn.endsWith(".csv") || mime.includes("csv")) return { variant: "lucide", label: "CSV", Icon: Table2 };
    if (fn) return { variant: "lucide", label: "Data file", Icon: Database };
    return { variant: "lucide", label: "Text", Icon: FileText };
  }

  if (resourceTypeId === "files") {
    const kind = classifyDocumentKind(m.file_type, m.file_name);
    return { variant: "document", label: documentTypeLabel(m.file_type, m.file_name), kind };
  }

  return { variant: "lucide", label: "—", Icon: FileText };
}

type ListRow = {
  id: string;
  name: string;
  updated: string;
  /** Notes + document files: knowledge-base training state */
  isTrained?: boolean;
  fileTypeLabel?: string;
  sizeLabel?: string;
  /** Audio list: formatted duration (uploads with detected length). */
  durationLabel?: string;
  /** Video list: external URL for thumbnail; null/empty means uploaded file preview. */
  videoPreviewUrl?: string | null;
  /** Links list: URL to open in a new tab. */
  linkUrl?: string | null;
  format: FormatCell | { variant: "note" };
};

function VideoRowPreview({ url }: { url: string | null | undefined }) {
  const trimmed = url?.trim();
  if (trimmed) return <LinkThumbnail url={trimmed} />;
  return <Mp4FilePreview />;
}

function FormatColumnCell({ format }: { format: ListRow["format"] }) {
  if (format.variant === "note") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <StickyNote className="h-3.5 w-3.5 shrink-0 text-[#DB2B30]" aria-hidden />
        <span>Note</span>
      </div>
    );
  }
  if (format.variant === "document") {
    return (
      <div className="flex items-center gap-2">
        <DocumentFileIcon kind={format.kind} className="shrink-0" />
        <span className="text-muted-foreground">{format.label}</span>
      </div>
    );
  }
  const Icon = format.Icon;
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-[#DB2B30]" aria-hidden />
      <span className="text-muted-foreground">{format.label}</span>
    </div>
  );
}

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_SIZE = 20;

export default function ResourceListPage({ contextSlug, resourceTypeId }: ResourceListPageProps) {
  const ctx = getDataContext(contextSlug);
  const typeMeta = getResourceType(resourceTypeId);
  const TypeIcon = typeMeta.icon;
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [audioTypeFilter, setAudioTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [renameTarget, setRenameTarget] = useState<{ id: number; name: string } | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renamePending, setRenamePending] = useState(false);
  const [trainPendingId, setTrainPendingId] = useState<number | null>(null);

  const title = ctx?.title ?? "Context";
  const isFiles = resourceTypeId === "files";
  const isAudio = resourceTypeId === "audio";
  const isVideo = resourceTypeId === "video";
  const isNotes = resourceTypeId === "notes";
  const isLinks = resourceTypeId === "links";
  /** Train/Untrain matches workspace notes: only notes (content) and document files. */
  const supportsTrain = isNotes || isFiles;
  /** Multi-select + bulk remove (files, video, audio, notes, links). */
  const supportsBulkSelect = isFiles || isVideo || isAudio || isNotes || isLinks;
  const tableColCount = isFiles
    ? isSelectionMode
      ? 6
      : 5
    : isVideo
      ? isSelectionMode
        ? 6
        : 5
      : isAudio
        ? isSelectionMode
          ? 7
          : 6
        : isNotes
          ? isSelectionMode
            ? 5
            : 4
          : isLinks
            ? isSelectionMode
              ? 5
              : 4
            : 4;

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const audioTypeParam =
    isAudio && audioTypeFilter !== "all" ? audioTypeFilter : undefined;

  useEffect(() => {
    setAudioTypeFilter("all");
  }, [resourceTypeId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, audioTypeFilter, resourceTypeId]);

  useEffect(() => {
    setSelectedRowIds(new Set());
  }, [contextSlug, resourceTypeId, page, debouncedSearch, audioTypeFilter]);

  useEffect(() => {
    if (!isSelectionMode) setSelectedRowIds(new Set());
  }, [isSelectionMode]);

  useEffect(() => {
    if (!supportsBulkSelect) setIsSelectionMode(false);
  }, [supportsBulkSelect]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: [
      "businessContextResources",
      contextSlug,
      resourceTypeId,
      debouncedSearch,
      page,
      PAGE_SIZE,
      audioTypeParam,
    ],
    queryFn: async () => {
      if (resourceTypeId === "notes") {
        return listBusinessContextNotes(contextSlug, {
          q: debouncedSearch || undefined,
          page,
          page_size: PAGE_SIZE,
        });
      }
      return listBusinessContextMediaSources(contextSlug, resourceTypeId, {
        q: debouncedSearch || undefined,
        page,
        page_size: PAGE_SIZE,
        audio_type: audioTypeParam,
      });
    },
    enabled: true,
  });

  const rawItems = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const rows: ListRow[] = useMemo(() => {
    let list: ListRow[] = [];

    if (resourceTypeId === "notes") {
      const notes = rawItems as BusinessContextNoteListItem[];
      list = notes.map((n) => ({
        id: String(n.id),
        name: n.title,
        updated: formatUpdated(n.created_at),
        isTrained: n.is_trained === true,
        format: { variant: "note" as const },
      }));
    } else {
      const media = rawItems as BusinessContextMediaListItem[];
      list = media.map((m) => ({
        id: String(m.id),
        name: m.title,
        updated: formatUpdated(m.created_at),
        isTrained: m.is_trained === true,
        fileTypeLabel: isFiles ? documentTypeLabel(m.file_type, m.file_name) : undefined,
        sizeLabel:
          isFiles || resourceTypeId === "audio" ? formatFileSizeDisplay(m.file_size) : undefined,
        durationLabel: resourceTypeId === "audio" ? formatDurationSeconds(m.duration_seconds) : undefined,
        videoPreviewUrl: isVideo ? (m.source_url?.trim() || null) : undefined,
        linkUrl: isLinks ? (m.source_url?.trim() || null) : undefined,
        format: mediaFormatCell(resourceTypeId, m),
      }));
    }

    return list;
  }, [rawItems, resourceTypeId, isFiles, isVideo, isNotes, isLinks]);

  const handleSaved = () => {
    void queryClient.invalidateQueries({
      queryKey: ["businessContextResources", contextSlug, resourceTypeId],
    });
    void queryClient.invalidateQueries({ queryKey: ["contextResourceCounts"] });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      if (resourceTypeId === "notes") {
        await deleteBusinessContextNote(deleteTarget.id);
      } else {
        await deleteBusinessContextMediaSource(deleteTarget.id);
      }
      toast.success("Resource removed");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({
        queryKey: ["businessContextResources", contextSlug, resourceTypeId],
      });
      void queryClient.invalidateQueries({ queryKey: ["contextResourceCounts"] });
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(typeof detail === "string" ? detail : "Failed to remove resource");
    } finally {
      setDeletePending(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedRowIds.size === 0) return;
    setDeletePending(true);
    const ids = Array.from(selectedRowIds)
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    try {
      const result = isNotes
        ? await deleteBusinessContextNotesBulk(ids)
        : await deleteBusinessContextMediaSourcesBulk(ids);
      const removed = result?.removed_count ?? ids.length;
      const unit = isFiles
        ? "file"
        : isVideo
          ? "video"
          : isAudio
            ? "audio item"
            : isNotes
              ? "note"
              : isLinks
                ? "link"
                : "item";
      toast.success(`${removed} ${unit}${removed === 1 ? "" : "s"} removed`);

      setSelectedRowIds(new Set());
      setBulkDeleteOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ["businessContextResources", contextSlug, resourceTypeId],
      });
      void queryClient.invalidateQueries({ queryKey: ["contextResourceCounts"] });
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(typeof detail === "string" ? detail : "Failed to remove selected items");
    } finally {
      setDeletePending(false);
    }
  };

  const getApiErrorDetail = (err: unknown): string | undefined => {
    if (err && typeof err === "object" && "response" in err) {
      const r = err as { response?: { data?: { detail?: string | string[] } } };
      const d = r.response?.data?.detail;
      if (typeof d === "string") return d;
      if (Array.isArray(d) && d.length) return String(d[0]);
    }
    return undefined;
  };

  const handleTrain = async (id: number) => {
    setTrainPendingId(id);
    try {
      const res =
        resourceTypeId === "notes"
          ? await trainBusinessContextNote(id)
          : await trainBusinessContextMediaSource(id);
      const successMsg = res?.data?.message ?? res?.message;
      toast.success(
        typeof successMsg === "string" && successMsg.trim()
          ? successMsg
          : "Training updated successfully.",
      );
      void queryClient.invalidateQueries({
        queryKey: ["businessContextResources", contextSlug, resourceTypeId],
      });
      void queryClient.invalidateQueries({ queryKey: ["contextResourceCounts"] });
    } catch (err: unknown) {
      toast.error(getApiErrorDetail(err) ?? "Failed to update training");
    } finally {
      setTrainPendingId(null);
    }
  };

  const handleRenameSave = async () => {
    if (!renameTarget) return;
    const t = renameTitle.trim();
    if (!t) {
      toast.error("Title is required");
      return;
    }
    setRenamePending(true);
    try {
      if (resourceTypeId === "notes") {
        await updateBusinessContextNoteTitle(renameTarget.id, { title: t });
      } else {
        await updateBusinessContextMediaSourceTitle(renameTarget.id, { title: t });
      }
      toast.success("Renamed");
      setRenameTarget(null);
      setRenameTitle("");
      void queryClient.invalidateQueries({
        queryKey: ["businessContextResources", contextSlug, resourceTypeId],
      });
    } catch (err: unknown) {
      toast.error(getApiErrorDetail(err) ?? "Failed to rename");
    } finally {
      setRenamePending(false);
    }
  };

  const visibleRowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const selectedVisibleCount = useMemo(
    () => visibleRowIds.filter((id) => selectedRowIds.has(id)).length,
    [visibleRowIds, selectedRowIds],
  );
  const allVisibleSelected = visibleRowIds.length > 0 && selectedVisibleCount === visibleRowIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  return (
    <RequireAuth>
      <div className="flex w-full flex-col gap-6 p-6">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href={`/dashboard/data-sources/${contextSlug}`} className="hover:text-foreground">
            {title}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="font-medium text-foreground">{typeMeta.label}</span>
        </nav>

        <div className="flex flex-col gap-4 border-b border-dashed pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#DB2B30]/10 p-2">
              <TypeIcon className="h-6 w-6 text-[#DB2B30]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{typeMeta.label}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{typeMeta.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Context: <span className="font-medium text-foreground">{title}</span>
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="shrink-0 bg-[#DB2B30] text-white hover:bg-[#B52227]"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {typeMeta.label}
          </Button>
        </div>

        {/* Search (+ audio type on audio list) */}
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <label htmlFor="resource-search" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="resource-search"
              className="w-full"
              placeholder="Search titles and content…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          {isAudio ? (
            <div className="w-full shrink-0 space-y-2 sm:w-48">
              <span className="text-sm font-medium">Audio type</span>
              <Select
                value={audioTypeFilter}
                onValueChange={(value) => setAudioTypeFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="m4a">M4A</SelectItem>
                  <SelectItem value="aac">AAC</SelectItem>
                  <SelectItem value="ogg">OGG</SelectItem>
                  <SelectItem value="flac">FLAC</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {supportsBulkSelect ? (
            isSelectionMode ? (
              <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1 sm:flex-none"
                  disabled={selectedRowIds.size === 0 || deletePending}
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  Remove selected ({selectedRowIds.size})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => setIsSelectionMode(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full shrink-0 sm:w-auto"
                onClick={() => setIsSelectionMode(true)}
              >
                {isFiles
                  ? "Select files"
                  : isVideo
                    ? "Select videos"
                    : isAudio
                      ? "Select audio"
                      : isNotes
                        ? "Select notes"
                        : isLinks
                          ? "Select links"
                          : "Select"}
              </Button>
            )
          ) : null}
        </div>

        {/* List — shadcn Card + Table */}
        <Card
          className={cn(
            "relative overflow-hidden p-0 gap-0 shadow-sm transition-opacity",
            isFetching && !isLoading && "opacity-70",
          )}
        >
          {isFetching && !isLoading ? (
            <div className="pointer-events-none absolute right-3 top-3 z-10">
              <Loader2 className="h-4 w-4 animate-spin text-[#DB2B30]" aria-hidden />
            </div>
          ) : null}
          <CardContent className="p-0">
            <Table>
            <TableHeader>
              <TableRow>
                {supportsBulkSelect && isSelectionMode ? (
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Select all on this page"
                      checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                      onCheckedChange={(checked) => {
                        setSelectedRowIds((prev) => {
                          const next = new Set(prev);
                          if (checked) {
                            visibleRowIds.forEach((id) => next.add(id));
                          } else {
                            visibleRowIds.forEach((id) => next.delete(id));
                          }
                          return next;
                        });
                      }}
                    />
                  </TableHead>
                ) : null}
                {isVideo ? (
                  <TableHead className="w-[104px] min-w-[104px] text-muted-foreground">Preview</TableHead>
                ) : null}
                <TableHead>Name</TableHead>
                {isFiles ? (
                  <>
                    <TableHead className="hidden sm:table-cell">Format</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Size</TableHead>
                  </>
                ) : isAudio ? (
                  <>
                    <TableHead className="hidden sm:table-cell">Format</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Duration</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Size</TableHead>
                  </>
                ) : isLinks ? (
                  <TableHead className="min-w-30 whitespace-nowrap">Link</TableHead>
                ) : (
                  <TableHead className="hidden sm:table-cell">Format</TableHead>
                )}
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={tableColCount} className="h-32 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#DB2B30]" />
                    <span className="mt-2 block text-sm">Loading…</span>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={tableColCount} className="h-32 text-center text-destructive">
                    {(error as Error)?.message || "Failed to load resources."}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableColCount} className="h-32 text-center text-muted-foreground">
                    {debouncedSearch ? (
                      <>
                        No matches for &quot;{debouncedSearch}&quot;. Try a different search.
                      </>
                    ) : (
                      <>
                        No resources yet. Use <strong className="text-foreground">Add {typeMeta.label}</strong>{" "}
                        to create one.
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} data-state={selectedRowIds.has(row.id) ? "selected" : undefined}>
                    {supportsBulkSelect && isSelectionMode ? (
                      <TableCell className="w-10">
                        <Checkbox
                          aria-label={`Select ${row.name}`}
                          checked={selectedRowIds.has(row.id)}
                          onCheckedChange={(checked) => {
                            setSelectedRowIds((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(row.id);
                              else next.delete(row.id);
                              return next;
                            });
                          }}
                        />
                      </TableCell>
                    ) : null}
                    {isVideo ? (
                      <TableCell className="w-[104px] min-w-[104px] align-middle py-2">
                        <VideoRowPreview url={row.videoPreviewUrl} />
                      </TableCell>
                    ) : null}
                    <TableCell className="font-medium">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="min-w-0 break-words">{row.name}</span>
                          {supportsTrain && trainPendingId === Number(row.id) ? (
                            <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                              Training…
                            </span>
                          ) : supportsTrain && row.isTrained ? (
                            <span className="shrink-0 rounded-md border border-[#DB2B30]/35 bg-[#DB2B30]/10 px-2 py-0.5 text-xs font-medium text-[#DB2B30]">
                              Trained
                            </span>
                          ) : null}
                        </div>
                        {isFiles && (row.fileTypeLabel || row.sizeLabel) ? (
                          <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                            {[row.fileTypeLabel, row.sizeLabel].filter(Boolean).join(" · ")}
                          </div>
                        ) : null}
                        {isAudio ? (
                          <div className="mt-1 space-y-1 sm:hidden">
                            <FormatColumnCell format={row.format} />
                            <div className="text-xs text-muted-foreground">
                              <span className="tabular-nums">{row.durationLabel}</span>
                              <span className="mx-1.5 text-muted-foreground/60">·</span>
                              <span className="tabular-nums">{row.sizeLabel}</span>
                            </div>
                          </div>
                        ) : !isFiles && !isLinks ? (
                          <div className="mt-1 sm:hidden">
                            <FormatColumnCell format={row.format} />
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    {isFiles ? (
                      <>
                        <TableCell className="hidden sm:table-cell">
                          <FormatColumnCell format={row.format} />
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                          {row.sizeLabel ?? "—"}
                        </TableCell>
                      </>
                    ) : isAudio ? (
                      <>
                        <TableCell className="hidden sm:table-cell">
                          <FormatColumnCell format={row.format} />
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                          {row.durationLabel ?? "—"}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                          {row.sizeLabel ?? "—"}
                        </TableCell>
                      </>
                    ) : isLinks ? (
                      <TableCell className="min-w-30 align-middle">
                        {row.linkUrl ? (
                          safeUrl(row.linkUrl) ? (
                            <a
                              href={row.linkUrl.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={row.linkUrl.trim()}
                              className="inline-flex max-w-full items-center gap-1.5 text-left text-sm font-normal text-[#DB2B30] underline-offset-4 hover:underline"
                              aria-label={`Open link in new tab: ${row.linkUrl}`}
                            >
                              <ExternalLink className="h-4 w-4 shrink-0 text-[#DB2B30]" aria-hidden />
                              <span>Open link</span>
                            </a>
                          ) : (
                            <span
                              className="inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground"
                              title={row.linkUrl}
                              aria-label={`Invalid URL: ${row.linkUrl}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                              <span>Invalid link</span>
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ) : (
                      <TableCell className="hidden sm:table-cell">
                        <FormatColumnCell format={row.format} />
                      </TableCell>
                    )}
                    <TableCell className="text-right text-muted-foreground">{row.updated}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            aria-label={`Actions for ${row.name}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            disabled={supportsTrain && !!row.isTrained}
                            title={
                              supportsTrain && row.isTrained
                                ? "Untrain this resource before removing it."
                                : undefined
                            }
                            onClick={() => setDeleteTarget({ id: Number(row.id), name: row.name })}
                          >
                            Remove
                          </DropdownMenuItem>
                          {supportsTrain ? (
                            <DropdownMenuItem
                              className={cn(
                                "cursor-pointer",
                                row.isTrained ? "text-[#DB2B30] focus:text-[#DB2B30]" : "",
                                trainPendingId === Number(row.id) ? "opacity-60" : "",
                              )}
                              disabled={trainPendingId === Number(row.id)}
                              onClick={() => void handleTrain(Number(row.id))}
                            >
                              {trainPendingId === Number(row.id) ? (
                                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
                              ) : (
                                <Brain className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                              )}
                              {trainPendingId === Number(row.id)
                                ? "Processing…"
                                : isNotes
                                  ? row.isTrained
                                    ? "Untrain content"
                                    : "Train content"
                                  : row.isTrained
                                    ? "Untrain file"
                                    : "Train file"}
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            onClick={() => {
                              setRenameTarget({ id: Number(row.id), name: row.name });
                              setRenameTitle(row.name);
                            }}
                          >
                            Rename
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </CardContent>
          {!isLoading && !isError && total > 0 ? (
            <CardFooter className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="min-w-28 text-center text-sm text-muted-foreground tabular-nums">
                  Page {page} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          ) : null}
        </Card>

        <AddResourceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          contextName={`${title} · ${typeMeta.label}`}
          contextSlug={contextSlug}
          resourceType={resourceTypeId}
          onSaved={handleSaved}
        />

        <Dialog
          open={!!renameTarget}
          onOpenChange={(open) => {
            if (!open) {
              setRenameTarget(null);
              setRenameTitle("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-1">
              <Label htmlFor="rename-title">Title</Label>
              <Input
                id="rename-title"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleRenameSave();
                  }
                }}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[#DB2B30] text-white hover:bg-[#B52227]"
                disabled={renamePending}
                onClick={() => void handleRenameSave()}
              >
                {renamePending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this resource?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove{" "}
                <span className="font-medium text-foreground">{deleteTarget?.name ?? "this item"}</span>.
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deletePending}
                onClick={(e) => {
                  e.preventDefault();
                  void handleConfirmDelete();
                }}
              >
                {deletePending ? "Removing…" : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isFiles
                  ? "Remove selected files?"
                  : isVideo
                    ? "Remove selected videos?"
                    : isAudio
                      ? "Remove selected audio?"
                      : isNotes
                        ? "Remove selected notes?"
                        : isLinks
                          ? "Remove selected links?"
                          : "Remove selected items?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove{" "}
                <span className="font-medium text-foreground">
                  {selectedRowIds.size}{" "}
                  {isFiles
                    ? `file${selectedRowIds.size === 1 ? "" : "s"}`
                    : isVideo
                      ? `video${selectedRowIds.size === 1 ? "" : "s"}`
                      : isAudio
                        ? `audio item${selectedRowIds.size === 1 ? "" : "s"}`
                        : isNotes
                          ? `note${selectedRowIds.size === 1 ? "" : "s"}`
                          : isLinks
                            ? `link${selectedRowIds.size === 1 ? "" : "s"}`
                            : `item${selectedRowIds.size === 1 ? "" : "s"}`}
                </span>
                . This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deletePending || selectedRowIds.size === 0}
                onClick={(e) => {
                  e.preventDefault();
                  void handleConfirmBulkDelete();
                }}
              >
                {deletePending ? "Removing…" : "Remove selected"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RequireAuth>
  );
}
