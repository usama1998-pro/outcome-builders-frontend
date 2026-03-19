import {
  FileText,
  FileVideo,
  FileAudio,
  Link2,
  StickyNote,
  Database,
  LucideIcon,
} from "lucide-react";

export type ResourceTypeId =
  | "files"
  | "video"
  | "audio"
  | "links"
  | "notes"
  | "structured";

export const RESOURCE_TYPES: {
  id: ResourceTypeId;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { id: "files", label: "Files", description: "PDF, Word (.doc/.docx), and plain text (.txt)", icon: FileText },
  { id: "video", label: "Video", description: "Video content and recordings", icon: FileVideo },
  {
    id: "audio",
    label: "Audio",
    description: "MP3, WAV, M4A/AAC, OGG, FLAC, WebM",
    icon: FileAudio,
  },
  { id: "links", label: "Links", description: "Web links and URLs", icon: Link2 },
  { id: "notes", label: "Notes", description: "Text notes and markdown", icon: StickyNote },
  {
    id: "structured",
    label: "Structured Data",
    description: "Tables, spreadsheets, and structured datasets",
    icon: Database,
  },
];

export function getResourceType(id: ResourceTypeId) {
  return RESOURCE_TYPES.find((t) => t.id === id) ?? RESOURCE_TYPES[0];
}
