"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useContentTypes } from "@/src/hooks/useNotes";
import { inferContentTypeId } from "@/src/lib/contentTypeInference";
import { cn } from "@/lib/utils";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";

export type CreateContentFromChatDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Combined user + assistant text used to suggest a content type */
    conversationText: string;
    onConfirm: (contentTypeId: string) => void;
};

export default function CreateContentFromChatDialog({
    open,
    onOpenChange,
    conversationText,
    onConfirm,
}: CreateContentFromChatDialogProps) {
    const { data: types, isLoading, isError } = useContentTypes();
    const suggestedId = useMemo(
        () => (conversationText.trim() ? inferContentTypeId(conversationText) : "brand_script"),
        [conversationText]
    );
    const [selectedId, setSelectedId] = useState(suggestedId);

    useEffect(() => {
        if (open) setSelectedId(suggestedId);
    }, [open, suggestedId]);

    const sorted = useMemo(() => {
        if (!types?.length) return [];
        return [...types].sort((a, b) => a.title.localeCompare(b.title));
    }, [types]);

    const suggestedTitle = sorted.find((t) => t.id === suggestedId)?.title;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] flex flex-col gap-0 border-border border-t-[3px] border-t-[#DB2B30]">
                <DialogHeader className="text-left border-b border-border pb-3 border-l-4 border-l-[#DB2B30] pl-3">
                    <DialogTitle className="text-lg">Content type</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Choose a template for your article. We suggest one based on this conversation
                        {suggestedTitle ? (
                            <span className="font-medium text-foreground"> — {suggestedTitle}</span>
                        ) : (
                            "."
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto py-3">
                    {isLoading && (
                        <div className="flex justify-center py-10">
                            <BlocksLoader />
                        </div>
                    )}
                    {isError && (
                        <p className="text-sm text-destructive text-center py-6">
                            Could not load content types.
                        </p>
                    )}
                    {!isLoading && !isError && (
                        <div className="flex flex-col gap-1.5">
                            {sorted.map((item) => {
                                const isSuggested = item.id === suggestedId;
                                const selected = item.id === selectedId;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedId(item.id)}
                                        className={cn(
                                            "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DB2B30]/35",
                                            selected
                                                ? "border-[#DB2B30] bg-[#DB2B30]/10"
                                                : "border-border hover:border-[#DB2B30]/40 hover:bg-muted/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px]",
                                                    selected
                                                        ? "border-[#DB2B30] bg-[#DB2B30] text-white"
                                                        : "border-muted-foreground/30"
                                                )}
                                            >
                                                {selected ? "✓" : ""}
                                            </span>
                                            <span className="font-medium text-foreground">{item.title}</span>
                                            {isSuggested && (
                                                <span className="text-[10px] uppercase tracking-wide text-[#DB2B30]">
                                                    Suggested
                                                </span>
                                            )}
                                            {item.required && (
                                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                                    Core
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 pl-7 text-xs text-muted-foreground line-clamp-2">
                                            {item.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-border pt-3 gap-2 sm:gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="bg-[#DB2B30] text-white hover:bg-[#B52227]"
                        disabled={!selectedId || isLoading}
                        onClick={() => {
                            onConfirm(selectedId);
                            onOpenChange(false);
                        }}
                    >
                        Continue to editor
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
