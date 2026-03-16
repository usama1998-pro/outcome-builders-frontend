"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import { searchChatTabs } from "@/src/api/chat";
import { ChatTab } from "@/src/types/chat";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/useAuth";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import Link from "next/link";
// Date formatting helper
const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
        return `${Math.floor(diffInSeconds / 31536000)} years ago`;
    } catch {
        return "Recently";
    }
};

export default function SearchChatPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const currentTenantId = useAuthStore((s) => s.tenantId);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery.trim());
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search chat tabs
    const { data: searchResults = [], isLoading, isFetching } = useQuery({
        queryKey: ["searchChatTabs", debouncedQuery, currentTenantId],
        queryFn: () => searchChatTabs(debouncedQuery),
        enabled: !!debouncedQuery && debouncedQuery.length >= 2 && !!currentTenantId,
        staleTime: 1000 * 30,
    });

    const handleChatClick = (chatId: string) => { // UUID as string
        router.push(`/chat/${chatId}`);
    };

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header */}
            <div className="flex-shrink-0 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/chat">
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <ArrowLeft className="h-4 w-4 text-[#DB2B30]" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-semibold">Search Chats</h1>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#DB2B30]" />
                        <Input
                            type="text"
                            placeholder="Search chats by name or message content..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full"
                            autoFocus
                        />
                        {(isLoading || isFetching) && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-[#DB2B30]" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                <div className="max-w-4xl mx-auto">
                    {!debouncedQuery ? (
                        <div className="flex flex-col items-center justify-center py-12 min-h-[400px]">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#DB2B30]/20 via-[#B52227]/20 to-[#8A1B1F]/20 rounded-full blur-3xl animate-pulse"></div>
                                <div className="relative w-32 h-32 bg-gradient-to-br from-[#DB2B30]/10 via-[#B52227]/10 to-[#8A1B1F]/10 dark:from-[#DB2B30]/20 dark:via-[#B52227]/20 dark:to-[#8A1B1F]/20 rounded-2xl flex items-center justify-center border border-[#DB2B30]/30 shadow-lg">
                                    <Search className="w-16 h-16 text-[#DB2B30]" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                Search Your Chats
                            </h3>
                            <p className="text-muted-foreground mb-8 text-base leading-relaxed text-center max-w-md">
                                Enter a search term to find chats by name or message content. 
                                Start typing to see results...
                            </p>
                        </div>
                    ) : debouncedQuery.length < 2 ? (
                        <div className="flex flex-col items-center justify-center py-12 min-h-[400px]">
                            <p className="text-muted-foreground">
                                Please enter at least 2 characters to search
                            </p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 min-h-[400px]">
                            <BlocksLoader />
                            <p className="text-sm text-muted-foreground mt-4">Searching chats...</p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 min-h-[400px]">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#DB2B30]/20 via-[#B52227]/20 to-[#8A1B1F]/20 rounded-full blur-3xl animate-pulse"></div>
                                <div className="relative w-32 h-32 bg-gradient-to-br from-[#DB2B30]/10 via-[#B52227]/10 to-[#8A1B1F]/10 dark:from-[#DB2B30]/20 dark:via-[#B52227]/20 dark:to-[#8A1B1F]/20 rounded-2xl flex items-center justify-center border border-[#DB2B30]/30 shadow-lg">
                                    <MessageSquare className="w-16 h-16 text-[#DB2B30]" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                No Results Found
                            </h3>
                            <p className="text-muted-foreground mb-8 text-base leading-relaxed text-center max-w-md">
                                No chats found matching "{debouncedQuery}". Try a different search term.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground mb-4">
                                Found {searchResults.length} {searchResults.length === 1 ? "chat" : "chats"}
                            </p>
                            {searchResults.map((chat) => (
                                <div
                                    key={chat.id}
                                    onClick={() => handleChatClick(chat.id)}
                                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-[#DB2B30]/5 cursor-pointer transition-colors group"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#DB2B30] via-[#B52227] to-[#8A1B1F] flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground group-hover:text-[#DB2B30] dark:group-hover:text-[#DB2B30] transition-colors truncate">
                                            {chat.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Updated {formatDate(chat.updated_at)}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <ArrowLeft className="h-4 w-4 rotate-180" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

