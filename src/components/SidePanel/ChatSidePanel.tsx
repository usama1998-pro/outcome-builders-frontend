"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
    Home,
    LayoutDashboard,
    Layers,
    MessageSquarePlus,
    Search
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar";
import { ChevronUp, ChevronDown, User2, MessageSquare, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { ChatTab } from "../../types/chat";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/src/hooks/useAuth";

export default function ChatSidePanel() {
    const pathname = usePathname();
    const [chatsOpen, setChatsOpen] = useState(true);
    const signOut = useSignOut();

    const links = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/dashboard/workspaces", icon: Layers, label: "Workspace" },
        { href: "/chat", icon: MessageSquarePlus, label: "New Chat" },
        { href: "#", icon: Search, label: "Search Chat" },
    ];

    const chatTabs: ChatTab[] = [
        {
            id: "chat-1",
            name: "Project Discussion",
            lastMessage: "Sure, I’ll prepare the summary.",
            updatedAt: "2025-10-03T18:25:00Z",
        },
        {
            id: "chat-2",
            name: "Travel Plans",
            lastMessage: "Let’s book the tickets tomorrow.",
            updatedAt: "2025-10-02T14:10:00Z",
        },
        {
            id: "chat-3",
            name: "Random Ideas",
            lastMessage: "That sounds like a fun experiment!",
            updatedAt: "2025-09-30T09:45:00Z",
        },
        {
            id: "chat-4",
            name: "Team Standup",
            lastMessage: "Reminder: tomorrow at 10 AM.",
            updatedAt: "2025-09-29T08:00:00Z",
        },
        {
            id: "chat-5",
            name: "Shopping List",
            lastMessage: "Don’t forget to grab some milk.",
            updatedAt: "2025-09-28T19:20:00Z",
        },
        {
            id: "chat-6",
            name: "Client Feedback",
            lastMessage: "The client approved the new design.",
            updatedAt: "2025-09-27T16:45:00Z",
        },
        {
            id: "chat-7",
            name: "Fitness Group",
            lastMessage: "Leg day tomorrow 💪",
            updatedAt: "2025-09-26T07:15:00Z",
        },
        {
            id: "chat-8",
            name: "Weekend Plans",
            lastMessage: "Movie night sounds perfect!",
            updatedAt: "2025-09-25T21:30:00Z",
        },
        {
            id: "chat-9",
            name: "Research Notes",
            lastMessage: "I’ll send over the references later.",
            updatedAt: "2025-09-24T13:10:00Z",
        },
        {
            id: "chat-10",
            name: "Birthday Party",
            lastMessage: "Don’t forget the cake 🎂",
            updatedAt: "2025-09-23T20:00:00Z",
        },
        {
            id: "chat-11",
            name: "Coding Buddies",
            lastMessage: "Try refactoring the component.",
            updatedAt: "2025-09-22T18:15:00Z",
        },
        {
            id: "chat-12",
            name: "Gaming Squad",
            lastMessage: "Lobby at 9 PM sharp!",
            updatedAt: "2025-09-21T22:45:00Z",
        },
        {
            id: "chat-13",
            name: "Office Banter",
            lastMessage: "That meme was hilarious 😂",
            updatedAt: "2025-09-20T11:00:00Z",
        },
        {
            id: "chat-14",
            name: "Music Sharing",
            lastMessage: "Check out this new playlist.",
            updatedAt: "2025-09-19T15:25:00Z",
        },
        {
            id: "chat-15",
            name: "Family Group",
            lastMessage: "Dinner at 8 tonight!",
            updatedAt: "2025-09-18T19:00:00Z",
        },
        {
            id: "chat-16",
            name: "Project Discussion",
            lastMessage: "Sure, I’ll prepare the summary.",
            updatedAt: "2025-10-03T18:25:00Z",
        },
        {
            id: "chat-17",
            name: "Travel Plans",
            lastMessage: "Let’s book the tickets tomorrow.",
            updatedAt: "2025-10-02T14:10:00Z",
        },
        {
            id: "chat-18",
            name: "Random Ideas",
            lastMessage: "That sounds like a fun experiment!",
            updatedAt: "2025-09-30T09:45:00Z",
        },
        {
            id: "chat-19",
            name: "Team Standup",
            lastMessage: "Reminder: tomorrow at 10 AM.",
            updatedAt: "2025-09-29T08:00:00Z",
        },
        {
            id: "chat-20",
            name: "Shopping List",
            lastMessage: "Don’t forget to grab some milk.",
            updatedAt: "2025-09-28T19:20:00Z",
        },
        {
            id: "chat-21",
            name: "Client Feedback",
            lastMessage: "The client approved the new design.",
            updatedAt: "2025-09-27T16:45:00Z",
        },
        {
            id: "chat-22",
            name: "Fitness Group",
            lastMessage: "Leg day tomorrow 💪",
            updatedAt: "2025-09-26T07:15:00Z",
        },
        {
            id: "chat-23",
            name: "Weekend Plans",
            lastMessage: "Movie night sounds perfect!",
            updatedAt: "2025-09-25T21:30:00Z",
        },
        {
            id: "chat-24",
            name: "Research Notes",
            lastMessage: "I’ll send over the references later.",
            updatedAt: "2025-09-24T13:10:00Z",
        },
        {
            id: "chat-25",
            name: "Birthday Party",
            lastMessage: "Don’t forget the cake 🎂",
            updatedAt: "2025-09-23T20:00:00Z",
        },
        {
            id: "chat-26",
            name: "Coding Buddies",
            lastMessage: "Try refactoring the component.",
            updatedAt: "2025-09-22T18:15:00Z",
        },
        {
            id: "chat-27",
            name: "Gaming Squad",
            lastMessage: "Lobby at 9 PM sharp!",
            updatedAt: "2025-09-21T22:45:00Z",
        },
        {
            id: "chat-28",
            name: "Office Banter",
            lastMessage: "That meme was hilarious 😂",
            updatedAt: "2025-09-20T11:00:00Z",
        },
        {
            id: "chat-29",
            name: "Music Sharing",
            lastMessage: "Check out this new playlist.",
            updatedAt: "2025-09-19T15:25:00Z",
        },
        {
            id: "chat-30",
            name: "Family Group",
            lastMessage: "Dinner at 8 tonight!",
            updatedAt: "2025-09-18T19:00:00Z",
        },
    ];

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        {/* Navigation Links */}
                        <SidebarMenu>
                            {links.map(({ href, icon: Icon, label }, key) => (
                                <SidebarMenuItem key={key}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href={href}
                                            className={`px-2 py-1 rounded ${pathname === href
                                                ? "bg-gray-300 font-semibold"
                                                : "hover:bg-gray-200"
                                                }`}
                                        >
                                            <Icon className="h-4 w-4" /> {label}
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
                                    <SidebarMenu>
                                        {chatTabs.map((chat) => (
                                            <SidebarMenuItem key={chat.id}>
                                                <SidebarMenuButton asChild>
                                                    <Link
                                                        href={`/chat/${chat.id}`}
                                                        className={`flex flex-col items-start px-2 py-2 rounded ${pathname === `/chat/${chat.id}`
                                                            ? "bg-gray-300 font-semibold"
                                                            : "hover:bg-gray-200"
                                                            }`}
                                                    >
                                                        <span>{chat.name}</span>
                                                        <span className="text-xs text-gray-500 truncate">
                                                            {chat.lastMessage}
                                                        </span>
                                                    </Link>
                                                </SidebarMenuButton>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <SidebarMenuAction>
                                                            <MoreHorizontal />
                                                        </SidebarMenuAction>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent side="right" align="start">
                                                        <DropdownMenuItem>
                                                            <span>Clear</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
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
                                <SidebarMenuButton>
                                    <User2 /> Anonymous
                                    <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-[--radix-popper-anchor-width]"
                            >
                                <DropdownMenuItem>
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <span>Billing</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={signOut}>
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <span>Create Account</span>
                                </DropdownMenuItem>

                            </DropdownMenuContent>
                        </DropdownMenu>

                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
