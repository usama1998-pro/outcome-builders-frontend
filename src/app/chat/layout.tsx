"use client";

import React from "react";
import SidePanel from "@/src/components/SidePanel/SidePanel";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import RequireAuth from "@/src/components/auth/requireAuth";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [searchMatchCount, setSearchMatchCount] = React.useState(0);
    const [currentMatchIndex, setCurrentMatchIndex] = React.useState(-1);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Listen for keyboard shortcut
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setIsSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
            }
            if (e.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
                setSearchQuery("");
                window.dispatchEvent(new CustomEvent('closeSearch'));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen]);

    // Listen for search match updates from chat page
    React.useEffect(() => {
        const handleSearchMatches = (e: CustomEvent) => {
            setSearchMatchCount(e.detail.count || 0);
            setCurrentMatchIndex(e.detail.currentIndex ?? -1);
        };
        window.addEventListener('searchMatchesUpdate', handleSearchMatches as EventListener);
        return () => window.removeEventListener('searchMatchesUpdate', handleSearchMatches as EventListener);
    }, []);

    // Broadcast search query changes to chat page
    React.useEffect(() => {
        window.dispatchEvent(new CustomEvent('searchQueryChange', { detail: searchQuery }));
    }, [searchQuery]);


    return (
        <RequireAuth>
            <SidebarProvider>
                {/* Gradient Background */}
                <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/30 -z-10" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/8 via-transparent to-transparent pointer-events-none -z-10" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none -z-10" />

                <div className="flex flex-row w-screen h-screen p-0 m-0">
                    {/* Sidebar */}
                    <SidePanel />

                    {/* Main content area */}
                    <div className="flex flex-col flex-1 relative">

                        {/* Search bar - Above chat content */}
                        <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
                            <div className="grid grid-cols-3 items-center px-4 py-3 relative z-10 gap-4">
                                {/* Left side: Sidebar Trigger */}
                                <div className="flex items-center gap-3 justify-start">
                                    <SidebarTrigger className="bg-background/80 backdrop-blur-sm border shadow-sm rounded-lg p-2 hover:bg-accent transition-colors" />
                                </div>

                                {/* Middle: Search - Button or Input (centered) */}
                                <div className="flex items-center gap-2 justify-center max-w-2xl mx-auto">
                                    {!isSearchOpen ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 px-3 gap-2"
                                            onClick={() => {
                                                setIsSearchOpen(true);
                                                setTimeout(() => searchInputRef.current?.focus(), 100);
                                            }}
                                            title="Search in chat (Ctrl+F / Cmd+F)"
                                        >
                                            <Search className="h-4 w-4" />
                                            <span className="text-sm">Search</span>
                                        </Button>
                                    ) : (
                                        <>
                                            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <Input
                                                ref={searchInputRef}
                                                type="text"
                                                placeholder="Search in chat..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="flex-1 h-9 text-sm"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        window.dispatchEvent(new CustomEvent('searchNavigate', { detail: 'next' }));
                                                    } else if (e.key === 'Enter' && e.shiftKey) {
                                                        e.preventDefault();
                                                        window.dispatchEvent(new CustomEvent('searchNavigate', { detail: 'prev' }));
                                                    }
                                                }}
                                            />
                                            {searchQuery.trim() && searchMatchCount > 0 && (
                                                <>
                                                    <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                                        {currentMatchIndex + 1} of {searchMatchCount}
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => window.dispatchEvent(new CustomEvent('searchNavigate', { detail: 'prev' }))}
                                                            title="Previous match (Shift+Enter)"
                                                        >
                                                            <ChevronUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => window.dispatchEvent(new CustomEvent('searchNavigate', { detail: 'next' }))}
                                                            title="Next match (Enter)"
                                                        >
                                                            <ChevronDown className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                            {searchQuery.trim() && searchMatchCount === 0 && (
                                                <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                                    No matches
                                                </div>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 shrink-0"
                                                onClick={() => {
                                                    setIsSearchOpen(false);
                                                    setSearchQuery("");
                                                    window.dispatchEvent(new CustomEvent('closeSearch'));
                                                }}
                                                title="Close (Esc)"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* Right side: Empty spacer for centering */}
                                <div></div>
                            </div>
                        </div>

                        <main className="m-0 p-0 flex-1 flex flex-col overflow-hidden relative z-10">
                            {children}
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </RequireAuth>
    );
}
