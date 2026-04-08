"use client";

import { useEffect, useMemo, useState } from "react";
import {
    CircleUser,
    Pencil,
    ScanBarcode,
    List,
    Package,
    LayoutTemplate,
    Magnet,
    FileText,
    Globe,
    Mail,
    ListChecks,
    Quote,
    Video,
    Share2,
    BookOpen,
    Heart,
    type LucideIcon,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useContentTypes, type ContentTypeItem } from "@/src/hooks/useNotes";
import { cn } from "@/lib/utils";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";

const ICON_MAP: Record<string, LucideIcon> = {
    "circle-user": CircleUser,
    pencil: Pencil,
    "scan-barcode": ScanBarcode,
    list: List,
    package: Package,
    "layout-template": LayoutTemplate,
    magnet: Magnet,
    "file-text": FileText,
    globe: Globe,
    mail: Mail,
    "list-checks": ListChecks,
    quote: Quote,
    video: Video,
    "share-2": Share2,
    "book-open": BookOpen,
    heart: Heart,
};

function TypeIcon({ name, className }: { name: string; className?: string }) {
    const Icon = ICON_MAP[name] ?? FileText;
    return (
        <Icon
            className={cn(
                "h-6 w-6 shrink-0 text-[#DB2B30] dark:text-red-300",
                className
            )}
        />
    );
}

export type CreateContentTypeDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** When set, user cannot change collection (e.g. collection notes page). */
    lockCollectionId?: number;
    collections: Array<{ id: number; title: string }>;
    onContinue: (args: { contentTypeId: string; collectionId: number }) => void;
};

export default function CreateContentTypeDialog({
    open,
    onOpenChange,
    lockCollectionId,
    collections,
    onContinue,
}: CreateContentTypeDialogProps) {
    const { data: types, isLoading, isError } = useContentTypes();
    const [selectedId, setSelectedId] = useState<string>("brand_script");
    const [collectionId, setCollectionId] = useState<string>("");

    const effectiveCollectionId = lockCollectionId != null ? String(lockCollectionId) : collectionId;

    useEffect(() => {
        if (!open) return;
        setSelectedId("brand_script");
        if (lockCollectionId != null) {
            setCollectionId(String(lockCollectionId));
        } else if (collections.length === 1) {
            setCollectionId(String(collections[0].id));
        } else if (collections.length > 0) {
            setCollectionId(String(collections[0].id));
        } else {
            setCollectionId("");
        }
    }, [open, lockCollectionId, collections]);

    const sortedTypes = useMemo(() => {
        if (!types) return [];
        return [...types].sort((a, b) => a.title.localeCompare(b.title));
    }, [types]);

    const canSubmit =
        !!selectedId &&
        effectiveCollectionId.length > 0 &&
        !Number.isNaN(Number(effectiveCollectionId));

    const handleContinue = () => {
        if (!canSubmit) return;
        onContinue({
            contentTypeId: selectedId,
            collectionId: Number(effectiveCollectionId),
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-border border-t-[3px] border-t-[#DB2B30] bg-background shadow-lg shadow-[#DB2B30]/10">
                <div className="border-b border-[#DB2B30]/20 bg-gradient-to-br from-[#DB2B30]/10 via-muted/50 to-muted/30 px-6 py-5 shrink-0">
                    <DialogHeader className="text-left space-y-1 border-l-4 border-[#DB2B30] pl-4">
                        <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                            Choose content type
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Pick a template to get started. You can edit everything in the editor.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 bg-gradient-to-b from-[#DB2B30]/[0.07] to-muted/15">
                    {isLoading && (
                        <div className="flex justify-center py-16">
                            <BlocksLoader />
                        </div>
                    )}
                    {isError && (
                        <p className="text-center text-sm text-destructive py-8">
                            Could not load content types. Please try again.
                        </p>
                    )}
                    {!isLoading && !isError && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {sortedTypes.map((item) => (
                                <TypeCard
                                    key={item.id}
                                    item={item}
                                    selected={selectedId === item.id}
                                    onSelect={() => setSelectedId(item.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-border bg-card px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shrink-0">
                    {lockCollectionId == null && collections.length > 1 && (
                        <div className="flex flex-col gap-1.5 min-w-[200px]">
                            <Label className="text-xs text-muted-foreground">Collection</Label>
                            <Select value={collectionId} onValueChange={setCollectionId}>
                                <SelectTrigger className="w-full sm:w-[280px]">
                                    <SelectValue placeholder="Select collection" />
                                </SelectTrigger>
                                <SelectContent>
                                    {collections.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {lockCollectionId == null && collections.length === 1 && (
                        <p className="text-sm text-muted-foreground">
                            Collection: <span className="font-medium text-foreground">{collections[0].title}</span>
                        </p>
                    )}
                    <div className="flex gap-2 sm:ml-auto">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={!canSubmit || isLoading}
                            onClick={handleContinue}
                            className="bg-[#DB2B30] text-white shadow-md hover:bg-[#B52227] focus-visible:ring-[#DB2B30]/40"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function TypeCard({
    item,
    selected,
    onSelect,
}: {
    item: ContentTypeItem;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "text-left rounded-xl border-2 bg-card p-3 transition-all hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DB2B30]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                selected
                    ? "border-[#DB2B30] shadow-md ring-2 ring-[#DB2B30]/25"
                    : "border-border hover:border-[#DB2B30]/45"
            )}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <TypeIcon name={item.icon} />
                <span
                    className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                        selected
                            ? "border-[#DB2B30] bg-[#DB2B30] text-white"
                            : "border-muted-foreground/35 text-transparent"
                    )}
                    aria-hidden
                >
                    ✓
                </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm text-foreground leading-tight">{item.title}</h3>
                {item.required && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-[#DB2B30] dark:text-red-300">
                        Required
                    </span>
                )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-snug line-clamp-4">{item.description}</p>
        </button>
    );
}
