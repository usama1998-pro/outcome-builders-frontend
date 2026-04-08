"use client";

import { useEffect, useRef, useState } from "react";
import { resolveTitleFromUrl, titleFromFileName } from "./extractLinkTitle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { RESOURCE_TYPES, ResourceTypeId, getResourceType } from "./resourceTypes";
import { DataContextSlug } from "./dataContextConfig";
import { createBusinessContextMediaSource, createBusinessContextNote } from "@/src/api/businessContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

/** Combined accept for file picker + drag-drop (PDF, Word, plain text only). */
const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

const ALLOWED_DOC_EXT = new Set(["pdf", "doc", "docx", "txt"]);

const ALLOWED_DOC_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

function isAllowedDocumentFile(file: File): boolean {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  if (ext && ALLOWED_DOC_EXT.has(ext)) return true;
  const t = (file.type || "").toLowerCase();
  if (t && ALLOWED_DOC_MIME.has(t)) return true;
  return false;
}

const VIDEO_ACCEPT = ".mp4,video/mp4";

function isAllowedMp4Video(file: File): boolean {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  if (ext === "mp4") return true;
  return (file.type || "").toLowerCase() === "video/mp4";
}

/** Matches AUDIO_FORMATS — used when saving so uploads align with list preview expectations. */
function isAllowedAudioFile(file: File): boolean {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  const allowedExt = new Set(["mp3", "wav", "m4a", "aac", "ogg", "flac", "webm"]);
  if (ext && allowedExt.has(ext)) return true;
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("audio/")) return true;
  if (t === "application/ogg") return true;
  return false;
}

/** Business Context uploads: documents, MP4, and audio files. */
const MAX_BUSINESS_CONTEXT_FILE_BYTES = 1.5 * 1024 * 1024;

/** Returns false and shows a toast if the file exceeds {@link MAX_BUSINESS_CONTEXT_FILE_BYTES}. */
function assertWithinBusinessContextFileLimit(file: File): boolean {
  if (file.size > MAX_BUSINESS_CONTEXT_FILE_BYTES) {
    toast.error("File size must be 1.5 MB or less.");
    return false;
  }
  return true;
}

/** Label for UI after a file is chosen (extension / MIME). */
function detectDocumentKind(file: File): string {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  if (ext === "pdf" || file.type === "application/pdf") return "PDF";
  if (
    ext === "doc" ||
    ext === "docx" ||
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "Word";
  }
  if (ext === "txt" || file.type === "text/plain") return "Plain text";
  if (ext) return ext.toUpperCase();
  return "Document";
}

type AddResourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextName: string;
  contextSlug: DataContextSlug;
  /**
   * When true (e.g. context overview), user picks type in the dialog.
   * When false (list page), `resourceType` is fixed.
   */
  allowTypeSelection?: boolean;
  /** Initial/fixed resource type. On list pages this is the only type. */
  resourceType: ResourceTypeId;
  /** Called after a resource is saved successfully (e.g. refresh list). */
  onSaved?: () => void;
};

