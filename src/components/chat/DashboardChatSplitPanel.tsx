"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CHAT_ENTRY_PATH } from "@/src/lib/chatRoutes";
import { useAuthStore } from "@/src/store/useAuth";
import { getChatTabs } from "@/src/api/chat";
import {
    CHAT_NEW_SESSION_EVENT,
    CHAT_TAB_DELETED_EVENT,
    type ChatTabDeletedDetail,
} from "@/src/lib/activeChatTabStorage";

const ChatClient = dynamic(() => import("@/src/app/chat/ChatClient"), { ssr: false });

const NEW_TAB_VALUE = "new";

export default function DashboardChatSplitPanel() {
    const pathname = usePathname();
    const token = useAuthStore((s) => s.token);
    const hydrated = useAuthStore((s) => s.hydrated);
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const [open, setOpen] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<string>(NEW_TAB_VALUE);

    const isChatRoute = pathname?.startsWith("/chat") ?? false;

    const { data: chatTabs = [], isLoading: isLoadingChatTabs } = useQuery({
        queryKey: ["chatTabs", currentTenantId],
        queryFn: getChatTabs,
        enabled: !!open && !!currentTenantId && !!token && hydrated,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: "always",
    });

    useEffect(() => {
        const onDeleted = (e: Event) => {
            const detail = (e as CustomEvent<ChatTabDeletedDetail>).detail;
            const id = detail?.chatTabId;
            if (!id) return;
            setSelectedChatId((prev) =>
                prev.toLowerCase() === id.toLowerCase() ? NEW_TAB_VALUE : prev,
            );
        };
        window.addEventListener(CHAT_TAB_DELETED_EVENT, onDeleted as EventListener);
        return () =>
            window.removeEventListener(CHAT_TAB_DELETED_EVENT, onDeleted as EventListener);
    }, []);

    useEffect(() => {
        if (selectedChatId === NEW_TAB_VALUE) return;
        if (isLoadingChatTabs) return;
        const exists = chatTabs.some((t) => t.id === selectedChatId);
        if (!exists) setSelectedChatId(NEW_TAB_VALUE);
    }, [chatTabs, isLoadingChatTabs, selectedChatId]);

    const handleTabChange = (value: string) => {
        if (value === NEW_TAB_VALUE) {
            if (selectedChatId === NEW_TAB_VALUE) {
                window.dispatchEvent(new CustomEvent(CHAT_NEW_SESSION_EVENT));
            }
            setSelectedChatId(NEW_TAB_VALUE);
            return;
        }
        setSelectedChatId(value);
    };

    if (!hydrated || !token || isChatRoute) {
        return null;
    }

    return (
        <>
            {!open && (
                <Button
                    type="button"
                    size="icon"
                    onClick={() => setOpen(true)}
                    className="fixed bottom-6 right-6 z-[90] h-16 w-16 rounded-full shadow-lg bg-[#DB2B30] hover:bg-[#c42529] text-white border-0"
                    aria-label="Open chat panel"
                >
                    <MessageSquare className="h-8 w-8" />
                </Button>
            )}

            {open && (
                <aside
                    className="flex h-full min-h-0 w-[min(400px,max(26vw,260px))] max-w-[85vw] shrink-0 flex-col border-l border-border bg-background"
                    aria-label="Chat"
                >
                    <header className="flex shrink-0 items-center gap-1.5 border-b border-border px-2 py-1.5">
                        <div className="min-w-0 flex-1">
                            <Select
                                value={selectedChatId}
                                onValueChange={handleTabChange}
                                disabled={isLoadingChatTabs}
                            >
                                <SelectTrigger
                                    size="sm"
                                    className="h-7 w-full min-w-0 max-w-full text-xs [&_[data-slot=select-value]]:truncate"
                                    aria-label="Chat tab"
                                >
                                    {isLoadingChatTabs ? (
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                            Loading…
                                        </span>
                                    ) : (
                                        <SelectValue placeholder="Select chat" />
                                    )}
                                </SelectTrigger>
                                <SelectContent
                                    position="popper"
                                    className="max-h-[min(260px,45vh)] w-[var(--radix-select-trigger-width)] max-w-[min(85vw,var(--radix-select-trigger-width))] text-xs"
                                >
                                    <SelectItem value={NEW_TAB_VALUE}>New action</SelectItem>
                                    {chatTabs.map((tab) => (
                                        <SelectItem key={tab.id} value={tab.id}>
                                            <span className="truncate">{tab.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" asChild>
                                <Link href={CHAT_ENTRY_PATH}>Full screen</Link>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </header>
                    <div className="min-h-0 flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 text-sm">
                        <ChatClient
                            key={selectedChatId}
                            chatId={selectedChatId}
                            embed
                        />
                    </div>
                </aside>
            )}
        </>
    );
}
