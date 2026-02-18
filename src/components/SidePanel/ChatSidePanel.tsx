"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
    Home,
    LayoutDashboard,
    Brain,
    Layers,
    FileText,
    MessageSquarePlus,
    Search
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar";
import { ChevronUp, ChevronDown, User2, MessageSquare, MoreHorizontal, Building, Users, Settings, Loader2, HelpCircle } from "lucide-react";
import { useState } from "react";
import { ChatTab } from "../../types/chat";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useSignOut, useUserTenants } from "@/src/hooks/useAuth";
import { useUserProfile } from "@/src/hooks/useProfile";
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";
import { useAuthStore } from "@/src/store/useAuth";
import { getChatTabs, deleteChatTab, clearChatTab } from "@/src/api/chat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

export default function ChatSidePanel() {
    const pathname = usePathname();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [chatsOpen, setChatsOpen] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
    const [loadingChatId, setLoadingChatId] = useState<number | null>(null);
    const signOut = useSignOut();
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const { data: tenants } = useUserTenants();
    const { data: userProfile } = useUserProfile();
    const { hasPermission, isOwnerOrAdmin, isLoading: permissionsLoading } = useUserPermissions();

    // Get display name - prefer full_name, fallback to email, truncate if too long
    const getDisplayName = () => {
        const name = userProfile?.data?.full_name || userProfile?.data?.email || "User";
        if (name.length > 20) {
            return name.substring(0, 17) + "...";
        }
        return name;
    };

    // Only show once permissions are loaded AND user has access
    const canViewTeam = !permissionsLoading && (
        hasPermission(PERMISSIONS.ADMIN_MANAGE) ||
        hasPermission(PERMISSIONS.USER_INVITE) ||
        isOwnerOrAdmin
    );

    const links = [
        { href: "/", icon: Home, label: "Home", iconClassName: "text-sky-600 dark:text-sky-400" },
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", iconClassName: "text-emerald-600 dark:text-emerald-400" },
        {
            href: "/dashboard/workspaces",
            icon: Brain,
            label: "Brainspace",
            iconClassName: "text-violet-600 dark:text-violet-400",
        },
        { href: "/dashboard/collections", icon: Layers, label: "Collections", iconClassName: "text-cyan-600 dark:text-cyan-400" },
        { href: "/dashboard/notes", icon: FileText, label: "Articles", iconClassName: "text-amber-600 dark:text-amber-400" },
        { href: "/chat", icon: MessageSquarePlus, label: "New Chat", iconClassName: "text-fuchsia-600 dark:text-fuchsia-400" },
        { href: "/chat/search", icon: Search, label: "Search Chat", iconClassName: "text-emerald-600 dark:text-emerald-400" },
    ];

    // Load chat tabs from API (filtered by current tenant)
    const { data: chatTabs = [], isLoading: isLoadingChatTabs, refetch: refetchChatTabs } = useQuery({
        queryKey: ["chatTabs", currentTenantId],
        queryFn: getChatTabs,
        enabled: !!currentTenantId,
        staleTime: 1000 * 30, // Consider data fresh for 30 seconds
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
    });

    // Get last message for each chat tab (for display)
    const getLastMessage = (chatTab: ChatTab): string => {
        // This would ideally come from the API, but for now we'll use a placeholder
        return "Click to continue conversation";
    };

    return (
        <>
            <Sidebar>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            {/* Navigation Links */}
                            <SidebarMenu>
                                {links.map(({ href, icon: Icon, label, iconClassName }, key) => (
                                    <SidebarMenuItem key={key}>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={href}
                                                className={`px-2 py-1 rounded ${pathname === href
                                                    ? "bg-gray-300 font-semibold"
                                                    : "hover:bg-gray-200"
                                                    }`}
                                            >
                                                <Icon className={`h-4 w-4 ${iconClassName || ""}`} /> {label}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}

                            </SidebarMenu>

                            {/* Collapsible Chat List */}
                            <div className="mt-4">
                                <button
                                    className="flex items-center justify-between w-full px-2 py-2 text-sm font-semibold hover:bg-gray-200 rounded"
                                    onClick={() => setChatsOpen(!chatsOpen)}
                                >
                                    <span className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Chats
                                    </span>
                                    {chatsOpen ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </button>

                                {chatsOpen && (
                                    <div className="mt-2 max-h-[400px] overflow-y-auto pr-1">
                                        {isLoadingChatTabs ? (
                                            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                                Loading chats...
                                            </div>
                                        ) : chatTabs.length === 0 ? (
                                            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                                No chats yet. Start a new conversation!
                                            </div>
                                        ) : (
                                            <SidebarMenu>
                                                {chatTabs.map((chat) => {
                                                    const isLoading = loadingChatId === chat.id;
                                                    return (
                                                        <SidebarMenuItem key={chat.id}>
                                                            <SidebarMenuButton asChild disabled={isLoading}>
                                                                <Link
                                                                    href={`/chat/${chat.id}`}
                                                                    className={`flex flex-col items-start px-2 py-2 rounded ${pathname === `/chat/${chat.id}`
                                                                        ? "bg-gray-300 font-semibold"
                                                                        : "hover:bg-gray-200"
                                                                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                                                >
                                                                    <div className="flex items-center gap-2 w-full">
                                                                        {isLoading ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                                                        ) : null}
                                                                        <span className="flex-1">{chat.name}</span>
                                                                    </div>
                                                                    {!isLoading && (
                                                                        <span className="text-xs text-gray-500 truncate">
                                                                            {getLastMessage(chat)}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            </SidebarMenuButton>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild disabled={isLoading}>
                                                                    <SidebarMenuAction disabled={isLoading}>
                                                                        {isLoading ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <MoreHorizontal />
                                                                        )}
                                                                    </SidebarMenuAction>
                                                                </DropdownMenuTrigger>
                                                                {!isLoading && (
                                                                    <DropdownMenuContent side="right" align="start">
                                                                        <DropdownMenuItem
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setSelectedChatId(chat.id);
                                                                                setClearDialogOpen(true);
                                                                            }}
                                                                        >
                                                                            <span>Clear</span>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setSelectedChatId(chat.id);
                                                                                setDeleteDialogOpen(true);
                                                                            }}
                                                                            className="text-destructive focus:text-destructive"
                                                                        >
                                                                            <span>Delete</span>
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                )}
                                                            </DropdownMenu>
                                                        </SidebarMenuItem>
                                                    );
                                                })}
                                            </SidebarMenu>
                                        )}
                                    </div>
                                )}
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                {/* Footer */}
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton className="w-full">
                                        <User2 className="shrink-0" />
                                        <span className="truncate flex-1 text-left" title={userProfile?.data?.full_name || userProfile?.data?.email}>
                                            {getDisplayName()}
                                        </span>
                                        <ChevronUp className="ml-auto shrink-0" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    side="top"
                                    className="w-[--radix-popper-anchor-width]"
                                >
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/profile">
                                            <User2 className="mr-2 h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    {tenants && tenants.length > 0 && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/organization">
                                                <Building className="mr-2 h-4 w-4" />
                                                Organization
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    {canViewTeam && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/admins">
                                                <Users className="mr-2 h-4 w-4" />
                                                Team
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/faq">
                                            <HelpCircle className="mr-2 h-4 w-4" />
                                            FAQ
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/settings">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={signOut}>
                                        <span>Sign out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            {/* Clear Chat Confirmation Dialog */}
            <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Chat</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to clear all messages from this chat? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (selectedChatId) {
                                    const chatIdToClear = selectedChatId;
                                    // Close dialog immediately
                                    setClearDialogOpen(false);
                                    setSelectedChatId(null);
                                    setLoadingChatId(chatIdToClear);
                                    try {
                                        await clearChatTab(chatIdToClear);
                                        toast.success("Chat cleared successfully");
                                        // Invalidate chat history for this specific chat so it reloads with empty messages
                                        // Match query key pattern ["chatHistory", chatId, tenantId] using predicate
                                        queryClient.invalidateQueries({
                                            predicate: (query) => {
                                                const key = query.queryKey;
                                                return Array.isArray(key) &&
                                                    key.length >= 2 &&
                                                    key[0] === "chatHistory" &&
                                                    String(key[1]) === String(chatIdToClear);
                                            }
                                        });
                                        // Don't redirect - stay on the cleared chat so user can continue chatting
                                    } catch (error: any) {
                                        toast.error(`Failed to clear chat: ${error.message || "Unknown error"}`);
                                    } finally {
                                        setLoadingChatId(null);
                                    }
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Clear
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Chat Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this chat? This will permanently delete the chat and all its messages. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (selectedChatId) {
                                    const chatIdToDelete = selectedChatId;
                                    // Close dialog immediately
                                    setDeleteDialogOpen(false);
                                    setSelectedChatId(null);
                                    setLoadingChatId(chatIdToDelete);
                                    try {
                                        await deleteChatTab(chatIdToDelete);
                                        toast.success("Chat deleted successfully");
                                        // Immediately refetch chat tabs to update the list
                                        await refetchChatTabs();
                                        // Invalidate chat history for this specific chat
                                        queryClient.invalidateQueries({ queryKey: ["chatHistory", chatIdToDelete.toString()] });
                                        // If we're on this chat page, redirect to landing page
                                        if (pathname === `/chat/${chatIdToDelete}`) {
                                            router.push("/chat");
                                        }
                                    } catch (error: any) {
                                        toast.error(`Failed to delete chat: ${error.message || "Unknown error"}`);
                                    } finally {
                                        setLoadingChatId(null);
                                    }
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