export default function AddResourceDialog({
  open,
  onOpenChange,
  contextName,
  contextSlug,
  allowTypeSelection = false,
  resourceType,
  onSaved,
}: AddResourceDialogProps) {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ResourceTypeId>(resourceType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [primaryField, setPrimaryField] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const titleManuallyEditedRef = useRef(false);

  const effectiveType = allowTypeSelection ? selectedType : resourceType;
  /** Video, audio, links: URL / upload first, then title (same flow as video). */
  const linkFirstLayout =
    effectiveType === "video" || effectiveType === "audio" || effectiveType === "links";
  /** Upload / URL before title: video, audio, links, and document files. */
  const sourceFirstLayout = linkFirstLayout || effectiveType === "files";

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setPrimaryField("");
      setSelectedFile(null);
      titleManuallyEditedRef.current = false;
      if (allowTypeSelection) {
        setSelectedType(resourceType);
      }
    }
  }, [open, resourceType, allowTypeSelection]);

  // Type-specific fields (upload/URL) don’t apply across types when user switches on overview.
  useEffect(() => {
    if (open && allowTypeSelection) {
      setPrimaryField("");
      setSelectedFile(null);
      titleManuallyEditedRef.current = false;
    }
  }, [selectedType, open, allowTypeSelection]);

  /** Video / audio / links: suggest title from URL (oEmbed or URL heuristic). */
  useEffect(() => {
    if (!open || !linkFirstLayout) return;
    const url = primaryField.trim();
    if (!url || titleManuallyEditedRef.current) return;

    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        const resolved = await resolveTitleFromUrl(url);
        if (!cancelled && !titleManuallyEditedRef.current && resolved) {
          setTitle(resolved);
        }
      })();
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, linkFirstLayout, primaryField]);

  /** Video / audio: suggest title from file name when there is no URL. */
  useEffect(() => {
    if (!open || (effectiveType !== "video" && effectiveType !== "audio")) return;
    if (titleManuallyEditedRef.current || primaryField.trim()) return;
    if (!selectedFile) return;
    const fromFile = titleFromFileName(selectedFile);
    if (fromFile) setTitle(fromFile);
  }, [open, effectiveType, primaryField, selectedFile]);

  /** Files: suggest title from document file name (extension stripped). */
  useEffect(() => {
    if (!open || effectiveType !== "files") return;
    if (titleManuallyEditedRef.current) return;
    if (!selectedFile) return;
    const fromFile = titleFromFileName(selectedFile);
    if (fromFile) setTitle(fromFile);
  }, [open, effectiveType, selectedFile]);

  const selected = getResourceType(effectiveType);
  const SelectedIcon = selected.icon;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (effectiveType === "notes") {
        if (!title.trim()) {
          toast.error("Title is required");
          return;
        }
        if (!primaryField.trim()) {
          toast.error("Note content is required");
          return;
        }
        await createBusinessContextNote({
          title: title.trim(),
          description: description.trim() || undefined,
          content: primaryField.trim(),
          context_slug: contextSlug,
        });
      } else {
        if (effectiveType === "files") {
          if (!selectedFile) {
            toast.error("Please upload a document");
            return;
          }
          if (!isAllowedDocumentFile(selectedFile)) {
            toast.error("Only PDF, Word (.doc/.docx), and plain text (.txt) are allowed.");
            return;
          }
          if (!assertWithinBusinessContextFileLimit(selectedFile)) return;
        }
        if (effectiveType === "links" && !primaryField.trim()) {
          toast.error("URL is required");
          return;
        }
        if (effectiveType === "video") {
          if (!selectedFile && !primaryField.trim()) {
            toast.error("Add an MP4 file or a video URL");
            return;
          }
          if (selectedFile && !isAllowedMp4Video(selectedFile)) {
            toast.error("Only MP4 video files are allowed.");
            return;
          }
          if (selectedFile && !assertWithinBusinessContextFileLimit(selectedFile)) return;
        }
        if (effectiveType === "audio") {
          if (!selectedFile && !primaryField.trim()) {
            toast.error("Add an audio file or an audio URL");
            return;
          }
          if (selectedFile && !isAllowedAudioFile(selectedFile)) {
            toast.error("Unsupported audio file type.");
            return;
          }
          if (selectedFile && !assertWithinBusinessContextFileLimit(selectedFile)) return;
        }

        let resolvedTitle = title.trim();
        if (!resolvedTitle) {
          const url = primaryField.trim();
          if (url && (effectiveType === "video" || effectiveType === "links" || effectiveType === "audio")) {
            resolvedTitle = (await resolveTitleFromUrl(url)) ?? "";
          }
          if (!resolvedTitle && effectiveType === "video" && selectedFile) {
            resolvedTitle = titleFromFileName(selectedFile) ?? "";
          }
          if (!resolvedTitle && effectiveType === "audio" && selectedFile) {
            resolvedTitle = titleFromFileName(selectedFile) ?? "";
          }
          if (!resolvedTitle && effectiveType === "files" && selectedFile) {
            resolvedTitle = titleFromFileName(selectedFile) ?? "";
          }
        }
        if (!resolvedTitle) {
          toast.error(
            effectiveType === "structured"
              ? "Title is required"
              : "Add a link or file so we can set a title, or enter a title.",
          );
          return;
        }

        const mediaPayload = {
          title: resolvedTitle,
          description: description.trim() || undefined,
          context_slug: contextSlug,
          resource_type: effectiveType,
          source_url:
            effectiveType === "links" || effectiveType === "video" || effectiveType === "audio"
              ? primaryField.trim() || undefined
              : undefined,
          text_content: effectiveType === "structured" ? primaryField.trim() || undefined : undefined,
          file:
            effectiveType === "files" || effectiveType === "audio" || effectiveType === "video"
              ? selectedFile || undefined
              : undefined,
        } as const;

        await createBusinessContextMediaSource(mediaPayload);
      }

      toast.success(`${selected.label} saved successfully`);
      void queryClient.invalidateQueries({ queryKey: ["contextResourceCounts"] });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || error?.message || "Failed to save resource");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{allowTypeSelection ? "Add resource" : `Add ${selected.label}`}</DialogTitle>
          <DialogDescription>
            {allowTypeSelection ? (
              <>
                Add to <span className="font-medium text-foreground">{contextName}</span>. Choose a resource
                type, then complete the form below.
              </>
            ) : (
              <>
                Add to <span className="font-medium text-foreground">{contextName}</span>. You opened this
                from the list for <span className="font-medium text-foreground">{selected.label}</span>; fill
                in the details below.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {allowTypeSelection && (
            <div>
              <Label className="mb-2 block text-sm font-medium">Resource type</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {RESOURCE_TYPES.map(({ id, label, icon: Icon }) => {
                  const isSelected = effectiveType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedType(id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors",
                        isSelected
                          ? "border-[#DB2B30] bg-[#DB2B30]/10 ring-2 ring-[#DB2B30]/30"
                          : "border-border bg-card hover:bg-muted/50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "text-[#DB2B30]" : "text-muted-foreground"
                        )}
                      />
                      <span className="font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="rounded-md bg-background p-2">
                <SelectedIcon className="h-5 w-5 text-[#DB2B30]" />
              </div>
              <div>
                <p className="text-sm font-semibold">{selected.label}</p>
                <p className="text-xs text-muted-foreground">{selected.description}</p>
              </div>
            </div>

            {sourceFirstLayout ? (
              <>
                <TypeSpecificFields
                  resourceType={effectiveType}
                  value={primaryField}
                  onChange={setPrimaryField}
                  selectedFile={selectedFile}
                  onFileChange={setSelectedFile}
                />

                <div className="space-y-2">
                  <Label htmlFor="resource-title">Title</Label>
                  <p className="text-xs text-muted-foreground">
                    {effectiveType === "files"
                      ? "Suggested from the uploaded file name (without extension). You can edit it."
                      : effectiveType === "audio"
                        ? "Taken from the link or file name when we can detect it (e.g. hosted audio, SoundCloud). You can edit it."
                        : "Taken from the link or file name when we can detect it (e.g. YouTube, Vimeo). You can edit it."}
                  </p>
                  <Input
                    id="resource-title"
                    placeholder={
                      effectiveType === "files"
                        ? "Auto-filled from file name, or type a title"
                        : "Auto-filled from link, or type a title"
                    }
                    value={title}
                    onChange={(e) => {
                      titleManuallyEditedRef.current = true;
                      setTitle(e.target.value);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resource-description">Description (optional)</Label>
                  <Textarea
                    id="resource-description"
                    placeholder="Short summary or context"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="resource-title">Title</Label>
                  <Input
                    id="resource-title"
                    placeholder="Give this resource a name"
                    value={title}
                    onChange={(e) => {
                      titleManuallyEditedRef.current = true;
                      setTitle(e.target.value);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resource-description">Description (optional)</Label>
                  <Textarea
                    id="resource-description"
                    placeholder="Short summary or context"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none"
                  />
                </div>

                <TypeSpecificFields
                  resourceType={effectiveType}
                  value={primaryField}
                  onChange={setPrimaryField}
                  selectedFile={selectedFile}
                  onFileChange={setSelectedFile}
                />
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#DB2B30] text-white hover:bg-[#B52227]"
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? "Saving..." : `Add ${selected.label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** File input accept list — aligned with `isAllowedAudioFile`. */
const AUDIO_ACCEPT =
  ".mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/mp4,audio/aac,audio/x-m4a,audio/ogg,application/ogg,audio/flac,audio/webm";

function FileDropZone({
  accept,
  selectedFile,
  onFileChange,
  dropTitle,
  dropSubtitle,
  selectedExtra,
}: {
  accept: string;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  dropTitle: string;
  dropSubtitle?: string;
  /** Shown after the filename, e.g. “Detected: PDF”. */
  selectedExtra?: string | null;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const applyFile = (file: File | undefined | null) => {
    if (file) onFileChange(file);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        accept={accept}
        onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          applyFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 text-center text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#DB2B30]/40",
          isDragging
            ? "border-[#DB2B30] bg-[#DB2B30]/10"
            : "border-muted-foreground/25 bg-background hover:border-[#DB2B30]/40 hover:bg-muted/30"
        )}
      >
        <span className="font-medium text-foreground">{dropTitle}</span>
        {dropSubtitle ? (
          <span className="mt-1 text-xs text-muted-foreground">{dropSubtitle}</span>
        ) : null}
      </div>
      {selectedFile ? (
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{selectedFile.name}</span>
          {selectedExtra ? (
            <>
              {" "}
              · <span className="text-foreground">{selectedExtra}</span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

/** Same structure as {@link VideoUploadFields}: upload first, then URL. */
function AudioUploadFields({
  value,
  onChange,
  selectedFile,
  onFileChange,
}: {
  value: string;
  onChange: (v: string) => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const applyAudio = (file: File | undefined | null) => {
    if (!file) {
      onFileChange(null);
      return;
    }
    if (!isAllowedAudioFile(file)) {
      toast.error("Unsupported audio file type.");
      return;
    }
    if (!assertWithinBusinessContextFileLimit(file)) return;
    onFileChange(file);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Upload audio</Label>
        <FileDropZone
          accept={AUDIO_ACCEPT}
          selectedFile={selectedFile}
          onFileChange={applyAudio}
          dropTitle="Drop an audio file here or click to browse"
          dropSubtitle="MP3, WAV, M4A/AAC, OGG, FLAC, or WebM. Max 1.5 MB per file."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resource-audio-url">Or audio URL</Label>
        <Input
          id="resource-audio-url"
          type="url"
          placeholder="https://… (SoundCloud, direct link, or hosted audio)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Title is filled from the link when supported. Thumbnails appear in the list for common providers.
        </p>
      </div>
    </div>
  );
}

function VideoUploadFields({
  value,
  onChange,
  selectedFile,
  onFileChange,
}: {
  value: string;
  onChange: (v: string) => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const applyMp4 = (file: File | undefined | null) => {
    if (!file) {
      onFileChange(null);
      return;
    }
    if (!isAllowedMp4Video(file)) {
      toast.error("Only MP4 video files are allowed.");
      return;
    }
    if (!assertWithinBusinessContextFileLimit(file)) return;
    onFileChange(file);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Upload MP4</Label>
        <FileDropZone
          accept={VIDEO_ACCEPT}
          selectedFile={selectedFile}
          onFileChange={applyMp4}
          dropTitle="Drop an MP4 here or click to browse"
          dropSubtitle="MP4 only. Max 1.5 MB."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resource-video-url">Or video URL</Label>
        <Input
          id="resource-video-url"
          type="url"
          placeholder="https://… (YouTube, Vimeo, or direct link)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Title is filled from the link when supported. Thumbnails appear in the list for common providers.
        </p>
      </div>
    </div>
  );
}

function FileFormatUploadFields({
  selectedFile,
  onFileChange,
}: {
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const applyDocument = (file: File | undefined | null) => {
    if (!file) {
      onFileChange(null);
      return;
    }
    if (!isAllowedDocumentFile(file)) {
      toast.error("Only PDF, Word (.doc/.docx), and plain text (.txt) are allowed.");
      return;
    }
    if (!assertWithinBusinessContextFileLimit(file)) return;
    onFileChange(file);
  };

  const detectedExtra = selectedFile ? `Detected: ${detectDocumentKind(selectedFile)}` : null;

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block text-sm font-medium">Document file</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          Only PDF, Microsoft Word (.doc, .docx), or plain text (.txt) are accepted. Maximum file size is 1.5
          MB. The title field below is filled from the file name unless you change it.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Upload</Label>
        <FileDropZone
          accept={DOCUMENT_ACCEPT}
          selectedFile={selectedFile}
          onFileChange={applyDocument}
          dropTitle="Drop your document here or click to browse"
          dropSubtitle="PDF, Word (.doc, .docx), or plain text (.txt) only. Max 1.5 MB."
          selectedExtra={detectedExtra}
        />
      </div>
    </div>
  );
}

function TypeSpecificFields({
  resourceType,
  value,
  onChange,
  selectedFile,
  onFileChange,
}: {
  resourceType: ResourceTypeId;
  value: string;
  onChange: (v: string) => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
}) {
  switch (resourceType) {
    case "files":
      return <FileFormatUploadFields selectedFile={selectedFile} onFileChange={onFileChange} />;
    case "video":
      return (
        <VideoUploadFields
          value={value}
          onChange={onChange}
          selectedFile={selectedFile}
          onFileChange={onFileChange}
        />
      );
    case "audio":
      return (
        <AudioUploadFields
          value={value}
          onChange={onChange}
          selectedFile={selectedFile}
          onFileChange={onFileChange}
        />
      );
    case "links":
      return (
        <div className="space-y-2">
          <Label htmlFor="resource-link">URL</Label>
          <Input
            id="resource-link"
            type="url"
            placeholder="https://…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "notes":
      return (
        <div className="space-y-2">
          <Label htmlFor="resource-note-body">Note content</Label>
          <Textarea
            id="resource-note-body"
            placeholder="Write your note in markdown or plain text"
            rows={6}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
      );
    case "structured":
      return (
        <div className="space-y-2">
          <Label htmlFor="resource-structured">Structured data (JSON, CSV, or paste)</Label>
          <Textarea
            id="resource-structured"
            placeholder={'{\n  "example": true\n}'}
            rows={6}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
      );
    default:
      return null;
  }
}
