"use client";

import { useEffect, useState } from "react";
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

type AddResourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextName: string;
  /**
   * When true (e.g. context overview), user picks type in the dialog.
   * When false (list page), `resourceType` is fixed.
   */
  allowTypeSelection?: boolean;
  /** Initial/fixed resource type. On list pages this is the only type. */
  resourceType: ResourceTypeId;
};

export default function AddResourceDialog({
  open,
  onOpenChange,
  contextName,
  allowTypeSelection = false,
  resourceType,
}: AddResourceDialogProps) {
  const [selectedType, setSelectedType] = useState<ResourceTypeId>(resourceType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [primaryField, setPrimaryField] = useState("");

  const effectiveType = allowTypeSelection ? selectedType : resourceType;

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setPrimaryField("");
      if (allowTypeSelection) {
        setSelectedType(resourceType);
      }
    }
  }, [open, resourceType, allowTypeSelection]);

  // Type-specific fields (upload/URL) don’t apply across types when user switches on overview.
  useEffect(() => {
    if (open && allowTypeSelection) {
      setPrimaryField("");
    }
  }, [selectedType, open, allowTypeSelection]);

  const selected = getResourceType(effectiveType);
  const SelectedIcon = selected.icon;

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

            <div className="space-y-2">
              <Label htmlFor="resource-title">Title</Label>
              <Input
                id="resource-title"
                placeholder="Give this resource a name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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

            {/* Type-specific primary field — same label row + input pattern */}
            <TypeSpecificFields resourceType={effectiveType} value={primaryField} onChange={setPrimaryField} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#DB2B30] text-white hover:bg-[#B52227]"
            onClick={() => {
              // Placeholder: wire to API later
              onOpenChange(false);
            }}
          >
            Add {selected.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const FILE_FORMATS = [
  {
    id: "pdf" as const,
    label: "PDF",
    shortLabel: "PDF",
    extensions: ".pdf",
    description: "Portable Document Format",
    accept: "application/pdf,.pdf",
  },
  {
    id: "word" as const,
    label: "Word",
    shortLabel: "Word",
    extensions: ".doc, .docx",
    description: "Microsoft Word documents",
    accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    id: "txt" as const,
    label: "Plain text",
    shortLabel: "TXT",
    extensions: ".txt",
    description: "Unformatted text files",
    accept: ".txt,text/plain",
  },
];

type FileFormatId = (typeof FILE_FORMATS)[number]["id"];

const AUDIO_FORMATS = [
  {
    id: "mp3" as const,
    label: "MP3",
    extensions: ".mp3",
    description: "Compressed audio, widely supported",
    accept: ".mp3,audio/mpeg,audio/mp3",
  },
  {
    id: "wav" as const,
    label: "WAV",
    extensions: ".wav",
    description: "Uncompressed PCM audio",
    accept: ".wav,audio/wav,audio/wave,audio/x-wav",
  },
  {
    id: "m4a" as const,
    label: "M4A / AAC",
    extensions: ".m4a, .aac",
    description: "Apple / AAC encoded audio",
    accept: ".m4a,.aac,audio/mp4,audio/aac,audio/x-m4a",
  },
  {
    id: "ogg" as const,
    label: "OGG",
    extensions: ".ogg",
    description: "Ogg Vorbis (open format)",
    accept: ".ogg,audio/ogg,application/ogg",
  },
  {
    id: "flac" as const,
    label: "FLAC",
    extensions: ".flac",
    description: "Lossless compressed audio",
    accept: ".flac,audio/flac",
  },
  {
    id: "webm" as const,
    label: "WebM audio",
    extensions: ".webm",
    description: "Web-optimized container (audio track)",
    accept: ".webm,audio/webm",
  },
];

type AudioFormatId = (typeof AUDIO_FORMATS)[number]["id"];

function AudioFormatUploadFields({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [format, setFormat] = useState<AudioFormatId>("mp3");
  const meta = AUDIO_FORMATS.find((f) => f.id === format)!;

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block text-sm font-medium">Audio format</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          Pick the format you are uploading so the file picker and processing can match it.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIO_FORMATS.map((f) => {
            const active = format === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={cn(
                  "flex flex-col items-start rounded-lg border p-3 text-left text-sm transition-colors",
                  active
                    ? "border-[#DB2B30] bg-[#DB2B30]/10 ring-2 ring-[#DB2B30]/30"
                    : "border-border bg-card hover:bg-muted/50"
                )}
              >
                <span className={cn("font-semibold", active ? "text-[#DB2B30]" : "text-foreground")}>
                  {f.label}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground">{f.extensions}</span>
                <span className="mt-1 text-[11px] leading-tight text-muted-foreground">{f.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Upload {meta.label} file</Label>
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background py-8 text-center text-sm text-muted-foreground transition-colors hover:border-[#DB2B30]/40 hover:bg-muted/30"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") e.preventDefault();
          }}
        >
          <span className="font-medium text-foreground">
            Drop your {meta.label} file here or click to browse
          </span>
          <span className="mt-1 text-xs">Accepted file extensions: {meta.extensions}</span>
          <span className="mt-2 text-xs text-muted-foreground">
            Upload will open a file picker filtered to this format when storage is connected.
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resource-audio-url">Or hosted audio URL (optional)</Label>
        <Input
          id="resource-audio-url"
          type="url"
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Use this if the audio is already hosted elsewhere instead of uploading a file.
        </p>
      </div>
    </div>
  );
}

function FileFormatUploadFields() {
  const [format, setFormat] = useState<FileFormatId>("pdf");
  const meta = FILE_FORMATS.find((f) => f.id === format)!;

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block text-sm font-medium">Document format</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          Choose the file type you are adding (not generic “data source” — pick PDF, Word, or text).
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {FILE_FORMATS.map((f) => {
            const active = format === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={cn(
                  "flex flex-col items-start rounded-lg border p-3 text-left text-sm transition-colors",
                  active
                    ? "border-[#DB2B30] bg-[#DB2B30]/10 ring-2 ring-[#DB2B30]/30"
                    : "border-border bg-card hover:bg-muted/50"
                )}
              >
                <span className={cn("font-semibold", active ? "text-[#DB2B30]" : "text-foreground")}>
                  {f.label}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground">{f.extensions}</span>
                <span className="mt-1 text-[11px] leading-tight text-muted-foreground">{f.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Upload {meta.label} file</Label>
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background py-8 text-center text-sm text-muted-foreground transition-colors hover:border-[#DB2B30]/40 hover:bg-muted/30"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") e.preventDefault();
          }}
        >
          <span className="font-medium text-foreground">
            Drop {meta.label.toLowerCase()} here or click to browse
          </span>
          <span className="mt-1 text-xs">Accepted file extensions: {meta.extensions}</span>
          <span className="mt-2 text-xs text-muted-foreground">
            Upload will open a file picker filtered to this format when storage is connected.
          </span>
        </div>
      </div>
    </div>
  );
}

function TypeSpecificFields({
  resourceType,
  value,
  onChange,
}: {
  resourceType: ResourceTypeId;
  value: string;
  onChange: (v: string) => void;
}) {
  switch (resourceType) {
    case "files":
      return <FileFormatUploadFields />;
    case "video":
      return (
        <div className="space-y-2">
          <Label htmlFor="resource-video">Video URL or embed</Label>
          <Input
            id="resource-video"
            placeholder="https://…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "audio":
      return <AudioFormatUploadFields value={value} onChange={onChange} />;
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
